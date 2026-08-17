const endpoint="https://bgvgstpoypqbjnemqcqp.supabase.co/functions/v1/nhma-activity-v4";
const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({limit:8})});
const data=await response.json().catch(()=>({}));
if(!response.ok)throw new Error(`activity HTTP ${response.status}: ${JSON.stringify(data)}`);
const activity=Array.isArray(data.activity)?data.activity:[];
console.log(`Truthful activity rows: ${activity.length}`);
for(const item of activity){
 if(!["view","purchase"].includes(String(item.kind)))throw new Error(`Invalid activity kind ${item.kind}`);
 if(item.trackingPath&&!/^\/go\/[a-f0-9]+$/i.test(String(item.trackingPath)))throw new Error("Activity tracking path invalid");
 if(item.warehouseCountry&&!/^[A-Z]{2}$/.test(String(item.warehouseCountry)))throw new Error("Activity warehouse invalid");
 if(item.kind==="purchase")console.log(`Verified purchase activity present for product ${item.productId}`);
}
if(activity.length<1)throw new Error("Expected at least one real recent activity row after Stage4 redirect gate");
console.log("Stage5 truthful social-proof gate passed.");
