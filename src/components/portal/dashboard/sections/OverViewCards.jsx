import React from "react";
import { formatEnergyUnit } from "@/utils/common";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/constants/roles";

// -------- HELPERS (similar to admin StatCards) ----------
const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  return Number.isNaN(num) ? "-" : num.toLocaleString();
};

const toNumericOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const sumMetric = (source, key) => {
  if (!source || !Array.isArray(source)) return null;
  const total = source.reduce((sum, entry) => {
    const numeric = toNumericOrNull(entry?.[key]);
    return numeric === null ? sum : sum + numeric;
  }, 0);
  return total === 0 ? null : total;
};

const renderEnergyDisplay = (value) => {
  const formatted = formatEnergyUnit(value);
  if (typeof formatted !== "string") return formatted;

  const match = formatted.match(/^(\d[\d,]*)(\.[\d,]+)?\s*(.*)$/);
  if (!match) return formatted;

  const integerPart = match[1];
  const fractionalPart = match[2] ?? "";
  const unitPart = match[3] ? ` ${match[3]}` : "";
  const suffix = `${fractionalPart}${unitPart}`;

  return (
    <>
      <span style={{ fontSize: "1.40em", fontWeight: 700 }}>{integerPart}</span>
      {suffix && (
        <span
          style={{ fontSize: "0.8em", fontWeight: "normal", marginLeft: "2px" }}
        >
          {suffix}
        </span>
      )}
    </>
  );
};

// Simple circular progress for Capital Recovery %
const CircularProgress = ({
  percentage = 0,
  size = 100,
  strokeWidth = 12,
  isDark,
  lang,
}) => {
  const safePercentage = Number.isFinite(Number(percentage))
    ? Math.max(0, Math.min(200, Number(percentage)))
    : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safePercentage / 100) * circumference;

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#f97316"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="45%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="700"
        fill={isDark ? "#fff" : "#111"}
      >
        <tspan x="50%" dy="-10" fontSize="18">
          {safePercentage.toFixed(2)}%
        </tspan>

        <tspan x="50%" dy="25" fontSize="18" fontWeight="400">
          {lang ? lang("common.capital", "Capital") : "Capital"}
        </tspan>

        <tspan x="50%" dy="15" fontSize="16" fontWeight="400">
          {lang ? lang("common.Recovered", "Recovered") : "Recovered"}
        </tspan>
      </text>
    </svg>
  );
};

