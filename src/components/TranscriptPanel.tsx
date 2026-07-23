"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function TranscriptPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [rawText, setRawText] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "parsing" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");
    setResultMessage("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setStatus("error");
      setErrorMessage("You need to be signed in.");
      return;
    }

    const { data: transcript, error: insertError } = await supabase
      .from("transcripts")
      .insert({
        user_id: user.id,
        meeting_title: meetingTitle.trim() || "Untitled meeting",
        meeting_date: meetingDate,
        raw_text: rawText,
      })
      .select()
      .single();

    if (insertError || !transcript) {
      setStatus("error");
      setErrorMessage(insertError?.message ?? "Failed to save transcript.");
      return;
    }

    setStatus("parsing");

    try {
      const res = await fetch("/api/transcripts/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript_id: transcript.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(
          data?.raw
            ? `${data.error}: ${data.raw}`
            : (data?.error ?? "Failed to parse transcript."),
        );
        return;
      }

      setResultMessage(
        `Created ${data.tasks_created} task${data.tasks_created === 1 ? "" : "s"} in To Do.`,
      );
      setMeetingTitle("");
      setRawText("");
      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage("Failed to reach the parsing service.");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
      >
        Paste transcript
      </button>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">
          Paste meeting transcript
        </h2>
        <button
          onClick={() => setOpen(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            required
            placeholder="Meeting title"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
          <input
            type="date"
            required
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <textarea
          required
          placeholder="Paste the full transcript here..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={10}
          className={`w-full ${inputClass}`}
        />

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={status === "saving" || status === "parsing"}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {status === "saving"
              ? "Saving..."
              : status === "parsing"
                ? "Extracting your action items..."
                : "Save and extract tasks"}
          </button>
          {status === "error" && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
          {resultMessage && (
            <p className="text-sm text-green-700">{resultMessage}</p>
          )}
        </div>
      </form>
    </div>
  );
}
