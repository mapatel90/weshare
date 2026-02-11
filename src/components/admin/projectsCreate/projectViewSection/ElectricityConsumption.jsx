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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { usePathname } from "next/navigation";

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

    const consume_energy = Number(src.consume_energy) || 0;
    const energy = Number(src.energy) || 0;
    const grid_purchased_energy = Number(src.grid_purchased_energy) || 0;

    return {
      label: dayjs(dateKey).format("DD/MM"),
      day,
      energy,
      grid_purchased_energy,
      consume_energy,
    };
  });
};

// Single-axis max (kWh): take max across all 3 series and pad nicely
const getMaxKwhValue = (rows = []) => {
  const rawMax = Math.max(
    ...rows.map((r) =>
      Math.max(
        Number(r.energy) || 0,
        Number(r.grid_purchased_energy) || 0,
        Number(r.consume_energy) || 0
      )
    ),
    0
  );

  if (!rawMax || !Number.isFinite(rawMax)) return 10;

  // kWh step sizing
  let step = 1;
  if (rawMax <= 10) step = 1;
  else if (rawMax <= 50) step = 5;
  else if (rawMax <= 100) step = 10;
  else if (rawMax <= 500) step = 50;
  else if (rawMax <= 1000) step = 100;
  else step = 250;

  const paddedMax = rawMax * 1.1;
  return Math.ceil(paddedMax / step) * step;
};

const generateTicks = (max) => {
  if (!max) return [];

  const approxSteps = 5;
  let step = Math.max(1, Math.round(max / approxSteps));

  // Round step to nice kWh numbers
  if (step >= 100) step = Math.ceil(step / 50) * 50;
  else if (step >= 10) step = Math.ceil(step / 5) * 5;
  else step = Math.ceil(step);

  const out = [];
  for (let v = 0; v <= max; v += step) out.push(v);
  if (!out.includes(max)) out.push(max);
  return out;
};

