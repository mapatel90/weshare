import { useLanguage } from "@/contexts/LanguageContext";
import React from "react";

const MeterInfo = ({
  project = {},
  contracts = [],
  contractsLoading = false,
  inverters = [],
  isDark = false,
}) => {
  const colors = {
    cardBg: isDark ? '#121a2d' : '#fff',
    text: isDark ? '#ffffff' : '#111827',
    textMuted: isDark ? '#b1b4c0' : '#6b7280',
    border: isDark ? '#1b2436' : '#f3f4f6',
    boxShadow: isDark ? '0 0 20px rgba(14, 32, 56, 0.3)' : '0px 2px 6px rgba(0,0,0,0.06)',
    gradient1: isDark ? 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.15), rgba(168, 85, 247, 0.15))' : 'linear-gradient(to bottom right, #eef2ff, #e9d5ff)',
    gradient2: isDark ? 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.15), rgba(167, 243, 208, 0.15))' : 'linear-gradient(to bottom right, #d1fae5, #a7f3d0)',
    gradient3: isDark ? 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.15), rgba(191, 219, 254, 0.15))' : 'linear-gradient(to bottom right, #dbeafe, #bfdbfe)',
    gradient4: isDark ? 'linear-gradient(to bottom right, rgba(239, 68, 68, 0.15), rgba(254, 202, 202, 0.15))' : 'linear-gradient(to bottom right, #fee2e2, #fecaca)',
    gradient5: isDark ? 'linear-gradient(to bottom right, rgba(241, 245, 249, 0.1), rgba(226, 232, 240, 0.1))' : 'linear-gradient(to bottom right, #f1f5f9, #e2e8f0)',
    gradient6: isDark ? 'rgba(27, 36, 54, 0.5)' : '#f8fafc',
    statusActiveBg: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7',
    statusActiveText: isDark ? '#22c55e' : '#166534',
    statusInactiveBg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
    statusInactiveText: isDark ? '#ef4444' : '#991b1b',
    statusPendingBg: isDark ? 'rgba(156, 163, 175, 0.2)' : '#f3f4f6',
    statusPendingText: isDark ? '#9ca3af' : '#6b7280',
    linkColor: isDark ? '#60a5fa' : '#2563eb',
    badgeBg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
    badgeText: isDark ? '#60a5fa' : '#3b82f6',
  }
  const { lang } = useLanguage()

  // Calculate active inverters (you can modify the condition based on your needs)
  // console.log("inverters:", inverters)
  const activeInverters = inverters.filter((inv, index) => {
    // console.log(`Inverter: ${index} status:`, inv?.status);
    return inv?.status === 1;
  }).length;

  const totalInverters = inverters.length;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        gap: "24px",
        marginBottom: "24px",
      }}
    >
      {/* -------------------- METER INFORMATION -------------------- */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: "12px",
          boxShadow: colors.boxShadow,
          border: `1px solid ${colors.border}`,
          padding: "24px",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: colors.text,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "24px",
              backgroundColor: "#10b981",
              borderRadius: "9999px",
              marginRight: "12px",
            }}
          />
          {lang('meter.meterInformation', 'Meter Information')}
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Meter Link */}
          <div
            style={{
              padding: "16px",
              background: colors.gradient1,
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: colors.textMuted,
                marginBottom: "4px",
              }}
            >
              {lang('meter.meterUrl', 'Meter Url')}
            </p>

            {project.meter_url ? (
              <a
                href={project.meter_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color: colors.linkColor,
                  textDecoration: "underline",
                  wordBreak: "break-all",
                }}
              >
                {project.meter_url}
              </a>
            ) : (
              <span style={{ fontSize: "15px", color: colors.textMuted }}>-</span>
            )}
          </div>


          {/* SIM Number */}
          <div
            style={{
              padding: "16px",
              background: colors.gradient2,
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: colors.textMuted,
                marginBottom: "4px",
              }}
            >
              {lang('meter.simNumber', 'SIM Number')}
            </p>
            <p
              style={{ fontSize: "15px", fontWeight: "600", color: colors.text }}
            >
              {project.sim_number || "-"}
            </p>
          </div>

          {/* SIM Start Date */}
          <div
            style={{
              padding: "16px",
              background: colors.gradient3,
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: colors.textMuted,
                marginBottom: "4px",
              }}
            >
              {lang('meter.simStartDate', 'SIM Start Date')}
            </p>
            <p
              style={{ fontSize: "15px", fontWeight: "600", color: colors.text }}
            >
              {project.sim_start_date
                ? new Date(project.sim_start_date).toLocaleDateString()
                : "-"}
            </p>
          </div>

          {/* SIM Expire Date */}
          <div
            style={{
              padding: "16px",
              background: colors.gradient4,
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: colors.textMuted,
                marginBottom: "4px",
              }}
            >
              {lang('meter.simExpireDate', 'SIM Expire Date')}
            </p>
            <p
              style={{ fontSize: "15px", fontWeight: "600", color: colors.text }}
            >
              {project.sim_expire_date
                ? new Date(project.sim_expire_date).toLocaleDateString()
                : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* -------------------- INVERTERS -------------------- */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: "12px",
          boxShadow: colors.boxShadow,
          border: `1px solid ${colors.border}`,
          padding: "24px",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
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
            {lang('inverter.inverterdetails', 'Inverter Details')}
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: colors.badgeText,
              backgroundColor: colors.badgeBg,
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
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {inverters.length === 0 ? (
            <div
              style={{
                color: colors.textMuted,
                gridColumn: "1 / -1",
              }}
            >
              No inverters found for this project.
            </div>
          ) : (
            inverters.map((inverter) => (
              <div
                key={inverter.id}
                style={{
                  padding: "16px",
                  borderRadius: "10px",
                  background: colors.gradient5,
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    isDark ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.08)";
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
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: colors.text,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      flex: 1,
                    }}
                  >
                    {inverter?.inverter_name || "Untitled"}
                  </div>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      backgroundColor:
                        inverter?.status === 1 ||
                          inverter.status === "active"
                          ? colors.statusActiveBg
                          : colors.statusInactiveBg,
                      color:
                        inverter?.status === 1 ||
                          inverter.status === "active"
                          ? colors.statusActiveText
                          : colors.statusInactiveText,
                      fontWeight: 600,
                      fontSize: "11px",
                      whiteSpace: "nowrap",
                      marginLeft: "8px",
                    }}
                  >
                    {inverter?.status === 1 ||
                      inverter.status === "active"
                      ? "Online"
                      : "Offline"}
                  </span>
                </div>

                <div style={{ fontSize: "13px", color: colors.textMuted }}>
                  {lang('inverter.serialNumber', 'Serial Number')}
                  <span style={{ fontWeight: 600, color: colors.text }}>
                    {" "}
                    {inverter.inverter_serial_number || "N/A"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* -------------------- CONTRACTS -------------------- */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderRadius: "12px",
          boxShadow: colors.boxShadow,
          border: `1px solid ${colors.border}`,
          padding: "24px",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: colors.text,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "24px",
              backgroundColor: "#f59e0b",
              borderRadius: "9999px",
              marginRight: "12px",
            }}
          />
          {lang('contract.contract', 'contract')}
        </h3>

        {contractsLoading ? (
          <p style={{ color: colors.textMuted }}>Loading contracts...</p>
        ) : contracts.length === 0 ? (
          <p style={{ color: colors.textMuted }}>{lang('contract.no_contracts_found', 'No contracts found')}.</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {contracts.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  background: colors.gradient6,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: colors.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: "6px",
                    }}
                  >
                    {c.contractTitle || "Untitled"}
                  </div>

                  <div style={{ fontSize: "12px", color: colors.textMuted }}>
                    {c.offtaker?.fullName
                      ? `Offtaker: ${c.offtaker.fullName}`
                      : ""}
                    {c.investor?.fullName
                      ? ` ${c.offtaker ? "·" : ""} Investor: ${c.investor.fullName
                      }`
                      : ""}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: colors.textMuted,
                      marginTop: "6px",
                    }}
                  >
                    {c.contractDate
                      ? new Date(c.contractDate).toLocaleDateString()
                      : "-"}
                  </div>
                </div>

                <div
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  {c.documentUpload ? (
                    <a
                      href={
                        c.documentUpload.startsWith("/")
                          ? c.documentUpload
                          : `/${c.documentUpload}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: "13px",
                        color: colors.linkColor,
                        textDecoration: "none",
                      }}
                    >
                      View
                    </a>
                  ) : (
                    <span style={{ fontSize: "13px", color: colors.textMuted }}>
                      No file
                    </span>
                  )}

                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: "9999px",
                      backgroundColor:
                        c.status === 1
                          ? colors.statusActiveBg
                          : c.status === 2
                            ? colors.statusInactiveBg
                            : colors.statusPendingBg,
                      color:
                        c.status === 1
                          ? colors.statusActiveText
                          : c.status === 2
                            ? colors.statusInactiveText
                            : colors.statusPendingText,
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    {c.status === 1
                      ? "Active"
                      : c.status === 2
                        ? "Rejected"
                        : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeterInfo;
