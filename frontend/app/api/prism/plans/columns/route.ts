import { NextResponse } from "next/server";
import { queryBigQuery } from "@backend/lib/bigquery";

export async function GET() {
  try {
    const rows = await queryBigQuery(`
      SELECT column_name, data_type
      FROM \`ctoteam.prism\`.INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = 'prism_plans'
      ORDER BY ordinal_position
    `);
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: String((e as any)?.message ?? e) }, { status: 500 });
  }
}
