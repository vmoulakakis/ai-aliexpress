export const ANALYTICS_EVENTS = {
  SESSION_STARTED: "session_started",
  PAGE_VIEW: "page_view",
  SEASONAL_SECTION_VIEWED: "seasonal_section_viewed",
  SEASONAL_PRODUCT_SELECTED: "seasonal_product_selected",
  SEARCH_STARTED: "search_started",
  SEARCH_COMPLETED: "search_completed",
  SEARCH_ZERO_RESULTS: "search_zero_results",
  PRODUCT_IMPRESSION: "product_impression",
  PRODUCT_OPENED: "product_opened",
  PRODUCT_SAVED: "product_saved",
  COMPARISON_STARTED: "comparison_started",
  COMPARISON_COMPLETED: "comparison_completed",
  CHAT_OPENED: "chat_opened",
  CHAT_MESSAGE_SENT: "chat_message_sent",
  CHAT_RECOMMENDATION_SHOWN: "chat_recommendation_shown",
  FUNNEL_STEP_VIEWED: "funnel_step_viewed",
  FUNNEL_STEP_COMPLETED: "funnel_step_completed",
  TRUST_EVIDENCE_VIEWED: "trust_evidence_viewed",
  OFFER_POPUP_SHOWN: "offer_popup_shown",
  OFFER_POPUP_ACCEPTED: "offer_popup_accepted",
  OUTBOUND_INTENT: "outbound_intent",
  OUTBOUND_CLICK: "outbound_click",
  AFFILIATE_REDIRECT_SUCCESS: "affiliate_redirect_success",
  AFFILIATE_REDIRECT_FAILED: "affiliate_redirect_failed",
  CONVERSION_REPORTED: "conversion_reported",
  AGENT_DECISION: "agent_decision",
  PRODUCT_REJECTED: "product_rejected",
  EXPERIMENT_EXPOSURE: "experiment_exposure",
  SESSION_REPLAY_CHUNK: "session_replay_chunk",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type AnalyticsProperties = Record<string, JsonValue>;

export interface AnalyticsEventEnvelope {
  eventId: string;
  event: AnalyticsEventName;
  occurredAt: string;
  visitorId: string;
  sessionId: string;
  path?: string;
  referrer?: string;
  properties?: AnalyticsProperties;
}

export function analyticsId(prefix: "evt" | "vis" | "ses") {
  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${value}`;
}
