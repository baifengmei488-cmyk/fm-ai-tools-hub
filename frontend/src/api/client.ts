export type Guide = {
  id: number;
  title: string;
  guide_type: string;
  visibility: string;
  content_markdown: string;
};

export type Taxonomy = {
  id: number;
  name: string;
  slug: string;
};

export type Tool = {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  summary: string;
  homepage_url: string;
  install_command: string;
  verify_command: string;
  visibility: string;
  is_skill_candidate: boolean;
  is_runbook_candidate: boolean;
  categories: Taxonomy[];
  tags: Taxonomy[];
  guides: Guide[];
};

export type ToolReference = {
  name: string;
  slug: string;
  type: string;
};

export type HomeHighlight = {
  title: string;
  description: string;
  tools: ToolReference[];
};

export type WorkflowItem = {
  title: string;
  flow: string;
  prompt: string;
  tools: ToolReference[];
};

export type PromptGroup = {
  title: string;
  description: string;
  tools: ToolReference[];
  prompts: string[];
};

export type CommandGroup = {
  title: string;
  tools: ToolReference[];
  commands: string[];
  note: string;
};

export type GuideChoice = {
  need: string;
  tools: ToolReference[];
};

export type GuideWorkflowTip = {
  scenario: string;
  tools: ToolReference[];
  suggestion: string;
};

export type PageContent = {
  home_highlights: HomeHighlight[];
  workflows: WorkflowItem[];
  tool_combinations: WorkflowItem[];
  prompt_groups: PromptGroup[];
  command_groups: CommandGroup[];
  guide_choices: GuideChoice[];
  guide_workflow_tips: GuideWorkflowTip[];
  guide_safety_notes: string[];
};

export type UpdateLogSource = {
  title: string;
  url: string;
  source_type: string;
  checked_at: string;
  note: string;
};

export type UpdateLogContentPlanItem = {
  page_path: string;
  page_name: string;
  section: string;
  required_content: string[];
  tool_slugs: string[];
  status: string;
};

export type UpdateLogChangeDetail = {
  tool_slug: string;
  tool_name: string;
  page_path: string;
  section: string;
  field: string;
  change_type: string;
  before: string;
  after: string;
  source_titles: string[];
};

export type UpdateLogChange = {
  title: string;
  change_type: string;
  description: string;
  tool_slugs: string[];
  page_paths: string[];
  added_tool_slugs: string[];
  updated_tool_slugs: string[];
  deleted_tool_slugs: string[];
  change_details: UpdateLogChangeDetail[];
};

export type UpdateLogTool = {
  name: string;
  slug: string;
  type: string;
  status: string;
};

export type UpdateLogValidation = {
  status: string;
  message: string;
  sensitive_findings_count: number;
};

export type UpdateLogEntry = {
  id: number;
  source: string;
  status: string;
  summary: string;
  update_time: string;
  generated_at: string;
  content_plan: UpdateLogContentPlanItem[];
  sources: UpdateLogSource[];
  changes: UpdateLogChange[];
  execution_report: string[];
  affected_tools: UpdateLogTool[];
  guide_count: number;
  validation: UpdateLogValidation;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000';

export function getStoredToken(): string {
  return window.localStorage.getItem('toolvault_token') ?? '';
}

export function storeToken(token: string) {
  window.localStorage.setItem('toolvault_token', token);
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiPost<LoginResponse>('/api/auth/login', { username, password });
}
