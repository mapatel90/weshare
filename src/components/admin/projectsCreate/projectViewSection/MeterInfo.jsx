import React from "react";

const MeterInfo = ({
  project = {},
  contracts = [],
  contractsLoading = false,
  inverters = [],
}) => {

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
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0px 2px 6px rgba(0,0,0,0.06)",
          border: "1px solid #f3f4f6",
          padding: "24px",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#111827",
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
          Meter Information
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
              background: "linear-gradient(to bottom right, #eef2ff, #e9d5ff)",
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              Meter Link
            </p>

            {project.meter_url ? (
              <a
                href={project.meter_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color: "#2563eb",
                  textDecoration: "underline",
                  wordBreak: "break-all",
                }}
              >
                {project.meter_url}
              </a>
            ) : (
              <span style={{ fontSize: "15px", color: "#9ca3af" }}>-</span>
            )}
          </div>


          {/* SIM Number */}
          <div
            style={{
              padding: "16px",
              background: "linear-gradient(to bottom right, #d1fae5, #a7f3d0)",
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              SIM Number
            </p>
            <p
              style={{ fontSize: "15px", fontWeight: "600", color: "#111827" }}
            >
              {project.sim_number || "-"}
            </p>
          </div>

          {/* SIM Start Date */}
          <div
            style={{
              padding: "16px",
              background: "linear-gradient(to bottom right, #dbeafe, #bfdbfe)",
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              SIM Start Date
            </p>
            <p
              style={{ fontSize: "15px", fontWeight: "600", color: "#111827" }}
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
              background: "linear-gradient(to bottom right, #fee2e2, #fecaca)",
              borderRadius: "10px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              SIM Expire Date
            </p>
            <p
              style={{ fontSize: "15px", fontWeight: "600", color: "#111827" }}
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
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          border: "1px solid #f3f4f6",
          padding: "24px",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
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
              fontSize: "14px",
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
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {inverters.length === 0 ? (
            <div
              style={{
                color: "#6b7280",
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
                  background:
                    "linear-gradient(to bottom right, #f1f5f9, #e2e8f0)",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
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
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#0f172a",
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
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        inverter?.status === 1 ||
                          inverter.status === "active"
                          ? "#166534"
                          : "#991b1b",
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

                <div style={{ fontSize: "13px", color: "#475569" }}>
                  Serial Number:
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>
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
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0px 2px 6px rgba(0,0,0,0.06)",
          border: "1px solid #f3f4f6",
          padding: "24px",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#111827",
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
          Contracts
        </h3>

        {contractsLoading ? (
          <p style={{ color: "#6b7280" }}>Loading contracts...</p>
        ) : contracts.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No contracts found.</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {contracts.map((c) => (
              <div
                key={c.id}
                style={{
                  padding: "14px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: "#111827",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: "6px",
                    }}
                  >
                    {c.contractTitle || "Untitled"}
                  </div>

                  <div style={{ fontSize: "12px", color: "#6b7280" }}>
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
                      color: "#6b7280",
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
                        color: "#2563eb",
                        textDecoration: "none",
                      }}
                    >
                      View
                    </a>
                  ) : (
                    <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                      No file
                    </span>
                  )}

                  <span
                    style={{
                      padding: "6px 10px",
                      borderRadius: "9999px",
                      backgroundColor:
                        c.status === 1
                          ? "#dcfce7"
                          : c.status === 2
                            ? "#fee2e2"
                            : "#f3f4f6",
                      color:
                        c.status === 1
                          ? "#166534"
                          : c.status === 2
                            ? "#991b1b"
                            : "#6b7280",
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
