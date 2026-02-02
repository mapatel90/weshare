"use client";
import React, { useState, useEffect } from "react";
import Table from "@/components/shared/table/Table";
import SelectDropdown from "@/components/shared/SelectDropdown";
import { apiGet, apiDelete, apiPost, apiPut } from "@/lib/api";
import { FiEdit3, FiTrash2 } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { useAuth } from "@/contexts/AuthContext";

const CompanyTable = () => {
  const { lang } = useLanguage();
  const [companyData, setICompanyData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [apiUrlName, setApiUrlName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [modalMode, setModalMode] = useState(null);
  const [status, setStatus] = useState("");
  const [statusError, setStatusError] = useState("");
  const { user } = useAuth();

  const resetForm = () => {
    setCompanyName("");
    setApiKey("");
    setSecretKey("");
    setApiUrlName("");
    setEditingId(null);
    setErrors({});
    setStatus("");
    setStatusError("");
  };

  // Validate URL helper
  const isValidUrl = (value) => {
    if (!value) return false;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (e) {
      return false;
    }
  };

  const fetchcompanys = async () => {
    try {
      const response = await apiGet("/api/inverter-company/");
      console.log("response", response);
      if (response.success && response.data.company) {
        setICompanyData(response.data.company);
      }
    } catch (error) {
      // noop
    }
  };

  const handleDelete = async (company_id) => {
    const result = await Swal.fire({
      title: lang("messages.confirmDelete"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: lang("common.yesDelete") || "Yes, delete it!",
      cancelButtonText: lang("common.cancel") || "Cancel",
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      const response = await apiDelete(`/api/inverter-company/${company_id}`);
      if (response.success) {
        showSuccessToast(lang("company.deletedSuccessfully"));
        fetchcompanys();
      } else {
        // optional: show toast
      }
    } catch (error) {
      // noop
    }
  };

  useEffect(() => {
    fetchcompanys();
    const onSaved = () => fetchcompanys();
    window.addEventListener("inverter:saved", onSaved);
    return () => window.removeEventListener("inverter:saved", onSaved);
  }, []);

  // Ensure form resets when opening for Add via Bootstrap trigger and after close
  useEffect(() => {
    const modalEl =
      typeof document !== "undefined" &&
      document.getElementById("addNewInverter");
    if (!modalEl) return;
    const onShow = () => {
      // If opening in add mode, clean slate
      if (modalMode === "add") {
        resetForm();
        setModalMode("add");
      }
    };
    const onHidden = () => {
      // Always reset after modal fully hidden
      resetForm();
      setModalMode("add");
    };
    modalEl.addEventListener("show.bs.modal", onShow);
    modalEl.addEventListener("hidden.bs.modal", onHidden);
    return () => {
      modalEl.removeEventListener("show.bs.modal", onShow);
      modalEl.removeEventListener("hidden.bs.modal", onHidden);
    };
  }, [modalMode]);

  // Handle create/update
  const handleAdd = async () => {
    const newErrors = {
      companyName: !companyName ? lang("validation.companyNameRequired") : "",
      apiKey: !apiKey ? lang("validation.apiKeyRequired") : "",
      secretKey: !secretKey ? lang("validation.secretKeyRequired") : "",
      apiUrlName: !apiUrlName
        ? lang("validation.apiUrlNameRequired")
        : !isValidUrl(apiUrlName)
          ? lang("validation.invalidUrl") || "Enter a valid URL (include http:// or https://)"
          : "",
    };
    const newStatusError =
      !status && status !== 0 ? lang("validation.statusRequired") : "";
    setStatusError(newStatusError);
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean) || newStatusError) return;
    try {
      setSubmitting(true);
      const payload = {
        companyName,
        apiKey,
        secretKey,
        apiUrl: apiUrlName, // <-- include in payload (snake_case for backend)
        status: parseInt(status),
        created_by: user?.id ? parseInt(user.id) : null,
      };

      const res = editingId ? await apiPut(`/api/inverter-company/${editingId}`, payload) : await apiPost("/api/inverter-company", payload);

      if (res.success) {
        if (editingId) {
          showSuccessToast(lang("company.updatedSuccessfully"));
        } else {
          showSuccessToast(lang("company.createdSuccessfully"));
        }
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("inverter:saved"));
      }

      handleCloseModal();
    } catch (e) {
      // noop optional error UI
    } finally {
      setSubmitting(false);
    }
  };

  // Support edit mode via window event
  useEffect(() => {
    const openEdit = (e) => {
      const item = e?.detail?.item;
      if (!item) {
        setModalMode("add");
        setEditingId(null);
        resetForm();
        return;
      }
      // Edit mode - same as before
      setModalMode("edit");
      setEditingId(item.id || null);
      setCompanyName(item.company_name || "");
      setApiKey(item.api_key || "");
      setSecretKey(item.secret_key || "");
      setApiUrlName(item.api_url || "");
      setErrors({});
      setStatus(item.status !== undefined && item.status !== null ? String(item.status) : "");
    };
    window.addEventListener("inverter:open-edit", openEdit);
    return () => window.removeEventListener("inverter:open-edit", openEdit);
  }, []);


  const columns = [
    { accessorKey: "company_name", header: () => lang("company.companyName") },
    { accessorKey: "api_key", header: () => lang("inverter.apiKey") },
    { accessorKey: "api_url", header: () => lang("inverter.apiUrlName") }, 
    { accessorKey: "secret_key", header: () => lang("inverter.secretKey") },
    {
      accessorKey: "status",
      header: () => lang("inverter.status"),
      cell: ({ row }) => {
        const s = row.original.status;
        const config = {
          1: { label: lang("inverter.active") || "Active", color: "#17c666" },
          0: {
            label: lang("inverter.inactive") || "Inactive",
            color: "#ea4d4d",
          },
        }[s] || { label: s, color: "#999" };
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
      header: () => lang("common.actions"),
      cell: ({ row }) => (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
          <IconButton
            size="small"
            onClick={() => {
              // Open modal for edit with prefilled data via window event
              const item = row.original;
              window.dispatchEvent(
                new CustomEvent("inverter:open-edit", { detail: { item } })
              );
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

  // For closing modal:
  const handleCloseModal = () => {
    setModalMode(null);
    resetForm();
    setEditingId(null);
    setErrors({});
  };

  return (
    <>
      <Table data={companyData} columns={columns} />
      <Dialog
        open={!!modalMode}
        onClose={handleCloseModal}
        maxWidth="md"
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
            {modalMode === "edit"
              ? lang("company.editCompany")
              : lang("company.addCompany")}
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
            <TextField
              label={lang("company.companyName")}
              placeholder={lang("company.companyNamePlaceholder")}
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (errors.companyName)
                  setErrors((prev) => ({ ...prev, companyName: "" }));
              }}
              error={!!errors.companyName}
              helperText={errors.companyName}
              fullWidth
            />

            <TextField
              label={lang("inverter.apiKey")}
              placeholder={lang("inverter.apiKeyPlaceholder")}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (errors.apiKey)
                  setErrors((prev) => ({ ...prev, apiKey: "" }));
              }}
              error={!!errors.apiKey}
              helperText={errors.apiKey}
              fullWidth
            />

            <TextField
              label={lang("inverter.apiUrlName") || "API URL Name"} // <-- new input
              placeholder={
                lang("inverter.apiUrlNamePlaceholder") || "Enter API URL name"
              }
              value={apiUrlName}
              onChange={(e) => {
                const v = e.target.value;
                setApiUrlName(v);
                // Clear error only when value becomes valid
                if (errors.apiUrlName && v && isValidUrl(v)) {
                  setErrors((prev) => ({ ...prev, apiUrlName: "" }));
                }
              }}
              error={!!errors.apiUrlName}
              helperText={errors.apiUrlName}
              fullWidth
            />

            <TextField
              label={lang("inverter.secretKey")}
              placeholder={lang("inverter.secretKeyPlaceholder")}
              value={secretKey}
              onChange={(e) => {
                setSecretKey(e.target.value);
                if (errors.secretKey)
                  setErrors((prev) => ({ ...prev, secretKey: "" }));
              }}
              error={!!errors.secretKey}
              helperText={errors.secretKey}
              fullWidth
            />

            <FormControl fullWidth error={!!statusError}>
              <InputLabel id="status-select-label">
                {lang("inverter.status")}
              </InputLabel>
              <Select
                labelId="status-select-label"
                value={status}
                label={lang("inverter.status")}
                onChange={(e) => {
                  setStatus(e.target.value);
                  if (statusError) setStatusError("");
                }}
              >
                <MenuItem value="">
                  {lang("inverter.selectStatus") || "Select Status"}
                </MenuItem>
                <MenuItem value="1">
                  {lang("inverter.active") || "Active"}
                </MenuItem>
                <MenuItem value="0">
                  {lang("inverter.inactive") || "Inactive"}
                </MenuItem>
              </Select>
              {statusError && <FormHelperText>{statusError}</FormHelperText>}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={handleCloseModal}
            color="error"
            variant="outlined"
            className="custom-orange-outline"
          >
            {lang("common.cancel")}
          </Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={submitting}
            className="common-grey-color"
          >
            {submitting ? lang("common.loading") : lang("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CompanyTable;
