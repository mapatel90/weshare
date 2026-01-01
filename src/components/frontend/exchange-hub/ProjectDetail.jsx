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
import { getFullImageUrl } from "@/utils/common";
import { getPrimaryProjectImage } from "@/utils/projectUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from "@mui/material";

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const ProjectDetail = ({ projectId }) => {
  const { lang } = useLanguage();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // NEW: testimonials state
  const [testimonials, setTestimonials] = useState([]);

  const { user } = useAuth();

  const router = useRouter();

  // Added missing states for invest modal & form
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investFullName, setInvestFullName] = useState("");
  const [investEmail, setInvestEmail] = useState("");
  const [investPhone, setInvestPhone] = useState("");
  const [investNotes, setInvestNotes] = useState("");
  const [submittingInvest, setSubmittingInvest] = useState(false);

  // NEW: track if current user already expressed interest for this project
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
  const [checkingInterest, setCheckingInterest] = useState(false);

  // Chart data states
  const [projectChartData, setProjectChartData] = useState(null);
  const [chartDataLoading, setChartDataLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

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
    return cover ? getFullImageUrl(cover) : getFullImageUrl("/uploads/general/noimage.jpeg");
  };

  // Determine reliability badge based on ROI
  const getReliabilityBadge = () => {
    if (!project)
      return { text: "Loading...", icon: "⚪", class: "badge-moderate" };

    const roi = parseFloat(project.investor_profit || 0);
    if (roi >= 12)
      return {
        text: lang("home.exchangeHub.highReliability") || "High Reliability",
        icon: "🟢",
        class: "badge-high",
      };
    if (roi >= 8)
      return {
        text:
          lang("home.exchangeHub.moderateReliability") ||
          "Moderate Reliability",
        icon: "🟡",
        class: "badge-moderate",
      };
    return {
      text:
        lang("home.exchangeHub.premiumReliability") || "Premium Reliability",
      icon: "🔵",
      class: "badge-premium",
    };
  };

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

  // ROI Trend Chart Data
  const roiTrendChartOptions = useMemo(
    () => ({
      chart: {
        type: "line",
        height: 350,
        toolbar: {
          show: false,
        },
      },
      stroke: {
        curve: "smooth",
        width: 3,
      },
      xaxis: {
        categories: ["0", "2021", "2022", "2023", "2025"],
        title: {
          text: "Year",
        },
      },
      yaxis: {
        title: {
          text: "ROI",
        },
        min: 0,
        max: 800,
      },
      colors: ["#FFA726"],
      markers: {
        size: 5,
        colors: ["#FFA726"],
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: {
          size: 7,
        },
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val;
          },
        },
      },
    }),
    []
  );

  const roiTrendChartSeries = useMemo(() => {
    const currentROI = parseFloat(project?.investor_profit || 10);
    return [
      {
        name: "ROI",
        data: [
          0,
          Math.round(currentROI * 55),
          Math.round(currentROI * 18),
          Math.round(currentROI * 8),
          Math.round(currentROI * 75),
        ],
      },
    ];
  }, [project]);

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
                    )} kWh annually. With a strong ROI of ${
                      project.investor_profit
                    }% and ${
                      project.lease_term || "eight"
                    } years remaining on its lease term, it continues to deliver consistent financial returns while supporting clean energy adoption. Backed by a trusted offtaker ${
                      project.offtaker?.company_name ||
                      project.offtaker?.fullName ||
                      ""
                    } with a ${
                      project.offtaker_reliability_score || "92"
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
                    <p>{lang("home.exchangeHub.roi") || "ROI"}:</p>
                    <h4>{project.investor_profit || "0"}%</h4>
                  </div>
                  <div>
                    <p>
                      {lang("home.exchangeHub.cumulativeRevenue") ||
                        "Cumulative Revenue"}
                      :
                    </p>
                    <h4>${formatNumber(project.cumulative_revenue || "0")}</h4>
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

              <hr />

              {/* Analytics */}
              <div className="analytics">
                <h3>{lang("home.exchangeHub.analytics") || "Analytics"}:</h3>
                <p className="fw-600 mb-3">KWh & Revenue</p>
                <div className="chart-container mb-4">
                  {typeof window !== "undefined" && (
                    <Chart
                      options={kwhRevenueChartOptions}
                      series={kwhRevenueChartSeries}
                      type="bar"
                      height={350}
                    />
                  )}
                </div>

                <p className="fw-600 mb-3 mt-5">ROI Trend</p>
                <div className="chart-container">
                  {typeof window !== "undefined" && (
                    <Chart
                      options={roiTrendChartOptions}
                      series={roiTrendChartSeries}
                      type="line"
                      height={350}
                    />
                  )}
                </div>

                <ProjectOverviewChart
                  projectId={project.id}
                  readings={projectChartData || []}
                  loading={chartDataLoading}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                />

              </div>
              <hr />

              {/* Index Section */}
              <div className="indexSection">
                <div className="indexBox">
                  <h4 className="fs-24 fw-600 text-black">
                    {lang("home.exchangeHub.offtakerReliability") ||
                      "Offtaker Reliability Index"}
                  </h4>
                  <img
                    src="/img/chart-semicircle.png"
                    alt=""
                    onError={(e) => (e.target.style.display = "none")}
                  />
                  <div className="values">
                    {project.offtaker_reliability_score || "92"}%
                  </div>
                  <p>{badge.text}</p>
                </div>

                <div className="ownership-section">
                  <h4>
                    {lang("home.exchangeHub.transactionHistory") ||
                      "Transaction & Ownership History"}
                  </h4>
                  {project.ownership_history ? (
                    JSON.parse(project.ownership_history).map((item, index) => (
                      <div className="row mb-2" key={index}>
                        <div className="col-3">
                          <p className="fw-600 text-secondary-color">
                            {item.year}
                          </p>
                        </div>
                        <div className="col-9">
                          <p className="text-black fw-500">{item.event}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="row mb-2">
                        <div className="col-3">
                          <p className="fw-600 text-secondary-color">2019</p>
                        </div>
                        <div className="col-9">
                          <p className="text-black fw-500">
                            Initial Investment
                          </p>
                        </div>
                      </div>
                      <div className="row mb-2">
                        <div className="col-3">
                          <p className="fw-600 text-secondary-color">2024</p>
                        </div>
                        <div className="col-9">
                          <p className="text-black fw-500">Listed for Resale</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
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
                {!user ? (
                  <button
                    className="btn btn-primary-custom"
                    onClick={() => router.push("/investor/login")}
                  >
                    {lang("home.exchangeHub.signInToInvest") ||
                      "Sign In to Invest"}
                  </button>
                ) : (
                  (() => {
                    const isInvestor = user && user.role === 4;
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
                )}
              </div>

              {/* Testimonials */}
              <div className="testimonial-rightBox">
                <h3>
                  {lang("home.exchangeHub.testimonials") ||
                    "Offtaker & Investor Testimonials"}
                </h3>

                {/* NEW: show up to 3 testimonials related to this project */}
                {testimonials.length > 0 ? (
                  testimonials.map((t, idx) => (
                    <div className="testi-card" key={t.id || idx}>
                      <img
                        src={t.image || "/images/avatar/user-img.png"}
                        alt="testimonial"
                        onError={(e) => {
                          e.target.src = "/images/avatar/user-img.png";
                        }}
                      />
                      <h4>{t.project?.project_name || project.project_name}</h4>
                      <div className="designation">
                        {t.offtaker?.fullName ||
                          t.offtaker_fullName ||
                          "Offtaker"}
                      </div>
                      <p>{t.description}</p>
                    </div>
                  ))
                ) : (
                  <>
                    {/* fallback static testimonials if none found */}
                    <div className="testi-card">
                      <img
                        src={
                          project.offtaker?.profile_image ||
                          "/images/avatar/user-img.png"
                        }
                        alt="testimonial"
                        onError={(e) => {
                          e.target.src = "/images/avatar/user-img.png";
                        }}
                      />
                      <h4>
                        {project.offtaker?.company_name ||
                          project.offtaker?.fullName ||
                          "Greenfield Holdings"}
                      </h4>
                      <div className="designation">
                        {lang("home.exchangeHub.offtaker") || "Offtaker"}
                      </div>
                      <p>
                        "Partnering with this solar project has significantly
                        reduced our energy expenses while ensuring a stable and
                        eco-friendly power supply. The system's consistent
                        performance has made it a dependable asset for our
                        operations."
                      </p>
                    </div>

                    <div className="testi-card">
                      <img
                        src="/img/test-img.png"
                        alt="testimonial"
                        onError={(e) => {
                          e.target.src = "/images/avatar/user-img.png";
                        }}
                      />
                      <h4>Sarah Johnson</h4>
                      <div className="designation">
                        {lang("home.exchangeHub.investor") || "Investor"}
                      </div>
                      <p>
                        "Investing in this project has been a rewarding
                        decision. The ROI has steadily improved each year, and
                        the transparency in performance tracking gives me
                        complete confidence in the asset's long-term value."
                      </p>
                    </div>

                    <div className="testi-card">
                      <img
                        src="/images/avatar/user-img.png"
                        alt="testimonial"
                        onError={(e) => {
                          e.target.src = "/img/test-img.png";
                        }}
                      />
                      <h4>Cameron Williamson</h4>
                      <div className="designation">
                        {lang("home.exchangeHub.investor") || "Investor"}
                      </div>
                      <p>
                        "This solar project offers excellent returns with
                        minimal risk. The professional management and reliable
                        offtaker make it a standout investment in my renewable
                        energy portfolio."
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Invest Modal (MUI Dialog styled like ContactUsTable) */}
      <Dialog
        open={!!showInvestModal}
        onClose={closeInvestModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1.1rem",
            borderBottom: "1px solid #e0e0e0",
            pb: 1,
          }}
        >
          {lang("home.exchangeHub.investNow") || "Invest Now"}
        </DialogTitle>

        <form onSubmit={handleInvestSubmit}>
          <DialogContent
            dividers
            sx={{
              background: "#fafafa",
              px: 3,
              py: 3,
              display: "grid",
              gap: 2,
            }}
          >
            <TextField
              label={lang("contactUs.fullNameTable") || "Full Name"}
              value={investFullName}
              onChange={(e) => setInvestFullName(e.target.value)}
              required
              fullWidth
            />

            <TextField
              label={lang("contactUs.emailTable") || "Email"}
              type="email"
              value={investEmail}
              onChange={(e) => setInvestEmail(e.target.value)}
              required
              fullWidth
            />

            <TextField
              label={lang("contactUs.phoneTable") || "Phone"}
              value={investPhone}
              onChange={(e) => setInvestPhone(e.target.value)}
              required
              fullWidth
            />

            <TextField
              label={lang("home.exchangeHub.notes") || "Notes"}
              value={investNotes}
              onChange={(e) => setInvestNotes(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </DialogContent>

          <DialogActions
            sx={{ px: 3, py: 1.5, borderTop: "1px solid #e0e0e0" }}
          >
            <Button
              onClick={closeInvestModal}
              className="custom-orange-outline"
              variant="outlined"
              disabled={submittingInvest}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              {lang("common.cancel") || "Cancel"}
            </Button>
            <Button
              type="submit"
              className="common-grey-color"
              variant="contained"
              disabled={submittingInvest}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              {submittingInvest
                ? lang("home.exchangeHub.submitting") || "Submitting..."
                : lang("home.exchangeHub.submit") || "Submit"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </main>
  );
};

export default ProjectDetail;
