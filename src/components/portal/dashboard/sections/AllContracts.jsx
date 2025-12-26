"use client";
import React, { useEffect, useState } from "react";
import CardHeader from "@/components/shared/CardHeader";
import useCardTitleActions from "@/hooks/useCardTitleActions";
import CardLoader from "@/components/shared/CardLoader";
import { apiGet } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const AllContracts = ({ title }) => {
  const {
    refreshKey,
    isRemoved,
    isExpanded,
  } = useCardTitleActions();
  const [contracts, setContracts] = useState([]);
  const { lang } = useLanguage();
  const { user } = useAuth();
  const cardTitle = title || lang('reports.allcontracts', 'All Contracts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!user?.id) {
          setContracts([]);
          setLoading(false);
          return;
        }
        
        // Filter contracts by offtaker_id matching ContractsView logic
        const res = await apiGet(`/api/contracts?offtakerId=${user.id}&limit=6`);
        const list = res?.data || [];
        setContracts(list.slice(0, 6)); // Show first 6 contracts
      } catch (err) {
        setError("Failed to load contracts");
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [refreshKey, user?.id]);

  if (isRemoved) return null;

  const getStatusBadge = (status) => {
    let bgColor = "#f5f5f5";
    let borderColor = "#d5d5d5";
    let textColor = "#666666";
    let statusText = "Pending";

    if (status === 1) {
      bgColor = "#16a34a15";
      borderColor = "#16a34a30";
      textColor = "#15803d";
      statusText = "Approved";
    } else if (status === 2) {
      bgColor = "#dc262615";
      borderColor = "#dc262630";
      textColor = "#b91c1c";
      statusText = "Rejected";
    }

    return { bgColor, borderColor, textColor, statusText };
  };

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
        <CardHeader title={cardTitle} viewHref="/offtaker/contracts" />
        <div className="card-body custom-card-action p-0">
          {loading ? (
            <div className="p-4 text-center text-muted">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center text-danger">{error}</div>
          ) : contracts.length === 0 ? (
            <div className="p-4 text-center text-muted">No contracts found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <tbody>
                  {contracts.map(({ id, contract_title, projects, status, contract_date }) => {
                    const badge = getStatusBadge(status);
                    const formattedDate = contract_date
                      ? new Date(contract_date).toLocaleDateString()
                      : "N/A";

                    return (
                      <tr key={id} className="align-middle" style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td>
                          <div className="fw-semibold text-decoration-none" title={contract_title || "Unnamed"}>
                            {truncateText(contract_title || "Unnamed", 20)}
                          </div>
                          <div className="fs-12 text-muted" title={projects?.project_name || "N/A"}>
                            Project: {truncateText(projects?.project_name, 20)}
                          </div>
                          <div className="fs-12 text-muted">
                            Date: {formattedDate}
                          </div>
                        </td>
                        <td className="text-end">
                          <span
                            className="px-2 py-1 rounded-pill fw-semibold"
                            style={{
                              fontSize: "12px",
                              border: `1px solid ${badge.borderColor}`,
                              backgroundColor: badge.bgColor,
                              color: badge.textColor,
                            }}
                          >
                            {badge.statusText}
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

export default AllContracts;