import { NextRequest, NextResponse } from "next/server";

const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||"https://bgvgstpoypqbjnemqcqp.supabase.co";

export async function GET(req:NextRequest){
  const p=req.nextUrl.searchParams;const mode=p.get("mode")||((p.get("featured")==="1")?"featured":(p.get("b2b")==="1")?"b2b":"search");
  const payload:any={mode};
  if(mode==="search")payload.q=(p.get("q")||"").trim().slice(0,700);
  if(p.get("limit"))payload.limit=Math.min(50,Math.max(1,Number(p.get("limit"))||8));
  if(mode==="notifications")payload.audience=p.get("audience")==="b2b"?"b2b":"b2c";
  if(mode==="search"&&payload.q.length<2)return NextResponse.json({items:[],pains:[]});
  const response=await fetch(`${supabaseUrl}/functions/v1/foundry-search`,{method:"POST",headers:{"content-type":"application/json","x-forwarded-for":req.headers.get("x-forwarded-for")||""},body:JSON.stringify(payload),cache:"no-store"});
  const data=await response.json().catch(()=>({items:[],error:"invalid_backend_response"}));
  const cache=mode==="status"||mode==="search"?"no-store":mode==="pains"?"public, max-age=120, s-maxage=300":"public, max-age=30, s-maxage=90";
  return NextResponse.json(data,{status:response.ok?200:response.status,headers:{"cache-control":cache}});
}
