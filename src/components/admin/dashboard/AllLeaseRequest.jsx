"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import CardHeader from "@/components/shared/CardHeader";
import useCardTitleActions from "@/hooks/useCardTitleActions";
import CardLoader from "@/components/shared/CardLoader";
import { apiGet } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

const AllLeaseRequest = ({ title }) => {
  const {
    refreshKey,
    isRemoved,
    isExpanded,
    handleRefresh,
    handleExpand,
    handleDelete,
  } = useCardTitleActions();
  const [leaseRequests, setLeaseRequests] = useState([]);
  const { lang } = useLanguage();
  const cardTitle = title || lang('reports.all_lease_requests', 'All Lease Requests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaseRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiGet("/api/lease");
        const list = res?.data || [];
        setLeaseRequests(list.slice(0, 6)); // Show first 6 lease requests
      } catch (err) {
        setError("Failed to load lease requests");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaseRequests();
  }, [refreshKey]);

  if (isRemoved) return null;

  return (
    <div className="col-xxl-4">
      <div
        className={`card stretch stretch-full ${isExpanded ? "card-expand" : ""
          } ${refreshKey ? "card-loading" : ""}`}
      >
        <CardHeader title={cardTitle} viewHref="/admin/lease-request/list" />
        <div className="card-body custom-card-action p-0">
          {loading ? (
            <div className="p-4 text-center text-muted">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center text-danger">{error}</div>
          ) : leaseRequests.length === 0 ? (
            <div className="p-4 text-center text-muted">No lease requests found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <tbody>
                  {leaseRequests.map(({ id, fullName, email, phoneNumber, subject, status }) => {
                    const isActive = status === 1;
                    return (
                      <tr key={id} className="align-middle" style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td>
                          <div className="fw-semibold text-decoration-none">
                            {fullName || "Unnamed"}
                          </div>
                          <div className="fs-12 text-muted">
                            Email: {email || "N/A"}
                          </div>
                          <div className="fs-12 text-muted">
                            Subject: {subject || "N/A"}
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

export default AllLeaseRequest;