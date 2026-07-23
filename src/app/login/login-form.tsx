"use client";

import { useState, useTransition } from "react";
import { sendMagicLink } from "./actions";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<
    { type: "idle" } | { type: "sent" } | { type: "error"; message: string }
  >({ type: "idle" });

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await sendMagicLink(formData);
      if (result?.error) {
        setStatus({ type: "error", message: result.error });
      } else {
        setStatus({ type: "sent" });
      }
    });
  }

  if (status.type === "sent") {
    return (
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Check your email for a login link. You can close this tab.
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        Email address
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-foreground px-5 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-60 dark:hover:bg-[#ccc]"
      >
        {isPending ? "Sending..." : "Send magic link"}
      </button>
      {status.type === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">{status.message}</p>
      )}
    </form>
  );
}
