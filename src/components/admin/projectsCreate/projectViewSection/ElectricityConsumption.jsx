"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import { FiZap } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatShort } from "@/utils/common";

/**
 * Transform API data from `/projects/electricity/overview-chart`
 * into day-wise rows for the selected month.
 *
 * Input items look like:
 *   { label: "YYYY-MM-DD", evn: number, weshare: number, saving: number }
 */
const buildDayWiseData = (raw = [], selectedMonthYear) => {
  if (!Array.isArray(raw) || !selectedMonthYear) return [];

  const monthYear = dayjs(selectedMonthYear, "YYYY-MM").format("YYYY-MM");
  const daysInMonth = dayjs(`${monthYear}-01`).daysInMonth();

  // Map by ISO date → item
  const byDate = {};
  raw.forEach((row) => {
    if (!row?.label) return;
    const key = dayjs(row.label).format("YYYY-MM-DD");
    byDate[key] = row;
  });

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateKey = `${monthYear}-${String(day).padStart(2, "0")}`;
    const src = byDate[dateKey] || {};

    const evn = Number(src.evn) || 0;
    const weshare = Number(src.weshare) || 0;
    const consume_energy = Number(src.consume_energy) || 0;

    return {
      label: dayjs(dateKey).format("DD/MM"),
      day,
      evn,
      weshare,
      consume_energy,
    };
  });
};

// Get max value for bars (EVN + WeShare costs in VND)
const getMaxBarValue = (rows = []) => {
  const rawMax = Math.max(
    ...rows.map((r) => Math.max(r.evn || 0, r.weshare || 0)),
    0
  );

  if (!rawMax || !Number.isFinite(rawMax)) return 10;

  let step = 10;
  if (rawMax > 100 && rawMax <= 500) step = 50;
  else if (rawMax > 500 && rawMax <= 2000) step = 100;
  else if (rawMax > 2000) step = 250;

  return Math.ceil(rawMax / step) * step;
};

// Get max value for line (consume_energy in kWh)
const getMaxLineValue = (rows = []) => {
  const rawMax = Math.max(
    ...rows.map((r) => r.consume_energy || 0),
    0
  );

  if (!rawMax || !Number.isFinite(rawMax)) return 10;

  let step = 10;
  if (rawMax > 100 && rawMax <= 500) step = 50;
  else if (rawMax > 500 && rawMax <= 2000) step = 100;
  else if (rawMax > 2000) step = 250;

  return Math.ceil(rawMax / step) * step;
};

const generateTicks = (max) => {
  if (!max) return [];
  const approxSteps = 5;
  const step = Math.max(1, Math.round(max / approxSteps));
  const out = [];
  for (let v = 0; v <= max; v += step) out.push(v);
  if (!out.includes(max)) out.push(max);
  return out;
};

/**
 * ElectricityConsumption
 *
 * Day-wise EVN + WeShare "consumption" chart for a single month.
 * - Blue + orange stacked bars for EVN & WeShare
 * - Green line showing total (EVN + WeShare)
 *
 * Props:
 * - data: raw array from `/projects/electricity/overview-chart` (type = "day")
 * - loading: boolean
 * - selectedMonthYear: string "YYYY-MM" for the month to display
 * - isDark: boolean for theming
 */
