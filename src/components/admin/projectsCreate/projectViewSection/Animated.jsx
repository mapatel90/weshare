"use client";
import React, { useState, useEffect } from "react";
import {
  FiSun,
  FiZap,
  FiActivity,
  FiHome,
  FiBattery,
  FiTrendingUp,
} from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
import { sortByNameAsc } from "@/utils/common";

export default function SolarEnergyFlow({
  inverters = [],
  isDark = false,
  project = {},
}) {
  // Get first 6 inverters (regardless of status)
  const displayInverters = inverters.slice(0, 6);

  const { lang } = useLanguage();
  const batteryPercentRaw = project?.project_data?.[0]?.battery_percent ?? 0;
  const batteryPercent = Math.max(
    0,
    Math.min(100, Number(batteryPercentRaw) || 0)
  );
  const batteryFill = "#1372dfff";
  const batteryEmpty = isDark ? "#1f2937" : "#e5e7eb";
  const batteryBorder = `conic-gradient(${batteryFill} 0% ${batteryPercent}%, ${batteryEmpty} ${batteryPercent}% 100%)`;
  const batteryDirection = project?.project_data?.[0]?.battery_direction;
  const hasBatteryFlow = batteryDirection === 2 || batteryDirection === 4;
  const batteryFlowPower = Math.abs(
    project?.project_data?.[0]?.battery_power || 0
  );

  // Calculate active inverters from displayed 6
  const activeInverters = displayInverters.filter(
    (inv) => inv?.status === 1
  ).length;
  const totalInverters = displayInverters.length;

  // Responsive state
  const [screenSize, setScreenSize] = useState("pc"); // "mobile", "tablet", "laptop", "pc"
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 758) {
        setScreenSize("mobile");
      } else if (width < 1030) {
        setScreenSize("tablet");
      } else if (width < 1800) {
        setScreenSize("laptop");
      } else {
        setScreenSize("pc");
      }

      // Check for very small mobile screens
      setIsVerySmallScreen(width < 390);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const isSmallScreen = screenSize === "mobile" || screenSize === "tablet";

  // Dark mode colors
  const colors = {
    cardBg: isDark ? "#121a2d" : "#fff",
    text: isDark ? "#ffffff" : "#111827",
    textMuted: isDark ? "#b1b4c0" : "#6b7280",
    border: isDark ? "#1b2436" : "#e5e7eb",
    borderLight: isDark ? "#1b2436" : "#f3f4f6",
  };

  /* ================= HELPERS ================= */

  const Arrow = ({ path, color, scale = 1 }) => (
    <path
      d={`M${-4 * scale},${-8 * scale} L${4 * scale},0 L${-4 * scale},${8 * scale
        } Z`}
      fill={color}
    >
      <animateMotion dur="3s" repeatCount="indefinite" rotate="auto">
        <mpath href={path} />
      </animateMotion>
    </path>
  );

  // Mobile-only simple power-flow view (keeps desktop/tablet UI unchanged)
  const MobilePowerFlow = () => {
    return (
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: 12,
          border: `1px solid ${colors.borderLight}`,
          padding: 16,
          boxShadow: isDark
            ? "0 0 20px rgba(14, 32, 56, 0.3)"
            : "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: colors.text,
            marginBottom: 12,
          }}
        >
          {lang("animated.powerflow", "Power Flow")}
        </div>

        <div
          style={{
            position: "relative",
            height: 400,
            maxWidth: 360,
            margin: "0 auto",
          }}
        >
          <svg
            viewBox="0 0 360 400"
            width="360"
            height="400"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            <g
              transform={
                isVerySmallScreen
                  ? "translate(-360, -55)"
                  : "translate(-325, -55)"
              }
            >
              <path
                id="pvPath"
                // d="M 431 105 L 450 105 Q 470 105 470 125 L 470 186"
                d={
                  isVerySmallScreen
                    ? "M 381 105 L 450 105 Q 470 105 470 125 L 470 205"
                    : "M 381 105 L 450 105 Q 470 105 470 125 L 470 198"
                }
                stroke="#FACC15"
                strokeWidth="2"
                fill="none"
              />
              {project?.project_data?.[0]?.power > 0 && (
                <Arrow path="#pvPath" color="#FACC15" />
              )}
            </g>

            <g
              transform={
                isVerySmallScreen
                  ? "translate(-370, -54)"
                  : "translate(-335, -54)"
              }
            >
              <path
                id="gridPath"
                // d="M 543 105 L 525 105 Q 505 105 505 125 L 505 182"
                d="M 593 105 L 525 105 Q 505 105 505 125 L 505 200"
                stroke="#EF4444"
                strokeWidth="2"
                fill="none"
              />
              {Math.abs(project?.project_data?.[0]?.p_sum) > 0 && (
                <Arrow path="#gridPath" color="#EF4444" />
              )}
            </g>

            <g
              transform={
                isVerySmallScreen
                  ? "translate(-370, -52)"
                  : "translate(-335, -52)"
              }
            >
              <path
                id="consumePath"
                d="M 505 274 L 505 350 Q 505 380 535 380 L 594 380"
                stroke="#FB923C"
                strokeWidth="2"
                fill="none"
              />
              {(project?.project_data?.[0]?.epm_type !== 1
                ? project?.project_data?.[0]?.generator_power > 0
                : project?.project_data?.[0]?.family_load_power > 0) && (
                  <Arrow path="#consumePath" color="#FB923C" />
                )}
            </g>

            {project?.project_data?.[0]?.epm_type !== 1 && (
              <g
                transform={
                  isVerySmallScreen
                    ? "translate(-350, -82)"
                    : "translate(-315, -83)"
                }
              >
                <path
                  id="inverterToGridLoadPath"
                  d="M 485 228 L 555 228 Q 575 228 575 248 L 575 254"
                  stroke="#8da094ff"
                  strokeWidth="2"
                  fill="none"
                />
                {project?.project_data?.[0]?.family_load_power &&
                  Math.abs(project?.project_data?.[0]?.family_load_power) >
                  0 && (
                    <Arrow path="#inverterToGridLoadPath" color="#8da094ff" />
                  )}
              </g>
            )}

            {project?.project_data?.[0]?.epm_type !== 1 && (
              <g
                transform={
                  isVerySmallScreen
                    ? "translate(-394, -52)"
                    : "translate(-360, -52)"
                }
              >
                <path
                  id="batteryPathMobile"
                  d={
                    batteryDirection === 2
                      ? "M 416 380 L 475 380 Q 505 380 505 350 L 505 272"
                      : "M 505 272 L 505 350 Q 505 380 475 380 L 416 380"
                  }
                  stroke="#1372dfff"
                  strokeWidth="2"
                  fill="none"
                />
                {hasBatteryFlow && batteryFlowPower > 0 && (
                  <Arrow path="#batteryPathMobile" color="#1372dfff" />
                )}
              </g>
            )}
          </svg>

          {/* PV */}
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                height: 85,
                width: 85,
                borderRadius: "50%",
                border: "2px solid #FACC15",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: colors.cardBg,
                flexShrink: 0,
              }}
            >
              <FiSun
                style={{
                  fontSize: 25,
                  color: "#FACC15",
                }}
              />
              <div style={{ fontSize: 10, color: "#666", fontWeight: "bold" }}>
                {project?.project_data?.[0]?.power || 0} kw
              </div>
            </div>

            <div
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                background: isDark ? "#1f2937" : "#f3f4f6",
                color: colors.text,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              PV
            </div>
          </div>

          {/* Battery */}
          {project?.project_data?.[0]?.epm_type !== 1 && (
            <div
              style={{
                position: "absolute",
                top: isVerySmallScreen ? 273 : 280,
                left: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  height: 85,
                  width: 85,
                  borderRadius: "50%",
                  background: batteryBorder,
                  padding: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "100%",
                    borderRadius: "50%",
                    background: colors.cardBg,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FiBattery
                      style={{
                        fontSize: 32,
                        color: batteryFill,
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        fontSize: 10,
                        fontWeight: 700,
                        color: batteryFill,
                        marginRight: 4,
                      }}
                    >
                      {batteryPercent}%
                    </span>
                  </div>
                  <div
                    style={{ fontSize: 10, color: "#666", fontWeight: "bold" }}
                  >
                    {project?.project_data?.[0]?.battery_power || 0} kw
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: isDark ? "#1f2937" : "#f3f4f6",
                  color: colors.text,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {lang("animated.battery", "Battery")}
              </div>
            </div>
          )}

          {/* Grid */}
          <div
            style={{
              position: "absolute",
              top: isVerySmallScreen ? 8 : 12,
              // left: 220,
              right: isVerySmallScreen ? 0 : 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                height: 85,
                width: 85,
                borderRadius: "50%",
                border: "2px solid #F87171",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: colors.cardBg,
                flexShrink: 0,
              }}
            >
              <FiZap
                style={{
                  fontSize: 25,
                  color: "#F87171",
                }}
              />
              <div style={{ fontSize: 10, color: "#666", fontWeight: "bold" }}>
                {Math.abs(project?.project_data?.[0]?.p_sum || 0)} kw
              </div>
            </div>

            <div
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                background: isDark ? "#1f2937" : "#f3f4f6",
                color: colors.text,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Grid
            </div>
          </div>

          {/* Grid Load */}
          {project?.project_data?.[0]?.epm_type !== 1 && (
            <div
              style={{
                position: "absolute",
                top: isVerySmallScreen ? 138 : 145,
                // left: 220,
                right: isVerySmallScreen ? 0 : 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",

                gap: 6,
              }}
            >
              <div
                style={{
                  height: 85,
                  width: 85,
                  borderRadius: "50%",
                  border: "2px solid #8da094ff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: colors.cardBg,
                  flexShrink: 0,
                }}
              >
                <FiTrendingUp
                  style={{
                    fontSize: 25,
                    color: "#8da094ff",
                  }}
                />
                <div
                  style={{ fontSize: 10, color: "#666", fontWeight: "bold" }}
                >
                  {project?.project_data?.[0]?.family_load_power || 0} kw
                </div>
              </div>

              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: isDark ? "#1f2937" : "#f3f4f6",
                  color: colors.text,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {lang("animated.grid_load", "Grid Load")}
              </div>
            </div>
          )}

          {/* Inverter */}
          <div
            style={{
              position: "absolute",
              left: isVerySmallScreen ? 120 : 155,
              top: 142,
              transform: "translate(-50%)",
              height: 85,
              width: 85,
              borderRadius: "50%",
              border: "2px solid #FB923C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: colors.cardBg,
            }}
          >
            <FiActivity
              style={{
                fontSize: 25,
                color: "#FB923C",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              top: isVerySmallScreen ? 273 : 280,
              // left: 220,
              right: isVerySmallScreen ? 0 : 0,
            }}
          >
            <div
              style={{
                height: 85,
                width: 85,
                borderRadius: "50%",
                border: "2px solid #FB923C",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: colors.cardBg,
                flexShrink: 0,
              }}
            >
              <FiHome
                style={{
                  fontSize: 25,
                  color: "#FB923C",
                }}
              />
              <div style={{ fontSize: 10, color: "#666", fontWeight: "bold" }}>
                {project?.project_data?.[0]?.epm_type !== 1
                  ? project?.project_data?.[0]?.generator_power || 0
                  : project?.project_data?.[0]?.family_load_power || 0}{" "}
                kw
              </div>
            </div>

            <div
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                background: isDark ? "#1f2937" : "#f3f4f6",
                color: colors.text,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {project?.project_data?.[0]?.epm_type !== 1
                ? lang("animated.backupload")
                : lang("animated.consumed", "Consumed")}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          screenSize === "pc"
            ? "1100px 1fr"
            : screenSize === "laptop"
              ? "1fr"
              : screenSize === "tablet"
                ? "1fr"
                : screenSize === "mobile"
                  ? "repeat(auto-fit, minmax(300px, 1fr))"
                  : "1fr",
        gap: "24px",
        marginBottom: "24px",
        width: "100%",
        margin: "0 auto 24px auto",
        height: "auto",
      }}
    >
      {/* Animated Section - Hide on Mobile */}
      {screenSize === "mobile" ? (
        <MobilePowerFlow />
      ) : (
        <div
          style={{
            width: "100%",
            height: isSmallScreen ? 400 : 600,
            margin: "0 auto",
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            padding: isSmallScreen ? 16 : 20,
            fontFamily: "Arial, sans-serif",
            overflow: screenSize === "mobile" ? "hidden" : "hidden",
            overflowX: screenSize === "mobile" ? "auto" : "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              fontSize: 17,
              fontWeight: "bold",
              color: colors.text,
              marginBottom: 20,
            }}
          >
            {lang("animated.dataReportingTime", "Data Reporting Time")} :
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div
              style={{
                width: "100%",
                height: isSmallScreen ? 325 : 510,
                position: "relative",
                maxWidth: 1100,
                margin: "0 auto",
              }}
            >
              {/* ================= PV ================= */}
              <div
                style={{
                  position: "absolute",
                  left: isSmallScreen ? 35 : 40,
                  top: isSmallScreen ? 10 : 45,
                  width: isSmallScreen ? 220 : 400,
                  padding: isSmallScreen ? 12 : 15,
                  borderRadius: 50,
                  background: isDark ? "rgba(254, 243, 199, 0.1)" : "#FFFBEB",
                  border: `1px solid ${isDark ? "rgba(250, 204, 21, 0.3)" : "#FDE68A"
                    }`,
                  display: "flex",
                  alignItems: "center",
                  gap: isSmallScreen ? 8 : 12,
                }}
              >
                <div style={{ width: 4, height: 35, background: "#FACC15" }} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: screenSize === "tablet" ? 10 : 14,
                      color: colors.text,
                    }}
                  >
                    PV
                  </div>
                  <div
                    style={{
                      fontSize: screenSize === "tablet" ? 9 : 12,
                      color: colors.textMuted,
                    }}
                  >
                    {lang("animated.todayYield", "Today Yield")} :{" "}
                    {project?.project_data?.[0]?.day_energy || 0}Kwh ~{" "}
                    {project?.project_data?.[0]?.day_in_come || 0}K VND
                  </div>
                </div>
                <div
                  style={{
                    height: isSmallScreen ? 55 : 85,
                    width: isSmallScreen ? 55 : 85,
                    borderRadius: "50%",
                    border: "2px solid #FACC15",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: colors.cardBg,
                    flexShrink: 0,
                  }}
                >
                  <FiSun
                    style={{
                      fontSize: isSmallScreen ? 18 : 28,
                      color: "#FACC15",
                    }}
                  />
                  <div
                    style={{
                      fontSize: isSmallScreen ? 8 : 12,
                      color: "#666",
                      fontWeight: "bold",
                    }}
                  >
                    {project?.project_data?.[0]?.power || 0} kw
                  </div>
                </div>
              </div>

              {/* ================= BATTERY ================= */}
              {project?.project_data?.[0]?.epm_type !== 1 && batteryPercent > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: isSmallScreen ? 35 : 40,
                    top: isSmallScreen ? 238 : 390,
                    width: isSmallScreen ? 220 : 400,
                    padding: isSmallScreen ? 12 : 15,
                    borderRadius: 50,
                    // background: isDark ? "rgba(34, 197, 94, 0.1)" : "#DCFCE7",
                    background: isDark ? "rgba(34, 197, 94, 0.1)" : "#DBEAFE",
                    border: `1px solid ${
                      // isDark ? "rgba(34, 197, 94, 0.3)" : "#86EFAC"
                      isDark ? "rgba(34, 197, 94, 0.3)" : "#93C5FD"
                      }`,
                    display: "flex",
                    alignItems: "center",
                    gap: isSmallScreen ? 8 : 12,
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: isSmallScreen ? 40 : 55,
                      background: "#1372dfff",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: screenSize === "tablet" ? 10 : 14,
                        color: colors.text,
                      }}
                    >
                      {lang("animated.battery", "Battery")}
                    </div>
                    <div
                      style={{
                        fontSize: screenSize === "tablet" ? 9 : 12,
                        color: colors.textMuted,
                      }}
                    >
                      {lang("animated.daily_charge", "Daily Charge")} :{" "}
                      {project?.project_data?.[0]?.battery_charge_energy || 0}
                      Kwh
                    </div>
                    <div
                      style={{
                        fontSize: screenSize === "tablet" ? 9 : 12,
                        color: colors.textMuted,
                      }}
                    >
                      {lang("animated.today_discharged", "Today Discharged")} :{" "}
                      {project?.project_data?.[0]?.battery_discharge_energy ||
                        0}
                      Kwh
                    </div>
                  </div>
                  <div
                    style={{
                      height: isSmallScreen ? 55 : 85,
                      width: isSmallScreen ? 55 : 85,
                      borderRadius: "50%",
                      background: batteryBorder,
                      padding: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: "100%",
                        borderRadius: "50%",
                        background: colors.cardBg,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FiBattery
                          style={{
                            fontSize: isSmallScreen ? 24 : 38,
                            color: batteryFill,
                          }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            fontSize: isSmallScreen ? 6 : 10,
                            fontWeight: 700,
                            color: batteryFill,
                            marginRight: 4,
                          }}
                        >
                          {batteryPercent}%
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: isSmallScreen ? 8 : 12,
                          color: "#666",
                          fontWeight: "bold",
                        }}
                      >
                        {project?.project_data?.[0]?.battery_power || 0} kw
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= GRID ================= */}
              <div
                style={{
                  position: "absolute",
                  top: isSmallScreen ? 10 : 45,
                  width: isSmallScreen ? 220 : 400,
                  padding: isSmallScreen ? 12 : 15,
                  borderRadius: 50,
                  background: isDark ? "rgba(254, 202, 202, 0.1)" : "#FEF2F2",
                  border: `1px solid ${isDark ? "rgba(248, 113, 113, 0.3)" : "#FECACA"
                    }`,
                  display: "flex",
                  alignItems: "center",
                  gap: isSmallScreen ? 8 : 12,
                  left: isSmallScreen ? 431 : 615,
                  right: isSmallScreen ? "auto" : "auto",
                }}
              >
                <div
                  style={{
                    height: isSmallScreen ? 55 : 85,
                    width: isSmallScreen ? 55 : 85,
                    borderRadius: "50%",
                    border: "2px solid #F87171",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: colors.cardBg,
                    flexShrink: 0,
                  }}
                >
                  <FiZap
                    style={{
                      fontSize: isSmallScreen ? 16 : 24,
                      color: "#F87171",
                    }}
                  />
                  <div
                    style={{
                      fontSize: isSmallScreen ? 8 : 12,
                      color: "#666",
                      fontWeight: "bold",
                    }}
                  >
                    {Math.abs(project?.project_data?.[0]?.p_sum || 0)} kw
                  </div>
                </div>
                <div style={{ width: 4, height: 50, background: "#EF4444" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: isSmallScreen ? 10 : 14,
                      color: colors.text,
                    }}
                  >
                    {lang("animated.grid", "Grid")}
                  </div>
                  <div
                    style={{
                      fontSize: isSmallScreen ? 8 : 12,
                      color: colors.textMuted,
                    }}
                  >
                    {lang("animated.todayImported", "Today Imported")} :{" "}
                    {project?.project_data?.[0]?.grid_purchased_day_energy || 0}{" "}
                    kwh
                  </div>
                  <div
                    style={{
                      fontSize: isSmallScreen ? 8 : 12,
                      color: colors.textMuted,
                      display: isSmallScreen ? "none" : "block",
                    }}
                  >
                    {lang("animated.todayExported", "Today Exported")} : 0kWh
                  </div>
                </div>
              </div>

              {/* ================= INVERTER ================= */}
              <div
                style={{
                  position: "absolute",
                  left:
                    screenSize === "tablet"
                      ? 345
                      : screenSize === "laptop" || screenSize === "pc"
                        ? 530
                        : 530,
                  top:
                    screenSize === "tablet"
                      ? 125
                      : screenSize === "laptop" || screenSize === "pc"
                        ? 225
                        : 225,
                  transform: "translate(-50%)",
                  height:
                    screenSize === "tablet"
                      ? 55
                      : screenSize === "laptop" || screenSize === "pc"
                        ? 85
                        : 85,
                  width:
                    screenSize === "tablet"
                      ? 55
                      : screenSize === "laptop" || screenSize === "pc"
                        ? 85
                        : 85,
                  borderRadius: "50%",
                  border: "2px solid #FB923C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: colors.cardBg,
                }}
              >
                <FiActivity
                  style={{
                    fontSize: screenSize === "tablet" ? 18 : 28,
                    color: "#FB923C",
                  }}
                />
              </div>

              {/* ================= GRID LOAD ================= */}
              {project?.project_data?.[0]?.epm_type !== 1 && batteryPercent > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left:
                      screenSize === "tablet"
                        ? 432
                        : screenSize === "laptop" || screenSize === "pc"
                          ? 615
                          : 615,
                    top:
                      screenSize === "tablet"
                        ? 128
                        : screenSize === "laptop" || screenSize === "pc"
                          ? 220
                          : 220,
                    width:
                      screenSize === "tablet"
                        ? 220
                        : screenSize === "laptop" || screenSize === "pc"
                          ? 400
                          : 400,
                    padding: screenSize === "tablet" ? "12px" : 15,
                    borderRadius: 50,
                    background: isDark ? "rgba(59, 130, 246, 0.1)" : "#DCFCE7",
                    border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.3)" : "#86EFAC"
                      }`,
                    display: "flex",
                    alignItems: "center",
                    gap: screenSize === "tablet" ? 8 : 12,
                  }}
                >
                  <div
                    style={{
                      height: screenSize === "tablet" ? 55 : 85,
                      width: screenSize === "tablet" ? 55 : 85,
                      borderRadius: "50%",
                      border: "2px solid #8da094ff",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      background: colors.cardBg,
                      flexShrink: 0,
                    }}
                  >
                    <FiTrendingUp
                      style={{
                        fontSize: screenSize === "tablet" ? 16 : 24,
                        color: "#8da094ff",
                      }}
                    />
                    <div
                      style={{
                        fontSize: isSmallScreen ? 8 : 12,
                        color: "#666",
                        fontWeight: "bold",
                      }}
                    >
                      {project?.project_data?.[0]?.family_load_power || 0} kw
                    </div>
                  </div>
                  <div
                    style={{ width: 4, height: 35, background: "#8da094ff" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: screenSize === "tablet" ? 10 : 14,
                        color: colors.text,
                      }}
                    >
                      {lang("animated.grid_load", "Grid Load")}
                    </div>
                    <div
                      style={{
                        fontSize: screenSize === "tablet" ? 8 : 12,
                        color: colors.textMuted,
                      }}
                    >
                      {lang("animated.todayconsumed", "Today Consumed")} :{" "}
                      {project?.project_data?.[0]?.home_load_today_energy || 0}{" "}
                      Kwh
                    </div>
                  </div>
                </div>
              )}

              {/* ================= CONSUMED ================= */}
              <div
                style={{
                  position: "absolute",
                  left:
                    screenSize === "tablet"
                      ? 432
                      : screenSize === "laptop" || screenSize === "pc"
                        ? 615
                        : 615,
                  top:
                    screenSize === "tablet"
                      ? 238
                      : screenSize === "laptop" || screenSize === "pc"
                        ? 390
                        : 390,
                  width:
                    screenSize === "tablet"
                      ? 220
                      : screenSize === "laptop" || screenSize === "pc"
                        ? 400
                        : 400,
                  padding: screenSize === "tablet" ? "12px" : 15,
                  borderRadius: 50,
                  background: isDark ? "rgba(254, 215, 170, 0.1)" : "#FFF7ED",
                  border: `1px solid ${isDark ? "rgba(251, 146, 60, 0.3)" : "#FED7AA"
                    }`,
                  display: "flex",
                  alignItems: "center",
                  gap: screenSize === "tablet" ? 8 : 12,
                }}
              >
                <div
                  style={{
                    height: screenSize === "tablet" ? 55 : 85,
                    width: screenSize === "tablet" ? 55 : 85,
                    borderRadius: "50%",
                    border: "2px solid #FB923C",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: colors.cardBg,
                    flexShrink: 0,
                  }}
                >
                  <FiHome
                    style={{
                      fontSize: screenSize === "tablet" ? 16 : 24,
                      color: "#FB923C",
                    }}
                  />
                  <div
                    style={{
                      fontSize: isSmallScreen ? 8 : 12,
                      color: "#666",
                      fontWeight: "bold",
                    }}
                  >
                    {project?.project_data?.[0]?.epm_type !== 1
                      ? project?.project_data?.[0]?.generator_power || 0
                      : project?.project_data?.[0]?.family_load_power || 0}{" "}
                    kw
                  </div>
                </div>
                <div style={{ width: 4, height: 35, background: "#FB923C" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: screenSize === "tablet" ? 10 : 14,
                      color: colors.text,
                    }}
                  >
                    {project?.project_data?.[0]?.epm_type !== 1 && batteryPercent > 0
                      ? lang("animated.backupload")
                      : lang("animated.consumed", "Consumed")}
                  </div>
                  <div
                    style={{
                      fontSize: screenSize === "tablet" ? 8 : 12,
                      color: colors.textMuted,
                    }}
                  >
                    {lang("animated.todayconsumed", "Today Consumed")} :{" "}
                    {project?.project_data?.[0]?.epm_type !== 1
                      ? project?.project_data?.[0]?.generator_today_energy || 0
                      : project?.project_data?.[0]?.home_load_today_energy ||
                      0}{" "}
                    Kwh
                  </div>
                </div>
              </div>

              {/* ================= SVG LINES ================= */}
              <svg
                viewBox="0 0 1100 520"
                width="1100"
                height="520"
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                }}
              >
                <g
                  transform={
                    screenSize === "tablet"
                      ? "translate(-140, -55)"
                      : "translate(42, 0)"
                  }
                >
                  <path
                    id="pvPath"
                    d={
                      screenSize === "tablet"
                        ? "M 381 105 L 450 105 Q 470 105 470 125 L 470 186"
                        : "M 381 105 L 450 105 Q 470 105 470 125 L 470 230"
                    }
                    stroke="#FACC15"
                    strokeWidth="2"
                    fill="none"
                  />
                  {project?.project_data?.[0]?.power > 0 && (
                    <Arrow
                      path="#pvPath"
                      color="#FACC15"
                      scale={screenSize === "tablet" ? 0.85 : 1}
                    />
                  )}
                </g>

                <g
                  transform={
                    screenSize === "tablet"
                      ? "translate(-148, -54)"
                      : "translate(40, 0)"
                  }
                >
                  <path
                    id="gridPath"
                    d={
                      screenSize === "tablet"
                        ? "M 593 105 L 525 105 Q 505 105 505 125 L 505 183"
                        : "M 593 105 L 525 105 Q 505 105 505 125 L 505 228"
                    }
                    stroke="#EF4444"
                    strokeWidth="2"
                    fill="none"
                  />
                  {Math.abs(project?.project_data?.[0]?.p_sum) > 0 && (
                    <Arrow
                      path="#gridPath"
                      color="#EF4444"
                      scale={screenSize === "tablet" ? 0.85 : 1}
                    />
                  )}
                </g>

                <g
                  transform={
                    screenSize === "tablet"
                      ? "translate(-148, -98)"
                      : "translate(40, 70)"
                  }
                >
                  <path
                    id="consumePath"
                    d={
                      screenSize === "tablet"
                        ? "M 505 274 L 505 350 Q 505 380 535 380 L 594 380"
                        : "M 505 236 L 505 350 Q 505 380 535 380 L 592 380"
                    }
                    stroke="#FB923C"
                    strokeWidth="2"
                    fill="none"
                  />
                  {(project?.project_data?.[0]?.epm_type !== 1
                    ? project?.project_data?.[0]?.generator_power > 0
                    : project?.project_data?.[0]?.family_load_power > 0) && (
                      <Arrow
                        path="#consumePath"
                        color="#FB923C"
                        scale={screenSize === "tablet" ? 0.85 : 1}
                      />
                    )}
                </g>

                {project?.project_data?.[0]?.epm_type !== 1 && batteryPercent > 0 && (
                  <g
                    transform={
                      screenSize === "tablet"
                        ? "translate(-175, -98)"
                        : "translate(8, 70)"
                    }
                  >
                    <path
                      id="batteryPath"
                      d={
                        batteryDirection === 2
                          ? screenSize === "tablet"
                            ? "M 416 380 L 475 380 Q 505 380 505 350 L 505 272"
                            : "M 416 380 L 475 380 Q 505 380 505 350 L 505 236"
                          : screenSize === "tablet"
                            ? "M 505 272 L 505 350 Q 505 380 475 380 L 416 380"
                            : "M 505 236 L 505 350 Q 505 380 475 380 L 416 380"
                      }
                      stroke="#1372dfff"
                      strokeWidth="2"
                      fill="none"
                    />
                    {hasBatteryFlow && batteryFlowPower > 0 && (
                      <Arrow
                        path="#batteryPath"
                        color="#1372dfff"
                        scale={screenSize === "tablet" ? 0.85 : 1}
                      />
                    )}
                  </g>
                )}

                {project?.project_data?.[0]?.epm_type !== 1 && batteryPercent > 0 && (
                  <g
                    transform={
                      screenSize === "tablet"
                        ? "translate(-112, -54)"
                        : "translate(65, 0)"
                    }
                  >
                    <path
                      id="inverterToGridLoadPath"
                      d={
                        screenSize === "tablet"
                          ? "M 470 183 L 545 183 Q 565 183 565 203 L 565 205"
                          : "M 480 228 L 555 228 Q 575 228 575 248 L 575 254"
                      }
                      stroke="#8da094ff"
                      strokeWidth="2"
                      fill="none"
                    />
                    {project?.project_data?.[0]?.family_load_power &&
                      Math.abs(project?.project_data?.[0]?.family_load_power) >
                      0 && (
                        <Arrow
                          path="#inverterToGridLoadPath"
                          color="#8da094ff"
                          scale={screenSize === "tablet" ? 0.85 : 1}
                        />
                      )}
                  </g>
                )}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Inverter Section */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: "12px",
          boxShadow: isDark
            ? "0 0 20px rgba(14, 32, 56, 0.3)"
            : "0 1px 3px rgba(0,0,0,0.1)",
          border: `1px solid ${colors.borderLight}`,
          padding: screenSize === "tablet" ? "16px" : "24px",
          height:
            screenSize === "pc"
              ? "600px"
              : screenSize === "laptop"
                ? "auto"
                : screenSize === "tablet"
                  ? "auto"
                  : "auto",
          display: "flex",
          flexDirection: "column",
          minWidth: screenSize === "pc" ? "380px" : "auto",
          width: "100%",
          overflow: screenSize === "tablet" ? "auto" : "visible",
        }}
      >
        <h3
          style={{
            fontSize: screenSize === "tablet" ? "14px" : "18px",
            fontWeight: "bold",
            color: colors.text,
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "8px",
                height: "24px",
                backgroundColor: "#3b82f6",
                borderRadius: "9999px",
                marginRight: "12px",
              }}
            ></div>
            {lang("inverter.inverterdetails", "Inverter Details")}
          </div>
          <div
            style={{
              fontSize: screenSize === "tablet" ? "12px" : "14px",
              fontWeight: "600",
              color: "#3b82f6",
              backgroundColor: "#dbeafe",
              padding: "6px 12px",
              borderRadius: "9999px",
            }}
          >
            {activeInverters} / {totalInverters}
          </div>
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              screenSize === "tablet"
                ? "1fr 1fr"
                : screenSize === "pc"
                  ? "1fr"
                  : screenSize === "mobile"
                    ? "repeat(auto-fit, minmax(250px, 1fr))"
                    : "1fr",
            gap: "12px",
          }}
        >
          {displayInverters.length === 0 ? (
            <div
              style={{
                color: colors.textMuted,
                textAlign: "center",
                padding: "20px",
              }}
            >
              {lang("inverter.noinverterfound", "No inverters found")}
            </div>
          ) : (
            sortByNameAsc(displayInverters, displayInverters[0]?.inverter_name ? "inverter_name" : "name").map((inverter) => (
              <div
                key={inverter.id}
                style={{
                  padding: "10px 20px 10px 20px",
                  borderRadius: "10px",
                  background: isDark
                    ? "linear-gradient(to bottom right, #1a1f2e, #0f172a)"
                    : "linear-gradient(to bottom right, #f1f5f9, #e2e8f0)",
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = isDark
                    ? "0 4px 12px rgba(0,0,0,0.3)"
                    : "0 4px 12px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: screenSize === "tablet" ? "11px" : "14px",
                      fontWeight: "600",
                      color: colors.text,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      flex: 1,
                    }}
                  >
                    {inverter?.inverter_name || inverter?.name || "Untitled"}
                  </div>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "9999px",
                      backgroundColor:
                        inverter?.inverter?.status === 1 ||
                          inverter.status === 1
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        inverter?.inverter?.status === 1 || inverter?.status === 1
                          ? "#166534"        // green (Online)
                          : inverter?.status === 3
                            ? "#f97316"      // orange (Alarm)
                            : "#991b1b",
                      fontWeight: 600,
                      fontSize: screenSize === "tablet" ? "8px" : "10px",
                      whiteSpace: "nowrap",
                      marginLeft: "8px",
                    }}
                  >
                    {inverter?.status === 2 && ((inverter?.state_exception_flag ?? inverter?.raw?.state_exception_flag) === 1)
                      ? lang("common.abnormal_offline", "Abnormal Offline")
                      : inverter?.status === 1
                        ? lang("common.online", "Online")
                        : inverter?.status === 3
                          ? lang("common.alarm", "Alarm")
                          : lang("common.offline", "Offline")
                    }
                  </span>
                </div>

                <div
                  style={{
                    fontSize: screenSize === "tablet" ? "10px" : "12px",
                    color: colors.textMuted,
                  }}
                >
                  {lang("inverter.serial", "Serial")}:
                  <span
                    style={{
                      fontWeight: 600,
                      color: colors.text,
                      marginLeft: "4px",
                    }}
                  >
                    {inverter.inverter_serial_number ||
                      inverter.serial ||
                      "N/A"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
