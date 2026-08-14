export type VerificationState = "verified" | "not_eu" | "not_free" | "unknown" | string;

export type Product = {
  productId?: string;
  title?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  originalPrice?: number;
  productUrl?: string;
  promotionLink?: string;
  sales?: number;
  positiveFeedbackRate?: string | number;
  category?: string;
  rank?: number;
  matchScore?: number;
  why?: string;
  verification?: {
    euWarehouse?: VerificationState;
    freeShipping?: VerificationState;
    positiveFeedback?: string | number | null;
  };
};

export type SearchResponse = {
  status?: "complete" | "clarify" | string;
  understood?: string;
  query?: string;
  question?: string | null;
  options?: string[];
  products?: Product[];
  warnings?: string[];
};

export type ChatResponse = {
  sessionId?: string;
  reply?: string;
  action?: string;
  suggestedReplies?: string[];
  products?: Product[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  products?: Product[];
};
