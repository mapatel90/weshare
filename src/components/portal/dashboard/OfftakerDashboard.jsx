"use client";
import React, { useEffect, useState, useMemo } from "react";
import "../../../assets/portal/offtaker.css";
import ProjectsTable from "./sections/ProjectsTable";
import OverViewCards from "./sections/OverViewCards";
import BillingCard from "./sections/BillingCard";
import DocumentsCard from "./sections/DocumentsCard";
import KriLineChart from "./sections/KriLineChart";
import { useAuth } from "@/contexts/AuthContext";
import { apiGet, apiPost } from "@/lib/api";

function DashboardView() {
  const { user } = useAuth();
  const [showProjectsDropdown, setShowProjectsDropdown] = useState(false);
  const [showInverterDropdown, setShowInverterDropdown] = useState(false);

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

  // fetch offtaker projects similar to ProjectTable
  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      setProjectsError(null);
      try {
        let apiUrl = "/api/projects?page=1&limit=50";
        if (user?.id) apiUrl += `&offtaker_id=${user.id}`;
        const res = await apiGet(apiUrl);
        console.log("Fetched projects for dropdown:", res);
        
        // Handle different response structures: res.projectList, res.data (array), or res.data.projects
        let projectsArray = null;
        if (res?.projectList && Array.isArray(res.projectList)) {
          projectsArray = res.projectList;
        } else if (Array.isArray(res?.data)) {
          projectsArray = res.data;
        } else if (Array.isArray(res?.data?.projects)) {
          projectsArray = res.data.projects;
        }
        
        if (res?.success && projectsArray && projectsArray.length > 0) {
          // minimal normalization for dropdown
          const normalized = projectsArray.map((p) => {
            // try common keys for project size/capacity
            const rawSize =
              p.project_size ??
              p.project_capacity ??
              p.size_kw ??
              p.project_kw ??
              p.capacity ??
              p.project_size_kw ??
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
            };
          });
          setProjects(normalized);
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
            const inv = item.inverter || {};
            return {
              id: item.id ?? inv.id,
              inverterId: inv.id ?? item.inverter_id,
              name: inv.inverterName ?? `Inverter #${inv.id ?? item.id}`,
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

        if (!selectedProject?.id && !selectedInverter?.inverterId) {
          payload.userId = user?.id
        }

        const res = await apiPost('/api/inverter-data/offtaker/summary/data', payload);
        console.log("res:", res);
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
            className="btn theme-btn-blue-color"
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
                {/* ALL PROJECTS option */}
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
                    console.log("projects",projects);
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
                    No projects available.
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
            className="btn theme-btn-blue-color"
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

      {/* show selected project (optional) */}
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

      {/* Dashboard */}
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

      {/* Projects Table */}
      <ProjectsTable />
      {/* LINE GRAPH CHART IMPLEMENTATION */}

      {/* KRI Line Graph (1,1 min intervals) */}
      <div className="chart-card" style={{ margin: "30px 0" }}>
        <div className="card-title" style={{ marginBottom: "20px" }}>
          Kw Generated (every minute)
        </div>
        <KriLineChart />
      </div>

      {/* Bottom Row */}
      <div className="bottom-row">
        {/* Billing Card */}
        <BillingCard />
        {/* Documents Card */}
        <DocumentsCard />
      </div>
    </div>
  );
}

export default DashboardView;
