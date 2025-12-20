import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiPatch } from "@/lib/api";
import Table from "@/components/shared/table/Table";
import { FiArrowRight, FiEdit3, FiSave, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import { useLanguage } from "@/contexts/LanguageContext";
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
  CircularProgress,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const InverterTab = ({ projectId, handleSaveAction }) => {
  const { lang } = useLanguage();


  // Modal & Form state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [loading, setLoading] = useState(false);
  const [inverterList, setInverterList] = useState([]);
  const [selectedInverter, setSelectedInverter] = useState(null);
  const [kilowatt, setKilowatt] = useState("");
  const [kilowattError, setKilowattError] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [serialNumberError, setSerialNumberError] = useState("");
  const [status, setStatus] = useState(1);
  const [editId, setEditId] = useState(null);
  // ------- STATE: add for serial number field -------
  const [inverterName, setInverterName] = useState("");
  const [model, setModel] = useState("");
  const [version, setVersion] = useState("");
  const [warrantyExpireDate, setWarrantyExpireDate] = useState("");
  const [hasWarranty, setHasWarranty] = useState(false);

  // Table state
  const [projectInverters, setProjectInverters] = useState([]);
  // Inverter types map: id -> type
  const [inverterTypesMap, setInverterTypesMap] = useState({});

  useEffect(() => {
    apiGet("/api/inverters?status=1&limit=100").then((res) => {
      if (res?.success) setInverterList(res.data.inverters);
    });
  }, []);

  // Fetch inverter types for mapping id -> type
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await apiGet("/api/inverterTypes");
        const items = Array.isArray(res?.data) ? res.data : [];
        const map = items.reduce((acc, it) => {
          acc[it.id] = it.type;
          return acc;
        }, {});
        setInverterTypesMap(map);
      } catch (e) {
        // noop
      }
    };
    fetchTypes();
  }, []);

  const getProjectInverters = () => {
    apiGet(`/api/project-inverters?project_id=${projectId}`).then((res) => {
      if (res?.success) setProjectInverters(res.data);
    });
  };
  useEffect(() => {
    getProjectInverters();
  }, [projectId]);

  const openAddModal = () => {
    setModalType("add");
    setSelectedInverter(null);
    setKilowatt("");
    setKilowattError("");
    setSerialNumber(""); // <--
    setSerialNumberError("");
    setInverterName("");
    setModel("");
    setVersion("");
    setWarrantyExpireDate("");
    setHasWarranty(false);
    setStatus(1);
    setEditId(null);
    setShowModal(true);
  };
  const openEditModal = (row) => {
    setModalType("edit");
    setSelectedInverter(
      inverterList.find((i) => i.id === row.inverter_id) || null
    );
    setKilowatt(row.kilowatt);
    setSerialNumber(row.inverter_serial_number || ""); // <--
    setInverterName(row.inverter_name || "");
    setModel(row.model || "");
    setVersion(row.version || "");
    setWarrantyExpireDate(
      row.warranty_expire_date ? row.warranty_expire_date.split("T")[0] : ""
    );
    setHasWarranty(!!row.in_warranty || !!row.warranty_expire_date);
    setStatus(row.status);
    setEditId(row.id);
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const STATUS_OPTIONS = [
    { label: lang("common.online", "Online"), value: 1 },
    { label: lang("common.offline", "Offline"), value: 2 },
    { label: lang("common.alarm", "Alarm"), value: 3 },
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setKilowattError("");
    setSerialNumberError("");
    
    // Validate required fields
    if (!selectedInverter) return;
    
    if (!kilowatt || kilowatt.trim() === "") {
      setKilowattError(
        lang("validation.kilowattRequired", "Kilowatt is required")
      );
      return;
    }
    
    if (!serialNumber || serialNumber.trim() === "") {
      setSerialNumberError(
        lang("validation.serialNumberRequired", "Serial Number is required")
      );
      return;
    }
    
    if (!/^[0-9]*\.?[0-9]+$/.test(kilowatt)) {
      setKilowattError(
        lang("inverter.onlyNumbers", "Only numbers are allowed (e.g. 1234.56)")
      );
      return;
    }
    
    setLoading(true);
    let res = {};
    try {
      if (modalType === "add") {
        res = await apiPost("/api/project-inverters", {
          project_id: projectId,
          inverter_id: selectedInverter.id,
          kilowatt: kilowatt,
          inverter_serial_number: serialNumber,
          inverter_name: inverterName,
          model: model,
          version: version,
          warranty_expire_date: hasWarranty ? warrantyExpireDate : null,
          in_warranty: hasWarranty ? 1 : 0,
          status,
        });
        if (res.success) {
          showSuccessToast(
            lang(
              "inverter.createdSuccessfully",
              "Inverter created successfully!"
            )
          );
        } else {
          showErrorToast(
            res.message ||
            lang(
              "inverter.errorOccurred",
              "An error occurred. Please try again."
            )
          );
        }
      } else {
        res = await apiPut(`/api/project-inverters/${editId}`, {
          inverter_id: selectedInverter.id,
          kilowatt: kilowatt,
          inverter_serial_number: serialNumber,
          inverter_name: inverterName,
          model: model,
          version: version,
          warranty_expire_date: hasWarranty ? warrantyExpireDate : null,
          in_warranty: hasWarranty ? 1 : 0,
          status,
        });
        if (res.success) {
          showSuccessToast(
            lang(
              "inverter.updatedSuccessfully",
              "Inverter updated successfully!"
            )
          );
        } else {
          showErrorToast(
            res.message ||
            lang(
              "inverter.errorOccurred",
              "An error occurred. Please try again."
            )
          );
        }
      }
      if (res.success) closeModal();
      getProjectInverters();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: lang("common.areYouSure", "Are you sure?"),
      text: lang("modal.deleteWarning", "This action cannot be undone!"),
      showCancelButton: true,
      confirmButtonText: lang("common.yesDelete", "Yes, delete it!"),
      confirmButtonColor: "#d33",
    });
    if (confirm.isConfirmed) {
      const res = await apiPatch(
        `/api/project-inverters/${row.id}/soft-delete`,
        {}
      );
      if (res && res.success) {
        showSuccessToast(
          lang("inverter.deletedSuccessfully", "Inverter deleted successfully!")
        );
        getProjectInverters();
      } else {
        showErrorToast(
          res.message ||
          lang(
            "inverter.errorOccurred",
            "An error occurred. Please try again."
          )
        );
      }
    }
  };

  // Datatable columns (translated)
  const columns = [
    {
      accessorKey: "inverter_type",
      header: () => lang("inverter.type", "Inverter Type"),
      cell: (info) => {
        console.log("info", info);
        const row = info.row.original;
        const name = row.inverters?.inverter_name || "-";
        const type =
          row.inverters?.inverter_type?.type ||
          inverterTypesMap[row.inverters?.inverter_type_id] ||
          "";
        return type ? `${name} (${type})` : name;
      },
    },
    {
      accessorKey: "inverter_name",
      header: () => lang("inverter.inverterName", "Inverter Name"),
      cell: (info) => info.row.original.inverter_name || "-",
    },
    {
      accessorKey: "inverter_serial_number",
      header: () => lang("inverter.serialNumber", "Serial Number"),
      cell: (info) => info.row.original.inverter_serial_number || "-",
    },
    {
      accessorKey: "version",
      header: () => lang("inverter.version", "Version"),
      cell: (info) => info.row.original.version || "-",
    },
    {
      accessorKey: "model",
      header: () => lang("inverter.model", "Model"),
      cell: (info) => info.row.original.model || "-",
    },
    {
      accessorKey: "warranty_expire_date",
      header: () => lang("inverter.warrantyExpireDate", "Warranty Expire Date"),
      cell: (info) => {
        const val = info.row.original.warranty_expire_date;
        return val ? String(val).split("T")[0] : "-";
      },
    },
    {
      accessorKey: "kilowatt",
      header: () => lang("inverter.kilowatt", "Kilowatt"),
      cell: (info) => info.getValue() + ' kwh' || "-",
    },
    {
      accessorKey: "status",
      header: () => lang("common.status", "Status"),
      cell: (info) => {
        const statusValue = info.getValue();
        if (statusValue === 1) {
          return (
            <span className="badge bg-soft-success text-success">
              {lang("common.online", "Online")}
            </span>
          );
        } else if (statusValue === 2) {
          return (
            <span className="badge bg-soft-danger text-danger">
              {lang("common.offline", "Offline")}
            </span>
          );
        } else if (statusValue === 3) {
          return (
            <span className="badge bg-soft-warning text-warning">
              {lang("common.alarm", "Alarm")}
            </span>
          );
        }
        return "-";
      },
    },
    {
      accessorKey: "actions",
      header: () => lang("common.actions", "Actions"),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div
            className="gap-2 d-flex justify-content-start"
            style={{ flexWrap: "nowrap" }}
          >
            {/* Edit Icon */}
            <FiEdit3
              size={18}
              onClick={() => openEditModal(item)}
              title={lang("common.edit", "Edit")}
              style={{
                color: "#007bff",
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            />

            {/* Delete Icon */}
            <FiTrash2
              size={18}
              onClick={() => handleDelete(item)}
              title={lang("common.delete", "Delete")}
              style={{
                color: "#dc3545",
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            />
          </div>
        );
      },
      meta: {
        disableSort: true,
      },
    },
  ];

  return (
    <div className="inverter-management">
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h6 className="mb-0 fw-bold">
          {lang("inverter.inverter", "Inverters")}{" "}
          {lang("projects.projectlist", "Project List")}
        </h6>
        {/* <button type="button" className="btn common-grey-color" onClick={openAddModal}>+ {lang('inverter.addInverter', 'Add Inverter')}</button> */}
        <Button
          variant="contained"
          onClick={openAddModal}
          className="common-grey-color"
        >
          + {lang("inverter.addInverter", "Add Inverter")}
        </Button>
      </div>
      {/* Modal */}
      <Dialog
        open={showModal}
        onClose={closeModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <form onSubmit={handleSave}>
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pb: 1,
            }}
          >
            <Typography variant="h6" component="span">
              {modalType === "edit"
                ? lang("inverter.editInverter", "Edit Inverter")
                : lang("inverter.addInverter", "Add Inverter")}
            </Typography>
            <IconButton
              aria-label="close"
              onClick={closeModal}
              sx={{
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}
            >
              {/* Dropdown for inverter */}
              <FormControl fullWidth>
                <InputLabel id="inverter-select-label">
                  {lang("inverter.inverter", "Inverter")}
                </InputLabel>
                <Select
                  labelId="inverter-select-label"
                  value={selectedInverter?.id || ""}
                  label={lang("inverter.inverter", "Inverter")}
                  onChange={(e) => {
                    const inv = inverterList.find(
                      (i) => i.id === e.target.value
                    );
                    setSelectedInverter(inv || null);
                  }}
                >
                  <MenuItem value="">
                    {lang("inverter.selectInverter", "Select Inverter")}
                  </MenuItem>
                  {inverterList.map((inv) => (
                    <MenuItem key={inv.id} value={inv.id}>
                      {inv.inverter_name +
                        ` - ` +
                        inv.inverter_type_id +
                        (inv.company_name ? ` (${inv.company_name})` : "")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Show after select */}
              {selectedInverter && (
                <>
                  <TextField
                    label={lang("inverter.inverterName", "Inverter Name")}
                    value={inverterName}
                    onChange={(e) => setInverterName(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label={lang("inverter.version", "Version")}
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label={lang("inverter.kilowatt", "Kilowatt")}
                    value={kilowatt}
                    onChange={(e) => {
                      setKilowatt(e.target.value);
                      // Clear error as soon as valid
                      if (
                        kilowattError &&
                        /^[0-9]*\.?[0-9]+$/.test(e.target.value)
                      ) {
                        setKilowattError("");
                      }
                    }}
                    error={!!kilowattError}
                    helperText={kilowattError}
                    fullWidth
                    inputMode="decimal"
                  />
                  <TextField
                    label={lang(
                      "inverter.serialNumber",
                      "Inverter Serial Number"
                    )}
                    value={serialNumber}
                    onChange={(e) => {
                      setSerialNumber(e.target.value);
                      // Clear error as soon as valid
                      if (serialNumberError && e.target.value.trim() !== "") {
                        setSerialNumberError("");
                      }
                    }}
                    error={!!serialNumberError}
                    helperText={serialNumberError}
                    fullWidth
                  />
                  <TextField
                    label={lang("inverter.model", "Model")}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    fullWidth
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="checkbox"
                      id="warranty-check"
                      checked={hasWarranty}
                      onChange={(e) => setHasWarranty(e.target.checked)}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <label htmlFor="warranty-check" style={{ cursor: "pointer", marginBottom: 0 }}>
                      {lang("inverter.Warranty", "Warranty")}
                    </label>
                  </div>
                  {hasWarranty && (
                    <TextField
                      label={lang("inverter.warrantyExpireDate", "Warranty Expire Date")}
                      type="date"
                      value={warrantyExpireDate}
                      onChange={(e) => setWarrantyExpireDate(e.target.value)}
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  )}
                  <FormControl fullWidth>
                    <InputLabel id="status-select-label">
                      {lang("common.status", "Status")}
                    </InputLabel>
                    <Select
                      labelId="status-select-label"
                      value={status}
                      label={lang("common.status", "Status")}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              onClick={closeModal}
              color="error"
              className="custom-orange-outline"
            >
              {lang("common.cancel", "Cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} /> : null}
              className="common-grey-color"
            >
              {loading
                ? lang("common.loading", "Loading...")
                : lang("common.save", "Save")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Enhanced Table */}
      <Table data={projectInverters} columns={columns} />
      <div className="gap-2 col-12 d-flex justify-content-end">
        <Button
          type="button"
          variant="outlined"
          disabled={loading.form}
          onClick={() => handleSaveAction('saveNext')}
          style={{
            marginTop: "2px",
            marginBottom: "2px",
          }}
        >
          {loading.form
            ? lang("common.saving", "Saving")
            : lang("projects.saveNext", "Next")}
          <FiArrowRight />
        </Button>
      </div>
    </div>
  );
};

export default InverterTab;