const ElectricityConsumption = ({
  data,
  loading = false,
  selectedMonthYear,
  isDark = false,
}) => {
  const { lang } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const chartData = useMemo(
    () => buildDayWiseData(data, selectedMonthYear),
    [data, selectedMonthYear]
  );

  const maxBarValue = useMemo(() => getMaxBarValue(chartData), [chartData]);
  const maxLineValue = useMemo(() => getMaxLineValue(chartData), [chartData]);
  const yBarTicks = useMemo(() => generateTicks(maxBarValue), [maxBarValue]);
  const yLineTicks = useMemo(() => generateTicks(maxLineValue), [maxLineValue]);

  // ------- Custom Tooltip so labels (EVN / Total / WeShare) are always visible -------
  const renderTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    // Build a small map so we can show in a fixed order
    const map = {};
    payload.forEach((p) => {
      if (!p || p.value == null) return;
      map[p.dataKey] = p;
    });

    const rows = [
      {
        key: "evn",
        title: lang("common.env", "EVN"),
        color: "#2563eb",
      },
      {
        key: "consume_energy",
        title: lang("projects.consumeEnergy", "Consume Energy"),
        color: "#22c55e",
      },
      {
        key: "weshare",
        title: lang("common.weshare", "WeShare"),
        color: "#f97316",
      },
    ];

    return (
      <div
        style={{
          backgroundColor: isDark ? "#020617" : "#ffffff",
          border: `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
          borderRadius: 12,
          padding: "10px 12px",
          boxShadow: "0 10px 25px rgba(15,23,42,0.25)",
          minWidth: 150,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 6,
            color: isDark ? "#e5e7eb" : "#111827",
          }}
        >
          {lang("common.day", "Day")} {label}
        </div>
        {rows.map(({ key, title, color }) => {
          const item = map[key];
          if (!item) return null;
          const value = Number(item.value) || 0;
          return (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 12,
                marginTop: 2,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "999px",
                    backgroundColor: color,
                  }}
                />
                <span
                  style={{
                    color: isDark ? "#e5e7eb" : "#111827",
                  }}
                >
                  {title}
                </span>
              </div>
              <span style={{ color }}>
                {key === "consume_energy" 
                  ? `${formatShort(value)} kWh`
                  : `${formatShort(value)} VND`}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 320,
          color: isDark ? "#cbd5f5" : "#4b5563",
          fontSize: 14,
        }}
      >
        {lang("common.loading", "Loading...")}
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 320,
          color: isDark ? "#6b7280" : "#9ca3af",
          fontSize: 14,
        }}
      >
        {lang(
          "projects.noConsumptionData",
          "No electricity consumption data for this period."
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: isMobile ? 380 : isTablet ? 420 : 360,
        overflowX: isMobile || isTablet ? "auto" : "visible",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "#0f172a" : "#eff6ff",
            color: "#2563eb",
          }}
        >
          <FiZap size={18} />
        </div>
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: isDark ? "#e5e7eb" : "#111827",
            }}
          >
            {lang(
              "projects.electricityConsumptionTitle",
              "Electricity Consumption: EVN + WeShare"
            )}
          </div>
          <div
            style={{
              fontSize: 12,
              color: isDark ? "#9ca3af" : "#6b7280",
            }}
          >
            {lang(
              "projects.electricityConsumptionSubtitle",
              "Day-wise breakdown for the selected month."
            )}
          </div>
        </div>
      </div>

      <ResponsiveContainer
        width={isMobile ? "100%" : "98%"}
        height={isMobile ? "80%" : "88%"}
        minWidth={isMobile ? 320 : isTablet ? 560 : 0}
      >
        <ComposedChart
          data={chartData}
          margin={{
            top: isMobile ? 20 : 24,
            right: isMobile ? 12 : 24,
            left: isMobile ? 8 : 24,
            bottom: isMobile ? 10 : 16,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? "#1f2937" : "#e5e7eb"}
            opacity={0.5}
          />

          <XAxis
            dataKey="label"
            tick={{ fontSize: isMobile ? 10 : 12 }}
            tickMargin={8}
          />

          {/* Left Y-axis for bars (EVN + WeShare costs in VND) */}
          <YAxis
            yAxisId="left"
            type="number"
            domain={[0, maxBarValue]}
            ticks={yBarTicks}
            tick={{ fontSize: isMobile ? 10 : 12, fill: isDark ? "#e5e7eb" : "#111827" }}
            label={{
              value: lang("projects.costVND", "Cost (VND)"),
              angle: -90,
              position: "insideLeft",
              offset: 10,
              dx: -20,
              style: {
                fill: isDark ? "#cbd5f5" : "#4b5563",
                fontSize: 12,
              },
            }}
            tickFormatter={(v) => formatShort(v)}
          />

          {/* Right Y-axis for line (Consume Energy in kWh) */}
          <YAxis
            yAxisId="right"
            type="number"
            domain={[0, maxLineValue]}
            ticks={yLineTicks}
            orientation="right"
            tick={{ fontSize: isMobile ? 10 : 12, fill: "#22c55e" }}
            label={{
              value: lang("projects.kwh", "kWh"),
              angle: 90,
              position: "insideRight",
              offset: 10,
              dx: 20,
              style: {
                fill: "#22c55e",
                fontSize: 12,
              },
            }}
            tickFormatter={(v) => formatShort(v)}
          />

          <Tooltip content={renderTooltip} />

          <Legend
            wrapperStyle={{
              fontSize: isMobile ? 11 : 12,
            }}
            iconSize={12}
          />

          {/* EVN */}
          <Bar
            yAxisId="left"
            dataKey="evn"
            name={lang("common.env", "EVN")}
            stackId="consumption"
            fill="#2563eb"
            barSize={isMobile ? 10 : 14}
            radius={[4, 4, 0, 0]}
          />

          {/* WeShare */}
          <Bar
            yAxisId="left"
            dataKey="weshare"
            name={lang("common.weshare", "WeShare")}
            stackId="consumption"
            fill="#f97316"
            barSize={isMobile ? 10 : 14}
            radius={[4, 4, 0, 0]}
          />

          {/* Consume Energy line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="consume_energy"
            name={lang("projects.consumeEnergy", "Consume Energy")}
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3, fill: "#22c55e" }}
            activeDot={{ r: 5, fill: "#22c55e" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ElectricityConsumption;