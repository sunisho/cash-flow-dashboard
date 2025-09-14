import React, { useState } from 'react'
import UploadForm from './components/UploadForm'
import KpiCards from './components/KpiCards'
import MonthlyChart from './components/MonthlyChart'
import WeeklyChart from './components/WeeklyChart'
import SeasonalityChart from './components/SeasonalityChart'
import BalanceChart from './components/BalanceChart';


export default function App(){
const [data, setData] = useState(null)


return (
<div className="container">
<header style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
<div style={{width:36,height:36,background:'#3752f5',borderRadius:10,display:'grid',placeItems:'center',fontWeight:700}}>CF</div>
<div>
<h1 style={{margin:0}}>Cash Flow Dashboard</h1>
<div className="muted" style={{fontSize:12}}>Upload weekly CSV → monthly trends, runway, seasonality & AI insights</div>
</div>
</header>


<div className="grid grid-3">
<div className="card" style={{gridColumn:'1 / -1'}}>
<UploadForm onAnalyzed={setData} />
</div>
</div>


{data && (
<>
<div className="grid grid-2" style={{marginTop:12}}>
<div className="card">
<h3 style={{marginTop:0}}>Callouts</h3>
{!data?.callouts && <div className="muted">None.</div>}
{data?.callouts && (
<div className="muted" style={{fontSize:14}}>
<div><strong>Risk months:</strong> {data.callouts.risk_months?.map(r=>`${r.month}`).join(', ') || 'None'}</div>
<div style={{marginTop:6}}><strong>Healthy:</strong> {data.callouts.healthy_months?.map(r=>`${r.month}`).join(', ') || 'None'}</div>
<div style={{marginTop:6}}><strong>Concerning:</strong> {data.callouts.concerning_months?.map(r=>`${r.month}`).join(', ') || 'None'}</div>
<div style={{marginTop:6}}><strong>Weeks with negative net change: </strong> {data.callouts.weekly_breaches?.length || 0} weeks</div>
</div>
)}
</div>
<div className="card">
<h3 style={{marginTop:0}}>AI‑Based Recommendations</h3>
{!data.recs && <div className="muted">Provide an OpenAI API key in the backend .env to enable richer recommendations. Rule-based flags still appear above.</div>}
{data.recs && (
<div dangerouslySetInnerHTML={{__html: data.recs.replace(/\n/g,'<br>')}} />
)}
</div>
</div>
<div className="grid grid-2" style={{marginTop:12}}>
<KpiCards data={data} />
<div className="card"><MonthlyChart monthly={data.monthly} /></div>
<div className="card"><WeeklyChart weekly={data.weekly} thresholdLabel={data.threshold} /></div>
</div>
<div className="card"><BalanceChart weekly={data.weekly} /></div>
<div className="card" style={{marginTop:12}}>
<SeasonalityChart seasonality={data.seasonality} />
</div>

</>
)}


<footer style={{marginTop:16}} className="muted">Built with React + Recharts · API: FastAPI</footer>
</div>
)
}