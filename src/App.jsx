import { useState, useEffect, useRef } from "react";

const GF = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;500;700&display=swap');`;

// ─── DARK MODE — BLUE-DOMINANT PALETTE ────────────────────────
const bg0     = "#D6E8FF";   // page background
const bg1     = "#FFFFFF";   // card surface
const bg2     = "#F0F6FF";   // raised / alt row
const bdr     = "#BDD6F5";   // borders
const blue    = "#3B82F6";   // primary accent
const blueHi  = "#60A5FA";   // lighter blue
const blueDim = "#1E3A5F";   // dark tint bg
const t0      = "#05122B";   // primary text
const t1      = "#0F2952";   // secondary text
const t2      = "#1A3D6E";   // muted
const gold    = "#D4A84B";
const goldBg  = "#1A1208";
const red     = "#E05252";
const redBg   = "#1C0A0A";
const grn     = "#2ECC87";
const grnBg   = "#091A12";
const deep    = "#0A1F40";   // CTA block bg

// ─── SHARED STYLES ─────────────────────────────────────────────
const card = { background: bg1, border: `1px solid ${bdr}`, borderRadius: 14, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.5)" };
const inp  = { width: "100%", border: `1px solid ${bdr}`, borderRadius: 8, padding: "10px 14px", fontSize: 14, color: t0, outline: "none", fontFamily: "Lato, sans-serif", background: bg2 };
const lbl  = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t1, marginBottom: 6 };
const sl   = (c) => ({ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: c || blue, marginBottom: 10 });

// ─── SCHEDULE DATA ─────────────────────────────────────────────
const TODAY = [
  { id:"C001", time:"9:00 AM",  clinic:"Modern Animal Culver City", patient:"Mochi",   species:"Feline", sex:"FS", weight:"4.2 kg",  scan:"Abdominal — Feline", vet:"Dr. Santos", status:"completed", findings:"Hepatic mass 3.2cm, mixed echogenicity. No free fluid." },
  { id:"C002", time:"10:30 AM", clinic:"Modern Animal Culver City", patient:"Biscuit", species:"Canine", sex:"MN", weight:"18.6 kg", scan:"Cardiac — Canine",    vet:"Dr. Santos", status:"completed", findings:"Mild LA enlargement. Moderate MR. EF 58%." },
  { id:"C003", time:"12:00 PM", clinic:"Modern Animal Downtown",    patient:"Luna",    species:"Canine", sex:"FS", weight:"22.4 kg", scan:"Abdominal — Canine",  vet:"Dr. Park",   status:"active",    findings:"" },
  { id:"C004", time:"1:30 PM",  clinic:"Modern Animal Downtown",    patient:"Oliver",  species:"Feline", sex:"MN", weight:"5.8 kg",  scan:"Abdominal — Feline", vet:"Dr. Park",   status:"upcoming",  findings:"" },
  { id:"C005", time:"3:00 PM",  clinic:"VCA West LA",               patient:"Bear",    species:"Canine", sex:"M",  weight:"34.2 kg", scan:"FAST + Abdominal",   vet:"Dr. Kim",    status:"upcoming",  findings:"" },
];
const TRAVEL = {
  "Modern Animal Culver City→Modern Animal Downtown": { dist:"11.2 mi", time:"22 min" },
  "Modern Animal Downtown→VCA West LA":              { dist:"8.7 mi",  time:"18 min" },
};

// ─── GEO BOOKING ───────────────────────────────────────────────
const GEO = {
  Monday:    { label:"West LA / Flex Day",                     icon:"🌊", regions:["Santa Monica","Brentwood","West Hollywood","Beverly Hills","Culver City","Marina del Rey","Venice","Westwood","Bel Air"], booked:3 },
  Tuesday:   { label:"Ventura County + Santa Barbara",         icon:"🏔", regions:["Ventura","Oxnard","Camarillo","Thousand Oaks","Santa Barbara","Carpinteria","Goleta","Moorpark","Simi Valley"], booked:8 },
  Wednesday: { label:"Modern Animal — Culver City & Downtown", icon:"🏙", regions:["Culver City","Downtown LA","Mid-City","Koreatown","Palms","Mar Vista"], booked:11 },
  Thursday:  { label:"South Bay",                              icon:"⚓", regions:["Torrance","Redondo Beach","Hermosa Beach","Manhattan Beach","El Segundo","Hawthorne","Inglewood","Gardena"], booked:5 },
  Friday:    { label:"West LA / Flex Day",                     icon:"🌊", regions:["Santa Monica","Brentwood","West Hollywood","Beverly Hills","Culver City","Marina del Rey","Venice","Westwood"], booked:2 },
};
const SLOTS = ["8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","1:00 PM","1:30 PM","2:00 PM","2:30 PM"];
const SCANS = ["Abdominal — Canine","Abdominal — Feline","Cardiac — Canine","Cardiac — Feline","Thoracic","Musculoskeletal","Reproductive","Ocular","Lymph Node Assessment","Free Fluid Evaluation (FAST)","Other"];
function nextDates(dayName) {
  const idx = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(dayName);
  const out = []; let d = new Date(); d.setDate(d.getDate()+1);
  while(out.length < 4){ if(d.getDay()===idx) out.push(new Date(d)); d.setDate(d.getDate()+1); }
  return out;
}

