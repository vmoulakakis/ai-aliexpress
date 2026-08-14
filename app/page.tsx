import { CommerceShell } from "@/components/commerce-shell";

export const dynamic = "force-dynamic";

export default function Page() {
  const month = new Date().getUTCMonth() + 1;
  const season = month >= 7 && month <= 9 ? "bts" : "general";
  return <CommerceShell season={season} />;
}
