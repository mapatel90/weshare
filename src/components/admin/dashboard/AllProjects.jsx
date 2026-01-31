"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import CardHeader from "@/components/shared/CardHeader";
import useCardTitleActions from "@/hooks/useCardTitleActions";
import CardLoader from "@/components/shared/CardLoader";
import { apiGet } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

const AllProjects = ({ title }) => {
  const { lang } = useLanguage();
  const cardTitle = title || lang('reports.allprojects', 'All Projects');
  const {
    refreshKey,
    isRemoved,
    isExpanded,
    handleRefresh,
    handleExpand,
    handleDelete,
  } = useCardTitleActions();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiGet("/api/projects?limit=5&page=1");
        console.log('Fetched projects:', res);
        const list = Array.isArray(res?.data) ? res.data : [];
        setProjects(list.slice(0, 5)); // Show first 5 projects
      } catch (err) {
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [refreshKey]);

  if (isRemoved) return null;

  const truncateText = (text, maxLength = 20) => {
    if (!text) return "N/A";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <div className="col-xxl-6">
      <div
        className={`card stretch stretch-full ${isExpanded ? "card-expand" : ""} ${refreshKey ? "card-loading" : ""}`}
      >
        <CardHeader title={cardTitle} viewHref="/admin/projects/list" />
        <div className="card-body custom-card-action p-0">
          {loading ? (
            <div className="p-4 text-center text-muted">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center text-danger">{error}</div>
          ) : projects.length === 0 ? (
            <div className="p-4 text-center text-muted">{lang("projects.noProjects", "No projects available.")}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <tbody>
                  {projects.map(
                    ({ id, project_name, product_code, lease_term, project_data }) => {
                      const solisRaw = project_data && project_data.length > 0 ? project_data[0].project_solis_status : null;
                      const solisStatus = typeof solisRaw === 'string' ? parseInt(solisRaw, 10) : solisRaw;

                      let solisLabel = lang("common.notAvailable", "N/A");
                      let border = "1px solid #9ca3af30";
                      let backgroundColor = "#9ca3af15";
                      let color = "#374151";

                      if (solisStatus === 1) {
                        solisLabel = lang("common.online", "Online");
                        border = "1px solid #16a34a30";
                        backgroundColor = "#16a34a15";
                        color = "#15803d";
                      } else if (solisStatus === 2) {
                        solisLabel = lang("common.offline", "Offline");
                        border = "1px solid #dc262630";
                        backgroundColor = "#dc262615";
                        color = "#b91c1c";
                      } else if (solisStatus === 3) {
                        solisLabel = lang("common.alarm", "Alarm");
                        border = "1px solid #d9770630";
                        backgroundColor = "#f59e0b15";
                        color = "#b45309";
                      }

                      return (
                        <tr key={id} className="align-middle" style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td>
                            <Link
                              href={`/admin/projects/view/${id}`}
                              className="fw-semibold text-decoration-none"
                              title={project_name || "Untitled"}
                            >
                              {truncateText(project_name || "Untitled", 20)}
                            </Link>
                            <div className="fs-12 text-muted">
                              Code: {product_code || "N/A"}
                            </div>
                            <div className="fs-12 text-muted">
                              Lease Term: {lease_term || "N/A"}
                            </div>
                          </td>
                          <td className="text-end">
                            <span
                              className="px-2 py-1 rounded-pill fw-semibold"
                              style={{
                                fontSize: "12px",
                                border,
                                backgroundColor,
                                color,
                              }}
                            >
                              {solisLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
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

export default AllProjects;
