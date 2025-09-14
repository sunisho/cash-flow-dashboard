import React from 'react'
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid , ReferenceArea } from 'recharts'


export default function MonthlyChart({ monthly }){
const data = monthly?.map(m=> ({
name: m.YM,
Inflows: Math.round(m.Inflows),
Outflows: Math.round(m.Outflows),
Net: Math.round(m.Net)
}))||[]
return (
<div>
<h3 style={{marginTop:0}}>Monthly Inflows vs Outflows (Net line)</h3>
<div style={{width:'100%', height:320}}>
<ResponsiveContainer>
<ComposedChart data={data} margin={{top:10,right:10,bottom:0,left:0}}>
<CartesianGrid stroke="#223" />
<XAxis dataKey="name" stroke="#8fa" />
<YAxis stroke="#8fa" tickFormatter={(v)=> `$${v.toLocaleString()}`} />
<Tooltip formatter={(v)=> `$${Math.round(v).toLocaleString()}`} />
<Legend />
<Bar dataKey="Inflows" fill="#2dd4bf" />
<Bar dataKey="Outflows" fill="#f472b6" />
<Line dataKey="Net" stroke="#60a5fa" dot={false} />

  {/* Shade months with negative Net */}
  {monthly.map((row, i) =>
    row.Net < 0 ? (
      <ReferenceArea
        key={`neg-net-${i}`}
        x1={row.YM}
        x2={row.YM}
        y1={0}
        y2="auto"
        fill="rgba(255,0,0,0.1)"
      />
    ) : null
  )}

</ComposedChart>
</ResponsiveContainer>
</div>
</div>
)
}