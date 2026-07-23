import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeSeedMetrics, getPortalId } from "@/lib/hubspot";

const SEED_METRICS = [
  {
    key: "open_pipeline_amount",
    label: "Open Pipeline",
    query: { type: "open_pipeline_amount" },
    display_type: "currency",
    position: 0,
  },
  {
    key: "deals_by_stage",
    label: "Deals by Stage",
    query: { type: "deals_by_stage" },
    display_type: "count",
    position: 1,
  },
  {
    key: "closed_won_amount_qtr",
    label: "Closed Won (This Quarter)",
    query: { type: "closed_won_amount_qtr" },
    display_type: "currency",
    position: 2,
  },
] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: existingConfig } = await supabase
    .from("metrics_config")
    .select("id")
    .limit(1);

  if (!existingConfig || existingConfig.length === 0) {
    const portalId = await getPortalId();
    const dealsLink = portalId
      ? `https://app.hubspot.com/contacts/${portalId}/objects/0-3/views/all/list`
      : null;

    await supabase.from("metrics_config").insert(
      SEED_METRICS.map((m) => ({
        user_id: user.id,
        key: m.key,
        label: m.label,
        query: m.query,
        display_type: m.display_type,
        hubspot_link: dealsLink,
        position: m.position,
      })),
    );
  }

  let metrics;
  try {
    metrics = await computeSeedMetrics();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "HubSpot request failed" },
      { status: 502 },
    );
  }

  const fetchedAt = new Date().toISOString();
  const rows = [
    {
      user_id: user.id,
      metric_key: "open_pipeline_amount",
      value: metrics.open_pipeline_amount,
      fetched_at: fetchedAt,
    },
    {
      user_id: user.id,
      metric_key: "deals_by_stage",
      value: metrics.deals_by_stage,
      fetched_at: fetchedAt,
    },
    {
      user_id: user.id,
      metric_key: "closed_won_amount_qtr",
      value: metrics.closed_won_amount_qtr,
      fetched_at: fetchedAt,
    },
  ];

  const { error: cacheError } = await supabase
    .from("metrics_cache")
    .upsert(rows, { onConflict: "user_id,metric_key" });

  if (cacheError) {
    return NextResponse.json({ error: cacheError.message }, { status: 500 });
  }

  return NextResponse.json({ metrics });
}
