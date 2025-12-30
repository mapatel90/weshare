"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

// React Icons
import { FiUsers, FiCpu } from "react-icons/fi";
import {
  MdSolarPower,
  MdDocumentScanner,
  MdVerifiedUser,
  MdTrendingUp,
} from "react-icons/md";

const StatsCardOverview = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const pathname = usePathname();
  const isOfftakerView = useMemo(
    () => typeof pathname === "string" && pathname.startsWith("/offtaker"),
    [pathname]
  );

  const statsConfig = useMemo(() => {
    if (isOfftakerView) {
      return [
        {
          key: "projects",
          title: lang("navigation.projects", "Projects"),
          icon: <MdSolarPower size={26} />,
        },
        {
          key: "contracts",
          title: lang("offtaker_login.sidebar.contracts", "Contracts"),
          icon: <MdDocumentScanner size={26} />,
        },
        {
          key: "reports",
          title: lang("reports.title", "Reports"),
          icon: <MdTrendingUp size={26} />,
        },
      ];
    }
    return [
      {
        key: "projects",
        title: lang("navigation.projects", "Projects"),
        icon: <MdSolarPower size={26} />,
      },
      {
        key: "users",
        title: lang("navigation.users", "Users"),
        icon: <FiUsers size={26} />,
      },
      {
        key: "inverters",
        title: lang("inverter.inverter", "inverters"),
        icon: <FiCpu size={26} />,
      },
      {
        key: "contracts",
        title: lang("offtaker_login.sidebar.contracts", "Contracts"),
        icon: <MdDocumentScanner size={26} />,
      },
      {
        key: "lease_request",
        title: lang("leaseRequest.title", "Lease Requests"),
        icon: <MdVerifiedUser size={26} />,
      },
      {
        key: "interested_investors",
        title: lang("home.exchangeHub.investor"),
        icon: <MdTrendingUp size={26} />,
      },
    ];
  }, [isOfftakerView, lang]);
  const [stats, setStats] = useState({
    projects: 0,
    users: 0,
    inverters: 0,
    contracts: 0,
    lease_request: 0,
    interested_investors: 0,
    reports: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = isOfftakerView && user?.id
          ? `/api/dashboard/statscount?offtakerId=${user.id}`
          : "/api/dashboard/statscount";
        const res = await apiGet(url);
        if (res.data) setStats((prev) => ({ ...prev, ...res.data }));
        else setError("Failed to fetch stats");
      } catch (err) {
        setError("Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isOfftakerView, user?.id]);

  return (
    <div className="row mb-3">
    <div className="col-12">
      <div className="card stretch stretch-full mt-3">
        <div className="card-body shadow-sm">
          {/* Header */}
          <div className="hstack justify-content-between mb-4">
            <div>
              <h5 className="mb-1 fw-bold fs-16">
                {lang("header.statsOverview", "Stats Overview")}
              </h5>
              <span className="fs-12 text-muted">
                {lang("header.statsDescription", "Overview of stats")}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="row">
            {loading ? (
              <div className="text-center py-5">Loading...</div>
            ) : error ? (
              <div className="text-danger text-center py-5">{error}</div>
            ) : (
              statsConfig.map(({ key, title, icon }) => (
                <div key={key} className="col-xxl-2 col-lg-4 col-md-6">
                  <div
                    className="card text-center"
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "14px",
                      padding: "22px 12px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                      transition: "all 0.25s ease",
                      background: "#ffffff",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow =
                        "0 6px 20px rgba(0,0,0,0.07)";
                      e.currentTarget.style.borderColor = "#d1d5db";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0px)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 6px rgba(0,0,0,0.04)";
                      e.currentTarget.style.borderColor = "#e5e7eb";
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: "55px",
                        height: "55px",
                        borderRadius: "50%",
                        // background: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        color: "#374151",
                      }}
                    >
                      {icon}
                    </div>

                    {/* Number */}
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        marginTop: "14px",
                        marginBottom: "2px",
                        // color: "#111827"
                      }}
                    >
                      {stats[key]}
                    </div>

                    {/* Label */}
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#6b7280",
                        letterSpacing: "0.3px",
                        fontWeight: "500",
                      }}
                    >
                      {title}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default StatsCardOverview;
