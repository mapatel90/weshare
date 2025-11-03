"use client";
import React, { useEffect, useState } from "react";
import Table from "@/components/shared/table/Table";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import { showSuccessToast } from "@/utils/topTost";
import Swal from "sweetalert2";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Button,
  Chip,
  Box,
  IconButton,
  Typography,
  Stack,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const InvoiceTable = () => {
  const { lang } = useLanguage();
  const [invoicesData, setInvoicesData] = useState([]);
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [projectOptions, setProjectOptions] = useState([]);
  const [offtakerOptions, setOfftakerOptions] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedOfftaker, setSelectedOfftaker] = useState(null);
  const [amount, setAmount] = useState("");
  const [totalUnit, setTotalUnit] = useState("");
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState({});
  const [statusError, setStatusError] = useState("");
  const [submitting, setSubmitting] = useState(false);

//   const formatTime = (val) => {
//     if (!val) return "";
//     const d = new Date(val);
//     if (isNaN(d.getTime())) return "";
//     return d.toLocaleTimeString("en-GB", {
//       hour: "2-digit",
//       minute: "2-digit",
//       hour12: false,
//     });
//   };

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
      const items = Array.isArray(res?.data?.projects) ? res.data.projects : [];
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
        const option = { label: (ot.fullName || ot.email || ""), value: String(ot.id) };
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
    fetchProjects();
    const onSaved = () => fetchInvoices();
    window.addEventListener("invoice:saved", onSaved);
    return () => window.removeEventListener("invoice:saved", onSaved);
  }, []);

  const resetForm = () => {
    setSelectedProject(null);
    setSelectedOfftaker(null);
    setAmount("");
    setTotalUnit("");
    setStatus("");
    setErrors({});
    setStatusError("");
    setEditingId(null);
  };

  useEffect(() => {
    const openEdit = (e) => {
      const item = e?.detail?.item;
      if (!item) {
        setModalMode("add");
        resetForm();
        // projects are preloaded on mount
        // offtaker will be loaded based on project selection
        return;
      }
      setModalMode("edit");
      setEditingId(item.id || null);
      // projects are preloaded on mount
      // Ensure offtaker options align with selected project's offtaker
      setSelectedProject(item.project ? { label: item.project.project_name, value: String(item.project.id) } : null);
      const ofLabel = item.offtaker ? ([item.offtaker.fullName].filter(Boolean).join(" ") || item.offtaker.email) : "";
      const editOfftaker = item.offtaker ? { label: ofLabel, value: String(item.offtaker.id) } : null;
      setSelectedOfftaker(editOfftaker);
      setOfftakerOptions(editOfftaker ? [editOfftaker] : []);
      setAmount(String(item.amount ?? ""));
      setTotalUnit(String(item.total_unit ?? ""));
      setStatus(item.status !== undefined && item.status !== null ? String(item.status) : "");
      setErrors({});
    };
    window.addEventListener("invoice:open-edit", openEdit);
    return () => window.removeEventListener("invoice:open-edit", openEdit);
  }, []);

  const handleSave = async () => {
    const newErrors = {
      project: !selectedProject?.value ? "Project is required" : "",
      offtaker: !selectedOfftaker?.value ? "Offtaker is required" : "",
      amount: !amount ? "Amount is required" : isNaN(Number(amount)) ? "Amount must be a number" : "",
      totalUnit: !totalUnit ? "Total unit is required" : isNaN(Number(totalUnit)) ? "Total unit must be a number" : "",
    };
    const newStatusError = !status && status !== 0 ? "Status is required" : "";
    setErrors(newErrors);
    setStatusError(newStatusError);
    if (Object.values(newErrors).some(Boolean) || newStatusError) return;

    try {
      setSubmitting(true);
      const payload = {
        project_id: parseInt(selectedProject.value),
        offtaker_id: parseInt(selectedOfftaker.value),
        amount: parseFloat(amount),
        total_unit: parseFloat(totalUnit),
        status: parseInt(status),
      };
      const res = editingId
        ? await apiPut(`/api/invoice/${editingId}`, payload)
        : await apiPost("/api/invoice/", payload);

      if (res.success) {
        if (editingId) {
          showSuccessToast(lang("invoice.invoiceUpdatedSuccessfully"));
        } else {
          showSuccessToast(lang("invoice.invoiceCreatedSuccessfully"));
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("invoice:saved"));
        }
        handleCloseModal();
      }
    } catch (_) {
      // noop
    } finally {
      setSubmitting(false);
    }
  };

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
      cell: ({ row }) => row?.original?.project?.project_name || "-",
    },
    {
      accessorKey: "offtaker",
      header: () => lang("invoice.offtaker"),
      cell: ({ row }) => {
        const u = row?.original?.offtaker;
        if (!u) return "-";
        return u.fullName || u.email || "-";
      },
    },
    { accessorKey: "amount", header: () => lang("invoice.amount") },
    { accessorKey: "total_unit", header: () => lang("invoice.totalUnit") },
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
              const item = row.original;
              window.dispatchEvent(new CustomEvent("invoice:open-edit", { detail: { item } }));
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

  const handleCloseModal = () => {
    setModalMode(null);
    resetForm();
  };

  return (
    <>
      <Table data={invoicesData} columns={columns} />
      <Dialog
        open={!!modalMode}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1,
          }}
        >
          <Typography variant="h6" component="span">
            {modalMode === "edit" ? lang("invoice.updateInvoice") : lang("invoice.addInvoice")}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
            <FormControl fullWidth error={!!errors.project}>
              <InputLabel id="project-select-label">{lang("invoice.project")}</InputLabel>
              <Select
                labelId="project-select-label"
                value={selectedProject?.value || ""}
                label={lang("invoice.project")}
                onChange={(e) => {
                  const value = e.target.value;
                  const option = projectOptions.find((opt) => opt.value === value) || null;
                  setSelectedProject(option);
                  if (errors.project) setErrors((prev) => ({ ...prev, project: "" }));
                  if (option?.value) {
                    fetchProjectOfftaker(option.value);
                  } else {
                    setOfftakerOptions([]);
                    setSelectedOfftaker(null);
                  }
                }}
              >
                <MenuItem value="">{lang("invoice.selectProject")}</MenuItem>
                {projectOptions
                  .filter((opt) => opt.value !== "")
                  .map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
              </Select>
              {errors.project && <FormHelperText>{errors.project}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth error={!!errors.offtaker}>
              <InputLabel id="offtaker-select-label">{lang("invoice.offtaker")}</InputLabel>
              <Select
                labelId="offtaker-select-label"
                value={selectedOfftaker?.value || ""}
                label={lang("invoice.offtaker")}
                onChange={(e) => {
                  const value = e.target.value;
                  const option = offtakerOptions.find((opt) => opt.value === value) || null;
                  setSelectedOfftaker(option);
                  if (errors.offtaker) setErrors((prev) => ({ ...prev, offtaker: "" }));
                }}
              >
                <MenuItem value="">{lang("invoice.selectOfftaker")}</MenuItem>
                {offtakerOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.offtaker && <FormHelperText>{errors.offtaker}</FormHelperText>}
            </FormControl>

            <TextField
              label={lang("invoice.amount")}
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
              }}
              error={!!errors.amount}
              helperText={errors.amount}
              placeholder="Amount"
              fullWidth
            />

            <TextField
              label={lang("invoice.totalUnit")}
              type="number"
              inputMode="decimal"
              value={totalUnit}
              onChange={(e) => {
                setTotalUnit(e.target.value);
                if (errors.totalUnit) setErrors((prev) => ({ ...prev, totalUnit: "" }));
              }}
              error={!!errors.totalUnit}
              helperText={errors.totalUnit}
              placeholder="Total Unit"
              fullWidth
            />

            <FormControl fullWidth error={!!statusError}>
              <InputLabel id="status-select-label">{lang("invoice.status")}</InputLabel>
              <Select
                labelId="status-select-label"
                value={status}
                label={lang("invoice.status")}
                onChange={(e) => {
                  setStatus(e.target.value);
                  if (statusError) setStatusError("");
                }}
              >
                <MenuItem value="">{lang("invoice.selectStatus")}</MenuItem>
                <MenuItem value="1">{lang("invoice.paid")}</MenuItem>
                <MenuItem value="0">{lang("invoice.unpaid")}</MenuItem>
              </Select>
              {statusError && <FormHelperText>{statusError}</FormHelperText>}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseModal} color="error" variant="outlined">
            {lang("common.cancel")}
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={submitting}>
            {submitting ? lang("common.loading") : lang("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InvoiceTable;