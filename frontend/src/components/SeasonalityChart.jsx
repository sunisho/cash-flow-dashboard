import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'


const monthName = (m)=> new Date(2000, m-1, 1).toLocaleString(undefined,{month:'short'})


export default function SeasonalityChart({ seasonality }){
const data = seasonality?.map(s=> ({ name: monthName(s.Month), Inflows: Math.round(s.AvgInflows), Outflows: Math.round(s.AvgOutflows) })) || []
return (
<div>
<h3 style={{marginTop:0}}>Seasonality (Avg by Calendar Month)</h3>
<div style={{width:'100%', height:320}}>
<ResponsiveContainer>
<LineChart data={data} margin={{top:10,right:10,bottom:0,left:0}}>
<CartesianGrid stroke="#223" />
<XAxis dataKey="name" stroke="#8fa" />
<YAxis stroke="#8fa" tickFormatter={(v)=> `$${v.toLocaleString()}`} />
<Tooltip formatter={(v)=> `$${Math.round(v).toLocaleString()}`} />
<Legend />
<Line type="monotone" dataKey="Inflows" stroke="#34d399" dot={false} />
<Line type="monotone" dataKey="Outflows" stroke="#f472b6" dot={false} />
</LineChart>
</ResponsiveContainer>
</div>
</div>
)
}