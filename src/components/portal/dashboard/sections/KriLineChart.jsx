import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// Your KRI data
const data = [
  { time: "02:00", PV: 0.5, Battery: 0.2, Grid: 0, GridLoad: 0.3, BackupLoad: 0, TotalLoadForecast: 2.8, SOC: 60 },
  { time: "04:00", PV: 0.7, Battery: 0.3, Grid: 0, GridLoad: 0.4, BackupLoad: 0, TotalLoadForecast: 2.8, SOC: 62 },
  { time: "06:00", PV: 1.2, Battery: 0.5, Grid: 0, GridLoad: 0.6, BackupLoad: 0, TotalLoadForecast: 2.8, SOC: 65 },
  { time: "08:00", PV: 3.5, Battery: 2.0, Grid: 0, GridLoad: 1.5, BackupLoad: 0, TotalLoadForecast: 2.8, SOC: 70 },
  { time: "09:20", PV: 9.164, Battery: 6.275, Grid: 0, GridLoad: 2.889, BackupLoad: 0, TotalLoadForecast: 2.8, SOC: 81 },
  { time: "12:00", PV: 4.0, Battery: 3.0, Grid: 0, GridLoad: 2.0, BackupLoad: 0, TotalLoadForecast: 2.8, SOC: 75 },
  { time: "14:00", PV: 2.5, Battery: 2.0, Grid: 0, GridLoad: 1.2, BackupLoad: 0, TotalLoadForecast: 2.8, SOC: 72 },
  { time: "16:00", PV: 1.0, Battery: 1.0, Grid: 0, GridLoad: 0.8, BackupLoad: 0, TotalLoadForecast: 2.8, SOC: 68 },
  { time: "18:00", PV: 0.3, Battery: 0.2, Grid: 0, GridLoad: 0.2, BackupLoad: 0, TotalLoadForecast: 2.8, SOC: 65 },
];

const COLORS = {
  PV: "#FFD600",
  Battery: "#8BC34A",
  Grid: "#00BCD4",
  GridLoad: "#4DD0E1",
  BackupLoad: "#FF9100",
  TotalLoadForecast: "#FF7043",
  SOC: "#D500F9",
};

// Custom Tooltip (same style as screenshot)
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;

  return (
    <div
      style={{
        background: "white",
        padding: "15px 20px",
        borderRadius: "10px",
        boxShadow: "0 3px 12px rgba(0,0,0,0.15)",
      }}
    >
      <p style={{ margin: 0, fontWeight: "600" }}>{label}</p>

      {payload.map((p, index) => (
        <p key={index} style={{ margin: 0, color: p.color }}>
          {p.name}: {p.value}
          {p.name === "SOC" ? "%" : "kW"}
        </p>
      ))}
    </div>
  );
};

export default function KriLineChart() {
  return (
    <div style={{ width: "100%", height: 420 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 40, right: 60, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />

          {/* X & Y Axis */}
          <XAxis dataKey="time" />
          <YAxis
            yAxisId="left"
            domain={[-3, 12]}
            label={{ value: "kW", angle: -90, position: "insideLeft" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            label={{ value: "%", angle: 90, position: "insideRight" }}
          />

          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} />

          {/* Legend */}
          <Legend verticalAlign="bottom" height={36} />

          {/* Crosshair highlight reference (09:20) */}
          <ReferenceLine x="09:20" stroke="#D98E00" strokeDasharray="4 4" />
          <ReferenceLine y={2.8} stroke="#FF7043" strokeDasharray="4 4" />

          {/* Lines */}
          <Line yAxisId="left" type="monotone" dataKey="PV" stroke={COLORS.PV} dot={false} strokeWidth={2} />
          <Line yAxisId="left" type="monotone" dataKey="Battery" stroke={COLORS.Battery} dot={false} strokeWidth={2} />
          <Line yAxisId="left" type="monotone" dataKey="Grid" stroke={COLORS.Grid} dot={false} strokeWidth={2} />
          <Line yAxisId="left" type="monotone" dataKey="GridLoad" stroke={COLORS.GridLoad} dot={false} strokeWidth={2} />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="TotalLoadForecast"
            stroke={COLORS.TotalLoadForecast}
            strokeDasharray="5 5"
            dot={false}
            strokeWidth={2}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="SOC"
            stroke={COLORS.SOC}
            strokeWidth={2}
            dot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
