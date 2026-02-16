"use client";
import React, { useEffect, useState, useMemo } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDarkMode, getDarkModeColors, sortByNameAsc } from "@/utils/common";
import StatCardsGrid from "./projectViewSection/StateCard";
import PowerConsumptionDashboard from "./projectViewSection/inverterChart";
import ProjectInformation from "./projectViewSection/ProjectInformation";
import ProjectOverviewChart from "./projectViewSection/ProjectOverviewChart";
import MeterInfo from "./projectViewSection/MeterInfo";
import EnergyChart from "./projectViewSection/MonthChart";
import { FiEdit3 } from "react-icons/fi";
import SolarFlowCard from "./projectViewSection/Animated";
import { use } from "react";
import EnergyYearChart from "./projectViewSection/YearChart";
import ElectricityCostBarChart from "./projectViewSection/ElectricityCostBarChart";
import ElectricityCostOverviewChart from "./projectViewSection/ElectricityCostOverviewChart";
import ElectricityConsumption from "./projectViewSection/ElectricityConsumption";
import usePermissions from "@/hooks/usePermissions";
import { PROJECT_STATUS } from "@/constants/project_status";


// -------- NUMBER FORMATTER ----------
const formatNumber = (v, suffix = "") => {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "number") return v.toLocaleString() + suffix;
  return String(v) + suffix;
};