// ─── BOOKING PORTAL ────────────────────────────────────────────
function BookingPortal() {
  const [step,setStep]         = useState(0);
  const [selDay,setSelDay]     = useState(null);
  const [selDate,setSelDate]   = useState(null);
  const [selTime,setSelTime]   = useState(null);
  const [city,setCity]         = useState("");
  const [cityOk,setCityOk]     = useState(null);
  const [form,setForm]         = useState({ clinicName:"",clinicEmail:"",vetName:"",patientName:"",species:"Canine",sex:"",weight:"",age:"",history:"",scanType:"",recordFile:null });
  const [done,setDone]         = useState(false);
  const fileRef = useRef();

  const checkCity = () => {
    if(!city||!selDay) return;
    const ok = GEO[selDay].regions.some(r => city.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(city.toLowerCase()));
    setCityOk(ok);
  };
  const submit = () => {
    setDone(true);
    setTimeout(() => { setStep(0);setSelDay(null);setSelDate(null);setSelTime(null);setCity("");setCityOk(null);setDone(false);setForm({clinicName:"",clinicEmail:"",vetName:"",patientName:"",species:"Canine",sex:"",weight:"",age:"",history:"",scanType:"",recordFile:null}); }, 7000);
  };

  const steps = ["Select Day","Verify Location","Patient Info","Upload Records","Confirm"];

  if(done) return (
    <div style={{...card,textAlign:"center",padding:56}}>
      <div style={{fontSize:48,marginBottom:16}}>✅</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:t0,marginBottom:10}}>Booking Confirmed</div>
      <p style={{color:t1,fontSize:14,marginBottom:20,lineHeight:1.7}}>Records are being processed. A Covet case will be ready before Dr. Eiler arrives.</p>
      <div style={{background:blueDim,border:`1px solid ${bdr}`,borderRadius:10,padding:18,textAlign:"left",fontSize:13,color:t1,lineHeight:1.9}}>
        <strong style={{color:blue}}>What happens next:</strong><br/>
        1. Records auto-uploaded to Covet — case created automatically<br/>
        2. Dr. Eiler notified of appointment<br/>
        3. Day-of: clinic receives ETA notification before arrival<br/>
        4. Post-scan: same-day report delivered to your clinic
      </div>
    </div>
  );

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",marginBottom:32}}>
        {steps.map((s,i) => (
          <div key={i} style={{display:"flex",alignItems:"center",flex:i<4?1:"none"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${step>=i?blue:bdr}`,background:step>i?blue:step===i?blueDim:bg1,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:step>i?"white":step===i?blue:t2,flexShrink:0,transition:"all 0.3s"}}>{step>i?"✓":i+1}</div>
              <div style={{fontSize:9,color:step>=i?blue:t2,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",whiteSpace:"nowrap"}}>{s}</div>
            </div>
            {i<4 && <div style={{flex:1,height:2,background:step>i?blue:bdr,margin:"0 6px",marginBottom:18,transition:"background 0.3s"}} />}
          </div>
        ))}
      </div>

      <div style={card}>
        {step===0 && (
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:t0,marginBottom:6}}>Choose Your Service Day</div>
            <p style={{color:t1,fontSize:13,marginBottom:24}}>Each day serves a specific region. Select the day matching your clinic location.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
              {Object.entries(GEO).map(([day,info]) => {
                const spots = 12 - info.booked; const full = spots===0;
                return (
                  <div key={day} onClick={()=>!full&&setSelDay(day)} style={{border:`2px solid ${selDay===day?blue:bdr}`,borderRadius:12,padding:18,cursor:full?"not-allowed":"pointer",opacity:full?0.4:1,background:selDay===day?blueDim:bg1,transition:"all 0.2s"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div style={{fontSize:22}}>{info.icon}</div>
                      <span style={{fontSize:10,padding:"3px 8px",borderRadius:20,background:full?redBg:blueDim,color:full?red:blue,fontWeight:700}}>{full?"Full":`${spots} left`}</span>
                    </div>
                    <div style={{fontWeight:700,fontSize:14,color:t0,marginBottom:2}}>{day}</div>
                    <div style={{fontSize:12,color:blue,marginBottom:8}}>{info.label}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {info.regions.slice(0,3).map(r=><span key={r} style={{fontSize:9,background:bg2,border:`1px solid ${bdr}`,borderRadius:4,padding:"2px 6px",color:t1}}>{r}</span>)}
                      {info.regions.length>3&&<span style={{fontSize:9,color:t2}}>+{info.regions.length-3} more</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <button className="btn-blue" disabled={!selDay} onClick={()=>setStep(1)} style={{opacity:selDay?1:0.4}}>Continue →</button>
            </div>
          </div>
        )}

        {step===1 && (
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:t0,marginBottom:6}}>Verify Your Clinic Location</div>
            <p style={{color:t1,fontSize:13,marginBottom:20}}><strong style={{color:blue}}>{selDay}</strong> serves: {GEO[selDay]?.regions.join(", ")}</p>
            <div style={{marginBottom:20}}>
              <label style={lbl}>Your Clinic City or Neighborhood</label>
              <div style={{display:"flex",gap:10}}>
                <input style={{...inp,flex:1}} placeholder="e.g. Torrance, Santa Monica, Ventura..." value={city} onChange={e=>{setCity(e.target.value);setCityOk(null);}} />
                <button className="btn-outline" onClick={checkCity}>Check</button>
              </div>
              {cityOk===true  && <div style={{marginTop:10,padding:"10px 14px",background:blueDim,border:`1px solid ${blue}40`,borderRadius:8,fontSize:13,color:blue,fontWeight:600}}>✓ {city} is in the {selDay} service area.</div>}
              {cityOk===false && <div style={{marginTop:10,padding:"10px 14px",background:redBg,border:`1px solid ${red}40`,borderRadius:8,fontSize:13,color:red}}>✗ {city} is not in the {selDay} service area. Try a different day.</div>}
            </div>
            <div style={{marginBottom:20}}>
              <label style={lbl}>Select a Date</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {nextDates(selDay).map((d,i) => (
                  <div key={i} onClick={()=>setSelDate(d)} style={{padding:"12px 8px",borderRadius:10,border:`2px solid ${selDate?.toDateString()===d.toDateString()?blue:bdr}`,background:selDate?.toDateString()===d.toDateString()?blueDim:bg1,textAlign:"center",cursor:"pointer",transition:"all 0.2s"}}>
                    <div style={{fontSize:10,color:t1,textTransform:"uppercase",letterSpacing:"0.08em"}}>{d.toLocaleDateString("en-US",{weekday:"short"})}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:selDate?.toDateString()===d.toDateString()?blue:t0}}>{d.getDate()}</div>
                    <div style={{fontSize:10,color:t1}}>{d.toLocaleDateString("en-US",{month:"short"})}</div>
                  </div>
                ))}
              </div>
            </div>
            {selDate && (
              <div style={{marginBottom:20}}>
                <label style={lbl}>Preferred Time</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                  {SLOTS.map(t=>(
                    <div key={t} onClick={()=>setSelTime(t)} style={{padding:"10px 8px",borderRadius:8,border:`2px solid ${selTime===t?blue:bdr}`,background:selTime===t?blueDim:bg1,textAlign:"center",cursor:"pointer",fontSize:12,color:selTime===t?blue:t1,fontWeight:selTime===t?700:400,transition:"all 0.2s"}}>{t}</div>
                  ))}
                </div>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <button className="btn-outline" onClick={()=>setStep(0)}>← Back</button>
              <button className="btn-blue" disabled={!cityOk||!selDate||!selTime} onClick={()=>setStep(2)} style={{opacity:cityOk&&selDate&&selTime?1:0.4}}>Continue →</button>
            </div>
          </div>
        )}

        {step===2 && (
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:t0,marginBottom:6}}>Patient & Clinic Information</div>
            <p style={{color:t1,fontSize:13,marginBottom:20}}>All fields map directly into Covet when booking is confirmed.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
              {[["Clinic Name *","clinicName","Animal Hospital Name","text"],["Referring Vet *","vetName","Dr. First Last","text"],["Clinic Email *","clinicEmail","email@clinic.com","email"],["Patient Name *","patientName","Pet name","text"]].map(([l,k,p,tp])=>(
                <div key={k}><label style={lbl}>{l}</label><input style={inp} type={tp} placeholder={p} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} /></div>
              ))}
            </div>
            <div style={{borderTop:`1px solid ${bdr}`,paddingTop:20,marginBottom:20}}>
              <div style={{...sl(blue),marginBottom:16}}>Patient Details</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div><label style={lbl}>Species *</label><select style={inp} value={form.species} onChange={e=>setForm(f=>({...f,species:e.target.value}))}><option>Canine</option><option>Feline</option><option>Exotic</option></select></div>
                <div><label style={lbl}>Sex *</label><select style={inp} value={form.sex} onChange={e=>setForm(f=>({...f,sex:e.target.value}))}><option value="">Select...</option><option>M — Intact Male</option><option>MN — Neutered Male</option><option>F — Intact Female</option><option>FS — Spayed Female</option><option>Unknown</option></select></div>
                <div><label style={lbl}>Weight</label><input style={inp} placeholder="e.g. 12.5 kg" value={form.weight} onChange={e=>setForm(f=>({...f,weight:e.target.value}))} /></div>
                <div><label style={lbl}>Scan Type *</label><select style={inp} value={form.scanType} onChange={e=>setForm(f=>({...f,scanType:e.target.value}))}><option value="">Select...</option>{SCANS.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              <div style={{marginTop:16}}><label style={lbl}>Clinical History & Presenting Complaint *</label><textarea style={{...inp,resize:"vertical",minHeight:100}} placeholder="History, current medications, reason for referral..." value={form.history} onChange={e=>setForm(f=>({...f,history:e.target.value}))} /></div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <button className="btn-outline" onClick={()=>setStep(1)}>← Back</button>
              <button className="btn-blue" disabled={!form.clinicName||!form.vetName||!form.clinicEmail||!form.patientName||!form.sex||!form.scanType||!form.history} onClick={()=>setStep(3)} style={{opacity:form.clinicName&&form.vetName&&form.clinicEmail&&form.patientName&&form.sex&&form.scanType&&form.history?1:0.4}}>Continue →</button>
            </div>
          </div>
        )}

        {step===3 && (
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:t0,marginBottom:6}}>Upload Medical Records</div>
            <p style={{color:red,fontSize:13,fontWeight:600,marginBottom:4}}>Required to confirm booking.</p>
            <p style={{color:t2,fontSize:11,marginBottom:24}}>Accepted: PDF, JPEG, PNG · Max 50MB</p>
            <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${form.recordFile?blue:bdr}`,borderRadius:14,padding:48,textAlign:"center",cursor:"pointer",background:form.recordFile?blueDim:bg2,transition:"all 0.2s",marginBottom:20}}>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>{if(e.target.files[0])setForm(f=>({...f,recordFile:e.target.files[0]}));}} />
              {form.recordFile
                ? <><div style={{fontSize:36,marginBottom:10}}>📎</div><div style={{fontWeight:700,color:blue,marginBottom:4}}>{form.recordFile.name}</div><div style={{fontSize:12,color:t1}}>Click to replace</div></>
                : <><div style={{fontSize:36,marginBottom:10}}>📂</div><div style={{fontWeight:600,color:t0,marginBottom:4}}>Drop files here or click to browse</div><div style={{fontSize:12,color:t1}}>Prior bloodwork, imaging reports, referral notes</div></>
              }
            </div>
            {form.recordFile && <div style={{background:blueDim,border:`1px solid ${bdr}`,borderRadius:10,padding:16,marginBottom:20,fontSize:13,color:t1,lineHeight:1.8}}><strong style={{color:blue}}>✓ What happens next:</strong><br/>• Transmitted to Covet · Case auto-created with patient demographics<br/>• AI generates preliminary medical history summary<br/>• Dr. Eiler arrives with case fully prepared</div>}
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <button className="btn-outline" onClick={()=>setStep(2)}>← Back</button>
              <button className="btn-blue" disabled={!form.recordFile} onClick={()=>setStep(4)} style={{opacity:form.recordFile?1:0.4}}>Review Booking →</button>
            </div>
          </div>
        )}

        {step===4 && (
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:t0,marginBottom:24}}>Confirm Your Booking</div>
            <div style={{border:`1px solid ${bdr}`,borderRadius:10,overflow:"hidden",marginBottom:24}}>
              {[["Service Day",`${selDay} — ${GEO[selDay]?.label}`],["Date",selDate?.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})],["Time",selTime],["Clinic",form.clinicName],["Referring Vet",form.vetName],["Patient",`${form.patientName} · ${form.species} · ${form.sex}`],["Scan Type",form.scanType],["Records",form.recordFile?.name]].map(([l,v],i)=>(
                <div key={l} style={{display:"flex",gap:16,padding:"12px 18px",background:i%2===0?bg1:bg2,borderBottom:i<7?`1px solid ${bdr}`:"none"}}>
                  <div style={{width:110,fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:t1,flexShrink:0,paddingTop:2}}>{l}</div>
                  <div style={{fontSize:13,color:t0}}>{v}</div>
                </div>
              ))}
            </div>
            <p style={{fontSize:12,color:t2,marginBottom:24,lineHeight:1.7}}>By confirming, you authorize Waves Mobile Veterinary to access the submitted records for diagnostic purposes and agree to same-day report delivery.</p>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <button className="btn-outline" onClick={()=>setStep(3)}>← Back</button>
              <button className="btn-blue" onClick={submit} style={{padding:"12px 36px",fontSize:15}}>Confirm Booking ✓</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OPS DASHBOARD ─────────────────────────────────────────────
