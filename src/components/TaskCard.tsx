"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/tasks";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700",
  med: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

const PRIORITY_BORDER: Record<string, string> = {
  low: "border-l-emerald-400",
  med: "border-l-amber-400",
  high: "border-l-red-400",
};

export default function TaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`cursor-grab rounded-md border border-gray-200 border-l-4 ${task.priority ? PRIORITY_BORDER[task.priority] : "border-l-gray-200"} bg-white p-3 text-sm shadow-sm hover:border-gray-300 hover:shadow-md active:cursor-grabbing`}
    >
      <p className="font-medium text-gray-900">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {task.priority && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
          >
            {task.priority}
          </span>
        )}
        {task.due_date && (
          <span className="text-xs text-gray-500">{task.due_date}</span>
        )}
        {task.source_transcript_id && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            from transcript
          </span>
        )}
      </div>
    </div>
  );
}
