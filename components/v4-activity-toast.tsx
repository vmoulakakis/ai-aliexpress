"use client";

import { useEffect, useState } from "react";

type Activity = { kind:"view"|"purchase"; createdAt:string; productId:string; title:string; imageUrl?:string; price?:number|null; currency?:string; trackingPath?:string; warehouseCountry?:string };
function price(v?:number|null,c="EUR"){if(!Number.isFinite(Number(v)))return"";try{return new Intl.NumberFormat("el-GR",{style:"currency",currency:c,maximumFractionDigits:2}).format(Number(v))}catch{return""}}
function age(value:string){const sec=Math.max(0,Math.round((Date.now()-new Date(value).getTime())/1000));if(sec<60)return"μόλις τώρα";if(sec<3600)return`πριν ${Math.round(sec/60)} λεπτά`;if(sec<86400)return`πριν ${Math.round(sec/3600)} ώρες`;return"πρόσφατα"}
export function V4ActivityToast(){
 const[items,setItems]=useState<Activity[]>([]),[index,setIndex]=useState(0),[open,setOpen]=useState(false);
 useEffect(()=>{let active=true;const load=async()=>{try{const r=await fetch("/api/activity",{cache:"no-store"});const d=await r.json();if(active&&Array.isArray(d.activity)&&d.activity.length){setItems(d.activity);window.setTimeout(()=>setOpen(true),5500)}}catch{}};void load();return()=>{active=false}},[]);
 useEffect(()=>{if(!items.length)return;const timer=window.setInterval(()=>{setOpen(false);window.setTimeout(()=>{setIndex(i=>(i+1)%items.length);setOpen(true)},450)},12000);return()=>window.clearInterval(timer)},[items]);
 const item=items[index];if(!item)return null;
 return <aside className={`activity-toast ${open?"show":""}`} aria-live="polite"><button className="activity-close" aria-label="Κλείσιμο" onClick={()=>setOpen(false)}>×</button>{item.imageUrl?<img src={item.imageUrl} alt=""/>:<span className="activity-placeholder">◫</span>}<div><b>{item.kind==="purchase"?"Επιβεβαιωμένη αγορά":"Κάποιος άνοιξε αυτή την προσφορά"}</b><p>{item.title}</p><small>{price(item.price,item.currency)}{item.warehouseCountry?` · 🇪🇺 ${item.warehouseCountry}`:""} · {age(item.createdAt)}</small>{item.trackingPath&&<a href={`${item.trackingPath}?source=activity`} target="_blank" rel="sponsored noopener noreferrer">Δες την επιλογή →</a>}</div></aside>
}
