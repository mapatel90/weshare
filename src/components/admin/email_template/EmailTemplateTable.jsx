"use client";
import React, { useEffect, useMemo, useState } from "react";
import Table from "@/components/shared/table/Table";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet, apiDelete } from "@/lib/api";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import Swal from "sweetalert2";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import { IconButton, Stack } from "@mui/material";
import Link from "next/link";
import usePermissions from "@/hooks/usePermissions";

const EmailTemplateTable = () => {
  const { lang } = useLanguage();
  const { canEdit, canDelete } = usePermissions();
  const showActionColumn = canEdit("email_templates") || canDelete("email_templates");
  const [templateData, setTemplateData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiGet("/api/email-templates");
      if (response?.success && Array.isArray(response?.data)) {
        setTemplateData(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      showErrorToast(err?.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();

    const onSaved = () => fetchTemplates();
    if (typeof window !== "undefined") {
      window.addEventListener("emailTemplate:saved", onSaved);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("emailTemplate:saved", onSaved);
      }
    };
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: lang("messages.confirmDelete") || "Confirm Delete",
      text: lang("messages.cannotUndoDelete") || "You cannot undo this action",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: lang("common.yesDelete") || "Yes, delete it!",
      cancelButtonText: lang("common.cancel") || "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await apiDelete(`/api/email-templates/${id}`);
      if (res?.success) {
        showSuccessToast(
          lang("common.deletedSuccessfully") || "Deleted successfully",
        );
        fetchTemplates();
      } else {
        showErrorToast(res?.message || "Failed to delete template");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showErrorToast(err?.message || "Failed to delete template");
    }
  };

  const handleEdit = (item) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("emailTemplate:open-edit", { detail: { item } }),
      );
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "title",
        header: () => lang("common.title") || "Title",
      },
      {
        accessorKey: "slug",
        header: () => lang("news.slug") || "Slug",
        cell: ({ row }) => (
          <code style={{ fontSize: "0.85rem", color: "#666" }}>
            {row.original.slug}
          </code>
        ),
      },
      {
        accessorKey: "subject_en",
        header: () => lang("contactUs.subject_en") || "Subject (English)",
        cell: ({ row }) => {
          const text = row.original.subject_en || row.original.subject || "";
          return text.length > 50 ? `${text.slice(0, 50)}…` : text;
        },
      },
      {
        accessorKey: "subject_vi",
        header: () => lang("contactUs.subject_vi") || "Subject (Vietnamese)",
        cell: ({ row }) => {
          const text = row.original.subject_vi || row.original.subject_vn || "";
          return text.length > 50 ? `${text.slice(0, 50)}…` : text;
        },
      },
      {
        accessorKey: "created_at",
        header: () => lang("common.createdAt") || "Created",
        cell: ({ row }) => {
          const date = row.original.created_at
            ? new Date(row.original.created_at)
            : null;
          return date ? date.toLocaleDateString() : "";
        },
      },
      ...(showActionColumn ? [
        {
          accessorKey: "actions",
          header: () => lang("common.actions") || "Actions",
          meta: { disableSort: true },
          cell: ({ row }) => (
            <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
              {canEdit("email_templates") && (
                <Link href={`/admin/email_template/edit/${row.original.id}`}>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(row.original.id)}
                    sx={{
                      color: "#1976d2",
                      transition: "transform 0.2s ease",
                      "&:hover": {
                        backgroundColor: "rgba(25, 118, 210, 0.08)",
                        transform: "scale(1.1)",
                      },
                    }}
                    title={lang("common.edit") || "Edit"}
                  >
                    <FiEdit3 size={18} />
                  </IconButton>
                </Link>
              )}
              {canDelete("email_templates") && (
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
                  title={lang("common.delete") || "Delete"}
                >
                  <FiTrash2 size={18} />
                </IconButton>
              )}
            </Stack>
          ),
        },
      ] : []),
    ],
    [lang, showActionColumn],
  );

  return <Table data={templateData} columns={columns} loading={loading} />;
};

export default EmailTemplateTable;
