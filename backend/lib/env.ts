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

function envOrDefault(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() ? value : fallback;
}

export const env: EnvConfig = {
  projectId: envOrDefault("GOOGLE_CLOUD_PROJECT", "aidirac-503309"),
  vertexLocation: envOrDefault("VERTEX_AI_LOCATION", "us-central1"),
  dataset: envOrDefault("BQ_DATASET", "prism"),
  usageTable: envOrDefault("BQ_USAGE_TABLE", "prism_usage"),
  plansTable: envOrDefault("BQ_PLANS_TABLE", "prism_plans"),
  budgetsTable: envOrDefault("BQ_BUDGETS_TABLE", "prism_budgets"),
  routingTable: envOrDefault("BQ_ROUTING_TABLE", "prism_model_routing"),
  // Optional because Vertex AI is the default provider and uses runtime ADC.
  openaiApiKey: envOrDefault("OPENAI_API_KEY", ""),
  anthropicApiKey: envOrDefault("ANTHROPIC_API_KEY", ""),
};
