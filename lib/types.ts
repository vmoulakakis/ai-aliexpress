export type VerificationState = "verified" | "not_eu" | "not_free" | "unknown" | string;

export type ProductDecision = {
  role?: "best_match" | "best_value" | "alternative" | string;
  fitScore?: number;
  strengths?: string[];
  limitations?: string[];
  verifiedFields?: string[];
  unknownFields?: string[];
};

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
  shipFrom?: string;
  delivery?: string | number;
  shipping?: number;
  commissionRate?: string | number;
  warehouseCountry?: string;
  warehouseProofUrl?: string;
  warehouseVerifiedAt?: string;
  warehouseVerificationSource?: string;
  decision?: ProductDecision;
  verification?: {
    euWarehouse?: VerificationState;
    freeShipping?: VerificationState;
    positiveFeedback?: string | number | null;
  };
};

export type SearchAnalysis = {
  runs?: number;
  queriesUsed?: string[];
  upstreamEligible?: number;
  rejectedByEuGate?: number;
  rejectedMissingAffiliate?: number;
  euEvidenceCount?: number;
  detailChecked?: number;
  detailMissing?: number;
  rejectedIdentity?: number;
  rejectedBudget?: number;
  rejectedAffiliate?: number;
  cacheHits?: number;
  verifiedCount?: number;
  hardRules?: {
    euWarehouse?: boolean;
    affiliateTrackingUrl?: boolean;
    shipToCountry?: string;
  };
};

export type RecoveryOption = { label: string; query: string; priority?: number };

export type SearchResponse = {
  status?: "complete" | "clarify" | "recovery" | string;
  understood?: string;
  query?: string;
  question?: string | null;
  options?: string[];
  products?: Product[];
  warnings?: string[];
  recoveryOptions?: RecoveryOption[];
  analysis?: SearchAnalysis;
  source?: string;
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
