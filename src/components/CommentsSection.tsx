"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Comment, ParentType } from "@/lib/comments";

export default function CommentsSection({
  parentType,
  parentId,
}: {
  parentType: ParentType;
  parentId: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("comments")
      .select("*")
      .eq("parent_type", parentType)
      .eq("parent_id", parentId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setComments((data as Comment[]) ?? []);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [parentType, parentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPosting(false);
      return;
    }

    const { data, error } = await supabase
      .from("comments")
      .insert({
        parent_type: parentType,
        parent_id: parentId,
        body: body.trim(),
        user_id: user.id,
      })
      .select()
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data as Comment]);
      setBody("");
    }
    setPosting(false);
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">Comments</h3>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400">No comments yet.</p>
      ) : (
        <ul className="mb-3 space-y-2">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-md border border-gray-200 bg-gray-50 p-2 text-sm"
            >
              <p className="whitespace-pre-wrap text-gray-800">{c.body}</p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(c.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={posting || !body.trim()}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
}
