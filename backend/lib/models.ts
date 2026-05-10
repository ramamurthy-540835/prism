import {VertexAI} from "@google-cloud/vertexai";
import {env} from "./env";
import {queryBigQuery} from "./bigquery";
import {getActiveColumn, activeWhereClause} from "./schema";

type CallModelInput = {
  provider: string;
  modelId: string;
  systemPrompt?: string;
  userMessage: string;
  maxTokens: number;
  costPerInputToken?: number;
  costPerOutputToken?: number;
};

function estimateTokens(text: string): number { return Math.max(1, Math.ceil(text.length / 4)); }

export async function callModel(input: CallModelInput) {
  const startedAt = Date.now();
  const inputText = `${input.systemPrompt ?? ""}\n${input.userMessage}`;
  const estimatedInput = estimateTokens(inputText);

  try {
    if (input.provider === "vertex") {
      const vertex = new VertexAI({ project: env.projectId, location: env.vertexLocation });
      const model = vertex.getGenerativeModel({ model: input.modelId });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: input.userMessage }] }],
        systemInstruction: input.systemPrompt ? { role: "system", parts: [{ text: input.systemPrompt }] } : undefined,
        generationConfig: { maxOutputTokens: input.maxTokens },
      });
      const responseText = result.response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ?? "";
      const outputTokens = Number(result.response?.usageMetadata?.candidatesTokenCount ?? estimateTokens(responseText));
      const inputTokens = Number(result.response?.usageMetadata?.promptTokenCount ?? estimatedInput);
      const totalTokens = inputTokens + outputTokens;
      const estimatedCostUsd = (input.costPerInputToken ?? 0) * inputTokens + (input.costPerOutputToken ?? 0) * outputTokens;
      return { provider: input.provider, modelId: input.modelId, inputTokens, outputTokens, totalTokens, estimatedCostUsd, actualCostUsd: estimatedCostUsd, responseText, latencyMs: Date.now() - startedAt, status: "success", errorCode: null, errorMessage: null };
    }

    if (input.provider === "openai") {
      const resp = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.openaiApiKey}` }, body: JSON.stringify({ model: input.modelId, input: [{ role: "system", content: input.systemPrompt ?? "" }, { role: "user", content: input.userMessage }], max_output_tokens: input.maxTokens }) });
      const json: any = await resp.json();
      if (!resp.ok) throw new Error(json?.error?.message ?? "OpenAI request failed");
      const responseText = json?.output_text ?? "";
      const inputTokens = Number(json?.usage?.input_tokens ?? estimatedInput);
      const outputTokens = Number(json?.usage?.output_tokens ?? estimateTokens(responseText));
      const totalTokens = inputTokens + outputTokens;
      const estimatedCostUsd = (input.costPerInputToken ?? 0) * inputTokens + (input.costPerOutputToken ?? 0) * outputTokens;
      return { provider: input.provider, modelId: input.modelId, inputTokens, outputTokens, totalTokens, estimatedCostUsd, actualCostUsd: estimatedCostUsd, responseText, latencyMs: Date.now() - startedAt, status: "success", errorCode: null, errorMessage: null };
    }

    if (input.provider === "anthropic") {
      const resp = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": env.anthropicApiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: input.modelId, system: input.systemPrompt ?? "", messages: [{ role: "user", content: input.userMessage }], max_tokens: input.maxTokens }) });
      const json: any = await resp.json();
      if (!resp.ok) throw new Error(json?.error?.message ?? "Anthropic request failed");
      const responseText = (json?.content ?? []).map((c: any) => c?.text ?? "").join("\n");
      const inputTokens = Number(json?.usage?.input_tokens ?? estimatedInput);
      const outputTokens = Number(json?.usage?.output_tokens ?? estimateTokens(responseText));
      const totalTokens = inputTokens + outputTokens;
      const estimatedCostUsd = (input.costPerInputToken ?? 0) * inputTokens + (input.costPerOutputToken ?? 0) * outputTokens;
      return { provider: input.provider, modelId: input.modelId, inputTokens, outputTokens, totalTokens, estimatedCostUsd, actualCostUsd: estimatedCostUsd, responseText, latencyMs: Date.now() - startedAt, status: "success", errorCode: null, errorMessage: null };
    }

    throw new Error(`Unsupported provider: ${input.provider}`);
  } catch (error: any) {
    return { provider: input.provider, modelId: input.modelId, inputTokens: estimatedInput, outputTokens: 0, totalTokens: estimatedInput, estimatedCostUsd: 0, actualCostUsd: 0, responseText: "", latencyMs: Date.now() - startedAt, status: "error", errorCode: "MODEL_CALL_ERROR", errorMessage: String(error?.message ?? error) };
  }
}

export async function resolveModel({ planId, taskType, requestedModelId }: {
  planId: string;
  taskType: string;
  requestedModelId?: string;
}): Promise<{ provider: string; modelId: string; maxTokens: number }> {
  const activeCol = await getActiveColumn(env.routingTable);
  const rows = await queryBigQuery<any>(`
    SELECT * FROM \`${env.projectId}.${env.dataset}.${env.routingTable}\`
    WHERE planId = @planId AND taskType = @taskType ${activeWhereClause(activeCol)}
    LIMIT 1
  `, { planId, taskType });

  if (!rows[0]) {
    return { provider: "vertex", modelId: "gemini-2.5-flash", maxTokens: 2048 };
  }

  const rule = rows[0];
  const primaryModelId: string = rule.primaryModelId ?? rule.modelId ?? "gemini-2.5-flash";
  const primaryProvider: string = rule.provider ?? "vertex";
  const maxTokens = Number(rule.maxTokensPerCall ?? 2048);

  if (requestedModelId) {
    let allowed: string[] = [primaryModelId];
    if (rule.fallbackModelId) allowed.push(String(rule.fallbackModelId));
    if (rule.allowedModels) {
      try {
        const parsed = typeof rule.allowedModels === "string" ? JSON.parse(rule.allowedModels) : rule.allowedModels;
        if (Array.isArray(parsed)) allowed = parsed;
      } catch { /* ignore */ }
    }
    if (allowed.includes(requestedModelId)) {
      return { provider: primaryProvider, modelId: requestedModelId, maxTokens };
    }
  }

  return { provider: primaryProvider, modelId: primaryModelId, maxTokens };
}