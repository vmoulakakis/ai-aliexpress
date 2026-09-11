"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getSolutionRecovery } from "@/lib/solution-recovery";

export default function SolutionFirstRecovery(){
  const [query,setQuery]=useState("");
  const [target,setTarget]=useState<Element|null>(null);
  const [hasVerifiedProduct,setHasVerifiedProduct]=useState(false);
  const recovery=useMemo(()=>getSolutionRecovery(query),[query]);

  useEffect(()=>{
    let input:HTMLInputElement|null=null;
    const sync=()=>{
      const dropdown=document.querySelector('.searchBox .dropdown');
      setTarget(dropdown);
      setHasVerifiedProduct(Boolean(dropdown?.querySelector('.dropItem')));
      const current=document.querySelector('.searchBox input') as HTMLInputElement|null;
      if(current&&current!==input){
        if(input)input.removeEventListener('input',onInput);
        input=current;
        input.addEventListener('input',onInput);
        setQuery(input.value);
      }
    };
    const onInput=(event:Event)=>{setQuery((event.target as HTMLInputElement).value);queueMicrotask(sync)};
    sync();
    const observer=new MutationObserver(sync);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>{observer.disconnect();if(input)input.removeEventListener('input',onInput)};
  },[]);

  if(!target||hasVerifiedProduct||!recovery||query.trim().length<2)return null;

  return createPortal(
    <section aria-live="polite" style={{margin:"10px 12px 12px",padding:"14px",border:"1px solid rgba(127,127,127,.25)",borderRadius:"14px",background:"rgba(255,255,255,.04)"}}>
      <strong>Δεν βρήκα πλήρως verified προϊόν — αλλά δεν χρειάζεται να μείνεις χωρίς λύση.</strong>
      <p style={{margin:"8px 0 6px"}}>{recovery.title}</p>
      <ol style={{margin:"0 0 8px",paddingLeft:"20px"}}>{recovery.actions.map(action=><li key={action} style={{marginBottom:"4px"}}>{action}</li>)}</ol>
      <p style={{margin:"6px 0"}}><b>Για καλύτερο match:</b> {recovery.question}</p>
      {recovery.productFamily&&<small>Κατηγορία προς έλεγχο — όχι αυτόματη σύσταση: {recovery.productFamily}.</small>}
      {recovery.safety&&<small style={{display:"block",marginTop:"6px"}}>⚠ {recovery.safety}</small>}
    </section>,
    target
  );
}
