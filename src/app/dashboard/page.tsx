import AppHeader from "@/components/AppHeader";
import RefreshMetricsButton from "@/components/RefreshMetricsButton";
import { createClient } from "@/lib/supabase/server";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: config }, { data: cache }] = await Promise.all([
    supabase.from("metrics_config").select("*").order("position"),
    supabase.from("metrics_cache").select("*"),
  ]);

  const cacheByKey = new Map((cache ?? []).map((c) => [c.metric_key, c]));

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />

      <main className="mx-auto max-w-4xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            Sales &amp; CS Dashboard
          </h1>
          <RefreshMetricsButton />
        </div>

        {!config || config.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No metrics yet. Click Refresh to pull your first HubSpot numbers.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {config.map((metric) => {
              const cached = cacheByKey.get(metric.key);
              return (
                <div
                  key={metric.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-medium text-gray-500">
                    {metric.label}
                  </p>

                  {!cached ? (
                    <p className="mt-2 text-sm text-gray-400">
                      Not fetched yet
                    </p>
                  ) : metric.display_type === "currency" ? (
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      {formatCurrency(Number(cached.value))}
                    </p>
                  ) : metric.key === "deals_by_stage" ? (
                    <ul className="mt-2 space-y-1 text-sm text-gray-700">
                      {(cached.value as { stage: string; count: number }[]).map(
                        (row) => (
                          <li key={row.stage} className="flex justify-between">
                            <span>{row.stage}</span>
                            <span className="font-medium">{row.count}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      {String(cached.value)}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {cached
                        ? `Updated ${new Date(cached.fetched_at).toLocaleString()}`
                        : ""}
                    </span>
                    {metric.hubspot_link && (
                      <a
                        href={metric.hubspot_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Open in HubSpot
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
