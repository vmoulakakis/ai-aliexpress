"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ANALYTICS_EVENTS,
  analyticsId,
  type AnalyticsEventName,
  type AnalyticsProperties,
  type JsonValue,
} from "@/lib/analytics/events";

type AnalyticsContextValue = {
  enabled: boolean;
  visitorId: string | null;
  sessionId: string | null;
  track: (event: AnalyticsEventName, properties?: AnalyticsProperties) => void;
};

const AnalyticsContext = createContext<AnalyticsContextValue>({
  enabled: false,
  visitorId: null,
  sessionId: null,
  track: () => undefined,
});

const VISITOR_KEY = "eu_scout_visitor_id";
const SESSION_KEY = "eu_scout_session_id";
const CONSENT_KEY = "eu_scout_analytics_consent";
const REPLAY_BATCH_SIZE = 35;
const REPLAY_FLUSH_MS = 5_000;

function readOrCreate(storage: Storage, key: string, prefix: "vis" | "ses") {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const next = analyticsId(prefix);
  storage.setItem(key, next);
  return next;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const enabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";
  const replayEnabled = process.env.NEXT_PUBLIC_SESSION_REPLAY_ENABLED === "true";
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const replayBuffer = useRef<JsonValue[]>([]);
  const replayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    setVisitorId(readOrCreate(window.localStorage, VISITOR_KEY, "vis"));
    setSessionId(readOrCreate(window.sessionStorage, SESSION_KEY, "ses"));
  }, [enabled]);

  const track = useCallback(
    (event: AnalyticsEventName, properties: AnalyticsProperties = {}) => {
      if (!enabled || !visitorId || !sessionId || typeof window === "undefined") return;

      const body = {
        eventId: analyticsId("evt"),
        event,
        occurredAt: new Date().toISOString(),
        visitorId,
        sessionId,
        path: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer || undefined,
        properties,
      };

      void fetch("/api/analytics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => undefined);
    },
    [enabled, sessionId, visitorId],
  );

  useEffect(() => {
    if (!enabled || !visitorId || !sessionId) return;
    track(ANALYTICS_EVENTS.SESSION_STARTED, {
      language: navigator.language,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
    track(ANALYTICS_EVENTS.PAGE_VIEW);
  }, [enabled, sessionId, track, visitorId]);

  useEffect(() => {
    if (!enabled || !replayEnabled || !visitorId || !sessionId) return;
    if (window.localStorage.getItem(CONSENT_KEY) !== "granted") return;

    let stopped = false;
    let stopRecording: (() => void) | undefined;

    const flush = () => {
      if (!replayBuffer.current.length) return;
      const events = replayBuffer.current.splice(0, replayBuffer.current.length);
      track(ANALYTICS_EVENTS.SESSION_REPLAY_CHUNK, { events });
    };

    const scheduleFlush = () => {
      if (replayTimer.current) return;
      replayTimer.current = setTimeout(() => {
        replayTimer.current = null;
        flush();
      }, REPLAY_FLUSH_MS);
    };

    void import("rrweb").then(({ record }) => {
      if (stopped) return;
      const stop = record({
        emit(event) {
          replayBuffer.current.push(event as unknown as JsonValue);
          if (replayBuffer.current.length >= REPLAY_BATCH_SIZE) flush();
          else scheduleFlush();
        },
        maskAllInputs: true,
        blockClass: "rr-block",
      });
      if (typeof stop === "function") stopRecording = stop;
    });

    return () => {
      stopped = true;
      stopRecording?.();
      if (replayTimer.current) clearTimeout(replayTimer.current);
      replayTimer.current = null;
      flush();
    };
  }, [enabled, replayEnabled, sessionId, track, visitorId]);

  const value = useMemo(
    () => ({ enabled, visitorId, sessionId, track }),
    [enabled, sessionId, track, visitorId],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  return useContext(AnalyticsContext);
}
