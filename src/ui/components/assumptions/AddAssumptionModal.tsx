/**
 * AddAssumptionModal - the form to add a new assumption.
 */

import { useEffect, useRef, useState } from 'react';
import type {
  AssumptionSource,
  AssumptionRiskLevel,
} from '@/types/assumption';
import type { NewAssumptionInput } from '@/data/store';

const SOURCES: AssumptionSource[] = [
  'assumed',
  'validated',
  'clientConfirmed',
  'industryBenchmark',
];

const RISKS: AssumptionRiskLevel[] = ['low', 'medium', 'high'];

export interface AddAssumptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: NewAssumptionInput) => void;
}

export function AddAssumptionModal({ isOpen, onClose, onAdd }: AddAssumptionModalProps) {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<AssumptionSource>('assumed');
  const [riskLevel, setRiskLevel] = useState<AssumptionRiskLevel>('medium');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTopic('');
    setDescription('');
    setSource('assumed');
    setRiskLevel('medium');
    setEvidenceUrl('');
    setTimeout(() => firstInputRef.current?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canSubmit = topic.trim().length > 0 && description.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onAdd({
      topic: topic.trim(),
      description: description.trim(),
      source,
      riskLevel,
      evidenceUrl: evidenceUrl.trim() || undefined,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-assumption-title"
    >
      <div className="w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="add-assumption-title" className="text-lg font-semibold">
            Add Assumption
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-fg hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Topic">
            <input
              ref={firstInputRef}
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Offshore ratio"
              className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Full statement of the assumption"
              rows={3}
              className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Source">
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as AssumptionSource)}
                className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Risk Level">
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as AssumptionRiskLevel)}
                className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {RISKS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Evidence URL (optional)">
            <input
              type="url"
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              placeholder="https://..."
              className="rounded border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded bg-accent px-3 py-1.5 text-sm text-accent-fg disabled:opacity-50"
          >
            Add assumption
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-fg">
        {label}
      </span>
      {children}
    </div>
  );
}
