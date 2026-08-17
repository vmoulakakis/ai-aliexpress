import { POST as v4Post } from "../v4/search/route";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return v4Post(request);
}
