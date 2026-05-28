/**
 * Storage - the persistence seam.
 *
 * Phase 1 ships LocalStorageProvider. Phase 2 swaps in a BackendApiProvider.
 * Component code only ever depends on this interface, never on the concrete
 * implementation.
 *
 * Design notes:
 *  - All methods are async even though localStorage is sync. Forces consumers
 *    to write code that survives the Phase 2 swap.
 *  - ProjectSummary is the lightweight shape returned from list(); fetching
 *    the full Project requires a load() call. Mirrors what a REST API would
 *    look like.
 */

import type { Project } from '@/types/project';
import type { ProjectId } from '@/types/ids';

export interface ProjectSummary {
  id: ProjectId;
  name: string;
  client: string;
  version: string;
  status: Project['status'];
  updatedAt: string;
}

export interface Storage {
  load(projectId: ProjectId): Promise<Project | null>;
  save(project: Project): Promise<void>;
  list(): Promise<ProjectSummary[]>;
  delete(projectId: ProjectId): Promise<void>;
}
