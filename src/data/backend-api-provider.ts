/**
 * BackendApiProvider - Phase 2 persistence via the FastAPI backend.
 *
 * Implements the Storage interface backed by the cost-estimator-api.
 * The token getter is injected at construction so the provider is
 * stateless regarding auth — the caller (store.ts) supplies the
 * current access token on every operation.
 *
 * save() also accepts an optional scenarios array (extended signature)
 * so the full project blob is pushed to the server on every mutation.
 */

import type { Storage, ProjectSummary } from './storage';
import type { Project } from '@/types/project';
import type { ProjectId } from '@/types/ids';
import type { Scenario } from '@/types/scenario';
import { apiClient } from './api-client';

export class BackendApiProvider implements Storage {
  constructor(private getToken: () => string | null) {}

  private token(): string {
    const t = this.getToken();
    if (!t) throw new Error('Not authenticated — cannot persist to backend.');
    return t;
  }

  async list(): Promise<ProjectSummary[]> {
    return apiClient.listProjects(this.token());
  }

  async load(projectId: ProjectId): Promise<Project | null> {
    const result = await apiClient.loadProject(this.token(), projectId);
    return result?.project ?? null;
  }

  async loadFull(
    projectId: ProjectId,
  ): Promise<{ project: Project; scenarios: Scenario[] } | null> {
    return apiClient.loadProject(this.token(), projectId);
  }

  async save(project: Project, scenarios: readonly Scenario[] = []): Promise<void> {
    await apiClient.saveProject(this.token(), project, scenarios);
  }

  async delete(projectId: ProjectId): Promise<void> {
    await apiClient.deleteProject(this.token(), projectId);
  }
}
