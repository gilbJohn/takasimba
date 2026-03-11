"use strict";(()=>{var e={};e.id=912,e.ids=[912],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8891:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>f,patchFetch:()=>h,requestAsyncStorage:()=>c,routeModule:()=>u,serverHooks:()=>d,staticGenerationAsyncStorage:()=>m});var s={};r.r(s),r.d(s,{POST:()=>l});var o=r(9303),a=r(8716),n=r(670),i=r(7070);let p=`You parse workout descriptions into JSON. Return ONLY valid JSON, no markdown, no code blocks.

EXACT output format (effort and form optional, 1-5 scale):
{"name":"string","exercises":[{"exerciseName":"string","muscleGroup":"string","sets":[{"reps":number,"weight":number,"effort":1-5,"form":1-5}]}]}
EFFORT: 1=easy, 5=max. Infer from "easy","hard","struggled" etc. Default 3 if unclear.
FORM: 1=poor, 5=perfect. Infer from "good form","sloppy" etc. Default 4 if unclear.

EXERCISE NAME MAPPINGS (use these exact names):
- bench press → Bench Press
- dips → Dip
- chest supported rows, chest supported row → Chest Supported Row
- weighted pullups, pullups, pull ups → Pull Up
- tricep pushdowns, tricep pushdown → Tricep Pushdown
- bicep curls, bicep curl → Barbell Curl
- reverse delt flys, rear delt flys → Rear Delt Fly
- side delt flys, lateral raises → Lateral Raise

MUSCLE GROUPS (use exactly): chest, back, shoulders, biceps, triceps, quads, hamstrings, glutes, calves, core

WEIGHT: Use pounds (lbs) as-is. "95 pounds" = 95, "65 pounds" = 65. No conversion.

SETS: Create one object per set. If "2 sets 8 and 6 reps" → two sets: {reps:8, weight:X}, {reps:6, weight:X}.
If "12 reps then 8 reps" → two sets with same weight.
If "15 reps each" for 2 sets → two identical sets.

ORDER: Keep exercises in the order the user listed them.`;async function l(e){try{let t;let{text:r}=await e.json();if(!r||"string"!=typeof r)return i.NextResponse.json({error:"Missing or invalid text"},{status:400});let s=process.env.GEMINI_API_KEY;if(!s)return i.NextResponse.json({error:"GEMINI_API_KEY not configured"},{status:500});let o=null,a="";for(let e of["v1beta/models/gemini-2.5-flash","v1beta/models/gemini-2.0-flash","v1beta/models/gemini-2.0-flash-001","v1beta/models/gemini-2.0-flash-lite","v1beta/models/gemini-2.0-flash-lite-001","v1beta/models/gemini-2.5-pro","v1beta/models/gemini-exp-1206"]){if((o=await fetch(`https://generativelanguage.googleapis.com/${e}:generateContent?key=${s}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:`${p}

User input:
${r}`}]}],generationConfig:{temperature:.1,maxOutputTokens:2048,responseMimeType:"application/json"}})})).ok)break;if(a=await o.text(),429===o.status){let t=a.match(/retry in (\d+(?:\.\d+)?)ms/),n=a.match(/retry in (\d+(?:\.\d+)?)s/),i=t?Math.ceil(parseFloat(t[1])):n?Math.ceil(1e3*parseFloat(n[1])):1e3;await new Promise(e=>setTimeout(e,Math.min(i,1e4)));let l=await fetch(`https://generativelanguage.googleapis.com/${e}:generateContent?key=${s}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:`${p}

User input:
${r}`}]}],generationConfig:{temperature:.1,maxOutputTokens:2048,responseMimeType:"application/json"}})});if(l.ok){o=l;break}o=l,a=await l.text()}if(404!==o.status&&429!==o.status)break}if(!o||!o.ok){console.error("Gemini API error:",o?.status??"no response",a);let e="AI service error";try{let t=JSON.parse(a);e=t.error?.message??t.error??a.slice(0,300)}catch{e=a.slice(0,300)||e}return i.NextResponse.json({error:e},{status:502})}let n=await o.json(),l=n.candidates?.[0]?.content?.parts?.[0]?.text;if(!l){let e=n.candidates?.[0]?.finishReason;return i.NextResponse.json({error:"SAFETY"===e?"Content was blocked by safety filters":"No response from AI"},{status:502})}let u=(l=l.trim()).match(/```(?:json)?\s*([\s\S]*?)```/);u&&(l=u[1].trim());let c=(l=l.replace(/,\s*}/g,"}").replace(/,\s*]/g,"]")).indexOf("{");if(c>0&&(l=l.slice(c)),l.indexOf("{")>=0){let e=0,t=-1;for(let r=0;r<l.length;r++)if("{"===l[r])e++;else if("}"===l[r]&&(e--,0===e)){t=r+1;break}t>0&&(l=l.slice(0,t))}try{t=JSON.parse(l)}catch(e){return console.error("Parse workout JSON fail. Raw content:",l.slice(0,500)),i.NextResponse.json({error:"AI returned invalid JSON. Try rephrasing your workout."},{status:502})}if(!t.exercises||!Array.isArray(t.exercises))return i.NextResponse.json({error:"AI response missing exercises array"},{status:502});let m=["chest","back","shoulders","biceps","triceps","quads","hamstrings","glutes","calves","core"],d={name:t.name||"Workout",exercises:t.exercises.filter(e=>e&&e.exerciseName&&e.sets?.length).map(e=>{let t=String(e.muscleGroup||"chest").toLowerCase().replace(/\s+/g,"");return m.includes(t)||(t=m.find(e=>e.includes(t)||t.includes(e))||"chest"),{exerciseName:String(e.exerciseName).trim(),muscleGroup:t,sets:(e.sets||[]).filter(e=>e&&("number"==typeof e.reps||"string"==typeof e.reps)&&Number(e.reps)>0).map(e=>({reps:Math.round(Number(e.reps))||1,weight:Math.max(0,Number(e.weight)||0),...null!=e.effort&&{effort:Math.min(5,Math.max(1,Math.round(Number(e.effort))))},...null!=e.form&&{form:Math.min(5,Math.max(1,Math.round(Number(e.form))))}}))}}).filter(e=>e.sets.length>0)};return i.NextResponse.json(d)}catch(e){return console.error("Parse workout error:",e),i.NextResponse.json({error:e instanceof Error?e.message:"Failed to parse workout"},{status:500})}}let u=new o.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/parse-workout/route",pathname:"/api/parse-workout",filename:"route",bundlePath:"app/api/parse-workout/route"},resolvedPagePath:"C:\\Users\\johnh\\sideProjects\\LiftingApp\\app\\api\\parse-workout\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:c,staticGenerationAsyncStorage:m,serverHooks:d}=u,f="/api/parse-workout/route";function h(){return(0,n.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:m})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[276,972],()=>r(8891));module.exports=s})();