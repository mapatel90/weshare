"use client";
import React, { useState, useEffect } from "react";
import { FiSun, FiZap, FiActivity, FiHome } from "react-icons/fi";

export default function SolarEnergyFlow({ inverters = [] }) {
  // Get first 4 inverters (regardless of status)
  const displayInverters = inverters.slice(0, 4);

  // Calculate active inverters from displayed 4
  const activeInverters = displayInverters.filter(
    (inv) => inv?.inverter?.status === 1 || inv.status === "active"
  ).length;
  const totalInverters = displayInverters.length;

  // Responsive state
  const [screenSize, setScreenSize] = useState("pc"); // "mobile", "tablet", "laptop", "pc"

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
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const isSmallScreen = screenSize === "mobile" || screenSize === "tablet";

  /* ================= HELPERS ================= */

  const Circle = ({ icon, color, value }) => (
    <div
      style={{
        height: 85,
        width: 85,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        color,
      }}
    >
      {icon}
      <div style={{ fontSize: 11 }}>{value}</div>
    </div>
  );

  const Arrow = ({ path, color }) => (
    <path d="M-4,-8 L4,0 L-4,8 Z" fill={color}>
      <animateMotion dur="3s" repeatCount="indefinite" rotate="auto">
        <mpath href={path} />
      </animateMotion>
    </path>
  );

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
        // padding: screenSize === "mobile" ? "0 12px" : "0",
      }}
    >
      {/* Animated Section - Hide on Mobile */}
      {screenSize !== "mobile" && (
      <div
        style={{
          width: "100%",
          // height:
          //   screenSize === "mobile"
          //     ? "350px"
          //     : screenSize === "tablet"
          //     ? "400px"
          //     : screenSize === "laptop"
          //     ? "500px"
          //     : "500px",
          height: isSmallScreen ? 400 : 500,
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          // padding:
          //   screenSize === "mobile"
          //     ? "12px"
          //     : screenSize === "tablet"
          //     ? "16px"
          //     : "20px",
          padding: isSmallScreen ? 16 : 20,
          fontFamily: "Arial, sans-serif",
          overflow: screenSize === "mobile" ? "hidden" : "hidden",
          overflowX: screenSize === "mobile" ? "auto" : "hidden",
        }}
      >
        {/* Header */}
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
          Data Reporting Time : 18/12/2025 12:36:18 (UTC+07:00) 3Min Ago
        </div>

        <div
          style={{
            width: "100%",
            // minWidth: "1050px",
            // height:
            //   screenSize === "mobile"
            //     ? "300px"
            //     : screenSize === "tablet"
            //     ? "350px"
            //     : "410px",
            height: isSmallScreen ? 350 : 410,
            position: "relative",
            // margin: "0 auto",
          }}
        >
          {/* ================= PV ================= */}
          <div
            style={{
              position: "absolute",
              // left: screenSize === "tablet" ? "35px" : 5,
              // top: screenSize === "tablet" ? "10px" : 45,
              left: isSmallScreen ? 35 : 5,
              top: isSmallScreen ? 10 : 45,
              // width:
              //   screenSize === "tablet"
              //     ? 220
              //     : screenSize === "laptop" || screenSize === "pc"
              //     ? 400
              //     : 400,
              width: isSmallScreen ? 220 : 400,
              padding: isSmallScreen ? 12 : 15,
              borderRadius: 50,
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
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
                }}
              >
                PV
              </div>
              <div
                style={{
                  fontSize: screenSize === "tablet" ? 9 : 12,
                  color: "#6b7280",
                }}
              >
                Today Yield : 110.3kWh
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
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <FiSun
                style={{
                  fontSize: isSmallScreen ? 18 : 28,
                  color: "#FACC15",
                }}
              />
              <div style={{ fontSize: 8 }}>23.75kW</div>
            </div>
          </div>

          {/* ================= GRID ================= */}
          <div
            style={{
              position: "absolute",
              // right: 30,
              top: isSmallScreen ? 10 : 45,
              width: isSmallScreen ? 220 : 400,
              padding: isSmallScreen ? 12 : 15,
              borderRadius: 50,
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              display: "flex",
              alignItems: "center",
              gap: isSmallScreen ? 8 : 12,
              left: isSmallScreen ? 431 : 577,
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
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <FiZap
                style={{
                  fontSize: isSmallScreen ? 16 : 24,
                  color: "#F87171",
                }}
              />
              <div style={{ fontSize: 8 }}>1.2kW</div>
            </div>
            <div style={{ width: 4, height: 50, background: "#EF4444" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: isSmallScreen ? 10 : 14,
                }}
              >
                Grid
              </div>
              <div
                style={{
                  fontSize: isSmallScreen ? 8 : 12,
                  color: "#6b7280",
                }}
              >
                Today Imported : 164kWh
              </div>
              <div
                style={{
                  fontSize: isSmallScreen ? 8 : 12,
                  color: "#6b7280",
                  display: isSmallScreen ? "none" : "block",
                }}
              >
                Today Exported : 0kWh
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
                  ? 496
                  : 496,
              top:
                screenSize === "tablet"
                  ? 125
                  : screenSize === "laptop" || screenSize === "pc"
                  ? 181
                  : 181,
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
              background: "#fff",
            }}
          >
            <FiActivity
              style={{
                fontSize: screenSize === "tablet" ? 18 : 28,
                color: "#FB923C",
              }}
            />
          </div>

          {/* ================= CONSUMED ================= */}
          <div
            style={{
              position: "absolute",
              left:
                screenSize === "tablet"
                  ? 432
                  : screenSize === "laptop" || screenSize === "pc"
                  ? 577
                  : 577,
              top:
                screenSize === "tablet"
                  ? 238
                  : screenSize === "laptop" || screenSize === "pc"
                  ? 303
                  : 303,
              width:
                screenSize === "tablet"
                  ? 220
                  : screenSize === "laptop" || screenSize === "pc"
                  ? 400
                  : 400,
              padding: screenSize === "tablet" ? "12px" : 15,
              borderRadius: 50,
              background: "#FFF7ED",
              border: "1px solid #FED7AA",
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
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <FiHome
                style={{
                  fontSize: screenSize === "tablet" ? 16 : 24,
                  color: "#FB923C",
                }}
              />
              <div style={{ fontSize: 8 }}>22.12kW</div>
            </div>
            <div style={{ width: 4, height: 35, background: "#FB923C" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: screenSize === "tablet" ? 10 : 14,
                }}
              >
                Consumed
              </div>
              <div
                style={{
                  fontSize: screenSize === "tablet" ? 8 : 12,
                  color: "#6b7280",
                }}
              >
                Today Consumed : 274.3kWh
              </div>
            </div>
          </div>

          {/* ================= SVG LINES ================= */}
          <svg
            viewBox="0 0 1100 500"
            width="1100"
            height="500"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            <g transform={screenSize === "tablet" ? "translate(-140, -55)" : "translate(8, 0)"}>
              <path
                id="pvPath"
                d="M 381 105 L 450 105 Q 470 105 470 125 L 470 186"
                stroke="#FACC15"
                strokeWidth="2"
                fill="none"
              />
              <Arrow path="#pvPath" color="#FACC15" />
            </g>

            <g transform={screenSize === "tablet" ? "translate(-148, -54)" : ""}>
              <path
                id="gridPath"
                d="M 593 105 L 525 105 Q 505 105 505 125 L 505 182"
                stroke="#EF4444"
                strokeWidth="2"
                fill="none"
              />
              <Arrow path="#gridPath" color="#EF4444" />
            </g>

            <g transform={screenSize === "tablet" ? "translate(-148, -98)" : "translate(0, -10)"}>
              <path
                id="consumePath"
                d="M 505 274 L 505 350 Q 505 380 535 380 L 594 380"
                stroke="#FB923C"
                strokeWidth="2"
                fill="none"
              />
              <Arrow path="#consumePath" color="#FB923C" />
            </g>
          </svg>
        </div>
      </div>
      )}

      {/* Inverter Section */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #f3f4f6",
          padding: screenSize === "tablet" ? "16px" : "24px",
          height:
            screenSize === "pc"
              ? "500px"
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
            color: "#111827",
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
            Inverter Details
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
                color: "#6b7280",
                textAlign: "center",
                padding: "20px",
              }}
            >
              No inverters found
            </div>
          ) : (
            displayInverters.map((inverter) => (
              <div
                key={inverter.id}
                style={{
                  padding: "20px",
                  borderRadius: "10px",
                  background:
                    "linear-gradient(to bottom right, #f1f5f9, #e2e8f0)",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.08)";
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
                      fontSize: screenSize === "tablet" ? "12px" : "14px",
                      fontWeight: "600",
                      color: "#0f172a",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      flex: 1,
                    }}
                  >
                    {inverter?.inverter?.inverterName || "Untitled"}
                  </div>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "9999px",
                      backgroundColor:
                        inverter?.inverter?.status === 1 ||
                        inverter.status === "active"
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        inverter?.inverter?.status === 1 ||
                        inverter.status === "active"
                          ? "#166534"
                          : "#991b1b",
                      fontWeight: 600,
                      fontSize: screenSize === "tablet" ? "8px" : "10px",
                      whiteSpace: "nowrap",
                      marginLeft: "8px",
                    }}
                  >
                    {inverter?.inverter?.status === 1 ||
                    inverter.status === "active"
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: screenSize === "tablet" ? "10px" : "12px",
                    color: "#475569",
                  }}
                >
                  Serial:
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#1e293b",
                      marginLeft: "4px",
                    }}
                  >
                    {inverter.inverter_serial_number || "N/A"}
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
