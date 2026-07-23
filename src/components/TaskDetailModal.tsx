"use client";

import type { Task } from "@/lib/tasks";
import CommentsSection from "@/components/CommentsSection";
import AttachmentsSection from "@/components/AttachmentsSection";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700",
  med: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

export default function TaskDetailModal({
  task,
  onClose,
  onEdit,
}: {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {task.title}
          </h2>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={onEdit}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {task.priority && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
            >
              {task.priority}
            </span>
          )}
          {task.due_date && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              Due {task.due_date}
            </span>
          )}
          {task.source_transcript_id && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              From transcript
            </span>
          )}
        </div>

        {task.detail && (
          <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {task.detail}
          </p>
        )}

        <div className="space-y-6 border-t border-gray-100 pt-4">
          <AttachmentsSection parentType="task" parentId={task.id} />
          <CommentsSection parentType="task" parentId={task.id} />
        </div>
      </div>
    </div>
  );
}
