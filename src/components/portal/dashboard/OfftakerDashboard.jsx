"use client";
import React, { useEffect, useState, useMemo } from "react";
import "../../../assets/portal/offtaker.css";
import ProjectsTable from "./sections/ProjectsTable";
import OverViewCards from "./sections/OverViewCards";
import BillingCard from "./sections/BillingCard";
import DocumentsCard from "./sections/DocumentsCard";
import ProjectOverviewChart from "@/components/admin/projectsCreate/projectViewSection/ProjectOverviewChart";
import PowerConsumptionDashboard from "@/components/admin/projectsCreate/projectViewSection/inverterChart";
import AllProjects from "./sections/AllProjects";
import AllReports from "./sections/AllReports";
import AllContracts from "./sections/AllContracts";
import StatsCardOverview from "./sections/StateDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost } from "@/lib/api";
import SolarEnergyFlow from "@/components/admin/projectsCreate/projectViewSection/Animated";
import { useLanguage } from "@/contexts/LanguageContext";
import EnergyChart from "@/components/admin/projectsCreate/projectViewSection/MonthChart";
import EnergyYearChart from "@/components/admin/projectsCreate/projectViewSection/YearChart";
import { getDarkModeColors, useDarkMode } from "@/utils/common";
import ElectricityCostOverviewChart from "@/components/admin/projectsCreate/projectViewSection/ElectricityCostOverviewChart";
import ElectricityCostBarChart from "@/components/admin/projectsCreate/projectViewSection/ElectricityCostBarChart";
import { sortByNameAsc } from "@/utils/common";


