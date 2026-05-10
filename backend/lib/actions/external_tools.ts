import { spawn } from "child_process";

function runPython(args: string[], cwd: string) {
  return new Promise<{ ok: boolean; stdout: string; stderr: string; code: number | null }>((resolve) => {
    const p = spawn("python", args, { cwd, shell: true });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += String(d)));
    p.stderr.on("data", (d) => (stderr += String(d)));
    p.on("close", (code) => resolve({ ok: code === 0, stdout, stderr, code }));
  });
}

export async function diagramGenerate(input: { prompt: string }) {
  const script = "diaascode_langchain_prompt_architecture_colored.py";
  const cwd = "diagram_as_code";
  const res = await runPython([script], cwd);
  return {
    action: "diagram_generate",
    ok: res.ok,
    output: res.stdout.slice(0, 4000),
    error: res.stderr.slice(0, 4000),
    message: res.ok ? "Diagram script executed" : "Diagram script failed",
    hint: input.prompt,
  };
}

export async function gitAutomate(input: { repo_url: string; github_token?: string }) {
  const script = "-c";
  const code = `from orchestrator.langgraph_workflow import run_workflow;import json;state={'repo_url':'${(input.repo_url||"").replace(/'/g,"\\'")}', 'github_token':'${(input.github_token||"").replace(/'/g,"\\'")}' };print(json.dumps(run_workflow(state), default=str))`;
  const cwd = "git-developer";
  const res = await runPython([script, code], cwd);
  return {
    action: "git_automate",
    ok: res.ok,
    output: res.stdout.slice(0, 8000),
    error: res.stderr.slice(0, 4000),
    message: res.ok ? "Git workflow executed" : "Git workflow failed",
  };
}
