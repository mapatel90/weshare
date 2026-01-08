import React from "react";
import { formatEnergyUnit } from "@/utils/common";

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

const renderValue = (value, unit = " kWh") => {
  if (value === null || value === undefined || value === "-") return "-";
  const valueStr = `${formatNumber(value)}${unit}`;
  const match = valueStr.match(/^(\d[\d,]*)(\.[\d,]+)?(.*)$/);
  if (!match) return valueStr;
  const integerPart = match[1];
  const fractionalPart = match[2] ?? "";
  const unitPart = match[3] ?? "";
  const fractionalAndUnit = fractionalPart
    ? `${fractionalPart}${unitPart}`
    : unitPart && !unitPart.startsWith(" ")
      ? ` ${unitPart}`
      : unitPart;

  return (
    <>
      <span>{integerPart}</span>
      {fractionalAndUnit && (
        <span style={{ fontSize: "0.6em", fontWeight: "normal" }}>
          {fractionalAndUnit}
        </span>
      )}
    </>
  );
};

export default function OverViewCards({
  inverterLatest = null,
  inverterLatestLoading = false,
  selectedProject = null,
  selectedInverter = null,
  totalProjectSize = null, // NEW
}) {
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

  const formatSize = (v) => {
    if (v === null || v === undefined) return "-";
    return renderValue(v, " kW");
  };

  // Daily yield display
  let dailyYieldValue = "-";
  let dailyYieldSubtitle = `Energy produced today (${contextLabel})`;

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
  let monthlyYieldSubtitle = `Monthly energy produced (${contextLabel})`;

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
  let totalYieldSubtitle = `Lifetime energy produced (${contextLabel})`;

  if (inverterLatestLoading) {
    totalYieldValue = "Loading...";
    totalYieldSubtitle = `Loading ${contextLabel.toLowerCase()} data...`;
  } else if (totalYieldMetric !== null) {
    totalYieldValue = totalYieldMetric;
  } else {
    totalYieldSubtitle = `No total yield data for ${contextLabel.toLowerCase()}`;
  }

  return (
    <div className="stats-grid">
      <div className="stat-card blue">
        <div className="stat-icon flex items-center gap-2">
          <img
            src="/images/icons/power.png"
            alt="Power Icon"
            className="w-8 h-6"
          />
          <span className="text-gray-800 font-medium">Scope</span>
        </div>
        <div className="stat-value">{formatSize(projectSizeValue)}</div>
        <div className="stat-label">
          {isInverterSelected
            ? selectedInverter?.name || "Selected inverter"
            : isProjectSelected
            ? selectedProject?.name || "Selected project"
            : "All of your projects"}
        </div>

        {/* NEW: show project_size (selected or aggregated total) */}
      </div>

      <div className="stat-card purple ">
        <div className="stat-icon flex items-center gap-2">
          <img
            src="/images/icons/daily_yield.png"
            alt="Daily Yield Icon"
            className="w-8 h-6"
          />
          <span className="text-gray-800 font-medium">Daily Yield</span>
        </div>
        <div className="stat-value">{formatEnergyUnit(dailyYieldValue)}</div>
        <div className="stat-label">{dailyYieldSubtitle}</div>
      </div>

      <div className="stat-card cyan ">
        <div className="stat-icon flex items-center gap-2">
          <img
            src="/images/icons/monthly_yiled.png"
            alt="Monthly Yield Icon"
            className="w-8 h-6"
          />
          <span className="text-gray-800 font-medium">Monthly Yield</span>
        </div>
        <div className="stat-value">{formatEnergyUnit(monthlyYieldValue)}</div>
        <div className="stat-label">{monthlyYieldSubtitle}</div>
      </div>

      <div className="stat-card green">
        <div className="stat-icon flex items-center gap-2">
          <img
            src="/images/icons/total_yield.png"
            alt="Total Yield Icon"
            className="w-8 h-6"
          />
          <span className="text-gray-800 font-medium">Total Yield</span>
        </div>
        <div className="stat-value">{formatEnergyUnit(totalYieldValue)}</div>
        <div className="stat-label">{totalYieldSubtitle}</div>
      </div>
    </div>
  );
}
