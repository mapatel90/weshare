"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import CardHeader from "@/components/shared/CardHeader";
import useCardTitleActions from "@/hooks/useCardTitleActions";
import CardLoader from "@/components/shared/CardLoader";
import { apiGet } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const AllProjects = ({ title }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const cardTitle = title || lang('reports.allprojects', 'All Projects');
  const {
    refreshKey,
    isRemoved,
    isExpanded,
  } = useCardTitleActions();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        // Show all projects for the logged-in investor
        if (!user?.id) {
          setProjects([]);
          return;
        }
        const res = await apiGet(`/api/investors?page=1&limit=6&userId=${user.id}`);
        const list = Array.isArray(res?.data) ? res.data : [];
        // Normalize API shape to match table expectations
        const normalized = list.map((item) => ({
          id: item?.projects?.id ?? item?.project_id ?? item?.id,
          project_name: item?.projects?.project_name ?? "Untitled",
          status: item?.projects?.status ?? item?.status ?? 0,
          product_code: item?.projects?.product_code ?? "-",
          lease_term: item?.projects?.lease_term ?? "N/A",
        }));
        setProjects(normalized.slice(0, 6)); // Show first 6 projects
      } catch (err) {
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [refreshKey, user?.id]);

  if (isRemoved) return null;

  const truncateText = (text, maxLength = 20) => {
    if (!text) return "N/A";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <div className="col-xxl-6">
      <div
        className={`card stretch shadow stretch-full ${isExpanded ? "card-expand" : ""} ${refreshKey ? "card-loading" : ""}`}
      >
        <CardHeader title={cardTitle} viewHref="/investor/projects" />
        <div className="card-body custom-card-action p-0">
          {loading ? (
            <div className="p-4 text-center text-muted">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center text-danger">{error}</div>
          ) : projects.length === 0 ? (
            <div className="p-4 text-center text-muted">No projects found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <tbody>
                  {projects.map(
                    ({ id, project_name, status, product_code, lease_term }) => (
                      <tr key={id} className="align-middle" style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td>
                          <Link
                            href={`/admin/projects/details/${id}`}
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
                              border:
                                status === 1
                                  ? "1px solid #16a34a30"
                                  : "1px solid #dc262630",
                              backgroundColor:
                                status === 1 ? "#16a34a15" : "#dc262615",
                              color: status === 1 ? "#15803d" : "#b91c1c",
                            }}
                          >
                            {status === 1 ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    )
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
