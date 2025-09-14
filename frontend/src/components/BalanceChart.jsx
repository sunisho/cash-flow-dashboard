// src/components/BalanceChart.jsx
import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function BalanceChart({ weekly }) {

  // Debug: log the first row of weekly data
  if (weekly && weekly.length > 0) {
    console.log("Weekly sample:", weekly[0]);
  }


  // weekly should be an array of objects, each with keys: Date, Balance
  if (!weekly || weekly.length === 0) {
    return <div>No balance data available.</div>;
  }

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Balance Over Time</h3>
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer>
          <LineChart
            data={weekly}
            margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
          >
            <CartesianGrid stroke="#ccc" strokeDasharray="3 3" />
            <XAxis dataKey="Date" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="Balance" stroke="#82ca9d" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
