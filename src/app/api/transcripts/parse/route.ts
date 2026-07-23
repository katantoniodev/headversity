import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

type ParsedActionItem = {
  title: string;
  detail: string | null;
  due_date: string | null;
  priority: string | null;
};

type ParsedResponse = {
  action_items: ParsedActionItem[];
  meeting_summary: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const transcriptId = body?.transcript_id;
  if (!transcriptId) {
    return NextResponse.json(
      { error: "transcript_id is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: transcript, error: fetchError } = await supabase
    .from("transcripts")
    .select("*")
    .eq("id", transcriptId)
    .single();

  if (fetchError || !transcript) {
    return NextResponse.json({ error: "transcript not found" }, { status: 404 });
  }

  const aliases = (process.env.USER_NAME_ALIASES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const aliasLine = aliases.length
    ? aliases.join(", ")
    : "(none configured — use first-person commitments like \"I will...\")";

  const prompt = `You are extracting action items from a meeting transcript for one specific person.

That person's name and aliases as they may appear in the transcript: ${aliasLine}

Rules:
- Include: tasks assigned to this person, tasks they explicitly committed to (e.g. "I'll...", "<name> will..."), and asks clearly directed at them.
- Exclude: other people's action items, general discussion, and decisions with no associated task.

Return STRICT JSON only — no prose, no markdown code fences — matching exactly this shape:
{
  "action_items": [
    { "title": string, "detail": string | null, "due_date": string | null, "priority": "low" | "med" | "high" | null }
  ],
  "meeting_summary": string
}

due_date must be an ISO date (YYYY-MM-DD) if mentioned, otherwise null.

Transcript:
"""
${transcript.raw_text}
"""`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let responseText: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      thinking: { type: "disabled" },
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = message.content.find((b) => b.type === "text");
    responseText = textBlock?.type === "text" ? textBlock.text : "";
  } catch {
    return NextResponse.json(
      { error: "Failed to reach Claude" },
      { status: 502 },
    );
  }

  const firstBrace = responseText.indexOf("{");
  const lastBrace = responseText.lastIndexOf("}");
  const cleaned =
    firstBrace !== -1 && lastBrace !== -1
      ? responseText.slice(firstBrace, lastBrace + 1)
      : responseText.trim();

  let parsed: ParsedResponse;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      {
        error: "Could not parse Claude's response as JSON",
        raw: responseText.slice(0, 500),
      },
      { status: 502 },
    );
  }

  const actionItems = Array.isArray(parsed.action_items)
    ? parsed.action_items
    : [];

  const { data: lastTodo } = await supabase
    .from("tasks")
    .select("position")
    .eq("status", "todo")
    .order("position", { ascending: false })
    .limit(1);

  let nextPosition = lastTodo && lastTodo.length ? lastTodo[0].position + 1 : 0;

  const rowsToInsert = actionItems
    .filter((item) => item && typeof item.title === "string" && item.title.trim())
    .map((item) => ({
      user_id: user.id,
      title: item.title.trim(),
      detail: item.detail || null,
      status: "todo" as const,
      priority:
        item.priority && ["low", "med", "high"].includes(item.priority)
          ? item.priority
          : null,
      due_date: item.due_date || null,
      position: nextPosition++,
      source_transcript_id: transcriptId,
    }));

  if (rowsToInsert.length) {
    const { error: insertTasksError } = await supabase
      .from("tasks")
      .insert(rowsToInsert);
    if (insertTasksError) {
      return NextResponse.json(
        { error: insertTasksError.message },
        { status: 500 },
      );
    }
  }

  if (parsed.meeting_summary) {
    await supabase.from("kb_entries").insert({
      user_id: user.id,
      title: `Meeting summary: ${transcript.meeting_title}`,
      body: parsed.meeting_summary,
      source_type: "transcript",
      source_ref: transcriptId,
      tags: [],
    });
  }

  await supabase
    .from("transcripts")
    .update({ parsed_at: new Date().toISOString() })
    .eq("id", transcriptId);

  return NextResponse.json({ tasks_created: rowsToInsert.length });
}
