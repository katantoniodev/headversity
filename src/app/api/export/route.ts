import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [{ data: tasks }, { data: kbEntries }, { data: transcripts }] =
    await Promise.all([
      supabase.from("tasks").select("*"),
      supabase.from("kb_entries").select("*"),
      supabase.from("transcripts").select("*"),
    ]);

  const backup = {
    exported_at: new Date().toISOString(),
    tasks: tasks ?? [],
    kb_entries: kbEntries ?? [],
    transcripts: transcripts ?? [],
  };

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="headversity-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
