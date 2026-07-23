"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { KbEntry, KbSourceType } from "@/lib/kb";

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export default function KbEntryForm({ entry }: { entry?: KbEntry }) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [sourceType, setSourceType] = useState<KbSourceType>(
    entry?.source_type ?? "manual",
  );
  const [sourceRef, setSourceRef] = useState(entry?.source_ref ?? "");
  const [tagsInput, setTagsInput] = useState(entry?.tags.join(", ") ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      body,
      source_type: sourceType,
      source_ref: sourceRef.trim() || null,
      tags,
    };

    if (entry) {
      const { error } = await supabase
        .from("kb_entries")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", entry.id);

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("error");
        setErrorMessage("You need to be signed in.");
        return;
      }

      const { error } = await supabase
        .from("kb_entries")
        .insert({ ...payload, user_id: user.id });

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }
    }

    router.push("/kb");
    router.refresh();
  }

  async function handleDelete() {
    if (!entry) return;
    const { error } = await supabase
      .from("kb_entries")
      .delete()
      .eq("id", entry.id);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    router.push("/kb");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Body (markdown)
        </label>
        <textarea
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className={`${inputClass} font-mono`}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Source
          </label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as KbSourceType)}
            className={inputClass}
          >
            <option value="manual">Manual</option>
            <option value="slack_paste">Slack paste</option>
            <option value="transcript">Transcript</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Source link (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Slack permalink"
            value={sourceRef}
            onChange={(e) => setSourceRef(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Tags (comma separated)
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="sales, onboarding"
          className={inputClass}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        {entry ? (
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {status === "error" && (
            <p className="self-center text-sm text-red-600">{errorMessage}</p>
          )}
          <button
            type="submit"
            disabled={status === "saving"}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {status === "saving" ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
