import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_HOSTS = ["alicdn.com", "aliexpress-media.com"] as const;

function allowedHostname(hostname: string) {
  const host = hostname.toLowerCase();
  return ALLOWED_HOSTS.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const raw = requestUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "missing_url" }, { status: 400 });

  let remote: URL;
  try {
    remote = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  if (remote.protocol !== "https:" || !allowedHostname(remote.hostname)) {
    return NextResponse.json({ error: "image_host_not_allowed" }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(remote, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "user-agent": "Mozilla/5.0 (compatible; EU-Scout/3.0; +https://example.invalid)",
      },
    });

    if (!response.ok) return NextResponse.json({ error: "image_upstream_failed" }, { status: 502 });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ error: "invalid_image_type" }, { status: 502 });
    }

    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "image_too_large" }, { status: 413 });
    }

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "image_too_large" }, { status: 413 });
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const timeout = error instanceof DOMException && error.name === "AbortError";
    return NextResponse.json({ error: timeout ? "image_timeout" : "image_fetch_failed" }, { status: timeout ? 504 : 502 });
  } finally {
    clearTimeout(timer);
  }
}
