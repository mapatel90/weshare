"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import CardHeader from "@/components/shared/CardHeader";
import useCardTitleActions from "@/hooks/useCardTitleActions";
import CardLoader from "@/components/shared/CardLoader";
import HorizontalProgress from "@/components/shared/HorizontalProgress";
import { apiGet } from "@/lib/api";

const AllProjects = ({ title = "All Projects" }) => {
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
        const res = await apiGet("/api/projects");
        // expect res.data.data.projects based on route
        const list = res?.data?.projects || [];
        setProjects(list);
      } catch (err) {
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [refreshKey]);

  if (isRemoved) return null;

  return (
    <div className="col-xxl-4">
      <div
        className={`card stretch stretch-full ${
          isExpanded ? "card-expand" : ""
        } ${refreshKey ? "card-loading" : ""}`}
      >
        <CardHeader title={title} viewHref="/admin/projects/list" />
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
                            href={`/admin/projects/view/${id}`}
                            className="fw-semibold text-decoration-none"
                          >
                            {project_name || "Untitled"}
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
