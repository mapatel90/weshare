"use client";
import React, { useEffect, useState } from "react";
import CardHeader from "@/components/shared/CardHeader";
import useCardTitleActions from "@/hooks/useCardTitleActions";
import CardLoader from "@/components/shared/CardLoader";
import { apiGet } from "@/lib/api";

const AllReports = ({ title = "All Reports" }) => {
  const {
    refreshKey,
    isRemoved,
    isExpanded,
  } = useCardTitleActions();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiGet("/api/inverter-data?limit=6");
        const list = res?.data || [];
        setReports(list.slice(0, 6)); // Show first 6 reports
      } catch (err) {
        setError("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [refreshKey]);

  if (isRemoved) return null;

    const truncateText = (text, maxLength = 20) => {
    if (!text) return "N/A";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <div className="col-xxl-4">
      <div
        className={`card stretch stretch-full ${
          isExpanded ? "card-expand" : ""
        } ${refreshKey ? "card-loading" : ""}`}
      >
        <CardHeader title={title} viewHref="/admin/reports/saving" />
        <div className="card-body custom-card-action p-0">
          {loading ? (
            <div className="p-4 text-center text-muted">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center text-danger">{error}</div>
          ) : reports.length === 0 ? (
            <div className="p-4 text-center text-muted">No reports found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <tbody>
                  {reports.map(({ id, projects, project_inverters, date, daily_yield, total_yield }) => {
                    return (
                      <tr key={id} className="align-middle" style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td>
                          <div className="fw-semibold text-decoration-none">
                            {truncateText(projects?.project_name || "Unnamed", 20)}
                          </div>
                          <div className="fs-12 text-muted">
                            Inverter: {project_inverters?.inverter_name || "N/A"}
                          </div>
                          <div className="fs-12 text-muted">
                            Date: {new Date(date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="text-end">
                          <div className="fs-12 fw-semibold">
                            Daily: {daily_yield?.toFixed(2) || "0.00"} kW
                          </div>
                          <div className="fs-12 text-muted">
                            Total: {total_yield?.toFixed(2) || "0.00"} kW
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <CardLoader refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default AllReports;