import {env} from "./env";
import {queryBigQuery} from "./bigquery";

export async function getActiveColumn(tableName: string): Promise<string | null> {
  const rows = await queryBigQuery<{ column_name: string }>(`
    SELECT column_name
    FROM \`${env.projectId}.${env.dataset}.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name = @tableName AND column_name IN ('active', 'isActive')
  `, { tableName });

  if (rows.some((r) => r.column_name === "active")) return "active";
  if (rows.some((r) => r.column_name === "isActive")) return "isActive";
  return null;
}

export function activeWhereClause(activeColumn: string | null): string {
  return activeColumn ? `AND ${activeColumn} = TRUE` : "";
}