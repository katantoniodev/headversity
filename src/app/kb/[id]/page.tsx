import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import MarkdownView from "@/components/MarkdownView";
import CommentsSection from "@/components/CommentsSection";
import AttachmentsSection from "@/components/AttachmentsSection";
import { createClient } from "@/lib/supabase/server";
import type { KbEntry } from "@/lib/kb";

export default async function ViewKbEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("kb_entries")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    notFound();
  }

  const entry = data as KbEntry;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-2xl p-6">
        <Link
          href="/kb"
          className="mb-4 inline-block text-sm text-gray-500 hover:text-indigo-600"
        >
          ← Back to Knowledge Base
        </Link>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-start justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {entry.title}
            </h1>
            <Link
              href={`/kb/${entry.id}/edit`}
              className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit
            </Link>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {entry.source_type}
            </span>
            {entry.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
              >
                {t}
              </span>
            ))}
            <span className="text-xs text-gray-400">
              Updated {new Date(entry.updated_at).toLocaleString()}
            </span>
          </div>

          <MarkdownView body={entry.body} />

          <div className="mt-6 space-y-6 border-t border-gray-100 pt-4">
            <AttachmentsSection parentType="kb_entry" parentId={entry.id} />
            <CommentsSection parentType="kb_entry" parentId={entry.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
