"use client";
import React, { useEffect, useState } from "react";
import Table from "@/components/shared/table/Table";
import { apiGet, apiDelete } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import { showSuccessToast } from "@/utils/topTost";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { usePriceWithCurrency } from '@/hooks/usePriceWithCurrency';
import {
  Chip,
  IconButton,
  Stack,
} from "@mui/material";

const InvoiceTable = () => {
  const { lang } = useLanguage();
  const router = useRouter();
  const [invoicesData, setInvoicesData] = useState([]);
  const priceWithCurrency = usePriceWithCurrency();


  const fetchInvoices = async () => {
    try {
      const response = await apiGet("/api/invoice/");
      if (response?.success && response?.data?.invoices) {
        setInvoicesData(response.data.invoices);
      } else {
        setInvoicesData([]);
      }
    } catch (e) {
      setInvoicesData([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await apiGet("/api/projects?status=1&limit=1000");
      const items = Array.isArray(res?.projectList) ? res.projectList : [];
      const active = items.filter((p) => String(p?.status) === "1");
      const mapped = active.map((p) => ({ label: p.project_name, value: String(p.id) }));
      setProjectOptions([{ label: lang("invoice.selectProject"), value: "" }, ...mapped]);
    } catch (_) {
      setProjectOptions([]);
    }
  };

  const fetchProjectOfftaker = async (projectId) => {
    try {
      const res = await apiGet(`/api/projects/${projectId}`);
      const proj = res?.data;
      const ot = proj?.offtaker;
      if (ot?.id) {
        const option = { label: (ot.full_name || ot.email || ""), value: String(ot.id) };
        setOfftakerOptions([option]);
        setSelectedOfftaker(option);
        if (errors.offtaker) setErrors((prev) => ({ ...prev, offtaker: "" }));
      } else {
        setOfftakerOptions([]);
        setSelectedOfftaker(null);
      }
    } catch (_) {
      setOfftakerOptions([]);
      setSelectedOfftaker(null);
    }
  };

  useEffect(() => {
    fetchInvoices();
    const onSaved = () => fetchInvoices();
    window.addEventListener("invoice:saved", onSaved);
    return () => window.removeEventListener("invoice:saved", onSaved);
  }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: lang("messages.confirmDelete"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: lang("common.yesDelete"),
      cancelButtonText: lang("common.cancel"),
    });
    if (!result.isConfirmed) return;
    try {
      const res = await apiDelete(`/api/invoice/${id}`);
      if (res.success) {
        showSuccessToast(lang("invoice.invoiceDeletedSuccessfully"));
        fetchInvoices();
      }
    } catch (_) {
      // noop
    }
  };

  const columns = [
    {
      accessorKey: "project.project_name",
      header: () => lang("invoice.project"),
      cell: ({ row }) => row?.original?.projects?.project_name || "-",
    },
    {
      accessorKey: "offtaker",
      header: () => lang("invoice.offtaker"),
      cell: ({ row }) => {
        const u = row?.original?.users;
        if (!u) return "-";
        return u.full_name || "-";
      },
    },
    // { accessorKey: "sub_amount", header: () => lang("invoice.subamount") },
    {
      accessorKey: 'sub_amount',
      header: () => lang('invoice.subamount'),
      cell: ({ getValue }) => priceWithCurrency(getValue()),
    },
    // { accessorKey: "total_amount", header: () => lang("invoice.totalUnit") },
    {
      accessorKey: 'total_amount',
      header: () => lang('invoice.totalUnit'),
      cell: ({ getValue }) => priceWithCurrency(getValue()),
    },
    // {
    //   accessorKey: "start_time",
    //   header: () => "Start Time",
    //   cell: ({ row }) => formatTime(row.original.start_time),
    // },
    // {
    //   accessorKey: "end_time",
    //   header: () => "End Time",
    //   cell: ({ row }) => formatTime(row.original.end_time),
    // },
    {
      accessorKey: "status",
      header: () => lang("invoice.status"),
      cell: ({ row }) => {
        const status = row.original.status;
        const config = {
          1: { label: lang("invoice.paid"), color: "#17c666" },
          0: { label: lang("invoice.unpaid"), color: "#ea4d4d" },
        }[status] || { label: String(status ?? "-"), color: "#999" };
        return (
          <Chip
            label={config.label}
            sx={{
              backgroundColor: config.color,
              color: "#fff",
              fontWeight: 500,
              minWidth: 80,
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
      accessorKey: "actions",
      header: () => lang("invoice.actions"),
      cell: ({ row }) => (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
          <IconButton
            size="small"
            onClick={() => {
              router.push(`/admin/finance/invoice/edit/${row.original.id}`);
            }}
            sx={{
              color: "#1976d2",
              transition: "transform 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(25, 118, 210, 0.08)",
                transform: "scale(1.1)",
              },
            }}
          >
            <FiEdit3 size={18} />
          </IconButton>
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
    <Table data={invoicesData} columns={columns} />
  );
};

export default InvoiceTable;