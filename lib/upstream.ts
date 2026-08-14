const DEFAULT_FUNCTIONS_BASE = "https://bgvgstpoypqbjnemqcqp.supabase.co/functions/v1";

export function functionsBase() {
  return process.env.NHMA_FUNCTIONS_URL?.replace(/\/$/, "") || DEFAULT_FUNCTIONS_BASE;
}

export async function relayJson(path: string, body?: unknown, method: "GET" | "POST" = "POST") {
  const response = await fetch(`${functionsBase()}/${path}`, {
    method,
    cache: "no-store",
    headers: method === "POST" ? { "content-type": "application/json" } : undefined,
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  });

  const data = await response.json().catch(() => ({ error: "invalid_upstream_response" }));
  return { status: response.status, data };
}
