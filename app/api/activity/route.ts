import { NextResponse } from "next/server";
import { relayJson } from "@/lib/upstream";

export const dynamic = "force-dynamic";
export async function GET(){const{status,data}=await relayJson("nhma-activity-v4",{limit:6},"POST");return NextResponse.json(data,{status})}
