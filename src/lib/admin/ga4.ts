import "server-only";
import crypto from "node:crypto";

/**
 * Cycle 14X+ post-sync (admin Tier 1): GA4 today tile.
 *
 * Pulls a snapshot of today's traffic + revenue from GA4 Data API v1beta.
 * Dep-free: gets an OAuth access token, calls runReport. Token is cached
 * in-process for ~50 min (Google issues 1h tokens). Graceful degrade: if
 * no auth is configured, returns { configured: false } and the UI shows a
 * setup CTA.
 *
 * Two auth methods are supported (whichever is configured wins, SA first):
 *
 *  A) Service account (GA4_SERVICE_ACCOUNT_JSON) — signs a JWT with Node
 *     crypto, exchanges for a token. Best for production but needs a Google
 *     Cloud service account with the Viewer role on the property.
 *
 *  B) OAuth refresh token (GA4_OAUTH_CLIENT_ID + GA4_OAUTH_CLIENT_SECRET +
 *     GA4_OAUTH_REFRESH_TOKEN) — reuses the existing user OAuth creds from
 *     token.json (the same creds the marketing/analytics Python reports use).
 *     Zero Google Cloud setup; just paste three env vars. Refresh tokens are
 *     long-lived, so this keeps working unattended.
 *
 * Env vars:
 *   GA4_PROPERTY_ID          — numeric property id, e.g. "529120634"
 *   GA4_SERVICE_ACCOUNT_JSON — (method A) full JSON of a Viewer service account
 *   GA4_OAUTH_CLIENT_ID      — (method B) OAuth client id
 *   GA4_OAUTH_CLIENT_SECRET  — (method B) OAuth client secret
 *   GA4_OAUTH_REFRESH_TOKEN  — (method B) long-lived refresh token
 */

export type Ga4Snapshot = {
  configured: true;
  range: { start: string; end: string };
  revenue: number;
  transactions: number;
  sessions: number;
  users: number;
  activeUsers: number;
  pageViews: number;
  engagementRate: number; // 0-1
  conversionRate: number; // 0-1 (transactions / sessions)
  // Funnel events — GA4 standard names.
  events: {
    page_view: number;
    view_item: number;
    select_vehicle: number;
    add_to_cart: number;
    begin_checkout: number;
    purchase: number;
    sign_up: number;
    login: number;
    search: number;
  };
  topProducts: { name: string; revenue: number; quantity: number }[];
  topSources: { source: string; sessions: number }[];
};

export type Ga4Result =
  | Ga4Snapshot
  | { configured: false; reason: string }
  | { configured: true; error: string };

let _cachedToken: { token: string; expiresAt: number } | null = null;

function readServiceAccount(): {
  client_email: string;
  private_key: string;
} | null {
  const raw = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      client_email?: string;
      private_key?: string;
    };
    if (!parsed.client_email || !parsed.private_key) return null;
    // GitHub Actions / Vercel often store with literal "\n" — restore newlines.
    const private_key = parsed.private_key.replace(/\\n/g, "\n");
    return { client_email: parsed.client_email, private_key };
  } catch {
    return null;
  }
}

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/** OAuth refresh-token grant (method B) — reuses token.json-style creds. */
function readOAuthCreds(): {
  client_id: string;
  client_secret: string;
  refresh_token: string;
} | null {
  const client_id = process.env.GA4_OAUTH_CLIENT_ID;
  const client_secret = process.env.GA4_OAUTH_CLIENT_SECRET;
  const refresh_token = process.env.GA4_OAUTH_REFRESH_TOKEN;
  if (!client_id || !client_secret || !refresh_token) return null;
  return { client_id, client_secret, refresh_token };
}

/** True when at least one auth method has its env vars present. */
function hasAuthConfigured(): boolean {
  return Boolean(process.env.GA4_SERVICE_ACCOUNT_JSON) || readOAuthCreds() !== null;
}

