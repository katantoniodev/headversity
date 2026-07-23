"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshMetricsButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRefresh() {
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/hubspot/metrics");
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data?.error ?? "Failed to refresh metrics.");
        return;
      }

      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage("Failed to reach the server.");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRefresh}
        disabled={status === "loading"}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
      >
        {status === "loading" ? "Refreshing..." : "Refresh"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
