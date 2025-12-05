import React from "react";

// -------- HELPERS (similar to admin StatCards) ----------
const formatNumber = (v, suffix = "") => {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "number") return v.toLocaleString() + suffix;
  return String(v) + suffix;
};

const toNumericOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

const getAggregatedMetric = (source, key) => {
  if (!source) return null;
  if (Array.isArray(source)) {
    let hasValue = false;
    const total = source.reduce((sum, entry) => {
      const numeric = toNumericOrNull(entry?.[key]);
      if (numeric === null) return sum;
      hasValue = true;
      return sum + numeric;
    }, 0);
    return hasValue ? total : null;
  }
  return toNumericOrNull(source?.[key]);
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

  const dailyYieldMetric = getAggregatedMetric(inverterLatest, "daily_yield");
  const totalYieldMetric = getAggregatedMetric(inverterLatest, "total_yield");

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
    return Number(v).toLocaleString() + " kW";
  };

  // Daily yield display
  let dailyYieldValue = "-";
  let dailyYieldSubtitle = `Energy produced today (${contextLabel})`;

  if (inverterLatestLoading) {
    dailyYieldValue = "Loading...";
    dailyYieldSubtitle = `Loading ${contextLabel.toLowerCase()} data...`;
  } else if (dailyYieldMetric !== null) {
    dailyYieldValue = `${formatNumber(dailyYieldMetric, " kWh")}`;
  } else {
    dailyYieldSubtitle = `No daily yield data for ${contextLabel.toLowerCase()}`;
  }

  // Total yield display
  let totalYieldValue = "-";
  let totalYieldSubtitle = `Lifetime energy produced (${contextLabel})`;

  if (inverterLatestLoading) {
    totalYieldValue = "Loading...";
    totalYieldSubtitle = `Loading ${contextLabel.toLowerCase()} data...`;
  } else if (totalYieldMetric !== null) {
    totalYieldValue = `${formatNumber(totalYieldMetric, " kWh")}`;
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
        <div className="stat-value">{dailyYieldValue}</div>
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
        <div className="stat-value">-</div>
        <div className="stat-label">Monthly earnings (coming soon)</div>
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
        <div className="stat-value">{totalYieldValue}</div>
        <div className="stat-label">{totalYieldSubtitle}</div>
      </div>
    </div>
  );
}
