// src/components/WeeklyChart.jsx
import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

export default function WeeklyChart({ weekly, threshold = 0 }) {
  if (!weekly || weekly.length === 0) {
    return <div>No weekly data available.</div>;
  }

    const breaches = weekly.filter((row) => row.Net < threshold);

  return (
    <div>
      <h3>Weekly Net Change</h3>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <LineChart data={weekly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="Net" stroke="#8884d8" dot={false} />

            {/* Horizontal threshold line */}
            <ReferenceLine
              y={threshold}
              stroke="red"
              strokeDasharray="3 3"
              label={`Threshold (${threshold})`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* List of breaches */}
      {breaches.length > 0 ? (
        <div style={{ marginTop: "10px" }}>
          <h4>Weeks below threshold ({threshold}):</h4>
          <ul>
            {breaches.map((row, i) => (
              <li key={i}>
                {row.Date}: Net = {row.Net.toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{ marginTop: "10px" }}>No weeks fell below threshold.</div>
      )}
    </div>
  );
}
