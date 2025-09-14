import React from 'react'


function Stat({label, value, hint, tone='neutral'}){
const cls = tone==='good'?'good badge': tone==='bad'?'bad badge':'badge'
return (
<div className="card">
<div className="muted" style={{fontSize:12}}>{label}</div>
<div style={{fontSize:24, fontWeight:700, marginTop:4}}>{value ?? '-'}</div>
{hint && <div className={cls} style={{marginTop:8, display:'inline-block'}}>{hint}</div>}
</div>
)
}


export default function KpiCards({ data }){
const runway = data?.kpis?.runway_months
const runwayTxt = runway===Infinity? '∞' : (runway?.toFixed?.(1) ?? '-')
const lastNet = data?.monthly?.length? data.monthly[data.monthly.length-1].Net : null
return (
<>
<Stat label="Latest Monthly Net" value={lastNet!=null? `$${Math.round(lastNet).toLocaleString()}` : '-'} hint={lastNet>=0? 'Healthy' : 'Concerning'} tone={lastNet>=0? 'good':'bad'} />
<Stat label="Risk Months" value={data?.callouts?.risk_months?.length ?? 0} hint={data?.callouts?.risk_months?.map(r=>r.month).join(', ')?.slice(0,40)} />
</>
)
}