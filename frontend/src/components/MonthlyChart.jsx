// src/components/MonthlyChart.jsx
import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
} from "recharts";

export default function MonthlyChart({ monthly }) {
  if (!monthly || monthly.length === 0) {
    return <div>No monthly data available.</div>;
  }

  return (
    <div>
      <h3>Monthly Inflows vs Outflows (with Net)</h3>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <ComposedChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="YM" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Inflows" fill="#82ca9d" />
            <Bar dataKey="Outflows" fill="#ff7f50" />
            <Line type="monotone" dataKey="Net" stroke="#ffffff" dot={false} />

            {/* Shade months with negative Net */}
            {monthly.map((row, i) =>
              row.Net < 0 ? (
                <ReferenceArea
                  key={`neg-net-${i}`}
                  x1={row.YM}
                  x2={row.YM}
                  y1={0}
                  y2="auto"
                  fill="rgba(255,0,0,0.15)"
                />
              ) : null
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
