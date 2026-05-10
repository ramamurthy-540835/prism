import { env } from "./env";
import { queryBigQuery } from "./bigquery";

export async function getPromptTemplate(promptId?: string, promptVersion?: string) {
  if (!promptId) return null;

  const versionFilter = promptVersion ? "AND v.promptVersion = @promptVersion" : "";
  const rows = await queryBigQuery<any>(`
    SELECT p.promptId, p.name, p.taskType, p.status, v.promptVersion, v.systemPrompt
    FROM \`${env.projectId}.${env.dataset}.prism_prompts\` p
    JOIN \`${env.projectId}.${env.dataset}.prism_prompt_versions\` v
      ON p.promptId = v.promptId
    WHERE p.promptId = @promptId
      AND p.status = 'active'
      ${versionFilter}
    ORDER BY v.createdAt DESC
    LIMIT 1
  `, { promptId, promptVersion });

  return rows[0] ?? null;
}
