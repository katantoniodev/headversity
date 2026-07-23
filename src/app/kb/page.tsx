import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import TranscriptPanel from "@/components/TranscriptPanel";
import type { KbEntry } from "@/lib/kb";

export default async function KbListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q, tag } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("kb_entries")
    .select("*")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.textSearch("search_vector", q, { type: "websearch" });
  }
  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data: entries, error } = await query;
  const allTags = Array.from(
    new Set(((entries as KbEntry[]) ?? []).flatMap((e) => e.tags)),
  ).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="mx-auto max-w-4xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            Knowledge Base
          </h1>
          <Link
            href="/kb/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            New entry
          </Link>
        </div>

        <TranscriptPanel context="kb" />

        <form className="mb-4 flex gap-3" method="get">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search title and body..."
            className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Search
          </button>
        </form>

        {allTags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Link
              href="/kb"
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                !tag ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              All
            </Link>
            {allTags.map((t) => (
              <Link
                key={t}
                href={`/kb?tag=${encodeURIComponent(t)}`}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  tag === t
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {error ? (
          <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            Couldn&apos;t load entries: {error.message}
          </p>
        ) : !entries || entries.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No entries yet. Create one manually, or paste a transcript on the
            board to auto-generate a meeting summary here.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(entries as KbEntry[]).map((entry) => (
              <Link
                key={entry.id}
                href={`/kb/${entry.id}`}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-300"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h2 className="font-medium text-gray-900">{entry.title}</h2>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {entry.source_type}
                  </span>
                </div>
                <p className="line-clamp-3 text-sm text-gray-600">
                  {entry.body}
                </p>
                {entry.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
