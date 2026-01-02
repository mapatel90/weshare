"use client";

import React, { useEffect, useState } from 'react';
import { Activity, Battery, Power, Zap, batteryPlus } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Battery0BarOutlined, Battery90Rounded, Battery90TwoTone } from '@mui/icons-material';
import { sumFieldFromObject, formatShort, convertEnergyToKwh } from '@/utils/common';

export default function SolarPlantOverviewCard() {
  const { lang } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------- Fetch data ----------------
  useEffect(() => {
    const fetchData = async () => {
      const res = await apiGet("/api/dashboard/plantdetails");
      setProjects(res?.data?.projects || []);
      setLoading(false);
    };
    fetchData();
  }, []);
  let isDark = false;

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color,
    trend,
    isDark = false,
  }) => {
    const colors = {
      cardBg: isDark ? "#121a2d" : "#fff",
      text: isDark ? "#ffffff" : "#111827",
      textMuted: isDark ? "#b1b4c0" : "#111827",
      textSubtitle: isDark ? "#111827" : "#111827",
      border: isDark ? "#1b2436" : "#f3f4f6",
      trendPositiveBg: isDark ? "rgba(34, 197, 94, 0.2)" : "#dcfce7",
      trendPositiveText: isDark ? "#22c55e" : "#166534",
      trendNegativeBg: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
      trendNegativeText: isDark ? "#ef4444" : "#991b1b",
      boxShadow: isDark
        ? "0 0 20px rgba(14, 32, 56, 0.3)"
        : "0 1px 3px rgba(0,0,0,0.1)",
    };

    return (
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: 12,
          boxShadow: colors.boxShadow,
          padding: 24,
          border: `1px solid ${colors.border}`,
          transition: "box-shadow 0.3s",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon style={{ width: 24, height: 24, color: "#fff" }} />
          </div>
          {trend !== null && trend !== undefined && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 8px",
                borderRadius: 4,
                backgroundColor:
                  trend > 0 ? colors.trendPositiveBg : colors.trendNegativeBg,
                color:
                  trend > 0
                    ? colors.trendPositiveText
                    : colors.trendNegativeText,
              }}
            >
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
          )}
        </div>
        <h3
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: colors.text,
            marginBottom: 4,
          }}
        >
          {value}
        </h3>
        <p style={{ fontSize: 14, color: colors.textMuted }}>{title}</p>
        <p style={{ fontSize: 12, color: colors.textSubtitle, marginTop: 4 }}>
          {subtitle}
        </p>
      </div>
    );
  };

  // ---------------- Calculations ----------------
  const total_power = sumFieldFromObject(projects, "power");
  const total_capacity = sumFieldFromObject(projects, "project_size");
  const daily_energy = sumFieldFromObject(projects, "day_energy");
  const monthly_energy = sumFieldFromObject(projects, "month_energy");
  const total_energy = sumFieldFromObject(projects, "total_energy");

  const formatPower = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric === 0) return "0 W";
    return numeric >= 1 ? `${numeric?.toFixed(2)} kWh` : `${numeric * 1000} W`;
  };

  if (loading) return null;

  //This is to calculate daily revenue
  let daily_revenue = 0;
  let monthly_revenue = 0;
  let total_revenue = 0;
  const projectsDailyRevenue = projects.map((project) => {
    const pricePerKwh = project.price_kwh || 0;

    const totalDayEnergy = project.project_data.reduce(
      (sum, pd) => sum + (convertEnergyToKwh(pd.day_energy, pd.day_energy_str) || 0),
      0
    );

    const totalMonthEnergy = project.project_data.reduce(
      (sum, pd) => sum + (convertEnergyToKwh(pd.month_energy, pd.month_energy_str) || 0),
      0
    );

    const totalEnergy = project.project_data.reduce((sum, pd, index) => {
      const energyKwh = convertEnergyToKwh(
        pd.total_energy,
        pd.total_energy_str
      );
      return sum + (energyKwh || 0);
    }, 0);
    
    const cal_day_revenue = (pricePerKwh * totalDayEnergy).toFixed(4);
    const cal_month_revenue = (pricePerKwh * totalMonthEnergy).toFixed(4);
    const cal_total_revenue = (pricePerKwh * totalEnergy).toFixed(4);
    daily_revenue += Number(cal_day_revenue);
    monthly_revenue += Number(cal_month_revenue);
    total_revenue += Number(cal_total_revenue);
  });
  
  return (
    <div className="col-12">
      <div className="card stretch stretch-full">
        <div className="card-body">
          {/* Header */}
          <div className="mb-4 hstack justify-content-between">
            <div>
              <h5 className="mb-1">
                {lang("header.plantoverview", "Stats Overview")}
              </h5>
              <span className="fs-12 text-muted">
                {lang("header.statsDescription", "Overview of stats")}
              </span>
            </div>
          </div>
          {/* Stats Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <StatCard
              icon={Power}
              title={lang("projectView.projectInformation.capacitsy", "Power")}
              value={formatPower(total_power)}
              subtitle={
                lang("reports.capacityperKWhs", "Capacity") +
                ": " +
                (total_capacity ? total_capacity.toFixed(2) : "0") +
                " kWh"
              }
              color="linear-gradient(to bottom right, #fbbf24, #f97316)"
              trend={null}
              isDark={isDark}
            />
            <StatCard
              icon={Zap}
              title={lang("reports.dailyYield", "Daily Yield")}
              value={(daily_energy ? daily_energy?.toFixed(2) : "0") + " kWh"}
              subtitle={
                "Today Earnings: " + formatShort(daily_revenue, 3) + " VND"
              }
              color="linear-gradient(to bottom right, #3b82f6, #2563eb)"
              isDark={isDark}
            />
            <StatCard
              icon={Activity}
              title={lang("reports.monthlyYield", "Monthly Yield")}
              value={(monthly_energy ? monthly_energy : "0") + " MWh"}
              subtitle={
                "Monthly Earning: " + formatShort(monthly_revenue, 3) + " VND"
              }
              color="linear-gradient(to bottom right, #a855f7, #ec4899)"
              trend={projects?.revenue_trend ?? null}
              isDark={isDark}
            />
            <StatCard
              icon={Activity}
              title={lang("reports.totalYield", "Total Yield")}
              value={(total_energy ? total_energy.toFixed(3) : "0") + " MWh"}
              subtitle={
                "Total Earning: " + formatShort(total_revenue, 3) + " VND"
              }
              color="linear-gradient(to bottom right, #06b6d4, #0891b2)"
              trend={null}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
