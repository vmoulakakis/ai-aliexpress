export type DeepSeekIntent = {
  normalized_query: string;
  mode: "product" | "pain" | "merchant";
  budget_eur?: number;
  keywords: string[];
};

const endpoint = "https://api.deepseek.com/chat/completions";

export async function interpretWithDeepSeek(query: string, usePro = false): Promise<DeepSeekIntent | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  const model = usePro ? (process.env.DEEPSEEK_PRO_MODEL || "deepseek-v4-pro") : (process.env.DEEPSEEK_FAST_MODEL || "deepseek-v4-flash");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), usePro ? 7000 : 3500);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 220,
        messages: [
          { role: "system", content: "Είσαι parser ελληνικής αγοραστικής πρόθεσης. Επέστρεψε μόνο JSON: normalized_query, mode(product|pain|merchant), budget_eur προαιρετικό, keywords έως 6. Μην προτείνεις προϊόντα." },
          { role: "user", content: query.slice(0, 700) }
        ]
      }),
      signal: controller.signal,
      cache: "no-store"
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content;
    if (!text) return null;
    return JSON.parse(text) as DeepSeekIntent;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function needsProReview(query: string) {
  const q = query.toLowerCase();
  return query.length > 220 || /(συμβατ|ασφαλ|τεχνικ|ποιο από|σύγκριν|εναλλακ)/i.test(q);
}
