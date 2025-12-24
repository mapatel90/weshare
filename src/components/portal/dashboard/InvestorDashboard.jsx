"use client";
import React, { useEffect, useMemo, useState } from "react";
import "../../../assets/portal/offtaker.css";
import ProjectsTable from "./sections/ProjectsTable";
import OverViewCards from "./sections/OverViewCards";
import PayoutCard from "./sections/PayoutCard";
import ProjectOverviewChart from "../../admin/projectsCreate/projectViewSection/ProjectOverviewChart";
import PowerConsumptionDashboard from "../../admin/projectsCreate/projectViewSection/inverterChart";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

function DashboardView() {
  const { user } = useAuth();

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
            {selectedInverter ? selectedInverter.name : "Inverter ▼"}
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
                  inverters.map((inv) => {
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
          Selected project: <strong>{selectedProject.name}</strong>
          {selectedInverter && (
            <span style={{ marginLeft: 12 }}>
              {" "}
              • Inverter: <strong>{selectedInverter.name}</strong>
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
      />

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
                Energy Production Overview
              </h3>
            </div>
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

      <div className="dashboard-row">
        <div className="chart-card">
          <div className="card-header">
            <div className="card-title">Monthly Savings Tracker</div>
            <div className="tabs">
              <button className="tab">Daily</button>
              <button className="tab">Monthly</button>
              <button className="tab active">Comparison</button>
            </div>
          </div>
          <p
            style={{ color: "#6b7280", fontSize: "13px", marginBottom: "20px" }}
          >
            Compare your WeChain bills vs EVN baseline rates
          </p>

          <div className="legend">
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ background: "#fbbf24" }}
              ></div>
              <span>WeChain Bill</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ background: "#1f2937" }}
              ></div>
              <span>EVN Equivalent</span>
            </div>
          </div>

          <div className="chart-container">
            <div className="bar-chart">
              <div className="bar-group">
                <div className="bars">
                  <div className="bar orange" style={{ height: "160px" }}></div>
                  <div className="bar dark" style={{ height: "50px" }}></div>
                </div>
                <div className="month-label">JAN</div>
              </div>
              <div className="bar-group">
                <div className="bars">
                  <div className="bar orange" style={{ height: "110px" }}></div>
                  <div className="bar dark" style={{ height: "120px" }}></div>
                </div>
                <div className="month-label">FEB</div>
              </div>
              <div className="bar-group">
                <div className="bars">
                  <div className="bar orange" style={{ height: "80px" }}></div>
                  <div className="bar dark" style={{ height: "140px" }}></div>
                </div>
                <div className="month-label">MAR</div>
              </div>
              <div className="bar-group">
                <div className="bars">
                  <div className="bar orange" style={{ height: "130px" }}></div>
                  <div className="bar dark" style={{ height: "115px" }}></div>
                </div>
                <div className="month-label">APR</div>
              </div>
              <div className="bar-group">
                <div className="bars">
                  <div className="bar orange" style={{ height: "200px" }}></div>
                  <div className="bar dark" style={{ height: "50px" }}></div>
                </div>
                <div className="month-label">JUN</div>
              </div>
              <div className="bar-group">
                <div className="bars">
                  <div className="bar orange" style={{ height: "70px" }}></div>
                  <div className="bar dark" style={{ height: "130px" }}></div>
                </div>
                <div className="month-label">JUL</div>
              </div>
              <div className="bar-group">
                <div className="bars">
                  <div className="bar orange" style={{ height: "170px" }}></div>
                  <div className="bar dark" style={{ height: "100px" }}></div>
                </div>
                <div className="month-label">AUG</div>
              </div>
              <div className="bar-group">
                <div className="bars">
                  <div className="bar orange" style={{ height: "130px" }}></div>
                  <div className="bar dark" style={{ height: "110px" }}></div>
                </div>
                <div className="month-label">SEP</div>
              </div>
              <div className="bar-group">
                <div className="bars">
                  <div className="bar orange" style={{ height: "40px" }}></div>
                  <div className="bar dark" style={{ height: "90px" }}></div>
                </div>
                <div className="month-label">OCT</div>
              </div>
              <div className="bar-group">
                <div className="bars">
                  <div className="bar orange" style={{ height: "60px" }}></div>
                  <div className="bar dark" style={{ height: "70px" }}></div>
                </div>
                <div className="month-label">NOV</div>
              </div>
              <div className="bar-group">
                <div className="bars">
                  <div className="bar orange" style={{ height: "110px" }}></div>
                  <div className="bar dark" style={{ height: "0px" }}></div>
                </div>
                <div className="month-label">DEC</div>
              </div>
            </div>
          </div>

          <div className="chart-stats">
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
          </div>
        </div>
        <div>
          <div className="chart-card" style={{ marginBottom: "20px" }}>
            <div className="circle-stats">
              <div className="circle-stat">
                <div className="circle orange">
                  <span>56%</span>
                </div>
                <div className="circle-label">Upcoming Projects</div>
              </div>
              <div className="circle-stat">
                <div className="circle green">
                  <span>77%</span>
                </div>
                <div className="circle-label">Under Installation Projects</div>
              </div>
            </div>
          </div>
          <div className="chart-card">
            <div className="card-title" style={{ marginBottom: "20px" }}>
              🌱 Environmental Impact
            </div>
            <div className="impact-grid">
              <div className="impact-card">
                <div style={{ fontSize: "35px" }}>🍃</div>
                <div className="impact-value">4.2 tons</div>
                <div className="impact-label">CO₂ Avoided This Year</div>
              </div>
              <div className="impact-card">
                <div style={{ fontSize: "35px" }}>💡</div>
                <div className="impact-value">12.8K kWh</div>
                <div className="impact-label">Clean Energy Consumed</div>
              </div>
              <div className="impact-card" style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: "35px" }}>🌳</div>
                <div className="impact-value">18 trees</div>
                <div className="impact-label">Equivalent planted</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProjectsTable />

      <div className="bottom-row">
        <PayoutCard />
        {/* <DocumentsCard /> */}
      </div>
    </div>
  );
}

export default DashboardView;
