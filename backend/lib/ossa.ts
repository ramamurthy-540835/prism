import {env} from "./env";
import {queryBigQuery} from "./bigquery";
import {activeWhereClause, getActiveColumn} from "./schema";

export type OssaGuardInput = {
  orgId: string;
  userId: string;
  estimatedTokens: number;
  estimatedCostUsd: number;
};

export type OssaGuardResult = {
  decision: "allow" | "warn" | "stop";
  reason: string;
  budgetUsedPct: number;
  tokenUsedPct: number;
};

export async function ossaGuard(input: OssaGuardInput): Promise<OssaGuardResult> {
  const activeCol = await getActiveColumn(env.budgetsTable);
  const budgetCols = await queryBigQuery<{ column_name: string }>(`
    SELECT column_name
    FROM \`${env.projectId}.${env.dataset}.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name = @tableName
  `, { tableName: env.budgetsTable });
  const budgetSet = new Set(budgetCols.map((c) => c.column_name));
  const pickExisting = (set: Set<string>, candidates: string[], label: string) => {
    const found = candidates.find((c) => set.has(c));
    if (!found) throw new Error(`Missing expected ${label} column. Found: ${Array.from(set).join(", ")}`);
    return found;
  };
  const budgetOrgCol = pickExisting(budgetSet, ["org_id", "orgId"], "budget org");
  const budgetUserCol = pickExisting(budgetSet, ["user_id", "userId"], "budget user");
  const budgetUsdCol = pickExisting(
    budgetSet,
    ["monthly_budget_usd", "monthlyBudgetUsd", "budget_usd", "budgetUsd", "monthlySpendLimitUsd", "dailySpendLimitUsd"],
    "budget usd"
  );
  const budgetTokenCol = pickExisting(budgetSet, ["monthly_token_limit", "monthlyTokenLimit", "token_limit", "tokenLimit"], "budget tokens");
  const budgetAlertCol = budgetSet.has("alertThresholdPct") ? "alertThresholdPct" : null;
  const budgetHardStopCol = budgetSet.has("hardStop") ? "hardStop" : null;

  const budgetSql = `
    SELECT
      ${budgetOrgCol} AS org_id,
      ${budgetUserCol} AS user_id,
      ${budgetUsdCol} AS monthly_budget_usd,
      ${budgetTokenCol} AS monthly_token_limit
      ${budgetAlertCol ? `, ${budgetAlertCol} AS alert_threshold_pct` : ""}
      ${budgetHardStopCol ? `, ${budgetHardStopCol} AS hard_stop` : ""}
    FROM \`${env.projectId}.${env.dataset}.${env.budgetsTable}\`
    WHERE 1=1 ${activeWhereClause(activeCol)} AND (${budgetOrgCol} = @orgId OR ${budgetUserCol} = @userId)
    ORDER BY CASE WHEN ${budgetUserCol} = @userId THEN 0 ELSE 1 END
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
  const usageTokenCol = pickExisting(usageSet, ["total_tokens", "totalTokens"], "usage total tokens");
  const usageCostCol = pickExisting(usageSet, ["actual_cost_usd", "actualCostUsd", "estimated_cost_usd", "estimatedCostUsd"], "usage cost");

  const usageSql = `
    SELECT
      COALESCE(SUM(CAST(${usageTokenCol} AS FLOAT64)), 0) AS used_tokens,
      COALESCE(SUM(CAST(${usageCostCol} AS FLOAT64)), 0) AS used_cost_usd
    FROM \`${env.projectId}.${env.dataset}.${env.usageTable}\`
    WHERE ${usageOrgCol} = @orgId
      AND ${usageStatusCol} != 'blocked'
      AND TIMESTAMP_TRUNC(TIMESTAMP(${usageTsCol}), MONTH) = TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), MONTH)
  `;

  const [budget] = await queryBigQuery<any>(budgetSql, { orgId: input.orgId, userId: input.userId });
  const [usage] = await queryBigQuery<any>(usageSql, { orgId: input.orgId });

  const monthlyBudgetUsd = Number(budget?.monthly_budget_usd ?? 0);
  const monthlyTokenLimit = Number(budget?.monthly_token_limit ?? 0);
  const usedCost = Number(usage?.used_cost_usd ?? 0) + input.estimatedCostUsd;
  const usedTokens = Number(usage?.used_tokens ?? 0) + input.estimatedTokens;

  const budgetUsedPct = monthlyBudgetUsd > 0 ? (usedCost / monthlyBudgetUsd) * 100 : 0;
  const tokenUsedPct = monthlyTokenLimit > 0 ? (usedTokens / monthlyTokenLimit) * 100 : 0;
  const maxPct = Math.max(budgetUsedPct, tokenUsedPct);
  const warnThreshold = Number(budget?.alert_threshold_pct ?? 70);
  const stopThreshold = budget?.hard_stop === false ? 100 : 95;

  if (maxPct >= stopThreshold) return { decision: "stop", reason: "OSSA hard-stop threshold reached", budgetUsedPct, tokenUsedPct };
  if (maxPct >= warnThreshold) return { decision: "warn", reason: "OSSA warning threshold reached", budgetUsedPct, tokenUsedPct };
  return { decision: "allow", reason: "Within OSSA limits", budgetUsedPct, tokenUsedPct };
}
