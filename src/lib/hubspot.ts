const HUBSPOT_BASE = "https://api.hubapi.com";

async function hubspotFetch(path: string, init?: RequestInit) {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) {
    throw new Error("HUBSPOT_PRIVATE_APP_TOKEN is not configured");
  }

  const res = await fetch(`${HUBSPOT_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HubSpot API error (${res.status}): ${text}`);
  }

  return res.json();
}

export async function getPortalId(): Promise<string | null> {
  try {
    const data = await hubspotFetch("/account-info/v3/details");
    return data?.portalId ? String(data.portalId) : null;
  } catch {
    return null;
  }
}

type StageInfo = { id: string; label: string; isWon: boolean; isClosed: boolean };

async function getStageInfo(): Promise<Map<string, StageInfo>> {
  const data = await hubspotFetch("/crm/v3/pipelines/deals");
  const stageMap = new Map<string, StageInfo>();

  for (const pipeline of data.results ?? []) {
    for (const stage of pipeline.stages ?? []) {
      const probability = parseFloat(stage.metadata?.probability ?? "0.5");
      stageMap.set(stage.id, {
        id: stage.id,
        label: stage.label,
        isWon: probability >= 1,
        isClosed: probability <= 0 || probability >= 1,
      });
    }
  }

  return stageMap;
}

type Deal = {
  properties: {
    amount?: string;
    dealstage?: string;
    pipeline?: string;
    closedate?: string;
    hs_is_closed_won?: string;
    dealname?: string;
  };
};

async function searchAllDeals(): Promise<Deal[]> {
  const deals: Deal[] = [];
  let after: string | undefined;
  const MAX_DEALS = 1000;

  do {
    const data = await hubspotFetch("/crm/v3/objects/deals/search", {
      method: "POST",
      body: JSON.stringify({
        limit: 100,
        after,
        properties: [
          "amount",
          "dealstage",
          "pipeline",
          "closedate",
          "hs_is_closed_won",
          "dealname",
        ],
      }),
    });

    deals.push(...(data.results ?? []));
    after = data.paging?.next?.after;
  } while (after && deals.length < MAX_DEALS);

  return deals;
}

function currentQuarterRange() {
  const now = new Date();
  const quarter = Math.floor(now.getUTCMonth() / 3);
  const start = new Date(Date.UTC(now.getUTCFullYear(), quarter * 3, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), quarter * 3 + 3, 1));
  return { start, end };
}

export type MetricValues = {
  open_pipeline_amount: number;
  deals_by_stage: { stage: string; count: number }[];
  closed_won_amount_qtr: number;
};

export async function computeSeedMetrics(): Promise<MetricValues> {
  const [stageInfo, deals] = await Promise.all([
    getStageInfo(),
    searchAllDeals(),
  ]);
  const { start, end } = currentQuarterRange();

  let openPipelineAmount = 0;
  let closedWonAmountQtr = 0;
  const stageCounts = new Map<string, number>();

  for (const deal of deals) {
    const amount = parseFloat(deal.properties.amount ?? "0") || 0;
    const stageId = deal.properties.dealstage ?? "unknown";
    const stage = stageInfo.get(stageId);
    const stageLabel = stage?.label ?? stageId;

    stageCounts.set(stageLabel, (stageCounts.get(stageLabel) ?? 0) + 1);

    const isClosed = stage?.isClosed ?? false;
    if (!isClosed) {
      openPipelineAmount += amount;
    }

    const isWon =
      deal.properties.hs_is_closed_won === "true" || stage?.isWon === true;
    if (isWon && deal.properties.closedate) {
      const closeDate = new Date(deal.properties.closedate);
      if (closeDate >= start && closeDate < end) {
        closedWonAmountQtr += amount;
      }
    }
  }

  return {
    open_pipeline_amount: openPipelineAmount,
    deals_by_stage: Array.from(stageCounts.entries()).map(([stage, count]) => ({
      stage,
      count,
    })),
    closed_won_amount_qtr: closedWonAmountQtr,
  };
}
