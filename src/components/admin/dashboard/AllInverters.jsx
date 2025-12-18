"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import CardHeader from "@/components/shared/CardHeader";
import useCardTitleActions from "@/hooks/useCardTitleActions";
import CardLoader from "@/components/shared/CardLoader";
import { apiGet } from "@/lib/api";
import { clippingParents } from "@popperjs/core";

const AllInverters = ({ title = "All Inverters" }) => {
  const {
    refreshKey,
    isRemoved,
    isExpanded,
    handleRefresh,
    handleExpand,
    handleDelete,
  } = useCardTitleActions();
  const [inverters, setInverters] = useState([]);
console.log("inverters::",inverters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInverters = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiGet("/api/inverters?limit=6");
        const list = res?.data?.inverters || [];
        setInverters(list.slice(0, 6)); // Show first 6 inverters
      } catch (err) {
        setError("Failed to load inverters");
      } finally {
        setLoading(false);
      }
    };
    fetchInverters();
  }, [refreshKey]);

  if (isRemoved) return null;

  return (
    <div className="col-xxl-4">
      <div
        className={`card stretch stretch-full ${
          isExpanded ? "card-expand" : ""
        } ${refreshKey ? "card-loading" : ""}`}
      >
        <CardHeader title={title} viewHref="/admin/inverter/list" />
        <div className="card-body custom-card-action p-0">
          {loading ? (
            <div className="p-4 text-center text-muted">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center text-danger">{error}</div>
          ) : inverters.length === 0 ? (
            <div className="p-4 text-center text-muted">No inverters found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <tbody>
                  {inverters.map(({ id, companyName, inverterName, inverter_type_id, status }) => {
                    return (
                      <tr key={id} className="align-middle" style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td>
                          <div className="fw-semibold text-decoration-none">
                            {inverterName || "Unnamed"}
                          </div>
                          <div className="fs-12 text-muted">
                           Company: {companyName || "N/A"}
                          </div>
                            <div className="fs-12 text-muted">
                            Inverter Type: {inverter_type_id || "N/A"}
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
                            {status === 1 ? "online" : "Offline"}
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

export default AllInverters;