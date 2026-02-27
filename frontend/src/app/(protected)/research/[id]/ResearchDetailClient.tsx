'use client';

import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types (mirrored from API response)
// ---------------------------------------------------------------------------

interface Annotation {
  id: string;
  content: string;
  highlightedText?: string;
  createdAt: string;
}

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface ResearchItemClientProps {
  item: {
    id: string;
    title: string;
    annotations: Annotation[];
    tags: Tag[];
    status: string;
  };
}

// ---------------------------------------------------------------------------
// Annotations panel
// ---------------------------------------------------------------------------

function AnnotationsPanel({
  itemId,
  initialAnnotations,
}: {
  itemId: string;
  initialAnnotations: Annotation[];
}) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/research/${itemId}/annotations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent.trim() }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const annotation: Annotation = await res.json();
      setAnnotations((prev) => [annotation, ...prev]);
      setNewContent('');
    } catch (err) {
      setError('Failed to add annotation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">Annotations</h2>

      {/* Add annotation form */}
      <form onSubmit={handleSubmit} className="mb-5">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Add a note or annotation..."
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting || !newContent.trim()}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Saving...' : 'Add Annotation'}
          </button>
        </div>
      </form>

      {/* Annotations list */}
      {annotations.length === 0 ? (
        <p className="text-center text-xs text-gray-400 py-4">No annotations yet</p>
      ) : (
        <ul className="space-y-3">
          {annotations.map((ann) => (
            <li key={ann.id} className="rounded-lg bg-gray-50 p-3">
              {ann.highlightedText && (
                <blockquote className="mb-2 border-l-2 border-blue-300 pl-3 text-xs italic text-gray-500">
                  {ann.highlightedText}
                </blockquote>
              )}
              <p className="text-sm text-gray-700">{ann.content}</p>
              <time className="mt-1 block text-xs text-gray-400">
                {new Date(ann.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick action buttons
// ---------------------------------------------------------------------------

const ACTION_TYPES = [
  { type: 'bookmarked', label: 'Bookmark', icon: '\uD83D\uDD16' },
  { type: 'acted_on', label: 'Acted On', icon: '\u2705' },
  { type: 'shared', label: 'Share', icon: '\uD83D\uDD17' },
  { type: 'dismissed', label: 'Dismiss', icon: '\u274C' },
] as const;

function QuickActions({ itemId }: { itemId: string }) {
  const [triggered, setTriggered] = useState<Set<string>>(new Set());

  const handleAction = useCallback(
    async (actionType: string) => {
      try {
        await fetch(`/api/research/${itemId}/actions`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionType }),
        });
        setTriggered((prev) => new Set([...prev, actionType]));
      } catch (err) {
        console.error('Failed to track action', err);
      }
    },
    [itemId],
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-gray-700">Quick Actions</h2>
      <div className="flex flex-wrap gap-2">
        {ACTION_TYPES.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => handleAction(type)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              triggered.has(type)
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <span aria-hidden>{icon}</span>
            {triggered.has(type) ? `${label}!` : label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export default function ResearchDetailClient({ item }: ResearchItemClientProps) {
  return (
    <div className="space-y-6">
      <QuickActions itemId={item.id} />
      <AnnotationsPanel itemId={item.id} initialAnnotations={item.annotations} />
    </div>
  );
}