function DashboardView() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const isDark = useDarkMode();
  const colors = getDarkModeColors(isDark);
  const [showProjectsDropdown, setShowProjectsDropdown] = useState(false);
  const [showInverterDropdown, setShowInverterDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // new: projects state for dropdown (remove static entries)
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  // NEW: inverters state for selected project
  const [inverters, setInverters] = useState([]);
  const [invertersLoading, setInvertersLoading] = useState(false);
  const [invertersError, setInvertersError] = useState(null);
  const [selectedInverter, setSelectedInverter] = useState(null);

  // NEW: latest inverter data (for all projects / project / inverter)
  const [inverterLatest, setInverterLatest] = useState(null);
  const [inverterLatestLoading, setInverterLatestLoading] = useState(false);
  const [inverterLatestError, setInverterLatestError] = useState(null);
  const [chartMonthData, setChartMonthData] = useState(null);
  const [yearChartDataLoading, setYearChartDataLoading] = useState(true);
  const [selectedEnergyYear, setSelectedEnergyYear] = useState(new Date().getFullYear().toString());
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyChartDataLoading, setMonthlyChartDataLoading] = useState(true);

  // Chart data states
  const [projectChartData, setProjectChartData] = useState(null);
  const [ChartViewMode, setChartViewMode] = useState("day");
  const [projectChartLoading, setProjectChartLoading] = useState(false);
  const [inverterChartData, setInverterChartData] = useState(null);
  const [inverterChartLoading, setInverterChartLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [ChartYearData, setChartYearData] = useState([]);

  const [electricityMonthCostData, setElectricityMonthCostData] = useState(null);
  const [electricityMonthCostDataLoading, setElectricityMonthCostDataLoading] = useState(true);
  const [electricitySelectedYear, setElectricitySelectedYear] = useState(new Date().getFullYear().toString());
  const [electricityOverviewData, setElectricityOverviewData] = useState(null);
  const [electricityOverviewDataLoading, setElectricityOverviewDataLoading] = useState(true);
  const [electricityOverviewViewMode, setElectricityOverviewViewMode] = useState("day"); // day | month | year
  const [electricityOverviewDate, setElectricityOverviewDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM for day, YYYY for month
  const [savingsViewTab, setSavingsViewTab] = useState("daily"); // daily | monthly | comparison


  // fetch offtaker projects similar to ProjectTable
  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      setProjectsError(null);
      try {
        let apiUrl = "/api/projects?page=1&limit=50";
        if (user?.id) {
          apiUrl += `&offtaker_id=${user.id}`;
        }
        const res = await apiGet(apiUrl);

        if (res?.success && Array.isArray(res?.data)) {
          if (res.data.length > 0) {
            // minimal normalization for dropdown
            const normalized = res.data.map((p) => {
              // try common keys for project size/capacity
              const rawSize =
                p.project_size ??
                p.project_capacity ??
                p.size_kw ??
                p.project_kw ??
                p.capacity ??
                p.project_size_kw ??
                p.day_energy ??
                p.day_in_come ??
                p.power ??
                p.p_sum ??
                p.grid_purchased_day_energy ??
                p.family_load_power ??
                p.home_load_today_energy ??
                p.project_data ??
                p.project_inverters ??
                null;
              const project_size =
                rawSize === null || rawSize === undefined || rawSize === ""
                  ? null
                  : Number(rawSize);
              return {
                id: p.id ?? p.project_code ?? null,
                name: p.project_name ?? p.project_code ?? "Untitled Project",
                slug: p.project_slug ?? "",
                project_size,
                day_energy: p.day_energy ?? null,
                day_in_come: p.day_in_come ?? null,
                power: p.power ?? null,
                p_sum: p.p_sum ?? null,
                grid_purchased_day_energy: p.grid_purchased_day_energy ?? null,
                family_load_power: p.family_load_power ?? null,
                home_load_today_energy: p.home_load_today_energy ?? null,
                project_data: p.project_data ?? null,
                project_inverters: p.project_inverters ?? null,
              };
            });
            setProjects(normalized);
          } else {
            setProjects([]);
          }
        } else {
          setProjects([]);
        }
      } catch (err) {
        console.error("Failed to load projects for dropdown", err);
        setProjectsError("Unable to load projects");
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    // only fetch when user known and dropdown is used (optional: fetch once)
    if (user) {
      fetchProjects();
    }
  }, [user?.id]);

  // Auto-select first project when projects load
  useEffect(() => {
    if (projects.length === 0) return;

    // auto select only once OR when selected project is not in list
    if (
      !selectedProject ||
      !projects.some((p) => p.id === selectedProject.id)
    ) {
      setSelectedProject(projects[0]);
      setSelectedInverter(null);
    }
  }, [projects]); // ✅ only projects dependency

  // compute total project size (sum of all projects' project_size)
  const totalProjectSize = useMemo(() => {
    if (!projects || !projects.length) return null;
    let has = false;
    const sum = projects.reduce((acc, p) => {
      if (typeof p.project_size === "number" && !Number.isNaN(p.project_size)) {
        has = true;
        return acc + p.project_size;
      }
      return acc;
    }, 0);
    return has ? sum : null;
  }, [projects]);

  // NEW: fetch inverters when a project is selected
  useEffect(() => {
    const fetchInverters = async () => {
      if (!selectedProject?.id) {
        setInverters([]);
        setSelectedInverter(null);
        return;
      }
      setInvertersLoading(true);
      setInvertersError(null);
      try {
        // uses server route that expects project_id query param
        const res = await apiGet(
          `/api/project-inverters?project_id=${selectedProject.id}`
        );
        if (res?.success && Array.isArray(res?.data)) {
          // normalize items: project_inverters include inverter object (see server)
          const normalized = res.data.map((item) => {
            const inv = item.inverters || {};
            return {
              id: item.id ?? inv.id,
              inverterId: item.id ?? inv.project_inverter_id,
              name: item.inverter_name ?? "-",
              serial: item.inverter_serial_number ?? inv.serial_number ?? "",
              kilowatt: item.kilowatt ?? "",
              status: item.status ?? 0,
              raw: item,
            };
          });
          setInverters(normalized);
        } else {
          setInverters([]);
        }
      } catch (err) {
        console.error("Failed to load inverters for project", err);
        setInvertersError("Unable to load inverters");
        setInverters([]);
      } finally {
        setInvertersLoading(false);
      }
    };

    fetchInverters();
  }, [selectedProject?.id]);

  // NEW: fetch latest inverter data depending on selection
  useEffect(() => {
    const fetchSummaryCardData = async () => {
      setInverterLatestLoading(true);
      setInverterLatestError(null);
      try {
        const payload = {};
        if (selectedProject?.id) {
          payload.projectId = selectedProject.id;
        }
        if (selectedInverter?.inverterId) {
          payload.projectInverterId = selectedInverter.inverterId;
        }

        const res = await apiPost(
          "/api/inverter-data/offtaker/summary/data",
          payload
        );
        if (res?.success) {
          setInverterLatest(res.data ?? null);
        } else {
          setInverterLatest(null);
          setInverterLatestError("Unable to load inverter data");
        }
      } catch (err) {
        console.error("Failed to load latest inverter data", err);
        setInverterLatest(null);
        setInverterLatestError("Unable to load inverter data");
      } finally {
        setInverterLatestLoading(false);
      }
    };

    fetchSummaryCardData();
  }, [selectedProject?.id, selectedInverter?.inverterId]);

  // ------------------- Load Project Overview Chart Data -------------------
  useEffect(() => {
    const loadProjectChartData = async () => {
      if (!selectedProject?.id) {
        setProjectChartData(null);
        return;
      }
      try {
        setProjectChartLoading(true);
        const payload = {
          projectId: selectedProject.id,
          date: selectedDate || null,
        };
        const res = await apiPost("/api/projects/chart-data", payload);
        setProjectChartData(res?.success ? res.data : null);
      } catch (err) {
        console.error("Failed to load project chart data", err);
        setProjectChartData(null);
      } finally {
        setProjectChartLoading(false);
      }
    };
    loadProjectChartData();
  }, [selectedProject?.id, selectedDate]);

  // ------------------- Load Inverter Chart Data -------------------
  useEffect(() => {
    const loadInverterChartData = async () => {
      if (!selectedProject?.id) {
        setInverterChartData(null);
        return;
      }
      try {
        setInverterChartLoading(true);
        const payload = {
          projectId: selectedProject.id,
          projectInverterId: selectedInverter?.inverterId || null,
          date: selectedDate || null,
        };
        const res = await apiPost("/api/inverter-data/chart-data", payload);
        setInverterChartData(res?.success ? res.data : null);
      } catch (err) {
        console.error("Failed to load inverter chart data", err);
        setInverterChartData(null);
      } finally {
        setInverterChartLoading(false);
      }
    };
    loadInverterChartData();
  }, [selectedProject?.id, selectedInverter?.inverterId, selectedDate]);

  // Optional: Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      const projectsBtn = document.getElementById("projects-dropdown-btn");
      const inverterBtn = document.getElementById("inverter-dropdown-btn");
      const projectsDropdown = document.getElementById(
        "projects-dropdown-menu"
      );
      const inverterDropdown = document.getElementById(
        "inverter-dropdown-menu"
      );
      // Close Projects dropdown if click outside
      if (
        showProjectsDropdown &&
        projectsBtn &&
        !projectsBtn.contains(e.target) &&
        (!projectsDropdown || !projectsDropdown.contains(e.target))
      ) {
        setShowProjectsDropdown(false);
      }
      // Close Inverter dropdown if click outside
      if (
        showInverterDropdown &&
        inverterBtn &&
        !inverterBtn.contains(e.target) &&
        (!inverterDropdown || !inverterDropdown.contains(e.target))
      ) {
        setShowInverterDropdown(false);
      }
    }
    if (showProjectsDropdown || showInverterDropdown) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [showProjectsDropdown, showInverterDropdown]);


  useEffect(() => {
    const loadEnergyDayWiseData = async () => {
      const [year, month] = selectedMonthYear.split('-');
      const payload = {
        projectId: selectedProject?.id ?? null,
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
    if (selectedProject?.id && selectedMonthYear) {
      loadEnergyDayWiseData();
    }
  }, [selectedProject?.id, selectedMonthYear])


  useEffect(() => {
    const loadEnergyYearWiseData = async () => {
      // const year = "2026";

      const payload = {
        projectId: selectedProject?.id ?? null,
        year: selectedEnergyYear ?? null
      };
      try {
        // setYearChartDataLoading(true);
        const res = await apiPost(`/api/projects/chart_year_data`, payload);
        setChartYearData(res?.success ? res.data : null);
      } finally {
        // setYearChartDataLoading(false);
      }
    };
    if (selectedProject?.id) {
      loadEnergyYearWiseData();
    }
  }, [selectedProject?.id, selectedEnergyYear]);

  // Electricity Month Cost Data
  useEffect(() => {
    const loadElectricityMonthCostData = async () => {
      const payload = {
        projectId: selectedProject?.id ?? null,
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
    if (selectedProject?.id) {
      loadElectricityMonthCostData();
    }
  }, [selectedProject?.id, electricitySelectedYear]);


  // // electricity overview chart data
  useEffect(() => {
    const loadElectricityOverviewData = async () => {
      if (!selectedProject?.id) return;

      let dateValue;
      if (electricityOverviewViewMode === "day") {
        dateValue = electricityOverviewDate; // YYYY-MM format
      } else if (electricityOverviewViewMode === "month") {
        dateValue = electricityOverviewDate.slice(0, 4); // YYYY format
      } else {
        dateValue = new Date().getFullYear().toString(); // YYYY format (not used by API but required)
      }

      const payload = {
        projectId: selectedProject?.id ?? null,
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
    if (selectedProject?.id) {
      loadElectricityOverviewData();
    }
  }, [selectedProject?.id, electricityOverviewViewMode, electricityOverviewDate]);

  return (
    <div>
      {/* <StatsCardOverview /> */}
      {projects.length > 0 && (
        <>
          <div
            className="d-flex justify-content-end gap-2 mb-3"
            style={{ position: "relative" }}
          >
            <div
              style={{
                position: "relative",
                display: "inline-block",
                zIndex: showProjectsDropdown ? 30 : undefined,
              }}
            >
              <button
                type="button"
                className="btn bg-black text-white"
                id="projects-dropdown-btn"
                aria-expanded={showProjectsDropdown}
                onClick={() => {
                  setShowProjectsDropdown((prev) => !prev);
                  setShowInverterDropdown(false);
                }}
                style={{ minWidth: "110px" }}
              >
                {selectedProject ? selectedProject.name : "lang(dashboard.all_project, All Project)"} ▼
              </button>
              {showProjectsDropdown && (
                <div
                  id="projects-dropdown-menu"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    zIndex: 40,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    minWidth: "220px",
                  }}
                >
                  <ul
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: "8px 0",
                      maxHeight: "320px",
                      overflowY: "auto",
                    }}
                  >
                    <li style={{ padding: "4px 0" }}>
                      <hr
                        style={{
                          margin: 0,
                          border: "none",
                          borderTop: "1px solid #eef2ff",
                        }}
                      />
                    </li>
                    {projectsLoading ? (
                      <li style={{ padding: "8px 16px", color: "#6b7280" }}>
                        Loading...
                      </li>
                    ) : projectsError ? (
                      <li style={{ padding: "8px 16px", color: "#b45309" }}>
                        {projectsError}
                      </li>
                    ) : projects.length ? (
                      projects.map((proj) => {
                        const isSelected =
                          selectedProject &&
                          (selectedProject.id === proj.id ||
                            selectedProject.slug === proj.slug);
                        return (
                          <li
                            key={proj.id ?? proj.slug}
                            role="button"
                            tabIndex={0}
                            style={{
                              padding: "8px 16px",
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: isSelected ? "#eef2ff" : undefined,
                              fontWeight: isSelected ? 600 : 400,
                              color: "#111827",
                            }}
                            onClick={() => {
                              setSelectedProject(proj);
                              setShowProjectsDropdown(false);
                              // clear any previously selected inverter when project changes
                              setSelectedInverter(null);
                            }}
                          >
                            <span>{proj.name}</span>
                          </li>
                        );
                      })
                    ) : (
                      <li style={{ padding: "8px 16px", color: "#6b7280" }}>
                        {lang("dashboard.no_projects", "No projects available.")}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Inverter dropdown: disabled until a project is selected */}
            <div
              style={{
                position: "relative",
                display: "inline-block",
                zIndex: showInverterDropdown ? 30 : undefined,
              }}
            >
              <button
                type="button"
                className="btn bg-black text-white"
                id="inverter-dropdown-btn"
                aria-expanded={showInverterDropdown}
                onClick={() => {
                  // only allow opening inverter dropdown when a project is selected
                  if (!selectedProject) return;
                  setShowInverterDropdown((prev) => !prev);
                  setShowProjectsDropdown(false);
                }}
                style={{
                  minWidth: "110px",
                  opacity: selectedProject ? 1 : 0.6,
                  cursor: selectedProject ? "pointer" : "not-allowed",
                }}
                disabled={!selectedProject}
              >
                {selectedInverter ? selectedInverter.name : lang("dashboard.all_inverters", "All Inverters")} ▼
              </button>
              {showInverterDropdown && selectedProject && (
                <div
                  id="inverter-dropdown-menu"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    zIndex: 40,
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    minWidth: "220px",
                  }}
                >
                  <ul
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: "8px 0",
                      maxHeight: "320px",
                      overflowY: "auto",
                    }}
                  >
                    {invertersLoading ? (
                      <li style={{ padding: "8px 16px", color: "#6b7280" }}>
                        Loading...
                      </li>
                    ) : invertersError ? (
                      <li style={{ padding: "8px 16px", color: "#b45309" }}>
                        {invertersError}
                      </li>
                    ) : inverters.length ? (
                      <>
                        {/* All Inverters option */}
                        <li
                          role="button"
                          tabIndex={0}
                          style={{
                            padding: "8px 16px",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: !selectedInverter ? "#eef2ff" : undefined,
                            fontWeight: !selectedInverter ? 600 : 400,
                            color: "#111827",
                          }}
                          onClick={() => {
                            setSelectedInverter(null);
                            setShowInverterDropdown(false);
                          }}
                        >
                          <span>{lang("dashboard.all_inverters", "All Inverters")}</span>
                        </li>
                        <li style={{ padding: "4px 0" }}>
                          <hr
                            style={{
                              margin: 0,
                              border: "none",
                              borderTop: "1px solid #eef2ff",
                            }}
                          />
                        </li>
                        {sortByNameAsc(inverters, "name").map((inv) => {
                          const isSelectedInv =
                            selectedInverter &&
                            (selectedInverter.id === inv.id ||
                              selectedInverter.inverterId === inv.inverterId);

                          return (
                            <li
                              key={inv.id ?? inv.inverterId}
                              role="button"
                              tabIndex={0}
                              style={{
                                padding: "8px 16px",
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: isSelectedInv ? "#eef2ff" : undefined,
                                fontWeight: isSelectedInv ? 600 : 400,
                                color: "#111827",
                              }}
                              onClick={() => {
                                setSelectedInverter(inv);
                                setShowInverterDropdown(false);
                              }}
                            >
                              <span>{inv.name}</span>
                            </li>
                          );
                        })}

                      </>
                    ) : (
                      <li style={{ padding: "8px 16px", color: "#6b7280" }}>
                        {lang("dashboard.no_inverters", "No inverters for this project.")}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* show selected project (optional) */}
          {selectedProject && (
            <div style={{ marginBottom: "12px", color: "#374151" }}>
              {lang("dashboard.selected_project", "Selected project:")} <strong>{selectedProject.name}</strong>
              {selectedInverter && (
                <span style={{ marginLeft: 12 }}>
                  {" "}
                  {lang("dashboard.selected_inverter", "Inverter:")} <strong>{selectedInverter.name}</strong>
                </span>
              )}
            </div>
          )}
        </>
      )}

      {selectedProject && (
        <>
          <OverViewCards
            inverterLatest={inverterLatest}
            inverterLatestLoading={inverterLatestLoading}
            selectedProject={selectedProject}
            selectedInverter={selectedInverter}
            totalProjectSize={totalProjectSize}
            lang={lang}
          />

          <SolarEnergyFlow
            project={selectedProject}
            projectId={selectedProject?.id}
            inverters={inverters}
            selectedInverterId={selectedInverter?.inverterId}
          />

          {/* CHART SECTION */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
              gap: "24px",
              marginBottom: "24px",
              overflow: "auto"
            }}
          >
            {/* PRODUCTION CHART */}
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #f3f4f6",
                padding: "24px",
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
                    color: "#111827",
                  }}
                >
                  {lang(
                    "projectView.energyProduction.energy_production",
                    "Energy Production Overviews"
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
                selectedInverter ? (
                  <PowerConsumptionDashboard
                    projectId={selectedProject.id}
                    readings={inverterChartData || []}
                    loading={inverterChartLoading}
                    selectedInverterId={selectedInverter.inverterId}
                    projectInverters={inverters}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    setSelectedDate={setSelectedDate}
                  />
                ) : (
                  <ProjectOverviewChart
                    projectId={selectedProject.id}
                    readings={projectChartData || []}
                    loading={projectChartLoading}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    setSelectedDate={setSelectedDate}
                  />
                )
              )}
            </div>
          </div>
        </>
      )}

      {/* Dashboard */}
      <div className="dashboard-row">
        <div className="chart-card" style={{overflow: 'auto'}}>
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <div className="card-title">{lang("dashboard.savingsTracker", "Savings Tracker")}</div>
            <div className="tabs">
              <button
                className={`tab ${savingsViewTab === "daily" ? "active" : ""}`}
                onClick={() => {
                  setSavingsViewTab("daily");
                  setElectricityOverviewViewMode("day");
                }}
              >
                {lang("dashboard.daily", "Daily")}
              </button>
              <button
                className={`tab ${savingsViewTab === "monthly" ? "active" : ""}`}
                onClick={() => {
                  setSavingsViewTab("monthly");
                  // keep month-cost chart on currently selected year
                }}
              >
                {lang("dashboard.monthly", "Monthly")}
              </button>
              {/* <button
                className={`tab ${savingsViewTab === "comparison" ? "active" : ""}`}
                onClick={() => {
                  setSavingsViewTab("comparison");
                  setElectricityOverviewViewMode("year");
                  // ensure overview uses a sensible default year range
                  setElectricityOverviewDate(new Date().getFullYear().toString());
                }}
              >
                Comparison
              </button> */}
            </div>
          </div>
          <p
            style={{ color: "#6b7280", fontSize: "13px", marginBottom: '10px' }}
          >
            {lang("dashboard.savingsTrackerDescription", "Track your electricity cost savings over time compared to traditional grid consumption. View daily savings, monthly summaries, and year-over-year comparisons to see the impact of your solar investment.")}
          </p>

          <div className="chart-container">
            {savingsViewTab === "monthly" ? (
              <ElectricityCostBarChart
                electricityMonthCostData={electricityMonthCostData}
                electricityMonthCostDataLoading={electricityMonthCostDataLoading}
                selectedYear={electricitySelectedYear}
                onYearChange={setElectricitySelectedYear}
                isDark={isDark}
              />
            ) : (
              <ElectricityCostOverviewChart
                data={electricityOverviewData}
                loading={electricityOverviewDataLoading}
                viewMode={electricityOverviewViewMode}
                onViewModeChange={(mode) => {
                  setElectricityOverviewViewMode(mode);
                  // keep tab in sync when switching modes from inside chart
                  if (mode === "day") {
                    setSavingsViewTab("daily");
                  } else if (mode === "year") {
                    setSavingsViewTab("comparison");
                  }
                }}
                selectedDate={electricityOverviewDate}
                onDateChange={setElectricityOverviewDate}
                isDark={isDark}
                selectedInverterId={selectedInverter?.inverterId}
              />
            )}
          </div>

          {/* <div className="chart-stats">
            <div className="chart-stat">
              <div className="chart-stat-value" style={{ color: "#fbbf24" }}>
                đ937K
              </div>
              <div className="chart-stat-label">Total Savings (2024)</div>
            </div>
            <div className="chart-stat">
              <div className="chart-stat-value" style={{ color: "#f59e0b" }}>
                34.2%
              </div>
              <div className="chart-stat-label">Avg Discount vs EVN</div>
            </div>
            <div className="chart-stat">
              <div className="chart-stat-value">12</div>
              <div className="chart-stat-label">Months of Savings</div>
            </div>
          </div> */}
        </div>
        <div>
          <div className="chart-card">
            <div className="card-title" style={{ marginBottom: "20px" }}>
              🌱 {lang("dashboard.environmentalImpact", "Environmental Impact")}
            </div>
            <div className="impact-grid">
              <div className="impact-card">
                <div style={{ fontSize: "35px" }}>🍃</div>
                <div className="impact-value">
                  {selectedProject?.project_data?.[0]?.power_station_avoided_co2
                    ? `${selectedProject.project_data[0].power_station_avoided_co2} kg`
                    : '-'}
                </div>
                <div className="impact-label">{lang("dashboard.co2Avoided", "CO₂ Avoided This Year")}</div>
              </div>
              <div className="impact-card">
                <div style={{ fontSize: "35px" }}>💡</div>
                <div className="impact-value">{selectedProject?.project_data?.[0]?.power_station_avoided_tce
                  ? `${selectedProject.project_data[0].power_station_avoided_tce} kWh`
                  : '-'}</div>
                <div className="impact-label">{lang("dashboard.cleanEnergyConsumed", "Clean Energy Consumed")}</div>
              </div>
              <div className="impact-card" style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: "35px" }}>🌳</div>
                <div className="impact-value">{selectedProject?.project_data?.[0]?.power_station_num_tree
                  ? `${selectedProject.project_data[0].power_station_num_tree} ${lang("dashboard.trees", "Trees")}`
                  : '-'}</div>
                <div className="impact-label">{lang("dashboard.equivalentPlanted", "Equivalent planted")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <AllProjects />

        {/* <AllReports /> */}

        <AllContracts />
      </div>

      {/* Projects Table */}
      <ProjectsTable />

      {/* Bottom Row */}
      <div className="bottom-row">
        {/* Billing Card */}
        <BillingCard 
          lang={lang}
        />
        {/* Documents Card */}
        <DocumentsCard 
          lang={lang}
        />
      </div>
    </div>
  );
}

export default DashboardView;
