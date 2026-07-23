import { notFound } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import KbEntryForm from "@/components/KbEntryForm";
import { createClient } from "@/lib/supabase/server";
import type { KbEntry } from "@/lib/kb";

export default async function EditKbEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("kb_entries")
    .select("*")
    .eq("id", id)
    .single();

  if (!entry) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="mb-4 text-lg font-semibold text-gray-900">
          Edit entry
        </h1>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <KbEntryForm entry={entry as KbEntry} />
        </div>
      </main>
    </div>
  );
}
