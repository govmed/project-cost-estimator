/**
 * CommentThread - annotation thread for any entity.
 *
 * Used in the defensibility drawer (right rail) and anywhere a
 * "comments" tab appears. Fetches and posts via the API in OIDC mode;
 * shows a "not available in standalone mode" stub otherwise.
 */

import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL, AUTH_MODE } from '@/auth/oidc-config';

interface Comment {
  id: string;
  body: string;
  author_name: string | null;
  author_email: string | null;
  created_at: string;
  updated_at: string;
}

function getToken(): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).__sowCalcToken ?? null;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.headers as Record<string, string>),
      },
    });
    if (!res.ok) return null;
    if (res.status === 204) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export function CommentThread({
  projectId,
  entityType,
  entityId,
}: {
  projectId: string;
  entityType: string;
  entityId: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (AUTH_MODE !== 'oidc') return;
    setLoading(true);
    const params = new URLSearchParams({ entity_type: entityType, entity_id: entityId });
    apiFetch<Comment[]>(`/projects/${projectId}/comments?${params}`)
      .then((c) => setComments(c ?? []))
      .finally(() => setLoading(false));
  }, [projectId, entityType, entityId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  if (AUTH_MODE !== 'oidc') {
    return (
      <div className="px-4 py-6 text-center text-xs text-muted-fg">
        Comments are available in OIDC mode.
      </div>
    );
  }

  async function post() {
    if (!body.trim()) return;
    setPosting(true);
    const result = await apiFetch<Comment>(`/projects/${projectId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ entity_type: entityType, entity_id: entityId, body: body.trim() }),
    });
    if (result) {
      setComments((c) => [...c, result]);
      setBody('');
    }
    setPosting(false);
  }

  async function remove(id: string) {
    await apiFetch(`/projects/${projectId}/comments/${id}`, { method: 'DELETE' });
    setComments((c) => c.filter((x) => x.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      {loading && (
        <div className="text-xs text-muted-fg">Loading comments…</div>
      )}

      {!loading && comments.length === 0 && (
        <div className="text-xs text-muted-fg">No comments yet. Add the first one below.</div>
      )}

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.id} className="rounded border border-border bg-muted/20 p-3 text-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-medium text-foreground">
                {c.author_name ?? c.author_email ?? 'Unknown'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-fg">
                  {new Date(c.created_at).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="text-[10px] text-muted-fg hover:text-status-bad focus:outline-none"
                  aria-label="Delete comment"
                >
                  ✕
                </button>
              </div>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{c.body}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 items-end pt-2 border-t border-border">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void post();
          }}
          placeholder="Add a comment… (Ctrl+Enter to post)"
          rows={2}
          className="flex-1 resize-none rounded border border-border bg-background px-2 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={() => void post()}
          disabled={!body.trim() || posting}
          className="rounded bg-accent px-3 py-1.5 text-xs text-accent-fg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {posting ? '…' : 'Post'}
        </button>
      </div>
    </div>
  );
}
