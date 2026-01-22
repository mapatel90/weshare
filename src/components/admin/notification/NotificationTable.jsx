"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Table from "@/components/shared/table/Table";
import { apiGet, apiDelete, apiPatch } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiTrash2, FiCheckCircle } from "react-icons/fi";
import { showSuccessToast } from "@/utils/topTost";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { Chip, IconButton, Stack, Box } from "@mui/material";

const NotificationTable = () => {
  const { lang } = useLanguage();
  const router = useRouter();
  const [notificationsData, setNotificationsData] = useState([]);
  const [usersData, setUsersData] = useState([]);

  // Filter and pagination states
  const [moduleTypeFilter, setModuleTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Module type options
  const moduleTypes = [
    { value: "invoice", label: "Invoice" },
    { value: "payment", label: "Payment" },
    { value: "contract", label: "Contract" },
    { value: "project", label: "Project" },
    { value: "reminder", label: "Reminder" },
  ];

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        limit: String(pageSize),
      });

      if (moduleTypeFilter) {
        params.append("moduleType", moduleTypeFilter);
      }

      if (statusFilter) {
        params.append("unreadOnly", statusFilter === "unread" ? "true" : "false");
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await apiGet(`/api/notifications?${params.toString()}`, {
        includeAuth: true,
      });

      if (response?.success && response?.data) {
        const payload = response.data;
        const notifications = Array.isArray(payload?.notifications)
          ? payload.notifications
          : Array.isArray(payload)
          ? payload
          : [];

        setNotificationsData(notifications);

        const apiPagination = response.pagination || payload?.pagination || {};
        setPagination({
          page: apiPagination.page || 1,
          limit: apiPagination.limit || pageSize,
          total: apiPagination.total || 0,
          pages: apiPagination.totalPages || 0,
        });

        const maxPageIndex = Math.max(0, (apiPagination.totalPages || 1) - 1);

        if (pageIndex > maxPageIndex) {
          setPageIndex(maxPageIndex);
        }
      } else {
        setNotificationsData([]);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
      setNotificationsData([]);
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const onSaved = () => fetchNotifications();
    window.addEventListener("notification:saved", onSaved);
    return () => window.removeEventListener("notification:saved", onSaved);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [moduleTypeFilter, statusFilter, searchTerm, pageIndex, pageSize]);

  useEffect(() => {
    setPageIndex(0);
  }, [moduleTypeFilter, statusFilter, searchTerm]);

  const handleSearchChange = (value) => {
    setPageIndex(0);
    setSearchTerm(value);
  };

  const handlePaginationChange = (nextPagination) => {
    const current = { pageIndex, pageSize };
    const updated =
      typeof nextPagination === "function"
        ? nextPagination(current)
        : nextPagination || {};
    if (typeof updated.pageIndex === "number") {
      setPageIndex(updated.pageIndex);
    } else if (updated.pageIndex == null) {
      setPageIndex(0);
    }
    if (typeof updated.pageSize === "number") {
      setPageSize(updated.pageSize);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await apiDelete(`/api/notifications/${id}`, {
        includeAuth: true,
      });
      if (res.success) {
        showSuccessToast("Notification deleted successfully");
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleMarkAsRead = async (id, currentStatus) => {
    try {
      const res = await apiPatch(
        `/api/notifications/${id}/read`,
        {},
        { includeAuth: true }
      );

      if (res.success) {
        showSuccessToast("Marked as read");
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const columns = [
    {
      id: "notification",
      accessorFn: (row) => row?.title || "",
      header: () => lang("notification.title"),
      cell: ({ row }) => {
        const title = row.original?.title || "";
        const message = row.original?.message || "";
        const actionUrl = row.original?.action_url;

        const content = (
          <div>
            <div className="font-medium text-gray-900">
              {title || "-"}
            </div>
            {message && (
              <div
                className="text-sm text-gray-600 mt-1"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {message}
              </div>
            )}
          </div>
        );

        if (actionUrl) {
          return (
            <Link href={actionUrl} className="block hover:text-blue-600 transition-colors">
              {content}
            </Link>
          );
        }

        return content;
      },
    },
    {
      id: "module_type",
      accessorFn: (row) => row?.module_type || "",
      header: () => lang("notification.module"),
      cell: ({ row }) => {
        const moduleType = row.getValue("module_type");
        return moduleType ? (
          <Chip
            label={moduleType.charAt(0).toUpperCase() + moduleType.slice(1)}
            size="small"
            variant="outlined"
          />
        ) : (
          "-"
        );
      },
    },
    {
      id: "status",
      accessorFn: (row) => row?.is_read,
      header: () => lang("common.status"),
      cell: ({ row }) => {
        const isRead = row.getValue("status");
        const config = {
          0: { label: "Unread", color: "#ff9800" },
          1: { label: "Read", color: "#4caf50" },
        }[isRead] || { label: "Unknown", color: "#999" };

        return (
          <Chip
            label={config.label}
            sx={{
              backgroundColor: config.color,
              color: "#fff",
              fontWeight: 500,
              "&:hover": {
                backgroundColor: config.color,
                opacity: 0.9,
              },
            }}
          />
        );
      },
    },
    {
      id: "created_at",
      accessorFn: (row) => row?.created_at || "",
      header: () => lang("common.date"),
      cell: ({ row }) => formatTime(row.getValue("created_at")),
    },
    {
      accessorKey: "actions",
      header: () => lang("common.actions"),
      cell: ({ row }) => (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
          {row.original.is_read === 0 && (
            <IconButton
              size="small"
              onClick={() => handleMarkAsRead(row.original.id, row.original.is_read)}
              sx={{
                color: "#2e7d32",
                transition: "transform 0.2s ease",
                "&:hover": {
                  backgroundColor: "rgba(46, 125, 50, 0.08)",
                  transform: "scale(1.1)",
                },
              }}
              title="Mark as read"
            >
              <FiCheckCircle size={18} />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={() => handleDelete(row.original.id)}
            sx={{
              color: "#d32f2f",
              transition: "transform 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(211, 47, 47, 0.08)",
                transform: "scale(1.1)",
              },
            }}
            title="Delete notification"
          >
            <FiTrash2 size={18} />
          </IconButton>
        </Stack>
      ),
      meta: {
        disableSort: true,
      },
    },
  ];

  return (
    <div className="p-6 bg-white rounded-3xl shadow-md">
      <div className="d-flex justify-content-between mb-4 mt-4 flex-wrap">
        <div className="filter-button d-flex">
          <select
            value={moduleTypeFilter}
            onChange={(e) => setModuleTypeFilter(e.target.value)}
            className="theme-btn-blue-color border rounded px-3 py-2 text-sm me-2"
          >
            <option value="">{lang("notification.allModules")}</option>
            {moduleTypes.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="theme-btn-blue-color border rounded px-3 py-2 text-sm"
          >
            <option value="">{lang("invoice.allStatus")}</option>
            <option value="unread">{lang("notification.unreadonly")}</option>
            <option value="read">{lang("notification.readonly")}</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto relative">
        {!hasLoadedOnce && loading && (
          <div className="text-center py-6 text-gray-600">Loading...</div>
        )}

        {hasLoadedOnce && (
          <>
            <Table
              data={notificationsData}
              columns={columns}
              disablePagination={false}
              onSearchChange={handleSearchChange}
              onPaginationChange={handlePaginationChange}
              pageIndex={pageIndex}
              pageSize={pageSize}
              serverSideTotal={pagination.total}
              initialPageSize={pageSize}
            />
            {loading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-gray-600">
                Refreshing...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationTable;
