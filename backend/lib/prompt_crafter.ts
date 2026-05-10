export function craftSystemPrompt(input: { useCase: string; role: string; theme: string }) {
  const role = input.role?.trim() || "developer";
  const useCase = input.useCase?.trim() || "general engineering task";
  const theme = input.theme?.trim() || "software engineering";

  return `You are a ${role} assistant focused on ${theme}. Primary task: ${useCase}. Always return concise, production-ready output. Output format: JSON with keys summary, steps, risks, and next_actions. Keep tone professional and direct. Keep response under 250 words unless explicitly asked otherwise. Optimize for Gemini 2.5 Flash by using clear structure, low ambiguity, and explicit constraints.`;
}
