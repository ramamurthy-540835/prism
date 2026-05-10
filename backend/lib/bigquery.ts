import { BigQuery } from "@google-cloud/bigquery";
import { env } from "./env";

let _bq: BigQuery | null = null;
function getBigQuery() {
  if (!_bq) _bq = new BigQuery({ projectId: process.env.BIGQUERY_PROJECT_ID ?? "ctoteam" });
  return _bq;
}
export { getBigQuery as bigquery };

export async function queryBigQuery<T = Record<string, unknown>>(sql: string, params: Record<string, unknown> = {}): Promise<T[]> {
  try {
    const [rows] = await getBigQuery().query({ query: sql, params, useLegacySql: false, location: "US" });
    return JSON.parse(JSON.stringify(rows)) as T[];
  } catch (e) {
    console.error("[BigQuery] query error:", e);
    throw new Error(String((e as any)?.message ?? e));
  }
}

export async function insertUsage(row: Record<string, unknown>): Promise<void> {
  const cols = await queryBigQuery<{ column_name: string }>(`
    SELECT column_name
    FROM \`${env.projectId}.${env.dataset}.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name = @tableName
  `, { tableName: env.usageTable });
  const colSet = new Set(cols.map((c) => c.column_name));
  const pick = (candidates: string[]) => candidates.find((c) => colSet.has(c));
  const out: Record<string, unknown> = {};

  const mappings: Array<[string[], unknown]> = [
    [["event_ts", "eventTs", "createdAt"], new Date().toISOString()],
    [["user_id", "userId"], row.userId],
    [["user_email", "userEmail"], row.userEmail],
    [["org_id", "orgId"], row.orgId],
    [["plan_id", "planId"], row.planId],
    [["task_type", "taskType"], row.taskType],
    [["provider"], row.provider],
    [["model_id", "modelId"], (row.model_id ?? row.modelId)],
    [["status"], row.status],
    [["reason"], row.reason],
    [["input_tokens", "inputTokens"], (row.input_tokens ?? row.inputTokens)],
    [["output_tokens", "outputTokens"], (row.output_tokens ?? row.outputTokens)],
    [["total_tokens", "totalTokens"], (row.total_tokens ?? row.totalTokens)],
    [["estimated_cost_usd", "estimatedCostUsd"], (row.estimated_cost_usd ?? row.estimatedCostUsd)],
    [["actual_cost_usd", "actualCostUsd"], (row.actual_cost_usd ?? row.actualCostUsd)],
    [["error_code", "errorCode"], (row.error_code ?? row.errorCode)],
    [["error_message", "errorMessage"], (row.error_message ?? row.errorMessage)],
    [["latency_ms", "latencyMs"], (row.latency_ms ?? row.latencyMs)],
    [["session_id", "sessionId"], row.sessionId],
    [["prompt_id", "promptId"], row.promptId],
    [["prompt_version", "promptVersion"], row.promptVersion],
    [["workspace_path", "workspacePath"], row.workspacePath],
    [["environment"], row.environment],
    [["source_app", "sourceApp"], row.sourceApp],
    [["role"], row.role],
    [["persona"], row.persona],
  ];

  for (const [candidates, value] of mappings) {
    const col = pick(candidates);
    if (col && value !== undefined) out[col] = value;
  }

  await getBigQuery().dataset(env.dataset).table(env.usageTable).insert([out]);
}
