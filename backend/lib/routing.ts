import {env} from "./env";
import {queryBigQuery} from "./bigquery";
import {activeWhereClause, getActiveColumn} from "./schema";

export async function getRoute({ orgId, planId, taskType }: { orgId: string; planId: string; taskType: string }) {
  const activeCol = await getActiveColumn(env.routingTable);
  const cols = await queryBigQuery<{ column_name: string }>(`
    SELECT column_name
    FROM \`${env.projectId}.${env.dataset}.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name = @tableName
  `, { tableName: env.routingTable });
  const colSet = new Set(cols.map((c) => c.column_name));
  const pickExisting = (set: Set<string>, candidates: string[], label: string) => {
    const found = candidates.find((c) => set.has(c));
    if (!found) throw new Error(`Missing expected ${label} column. Found: ${Array.from(set).join(", ")}`);
    return found;
  };
  const planCol = pickExisting(colSet, ["plan_id", "planId"], "routing plan");
  const taskCol = pickExisting(colSet, ["task_type", "taskType"], "routing task");
  const updatedCol = colSet.has("updated_at")
    ? "updated_at"
    : colSet.has("updatedAt")
      ? "updatedAt"
      : colSet.has("created_at")
        ? "created_at"
        : colSet.has("createdAt")
          ? "createdAt"
          : null;

  const routingSql = `
    SELECT *
    FROM \`${env.projectId}.${env.dataset}.${env.routingTable}\`
    WHERE 1=1 ${activeWhereClause(activeCol)} AND ${planCol} = @planId AND ${taskCol} = @taskType
    ${updatedCol ? `ORDER BY ${updatedCol} DESC` : ""}
    LIMIT 1
  `;
  const usageCols = await queryBigQuery<{ column_name: string }>(`
    SELECT column_name
    FROM \`${env.projectId}.${env.dataset}.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name = @tableName
  `, { tableName: env.usageTable });
  const usageSet = new Set(usageCols.map((c) => c.column_name));
  const usageOrgCol = pickExisting(usageSet, ["org_id", "orgId"], "usage org");
  const usageStatusCol = pickExisting(usageSet, ["status"], "usage status");
  const usageTsCol = pickExisting(usageSet, ["event_ts", "eventTs", "created_at", "createdAt"], "usage timestamp");
  const usageCostCol = pickExisting(usageSet, ["actual_cost_usd", "actualCostUsd", "estimated_cost_usd", "estimatedCostUsd"], "usage cost");

  const spendSql = `
    SELECT COALESCE(SUM(CAST(${usageCostCol} AS FLOAT64)), 0) AS monthly_spend
    FROM \`${env.projectId}.${env.dataset}.${env.usageTable}\`
    WHERE ${usageOrgCol} = @orgId
      AND ${usageStatusCol} != 'blocked'
      AND TIMESTAMP_TRUNC(TIMESTAMP(${usageTsCol}), MONTH) = TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), MONTH)
  `;

  const [route] = await queryBigQuery<any>(routingSql, { planId, taskType });
  if (!route) throw new Error(`No active routing found for planId=${planId}, taskType=${taskType}`);

  const [spend] = await queryBigQuery<any>(spendSql, { orgId });
  const getField = (obj: any, a: string, b: string, d: any = null) => obj?.[a] ?? obj?.[b] ?? d;
  const monthlySpend = Number(spend?.monthly_spend ?? 0);
  const monthlyLimit = Number(getField(route, "monthly_spend_limit_usd", "monthlySpendLimitUsd", 0));
  const thresholdPct = Number(getField(route, "budget_threshold_pct", "budgetThresholdPct", 70));
  const budgetUsedPct = monthlyLimit > 0 ? (monthlySpend / monthlyLimit) * 100 : 0;

  let routingDecision: "primary" | "fallback" | "blocked" = "primary";
  let reason = "Primary route selected";
  let provider = String(getField(route, "provider", "provider", ""));
  let modelId = String(getField(route, "model_id", "modelId", ""));

  if (monthlyLimit > 0 && monthlySpend >= monthlyLimit) {
    routingDecision = "blocked";
    reason = "Monthly spend limit reached";
  } else if (budgetUsedPct >= thresholdPct && (getField(route, "fallback_provider", "fallbackProvider") && getField(route, "fallback_model_id", "fallbackModelId"))) {
    routingDecision = "fallback";
    reason = `Budget threshold exceeded (${thresholdPct}%)`;
    provider = String(getField(route, "fallback_provider", "fallbackProvider"));
    modelId = String(getField(route, "fallback_model_id", "fallbackModelId"));
  }

  return {
    provider,
    modelId,
    fallbackProvider: getField(route, "fallback_provider", "fallbackProvider"),
    fallbackModelId: getField(route, "fallback_model_id", "fallbackModelId"),
    maxTokensPerCall: Number(getField(route, "max_tokens_per_call", "maxTokensPerCall", 2048)),
    costPerInputToken: Number(getField(route, "cost_per_input_token", "costPerInputToken", 0)),
    costPerOutputToken: Number(getField(route, "cost_per_output_token", "costPerOutputToken", 0)),
    routingDecision,
    reason,
    budgetUsedPct,
  };
}
