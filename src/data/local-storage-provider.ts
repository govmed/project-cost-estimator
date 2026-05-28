/**
 * LocalStorageProvider - Phase 1 persistence.
 *
 * Layout in localStorage:
 *   sow-calc:project:<id>     - full Project JSON
 *   sow-calc:summary:<id>     - ProjectSummary JSON (denormalized for fast list)
 *
 * Audit log lives in its own bucket (separate file, not implemented in M1a).
 */

import type { Storage, ProjectSummary } from './storage';
import type { Project } from '@/types/project';
import type { ProjectId } from '@/types/ids';

const PROJECT_PREFIX = 'sow-calc:project:';
const SUMMARY_PREFIX = 'sow-calc:summary:';

function summaryOf(p: Project): ProjectSummary {
  return {
    id: p.id,
    name: p.name,
    client: p.client,
    version: p.version,
    status: p.status,
    updatedAt: p.updatedAt,
  };
}

export class LocalStorageProvider implements Storage {
  async load(projectId: ProjectId): Promise<Project | null> {
    const raw = localStorage.getItem(PROJECT_PREFIX + projectId);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Project;
    } catch {
      return null;
    }
  }

  async save(project: Project): Promise<void> {
    localStorage.setItem(PROJECT_PREFIX + project.id, JSON.stringify(project));
    localStorage.setItem(
      SUMMARY_PREFIX + project.id,
      JSON.stringify(summaryOf(project)),
    );
  }

  async list(): Promise<ProjectSummary[]> {
    const summaries: ProjectSummary[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SUMMARY_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            summaries.push(JSON.parse(raw) as ProjectSummary);
          } catch {
            // Skip malformed entries silently.
          }
        }
      }
    }
    summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return summaries;
  }

  async delete(projectId: ProjectId): Promise<void> {
    localStorage.removeItem(PROJECT_PREFIX + projectId);
    localStorage.removeItem(SUMMARY_PREFIX + projectId);
  }
}
