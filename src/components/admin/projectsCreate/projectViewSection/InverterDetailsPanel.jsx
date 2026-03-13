"use client";
import React from "react";
import { sortByNameAsc } from "@/utils/common";

export default function InverterDetailsPanel({
  show = false,
  colors,
  screenSize = "pc",
  isDark = false,
  lang = (key, fallback) => fallback ?? key,
  inverters = [],
  activeInverters = 0,
  totalInverters = 0,
  onInverterClick,
}) {
  if (!show) return null;

  const sortedInverters = sortByNameAsc(
    inverters,
    inverters?.[0]?.inverter_name ? "inverter_name" : "name"
  );

  return (
    <div
      style={{
        backgroundColor: colors?.cardBg,
        borderRadius: "12px",
        boxShadow: isDark
          ? "0 0 20px rgba(14, 32, 56, 0.3)"
          : "0 1px 3px rgba(0,0,0,0.1)",
        border: `1px solid ${colors?.borderLight}`,
        padding: screenSize === "tablet" ? "16px" : "24px",
        height: screenSize === "pc" ? "600px" : "auto",
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
          color: colors?.text,
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
          />
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
        {sortedInverters.length === 0 ? (
          <div
            style={{
              color: colors?.textMuted,
              textAlign: "center",
              padding: "20px",
            }}
          >
            {lang("inverter.noinverterfound", "No inverters found")}
          </div>
        ) : (
          sortedInverters.map((inverter, idx) => (
            <div
              key={
                inverter?.id ??
                inverter?.inverter_serial_number ??
                inverter?.serial ??
                idx
              }
              style={{
                padding: "10px 20px 10px 20px",
                borderRadius: "10px",
                background: isDark
                  ? "linear-gradient(to bottom right, #1a1f2e, #0f172a)"
                  : "linear-gradient(to bottom right, #f1f5f9, #e2e8f0)",
                border: `1px solid ${colors?.border}`,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                cursor: onInverterClick ? "pointer" : "default",
              }}
              onClick={() => onInverterClick?.(inverter)}
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
                    color: colors?.text,
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
                      inverter?.inverter?.status === 1 || inverter?.status === 1
                        ? "#dcfce7"
                        : "#fee2e2",
                    color:
                      inverter?.inverter?.status === 1 || inverter?.status === 1
                        ? "#166534" // green (Online)
                        : inverter?.status === 3
                          ? "#f97316" // orange (Alarm)
                          : "#991b1b",
                    fontWeight: 600,
                    fontSize: screenSize === "tablet" ? "8px" : "10px",
                    whiteSpace: "nowrap",
                    marginLeft: "8px",
                  }}
                >
                  {inverter?.status === 2 &&
                  (inverter?.state_exception_flag ??
                    inverter?.raw?.state_exception_flag) === 1
                    ? lang("common.abnormal_offline", "Abnormal Offline")
                    : inverter?.status === 1
                      ? lang("common.online", "Online")
                      : inverter?.status === 3
                        ? lang("common.alarm", "Alarm")
                        : lang("common.offline", "Offline")}
                </span>
              </div>

              <div
                style={{
                  fontSize: screenSize === "tablet" ? "10px" : "12px",
                  color: colors?.textMuted,
                }}
              >
                {lang("inverter.serial", "Serial")}:
                <span
                  style={{
                    fontWeight: 600,
                    color: colors?.text,
                    marginLeft: "4px",
                  }}
                >
                  {inverter?.inverter_serial_number || inverter?.serial || "N/A"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


