"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { usePriceWithCurrency } from "@/hooks/usePriceWithCurrency";

const statusColors = {
  Paid: "bg-green-100 text-green-700",
  Unfunded: "bg-orange-100 text-orange-700",
  Pending: "bg-gray-200 text-gray-700",
  Draft: "bg-gray-200 text-gray-700",
  Unpaid: "bg-orange-100 text-orange-700",
  PaidNumeric: "bg-green-100 text-green-700",
};

const Billings = () => {
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState("");
  const [dropdownProjects, setDropdownProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const { user } = useAuth();
  const router = useRouter();
  const priceWithCurrency = usePriceWithCurrency();

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB");
  };

  const formatCurrency = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return value ?? "—";
    return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  const statusLabel = (value) => {
    if (typeof value === "string") return value;
    const map = {
      0: "Unpaid",
      1: "Paid",
    };
    return map[value] ?? "Pending";
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!user?.id) {
        setInvoices([]);
        return;
      }

      setInvoicesLoading(true);
      setInvoicesError("");

      try {
        const params = new URLSearchParams({
          page: String(pageIndex + 1),
          limit: String(pageSize),
        });

        if (user.role === 3) {
          params.append("offtaker_id", String(user.id));
        }

        if (search && search.trim()) {
          params.append("search", search.trim());
        }

        if (statusFilter !== "") {
          params.append("status", statusFilter);
        }

        if (projectFilter) {
          params.append("project_id", projectFilter);
        }

        const response = await apiGet(`/api/invoice?${params.toString()}`, {
          includeAuth: true,
        });

        const list = response?.data;

        if (response?.success && Array.isArray(list)) {
          const normalized = list.map((inv, idx) => {
            return {
              id: inv?.id ?? idx,
              projectId: inv?.projects?.id ?? null,
              projectName: inv?.projects?.project_name || "—",
              invoiceName: inv?.invoice_number
                ? `${inv?.invoice_prefix || ""}-${inv.invoice_number}`.trim()
                : "—",
              invoiceDate: formatDate(inv?.invoice_date),
              dueDate: formatDate(inv?.due_date),
              amount: inv?.total_amount ?? inv?.amount ?? 0,
              status: statusLabel(inv?.status),
              download: true,
            };
          });

          setInvoices(normalized);

          const apiPagination = response.pagination || {};
          setPagination({
            page: apiPagination.page || 1,
            limit: apiPagination.limit || pageSize,
            total: apiPagination.total || 0,
            pages: apiPagination.pages || 0,
          });

          const maxPageIndex = Math.max(0, (apiPagination.pages || 1) - 1);
          if (pageIndex > maxPageIndex) {
            setPageIndex(maxPageIndex);
          }
        } else {
          setInvoices([]);
        }
      } catch (error) {
        console.error("Failed to fetch invoices", error);
        setInvoices([]);
        setInvoicesError("Unable to load invoices.");
      } finally {
        setInvoicesLoading(false);
      }
    };

    fetchInvoices();
  }, [
    user?.id,
    user?.role,
    search,
    statusFilter,
    projectFilter,
    pageIndex,
    pageSize,
  ]);

  // Fetch stable projects list for dropdown independent of filters
  useEffect(() => {
    const fetchDropdownProjects = async () => {
      if (!user?.id) {
        setDropdownProjects([]);
        return;
      }

      setProjectsLoading(true);
      setProjectsError("");
      try {
        const params = new URLSearchParams({ page: "1", limit: "1000" });
        if (user.role === 3) {
          params.append("offtaker_id", String(user.id));
        }

        const response = await apiGet(`/api/invoice?${params.toString()}`, {
          includeAuth: true,
        });

        const list = response?.data;
        if (response?.success && Array.isArray(list)) {
          const map = new Map();
          list.forEach((inv) => {
            const pid = inv?.projects?.id;
            const pname = inv?.projects?.project_name;
            if (pid && pname) {
              map.set(pid, pname);
            }
          });

          const projectsArr = Array.from(map.entries()).map(([id, name]) => ({
            id,
            name,
          }));
          setDropdownProjects(projectsArr);
        } else {
          setDropdownProjects([]);
        }
      } catch (err) {
        console.error("Failed to fetch dropdown projects", err);
        setProjectsError("Unable to load projects.");
        setDropdownProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchDropdownProjects();
  }, [user?.id, user?.role]);

  const handleSearchChange = (value) => {
    setPageIndex(0);
    setSearch(value);
  };

  const handleStatusFilterChange = (value) => {
    setPageIndex(0);
    setStatusFilter(value);
  };

  const handleProjectFilterChange = (value) => {
    setPageIndex(0);
    setProjectFilter(value);
  };

  const handlePageChange = (newPageIndex) => {
    setPageIndex(newPageIndex);
  };

  const filteredInvoices = invoices;

  const handleDownload = (number) => {
    // Example: window.open(`/api/invoice/download/${number}`);
    // router.push("/offtaker/billings/invoice");
  };

  const handleView = (invoiceId) => {
    router.push(`/offtaker/billings/invoice/${invoiceId}`);
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-xl">
      <div className="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-between">
        {/* Project Dropdown Filter */}
        <div className="flex flex-col gap-1">
          <select
            className="px-3 py-2 text-sm border rounded-md theme-btn-blue-color focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={projectFilter}
            onChange={(e) => handleProjectFilterChange(e.target.value)}
            disabled={projectsLoading}
          >
            <option value="">All Projects</option>
            {dropdownProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {projectsError && (
            <p className="text-xs text-red-600">{projectsError}</p>
          )}
        </div>

        <div className="relative"></div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search project or invoice..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <select
            className="px-3 py-2 text-sm border rounded-md theme-btn-blue-color focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="1">Paid</option>
            <option value="0">Unpaid</option>
          </select>
        </div>
      </div>

      <div className="border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-left">
                PROJECT NAME
              </th>
              <th className="px-4 py-3 font-semibold text-left">
                INVOICE NAME
              </th>
              <th className="px-2 py-3 font-semibold text-left">
                INVOICE DATE
              </th>
              <th className="px-2 py-3 font-semibold text-left">DUE DATE</th>
              <th className="px-2 py-3 font-semibold text-left">AMOUNT</th>
              <th className="px-2 py-3 font-semibold text-left">STATUS</th>
              <th className="px-2 py-3 font-semibold text-left">DOWNLOAD</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-gray-500"
                  colSpan={7}
                >
                  No invoices found
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv, idx) => (
                <tr
                  key={inv.id}
                  className={idx % 2 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-2 font-medium whitespace-nowrap">
                    {inv.projectName}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <Link
                      href={`/offtaker/billings/invoice/${inv.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#1976d2",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      {inv.invoiceName}
                    </Link>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {inv.invoiceDate}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">{inv.dueDate}</td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {priceWithCurrency(inv.amount)}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusColors[inv.status]
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {inv.download ? (
                      <div className="relative inline-block text-left">
                        <button
                          className="px-2 py-1 bg-transparent border-none cursor-pointer dropdown-action-btn"
                          onClick={() => setDropdownOpen(idx)}
                        >
                          <span className="text-2xl">&#8942;</span>
                        </button>
                        {dropdownOpen === idx && (
                          <>
                            {/* Backdrop for outside click */}
                            <div
                              className="fixed inset-0 z-10"
                              style={{ background: "transparent" }}
                              onClick={() => setDropdownOpen(null)}
                            />
                            <div className="absolute right-0 z-20 w-32 mt-2 bg-white border rounded shadow-lg dropdown-action-menu">
                              <button
                                className="block w-full px-4 py-2 text-left text-blue-600 hover:bg-gray-100"
                                onClick={() => {
                                  handleDownload(inv.number);
                                  setDropdownOpen(null);
                                }}
                              >
                                Download
                              </button>
                              <button
                                className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  handleView(inv.id);
                                  setDropdownOpen(null);
                                }}
                              >
                                View
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Download</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-500">
          {pagination.total === 0
            ? "No entries"
            : `${pageIndex * pageSize + 1} - ${Math.min(
                (pageIndex + 1) * pageSize,
                pagination.total
              )} of ${pagination.total} entries`}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i)}
              className={`w-8 h-8 rounded font-bold ${
                pageIndex === i
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Billings;
