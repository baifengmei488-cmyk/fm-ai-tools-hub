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

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

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
