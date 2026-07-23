export type TaskStatus = "backlog" | "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "med" | "high";

export type Task = {
  id: string;
  user_id: string;
  title: string;
  detail: string | null;
  status: TaskStatus;
  priority: TaskPriority | null;
  due_date: string | null;
  position: number;
  source_transcript_id: string | null;
  created_at: string;
};

export const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "backlog", label: "Backlog" },
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "done", label: "Done" },
];
