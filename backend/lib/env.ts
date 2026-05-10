export type EnvConfig = {
  projectId: string;
  vertexLocation: string;
  dataset: string;
  usageTable: string;
  plansTable: string;
  budgetsTable: string;
  routingTable: string;
  openaiApiKey: string;
  anthropicApiKey: string;
};

function requireEnv(name: string, allowEmpty = false): string {
  const value = process.env[name];
  if (value === undefined || value === null || (!allowEmpty && value.trim() === "")) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env: EnvConfig = {
  projectId: requireEnv("GOOGLE_CLOUD_PROJECT"),
  vertexLocation: requireEnv("VERTEX_AI_LOCATION"),
  dataset: requireEnv("BQ_DATASET"),
  usageTable: requireEnv("BQ_USAGE_TABLE"),
  plansTable: requireEnv("BQ_PLANS_TABLE"),
  budgetsTable: requireEnv("BQ_BUDGETS_TABLE"),
  routingTable: requireEnv("BQ_ROUTING_TABLE"),
  openaiApiKey: requireEnv("OPENAI_API_KEY", true),
  anthropicApiKey: requireEnv("ANTHROPIC_API_KEY", true),
};