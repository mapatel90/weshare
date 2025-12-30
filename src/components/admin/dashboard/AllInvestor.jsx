"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import CardHeader from "@/components/shared/CardHeader";
import useCardTitleActions from "@/hooks/useCardTitleActions";
import CardLoader from "@/components/shared/CardLoader";
import { apiGet } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

const AllInvestor = ({ title }) => {
  const {
    refreshKey,
    isRemoved,
    isExpanded,
    handleRefresh,
    handleExpand,
    handleDelete,
  } = useCardTitleActions();
  const [investors, setInvestors] = useState([]);
  const { lang } = useLanguage();
  const cardTitle = title || lang('reports.allinvestors', 'All Investors');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiGet("/api/investors?limit=6");
        const list = res?.data || [];
        setInvestors(list.slice(0, 6)); // Show first 6 investors
      } catch (err) {
        setError("Failed to load investors");
      } finally {
        setLoading(false);
      }
    };
    fetchInvestors();
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
        <CardHeader title={cardTitle} />
        <div className="card-body custom-card-action p-0">
          {loading ? (
            <div className="p-4 text-center text-muted">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center text-danger">{error}</div>
          ) : investors.length === 0 ? (
            <div className="p-4 text-center text-muted">No investors found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <tbody>
                  {investors.map(({ id, full_name, email, phone_number, projects, status }) => {
                    const isActive = status === 1;
                    return (
                      <tr key={id} className="align-middle" style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td>
                          <div className="fw-semibold text-decoration-none" title={full_name || "Unnamed"}>
                            {truncateText(full_name || "Unnamed", 20)}
                          </div>
                          <div className="fs-12 text-muted" title={email || "N/A"}>
                            Email: {truncateText(email, 25)}
                          </div>
                          <div className="fs-12 text-muted" title={projects?.project_name || "N/A"}>
                            Project: {truncateText(projects?.project_name, 20)}
                          </div>
                        </td>
                        <td className="text-end">
                          <span
                            className="px-2 py-1 rounded-pill fw-semibold"
                            style={{
                              fontSize: "12px",
                              border:
                                isActive
                                  ? "1px solid #16a34a30"
                                  : "1px solid #dc262630",
                              backgroundColor:
                                isActive ? "#16a34a15" : "#dc262615",
                              color: isActive ? "#15803d" : "#b91c1c",
                            }}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
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

export default AllInvestor;