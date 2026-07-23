import { createClient } from "@/lib/supabase/server";
import AppHeader from "@/components/AppHeader";
import Board from "@/components/Board";
import TranscriptPanel from "@/components/TranscriptPanel";
import type { Task } from "@/lib/tasks";

export default async function Home() {
  const supabase = await createClient();

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("*")
    .order("position", { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="p-6">
        <TranscriptPanel />

        {error ? (
          <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            Couldn&apos;t load tasks: {error.message}
          </p>
        ) : (
          <Board initialTasks={(tasks as Task[]) ?? []} />
        )}
      </main>
    </div>
  );
}
