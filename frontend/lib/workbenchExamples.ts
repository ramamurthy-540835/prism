export type WorkbenchExample = {
  id: string;
  label: string;
  icon: string;
  persona: string;
  taskType: string;
  promptTypeId: string;
  promptTypeName: string;
  userMessage: string;
  maxTokens: number;
  model: string;
  provider: string;
};

export const WORKBENCH_EXAMPLES: WorkbenchExample[] = [
  {
    id: "ex001",
    label: "Code Review - TypeScript",
    icon: "Code2",
    persona: "Developer",
    taskType: "code_review",
    promptTypeId: "PT009",
    promptTypeName: "Chain-of-Verification",
    userMessage: "Review this TypeScript function and identify issues: async function fetchUserData(userId: string) { const response = await fetch('/api/users/' + userId); const data = response.json(); return data.user; } Check for: error handling, type safety, async/await correctness, security.",
    maxTokens: 1024,
    model: "claude-sonnet-4-6",
    provider: "anthropic"
  },
  {
    id: "ex002",
    label: "Architecture - Microservices Design",
    icon: "Network",
    persona: "Architect",
    taskType: "architecture_design",
    promptTypeId: "PT006",
    promptTypeName: "Tree-of-Thoughts",
    userMessage: "Design a microservices architecture for an e-commerce platform. Requirements: User service, Product catalog, Order management, Payment processing. Must handle 10,000 concurrent users. High availability 99.9% uptime SLA. GCP deployment. Provide: service diagram, communication patterns, data stores per service.",
    maxTokens: 2048,
    model: "gemini-2.5-flash",
    provider: "google"
  },
  {
    id: "ex003",
    label: "Test Generation - REST API",
    icon: "TestTube2",
    persona: "Tester",
    taskType: "test_generation",
    promptTypeId: "PT021",
    promptTypeName: "Structured Chain-of-Thought",
    userMessage: "Generate comprehensive test cases for REST API. POST /api/prism/router with { userId, persona, taskType, userMessage, modelId, maxTokens }. Generate: Happy path tests, Validation error tests, Edge cases (empty strings, long inputs, special characters), Security tests (injection, oversized payloads). Use Jest + supertest format.",
    maxTokens: 2048,
    model: "claude-sonnet-4-6",
    provider: "anthropic"
  },
  {
    id: "ex004",
    label: "Gap Analysis - AI Governance",
    icon: "ClipboardCheck",
    persona: "QA",
    taskType: "gap_analysis",
    promptTypeId: "PT023",
    promptTypeName: "Logical Chain-of-Thought",
    userMessage: "Perform a gap analysis for AI governance. Current state: Teams use ChatGPT, Claude, and Gemini independently. No spend tracking or token budgets. No prompt versioning. No audit trail. Target state: OSSA governed AI usage across all teams. Full BigQuery audit logging. Role-based model access. Prompt library with version control. Identify gaps, risks, and remediation steps.",
    maxTokens: 1024,
    model: "gemini-2.5-flash",
    provider: "google"
  },
  {
    id: "ex005",
    label: "Requirements - User Story Writing",
    icon: "FileText",
    persona: "Business Analyst",
    taskType: "requirements_analysis",
    promptTypeId: "PT008",
    promptTypeName: "Skeleton-of-Thought",
    userMessage: "Write user stories for PRISM Prompt Library feature. Feature: Users can browse, search, filter, and publish prompts. Roles: Developer, AI Engineer, Admin. For each story provide: As a [role] I want [feature] so that [benefit]. Acceptance criteria (Given/When/Then). Story points estimate. Cover: browsing, searching, filtering by category, viewing details, publishing, version history.",
    maxTokens: 1024,
    model: "claude-sonnet-4-6",
    provider: "anthropic"
  },
  {
    id: "ex006",
    label: "RAG Pipeline - Design",
    icon: "Bot",
    persona: "AI Engineer",
    taskType: "code_generation",
    promptTypeId: "PT016",
    promptTypeName: "RAG",
    userMessage: "Design and implement a RAG pipeline for PRISM knowledge base. Requirements: Index BigQuery tables (prism_prompts, prism_prompt_types, prism_plans). Embedding model: text-embedding-004. Vector store: BigQuery Vector Search. Retrieval: top-5 relevant chunks. Generation: Gemini 2.5 Flash. Provide: Architecture diagram, Python indexing pipeline, Query pipeline code, Integration with PRISM router API.",
    maxTokens: 2048,
    model: "gemini-2.5-flash",
    provider: "google"
  },
  {
    id: "ex007",
    label: "Learning - Explain Chain-of-Thought",
    icon: "GraduationCap",
    persona: "Student",
    taskType: "learning_explanation",
    promptTypeId: "PT002",
    promptTypeName: "Chain-of-Thought",
    userMessage: "Explain Chain-of-Thought prompting to me as a beginner. I know basic Python and have used ChatGPT before but I am new to prompt engineering. Please explain: What is Chain-of-Thought and why it works. When to use it vs Zero-Shot. A simple before/after example. How PRISM uses it in the workbench. Use simple language and short examples.",
    maxTokens: 1024,
    model: "gemini-2.5-flash",
    provider: "google"
  },
  {
    id: "ex008",
    label: "Mentoring - Code Best Practices",
    icon: "BookOpen",
    persona: "Mentor",
    taskType: "mentoring",
    promptTypeId: "PT025",
    promptTypeName: "Emotion Prompting",
    userMessage: "A junior developer wrote code that keeps breaking in production. Help me give constructive feedback: function processOrders(orders) { let result = []; for(var i = 0; i <= orders.length; i++) { if(orders[i].status == 'pending') { result.push(orders[i]); db.save(result); } } return result; } Give feedback that is: Encouraging, not discouraging. Explains WHY each issue is a problem. Shows corrected code with comments. Suggests what to learn next.",
    maxTokens: 1024,
    model: "claude-sonnet-4-6",
    provider: "anthropic"
  }
];
