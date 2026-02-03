"use client";
import React, { useEffect, useMemo, useState } from "react";
import "../../../assets/portal/offtaker.css";
import ProjectsTable from "./sections/ProjectsTable";
import OverViewCards from "./sections/OverViewCards";
import PayoutCard from "./sections/PayoutCard";
import ProjectOverviewChart from "../../admin/projectsCreate/projectViewSection/ProjectOverviewChart";
import PowerConsumptionDashboard from "../../admin/projectsCreate/projectViewSection/inverterChart";
import AllProjects from "./sections/AllProjectsInvestor";
import AllReports from "./sections/AllReportsInvestor";
import AllContracts from "./sections/AllContractsInvestor";
import SolarEnergyFlow from "@/components/admin/projectsCreate/projectViewSection/Animated";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import EnergyYearChart from "@/components/admin/projectsCreate/projectViewSection/YearChart";
import EnergyChart from "@/components/admin/projectsCreate/projectViewSection/MonthChart";
import { sortByNameAsc, useDarkMode } from "@/utils/common";
import { useLanguage } from "@/contexts/LanguageContext";

function DashboardView() {
  const { user } = useAuth();
  const isDark = useDarkMode();
  const { lang } = useLanguage();

  const [showProjectsDropdown, setShowProjectsDropdown] = useState(false);
  const [showInverterDropdown, setShowInverterDropdown] = useState(false);

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const [inverters, setInverters] = useState([]);
  const [invertersLoading, setInvertersLoading] = useState(false);
  const [invertersError, setInvertersError] = useState(null);
  const [selectedInverter, setSelectedInverter] = useState(null);

  const [inverterLatest, setInverterLatest] = useState(null);
  const [inverterLatestLoading, setInverterLatestLoading] = useState(false);
  const [inverterLatestError, setInverterLatestError] = useState(null);

  // Chart data states
  const [projectChartData, setProjectChartData] = useState(null);
  const [projectChartLoading, setProjectChartLoading] = useState(false);
  const [inverterChartData, setInverterChartData] = useState(null);
  const [inverterChartLoading, setInverterChartLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [ChartViewMode, setChartViewMode] = useState("day");
  const [chartMonthData, setChartMonthData] = useState(null);
  const [yearChartDataLoading, setYearChartDataLoading] = useState(true);
  const [selectedEnergyYear, setSelectedEnergyYear] = useState(new Date().getFullYear().toString());
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyChartDataLoading, setMonthlyChartDataLoading] = useState(true);
  const [ChartYearData, setChartYearData] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  const normalizeInvestorProject = (entry) => {
    const source = entry.projects || entry;
    const rawSize =
      source.project_size ??
      source.project_capacity ??
      null;
    const project_size =
      rawSize === null || rawSize === undefined || rawSize === ""
        ? null
        : Number(rawSize);

    return {
      id: source.id ?? source.project_id ?? entry.id ?? null,
      name: source.project_name ?? source.project_code ?? "Untitled Project",
      slug: source.project_slug ?? entry.project_slug ?? "",
      project_size: Number.isNaN(project_size) ? null : project_size,
      day_energy: source.day_energy ?? null,
      day_in_come: source.day_in_come ?? null,
      power: source.power ?? null,
      p_sum: source.p_sum ?? null,
      grid_purchased_day_energy: source.grid_purchased_day_energy ?? null,
      family_load_power: source.family_load_power ?? null,
      home_load_today_energy: source.home_load_today_energy ?? null,
      project_data: source.project_data ?? null,
    };
  };

  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      setProjectsError(null);
      try {
        let apiUrl = "/api/investors?page=1&limit=50";
        if (user?.id) {
          apiUrl += `&userId=${user.id}`;
        }
        const res = await apiGet(apiUrl);
        if (res?.success && Array.isArray(res?.data)) {
          const normalized = res.data.map(normalizeInvestorProject);
          setProjects(normalized);
        } else {
          setProjects([]);
        }
      } catch (err) {
        console.error("Failed to load investor projects", err);
        setProjectsError("Unable to load projects");
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    if (user) {
      fetchProjects();
    }
  }, [user?.id]);

  // Auto-select first project when projects load
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
      setSelectedInverter(null);
    }
  }, [projects, selectedProject]);

  const totalProjectSize = useMemo(() => {
    if (!projects.length) return null;
    let hasSize = false;
    const sum = projects.reduce((acc, p) => {
      if (typeof p.project_size === "number" && !Number.isNaN(p.project_size)) {
        hasSize = true;
        return acc + p.project_size;
      }
      return acc;
    }, 0);
    return hasSize ? sum : null;
  }, [projects]);

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
        const res = await apiGet(
          `/api/project-inverters?project_id=${selectedProject.id}`
        );
        if (res?.success && Array.isArray(res?.data)) {
          const normalized = res.data.map((item) => {
            const inv = item.inverters || {};
            return {
              id: item.id ?? inv.id,
              inverterId: item.id,
              name: item.inverter_name ?? `Inverter #${inv.id ?? item.id}`,
              serial: item.inverter_serial_number ?? inv.serial_number ?? "",
              kilowatt: item.kilowatt ?? "",
              status: item.status ?? null,
              raw: item,
            };
          });
          setInverters(normalized);
        } else {
          setInverters([]);
        }
      } catch (err) {
        console.error("Failed to load inverters for investor project", err);
        setInvertersError("Unable to load inverters");
        setInverters([]);
      } finally {
        setInvertersLoading(false);
      }
    };

    fetchInverters();
  }, [selectedProject?.id]);

  useEffect(() => {
    const fetchLatest = async () => {
      if (!user?.id) {
        setInverterLatest(null);
        return;
      }
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
          "/api/inverter-data/investor/latest-record",
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

    fetchLatest();
  }, [selectedProject?.id, selectedInverter?.inverterId, user?.id]);

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
      if (
        showProjectsDropdown &&
        projectsBtn &&
        !projectsBtn.contains(e.target) &&
        (!projectsDropdown || !projectsDropdown.contains(e.target))
      ) {
        setShowProjectsDropdown(false);
      }
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

  return (
    <div>
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
                {selectedProject ? selectedProject.name : "All Projects ▼"}
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
                    <li
                      key="all-projects"
                      role="button"
                      tabIndex={0}
                      style={{
                        padding: "8px 16px",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: selectedProject ? undefined : "#eef2ff",
                        fontWeight: selectedProject ? 400 : 600,
                        color: "#111827",
                      }}
                      onClick={() => {
                        setSelectedProject(null);
                        setShowProjectsDropdown(false);
                        setSelectedInverter(null);
                      }}
                    >
                      <span>All Projects</span>
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
                              setSelectedInverter(null);
                            }}
                          >
                            <span>{proj.name}</span>
                          </li>
                        );
                      })
                    ) : (
                      <li style={{ padding: "8px 16px", color: "#6b7280" }}>
                        No projects available.
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

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
                {selectedInverter ? selectedInverter.name : `${lang("dashboard.all_inverters", "All Inverters")} ▼`}
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
                      sortByNameAsc(inverters, "name").map((inv) => {
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
                      })
                    ) : (
                      <li style={{ padding: "8px 16px", color: "#6b7280" }}>
                        No inverters for this project.
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {selectedProject && (
            <div style={{ marginBottom: "12px", color: "#374151" }}>
              {lang("dashboard.selected_project", "Selected project")}: <strong>{selectedProject.name}</strong>
              {selectedInverter && (
                <span style={{ marginLeft: 12 }}>
                  {" "}
                  • {lang("dashboard.inverter", "Inverter")}: <strong>{selectedInverter.name}</strong>
                </span>
              )}
            </div>
          )}

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
          />
        </>
      )}

      {/* CHART SECTION */}
      {selectedProject && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
            gap: "24px",
            marginBottom: "24px",
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
                {lang("projectView.energyProduction.energy_production", "Energy Production Overview")}
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
            {selectedInverter ? (
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
            )}
          </div>
        </div>
      )}

      <div className="row">
        <AllProjects />
        <AllContracts />
      </div>

      <ProjectsTable />

      <PayoutCard />
      <div className="bottom-row">
        {/* <DocumentsCard /> */}
      </div>
    </div>
  );
}

export default DashboardView;