const ProjectViewContent = ({ projectId = "" }) => {
  const { lang } = useLanguage();

  const isDark = useDarkMode();
  const colors = getDarkModeColors(isDark);

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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); // New: track selected date
  const [chartMonthData, setChartMonthData] = useState(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyChartDataLoading, setMonthlyChartDataLoading] = useState(true);
  const [ChartViewMode, setChartViewMode] = useState("day"); // day | month | year
  const [ChartYearData, setChartYearData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedEnergyYear, setSelectedEnergyYear] = useState(new Date().getFullYear().toString());
  const [yearChartDataLoading, setYearChartDataLoading] = useState(true);
  const [electricityMonthCostData, setElectricityMonthCostData] = useState(null);
  const [electricityMonthCostDataLoading, setElectricityMonthCostDataLoading] = useState(true);
  const [electricitySelectedYear, setElectricitySelectedYear] = useState(new Date().getFullYear().toString());
  const [electricityOverviewData, setElectricityOverviewData] = useState(null);
  const [electricityOverviewDataLoading, setElectricityOverviewDataLoading] = useState(true);
  const [electricityOverviewViewMode, setElectricityOverviewViewMode] = useState("day"); // day | month | year
  const [electricityOverviewDate, setElectricityOverviewDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM for day, YYYY for month
  const [electricityConsumptionData, setElectricityConsumptionData] = useState(null);
  const [electricityConsumptionDataLoading, setElectricityConsumptionDataLoading] = useState(true);
  const [electricityConsumptionViewMode, setElectricityConsumptionViewMode] = useState("day"); // day | month | year
  const [electricityConsumptionDate, setElectricityConsumptionDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM for day, YYYY for month
  const { canEdit, canDelete } = usePermissions();
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


  // STATIC TEST DATA (simulate API response)
  useEffect(() => {
    const loadEnergyYearWiseData = async () => {
      // const year = "2026";
      const payload = {
        projectId: projectId ?? null,
        year: selectedEnergyYear ?? null
      };

      try {
        setYearChartDataLoading(true);
        const res = await apiPost(`/api/projects/chart_year_data`, payload);
        setChartYearData(res?.success ? res.data : null);
      } finally {
        setYearChartDataLoading(false);
      }
    };
    loadEnergyYearWiseData();
  }, [projectId, selectedEnergyYear]);


  // Electricity Month Cost Data
  useEffect(() => {
    const loadElectricityMonthCostData = async () => {
      const payload = {
        projectId: projectId ?? null,
        year: electricitySelectedYear ?? null
      };

      try {
        setElectricityMonthCostDataLoading(true);
        const res = await apiPost(`/api/projects/electricity/monthly-cost-chart`, payload);
        setElectricityMonthCostData(res?.success ? res.data : null);
      } finally {
        setElectricityMonthCostDataLoading(false);
      }
    };
    loadElectricityMonthCostData();
  }, [projectId, electricitySelectedYear]);


  // electricity overview chart data
  useEffect(() => {
    const loadElectricityOverviewData = async () => {
      if (!projectId) return;

      let dateValue;
      if (electricityOverviewViewMode === "day") {
        dateValue = electricityOverviewDate; // YYYY-MM format
      } else if (electricityOverviewViewMode === "month") {
        dateValue = electricityOverviewDate.slice(0, 4); // YYYY format
      } else {
        dateValue = new Date().getFullYear().toString(); // YYYY format (not used by API but required)
      }

      const payload = {
        projectId: projectId ?? null,
        type: electricityOverviewViewMode,
        date: dateValue,
      };

      try {
        setElectricityOverviewDataLoading(true);
        const res = await apiPost(`/api/projects/electricity/overview-chart`, payload);
        setElectricityOverviewData(res?.success ? res.data : null);
      } catch (error) {
        console.error("Error loading electricity overview data:", error);
        setElectricityOverviewData(null);
      } finally {
        setElectricityOverviewDataLoading(false);
      }
    };
    loadElectricityOverviewData();
  }, [projectId, electricityOverviewViewMode, electricityOverviewDate]);

  useEffect(() => {
    const loadElectricityConsumptionData = async () => {
      if (!projectId) return;

      let dateValue;
      if (electricityConsumptionViewMode === "day") {
        dateValue = electricityConsumptionDate; // YYYY-MM format
      } else if (electricityConsumptionViewMode === "month") {
        dateValue = electricityConsumptionDate.slice(0, 4); // YYYY format
      } else {
        dateValue = new Date().getFullYear().toString(); // YYYY format (not used by API but required)
      }

      const payload = {
        projectId: projectId ?? null,
        type: electricityConsumptionViewMode,
        date: dateValue,
      };

      try {
        setElectricityConsumptionDataLoading(true);
        const res = await apiPost(`/api/projects/electricity/consumption-chart`, payload);
        setElectricityConsumptionData(res?.success ? res.data : null);
      } catch (error) {
        console.error("Error loading electricity consumption data:", error);
        setElectricityConsumptionData(null);
      } finally {
        setElectricityConsumptionDataLoading(false);
      }
    };
    loadElectricityConsumptionData();
  }, [projectId, electricityConsumptionViewMode, electricityConsumptionDate]);


  // ------------------- Determine which data to show -------------------
  const displayData = selectedInverterId
    ? inverterChartData
    : inverterChartData;
  const displayDataLoading = selectedInverterId
    ? selectedInverterLatestLoading
    : inverterLatestLoading;

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
                  {canEdit("projects") && (
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
                  )}
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
                    {projectInverters.map((pi, index) => {
                      const inv = pi.inverter || {};
                      const label = pi.inverter_name
                        ? `${pi.inverter_name} (Serial: ${pi.inverter_serial_number || "N/A"
                        })`
                        : `Inverter ID: ${pi.id}`;
                      return (
                        <option
                          key={`inverter-tablet-${pi.id}-${index}`}
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
                  {canEdit("projects") && (
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
                  )}
                </h1>
                <p
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    backgroundColor:
                      project.project_status_id === PROJECT_STATUS.UPCOMING
                        ? isDark
                          ? "rgba(199, 17, 17, 0.92)"
                          : "rgba(199, 17, 17, 0.92)"
                        : project.project_status_id === PROJECT_STATUS.IN_PROGRESS
                          ? isDark
                            ? "rgba(255, 255, 255)"
                            : "rgba(255, 255, 255)"
                          : project.project_status_id === PROJECT_STATUS.RUNNING
                            ? isDark
                              ? "rgba(255, 255, 255)"
                              : "rgba(255, 255, 255)"
                            : "#fee2e2",
                    color:
                      project.project_status_id === PROJECT_STATUS.UPCOMING
                        ? isDark
                          ? "rgb(246, 240, 240)"
                          : "rgb(246, 240, 240)"
                        : project.project_status_id === PROJECT_STATUS.IN_PROGRESS
                          ? isDark
                            ? "#ffa21d"
                            : "#ffa21d"
                          : project.project_status_id === PROJECT_STATUS.RUNNING
                            ? isDark
                              ? "#10b981"
                              : "#10b981"
                            : "#991b1b",
                    fontWeight: "600",
                    margin: 0,
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {project.project_status_id === PROJECT_STATUS.UPCOMING
                    ? lang("project_status.upcoming", "Upcoming")
                    : project.project_status_id === PROJECT_STATUS.IN_PROGRESS
                      ? lang("project_status.in_progress", "In Progress")
                      : lang("project_status.running", "Running")}
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
                    {sortByNameAsc(projectInverters, "inverter_name").map((pi, index) => {
                      const inv = pi.inverter || {};
                      const label = pi.inverter_name
                        ? `${pi.inverter_name} (Serial: ${pi.inverter_serial_number || "N/A"
                        })`
                        : `Inverter ID: ${pi.id}`;
                      return (
                        <option
                          key={`inverter-desktop-${pi.id}-${index}`}
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

      <ElectricityConsumption
        data={electricityConsumptionData}
        loading={electricityConsumptionDataLoading}
        selectedMonthYear={electricityConsumptionDate}
        onMonthYearChange={setElectricityConsumptionDate}
        isDark={isDark}
      />

      {/* ElectricityCostOverviewChart & Bar Chart*/}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isTablet || isMobile ? "1fr" : "1.5fr 1fr",
          gap: isMobile ? "16px" : "24px",
          marginBottom: isMobile ? "16px" : "24px",
          height: isTablet || isMobile ? "auto" : "",
        }}
      >
        {/* overview CHART SECTION */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: "12px",
            boxShadow: isDark
              ? "0 0 20px rgba(14, 32, 56, 0.3)"
              : "0 1px 3px rgba(0,0,0,0.1)",
            border: `1px solid ${colors.borderLight}`,
            padding: isMobile ? "16px" : "24px",
            overflowX: isMobile ? "auto" : "visible",
          }}>
          <h3
            style={{
              fontSize: isMobile ? "16px" : "18px",
              fontWeight: "bold",
              color: colors.text,
              marginBottom: isMobile ? "12px" : "16px",
            }}
          >
            {lang(
              "projectView.energyProduction.monthly_energy_production",
              "Daily Electricity Cost (VND)"
            )}
          </h3>
          <ElectricityCostOverviewChart
            data={electricityOverviewData}
            loading={electricityOverviewDataLoading}
            viewMode={electricityOverviewViewMode}
            onViewModeChange={setElectricityOverviewViewMode}
            selectedDate={electricityOverviewDate}
            onDateChange={setElectricityOverviewDate}
            isDark={isDark}
            selectedInverterId={selectedInverterId}
          />
        </div>
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: "12px",
            boxShadow: isDark
              ? "0 0 20px rgba(14, 32, 56, 0.3)"
              : "0 1px 3px rgba(0,0,0,0.1)",
            border: `1px solid ${colors.borderLight}`,
            padding: isMobile ? "16px" : "24px",
            overflowX: "auto",
          }}>
          <h3
            style={{
              fontSize: isMobile ? "16px" : "18px",
              fontWeight: "bold",
              color: colors.text,
              marginBottom: isMobile ? "12px" : "16px",
            }}
          >
            {lang(
              "projectView.energyProduction.yearly_energy_production",
              "Monthly Electricity Cost (VND)"
            )}
          </h3>
          <ElectricityCostBarChart
            electricityMonthCostDataLoading={electricityMonthCostDataLoading}
            electricityMonthCostData={electricityMonthCostData}
            selectedYear={electricitySelectedYear}
            onYearChange={setElectricitySelectedYear}
            isDark={isDark}
          />
        </div>
      </div>

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
                "Daily Power Profile (Load, PV & Grid)"
              )}
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              {["day", "month", "year"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setChartViewMode(mode)}
                  style={{
                    padding: "6px 14px",
                    fontSize: "14px",
                    borderRadius: "6px",
                    border:
                      ChartViewMode === mode
                        ? "1px solid #f97316"
                        : "1px solid #d1d5db",
                    backgroundColor:
                      ChartViewMode === mode ? "#f97316" : "#ffffff",
                    color: ChartViewMode === mode ? "#ffffff" : "#374151",
                    cursor: "pointer",
                    fontWeight: ChartViewMode === mode ? 600 : 400,
                    transition: "all 0.2s ease",
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {ChartViewMode === "month" && (
            <EnergyChart
              chartMonthData={chartMonthData}
              selectedMonthYear={selectedMonthYear}
              onMonthYearChange={setSelectedMonthYear}
              monthlyChartDataLoading={monthlyChartDataLoading}
              isMobile={isMobile}
              isDark={isDark}
            />
          )}

          {ChartViewMode === "year" && (
            <EnergyYearChart
              ChartYearData={ChartYearData}
              selectedEnergyYear={selectedEnergyYear}
              onYearChange={setSelectedEnergyYear}
              isDark={isDark}
            />
          )}

          {ChartViewMode === "day" && (
            selectedInverterId ? (
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
            )
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

      {/* Day-wise EVN + WeShare consumption chart for the selected month */}
    </div>
  );
};

export default ProjectViewContent;