async function getOAuthToken(): Promise<string | null> {
  const oauth = readOAuthCreds();
  if (!oauth) return null;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: oauth.client_id,
      client_secret: oauth.client_secret,
      refresh_token: oauth.refresh_token,
      grant_type: "refresh_token",
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`GA4 OAuth refresh failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  _cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function getAccessToken(): Promise<string | null> {
  if (_cachedToken && _cachedToken.expiresAt > Date.now() + 60_000) {
    return _cachedToken.token;
  }
  const sa = readServiceAccount();
  // No service account? Fall back to the OAuth refresh-token method.
  if (!sa) return getOAuthToken();

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const headerB64 = base64url(Buffer.from(JSON.stringify(header)));
  const claimB64 = base64url(Buffer.from(JSON.stringify(claim)));
  const signingInput = `${headerB64}.${claimB64}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = base64url(signer.sign(sa.private_key));
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`GA4 token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  _cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

type RunReportRequest = {
  dateRanges: { startDate: string; endDate: string }[];
  metrics: { name: string }[];
  dimensions?: { name: string }[];
  orderBys?: { metric: { metricName: string }; desc?: boolean }[];
  limit?: string;
};

type RunReportResponse = {
  rows?: {
    dimensionValues?: { value: string }[];
    metricValues?: { value: string }[];
  }[];
};

async function runReport(
  propertyId: string,
  token: string,
  body: RunReportRequest,
): Promise<RunReportResponse> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(propertyId)}:runReport`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    throw new Error(`GA4 runReport ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as RunReportResponse;
}

// ── Funnel trend (admin panel) ──────────────────────────────────────────────
// Cross-source USER funnel across N rolling 7-day windows. Every step is a
// distinct-user count (totalUsers per eventName) — NEVER event firings — so the
// funnel is monotonic and comparable. Engagement is session-scoped and reported
// separately. Mirrors marketing/analytics/funnel_trend_report.py.

export type FunnelWeek = {
  label: string;
  visited: number;
  viewed: number;
  cart: number;
  checkout: number;
  purchase: number;
  sessions: number;
  engaged: number;
};
export type FunnelSource = {
  channel: string;
  users: number;
  engRate: number; // 0-1
  viewed: number;
  cart: number;
  checkout: number;
  buy: number;
};
export type FunnelTrendResult =
  | { configured: true; weeks: FunnelWeek[]; bySource: FunnelSource[] }
  | { configured: false; reason: string }
  | { configured: true; error: string };

function channelOf(sm: string): string {
  const s = sm.toLowerCase();
  if (s.includes("brevo") || s.includes("/email") || s.includes("sendibm")) return "Email (Brevo)";
  if (s.includes("chatgpt") || s.includes("openai")) return "ChatGPT";
  if (s.includes("perplexity")) return "Perplexity";
  if (s.includes("gemini") || s.includes("bard")) return "Gemini";
  if (s.includes("google") && s.includes("organic")) return "Google Organic";
  if (s.includes("google") && (s.includes("cpc") || s.includes("product_sync") || s.includes("shopping"))) return "Google Shop/Ads";
  if (s.includes("bing") && s.includes("organic")) return "Bing Organic";
  if (s.includes("duckduckgo") || s.includes("yahoo")) return "Other Search";
  if (s.includes("direct") || s.includes("(none)")) return "Direct";
  if (s.includes("(not set)") || s.includes("data not available")) return "Unattributed";
  return "Referral/Other";
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const md = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;

export async function fetchFunnelTrend(weeks = 4): Promise<FunnelTrendResult> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) return { configured: false, reason: "GA4_PROPERTY_ID not set" };
  if (!hasAuthConfigured()) {
    return { configured: false, reason: "GA4 auth not set" };
  }
  let token: string | null;
  try {
    token = await getAccessToken();
  } catch (err) {
    return { configured: true, error: err instanceof Error ? err.message : "Token exchange failed" };
  }
  if (!token) return { configured: false, reason: "GA4 credentials malformed" };
  const tok = token;

  // Rolling 7-day windows, oldest → newest, ending today.
  const ranges: { start: Date; end: Date }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 7 * i);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 6);
    ranges.push({ start, end });
  }

  const usersByEvent = (rows: RunReportResponse["rows"]): Record<string, number> => {
    const m: Record<string, number> = {};
    for (const r of rows ?? []) {
      const n = r.dimensionValues?.[0]?.value ?? "";
      if (n) m[n] = parseFloat(r.metricValues?.[0]?.value ?? "0") || 0;
    }
    return m;
  };

  try {
    const perWeek = await Promise.all(
      ranges.map(async (r): Promise<FunnelWeek> => {
        const dateRanges = [{ startDate: ymd(r.start), endDate: ymd(r.end) }];
        const [ev, tot] = await Promise.all([
          runReport(propertyId, tok, {
            dateRanges,
            dimensions: [{ name: "eventName" }],
            metrics: [{ name: "totalUsers" }],
            limit: "200",
          }),
          runReport(propertyId, tok, {
            dateRanges,
            dimensions: [{ name: "sessionSourceMedium" }],
            metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "engagedSessions" }],
            limit: "500",
          }),
        ]);
        const evMap = usersByEvent(ev.rows);
        let users = 0, sessions = 0, engaged = 0;
        for (const row of tot.rows ?? []) {
          const m = row.metricValues ?? [];
          users += parseFloat(m[0]?.value ?? "0") || 0;
          sessions += parseFloat(m[1]?.value ?? "0") || 0;
          engaged += parseFloat(m[2]?.value ?? "0") || 0;
        }
        return {
          label: `${md(r.start)}–${md(r.end)}`,
          visited: users,
          viewed: evMap.view_item ?? 0,
          cart: evMap.add_to_cart ?? 0,
          checkout: evMap.begin_checkout ?? 0,
          purchase: evMap.purchase ?? 0,
          sessions,
          engaged,
        };
      }),
    );

    // By-source for the most recent window.
    const last = ranges[ranges.length - 1];
    const dr = [{ startDate: ymd(last.start), endDate: ymd(last.end) }];
    const [srcEv, srcTot] = await Promise.all([
      runReport(propertyId, tok, {
        dateRanges: dr,
        dimensions: [{ name: "sessionSourceMedium" }, { name: "eventName" }],
        metrics: [{ name: "totalUsers" }],
        limit: "2000",
      }),
      runReport(propertyId, tok, {
        dateRanges: dr,
        dimensions: [{ name: "sessionSourceMedium" }],
        metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "engagedSessions" }],
        limit: "500",
      }),
    ]);
    const agg: Record<string, { users: number; sessions: number; engaged: number }> = {};
    for (const row of srcTot.rows ?? []) {
      const ch = channelOf(row.dimensionValues?.[0]?.value ?? "");
      const m = row.metricValues ?? [];
      const a = (agg[ch] ??= { users: 0, sessions: 0, engaged: 0 });
      a.users += parseFloat(m[0]?.value ?? "0") || 0;
      a.sessions += parseFloat(m[1]?.value ?? "0") || 0;
      a.engaged += parseFloat(m[2]?.value ?? "0") || 0;
    }
    const evAgg: Record<string, Record<string, number>> = {};
    for (const row of srcEv.rows ?? []) {
      const ch = channelOf(row.dimensionValues?.[0]?.value ?? "");
      const en = row.dimensionValues?.[1]?.value ?? "";
      (evAgg[ch] ??= {})[en] = (evAgg[ch][en] ?? 0) + (parseFloat(row.metricValues?.[0]?.value ?? "0") || 0);
    }
    const bySource: FunnelSource[] = Object.keys(agg)
      .map((ch) => ({
        channel: ch,
        users: agg[ch].users,
        engRate: agg[ch].sessions > 0 ? agg[ch].engaged / agg[ch].sessions : 0,
        viewed: evAgg[ch]?.view_item ?? 0,
        cart: evAgg[ch]?.add_to_cart ?? 0,
        checkout: evAgg[ch]?.begin_checkout ?? 0,
        buy: evAgg[ch]?.purchase ?? 0,
      }))
      .filter((s) => s.users > 0)
      .sort((a, b) => b.users - a.users);

    return { configured: true, weeks: perWeek, bySource };
  } catch (err) {
    return { configured: true, error: err instanceof Error ? err.message : "GA4 funnel query failed" };
  }
}

export async function fetchTodaySnapshot(): Promise<Ga4Result> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    return { configured: false, reason: "GA4_PROPERTY_ID not set" };
  }
  if (!hasAuthConfigured()) {
    return {
      configured: false,
      reason:
        "GA4 auth not set — add GA4_OAUTH_CLIENT_ID + GA4_OAUTH_CLIENT_SECRET + GA4_OAUTH_REFRESH_TOKEN (or GA4_SERVICE_ACCOUNT_JSON)",
    };
  }
  let token: string | null;
  try {
    token = await getAccessToken();
  } catch (err) {
    return {
      configured: true,
      error: err instanceof Error ? err.message : "Token exchange failed",
    };
  }
  if (!token) {
    return { configured: false, reason: "GA4 credentials malformed" };
  }

  const dateRanges = [{ startDate: "today", endDate: "today" }];

  try {
    const [overview, eventCounts, products, sources] = await Promise.all([
      runReport(propertyId, token, {
        dateRanges,
        metrics: [
          { name: "totalRevenue" },
          { name: "transactions" },
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "engagementRate" },
        ],
      }),
      runReport(propertyId, token, {
        dateRanges,
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        limit: "100",
      }),
      runReport(propertyId, token, {
        dateRanges,
        dimensions: [{ name: "itemName" }],
        metrics: [{ name: "itemRevenue" }, { name: "itemsPurchased" }],
        orderBys: [{ metric: { metricName: "itemRevenue" }, desc: true }],
        limit: "5",
      }),
      runReport(propertyId, token, {
        dateRanges,
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "5",
      }),
    ]);

    const ov = overview.rows?.[0]?.metricValues ?? [];
    const revenue = parseFloat(ov[0]?.value ?? "0") || 0;
    const transactions = parseFloat(ov[1]?.value ?? "0") || 0;
    const sessions = parseFloat(ov[2]?.value ?? "0") || 0;
    const users = parseFloat(ov[3]?.value ?? "0") || 0;
    const activeUsers = parseFloat(ov[4]?.value ?? "0") || 0;
    const pageViews = parseFloat(ov[5]?.value ?? "0") || 0;
    const engagementRate = parseFloat(ov[6]?.value ?? "0") || 0;

    const evtMap: Record<string, number> = {};
    for (const r of eventCounts.rows ?? []) {
      const name = r.dimensionValues?.[0]?.value ?? "";
      const count = parseFloat(r.metricValues?.[0]?.value ?? "0") || 0;
      if (name) evtMap[name] = count;
    }

    const today = new Date().toISOString().slice(0, 10);

    return {
      configured: true,
      range: { start: today, end: today },
      revenue,
      transactions,
      sessions,
      users,
      activeUsers,
      pageViews,
      engagementRate,
      conversionRate: sessions > 0 ? transactions / sessions : 0,
      events: {
        page_view: evtMap.page_view ?? 0,
        view_item: evtMap.view_item ?? 0,
        select_vehicle: evtMap.select_vehicle ?? 0,
        add_to_cart: evtMap.add_to_cart ?? 0,
        begin_checkout: evtMap.begin_checkout ?? 0,
        purchase: evtMap.purchase ?? 0,
        sign_up: evtMap.sign_up ?? 0,
        login: evtMap.login ?? 0,
        search: evtMap.search ?? 0,
      },
      topProducts: (products.rows ?? []).map((r) => ({
        name: r.dimensionValues?.[0]?.value ?? "(unknown)",
        revenue: parseFloat(r.metricValues?.[0]?.value ?? "0") || 0,
        quantity: parseFloat(r.metricValues?.[1]?.value ?? "0") || 0,
      })),
      topSources: (sources.rows ?? []).map((r) => ({
        source: r.dimensionValues?.[0]?.value ?? "(direct)",
        sessions: parseFloat(r.metricValues?.[0]?.value ?? "0") || 0,
      })),
    };
  } catch (err) {
    return {
      configured: true,
      error: err instanceof Error ? err.message : "GA4 query failed",
    };
  }
}
