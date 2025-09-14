import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceArea, ReferenceLine } from 'recharts'


export default function WeeklyChart({ weekly, thresholdLabel }){
const data = weekly?.map(w=> ({
date: w.Date,
Net: Math.round(w.Net),
Balance: Math.round(w.Balance)
})) || []
return (
<div>
<h3 style={{marginTop:0}}>Weekly Net Change (threshold = ${thresholdLabel})</h3>
<div style={{width:'100%', height:320}}>
<ResponsiveContainer>
<LineChart data={data} margin={{top:10,right:10,bottom:0,left:0}}>
<CartesianGrid stroke="#223" />
<XAxis dataKey="date" stroke="#8fa" minTickGap={24} />
<YAxis stroke="#8fa" tickFormatter={(v)=> `$${v.toLocaleString()}`} />
<Tooltip formatter={(v)=> `$${Math.round(v).toLocaleString()}`} />
<ReferenceArea y1={-1000000000} y2={thresholdLabel} fill="#7f1d1d" fillOpacity={0.15} />
<Line type="monotone" dataKey="Net" stroke="#60a5fa" dot={false} />
</LineChart>
</ResponsiveContainer>
</div>
</div>
)
}