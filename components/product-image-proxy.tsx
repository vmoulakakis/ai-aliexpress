"use client";

import { useEffect } from "react";

const ALLOWED_HOSTS = ["alicdn.com", "aliexpress-media.com"] as const;

function shouldProxy(url: URL) {
  const host = url.hostname.toLowerCase();
  return url.protocol === "https:" && ALLOWED_HOSTS.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
}

function proxyImage(image: HTMLImageElement) {
  const current = image.getAttribute("src");
  if (!current || current.startsWith("/api/image?") || current.startsWith("data:") || current.startsWith("blob:")) return;
  try {
    const remote = new URL(current, window.location.href);
    if (!shouldProxy(remote)) return;
    image.src = `/api/image?url=${encodeURIComponent(remote.href)}`;
  } catch {
    // Ignore malformed image URLs; the card's visual fallback remains visible.
  }
}

export function ProductImageProxy() {
  useEffect(() => {
    const scan = (root: ParentNode) => {
      root.querySelectorAll?.("img").forEach((node) => proxyImage(node as HTMLImageElement));
    };

    scan(document);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.target instanceof HTMLImageElement) {
          proxyImage(mutation.target);
          continue;
        }
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) proxyImage(node);
          else if (node instanceof HTMLElement) scan(node);
        });
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["src"],
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