export default function OverViewCards({
  inverterLatest = null,
  inverterLatestLoading = false,
  selectedProject = null,
  selectedInverter = null,
  totalProjectSize = null, // NEW
  // Capital recovery (percentage) for current scope
  capitalRecovery = null,
  capitalRecoveryLoading = false,
  lang,
}) {
  const { user } = useAuth();
  const isProjectSelected = !!selectedProject;
  const isInverterSelected = !!selectedInverter;

  const selectedProjectData = selectedProject?.project_data?.[0] || null;
  const projectInverters = Array.isArray(selectedProject?.project_inverters)
    ? selectedProject.project_inverters
    : [];
  const selectedInverterData = isInverterSelected
    ? projectInverters.find(
      (inv) =>
        String(inv.id) === String(selectedInverter?.id)
    )
    : null;

  const dailyYieldMetric = selectedInverterData
    ? toNumericOrNull(selectedInverterData?.day_energy)
    : isProjectSelected
      ? toNumericOrNull(selectedProjectData?.day_energy)
      : sumMetric(inverterLatest, "daily_yield");

  const monthlyYieldMetric = selectedInverterData
    ? toNumericOrNull(selectedInverterData?.month_energy)
    : isProjectSelected
      ? toNumericOrNull(selectedProjectData?.month_energy)
      : null;

  const totalYieldMetric = selectedInverterData
    ? toNumericOrNull(selectedInverterData?.total_energy)
    : isProjectSelected
      ? toNumericOrNull(selectedProjectData?.total_energy)
      : sumMetric(inverterLatest, "total_yield");

  let contextLabel;
  if (isInverterSelected) {
    contextLabel = "Selected Inverter";
  } else if (isProjectSelected) {
    contextLabel = "Selected Project";
  } else {
    contextLabel = "All Projects";
  }

  // project size: selected project size or aggregated total for all projects
  const projectSizeValue = isProjectSelected
    ? selectedProject.project_size ?? null
    : totalProjectSize ?? null;

  // Daily yield display
  let dailyYieldValue = "-";
  let dailyYieldSubtitle = `${lang("dashboard.energy_produced_today", "Energy produced today")}`;

  if (inverterLatestLoading) {
    dailyYieldValue = "Loading...";
    dailyYieldSubtitle = `Loading ${contextLabel.toLowerCase()} data...`;
  } else if (dailyYieldMetric !== null) {
    dailyYieldValue = dailyYieldMetric;
  } else {
    dailyYieldSubtitle = `No daily yield data for ${contextLabel.toLowerCase()}`;
  }

  // Monthly yield display
  let monthlyYieldValue = "-";
  let monthlyYieldSubtitle = `${lang("dashboard.energy_produced_this_month", "Energy produced this month")}`;

  if (inverterLatestLoading) {
    monthlyYieldValue = "Loading...";
    monthlyYieldSubtitle = `Loading ${contextLabel.toLowerCase()} data...`;
  } else if (monthlyYieldMetric !== null) {
    monthlyYieldValue = monthlyYieldMetric;
  } else {
    monthlyYieldSubtitle = `No monthly yield data for ${contextLabel.toLowerCase()}`;
  }

  // Total yield display
  let totalYieldValue = "-";
  let totalYieldSubtitle = `${lang("dashboard.lifetime_energy_produced", "Lifetime energy produced")}`;

  if (inverterLatestLoading) {
    totalYieldValue = "Loading...";
    totalYieldSubtitle = `Loading ${contextLabel.toLowerCase()} data...`;
  } else if (totalYieldMetric !== null) {
    totalYieldValue = totalYieldMetric;
  } else {
    totalYieldSubtitle = `No total yield data for ${contextLabel.toLowerCase()}`;
  }

  // Capital Recovery display (percentage)
  let capitalRecoveryPercent = 0;
  let capitalRecoverySubtitle = lang(
    "reports.capitalRecovery",
    "Capital Recovery"
  );
  const num = Number(capitalRecovery);
  capitalRecoveryPercent = Number.isNaN(num) ? 0 : num;
  return (

    <div className={`stats-grid ${user?.role === ROLES.INVESTOR ? "grid-investor" : "grid-default"}`}>
      <div className="stat-card blue">
        <div className="stat-icon flex items-center gap-2">
          <img
            src="/images/icons/power.png"
            alt="Power Icon"
            className="w-8 h-6"
          />
          <span className="text-gray-800 font-medium">{lang("dashboard.scope", "Scope")}</span>
        </div>
        <div className="stat-value">{renderEnergyDisplay(projectSizeValue)}</div>
        <div className="stat-label">{lang("dashboard.capacity", "Capacity")}</div>

        {/* NEW: show project_size (selected or aggregated total) */}
      </div>

      <div className="stat-card purple ">
        <div className="stat-icon flex items-center gap-2">
          <img
            src="/images/icons/daily_yield.png"
            alt="Daily Yield Icon"
            className="w-8 h-6"
          />
          <span className="text-gray-800 font-medium">{lang("reports.dailyYield", "Daily Yield")}</span>
        </div>
        <div className="stat-value">{renderEnergyDisplay(dailyYieldValue)}</div>
        <div className="stat-label">{dailyYieldSubtitle}</div>
      </div>

      <div className="stat-card cyan ">
        <div className="stat-icon flex items-center gap-2">
          <img
            src="/images/icons/monthly_yiled.png"
            alt="Monthly Yield Icon"
            className="w-8 h-6"
          />
          <span className="text-gray-800 font-medium">{lang("dashboard.monthly_yield", "Monthly Yield")}</span>
        </div>
        <div className="stat-value">{renderEnergyDisplay(monthlyYieldValue)}</div>
        <div className="stat-label">{monthlyYieldSubtitle}</div>
      </div>

      <div className="stat-card green">
        <div className="stat-icon flex items-center gap-2">
          <img
            src="/images/icons/total_yield.png"
            alt="Total Yield Icon"
            className="w-8 h-6"
          />
          <span className="text-gray-800 font-medium">{lang("reports.totalYield", "Total Yield")}</span>
        </div>
        <div className="stat-value">{renderEnergyDisplay(totalYieldValue)}</div>
        <div className="stat-label">{totalYieldSubtitle}</div>
      </div>

      {/* Capital Recovery circular progress */}
      {user?.role === ROLES.INVESTOR && (
        <div className="stat-card orange flex items-center justify-center">
          <div className="flex items-center justify-center">
            <CircularProgress
              percentage={capitalRecoveryPercent}
              size={140}
              strokeWidth={10}
              isDark={false}
              lang={lang}
            />
          </div>
        </div>
      )}
    </div>
  );
}
