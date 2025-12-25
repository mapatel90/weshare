"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import CardHeader from "@/components/shared/CardHeader";
import useCardTitleActions from "@/hooks/useCardTitleActions";
import CardLoader from "@/components/shared/CardLoader";
import { apiGet } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

const AllUsers = ({ title }) => {
  const {
    refreshKey,
    isRemoved,
    isExpanded,
    handleRefresh,
    handleExpand,
    handleDelete,
  } = useCardTitleActions();
  const [users, setUsers] = useState([]);
  const { lang } = useLanguage();
  const cardTitle = title || lang('reports.allusers', 'All Users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiGet("/api/users");
        const list = res?.data?.users || [];
        setUsers(list.slice(0, 6)); // Show first 6 users
      } catch (err) {
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [refreshKey]);

  if (isRemoved) return null;

  return (
    <div className="col-xxl-4">
      <div
        className={`card stretch stretch-full ${isExpanded ? "card-expand" : ""
          } ${refreshKey ? "card-loading" : ""}`}
      >
        <CardHeader title={cardTitle} viewHref="/admin/users/list" />
        <div className="card-body custom-card-action p-0">
          {loading ? (
            <div className="p-4 text-center text-muted">Loading...</div>
          ) : error ? (
            <div className="p-4 text-center text-danger">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-4 text-center text-muted">No users found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <tbody>
                  {users.map(({ id, full_name, email, status, role }) => {
                    const isActive = status === 1;
                    return (
                      <tr key={id} className="align-middle" style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td>
                          <div className="fw-semibold text-decoration-none">
                            {full_name || "Unnamed"}
                          </div>
                          <div className="fs-12 text-muted">
                            Email: {email || "N/A"}
                          </div>
                          <div className="fs-12 text-muted">
                            Role: {role.name || "N/A"}
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

export default AllUsers;
