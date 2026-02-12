"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet, apiPost } from "@/lib/api";
import { showSuccessToast } from "@/utils/topTost";
import ProjectOverviewChart from "../../admin/projectsCreate/projectViewSection/ProjectOverviewChart";
import AOS from "aos";
import "aos/dist/aos.css";
import "./styles/exchange-hub-custom.css";
import { buildUploadUrl, getFullImageUrl } from "@/utils/common";
import { getPrimaryProjectImage } from "@/utils/projectUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import InvestDialog from "./InvestDialog";
import { PROJECT_STATUS } from "@/constants/project_status";
import ElectricityConsumption from "@/components/admin/projectsCreate/projectViewSection/ElectricityConsumption";
import EnergyChart from "@/components/admin/projectsCreate/projectViewSection/MonthChart";
import { FiZap } from "react-icons/fi";
import { CloudSun, Compass, Droplets, SunriseIcon, Thermometer, Wind } from 'lucide-react';
import { ROLES } from "@/constants/roles";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ProjectDetail = ({ projectId }) => {
  const { lang } = useLanguage();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const { user } = useAuth();
  const router = useRouter();
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investFullName, setInvestFullName] = useState("");
  const [investEmail, setInvestEmail] = useState("");
  const [investPhone, setInvestPhone] = useState("");
  const [investNotes, setInvestNotes] = useState("");
  const [submittingInvest, setSubmittingInvest] = useState(false);
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
  const [checkingInterest, setCheckingInterest] = useState(false);
  const [projectChartData, setProjectChartData] = useState(null);
  const [chartDataLoading, setChartDataLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Consumption Data Chart
  const [electricityConsumptionData, setElectricityConsumptionData] = useState(null);
  const [electricityConsumptionDataLoading, setElectricityConsumptionDataLoading] = useState(true);
  const [electricityConsumptionViewMode, setElectricityConsumptionViewMode] = useState("day"); // day | month | year
  const [electricityConsumptionDate, setElectricityConsumptionDate] = useState(new Date().toISOString().slice(0, 7));

  // Month Data Chart
  const [chartMonthData, setChartMonthData] = useState(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyChartDataLoading, setMonthlyChartDataLoading] = useState(true);

  const checkInterest = async () => {
    if (!user || !project) {
      setHasExpressedInterest(false);
      return;
    }
    try {
      setCheckingInterest(true);
      // API might return { success:true, data: [...] } or array directly
      const res = await apiGet(
        `/api/investors?projectId=${project.id}&userId=${user.id}`,
        { showLoader: false, includeAuth: false }
      );
      const list = Array.isArray(res) ? res : res?.data ?? [];
      if (Array.isArray(list) && list.length > 0) {
        setHasExpressedInterest(true);
      } else {
        setHasExpressedInterest(false);
      }
    } catch (e) {
      console.error("Error checking investor interest:", e);
      setHasExpressedInterest(false);
    } finally {
      setCheckingInterest(false);
    }
  };

  // check investor record for current user+project — hide "Invest Now" if exists
  useEffect(() => {
    checkInterest();
  }, [user, project]);

  // Fetch chart data for project
  const fetchChartData = useCallback(async () => {
    if (!project) return;
    try {
      setChartDataLoading(true);
      const payload = {
        projectId: project.id,
        date: selectedDate ?? null,
      };
      const res = await apiPost(`/api/projects/chart-data`, payload, {
        showLoader: false,
        includeAuth: false,
      });
      setProjectChartData(res?.success ? res.data : []);
    } catch (e) {
      console.error("Error fetching chart data:", e);
      setProjectChartData([]);
    } finally {
      setChartDataLoading(false);
    }
  }, [project, selectedDate]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Populate form when modal opens or when user changes
  useEffect(() => {
    if (!showInvestModal || !user) return;

    const fullName =
      user.full_name ||
      user.fullName ||
      user.name ||
      (user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : "") ||
      "";

    setInvestFullName(fullName);
    setInvestEmail(user.email || user.userEmail || "");
    setInvestPhone(user.phone || user.mobile || user.contact_number || "");
    setInvestNotes(""); // leave empty by default
  }, [showInvestModal, user]);

  const fetchProjectDetail = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiGet(`/api/projects/${projectId}`, {
        showLoader: false,
        includeAuth: false,
      });

      if (response && response.success && response.data) {
        setProject(response.data);
      } else if (response && response.data) {
        setProject(response.data);
      } else {
        setError("Project not found");
        console.error("Project not found or invalid response:", response);
      }
    } catch (error) {
      setError(error.message || "Error fetching project details");
      console.error("Error fetching project details:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // NEW: fetch testimonials related to this project (max 3)
  const fetchTestimonials = useCallback(async () => {
    if (!project) return;
    try {
      const res = await apiGet("/api/testimonials", {
        showLoader: false,
        includeAuth: false,
      });
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      const related = arr
        .filter((t) => {
          const pid = t.project?.id ?? t.project_id;
          return Number(pid) === Number(project.id);
        })
        .slice(0, 3);

      setTestimonials(related);
    } catch (e) {
      console.error("Error fetching testimonials:", e);
      setTestimonials([]);
    }
  }, [project]);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: "linear",
    });
  }, []);

  useEffect(() => {
    fetchProjectDetail();
  }, [fetchProjectDetail]);

  // fetch testimonials when project is loaded
  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  // Format numbers
  const formatNumber = (num) => {
    if (num === undefined || num === null || num === "") return "0";
    return parseFloat(num).toLocaleString("en-US");
  };

  const getProjectMainImage = () => {
    const cover = getPrimaryProjectImage(project);
    return cover ? buildUploadUrl(cover) : getFullImageUrl("/uploads/general/noimage.jpeg");
  };

  // Determine reliability badge based on ROI
  const getReliabilityBadge = () => {
    const status = project?.project_status_id;
    if (status === PROJECT_STATUS.UPCOMING) {
      return {
        text: lang("project_status.upcoming") || "Upcoming",
        icon: "🟡",
        class: "badge-upcoming",
      };
    }
    if (status === PROJECT_STATUS.RUNNING) {
      return {
        text: lang("project_status.running") || "Running",
        icon: "🟢",
        class: "badge-running",
      };
    } if (status === PROJECT_STATUS.PENDING) {
      return {
        text: lang("project_status.pending") || "Pending",
        icon: "🔵",
        class: "badge-pending",
      };
    }
  };

  // Load Electricity Consumption Data
  useEffect(() => {
    const loadElectricityConsumptionData = async () => {
      if (!project?.id) return;

      let dateValue;
      if (electricityConsumptionViewMode === "day") {
        dateValue = electricityConsumptionDate; // YYYY-MM format
      } else if (electricityConsumptionViewMode === "month") {
        dateValue = electricityConsumptionDate.slice(0, 4); // YYYY format
      } else {
        dateValue = new Date().getFullYear().toString(); // YYYY format (not used by API but required)
      }

      const payload = {
        projectId: project?.id ?? null,
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
  }, [project?.id, electricityConsumptionViewMode, electricityConsumptionDate]);

  useEffect(() => {
    const loadEnergyDayWiseData = async () => {
      const [year, month] = selectedMonthYear.split('-');
      const payload = {
        projectId: project?.id ?? null,
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
    if (project?.id && selectedMonthYear) {
      loadEnergyDayWiseData();
    }
  }, [project?.id, selectedMonthYear])
  // KWh & Revenue Chart Data
  const kwhRevenueChartOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        height: 350,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      xaxis: {
        categories: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "June",
          "Jul",
          "Aug",
          "Sept",
          "Oct",
          "Nov",
          "Dec",
        ],
      },
      yaxis: {
        title: {
          text: "kWh",
        },
      },
      fill: {
        opacity: 1,
        colors: ["#FFA726"],
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return formatNumber(val) + " kWh";
          },
        },
      },
      colors: ["#FFA726"],
    }),
    []
  );

  const kwhRevenueChartSeries = useMemo(() => {
    if (!projectChartData || !Array.isArray(projectChartData)) {
      return [
        {
          name: "KWh Generated",
          data: Array(11).fill(0),
        },
      ];
    }

    // Group data by month
    const monthlyMap = new Map();
    projectChartData.forEach((item) => {
      const month = item.month || 0;
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, 0);
      }
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + (item.total_kw || 0));
    });

    // Create array for all 11 months (0-10 for the chart)
    const data = Array(11)
      .fill(0)
      .map((_, i) => monthlyMap.get(i) || 0);

    return [
      {
        name: "KWh Generated",
        data,
      },
    ];
  }, [projectChartData]);

  // change Invest Now button to open modal (and add submit handler)
  const handleInvestClick = () => {
    setShowInvestModal(true);
  };

  const closeInvestModal = () => {
    if (submittingInvest) return;
    setShowInvestModal(false);
  };

  const handleInvestSubmit = async (e) => {
    e.preventDefault();
    if (!project) return;
    setSubmittingInvest(true);
    try {
      const payload = {
        projectId: project.id,
        userId: user?.id ?? null,
        fullName: investFullName,
        email: investEmail,
        phoneNumber: investPhone,
        notes: investNotes,
        created_by: user?.id,
      };

      const res = await apiPost("/api/investors", payload);

      if (res && res.success) {
        showSuccessToast("Investment intent submitted successfully");
        setShowInvestModal(false);
        // After submit, mark as expressed interest
        setHasExpressedInterest(true);
      } else {
        throw new Error(res?.message || "Submission failed");
      }

      setSubmittingInvest(false);
    } catch (err) {
      console.error("Error submitting investment:", err);
      setSubmittingInvest(false);
    }
  };

  if (loading) {
    return (
      <section className="main-contentBox Exchange-page mb-80">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="main-contentBox Exchange-page mb-80">
        <div className="container">
          <div className="text-center py-5">
            <h3 className="text-muted mb-3">Project not found</h3>
            <p className="text-muted">
              The project you're looking for (ID: {projectId}) doesn't exist or
              is not available.
            </p>
            <a href="/exchange-hub" className="btn btn-primary-custom mt-3">
              Back to Exchange Hub
            </a>
          </div>
        </div>
      </section>
    );
  }


  // Color palette for auto-random colors
  const colorPalette = [
    '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
    '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
  ];
  let colorIndex = 0;
  const getAutoRandomColor = () => {
    const color = colorPalette[colorIndex % colorPalette.length];
    colorIndex++;
    return color;
  };

  const InfoCard = ({ icon: Icon, label, value, color, isDark = false }) => {
    const colors = {
      // cardBg: isDark ? 'rgba(27, 36, 54, 0.5)' : '#f9fafb',
      cardBg: '#ffffff',
      text: isDark ? '#ffffff' : '#111827',
      textMuted: isDark ? '#b1b4c0' : '#6b7280',
    }

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '16px',
          backgroundColor: colors.cardBg,
          borderRadius: '8px',
          transition: 'background-color 0.2s',
        }}
      >
        <div
          style={{
            padding: '8px',
            borderRadius: '8px',
            background: color,
            flexShrink: 0,
          }}
        >
          <Icon style={{ width: '16px', height: '16px', color: '#fff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '4px' }}>{label}</p>
          <p
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value || '-'}
          </p>
        </div>
      </div>
    )
  };

  const badge = getReliabilityBadge();
  const accumulative =
    project.accumulative_generation ||
    (parseFloat(project.project_size || 0) * 1500).toFixed(0);

  return (
    <main>
      <section className="main-contentBox Exchange-page mb-80">
        <div className="container">
          <div className="sectionWraper">
            {/* Left Section */}
            <div className="left-card">
              {/* Image Box */}
              <div className="imageBox">
                <img
                  src={getProjectMainImage()}
                  alt={project.project_name}
                  className="main-img"
                  onError={(e) => {
                    e.target.src = "/images/banner/banner-img.png";
                  }}
                />
                <span
                  className={`badge imageTag ${badge.class}`}
                  style={{ backgroundColor: "#FFF3DF", color: "#000" }}
                >
                  <img
                    className="ms-1"
                    src="/img/Check-prem.svg"
                    alt="check"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                  {badge.text}
                </span>
              </div>

              {/* Header */}
              <div className="inner-header">
                <div className="title d-flex flex-wrap gap-3 align-items-center">
                  <h2
                    className="mb-0"
                    style={{ wordBreak: "break-word", maxWidth: "100%" }}
                  >
                    {project.project_name}
                    <span className="ms-1">|</span>
                  </h2>
                  <p className="mb-0" style={{ whiteSpace: "nowrap" }}>
                    ID:{" "}
                    {project.product_code ||
                      project.project_code ||
                      `SE-${project.id}`}
                  </p>
                </div>
                <span>
                  <img
                    src="/img/Location-1.png"
                    className="me-2"
                    alt=""
                    onError={(e) => (e.target.style.display = "none")}
                  />
                  {project.city?.name || project.location},{" "}
                  {project.state?.code || project.state_name}
                </span>
              </div>

              {/* Project Overview */}
              <div className="overview">
                <h3>
                  {lang("home.exchangeHub.projectOverview") ||
                    "Project Overview"}
                  :
                </h3>
                <p style={{ whiteSpace: "pre-line" }}>
                  {project.project_description ||
                    project.description ||
                    `This ${formatNumber(
                      project.project_size
                    )} kWp solar power project stands as a reliable and high-performing renewable energy asset, generating approximately ${formatNumber(
                      accumulative
                    )} kWh annually. With a strong ROI of ${project.investor_profit
                    }% and ${project.lease_term || "eight"
                    } years remaining on its lease term, it continues to deliver consistent financial returns while supporting clean energy adoption. Backed by a trusted offtaker ${project.offtaker?.company_name ||
                    project.offtaker?.fullName ||
                    ""
                    } with a ${project.offtaker_reliability_score || "92"
                    }% reliability index, the project ensures steady revenue flow and long-term stability. Initially commissioned and now listed for resale, this system presents an excellent opportunity for investors seeking sustainable and profitable resale options.`}
                </p>
              </div>

              {/* Stats View */}
              <div className="stats-view">
                <div className="leftStatsBox">
                  <div>
                    <p>
                      {lang("home.exchangeHub.installedCapacity") ||
                        "Installed Capacity"}
                      :
                    </p>
                    <h4>{formatNumber(project.project_size)} kWp</h4>
                  </div>
                  <div>
                    <p>{lang("home.exchangeHub.roi_monthly") || "ROI"}:</p>
                    <h4>{project.investor_profit || "0"}%</h4>
                  </div>
                  <div>
                    <p>
                      {lang("home.exchangeHub.paybackPeriod") + " (" + lang("home.exchangeHub.years") + ")" ||
                        "Payback Period"}
                      :
                    </p>
                    <h4>{project.payback_period || "0"} {lang("home.exchangeHub.years") || "Years"}</h4>
                  </div>
                </div>
                <div className="rightStatsBox">
                  <div>
                    <p>
                      {lang("home.exchangeHub.annualGeneration") ||
                        "Annual Generation"}
                      :
                    </p>
                    <h4>{formatNumber(accumulative)} kWh</h4>
                  </div>
                  <div>
                    <p>
                      {lang("home.exchangeHub.leaseTermRemaining") ||
                        "Lease Term Remaining"}
                      :
                    </p>
                    <h4>
                      {project.lease_term || "0"}{" "}
                      {lang("home.exchangeHub.years") || "Years"}
                    </h4>
                  </div>
                  <div>
                    <p>
                      {lang("home.exchangeHub.askingPrice") || "Asking Price"}:
                    </p>
                    <h4>
                      ${formatNumber(project.asking_price || "0")}
                      <span>
                        {" "}
                        (
                        {project.price_type ||
                          lang("home.exchangeHub.negotiable") ||
                          "Negotiable"}
                        )
                      </span>
                    </h4>
                  </div>
                </div>
              </div>


              {/* Analytics */}
              {project.project_status_id === PROJECT_STATUS.RUNNING && (
                <>
                  <hr />
                  <div className="analytics">
                    {/* <div className="chart-container"> */}
                    <ElectricityConsumption
                      data={electricityConsumptionData}
                      loading={electricityConsumptionDataLoading}
                      selectedMonthYear={electricityConsumptionDate}
                      onMonthYearChange={setElectricityConsumptionDate}
                    />
                    {/* </div> */}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 10,
                        padding: "0px 0px 0px 24px",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "999px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#eff6ff",
                          color: "#2563eb",
                        }}
                      >
                        <FiZap />
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {lang(
                          "projectView.energyProduction.real_time_energy_production",
                          "Daily Power Profile (Load, PV & Grid)"
                        )}
                      </div>
                    </div>

                    <ProjectOverviewChart
                      projectId={project.id}
                      readings={projectChartData || []}
                      loading={chartDataLoading}
                      selectedDate={selectedDate}
                      onDateChange={setSelectedDate}
                    />

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 10,
                        padding: "0px 0px 0px 24px",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "999px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#eff6ff",
                          color: "#2563eb",
                        }}
                      >
                        <FiZap />
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {lang(
                          "projectView.energyProduction.monthly_real_time_energy_production",
                          "Daily Power Profile (Load, PV & Grid)"
                        )}
                      </div>
                    </div>

                    <EnergyChart
                      chartMonthData={chartMonthData}
                      selectedMonthYear={selectedMonthYear}
                      onMonthYearChange={setSelectedMonthYear}
                      monthlyChartDataLoading={monthlyChartDataLoading}
                    />

                  </div>

                  <div>
                    <div className="ownership-section">
                      {/* <h4>
                        {lang("home.exchangeHub.binh_dinh") ||
                          "Transaction & Ownership History"}
                      </h4> */}
                      <div className="row g-3">
                        <div className="col-4">
                          <InfoCard
                            icon={CloudSun}
                            label={lang('projectView.projectInformation.weather', 'Weather')}
                            value={`${project?.project_data?.[0]?.cond_txtd ?? '-'} ~ ${project?.project_data?.[0]?.cond_txtn ?? '-'}`}
                            color={getAutoRandomColor()}
                          />
                        </div>
                        <div className="col-4">
                          <InfoCard
                            icon={SunriseIcon}
                            label={lang('projectView.projectInformation.sunshine', 'Sunshine')}
                            value={`${project?.project_data?.[0]?.sr ?? '-'} ~ ${project?.project_data?.[0]?.ss ?? '-'}`}
                            color={getAutoRandomColor()}
                          />
                        </div>
                        <div className="col-4">
                          <InfoCard icon={Thermometer} label={lang('projectView.projectInformation.temp', 'Temp')} value={
                            project?.project_data?.[0]?.tmp_min != null && project?.project_data?.[0]?.tmp_max != null
                              ? `${project.project_data[0].tmp_min} ℃ ~ ${project.project_data[0].tmp_max} ℃`
                              : project?.tmp_min != null
                                ? `${project.tmp_min} ℃`
                                : '-'
                          } color={getAutoRandomColor()}
                          />
                        </div>
                        <div className="col-4">
                          <InfoCard icon={Droplets} label={lang('projectView.projectInformation.humidity', 'Humidity')} value={project?.project_data?.[0]?.hum ?? '-'} color={getAutoRandomColor()} />
                        </div>
                        <div className="col-4">
                          <InfoCard icon={Compass} label={lang('projectView.projectInformation.wind_direction', 'Wind Direction')} value={project?.project_data?.[0]?.wind_dir ?? '-'} color={getAutoRandomColor()} />
                        </div>
                        <div className="col-4">
                          <InfoCard icon={Wind} label={lang('projectView.projectInformation.wind_speed', 'Wind Speed')} value={project?.project_data?.[0]?.wind_spd ?? '-'} color={getAutoRandomColor()} />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Section */}
            <div className="right-card border-0">
              {/* Investor Box */}
              <div className="investor-box">
                <h3>
                  {lang("home.exchangeHub.seekingInvestor") ||
                    "Seeking Investor"}
                </h3>
                <div className="middileContend">
                  <p className="mb-0 text-secondary-color">
                    {lang("home.exchangeHub.targetInvestment") ||
                      "Target Investment"}
                  </p>
                  <h2>${formatNumber(project.asking_price || "0")}</h2>
                </div>

                {/* Conditional invest button */}
                {project.project_status_id === PROJECT_STATUS.UPCOMING && (
                  !user ? (
                    <button
                      className="btn btn-primary-custom"
                      onClick={() => router.push("/investor/login")}
                    >
                      {lang("home.exchangeHub.signInToInvest") ||
                        "Sign In to Invest"}
                    </button>
                  ) : (
                    (() => {
                      const isInvestor = user && user.role === ROLES.INVESTOR;
                      if (!isInvestor) return null;
                      if (hasExpressedInterest) {
                        return null;
                      }
                      return (
                        <button
                          className="btn btn-primary-custom"
                          onClick={handleInvestClick}
                          disabled={checkingInterest}
                        >
                          {lang("home.exchangeHub.investNow") || "Invest Now"}
                        </button>
                      );
                    })()
                  )
                )}

              </div>

              {/* Testimonials */}
              {project.project_status_id === PROJECT_STATUS.RUNNING && (
                <div className="testimonial-rightBox">
                  {/* NEW: show up to 3 testimonials related to this project */}
                  <h3>
                    {lang("home.exchangeHub.testimonials") ||
                      "Offtaker & Investor Testimonials"}
                  </h3>
                  {testimonials.length > 0 ? (
                    testimonials.map((t, idx) => (
                      <div className="testi-card" key={t.id || idx}>
                        <img
                          src={buildUploadUrl(t?.users?.user_image) || "/images/avatar/profile_demo_img.jpg"}
                          alt="testimonial"
                          onError={(e) => {
                            e.target.src = "/images/avatar/user-img.png";
                          }}
                        />
                        <h4>{t.project?.project_name || project.project_name}</h4>
                        <div className="designation">
                          {t.users?.full_name || t.users?.fullName}
                          {t.users?.role_id === ROLES.OFFTAKER ? " (Offtaker)" : " (Investor)"}
                        </div>
                        <p>{t.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="testi-card">
                      <p>{lang("home.exchangeHub.noTestimonials") || "No testimonials for this project"}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Invest Modal (MUI Dialog styled like ContactUsTable) */}
      <InvestDialog
        open={!!showInvestModal}
        onClose={closeInvestModal}
        lang={lang}
        submitting={submittingInvest}
        fullName={investFullName}
        setFullName={setInvestFullName}
        email={investEmail}
        setEmail={setInvestEmail}
        phone={investPhone}
        setPhone={setInvestPhone}
        notes={investNotes}
        setNotes={setInvestNotes}
        onSubmit={handleInvestSubmit}
      />
    </main>
  );
};

export default ProjectDetail;
