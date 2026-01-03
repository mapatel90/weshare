"use client";
import React, { useEffect, useState, useMemo } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import StatCardsGrid from "./projectViewSection/StateCard";
import PowerConsumptionDashboard from "./projectViewSection/inverterChart";
import ProjectInformation from "./projectViewSection/ProjectInformation";
import ProjectOverviewChart from "./projectViewSection/ProjectOverviewChart";
import MeterInfo from "./projectViewSection/MeterInfo";
import EnergyChart from "./projectViewSection/MonthChart";
import { FiEdit3 } from "react-icons/fi";
import SolarFlowCard from "./projectViewSection/Animated";
import { use } from "react";


// -------- DARK MODE HOOK ----------
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("app-skin-dark"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
};

// -------- NUMBER FORMATTER ----------
const formatNumber = (v, suffix = "") => {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "number") return v.toLocaleString() + suffix;
  return String(v) + suffix;
};

const ProjectViewContent = ({ projectId = "" }) => {
  const { lang } = useLanguage();
  const isDark = useDarkMode();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Contracts
  const [contracts, setContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(true);

  // Project Inverters (Dropdown)
  const [projectInverters, setProjectInverters] = useState([]);
  const [projectInvertersLoading, setProjectInvertersLoading] = useState(true);
  const [selectedInverterId, setSelectedInverterId] = useState(""); // No auto-select
  const [statCardsData, setStatCardsData] = useState([]);
  // Latest inverter data for selected inverter
  const [selectedInverterLatest, setSelectedInverterLatest] = useState(null);
  const [selectedInverterLatestLoading, setSelectedInverterLatestLoading] =
    useState(false);

  // Latest inverter data for this project (default)
  const [projectChartData, setProjectChartData] = useState(null);
  const [projectLatestLoading, setProjectLatestLoading] = useState(true);
  const [inverterChartData, setInverterChartData] = useState(null);
  const [inverterLatestLoading, setInverterLatestLoading] = useState(true);
  const [monthlyChartData, setMonthlyChartData] = useState(null);
  const [monthlyChartDataLoading, setMonthlyChartDataLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  ); // New: track selected date
  const [chartMonthData, setChartMonthData] = useState(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState(
    new Date().toISOString().slice(0, 7) // Format: YYYY-MM
  );

  // ------------------- Detect Mobile Screen -------------------
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ------------------- Load Project -------------------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiGet(`/api/projects/${projectId}`);
        if (res?.success) setProject(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId]);

  // ------------------- Load Contracts -------------------
  useEffect(() => {
    const loadContracts = async () => {
      try {
        setContractsLoading(true);
        const res = await apiGet(`/api/contracts?projectId=${projectId}`);
        setContracts(res?.success ? res.data : []);
      } finally {
        setContractsLoading(false);
      }
    };
    loadContracts();
  }, [projectId]);

  // ------------------- Load Project Inverters -------------------
  useEffect(() => {
    const loadProjectInverters = async () => {
      try {
        setProjectInvertersLoading(true);
        const res = await apiGet(
          `/api/project-inverters?project_id=${projectId}`
        );
        const list = res?.success ? res.data : [];
        setProjectInverters(list);
        // Do NOT auto-select first inverter
      } finally {
        setProjectInvertersLoading(false);
      }
    };
    loadProjectInverters();
  }, [projectId]);

  // ------------------- Load Latest Inverter Data for this project (default) -------------------
  useEffect(() => {
    const loadLatest = async () => {
      const payload = {
        projectId: projectId ?? null,
        projectInverterId: selectedInverterId ?? null,
        date: selectedDate ?? null,
      };
      try {
        setInverterLatestLoading(true);
        const res = await apiPost(`/api/inverter-data/chart-data`, payload);
        setInverterChartData(res?.success ? res.data : null);
      } finally {
        setInverterLatestLoading(false);
      }
    };
    loadLatest();
  }, [selectedInverterId, projectId, selectedDate]);

  // ------------------- Load Project Overview Chat (default) -------------------
  useEffect(() => {
    const loadLatest = async () => {
      const payload = {
        projectId: projectId ?? null,
        date: selectedDate ?? null,
      };
      try {
        setProjectLatestLoading(true);
        const res = await apiPost(`/api/projects/chart-data`, payload);
        setProjectChartData(res?.success ? res.data : null);
      } finally {
        setProjectLatestLoading(false);
      }
    };
    loadLatest();
  }, [projectId, selectedDate]);

  // ------------------- Load Count of daily yiled and total yiled -------------------
  useEffect(() => {
    const loadSelectedInverterLatest = async () => {
      const payload = {
        projectId: projectId ?? null,
        projectInverterId: selectedInverterId ?? null,
      };
      try {
        setSelectedInverterLatestLoading(true);
        const res = await apiPost(`/api/inverter-data/latest-record`, payload);
        setStatCardsData(res?.success ? res.data : null);
      } finally {
        setSelectedInverterLatestLoading(false);
      }
    };
    loadSelectedInverterLatest();
  }, [selectedInverterId, projectId]);

  // ------------------- Load Monthly Chart Data -------------------
  useEffect(() => {
    const loadMonthlyChartData = async () => {
      const payload = {
        projectId: projectId ?? null,
        projectInverterId:
          selectedInverterId && selectedInverterId.trim() !== ""
            ? selectedInverterId
            : null,
      };
      try {
        setMonthlyChartDataLoading(true);
        const res = await apiPost(`/api/inverter-data/monthly-chart`, payload);
        setMonthlyChartData(res?.success ? res.data : null);
      } finally {
        setMonthlyChartDataLoading(false);
      }
    };
    loadMonthlyChartData();
  }, [selectedInverterId, projectId]);

  // Load Energy Day Wise Data 
  useEffect(() => {
    const loadEnergyDayWiseData = async () => {
      const [year, month] = selectedMonthYear.split('-');
      const payload = {
        projectId: projectId ?? null,
        year: year ?? null,
        month: month ?? null
      };

      try {
        setMonthlyChartDataLoading(true);
        const res = await apiPost(`/api/projects/chart_month_data`, payload);
        setChartMonthData(res?.success ? res.data : null);
      } finally {
        setMonthlyChartDataLoading(false);
      }
    };
    if (projectId && selectedMonthYear) {
      loadEnergyDayWiseData();
    }
  }, [projectId, selectedMonthYear])

  // ------------------- Determine which data to show -------------------
  const displayData = selectedInverterId
    ? inverterChartData
    : inverterChartData;
  const displayDataLoading = selectedInverterId
    ? selectedInverterLatestLoading
    : inverterLatestLoading;

  // Dark mode colors
  const colors = {
    bg: isDark ? "#0f172a" : "#f9fafb",
    cardBg: isDark ? "#121a2d" : "#fff",
    text: isDark ? "#ffffff" : "#111827",
    textMuted: isDark ? "#b1b4c0" : "#6b7280",
    border: isDark ? "#1b2436" : "#e5e7eb",
    borderLight: isDark ? "#1b2436" : "#f3f4f6",
    gradientBg: isDark
      ? "linear-gradient(to bottom right, #1a1f2e, #0f172a, #1a1628)"
      : "linear-gradient(to bottom right, #eff6ff, #ffffff, #faf5ff)",
  };

  // ------------------- Loading / Not Found UI -------------------
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: colors.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: colors.textMuted }}>
          Loading project details...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: colors.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: colors.textMuted }}>Project not found</div>
      </div>
    );
  }

  // ------------------- MAIN UI -------------------
  return (
    <div
      style={{
        minHeight: "100vh",
        height: "auto",
        overflowY: "hidden",
        background: colors.gradientBg,
        padding: "24px",
      }}
    >
      <div style={{ margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ marginBottom: "24px" }}>
          {isTablet ? (
            // Tablet Layout: Two rows
            <div>
              {/* First Row: Name left, Active badge right */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <h1
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    color: colors.text,
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {project.project_name}
                  <FiEdit3
                    style={{
                      cursor: "pointer",
                      marginLeft: "8px",
                      color: "#3b82f6",
                      fontSize: "20px",
                    }}
                    onClick={() =>
                      (window.location.href = `/admin/projects/edit/${project.id}`)
                    }
                  />
                </h1>
                <p
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    backgroundColor:
                      project.status === 1
                        ? isDark
                          ? "rgba(34, 197, 94, 0.2)"
                          : "#dcfce7"
                        : isDark
                          ? "rgba(239, 68, 68, 0.2)"
                          : "#fee2e2",
                    color:
                      project.status === 1
                        ? isDark
                          ? "#22c55e"
                          : "#166534"
                        : isDark
                          ? "#ef4444"
                          : "#991b1b",
                    fontWeight: "600",
                    margin: 0,
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {project.status === 1
                    ? lang("projectView.projectInformation.active")
                    : lang("projectView.projectInformation.inactive")}
                </p>
              </div>
              {/* Second Row: Dropdown at the end */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                {projectInvertersLoading ? (
                  <div style={{ color: colors.textMuted, fontSize: "14px" }}>
                    Loading inverters...
                  </div>
                ) : (
                  <select
                    value={selectedInverterId}
                    onChange={(e) => setSelectedInverterId(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: `1px solid ${colors.border}`,
                      background: isDark ? "#121a2d" : "#fff",
                      color: colors.text,
                      fontSize: "14px",
                      minWidth: "220px",
                      width: "auto",
                    }}
                  >
                    <option
                      value=""
                      style={{
                        background: isDark ? "#121a2d" : "#fff",
                        color: colors.text,
                      }}
                    >
                      {lang("inverter.selectInverter", "Select Inverter")}
                    </option>
                    {projectInverters.map((pi) => {
                      const inv = pi.inverter || {};
                      const label = pi.inverter_name
                        ? `${pi.inverter_name} (Serial: ${pi.inverter_serial_number || "N/A"
                        })`
                        : `Inverter ID: ${pi.id}`;
                      return (
                        <option
                          key={pi.id}
                          value={pi.id}
                          style={{
                            background: isDark ? "#121a2d" : "#fff",
                            color: colors.text,
                          }}
                        >
                          {label}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            </div>
          ) : (
            // Desktop and Mobile Layout
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                justifyContent: "space-between",
                gap: isMobile ? "12px" : "0",
              }}
            >
              {/* Project Name and Status Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <h1
                  style={{
                    fontSize: isMobile ? "24px" : "30px",
                    fontWeight: "bold",
                    color: colors.text,
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {project.project_name}
                  <FiEdit3
                    style={{
                      cursor: "pointer",
                      marginLeft: "8px",
                      color: "#3b82f6",
                      fontSize: "20px",
                    }}
                    onClick={() =>
                      (window.location.href = `/admin/projects/edit/${project.id}`)
                    }
                  />
                </h1>
                <p
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    backgroundColor:
                      project.status === 1
                        ? isDark
                          ? "rgba(34, 197, 94, 0.2)"
                          : "#dcfce7"
                        : isDark
                          ? "rgba(239, 68, 68, 0.2)"
                          : "#fee2e2",
                    color:
                      project.status === 1
                        ? isDark
                          ? "#22c55e"
                          : "#166534"
                        : isDark
                          ? "#ef4444"
                          : "#991b1b",
                    fontWeight: "600",
                    margin: 0,
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {project.status === 1
                    ? lang("projectView.projectInformation.active")
                    : lang("projectView.projectInformation.inactive")}
                </p>
              </div>

              {/* Inverter Dropdown */}
              <div style={{ width: isMobile ? "100%" : "auto" }}>
                {projectInvertersLoading ? (
                  <div style={{ color: colors.textMuted, fontSize: "14px" }}>
                    Loading inverters...
                  </div>
                ) : (
                  <select
                    value={selectedInverterId}
                    onChange={(e) => setSelectedInverterId(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: `1px solid ${colors.border}`,
                      background: isDark ? "#121a2d" : "#fff",
                      color: colors.text,
                      fontSize: "14px",
                      minWidth: isMobile ? "100%" : "220px",
                      width: isMobile ? "100%" : "auto",
                    }}
                  >
                    <option
                      value=""
                      style={{
                        background: isDark ? "#121a2d" : "#fff",
                        color: colors.text,
                      }}
                    >
                      {lang("inverter.selectInverter", "Select Inverter")}
                    </option>
                    {projectInverters.map((pi) => {
                      const inv = pi.inverter || {};
                      const label = pi.inverter_name
                        ? `${pi.inverter_name} (Serial: ${pi.inverter_serial_number || "N/A"
                        })`
                        : `Inverter ID: ${pi.id}`;
                      return (
                        <option
                          key={pi.id}
                          value={pi.id}
                          style={{
                            background: isDark ? "#121a2d" : "#fff",
                            color: colors.text,
                          }}
                        >
                          {label}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STAT CARDS */}
      <StatCardsGrid
        project={project}
        contracts={contracts}
        contractsLoading={contractsLoading}
        inverterLatest={displayData}
        inverterLatestLoading={displayDataLoading}
        selectedInverterId={selectedInverterId}
        statCardsData={statCardsData}
        isDark={isDark}
      />

      <SolarFlowCard
        projectId={projectId}
        project={project}
        selectedInverterId={selectedInverterId}
        inverters={projectInverters}
        isDark={isDark}
      />

      {/* CHART SECTION */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
        }}
      >
        {/* PRODUCTION CHART */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: "12px",
            boxShadow: isDark
              ? "0 0 20px rgba(14, 32, 56, 0.3)"
              : "0 1px 3px rgba(0,0,0,0.1)",
            border: `1px solid ${colors.borderLight}`,
            padding: "24px",
            marginBottom: "24px",
            overflowX: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: colors.text,
              }}
            >
              {lang(
                "projectView.energyProduction.energy_production",
                "Energy Production Overviews"
              )}
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#ef4444",
                }}
              ></div>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#fbbf24",
                }}
              ></div>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                }}
              ></div>
            </div>
          </div>
          {selectedInverterId ? (
            <PowerConsumptionDashboard
              projectId={projectId}
              readings={inverterChartData || []}
              loading={inverterLatestLoading}
              selectedInverterId={selectedInverterId}
              projectInverters={projectInverters}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              setSelectedDate={setSelectedDate}
              isDark={isDark}
            />
          ) : (
            <ProjectOverviewChart
              projectId={projectId}
              readings={projectChartData || []}
              loading={projectLatestLoading}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              setSelectedDate={setSelectedDate}
              isDark={isDark}
            />
          )}
        </div>
      </div>


      {/* PROJECT DETAILS */}
      <ProjectInformation project={project} isDark={isDark} />

      {/* METER INFO */}
      <MeterInfo
        project={project}
        contracts={contracts}
        contractsLoading={contractsLoading}
        inverters={projectInverters}
        isDark={isDark}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
        }}
      >

        {/* PRODUCTION CHART */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: "12px",
            boxShadow: isDark
              ? "0 0 20px rgba(14, 32, 56, 0.3)"
              : "0 1px 3px rgba(0,0,0,0.1)",
            border: `1px solid ${colors.borderLight}`,
            padding: "24px",
            marginBottom: "24px",
            overflowX: "auto",
          }}
        >
          <EnergyChart 
            chartMonthData={chartMonthData} 
            selectedMonthYear={selectedMonthYear}
            onMonthYearChange={setSelectedMonthYear}
            monthlyChartDataLoading={monthlyChartDataLoading}
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectViewContent;
