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

const InverterTable = () => {
  const { lang } = useLanguage();
  const [invertersData, setInvertersData] = useState([]);
  // Modal/Form state (moved from AddInverter)
  const [typeOptions, setTypeOptions] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [typesError, setTypesError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingEdit, setPendingEdit] = useState(null);

  const [companyName, setCompanyName] = useState("");
  const [inverterName, setInverterName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  // Modal logic state:
  const [modalMode, setModalMode] = useState(null);
  const [status, setStatus] = useState("");
  const [statusError, setStatusError] = useState("");

  const resetForm = () => {
    setCompanyName("");
    setInverterName("");
    setApiKey("");
    setSecretKey("");
    setSelectedType(null);
    setEditingId(null);
    setErrors({});
    setPendingEdit(null);
    setStatus("");
    setStatusError("");
  };

  const fetchInverters = async () => {
    try {
      const response = await apiGet("/api/inverters/");
      if (response.success && response.data.inverters) {
        setInvertersData(response.data.inverters);
      }
    } catch (error) {
      // noop
    }
  };

  const handleDelete = async (inverterId) => {
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
      const response = await apiDelete(`/api/inverters/${inverterId}`);
      if (response.success) {
        showSuccessToast(lang("inverter.deletedSuccessfully"));
        fetchInverters();
      } else {
        // optional: show toast
      }
    } catch (error) {
      // noop
    }
  };

  useEffect(() => {
    fetchInverters();

    const onSaved = () => fetchInverters();
    window.addEventListener("inverter:saved", onSaved);
    return () => window.removeEventListener("inverter:saved", onSaved);
  }, []);

  // Fetch inverter types
  const fetchTypes = async () => {
    try {
      setLoadingTypes(true);
      setTypesError("");
      const res = await apiGet("/api/inverterTypes");
      const items = Array.isArray(res?.data) ? res.data : [];
      const mapped = items.map((it) => ({
        label: it.type,
        value: String(it.id),
      }));
      setTypeOptions([
        { label: lang("inverter.selectType"), value: "select type" },
        ...mapped,
      ]);
    } catch (e) {
      setTypesError(e?.message || "Failed to load inverter types");
    } finally {
      setLoadingTypes(false);
    }
  };

  useEffect(() => {
    fetchTypes();
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
      inverterName: !inverterName
        ? lang("validation.inverterNameRequired")
        : "",
      selectedType: !selectedType?.value ? lang("validation.typeRequired") : "",
      apiKey: !apiKey ? lang("validation.apiKeyRequired") : "",
      secretKey: !secretKey ? lang("validation.secretKeyRequired") : "",
    };
    const newStatusError = !status && status !== 0 ? lang("validation.statusRequired") : "";
    setStatusError(newStatusError);
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean) || newStatusError) return;
    try {
      setSubmitting(true);
      const payload = {
        companyName,
        inverterName,
        inverter_type_id: parseInt(selectedType.value),
        apiKey,
        secretKey,
        status: parseInt(status),
      };
      const res = editingId
        ? await apiPut(`/api/inverters/${editingId}`, payload)
        : await apiPost("/api/inverters/", payload);

      if (res.success) {
        // ✅ Success Toast Message
        if (editingId) {
          showSuccessToast(lang("inverter.updatedSuccessfully"));
        } else {
          showSuccessToast(lang("inverter.createdSuccessfully"));
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
        // 'Add' mode: reset form, set mode to add, clear editingId and selectedType, then show modal
        setModalMode("add");
        setEditingId(null);
        resetForm();
        setSelectedType(null);
        return;
      }
      // Edit mode - same as before
      setModalMode("edit");
      setEditingId(item.id || null);
      setCompanyName(item.companyName || "");
      setInverterName(item.inverterName || "");
      setApiKey(item.apiKey || "");
      setSecretKey(item.secretKey || "");
      setErrors({});
      setPendingEdit(item);
      // set status for edit mode
      setStatus(item.status !== undefined && item.status !== null ? String(item.status) : "");
      if (Array.isArray(typeOptions) && typeOptions.length > 0) {
        if (item.inverter_type_id !== undefined && item.inverter_type_id !== null) {
          const valueToOption = new Map(typeOptions.map((o) => [o.value, o]));
          const labelToOption = new Map(typeOptions.map((o) => [o.label, o]));
          const key = String(item.inverter_type_id);
          const found = valueToOption.get(key) || labelToOption.get(item.inverter_type_id) || null;
          setSelectedType(found);
        } else {
          setSelectedType(null);
        }
      } else {
        setSelectedType(null);
      }
    };
    window.addEventListener("inverter:open-edit", openEdit);
    return () => window.removeEventListener("inverter:open-edit", openEdit);
  }, [typeOptions]);

  // When types finish loading, if an edit is pending, resolve the selected option
  useEffect(() => {
    if (!pendingEdit) return;
    if (!Array.isArray(typeOptions) || typeOptions.length === 0) return;
    const { inverter_type_id } = pendingEdit;
    if (inverter_type_id === undefined || inverter_type_id === null) {
      setSelectedType(null);
      return;
    }
    const valueToOption = new Map(typeOptions.map((o) => [o.value, o]));
    const labelToOption = new Map(typeOptions.map((o) => [o.label, o]));
    const key = String(inverter_type_id);
    const found =
      valueToOption.get(key) || labelToOption.get(inverter_type_id) || null;
    setSelectedType(found);
  }, [typeOptions, pendingEdit]);

  const columns = [
    // { accessorKey: "id", header: () => "ID" },
    { accessorKey: "companyName", header: () => lang("inverter.companyName") },
    {
      accessorKey: "inverterName",
      header: () => lang("inverter.inverterName"),
    },
    { accessorKey: "inverter_type_id", header: () => lang("inverter.type") },
    { accessorKey: "apiKey", header: () => lang("inverter.apiKey") },
    { accessorKey: "secretKey", header: () => lang("inverter.secretKey") },
    { accessorKey: "status", header: () => lang("inverter.status"),
      cell: ({ row }) => {
        const s = row.original.status;
        const config = {
          1: { label: lang("inverter.active") || "Active", color: "#17c666" },
          0: { label: lang("inverter.inactive") || "Inactive", color: "#ea4d4d" },
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
      }
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
    setSelectedType(null);
    setErrors({});
    setPendingEdit(null);
  };


  return (
    <>
      <Table data={invertersData} columns={columns} />
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
              ? lang("inverter.editInverter")
              : lang("inverter.addInverter")}
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
              label={lang("inverter.companyName")}
              placeholder={lang("inverter.companyNamePlaceholder")}
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
              label={lang("inverter.inverterName")}
              placeholder={lang("inverter.inverterNamePlaceholder")}
              value={inverterName}
              onChange={(e) => {
                setInverterName(e.target.value);
                if (errors.inverterName)
                  setErrors((prev) => ({ ...prev, inverterName: "" }));
              }}
              error={!!errors.inverterName}
              helperText={errors.inverterName}
              fullWidth
            />

            <FormControl fullWidth error={!!errors.selectedType}>
              <InputLabel id="type-select-label">{lang("inverter.type")}</InputLabel>
              <Select
                labelId="type-select-label"
                value={selectedType?.value || ""}
                label={lang("inverter.type")}
                onChange={(e) => {
                  const value = e.target.value;
                  const option = typeOptions.find((opt) => opt.value === value) || null;
                  setSelectedType(option);
                  if (errors.selectedType)
                    setErrors((prev) => ({ ...prev, selectedType: "" }));
                }}
              >
                <MenuItem value="">{lang("inverter.selectType")}</MenuItem>
                {typeOptions
                  .filter((opt) => opt.value !== "select type")
                  .map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
              </Select>
              {errors.selectedType && <FormHelperText>{errors.selectedType}</FormHelperText>}
              {loadingTypes && (
                <FormHelperText>{lang("common.loading")}</FormHelperText>
              )}
            </FormControl>

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
              <InputLabel id="status-select-label">{lang("inverter.status")}</InputLabel>
              <Select
                labelId="status-select-label"
                value={status}
                label={lang("inverter.status")}
                onChange={(e) => {
                  setStatus(e.target.value);
                  if (statusError) setStatusError("");
                }}
              >
                <MenuItem value="">{lang("inverter.selectStatus") || "Select Status"}</MenuItem>
                <MenuItem value="1">{lang("inverter.active") || "Active"}</MenuItem>
                <MenuItem value="0">{lang("inverter.inactive") || "Inactive"}</MenuItem>
              </Select>
              {statusError && <FormHelperText>{statusError}</FormHelperText>}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleCloseModal} color="error" variant="outlined">
            {lang("common.cancel")}
          </Button>
          <Button onClick={handleAdd} variant="contained" disabled={submitting}>
            {submitting ? lang("common.loading") : lang("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InverterTable;
