import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import Table from "@/components/shared/table/Table";
import { FiArrowRight, FiEdit3, FiTrash2 } from "react-icons/fi";
import Swal from "sweetalert2";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";

const Investor = ({ projectId, onInvestorMarked, handleSaveAction }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [loading, setLoading] = useState(false);

  const [investors, setInvestors] = useState([]);
  const [editId, setEditId] = useState(null);

  // form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState(1);

  useEffect(() => {
    fetchInvestors();
  }, [projectId]);

  const fetchInvestors = async () => {
    try {
      // Call the router from invester.js which returns { success: true, data: [...], total, ... }
      const res = await apiGet('/api/investors');
      if (res?.success) {
        const all = Array.isArray(res.data) ? res.data : [];
        // ensure only given projectId rows are shown (server may already filter, but keep client-side safeguard)
        const filtered = projectId ? all.filter(item => Number(item.project_id) === Number(projectId)) : all;
        setInvestors(filtered);
      } else {
        setInvestors([]);
      }
    } catch (e) {
      // noop
      setInvestors([]);
    }
  };

  const openAdd = () => {
    setModalType("add");
    setEditId(null);
    setFullName("");
    setEmail("");
    setPhoneNumber("");
    setNotes("");
    setStatus(1);
    setShowModal(true);
  };

  const openEdit = (row) => {
    setModalType("edit");
    setEditId(row.id);
    setFullName(row.full_name || "");
    setEmail(row.email || "");
    setPhoneNumber(row.phone_number || "");
    setNotes(row.notes || "");
    setStatus(row.status ?? 1);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const validateEmail = (em) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(em).toLowerCase());

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName || !email) {
      showErrorToast(lang("investor.nameEmailRequired", "Name and email are required"));
      return;
    }
    if (!validateEmail(email)) {
      showErrorToast(lang("investor.invalidEmail", "Invalid email"));
      return;
    }

    setLoading(true);
    try {
      let res;
      const payload = {
        projectId: projectId ?? null,
        fullName,
        email,
        phoneNumber: phoneNumber || null,
        notes: notes || null,
        status,
        created_by: user?.id,
      };

      if (modalType === "add") {
        res = await apiPost("/api/investors", payload);
        if (res?.success) showSuccessToast(lang("investor.created", "Investor created"));
        else showErrorToast(res.message || lang("common.error", "Error"));
      } else {
        res = await apiPut(`/api/investors/${editId}`, payload);
        if (res?.success) showSuccessToast(lang("investor.updated", "Investor updated"));
        else showErrorToast(res.message || lang("common.error", "Error"));
      }

      if (res?.success) {
        closeModal();
        fetchInvestors();
      }
    } catch (err) {
      showErrorToast(err.message || lang("common.error", "Error"));
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
    if (!confirm.isConfirmed) return;

    try {
      const res = await apiDelete(`/api/investors/${row.id}`);
      if (res?.success) {
        showSuccessToast(lang("investor.deleted", "Investor deleted"));
        // Notify parent if this investor was marked for the project
        if (typeof onInvestorMarked === "function") {
          onInvestorMarked({ id: null, full_name: "" });
        }
        fetchInvestors();
      } else {
        showErrorToast(res.message || lang("common.error", "Error"));
      }
    } catch (err) {
      showErrorToast(err.message || lang("common.error", "Error"));
    }
  };

  const handleMarkInvestor = async (row) => {
    if (!projectId) {
      showErrorToast(lang("common.error", "Project ID is required"));
      return;
    }

    try {
      const res = await apiPost(`/api/investors/${row.id}/mark-investor`, {
        projectId,
      });
      if (res?.success) {
        showSuccessToast(lang("investor.markedSuccessfully", "Investor marked successfully"));
        // inform parent so edit form updates instantly without page refresh
        if (typeof onInvestorMarked === "function") {
          onInvestorMarked({ id: row.id, full_name: row.full_name || "" });
        }
        fetchInvestors();
      } else {
        showErrorToast(res.message || lang("common.error", "Error"));
      }
    } catch (err) {
      showErrorToast(err.message || lang("common.error", "Error"));
    }
  };

  const columns = [
    {
      accessorKey: "full_name",
      header: () => lang("investor.fullName", "Full Name"),
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "email",
      header: () => lang("investor.email", "Email"),
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "phone_number",
      header: () => lang("investor.phone", "Phone"),
      cell: (info) => info.getValue() || "-",
    },
    {
      accessorKey: "notes",
      header: () => lang("investor.notes", "Notes"),
      cell: (info) => {
        const v = info.getValue() || "-";
        return String(v).length > 80 ? String(v).slice(0, 77) + "..." : v;
      },
    },
    // {
    //   accessorKey: "project",
    //   header: () => lang("projects.project", "Project"),
    //   cell: (info) => info.row.original.project?.projectName || "-",
    // },
    {
      accessorKey: "status",
      header: () => lang("common.status", "Status"),
      cell: (info) => {
        const row = info.row.original;
        const isCurrentInvestor =
          (row?.projects?.investor_id && Number(row.projects.investor_id) === Number(row.id)) ||
          (row?.projects?.investorId && Number(row.projects.investorId) === Number(row.id));
        return (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {isCurrentInvestor ? (
              <span className="badge bg-soft-success text-success">
                {lang("common.active", "Active")}
              </span>
            ) : (
              <Button
                size="small"
                variant="contained"
                onClick={() => handleMarkInvestor(row)}
                sx={{
                  backgroundColor: "#28a745",
                  color: "#fff",
                  padding: "4px 8px",
                  fontSize: "12px",
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#218838" },
                }}
              >
                {lang("investor.markAsInvestor", "Mark as Investor")}
              </Button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "actions",
      header: () => lang("common.actions", "Actions"),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="d-flex gap-2" style={{ flexWrap: "nowrap" }}>
            <FiEdit3
              size={18}
              onClick={() => openEdit(item)}
              title={lang("common.edit", "Edit")}
              style={{ color: "#007bff", cursor: "pointer" }}
            />
            <FiTrash2
              size={18}
              onClick={() => handleDelete(item)}
              title={lang("common.delete", "Delete")}
              style={{ color: "#dc3545", cursor: "pointer" }}
            />
          </div>
        );
      },
      meta: { disableSort: true },
    },
  ];

  return (
    <div className="investor-management">
      {/* <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">{lang("investor.investors", "Investors")}</h6>
        <Button variant="contained" onClick={openAdd} className="common-grey-color">
          + {lang("investor.addInvestor", "Add Investor")}
        </Button>
      </div> */}

      <Dialog open={showModal} onClose={closeModal} maxWidth="sm" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
            <Typography variant="h6" component="span">
              {modalType === "edit" ? lang("investor.editInvestor", "Edit Investor") : lang("investor.addInvestor", "Add Investor")}
            </Typography>
            <IconButton aria-label="close" onClick={closeModal} sx={{ color: (theme) => theme.palette.grey[500] }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <TextField label={lang("investor.fullName", "Full Name")} value={fullName} onChange={e => setFullName(e.target.value)} required fullWidth />
              <TextField label={lang("investor.email", "Email")} value={email} onChange={e => setEmail(e.target.value)} required fullWidth />
              <TextField label={lang("investor.phone", "Phone Number")} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} fullWidth />
              <TextField label={lang("investor.notes", "Notes")} value={notes} onChange={e => setNotes(e.target.value)} fullWidth multiline minRows={3} />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={closeModal} color="error" className="custom-orange-outline">{lang("common.cancel", "Cancel")}</Button>
            <Button type="submit" variant="contained" disabled={loading || !fullName || !email} startIcon={loading ? <CircularProgress size={16} /> : null} className="common-grey-color">
              {loading ? lang("common.loading", "Loading...") : lang("common.save", "Save")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Table data={investors} columns={columns} />
      <div className="col-12 d-flex justify-content-end gap-2">
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

export default Investor;