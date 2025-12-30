"use client";
import React, { useEffect, useState } from "react";
import CardHeader from "@/components/shared/CardHeader";
import useCardTitleActions from "@/hooks/useCardTitleActions";
import CardLoader from "@/components/shared/CardLoader";
import { apiGet } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const AllReports = ({ title }) => {
  const {
    refreshKey,
    isRemoved,
    isExpanded,
  } = useCardTitleActions();
  const [reports, setReports] = useState([]);
  const { lang } = useLanguage();
  const { user } = useAuth();
  const cardTitle = title || lang('reports.allreports', 'All Reports');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allowedIds, setAllowedIds] = useState(null);

  // Load allowed project IDs for the logged-in investor
  useEffect(() => {
    if (!user?.id) return setAllowedIds([]);

    apiGet(`/api/investors?page=1&limit=50&userId=${user.id}`)
      .then((res) => {
        const ids = Array.isArray(res?.data)
          ? res.data
              .map((item) => Number(item?.project_id ?? item?.projects?.id))
              .filter(Boolean)
          : [];
        setAllowedIds(ids);
      })
      .catch(() => setAllowedIds([]));
  }, [user?.id]);

  // Fetch inverter reports and restrict to investor-allowed projects
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user?.id) {
          setReports([]);
          setLoading(false);
          return;
        }

        const res = await apiGet("/api/inverter-data?limit=50");
        const items = Array.isArray(res?.data) ? res.data : [];

        const allowed = Array.isArray(allowedIds) ? allowedIds : null;
        const filteredReports = items.filter((item) => {
          if (!allowed) return true; // if not loaded yet, show all
          const pid = Number(item.project_id ?? item.projects?.id);
          return allowed.includes(pid);
        });

        setReports(filteredReports.slice(0, 6));
      } catch (err) {
        setError("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [refreshKey, user?.id, allowedIds]);

  if (isRemoved) return null;

    const truncateText = (text, maxLength = 20) => {
    if (!text) return "N/A";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <div className="col-xxl-4">
      <div
        className={`card stretch shadow stretch-full ${
          isExpanded ? "card-expand" : ""
        } ${refreshKey ? "card-loading" : ""}`}
      >
        <CardHeader title={cardTitle} viewHref="/investor/reports/roi-reports" />
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