const ElectricityConsumption = ({
  data,
  loading = false,
  selectedMonthYear,
  onMonthYearChange,
  isDark = false,
}) => {
  const { lang } = useLanguage();
  const path = usePathname();
  const isExchangeHub = path?.includes("/frontend/exchange-hub");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    selectedMonthYear ? dayjs(selectedMonthYear, "YYYY-MM").toDate() : new Date()
  );


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

  // Sync internal Date object with incoming YYYY-MM, same pattern as MonthChart.jsx
  useEffect(() => {
    if (selectedMonthYear) {
      setSelectedDate(dayjs(selectedMonthYear, "YYYY-MM").toDate());
    }
  }, [selectedMonthYear]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date && onMonthYearChange) {
      const monthYear = dayjs(date).format("YYYY-MM");
      onMonthYearChange(monthYear);
    }
  };

  const maxKwhValue = useMemo(() => getMaxKwhValue(chartData), [chartData]);
  const yTicks = useMemo(() => generateTicks(maxKwhValue), [maxKwhValue]);

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
        key: "energy",
        title: lang("common.energy", "Energy"),
        color: "#f97316",
      },
      {
        key: "grid_purchased_energy",
        title: lang("common.grid_purchased_energy", "Grid"),
        color: "#2563eb",
      },
      {
        key: "consume_energy",
        title: lang("projects.consume", "Total consumption"),
        color: "#22c55e",
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
                  {title} :
                </span>
              </div>
              <span style={{ color }}>
                {`${formatShort(value)} kWh`}
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
          backgroundColor: isDark ? "#121a2d" : "#ffffff",
          borderRadius: 12,
          border: `1px solid ${isDark ? "#1b2436" : "#e5e7eb"}`,
          boxShadow: isDark
            ? "0 0 20px rgba(14, 32, 56, 0.3)"
            : "0 1px 3px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)",
          padding: 20,
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
          backgroundColor: isDark ? "#121a2d" : "#ffffff",
          borderRadius: 12,
          border: `1px solid ${isDark ? "#1b2436" : "#e5e7eb"}`,
          boxShadow: isDark
            ? "0 0 20px rgba(14, 32, 56, 0.3)"
            : "0 1px 3px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)",
          padding: 20,
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
    <>
      <style>{`
      .date-picker-wrapper .react-datepicker__input-container input {
        width: 100%;
        padding: ${isMobile ? '10px 12px' : '8px 12px'};
        border-radius: 8px;
        border: 1px solid ${isDark ? '#1b2436' : '#d1d5db'};
        background: ${isDark ? '#121a2d' : '#fff'};
        color: ${isDark ? '#ffffff' : '#111827'};
        font-size: ${isMobile ? '13px' : '14px'};
      }
      .date-picker-wrapper .react-datepicker__input-container input:focus {
        outline: none;
        border-color: #3b82f6;
      }
    `}</style>
      <div
        style={{
          padding: isMobile ? 16 : isTablet ? 20 : 24,
          transition: "box-shadow 0.3s ease",
          width: "100%",
          marginBottom: isMobile ? 16 : 24,
          backgroundColor: isExchangeHub ? "transparent" : isDark ? "#020617" : "#ffffff",
          border: isExchangeHub ? "none" : `1px solid ${isDark ? "#1f2937" : "#e5e7eb"}`,
          borderRadius: isExchangeHub ? 0 : 12,
          boxShadow: isExchangeHub ? "none" : isDark ? "0 0 20px rgba(14, 32, 56, 0.3)" : "0 1px 3px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
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
            <FiZap />
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
                "chart_label.electricityConsumption",
                "Daily Electricity Consumption by Source"
              )}
            </div>
            {/* <div
            style={{
              fontSize: 12,
              color: isDark ? "#9ca3af" : "#6b7280",
            }}
          >
            {lang(
              "projects.electricityConsumptionSubtitle",
              "Day-wise breakdown for the selected month."
            )}
          </div> */}
          </div>
        </div>

        <div
          className="date-picker-wrapper"
          style={{
            width: isExchangeHub ? "27%" : isMobile ? "30%" : isTablet ? "50%" : "10%",
            marginBottom: 12,
          }}
        >
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="MM / yyyy"
            showMonthYearPicker
            placeholderText={lang(
              "projects.electricityConsumptionMonth",
              "Select month and year"
            )}
          />
        </div>

        <div
          style={{
            width: "100%",
            height: isMobile ? 380 : isTablet ? 420 : 360,
            overflowX: isMobile || isTablet ? "auto" : "visible",
          }}
        >
          <ResponsiveContainer
            width={isMobile ? "100%" : "98%"}
            height={isMobile ? "80%" : "88%"}
            minWidth={isMobile ? 320 : isTablet ? 560 : 0}
          >
            <ComposedChart
              data={chartData}
              // stackOffset="none"
              // barGap={isMobile ? -14 : -18}
              margin={{
                top: isMobile ? 20 : 24,
                right: isMobile ? 12 : 24,
                left: isMobile ? 8 : 24,
                bottom: isMobile ? 10 : 16,
              }}
              barCategoryGap="10%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#1f2937" : "#e5e7eb"}
                opacity={0.5}
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: isMobile ? 10 : 12, fill: isDark ? "#cbd5f5" : "#4b5563" }}
                tickMargin={8}
              />

              {/* Single Y-axis (kWh) for both bars + line */}
              <YAxis
                yAxisId="left"
                type="number"
                domain={[0, maxKwhValue]}
                ticks={yTicks}
                allowDecimals={false}
                tick={{ fontSize: isMobile ? 10 : 12, fill: isDark ? "#e5e7eb" : "#111827" }}
                label={{
                  value: lang("projects.kwh", "kWh"),
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

              <Tooltip content={renderTooltip} />

              <Bar
                yAxisId="left"
                dataKey="grid_purchased_energy"
                name={lang("chart_label.grid", "Grid'")}
                fill="#2563eb"
                stackId="total"
                barSize={isMobile ? 14 : 18}
                isAnimationActive={false}
              />

              <Bar
                yAxisId="left"
                dataKey="energy"
                name={lang("chart_label.weshare", "WeShare's")}
                fill="#f97316"
                stackId="total"
                barSize={isMobile ? 14 : 18}
                isAnimationActive={false}
              />

              {/* Consume Energy line */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="consume_energy"
                name={lang("projects.consumeEnergy", "Total consumption")}
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3, fill: "#22c55e" }}
                activeDot={{ r: 5, fill: "#22c55e" }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: isMobile ? 11 : 12,
                  color: isDark ? "#cbd5f5" : "#4b5563",
                }}
                iconSize={12}
              />

            </ComposedChart>

          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
};

export default ElectricityConsumption;