"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Attachment, ParentType } from "@/lib/comments";

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AttachmentsSection({
  parentType,
  parentId,
}: {
  parentType: ParentType;
  parentId: string;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("attachments")
      .select("*")
      .eq("parent_type", parentType)
      .eq("parent_id", parentId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setAttachments((data as Attachment[]) ?? []);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [parentType, parentId]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMessage("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    const storagePath = `${user.id}/${parentType}/${parentId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(storagePath, file);

    if (uploadError) {
      setErrorMessage(uploadError.message);
      setUploading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("attachments")
      .insert({
        parent_type: parentType,
        parent_id: parentId,
        file_name: file.name,
        storage_path: storagePath,
        size_bytes: file.size,
        user_id: user.id,
      })
      .select()
      .single();

    if (!insertError && data) {
      setAttachments((prev) => [...prev, data as Attachment]);
    } else if (insertError) {
      setErrorMessage(insertError.message);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDownload(attachment: Attachment) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("attachments")
      .createSignedUrl(attachment.storage_path, 60);

    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function handleDelete(attachment: Attachment) {
    const supabase = createClient();
    await supabase.storage.from("attachments").remove([attachment.storage_path]);
    await supabase.from("attachments").delete().eq("id", attachment.id);
    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">Attachments</h3>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : attachments.length === 0 ? (
        <p className="mb-2 text-sm text-gray-400">No attachments yet.</p>
      ) : (
        <ul className="mb-3 space-y-1">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm"
            >
              <button
                onClick={() => handleDownload(a)}
                className="truncate text-left font-medium text-indigo-600 hover:underline"
              >
                {a.file_name}
              </button>
              <div className="flex shrink-0 items-center gap-2 text-xs text-gray-400">
                <span>{formatSize(a.size_bytes)}</span>
                <button
                  onClick={() => handleDelete(a)}
                  className="text-red-500 hover:text-red-700"
                  aria-label={`Remove ${a.file_name}`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        className="text-sm text-gray-700"
      />
      {uploading && <p className="mt-1 text-xs text-gray-400">Uploading...</p>}
      {errorMessage && (
        <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
