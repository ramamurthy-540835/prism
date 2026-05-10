export type Persona = {
  id: string;
  name: string;
  role: string;
  allowedModels: string[];
  tokenBudget: number;
  canCreatePrompts: boolean;
  canDeletePrompts: boolean;
  canViewCosts: boolean;
};

export const PERSONAS: Persona[] = [
  {
    id: "developer",
    name: "Developer",
    role: "developer",
    allowedModels: ["gpt-4o-mini", "claude-sonnet-4-6", "gemini-2.5-flash", "gemini-2.0-flash"],
    tokenBudget: 50000,
    canCreatePrompts: true,
    canDeletePrompts: false,
    canViewCosts: false,
  },
  {
    id: "architect",
    name: "Architect",
    role: "architect",
    allowedModels: ["gpt-4o", "gpt-4o-mini", "claude-sonnet-4-6", "gemini-2.5-flash", "gemini-2.0-flash"],
    tokenBudget: 100000,
    canCreatePrompts: true,
    canDeletePrompts: false,
    canViewCosts: true,
  },
  {
    id: "tester",
    name: "Tester",
    role: "tester",
    allowedModels: ["gpt-4o-mini", "gemini-2.5-flash", "gemini-2.0-flash"],
    tokenBudget: 30000,
    canCreatePrompts: false,
    canDeletePrompts: false,
    canViewCosts: false,
  },
  {
    id: "qa",
    name: "QA",
    role: "qa",
    allowedModels: ["gpt-4o-mini", "gemini-2.5-flash", "gemini-2.0-flash"],
    tokenBudget: 30000,
    canCreatePrompts: false,
    canDeletePrompts: false,
    canViewCosts: false,
  },
  {
    id: "businessanalyst",
    name: "BusinessAnalyst",
    role: "businessanalyst",
    allowedModels: ["gpt-4o-mini", "claude-sonnet-4-6", "gemini-2.5-flash"],
    tokenBudget: 40000,
    canCreatePrompts: true,
    canDeletePrompts: false,
    canViewCosts: false,
  },
  {
    id: "aiengineer",
    name: "AIEngineer",
    role: "aiengineer",
    allowedModels: ["gpt-4o", "gpt-4o-mini", "claude-sonnet-4-6", "gemini-2.5-flash", "gemini-2.0-flash"],
    tokenBudget: 150000,
    canCreatePrompts: true,
    canDeletePrompts: true,
    canViewCosts: true,
  },
  {
    id: "mentor",
    name: "Mentor",
    role: "mentor",
    allowedModels: ["gpt-4o", "claude-sonnet-4-6", "gemini-2.5-flash"],
    tokenBudget: 80000,
    canCreatePrompts: true,
    canDeletePrompts: false,
    canViewCosts: false,
  },
  {
    id: "student",
    name: "Student",
    role: "student",
    allowedModels: ["gpt-4o-mini", "gemini-2.0-flash"],
    tokenBudget: 10000,
    canCreatePrompts: false,
    canDeletePrompts: false,
    canViewCosts: false,
  },
  {
    id: "viewer",
    name: "Viewer",
    role: "viewer",
    allowedModels: ["gemini-2.0-flash"],
    tokenBudget: 5000,
    canCreatePrompts: false,
    canDeletePrompts: false,
    canViewCosts: false,
  },
  {
    id: "admin",
    name: "Admin",
    role: "admin",
    allowedModels: ["gpt-4o", "gpt-4o-mini", "claude-sonnet-4-6", "gemini-2.5-flash", "gemini-2.0-flash"],
    tokenBudget: 500000,
    canCreatePrompts: true,
    canDeletePrompts: true,
    canViewCosts: true,
  },
];
