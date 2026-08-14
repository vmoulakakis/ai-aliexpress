const DEFAULT_FUNCTIONS_BASE = "https://bgvgstpoypqbjnemqcqp.supabase.co/functions/v1";
const UPSTREAM_TIMEOUT_MS = 35_000;

export function functionsBase() {
  return process.env.NHMA_FUNCTIONS_URL?.replace(/\/$/, "") || DEFAULT_FUNCTIONS_BASE;
}

export async function relayJson(path: string, body?: unknown, method: "GET" | "POST" = "POST") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetch(`${functionsBase()}/${path}`, {
      method,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...(method === "POST" ? { "content-type": "application/json" } : {}),
      },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    });

    const data = await response.json().catch(() => ({ error: "invalid_upstream_response" }));
    return { status: response.status, data };
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    return {
      status: timedOut ? 504 : 502,
      data: { error: timedOut ? "upstream_timeout" : "upstream_unavailable" },
    };
  } finally {
    clearTimeout(timer);
  }
}
