const endpoint = "https://bgvgstpoypqbjnemqcqp.supabase.co/functions/v1/nhma-eu-web-discover";
const response = await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({query:"robot vacuum",countries:["ES","FR","PL"]})});
const data=await response.json().catch(()=>({}));
if(!response.ok)throw new Error(`EU edge probe HTTP ${response.status}: ${JSON.stringify(data)}`);
const products=Array.isArray(data.products)?data.products:[];
console.log(`EU edge discovery: ${products.length} verified IDs`, data.results);
if(products.length<1)throw new Error("Supabase edge fetch could not extract any product IDs from explicit shipFromCountry pages");
if(products.some((p)=>!/^\d{8,}$/.test(String(p.productId||""))||!/[?&]shipFromCountry=/.test(String(p.proofUrl||""))))throw new Error("Invalid EU evidence record");
console.log("Supabase EU warehouse edge discovery passed.");
