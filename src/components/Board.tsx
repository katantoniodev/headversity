"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { createClient } from "@/lib/supabase/client";
import { COLUMNS, type Task, type TaskStatus } from "@/lib/tasks";
import TaskCard from "@/components/TaskCard";
import TaskModal, { type TaskFormValues } from "@/components/TaskModal";

function Column({
  status,
  label,
  tasks,
  onAddClick,
  onCardClick,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onAddClick: () => void;
  onCardClick: (task: Task) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-gray-100 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">
          {label} <span className="text-gray-400">({tasks.length})</span>
        </h2>
        <button
          onClick={onAddClick}
          className="rounded px-2 py-0.5 text-lg leading-none text-gray-500 hover:bg-gray-200"
          aria-label={`Add task to ${label}`}
        >
          +
        </button>
      </div>
      <div ref={setNodeRef} className="min-h-[40px] flex-1">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tasks.length === 0 && (
              <p className="rounded-md border border-dashed border-gray-300 p-3 text-center text-xs text-gray-400">
                No tasks
              </p>
            )}
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onCardClick(task)}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function Board({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [prevInitialTasks, setPrevInitialTasks] = useState(initialTasks);

  if (initialTasks !== prevInitialTasks) {
    setPrevInitialTasks(initialTasks);
    setTasks(initialTasks);
  }

  const [modalState, setModalState] = useState<
    { mode: "create"; status: TaskStatus } | { mode: "edit"; task: Task } | null
  >(null);

  const supabase = createClient();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function tasksByStatus(status: TaskStatus) {
    return tasks
      .filter((t) => t.status === status)
      .sort((a, b) => a.position - b.position);
  }

  async function persistChanges(previous: Task[], next: Task[]) {
    const prevById = new Map(previous.map((t) => [t.id, t]));
    const changed = next.filter((t) => {
      const before = prevById.get(t.id);
      return !before || before.status !== t.status || before.position !== t.position;
    });

    await Promise.all(
      changed.map((t) =>
        supabase
          .from("tasks")
          .update({ status: t.status, position: t.position })
          .eq("id", t.id),
      ),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const columnIds = COLUMNS.map((c) => c.status) as string[];
    const destStatus: TaskStatus = columnIds.includes(over.id as string)
      ? (over.id as TaskStatus)
      : tasks.find((t) => t.id === over.id)?.status ?? activeTask.status;

    setTasks((prev) => {
      const columns: Record<TaskStatus, Task[]> = {
        backlog: [],
        todo: [],
        in_progress: [],
        done: [],
      };
      for (const t of prev) {
        columns[t.status].push(t);
      }
      for (const status of Object.keys(columns) as TaskStatus[]) {
        columns[status].sort((a, b) => a.position - b.position);
      }

      const sourceStatus = activeTask.status;
      const sourceList = columns[sourceStatus].filter(
        (t) => t.id !== activeTask.id,
      );
      columns[sourceStatus] = sourceList;

      const destList = columns[destStatus];
      const overIndex = destList.findIndex((t) => t.id === over.id);
      const insertIndex = overIndex === -1 ? destList.length : overIndex;

      const movedTask = { ...activeTask, status: destStatus };
      if (sourceStatus === destStatus) {
        const oldIndex = tasksByStatus(sourceStatus).findIndex(
          (t) => t.id === activeTask.id,
        );
        columns[destStatus] = arrayMove(
          [...tasksByStatus(sourceStatus)],
          oldIndex,
          insertIndex,
        );
      } else {
        destList.splice(insertIndex, 0, movedTask);
        columns[destStatus] = destList;
      }

      const next: Task[] = [];
      for (const status of Object.keys(columns) as TaskStatus[]) {
        columns[status].forEach((t, index) => {
          next.push({ ...t, status, position: index });
        });
      }

      persistChanges(prev, next);
      return next;
    });
  }

  async function handleSave(values: TaskFormValues) {
    if (!modalState) return;

    const payload = {
      title: values.title.trim(),
      detail: values.detail.trim() || null,
      priority: values.priority || null,
      due_date: values.due_date || null,
    };

    if (modalState.mode === "create") {
      const column = tasksByStatus(modalState.status);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          ...payload,
          status: modalState.status,
          position: column.length,
          user_id: user.id,
        })
        .select()
        .single();

      if (!error && data) {
        setTasks((prev) => [...prev, data as Task]);
      }
    } else {
      const { error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", modalState.task.id);

      if (!error) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === modalState.task.id ? { ...t, ...payload } : t,
          ),
        );
      }
    }

    setModalState(null);
  }

  async function handleDelete() {
    if (modalState?.mode !== "edit") return;
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", modalState.task.id);

    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== modalState.task.id));
    }
    setModalState(null);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.status}
              status={col.status}
              label={col.label}
              tasks={tasksByStatus(col.status)}
              onAddClick={() => setModalState({ mode: "create", status: col.status })}
              onCardClick={(task) => setModalState({ mode: "edit", task })}
            />
          ))}
        </div>
      </DndContext>

      {modalState && (
        <TaskModal
          task={modalState.mode === "edit" ? modalState.task : null}
          onClose={() => setModalState(null)}
          onSave={handleSave}
          onDelete={modalState.mode === "edit" ? handleDelete : undefined}
        />
      )}
    </>
  );
}
