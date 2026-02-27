import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { format } from 'date-fns';
import ResearchDetailClient from './ResearchDetailClient';

// ---------------------------------------------------------------------------
// Server-side data fetching
// ---------------------------------------------------------------------------

async function getResearchItem(id: string) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/research/${id}`,
    {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }, // ISR: refresh every 60s
    },
  );

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch research item: HTTP ${res.status}`);

  return res.json();
}

async function getRelatedResearch(id: string, tickers: string[]) {
  if (tickers.length === 0) return [];
  const cookieStore = cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/research?search=${encodeURIComponent(tickers.slice(0, 3).join(' '))}&limit=5`,
    {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      next: { revalidate: 300 },
    },
  );

  if (!res.ok) return [];
  const json = await res.json();
  // Exclude the current item from related
  return (json.data ?? []).filter((item: { id: string }) => item.id !== id).slice(0, 4);
}

// ---------------------------------------------------------------------------
// Sentiment badge (server-renderable)
// ---------------------------------------------------------------------------

function SentimentBadge({ score, showScore = false }: { score: number | null; showScore?: boolean }) {
  if (score === null) return null;
  const label = score > 0.2 ? 'Bullish' : score < -0.2 ? 'Bearish' : 'Neutral';
  const classes =
    score > 0.2
      ? 'bg-green-50 text-green-700 ring-green-600/20'
      : score < -0.2
        ? 'bg-red-50 text-red-700 ring-red-600/20'
        : 'bg-gray-50 text-gray-600 ring-gray-500/10';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      {label}
      {showScore && ` (${score.toFixed(2)})`}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page component (Server Component)
// ---------------------------------------------------------------------------

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  const item = await getResearchItem(params.id);
  return {
    title: item ? `${item.title} | Research` : 'Research',
    description: item?.summary ?? '',
  };
}

export default async function ResearchDetailPage({ params }: PageProps) {
  const item = await getResearchItem(params.id);

  if (!item) notFound();

  const related = await getRelatedResearch(params.id, item.extractedTickers ?? []);

  const publishDate = item.publishedAt ?? item.ingestedAt;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back navigation */}
        <Link
          href="/research"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Research
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 leading-snug">{item.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    {item.source && (
                      <span className="font-medium text-gray-700">{item.source.name}</span>
                    )}
                    {item.author && <>
                      <span aria-hidden>·</span>
                      <span>{item.author}</span>
                    </>}
                    <span aria-hidden>·</span>
                    <time dateTime={publishDate}>
                      {format(new Date(publishDate), 'MMMM d, yyyy')}
                    </time>
                  </div>
                </div>

                {/* Status badge */}
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.status === 'processed'
                      ? 'bg-green-50 text-green-700'
                      : item.status === 'failed'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-yellow-50 text-yellow-700'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* Tags */}
              {item.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.tags.map((tag: { id: string; name: string; color?: string }) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                      style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : {}}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* AI Summary */}
            {item.summary && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
                <div className="mb-3 flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <h2 className="text-sm font-semibold text-blue-800">AI Summary</h2>
                </div>
                <p className="text-sm text-blue-900 leading-relaxed">{item.summary}</p>
              </div>
            )}

            {/* Full content (HTML) */}
            {item.contentHtml ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-700">Full Content</h2>
                {/* dangerouslySetInnerHTML is safe here: content is from trusted internal email ingestion */}
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: item.contentHtml }}
                />
              </div>
            ) : item.contentText ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold text-gray-700">Content</h2>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                  {item.contentText}
                </pre>
              </div>
            ) : null}

            {/* Interactive client section: annotations, actions, tags editor */}
            <Suspense
              fallback={
                <div className="h-48 animate-pulse rounded-xl border border-gray-200 bg-white" />
              }
            >
              <ResearchDetailClient item={item} />
            </Suspense>
          </div>

          {/* Sidebar column */}
          <div className="space-y-6">
            {/* Securities & Sentiment */}
            {item.securities?.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-gray-700">Mentioned Securities</h2>
                <ul className="space-y-2">
                  {item.securities.map(
                    (sec: { id: string; ticker: string; name: string; sentiment: number | null }) => (
                      <li key={sec.id} className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {sec.ticker}
                          </span>
                          {sec.name && sec.name !== sec.ticker && (
                            <span className="ml-1.5 text-xs text-gray-500">{sec.name}</span>
                          )}
                        </div>
                        <SentimentBadge score={sec.sentiment} showScore />
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            {/* Attachments */}
            {item.attachments?.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-gray-700">Attachments</h2>
                <ul className="space-y-2">
                  {item.attachments.map(
                    (att: {
                      id: string;
                      filename: string;
                      contentType: string;
                      fileSize: number;
                    }) => (
                      <li key={att.id}>
                        <a
                          href={`/api/research/attachments/${att.id}/download`}
                          className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                          download
                        >
                          <svg
                            className="h-4 w-4 shrink-0 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          <span className="min-w-0 truncate">{att.filename}</span>
                          <span className="ml-auto shrink-0 text-xs text-gray-400">
                            {att.fileSize ? `${Math.round(att.fileSize / 1024)}KB` : ''}
                          </span>
                        </a>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            {/* Related Research */}
            {related.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-gray-700">Related Research</h2>
                <ul className="space-y-3">
                  {related.map((rel: { id: string; title: string; publishedAt?: string; ingestedAt: string }) => (
                    <li key={rel.id}>
                      <Link
                        href={`/research/${rel.id}`}
                        className="block text-sm font-medium text-gray-800 hover:text-blue-600 line-clamp-2 transition-colors"
                      >
                        {rel.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {format(new Date(rel.publishedAt ?? rel.ingestedAt), 'MMM d, yyyy')}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Original URL */}
            {item.originalUrl && (
              <a
                href={item.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm text-blue-600 hover:bg-gray-50 shadow-sm transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Original Source
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
