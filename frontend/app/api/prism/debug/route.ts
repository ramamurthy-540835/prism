import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT ?? "NOT SET",
    BQ_DATASET: process.env.BQ_DATASET ?? "NOT SET",
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "NOT SET",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? "SET" : "NOT SET",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "SET" : "NOT SET",
    nodeEnv: process.env.NODE_ENV,
  };

  let bqTest = "NOT TESTED";
  try {
    const { BigQuery } = await import("@google-cloud/bigquery");
    const bq = new BigQuery({ projectId: process.env.GOOGLE_CLOUD_PROJECT || "ctoteam" });
    const [rows] = await bq.query({
      query: "SELECT COUNT(*) as cnt FROM `ctoteam.prism.prism_prompt_types`",
      location: "US"
    });
    bqTest = "OK — prism_prompt_types has " + (rows[0] as any).cnt + " rows";
  } catch (e: any) {
    bqTest = "ERROR: " + e.message;
  }

  return NextResponse.json({ checks, bqTest });
}
