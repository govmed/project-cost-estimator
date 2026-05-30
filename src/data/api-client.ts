/**
 * Typed HTTP client for the FastAPI backend.
 *
 * All methods throw on non-2xx responses. The token is injected per-call
 * so the client itself is stateless.
 */

import { API_BASE_URL } from '@/auth/oidc-config';
import type { ProjectId } from '@/types/ids';
import type { Project } from '@/types/project';
import type { Scenario } from '@/types/scenario';
import type { ProjectSummary } from './storage';

interface ApiProjectSummary {
  id: string;
  name: string;
  client: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ApiProjectRead {
  id: string;
  owner_id: string;
  name: string;
  client: string;
  status: string;
  state_json: { project: Project; scenarios: Scenario[] };
  created_at: string;
  updated_at: string;
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiClient = {
  async listProjects(token: string): Promise<ProjectSummary[]> {
    const data = await request<ApiProjectSummary[]>('/projects', { token });
    return data.map((p) => ({
      id: p.id as ProjectId,
      name: p.name,
      client: p.client,
      version: '1.0.0',
      status: p.status as Project['status'],
      updatedAt: p.updated_at,
    }));
  },

  async loadProject(
    token: string,
    projectId: ProjectId,
  ): Promise<{ project: Project; scenarios: Scenario[] } | null> {
    try {
      const data = await request<ApiProjectRead>(`/projects/${projectId}`, { token });
      return data.state_json;
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('404')) return null;
      throw e;
    }
  },

  async saveProject(
    token: string,
    project: Project,
    scenarios: readonly Scenario[],
  ): Promise<void> {
    // Try PUT first (update); if 404 fall back to POST (create)
    try {
      await request(`/projects/${project.id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ project, scenarios: scenarios as Scenario[] }),
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes('404')) {
        await request('/projects', {
          method: 'POST',
          token,
          body: JSON.stringify({ project, scenarios: scenarios as Scenario[] }),
        });
      } else {
        throw e;
      }
    }
  },

  async deleteProject(token: string, projectId: ProjectId): Promise<void> {
    await request(`/projects/${projectId}`, { method: 'DELETE', token });
  },
};