function OpsDashboard({ cases, setCases, activeCase, nextCase, doneCount, etaLoading, etaData, notified, simulateETA, setNotified, setEtaData, reportLoading, reportText, reportPatient, setReportPatient, setReportText, generateReport, lmLog }) {
  const [dash,setDash]         = useState("schedule");
  const [openCase,setOpenCase] = useState(null);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:28}}>
        {[["schedule","📅","Today's Schedule"],["booking","📋","Booking Portal"],["eta","🗺","ETA Agent"],["report","🤖","AI Report"],["log","🧠","LM Log"]].map(([id,icon,label])=>(
          <button key={id} onClick={()=>setDash(id)} style={{background:dash===id?blue:"#DAEEFF",border:`2px solid ${dash===id?blue:"#AACFEE"}`,borderRadius:10,padding:"11px 8px",fontSize:13,fontWeight:700,color:dash===id?"white":t0,cursor:"pointer",fontFamily:"Lato,sans-serif",letterSpacing:"0.02em",textAlign:"center",transition:"all 0.2s",boxShadow:dash===id?"0 4px 14px rgba(59,130,246,0.35)":"none",display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <span style={{fontSize:20}}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {dash==="booking" && <BookingPortal />}

      {dash==="schedule" && (
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
            {[{label:"Today's Cases",val:cases.length,c:blue},{label:"Completed",val:doneCount,c:grn},{label:"In Progress",val:cases.filter(x=>x.status==="active").length,c:gold},{label:"Today's Revenue",val:`$${doneCount*500}`,c:blueHi}].map(s=>(
              <div key={s.label} style={{...card,padding:18,borderLeft:`3px solid ${s.c}`}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:s.c}}>{s.val}</div>
                <div style={{fontSize:12,color:t1,marginTop:4}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{...card,padding:0,overflow:"hidden"}}>
            {cases.map(c => {
              const sc = c.status==="completed"?grn:c.status==="active"?gold:t2;
              const sl2 = c.status==="completed"?"Done":c.status==="active"?"In Progress":"Upcoming";
              return (
                <div key={c.id} className="case-row" onClick={()=>setOpenCase(openCase?.id===c.id?null:c)}>
                  <div style={{minWidth:68}}>
                    <div style={{fontSize:13,fontWeight:700,color:sc}}>{c.time}</div>
                    <div style={{fontSize:10,color:t2}}>{c.id}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:3}}>
                      <span style={{fontWeight:700,fontSize:15,color:t0}}>{c.patient}</span>
                      <span style={{fontSize:11,background:bg2,border:`1px solid ${bdr}`,borderRadius:20,padding:"2px 8px",color:t1}}>{c.species} · {c.sex}</span>
                    </div>
                    <div style={{fontSize:12,color:t1}}>{c.scan} · {c.clinic} · {c.vet}</div>
                    {openCase?.id===c.id && c.findings && <div style={{marginTop:10,background:blueDim,borderRadius:8,padding:"10px 12px",fontSize:12,color:blueHi,border:`1px solid ${bdr}`}}><strong>Covet Findings:</strong> {c.findings}</div>}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span className="stat-pill" style={{background:c.status==="completed"?grnBg:c.status==="active"?goldBg:bg2,color:sc,border:`1px solid ${sc}30`}}>{sl2}</span>
                    {c.status==="completed" && <button className="btn-blue-sm" onClick={e=>{e.stopPropagation();setDash("report");generateReport(c);}}>Gen Report</button>}
                    {c.status==="upcoming"  && <button className="btn-outline-sm" onClick={e=>{e.stopPropagation();setCases(prev=>prev.map(x=>x.id===c.id?{...x,status:"active"}:(x.status==="active"?{...x,status:"completed"}:x)));}}>Start</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dash==="eta" && (
        <div style={{maxWidth:680}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
            <div style={{...card,borderLeft:`3px solid ${gold}`}}><div style={{...sl(gold)}}>You Are Here</div><div style={{fontWeight:700,fontSize:15,color:t0}}>{activeCase?.clinic||"No active case"}</div><div style={{fontSize:12,color:t1,marginTop:4}}>Current location</div></div>
            <div style={{...card,borderLeft:`3px solid ${blue}`}}><div style={{...sl(blue)}}>Next Stop</div><div style={{fontWeight:700,fontSize:15,color:t0}}>{nextCase?.clinic||"No upcoming"}</div><div style={{fontSize:12,color:t1,marginTop:4}}>{nextCase?.patient} · {nextCase?.scan}</div></div>
          </div>
          <div style={card}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:t0,marginBottom:6}}>Inform Next Clinic</div>
            <p style={{fontSize:13,color:t1,marginBottom:24}}>The system calculates real-time drive time and sends an ETA text and email to the next clinic — so they have the patient ready when you arrive.</p>
            {!etaData && <button className="btn-blue" onClick={simulateETA} disabled={etaLoading||!activeCase} style={{opacity:!etaLoading&&activeCase?1:0.5}}>{etaLoading?"Calculating...":"🗺 Calculate ETA + Notify Clinic"}</button>}
            {etaLoading && <div style={{fontSize:13,color:t1,marginTop:12}}>Checking live traffic on this route...</div>}
            {etaData && !notified && (
              <div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
                  {[["Distance",etaData.dist],["Drive Time",etaData.time],["Arrival",etaData.eta]].map(([l,v])=>(
                    <div key={l} style={{textAlign:"center",background:bg2,borderRadius:10,padding:16}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:t0}}>{v}</div>
                      <div style={{fontSize:11,color:t1,marginTop:4}}>{l}</div>
                    </div>
                  ))}
                </div>
                <button className="btn-blue" onClick={()=>setNotified(true)}>📲 Send ETA to {etaData.next?.clinic}</button>
              </div>
            )}
            {notified && (
              <div style={{background:grnBg,border:`1px solid ${grn}30`,borderRadius:10,padding:18}}>
                <div style={{fontWeight:700,color:grn,marginBottom:6}}>✓ Notification Sent</div>
                <div style={{fontSize:13,color:t1}}>{etaData?.next?.clinic} notified. Dr. Eiler ETA: {etaData?.eta}. Patient {etaData?.next?.patient} to be ready.</div>
                <button onClick={()=>{setEtaData(null);setNotified(false);}} style={{marginTop:12,background:"none",border:`1px solid ${bdr}`,color:t1,borderRadius:6,padding:"6px 14px",cursor:"pointer",fontSize:12,fontFamily:"Lato,sans-serif"}}>Reset</button>
              </div>
            )}
          </div>
        </div>
      )}

      {dash==="report" && (
        <div style={{maxWidth:760}}>
          {!reportPatient && !reportLoading && (
            <div>
              <p style={{color:t1,fontSize:14,marginBottom:20}}>Select a completed case to generate an AI report draft:</p>
              {cases.filter(c=>c.status==="completed").map(c=>(
                <div key={c.id} style={{...card,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,padding:"16px 20px"}}>
                  <div><div style={{fontWeight:700,fontSize:15,color:t0}}>{c.patient}</div><div style={{fontSize:12,color:t1}}>{c.scan} · {c.clinic}</div></div>
                  <button className="btn-blue" onClick={()=>generateReport(c)}>Generate Report →</button>
                </div>
              ))}
            </div>
          )}
          {reportLoading && (
            <div style={{...card,textAlign:"center",padding:60}}>
              <div style={{width:36,height:36,border:`3px solid ${bdr}`,borderTopColor:blue,borderRadius:"50%",animation:"spin 0.9s linear infinite",margin:"0 auto 20px"}} />
              <div style={{fontWeight:600,color:t0,marginBottom:6}}>Generating Report</div>
              <div style={{fontSize:13,color:t1}}>Reading Covet findings · Applying Dr. Eiler's report style...</div>
            </div>
          )}
          {reportText && !reportLoading && reportPatient && (
            <div>
              <div style={{...card,padding:"12px 18px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",background:blueDim,border:`1px solid ${bdr}`}}>
                <div style={{fontSize:13,color:blue,fontWeight:700}}>✓ AI draft ready for {reportPatient.patient} — review, edit, and approve</div>
                <button onClick={()=>{setReportPatient(null);setReportText("");}} style={{background:"none",border:`1px solid ${bdr}`,color:t1,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontSize:12,fontFamily:"Lato,sans-serif"}}>← Back</button>
              </div>
              <div style={card}><textarea defaultValue={reportText} style={{width:"100%",border:"none",outline:"none",fontSize:13,lineHeight:1.8,color:t0,resize:"vertical",minHeight:420,fontFamily:"Lato,sans-serif",background:"transparent"}} /></div>
              <div style={{display:"flex",gap:12,marginTop:16}}>
                <button className="btn-blue" style={{flex:1}}>✓ Approve & Send to Clinic</button>
                <button className="btn-outline" style={{flex:1}}>⚡ Push to EzyVet</button>
              </div>
            </div>
          )}
        </div>
      )}

      {dash==="log" && (
        <div>
          <div style={{...card,marginBottom:20,padding:24}}>
            <div style={sl()}>How the AI Gets Smarter Over Time</div>
            <p style={{fontSize:14,color:t1,lineHeight:1.7}}>Every time you approve a report, the system records what you kept and what you changed. Within 3–6 months, reports need minimal correction before approval.</p>
          </div>
          {lmLog.length===0
            ? <div style={{textAlign:"center",padding:40,color:t2}}>Generate a report from the AI Report tab to see the training log.</div>
            : lmLog.map((l,i)=>(
              <div key={i} style={{...card,marginBottom:12,padding:18}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontWeight:700,color:t0}}>{l.patient} · {l.scan}</div>
                  <div style={{fontSize:11,color:t1}}>{l.time}</div>
                </div>
                <div style={{fontSize:12,color:t1,background:bg2,padding:10,borderRadius:8}}>{l.snippet}</div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]   = useState("home");
  const [cases,setCases] = useState(TODAY);
  const [calc,setCalc] = useState({ scansPerDay:6, daysPerWeek:5, homeHrsPerDay:4, reportHrsPerCase:0.12, scanFee:500, investment:30000 });
  const [cr,setCr]     = useState(null);
  const [etaLoading,setEtaLoading] = useState(false);
  const [etaData,setEtaData]       = useState(null);
  const [notified,setNotified]     = useState(false);
  const [rLoading,setRLoading]     = useState(false);
  const [rText,setRText]           = useState("");
  const [rPatient,setRPatient]     = useState(null);
  const [lmLog,setLmLog]           = useState([]);

  const activeCase = cases.find(c=>c.status==="active");
  const nextCase   = cases[cases.findIndex(c=>c.status==="active")+1] || cases.find(c=>c.status==="upcoming");
  const doneCount  = cases.filter(c=>c.status==="completed").length;

  useEffect(()=>{
    const { scansPerDay,daysPerWeek,homeHrsPerDay,reportHrsPerCase,scanFee,investment } = calc;
    const wd=daysPerWeek*50, sy=scansPerDay*wd;
    const homeY=homeHrsPerDay*wd, ezyY=reportHrsPerCase*sy, totalNow=homeY+ezyY;
    const afterY=0.4*wd+0.025*sy, recovered=totalNow-afterY;
    const missedRev=daysPerWeek*1.5*50*scanFee, addedRev=Math.min(2,daysPerWeek*0.4)*50*scanFee;
    const totalBen=missedRev+addedRev;
    setCr({ homeY:Math.round(homeY), ezyY:Math.round(ezyY), totalNow:Math.round(totalNow), afterY:Math.round(afterY), recovered:Math.round(recovered), missedRev:Math.round(missedRev), addedRev:Math.round(addedRev), totalBen:Math.round(totalBen), roi:((totalBen-investment)/investment*100).toFixed(0), breakEven:Math.round(investment/(totalBen/52)), threeYear:Math.round(totalBen*3-investment) });
  },[calc]);

  function simulateETA() {
    setEtaLoading(true); setEtaData(null); setNotified(false);
    setTimeout(()=>{
      const key=`${activeCase?.clinic}→${nextCase?.clinic}`;
      const tr=TRAVEL[key]||{dist:"9.4 mi",time:"19 min"};
      const now=new Date(); now.setMinutes(now.getMinutes()+parseInt(tr.time)+5);
      setEtaData({...tr,eta:now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),next:nextCase});
      setEtaLoading(false);
    },1800);
  }

  async function generateReport(c) {
    setRPatient(c); setRText(""); setRLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          system:"You generate professional veterinary ultrasound reports in the style of Dr. Karen Eiler, DACVIM. Be concise, clinical, precise. End with: 'AI-assisted draft — reviewed and approved by Dr. Karen Eiler, DACVIM.'",
          messages:[{role:"user",content:`Generate a complete ultrasound report.\nPatient: ${c.patient} | ${c.species} ${c.sex} | ${c.weight}\nClinic: ${c.clinic} | Attending: ${c.vet}\nScan: ${c.scan}\nCovet Findings: ${c.findings}`}]
        })
      });
      const d=await res.json();
      const txt=d.content?.find(b=>b.type==="text")?.text||"Unable to generate.";
      setRText(txt);
      setLmLog(prev=>[{patient:c.patient,scan:c.scan,time:new Date().toLocaleTimeString(),snippet:txt.substring(0,120)+"..."},...prev]);
    } catch { setRText("⚠️ Connection error. Please retry."); }
    setRLoading(false);
  }

  const TABS = [["home","Overview"],["how","How It Works"],["dashboard","Ops Dashboard"],["calculator","Time & Money"],["marketing","Marketing Plan"]];

  return (
    <div style={{fontFamily:"Lato,sans-serif",background:bg0,minHeight:"100vh",color:t0}}>
      <style>{GF}{`
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:${blue};border-radius:3px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fade-up{animation:fadeUp 0.5s ease forwards;}
        .tab-link{cursor:pointer;border:none;background:transparent;font-family:Lato,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;padding:22px 20px;color:${t1};border-bottom:3px solid transparent;transition:all 0.2s;}
        .tab-link:hover{color:${t0};}
        .tab-link.active{color:${blue};border-bottom-color:${blue};}
        .btn-blue{background:${blue};color:white;border:none;border-radius:8px;padding:12px 28px;font-size:14px;font-weight:700;font-family:Lato,sans-serif;cursor:pointer;transition:all 0.2s;}
        .btn-blue:hover{background:#2563EB;transform:translateY(-1px);box-shadow:0 4px 18px rgba(59,130,246,0.4);}
        .btn-blue-sm{background:${blue};color:white;border:none;border-radius:6px;padding:6px 14px;font-size:11px;font-weight:700;font-family:Lato,sans-serif;cursor:pointer;}
        .btn-outline{background:transparent;color:${blue};border:1.5px solid ${blue};border-radius:8px;padding:10px 22px;font-size:13px;font-weight:700;font-family:Lato,sans-serif;cursor:pointer;transition:all 0.2s;}
        .btn-outline:hover{background:${blue};color:white;}
        .btn-outline-sm{background:transparent;color:${t1};border:1.5px solid ${bdr};border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;font-family:Lato,sans-serif;cursor:pointer;}
        input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:${blueDim};outline:none;cursor:pointer;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:${blue};border:3px solid ${bg1};box-shadow:0 2px 6px rgba(0,0,0,0.4);}
        .case-row{padding:16px 20px;border-bottom:1px solid ${bdr};display:flex;align-items:center;gap:16px;transition:background 0.15s;cursor:pointer;}
        .case-row:hover{background:${bg2};}
        .case-row:last-child{border-bottom:none;}
        .stat-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.05em;}
        select option{background:${bg2};color:${t0};}
      `}</style>

      <nav style={{background:bg1,borderBottom:`1px solid ${bdr}`,position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 12px rgba(0,0,0,0.6)"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",padding:"0 28px"}}>
          <button onClick={()=>setTab("home")} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:12,padding:"16px 0",marginRight:36,flexShrink:0}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🌊</div>
            <div style={{textAlign:"left"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:t0,lineHeight:1.1}}>Waves Mobile</div>
              <div style={{fontSize:9,color:t1,letterSpacing:"0.12em",textTransform:"uppercase"}}>ACVIM · Operations Platform</div>
            </div>
          </button>
          <div style={{display:"flex",flex:1,overflowX:"auto"}}>
            {TABS.map(([id,label])=><button key={id} className={`tab-link${tab===id?" active":""}`} onClick={()=>setTab(id)}>{label}</button>)}
          </div>
          <span style={{marginLeft:20,fontSize:11,color:blue,background:blueDim,border:`1px solid ${bdr}`,borderRadius:20,padding:"4px 12px",fontWeight:600,flexShrink:0}}>🔒 Private — Dr. Eiler Only</span>
        </div>
      </nav>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"0 28px"}}>

        {/* ── HOME ── */}
        {tab==="home" && (
          <div className="fade-up">
            <div style={{padding:"64px 0 48px",textAlign:"center",maxWidth:680,margin:"0 auto"}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:blue,marginBottom:16}}>Prepared for Dr. Karen Eiler · February 2026</div>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:52,fontWeight:700,color:"#0F2952",lineHeight:1.1,marginBottom:20}}>The same quality of care.<br /><em style={{fontStyle:"italic",color:blue}}>Half the day.</em></h1>
              <p style={{fontSize:17,color:"#2D5A8E",lineHeight:1.8,marginBottom:36,fontWeight:300}}>You are spending 4–6 hours every night on administrative work that could be automated. This platform eliminates that entirely — so you drive home, and the reports are already sent.</p>
              <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                <button className="btn-blue" onClick={()=>setTab("calculator")}>See My Numbers →</button>
                <button className="btn-outline" onClick={()=>setTab("how")}>How Does It Work?</button>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:40}}>
              <div style={{...card,borderTop:`4px solid ${red}`}}>
                <div style={{...sl(red),marginBottom:16}}>Your Tuesday — Right Now</div>
                {[{t:"7:30 AM",v:"Review emailed records. Forward, download, upload to Covet manually.",k:"waste"},{t:"9:00 AM",v:"Drive to Ventura. 75 minutes one way.",k:"travel"},{t:"10:30 AM–1:00 PM",v:"Ultrasound scans. This is the work.",k:"value"},{t:"1:00–1:45 PM",v:"Drive to Santa Barbara.",k:"travel"},{t:"2:00–5:00 PM",v:"Ultrasound scans.",k:"value"},{t:"6:00–7:00 PM",v:"Drive back to Santa Monica.",k:"travel"},{t:"7:30 PM–12:00 AM",v:"Open Covet. Open EzyVet. 25 steps per case. 8–12 cases. Repeat.",k:"waste"}].map((r,i)=>(
                  <div key={i} style={{display:"flex",gap:14,padding:"9px 0",borderBottom:i<6?`1px solid ${bdr}`:"none"}}>
                    <div style={{fontSize:11,color:t2,minWidth:90,fontWeight:600,paddingTop:2}}>{r.t}</div>
                    <div style={{fontSize:13,color:r.k==="waste"?red:r.k==="value"?grn:t1,lineHeight:1.5}}>{r.v}</div>
                  </div>
                ))}
                <div style={{background:redBg,borderRadius:8,padding:"12px 14px",fontSize:13,color:red,fontWeight:600,marginTop:12}}>You finish at midnight. You start again in 7.5 hours.</div>
              </div>
              <div style={{...card,borderTop:`4px solid ${blue}`}}>
                <div style={{...sl(blue),marginBottom:16}}>Your Tuesday — After</div>
                {[{t:"7:30 AM",v:"Open laptop. Every case already built in Covet — records attached, history summarized. Clinics booked it themselves.",k:"value"},{t:"9:00 AM",v:"Drive to Ventura.",k:"travel"},{t:"10:30 AM–1:00 PM",v:"Ultrasound scans. This is the work.",k:"value"},{t:"1:00–1:45 PM",v:"Drive to Santa Barbara. Next clinic notified of your ETA automatically.",k:"travel"},{t:"2:00–5:00 PM",v:"Ultrasound scans. Reports drafted by AI as you finish each case.",k:"value"},{t:"5:00–5:30 PM",v:"Review and approve reports. 20 minutes total.",k:"value"},{t:"6:00 PM",v:"Home. Reports already in EzyVet. Clinics already notified. Done.",k:"value"}].map((r,i)=>(
                  <div key={i} style={{display:"flex",gap:14,padding:"9px 0",borderBottom:i<6?`1px solid ${bdr}`:"none"}}>
                    <div style={{fontSize:11,color:t2,minWidth:90,fontWeight:600,paddingTop:2}}>{r.t}</div>
                    <div style={{fontSize:13,color:r.k==="waste"?red:r.k==="value"?grn:t1,lineHeight:1.5}}>{r.v}</div>
                  </div>
                ))}
                <div style={{background:blueDim,borderRadius:8,padding:"12px 14px",fontSize:13,color:blue,fontWeight:600,marginTop:12}}>You finish at 6:00 PM. Six hours back every single Tuesday.</div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:40}}>
              {[{n:"4–6 hrs",l:"Nightly admin right now",s:"5 nights/week, 50 weeks/year",c:red},{n:"1,000+",l:"Hours per year on paperwork",s:"That's 6 full months of 40-hr weeks",c:gold},{n:"~20 min",l:"Nightly admin after",s:"Review & approve. That's it.",c:blue},{n:"$55K–165K",l:"Recoverable annual value",s:"Time + revenue + admin savings",c:grn}].map(s=>(
                <div key={s.l} style={{...card,borderLeft:`4px solid ${s.c}`,padding:20}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,color:s.c,lineHeight:1,marginBottom:8}}>{s.n}</div>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:4,color:t0}}>{s.l}</div>
                  <div style={{fontSize:11,color:t1}}>{s.s}</div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ── HOW IT WORKS ── */}
        {tab==="how" && (
          <div className="fade-up" style={{paddingTop:48}}>
            <div style={{textAlign:"center",marginBottom:48}}>
              <div style={sl()}>Plain English</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:40,color:"#0F2952",fontWeight:700,marginBottom:14}}>Here is exactly what gets built.</h2>
              <p style={{color:"#2D5A8E",fontSize:16,maxWidth:560,margin:"0 auto"}}>No technical jargon. Each piece does one job. Together they eliminate everything you do at home after a clinical day.</p>
            </div>
            <div style={{...card,marginBottom:40,padding:40}}>
              <div style={{...sl(),textAlign:"center",marginBottom:32}}>The New Workflow — Start to Finish</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:0,alignItems:"start",position:"relative"}}>
                {[{n:"1",i:"📋",t:"Clinic Books Online",b:"A referring vet picks a day, fills in patient details, and uploads records. They can't book without uploading records.",c:blue},{n:"2",i:"🤖",t:"Covet Case Auto-Created",b:"The moment they submit, Covet opens a new case with patient info and records already attached. You arrive and it's ready.",c:blueHi},{n:"3",i:"🩺",t:"You Scan + Dictate",b:"Exactly what you do now. Nothing changes. Your Covet SOAP templates stay the same. Voice dictation stays the same.",c:gold},{n:"4",i:"📝",t:"Report Drafted for You",b:"When you're done, an AI draft appears for your review. Read it, make any edits, and approve. Under 5 minutes per case.",c:blue},{n:"5",i:"⚡",t:"EzyVet Auto-Populated",b:"One click pushes everything into EzyVet — patient, case, history, findings, summary. All 25 manual steps done automatically.",c:blueHi}].map((s,i)=>(
                  <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
                    <div style={{width:56,height:56,borderRadius:"50%",background:s.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,marginBottom:14,boxShadow:"0 4px 16px rgba(59,130,246,0.3)",flexShrink:0}}>{s.i}</div>
                    <div style={{textAlign:"center",padding:"0 8px"}}>
                      <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:s.c,marginBottom:6,textTransform:"uppercase"}}>Step {s.n}</div>
                      <div style={{fontWeight:700,fontSize:13,color:t0,marginBottom:8,lineHeight:1.3}}>{s.t}</div>
                      <div style={{fontSize:12,color:t1,lineHeight:1.6}}>{s.b}</div>
                    </div>
                    {i<4 && <div style={{position:"absolute",right:-12,top:28,fontSize:16,color:bdr,fontWeight:700}}>→</div>}
                  </div>
                ))}
              </div>
              <div style={{marginTop:32,padding:16,background:blueDim,borderRadius:10,textAlign:"center",border:`1px solid ${bdr}`}}>
                <div style={{fontSize:14,color:blue,fontWeight:700}}>The result: You drive home. Reports are already sent.</div>
              </div>
            </div>

            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:blue,marginBottom:20}}>The Three Tools</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,marginBottom:40}}>
              {[{i:"📅",t:"Booking Portal",tag:"Tool 1",w:"A scheduling page on your website.",does:["Clinics book their own appointments","Day-specific geo rules enforced automatically","Records uploaded at booking — no more email attachments","Covet case created automatically the moment they submit","You arrive to a fully prepped schedule. No morning admin."],el:"30–45 min of pre-day setup",c:blue},{i:"⚡",t:"Chrome Extension",tag:"Tool 2",w:"A small program running in your browser.",does:["Watches Covet while you work","Captures all findings when you generate the summary","Opens EzyVet, creates patient and case, fills every field","25 manual steps replaced with 1 click","90 seconds instead of 6–8 minutes per case"],el:"2–3 hours of nightly copy/paste",c:blueHi},{i:"🤖",t:"AI Report Assistant",tag:"Tool 3",w:"An AI trained on your own reports.",does:["Reads the completed Covet case after your scan","Writes a full draft report in your style","You review, edit, and approve","Same-day delivery to the clinic — before you leave","Gets better over time as it learns from your edits"],el:"1–2 hours of report writing per day",c:gold}].map(x=>(
                <div key={x.t} style={{...card,borderTop:`4px solid ${x.c}`}}>
                  <div style={{fontSize:32,marginBottom:14}}>{x.i}</div>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:x.c,marginBottom:8}}>{x.tag}</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:t0,marginBottom:8}}>{x.t}</div>
                  <div style={{fontSize:13,color:t1,marginBottom:16,fontStyle:"italic"}}>{x.w}</div>
                  <div style={{marginBottom:16}}>
                    {x.does.map((d,i)=><div key={i} style={{display:"flex",gap:10,padding:"5px 0",borderBottom:i<x.does.length-1?`1px solid ${bdr}`:"none"}}><span style={{color:x.c,fontWeight:700,flexShrink:0}}>✓</span><span style={{fontSize:12,color:t1,lineHeight:1.5}}>{d}</span></div>)}
                  </div>
                  <div style={{background:bg2,borderRadius:8,padding:"10px 14px",fontSize:12,fontWeight:700,color:x.c}}>Eliminates: {x.el}</div>
                </div>
              ))}
            </div>

            <div style={{...card,borderLeft:`4px solid ${gold}`,padding:28,marginBottom:40}}>
              <div style={{...sl(gold)}}>What Doesn't Change</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:t0,marginBottom:16}}>Your clinical workflow stays exactly the same.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {["You still use Covet as your scan-day interface","Your SOAP templates in Covet stay exactly as they are","Your voice dictation process doesn't change","You still review and approve every report before it goes out","You control the schedule — tools support your decisions","No new systems to learn during scanning hours"].map((d,i)=>(
                  <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0"}}><span style={{color:blue,fontWeight:700,flexShrink:0,marginTop:1}}>✓</span><span style={{fontSize:13,color:t1}}>{d}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {tab==="dashboard" && (
          <div className="fade-up" style={{paddingTop:40}}>
            <div style={{marginBottom:32,textAlign:"center"}}>
              <div style={{...sl(),textAlign:"center"}}>Live Demo</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:36,color:"#0F2952",fontWeight:700,marginBottom:10}}>This is what your day looks like — with the tools built.</h2>
              <p style={{color:"#2D5A8E",fontSize:14,maxWidth:600,margin:"0 auto"}}>A working version of the ops dashboard. Click into cases, try the ETA agent, generate a report.</p>
            </div>
            <OpsDashboard cases={cases} setCases={setCases} activeCase={activeCase} nextCase={nextCase} doneCount={doneCount} etaLoading={etaLoading} etaData={etaData} notified={notified} simulateETA={simulateETA} setNotified={setNotified} setEtaData={setEtaData} reportLoading={rLoading} reportText={rText} reportPatient={rPatient} setReportPatient={setRPatient} setReportText={setRText} generateReport={generateReport} lmLog={lmLog} />
          </div>
        )}

        {/* ── CALCULATOR ── */}
        {tab==="calculator" && (
          <div className="fade-up" style={{paddingTop:48,maxWidth:900,margin:"0 auto"}}>
            <div style={{textAlign:"center",marginBottom:44}}>
              <div style={sl()}>Your Numbers. Your Math.</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:40,color:"#0F2952",fontWeight:700,marginBottom:12}}>What is the status quo actually costing you?</h2>
              <p style={{color:"#2D5A8E",fontSize:15,maxWidth:520,margin:"0 auto"}}>Adjust the sliders to match your real week. Every number recalculates instantly.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:28}}>
              <div style={card}>
                <div style={sl()}>Your Practice — Input Your Numbers</div>
                {[{key:"scansPerDay",label:"Average scans per day",min:2,max:16,step:1,unit:"scans"},{key:"daysPerWeek",label:"Clinical days per week",min:1,max:5,step:1,unit:"days"},{key:"homeHrsPerDay",label:"Hours on reports at home each night",min:1,max:8,step:0.5,unit:"hrs"},{key:"reportHrsPerCase",label:"Minutes per case for EzyVet entry",min:0.05,max:0.2,step:0.01667,isMin:true},{key:"scanFee",label:"Revenue per scan",min:300,max:800,step:50,prefix:"$"},{key:"investment",label:"Total investment ($10k/mo × 3 mo retainer)",min:21000,max:42000,step:500,prefix:"$"}].map(f=>{
                  const raw=calc[f.key];
                  const disp=f.isMin?Math.round(raw*60):(f.prefix?raw.toLocaleString():raw);
                  const unit=f.isMin?"min":(f.prefix?"":f.unit);
                  return (
                    <div key={f.key} style={{marginBottom:22}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <label style={{fontSize:13,color:t0,fontWeight:600}}>{f.label}</label>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:blue}}>{f.prefix}{disp} {f.prefix?"":unit}</span>
                      </div>
                      <input type="range" min={f.min} max={f.max} step={f.step} value={raw} style={{width:"100%"}} onChange={e=>setCalc(c=>({...c,[f.key]:parseFloat(e.target.value)}))} />
                    </div>
                  );
                })}
              </div>
              {cr && (
                <div>
                  <div style={{...card,borderTop:`4px solid ${red}`,marginBottom:16}}>
                    <div style={{...sl(red)}}>Current State — What It's Costing You</div>
                    {[{l:"Hours/year on home report writing",v:`${cr.homeY.toLocaleString()} hrs`},{l:"Hours/year on EzyVet manual entry",v:`${cr.ezyY.toLocaleString()} hrs`},{l:"Total admin hours per year",v:`${cr.totalNow.toLocaleString()} hrs`,bold:true},{l:"Revenue lost from missed add-on scans",v:`$${cr.missedRev.toLocaleString()}`}].map(r=>(
                      <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${bdr}`}}>
                        <span style={{fontSize:13,color:t1}}>{r.l}</span>
                        <span style={{fontSize:14,fontWeight:r.bold?700:600,color:r.bold?red:t0}}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{...card,borderTop:`4px solid ${blue}`,marginBottom:16}}>
                    <div style={{...sl(blue)}}>After Automation — What You Get Back</div>
                    {[{l:"Admin hours per year (after)",v:`${cr.afterY.toLocaleString()} hrs`},{l:"Hours recovered per year",v:`${cr.recovered.toLocaleString()} hrs`,bold:true,c:blue},{l:"Additional revenue from recovered time",v:`$${cr.addedRev.toLocaleString()}`},{l:"Revenue from schedule optimization",v:`$${cr.missedRev.toLocaleString()}`}].map(r=>(
                      <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${bdr}`}}>
                        <span style={{fontSize:13,color:t1}}>{r.l}</span>
                        <span style={{fontSize:14,fontWeight:r.bold?700:600,color:r.c||t0}}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{...card}}>
                    <div style={{...sl(blue),marginBottom:16}}>The Bottom Line</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
                      <div style={{textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:42,fontWeight:700,lineHeight:1,color:blue}}>${cr.totalBen.toLocaleString()}</div><div style={{fontSize:11,color:t1,marginTop:6,lineHeight:1.4}}>Annual benefit<br/>(time + revenue)</div></div>
                      <div style={{textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:42,fontWeight:700,lineHeight:1,color:t0}}>{cr.breakEven} wks</div><div style={{fontSize:11,color:t1,marginTop:6,lineHeight:1.4}}>Break-even<br/>timeline</div></div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                      <div style={{textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:42,fontWeight:700,lineHeight:1,color:blue}}>{cr.roi}%</div><div style={{fontSize:11,color:t1,marginTop:6}}>Year 1 ROI</div></div>
                      <div style={{textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:42,fontWeight:700,lineHeight:1,color:t0}}>${cr.threeYear.toLocaleString()}</div><div style={{fontSize:11,color:t1,marginTop:6}}>3-year net return</div></div>
                    </div>
                    <div style={{marginTop:20,paddingTop:16,borderTop:`1px solid ${bdr}`,fontSize:12,color:t1,lineHeight:1.7}}>These are your numbers, based on inputs you control. Conservative assumptions — 1.5 additional scans per week from recovered time. Investment is structured as a $10,000/month retainer over 3 months ($30,000 total). Adjust the slider above to model your exact scenario.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MARKETING ── */}
        {tab==="marketing" && (
          <div className="fade-up" style={{paddingTop:48,maxWidth:920,margin:"0 auto"}}>
            <div style={{marginBottom:44,textAlign:"center"}}>
              <div style={{...sl(),textAlign:"center"}}>Growth Strategy</div>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:40,color:"#0F2952",fontWeight:700,marginBottom:12}}>Marketing Plan: Waves Mobile</h2>
              <p style={{color:"#2D5A8E",fontSize:15,maxWidth:620,lineHeight:1.7,margin:"0 auto"}}>The operational improvements are the foundation of a powerful marketing narrative. Same-day ultrasound reports are a genuine differentiator in the mobile veterinary market.</p>
            </div>

            <div style={{...card,padding:36,textAlign:"center",marginBottom:36}}>
              <div style={{...sl(),marginBottom:16}}>Positioning Statement</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:t0,fontStyle:"italic",lineHeight:1.5,maxWidth:600,margin:"0 auto"}}>"Waves Mobile delivers expert mobile veterinary ultrasound with same-day reports — so your patients get faster answers and your team can act the same day."</div>
            </div>

            <div style={{...card,marginBottom:28}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:t0,marginBottom:20}}>Target Audiences</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:bg2}}>{["Audience","Channel","Message"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:blue,borderBottom:`2px solid ${bdr}`}}>{h}</th>)}</tr></thead>
                <tbody>{[["General practice vets in LA / SB / Ventura","Email, direct visit, referral","Same-day results. Fast. Reliable. Mobile."],["Specialty & emergency clinics","LinkedIn, direct outreach, conference","ACVIM-level reporting, same-day turnaround"],["Clinic managers / practice owners","Email newsletter, personal call","Faster reports = happier clients = competitive edge"],["Veterinary peer network","LinkedIn, vet forums, word of mouth","Dr. Eiler's professional brand + same-day differentiator"]].map((row,i)=><tr key={i} style={{borderBottom:`1px solid ${bdr}`,background:i%2===0?bg1:bg2}}>{row.map((cell,j)=><td key={j} style={{padding:"12px 16px",color:j===0?t0:t1,fontWeight:j===0?600:400,lineHeight:1.5}}>{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>

            <div style={{...card,marginBottom:28}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:t0,marginBottom:20}}>Marketing Channels & Tactics</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:bg2}}>{["Tactic","Detail","Effort","Priority"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:blue,borderBottom:`2px solid ${bdr}`}}>{h}</th>)}</tr></thead>
                <tbody>{[["Same-day guarantee announcement","Email all existing clinic partners announcing new standard","LOW","⭐ DO FIRST",blue],["Referral card / one-pager","Leave-behind at every clinic: 'Report in your inbox today'","LOW","⭐⭐ HIGH",blue],["LinkedIn authority building","Weekly educational articles + 500+ connection target + daily engagement","MEDIUM","⭐⭐ HIGH",blue],["Clinic cold outreach sequence","Target 5 new specialty clinics/month with email + follow-up call","MEDIUM","⭐⭐ HIGH",blue],["Google Business Profile","Create/optimize local profile for 'mobile veterinary ultrasound LA'","LOW","⭐⭐ MEDIUM",t1],["Testimonial collection","Ask top 3 clinic partners for written endorsement","LOW","⭐⭐ MEDIUM",t1],["VA-driven outreach calls","VA calls new clinics Monday/Friday to introduce Waves Mobile","DELEGATED","⭐⭐ MEDIUM",t1],["Vet conference presence","Attend 1–2 local/regional vet conferences per year","HIGH","⭐ STRATEGIC",gold]].map((row,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${bdr}`,background:i%2===0?bg1:bg2}}>
                    <td style={{padding:"12px 16px",fontWeight:700,color:t0}}>{row[0]}</td>
                    <td style={{padding:"12px 16px",color:t1,fontSize:12,lineHeight:1.5}}>{row[1]}</td>
                    <td style={{padding:"12px 16px"}}><span style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:600,color:t1}}>{row[2]}</span></td>
                    <td style={{padding:"12px 16px",fontSize:12,fontWeight:700,color:row[4]}}>{row[3]}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            <div style={{...card,marginBottom:28,borderTop:`4px solid ${blue}`}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:t0,marginBottom:6}}>LinkedIn Authority Strategy</div>
              <p style={{fontSize:13,color:t1,marginBottom:24,lineHeight:1.7}}>LinkedIn is the highest-leverage marketing channel for Dr. Eiler. Referring vets, clinic managers, and specialist peers are all active there. A consistent presence compounds — each article and connection makes the next one more valuable. <strong style={{color:t0}}>Dr. Eiler will write the majority of the content</strong>; the operations platform frees up the time to make this feasible.</p>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:28}}>
                {[
                  {icon:"👥",title:"500+ Connections",sub:"The Growth Goal",body:"LinkedIn surfaces your content to your network's network. Crossing 500 connections unlocks the algorithm — your posts reach referring vets, clinic owners, and specialists you haven't met yet. Target: vets in LA, SB, and Ventura + ACVIM colleagues + clinic managers.",effort:"VA-assisted",c:blue},
                  {icon:"✍️",title:"Weekly Educational Articles",sub:"The Authority Engine",body:"One article per week positions Dr. Eiler as the go-to mobile ultrasound specialist in Southern California. Topics: case studies (anonymized), clinical education, ultrasound technique, what vets should look for in referral reports. Dr. Eiler writes; platform handles formatting and scheduling.",effort:"Dr. Eiler writes",c:blue},
                  {icon:"💬",title:"Daily Engagement",sub:"The Visibility Multiplier",body:"Commenting on 3–5 posts per day from referring vets, vet school faculty, and clinic managers keeps Dr. Eiler's name visible without requiring new content. Liking and sharing relevant posts extends reach. 10 minutes per day, highest ROI activity on the platform.",effort:"10 min/day",c:blue},
                ].map(x=>(
                  <div key={x.title} style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:12,padding:20}}>
                    <div style={{fontSize:28,marginBottom:10}}>{x.icon}</div>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:blue,marginBottom:4}}>{x.sub}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:t0,marginBottom:10}}>{x.title}</div>
                    <div style={{fontSize:12,color:t1,lineHeight:1.6,marginBottom:12}}>{x.body}</div>
                    <div style={{background:bg1,borderRadius:6,padding:"6px 12px",fontSize:11,fontWeight:700,color:blue,display:"inline-block"}}>⏱ {x.effort}</div>
                  </div>
                ))}
              </div>

              <div style={{borderTop:`1px solid ${bdr}`,paddingTop:20,marginBottom:20}}>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:blue,marginBottom:16}}>Weekly Article Topic Bank — First 12 Weeks</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    ["Week 1","What same-day ultrasound reports mean for patient outcomes"],
                    ["Week 2","5 findings general practitioners should never miss on abdominal ultrasound"],
                    ["Week 3","When to refer for cardiac ultrasound — a GP's practical guide"],
                    ["Week 4","Mobile specialist ultrasound vs. in-house: what clinics need to know"],
                    ["Week 5","Hepatic masses in cats: what ultrasound tells us that bloodwork can't"],
                    ["Week 6","The case for same-day reporting — why it changes the client conversation"],
                    ["Week 7","Free fluid in the abdomen: FAST scan fundamentals for GPs"],
                    ["Week 8","Cardiac MR in dogs: when is it clinically significant?"],
                    ["Week 9","How mobile ultrasound fits into a modern referral workflow"],
                    ["Week 10","Lymph node assessment: what the ultrasound report should always include"],
                    ["Week 11","Behind the scan: a day in the life of a mobile ACVIM specialist"],
                    ["Week 12","Building a referral relationship that works for your clinic"],
                  ].map(([w,t])=>(
                    <div key={w} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:`1px solid ${bdr}`}}>
                      <div style={{fontSize:10,fontWeight:700,color:blue,minWidth:48,flexShrink:0,paddingTop:2}}>{w}</div>
                      <div style={{fontSize:12,color:t0,lineHeight:1.5}}>{t}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:"14px 18px",fontSize:13,color:t1,lineHeight:1.7}}>
                <strong style={{color:t0}}>Important:</strong> Dr. Eiler writes the articles — authenticity is the whole point. The voice of a practicing ACVIM specialist carries authority that no ghostwritten content can replicate. The ops platform handles everything else so she has the time and headspace to write.
              </div>
            </div>

            <div style={{...card,padding:32,marginBottom:28}}>
              <div style={{...sl(),marginBottom:14}}>Key Marketing Message</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:t0,fontStyle:"italic",lineHeight:1.6,marginBottom:20}}>"Most mobile ultrasound services deliver reports the next day. Waves Mobile delivers them today. Your team can diagnose, treat, and communicate with clients before the end of business."</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
                {["Differentiates from competition","Creates urgency for referring clinics","Improves patient outcomes","Positions as premium, tech-forward"].map((s,i)=>(
                  <div key={i} style={{textAlign:"center",background:bg2,borderRadius:10,padding:"14px 10px",border:`1px solid ${bdr}`}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:blue}}>{i+1}</div>
                    <div style={{fontSize:12,color:t1,marginTop:6,lineHeight:1.4}}>{s}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{...card,marginBottom:28}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:t0,marginBottom:24}}>12-Month Marketing Roadmap</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
                {[{q:"Q1",m:"Months 1–3",f:"Launch same-day announcement + Google profile + LinkedIn profile optimization + begin connection building (target 500+)",g:"Deepen existing relationships; announce new standard",c:blue},{q:"Q2",m:"Months 4–6",f:"Referral one-pager + VA-driven outreach to 15 new clinics",g:"Add 3–5 new clinic partners",c:blueHi},{q:"Q3",m:"Months 7–9",f:"Collect testimonials + weekly LinkedIn articles driving inbound + continue engagement + pass 500 connections",g:"2–3 inbound referrals/month",c:gold},{q:"Q4",m:"Months 10–12",f:"Assess route expansion + specialty clinic targeting",g:"Identify highest-ROI Year 2 expansion",c:grn}].map(q=>(
                  <div key={q.q} style={{borderTop:`4px solid ${q.c}`,background:bg2,borderRadius:10,padding:20}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:q.c}}>{q.q}</div>
                    <div style={{fontSize:10,color:t1,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>{q.m}</div>
                    <div style={{fontSize:13,color:t0,lineHeight:1.6,marginBottom:12}}>{q.f}</div>
                    <div style={{background:bg1,borderRadius:7,padding:"8px 12px",fontSize:11,color:q.c,fontWeight:700}}>Goal: {q.g}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{...card,marginBottom:28}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:t0,marginBottom:8}}>Revenue Growth Projection</div>
              <p style={{fontSize:13,color:t1,marginBottom:20}}>Baseline assumes current operations with no marketing push or stacking incentive.</p>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:bg2}}>{["Scenario","Additional Scans/Week","Annual Revenue Increase"].map(h=><th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:blue,borderBottom:`2px solid ${bdr}`}}>{h}</th>)}</tr></thead>
                <tbody>{[["Conservative — 1 new scan/day avg","+5/week","+$130,000/year",blue],["Moderate — 2 new scans/day avg","+10/week","+$260,000/year",blueHi],["Optimized — 3 new scans + 3 new clinics","+15/week","+$390,000+/year",grn],["Current baseline (no change)","0","$0",red]].map((row,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${bdr}`,background:i===3?redBg:i%2===0?bg1:bg2}}>
                    <td style={{padding:"13px 16px",fontWeight:600,color:i===3?red:t0}}>{row[0]}</td>
                    <td style={{padding:"13px 16px",fontWeight:700,color:row[3]}}>{row[1]}</td>
                    <td style={{padding:"13px 16px",fontWeight:700,color:row[3],fontSize:15}}>{row[2]}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            <div style={{marginBottom:12}}>
              <div style={sl()}>Revenue Optimization</div>
              <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:t0,fontWeight:700,marginBottom:8}}>Clinic Scan Stacking Incentive Program</h3>
              <p style={{fontSize:14,color:t1,lineHeight:1.7,marginBottom:24,maxWidth:680}}>Volume discounts that maximize revenue per stop. When Dr. Eiler is already on-site, every additional scan costs nothing in overhead — making even a discounted scan worth more than turning it down.</p>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:28}}>
              <div style={{...card,borderLeft:`4px solid ${gold}`}}>
                <div style={{...sl(gold)}}>The Economic Principle</div>
                <p style={{fontSize:13,color:t1,lineHeight:1.7,marginBottom:16}}>Fixed costs per clinic stop are ~$138 regardless of scan count. Drive time, mileage, setup — all paid on arrival. Every scan beyond the first is essentially pure margin.</p>
                {[["Drive time (both ways)","~$75"],["Mileage (avg 20 mi round trip)","~$13"],["Setup & teardown","~$38"],["Admin (scheduling/confirmation)","~$12"],["Total fixed cost per stop","~$138"]].map(([l,v],i)=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${bdr}`,fontSize:13}}>
                    <span style={{color:t1}}>{l}</span>
                    <span style={{fontWeight:700,color:i===4?gold:t0}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{...card,borderLeft:`4px solid ${blue}`}}>
                <div style={{...sl(blue)}}>Key Implication</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:19,color:t0,lineHeight:1.5,marginBottom:16}}>Scans 2, 3, 4, and 5 at the same clinic cost Dr. Eiler essentially nothing in overhead.</div>
                <p style={{fontSize:13,color:t1,lineHeight:1.7,marginBottom:16}}>At $500 full rate, a 10–25% discount still generates <strong style={{color:blue}}>$375–$450 per incremental scan — pure margin.</strong></p>
                <div style={{background:blueDim,borderRadius:8,padding:"12px 14px",fontSize:13,color:blue,fontWeight:700}}>A 3-scan stop at $1,375 gross produces $1,237 net — 3.4× the return of a single scan.</div>
              </div>
            </div>

            <div style={{...card,marginBottom:28,borderTop:`4px solid ${blue}`}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:t0,marginBottom:6}}>The Tiered Scan Stacking Rate Card</div>
              <p style={{fontSize:13,color:t1,marginBottom:20}}>Simple, memorable, visually clear. Stacking applies same-day only.</p>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:bg2}}>{["Scan #","Price","Discount","Clinic Saves","Rationale"].map(h=><th key={h} style={{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,letterSpacing:"0.08em",color:"rgba(255,255,255,0.7)"}}>{h}</th>)}</tr></thead>
                <tbody>{[["Scan 1","$500","Full Rate","—","Standard single-scan rate",t1,bg1],["Scan 2","$450","10% off","Save $50","Same visit, zero added overhead",blue,bg2],["Scan 3","$425","15% off","Save $75","Significant savings — strong incentive",blue,bg1],["Scan 4","$400","20% off","Save $100","Loyalty tier — high-volume reward",blue,bg2],["Scan 5+","$375","25% off","Save $125","Floor rate — still highly profitable",grn,bg1]].map((row,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${bdr}`,background:row[6]}}>
                    <td style={{padding:"13px 16px",fontWeight:700,color:row[5],fontSize:14}}>{row[0]}</td>
                    <td style={{padding:"13px 16px",fontWeight:700,color:row[5],fontSize:16,fontFamily:"'Playfair Display',serif"}}>{row[1]}</td>
                    <td style={{padding:"13px 16px"}}><span style={{background:bg0,color:row[5],borderRadius:6,padding:"3px 10px",fontSize:12,fontWeight:700}}>{row[2]}</span></td>
                    <td style={{padding:"13px 16px",fontWeight:700,color:row[5]}}>{row[3]}</td>
                    <td style={{padding:"13px 16px",color:t1,fontSize:12}}>{row[4]}</td>
                  </tr>
                ))}</tbody>
              </table>
              <div style={{marginTop:14,background:redBg,borderRadius:8,padding:"10px 16px",fontSize:12,color:red,border:`1px solid ${red}20`}}>⚠️ <strong>Same-day only.</strong> Additional animals added to a future visit are billed at the standard $500 rate.</div>
            </div>

            <div style={{...card,marginBottom:28,borderTop:`4px solid ${blue}`}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:t0,marginBottom:8}}>Wednesday Deep Dive — Modern Animal Culver City</div>
              <p style={{fontSize:13,color:t1,marginBottom:20}}>Highest-density single-clinic day. No competing clinics. Best pilot for stacking.</p>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{background:bg2}}>{["Scenario","Scans","Gross Revenue","Net Revenue","Dr. Eiler Hourly"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:blue,borderBottom:`2px solid ${bdr}`}}>{h}</th>)}</tr></thead>
                <tbody>{[["Current Wednesday baseline","6","$3,000","$2,862","~$238/hr",bg1],["Moderate stacking target","8","$3,550","$3,412","~$284/hr",bg2],["Full stacking target","10","$4,100","$3,962","~$330/hr",bg1],["Maximum stacking (clinic capacity)","12","$4,725","$4,587","~$382/hr",bg2]].map((row,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${bdr}`,background:row[5]}}>
                    <td style={{padding:"13px 14px",fontWeight:i===0?400:700,color:t0}}>{row[0]}</td>
                    <td style={{padding:"13px 14px",fontWeight:700,color:blue,fontFamily:"'Playfair Display',serif",fontSize:18}}>{row[1]}</td>
                    <td style={{padding:"13px 14px",fontWeight:700,color:i>0?blue:t1,fontSize:15}}>{row[2]}</td>
                    <td style={{padding:"13px 14px",fontWeight:700,color:i>0?grn:t1}}>{row[3]}</td>
                    <td style={{padding:"13px 14px",color:t1}}>{row[4]}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            <div style={{...card,marginBottom:28,borderLeft:`4px solid ${blueHi}`}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:t0,marginBottom:16}}>VA Scheduling Script — Stacking Prompt</div>
              <p style={{fontSize:13,color:t1,marginBottom:16}}>Used on every confirmation call. Leads with what the clinic gets — savings — not what Dr. Eiler gets.</p>
              <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,padding:24,fontSize:14,color:t0,lineHeight:1.9}}>
                <div style={{...sl(blueHi),marginBottom:14}}>Script</div>
                <p style={{marginBottom:12}}>"Hi [Clinic Name], I'm calling to confirm Dr. Eiler's visit on [date] for [patient name]."</p>
                <p style={{marginBottom:12}}>"While I have you — do you have any other patients that could benefit from an ultrasound during the same visit? Dr. Eiler offers a volume discount when she's already on-site: the second scan is $450, and it goes down from there. No additional scheduling needed — same visit, same day, same same-day report."</p>
                <p>"I can add them right now if you have anyone in mind."</p>
              </div>
            </div>

            <div style={{...card,marginBottom:28}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:t0,marginBottom:20}}>Loyalty & Partnership Tiers</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                {[{tier:"Stack Partner",qual:"Avg 3+ scans/visit over any rolling 3 months",reward:"Priority scheduling — Dr. Eiler's first available slot, guaranteed. Name on preferred partner list.",c:blue},{tier:"Platinum Stack",qual:"Avg 4+ scans/visit over any rolling 3 months",reward:"All Stack Partner benefits + complimentary quarterly case review with Dr. Eiler (30 min, educational).",c:blueHi},{tier:"Referral Bonus",qual:"Refers a new clinic that books a first appointment",reward:"One complimentary scan credit ($375 value) applied to their next invoice.",c:gold}].map(x=>(
                  <div key={x.tier} style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:12,padding:20,borderTop:`4px solid ${x.c}`}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:x.c,marginBottom:10}}>{x.tier}</div>
                    <div style={{fontSize:11,fontWeight:700,color:t2,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Qualification</div>
                    <div style={{fontSize:12,color:t0,marginBottom:14,lineHeight:1.5}}>{x.qual}</div>
                    <div style={{fontSize:11,fontWeight:700,color:t2,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Reward</div>
                    <div style={{fontSize:12,color:t1,lineHeight:1.6}}>{x.reward}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:20,background:goldBg,border:`1px solid ${gold}30`,borderRadius:10,padding:"14px 18px",fontSize:13,color:gold,lineHeight:1.7}}><strong>Strategic note:</strong> The quarterly case review for Platinum Stack clinics costs Dr. Eiler 30 minutes and delivers exceptional value. This asymmetry makes it an unusually powerful retention tool.</div>
            </div>

            <div style={{...card,marginBottom:28,borderTop:`4px solid ${blue}`}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:t0,marginBottom:6}}>AI Search Visibility — The New Rules of SEO</div>
              <p style={{fontSize:13,color:t1,marginBottom:24,lineHeight:1.7}}>Google is no longer the only search engine that matters. Referring vets, clinic managers, and pet owners are increasingly asking ChatGPT, Perplexity, Claude, and Google's AI Overview to recommend specialists. <strong style={{color:t0}}>If Waves Mobile isn't findable by AI, it doesn't exist to a growing segment of potential referrers.</strong> This is not future-proofing — it is happening now.</p>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:28}}>
                <div style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:12,padding:20}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:blue,marginBottom:8}}>The Old SEO</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:t0,marginBottom:12}}>Rank on Google for keyword searches</div>
                  {["Optimize page titles and meta descriptions","Build backlinks from other websites","Target keywords like 'mobile vet ultrasound LA'","Hope someone clicks your result"].map((x,i)=>(
                    <div key={i} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:`1px solid ${bdr}`,fontSize:12,color:t1}}>
                      <span style={{color:t2,flexShrink:0}}>→</span>{x}
                    </div>
                  ))}
                </div>
                <div style={{background:bg2,border:`1px solid ${blue}40`,borderRadius:12,padding:20,boxShadow:`0 0 0 2px ${blue}20`}}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:blue,marginBottom:8}}>The New SEO — AI Discoverability</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:t0,marginBottom:12}}>Be the answer AI recommends</div>
                  {["Be cited in content AI models train on and reference","Have a clear, structured, authoritative web presence","Earn mentions in LinkedIn articles, vet forums, directories","Answer the exact questions referring vets are asking"].map((x,i)=>(
                    <div key={i} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:`1px solid ${bdr}`,fontSize:12,color:t0,fontWeight:500}}>
                      <span style={{color:blue,flexShrink:0,fontWeight:700}}>✓</span>{x}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.15em",textTransform:"uppercase",color:blue,marginBottom:16}}>What This Means for Waves Mobile — Action Items</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:24}}>
                {[
                  {icon:"🌐",title:"Website Language",body:"Rewrite wavesmobileacvim.com with clear, structured answers to the questions AI models are asked: 'Who provides mobile ultrasound in LA?', 'What is a mobile ACVIM specialist?', 'How fast are ultrasound reports?'. AI reads and cites pages that directly answer questions.",effort:"One-time, LOW effort"},
                  {icon:"📋",title:"Google Business Profile",body:"A fully completed, regularly updated Google Business Profile is one of the most cited sources in local AI search results. Category, services, hours, description, photos — all need to be complete. This directly feeds Google's AI Overview.",effort:"Setup + monthly, LOW effort"},
                  {icon:"📝",title:"LinkedIn Articles as Citations",body:"When Dr. Eiler publishes educational articles on LinkedIn, those articles become citable sources for AI. A post titled 'When to refer for cardiac ultrasound' can surface when a vet asks an AI assistant that exact question.",effort:"Ongoing — already planned"},
                  {icon:"🗂️",title:"Veterinary Directories",body:"List Waves Mobile on AVMA member directory, VIN (Veterinary Information Network), local vet association directories, and specialty referral networks. AI models pull from structured directory data when recommending specialists.",effort:"One-time, LOW effort"},
                  {icon:"⭐",title:"Google Reviews",body:"AI systems factor review volume and sentiment into recommendations. Asking existing clinic partners for Google reviews — even 10–15 — meaningfully increases the likelihood that an AI recommends Waves Mobile over an unlisted competitor.",effort:"Ongoing ask, LOW effort"},
                  {icon:"❓",title:"FAQ Page on Website",body:"Add a dedicated FAQ page answering: 'How quickly are reports delivered?', 'What areas do you serve?', 'What scans do you perform?', 'What does ACVIM mean?'. AI assistants frequently pull verbatim answers from FAQ pages when responding to user queries.",effort:"One-time, LOW effort"},
                ].map(x=>(
                  <div key={x.title} style={{background:bg2,border:`1px solid ${bdr}`,borderRadius:12,padding:18}}>
                    <div style={{fontSize:24,marginBottom:8}}>{x.icon}</div>
                    <div style={{fontWeight:700,fontSize:14,color:t0,marginBottom:6}}>{x.title}</div>
                    <div style={{fontSize:12,color:t1,lineHeight:1.6,marginBottom:10}}>{x.body}</div>
                    <div style={{background:bg1,borderRadius:6,padding:"5px 10px",fontSize:10,fontWeight:700,color:blue,display:"inline-block",letterSpacing:"0.04em"}}>{x.effort}</div>
                  </div>
                ))}
              </div>

              <div style={{background:bg2,border:`1px solid ${blue}30`,borderRadius:10,padding:"16px 20px"}}>
                <div style={{fontSize:13,fontWeight:700,color:t0,marginBottom:8}}>The compounding effect</div>
                <p style={{fontSize:13,color:t1,lineHeight:1.7,margin:0}}>Every LinkedIn article Dr. Eiler publishes, every Google review a clinic leaves, every directory listing added — these stack. AI models synthesize across sources. A vet in Ventura asking ChatGPT "who does mobile cardiac ultrasound in LA?" will surface Waves Mobile if the web presence is structured correctly. Most mobile vet practices have none of this in place. <strong style={{color:t0}}>This is a wide open competitive advantage.</strong></p>
              </div>
            </div>

                        <div style={{...card,padding:36,marginBottom:48,textAlign:"center"}}>
              <div style={{...sl(),marginBottom:16}}>Bottom Line</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:t0,lineHeight:1.6,maxWidth:640,margin:"0 auto"}}>Waves Mobile has all the ingredients of a premium, defensible, growing business: rare clinical expertise, geographic mobility, and established clinic relationships. The missing piece is the operational infrastructure and marketing narrative to monetize that expertise at full capacity. <em style={{color:blue}}>That gap closes with this plan.</em></div>
            </div>
          </div>
        )}

      </div>

      <footer style={{borderTop:`1px solid ${bdr}`,marginTop:60,padding:"24px 28px",background:bg1}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:13,color:t1}}>Waves Mobile ACVIM · Operational Transformation Proposal · February 2026</div>
          <div style={{fontSize:12,color:t2}}>Private — Prepared for Dr. Karen Eiler</div>
        </div>
      </footer>
    </div>
  );
}
