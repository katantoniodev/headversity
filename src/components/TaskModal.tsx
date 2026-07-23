"use client";

import { useState } from "react";
import type { Task, TaskPriority } from "@/lib/tasks";

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export type TaskFormValues = {
  title: string;
  detail: string;
  priority: TaskPriority | "";
  due_date: string;
};

export default function TaskModal({
  task,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (values: TaskFormValues) => void;
  onDelete?: () => void;
}) {
  const [values, setValues] = useState<TaskFormValues>({
    title: task?.title ?? "",
    detail: task?.detail ?? "",
    priority: task?.priority ?? "",
    due_date: task?.due_date ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) return;
    onSave(values);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {task ? "Edit task" : "New task"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              required
              autoFocus
              value={values.title}
              onChange={(e) =>
                setValues((v) => ({ ...v, title: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Detail
            </label>
            <textarea
              value={values.detail}
              onChange={(e) =>
                setValues((v) => ({ ...v, detail: e.target.value }))
              }
              rows={3}
              className={inputClass}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Priority
              </label>
              <select
                value={values.priority}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    priority: e.target.value as TaskPriority | "",
                  }))
                }
                className={inputClass}
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="med">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Due date
              </label>
              <input
                type="date"
                value={values.due_date}
                onChange={(e) =>
                  setValues((v) => ({ ...v, due_date: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {task && onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
