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
  Autocomplete,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/constants/roles";

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
  const [userOptions, setUserOptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });


  useEffect(() => {
    fetchInvestors();
    fetchUsers();
  }, [projectId]);

  useEffect(() => {
    if (showModal) fetchUsers();
  }, [showModal]);
  const existingInvestorUserIds = investors.map(inv => Number(inv.user_id));
  const fetchInvestors = async () => {
    try {
      const res = await apiGet('/api/investors');
      if (res?.success) {
        const all = Array.isArray(res.data) ? res.data : [];
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

  const fetchUsers = async (search = "") => {
    try {
      const res = await apiGet(`/api/users?search=${search}&limit=10&role=${ROLES.INVESTOR}`);
      if (res?.success) {
        const users = res.data?.users || [];

        const filteredUsers = users.filter(user => {
          // allow current user in edit mode
          if (modalType === "edit" && user.id === selectedUser?.id) return true;

          // remove users already added to this project
          return !existingInvestorUserIds.includes(Number(user.id));
        });

        setUserOptions(filteredUsers);
      }
    } catch (e) {
      console.log(e);
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
    setSelectedUser(null);
    setErrors({
      fullName: "",
      email: "",
      phoneNumber: "",
    });
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

    setSelectedUser({
      id: row.user_id,
      full_name: row.full_name,
      email: row.email,
      phone_number: row.phone_number,
    });
  };

  const closeModal = () => setShowModal(false);

  const validateEmail = (em) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(em).toLowerCase());

  const handleSave = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!fullName) {
      newErrors.fullName = lang("investor.full_name_required", "Full name is required");
    }

    if (!email) {
      newErrors.email = lang("investor.email_required", "Email is required");
    } else if (!validateEmail(email)) {
      newErrors.email = lang("investor.invalidEmail", "Invalid email");
    }

    if (!phoneNumber) {
      newErrors.phoneNumber = lang("investor.phone_number_required", "Phone number is required");
    }

    setErrors(newErrors);   // ALWAYS set errors

    if (Object.keys(newErrors).length > 0) return;  //  stop submit AFTER setting

    // ---- API CALL CONTINUES HERE ----
    setLoading(true);
    try {
      let res;
      const payload = {
        projectId: Number(projectId) ?? null,
        userId: selectedUser?.id || null,
        fullName,
        email,
        phoneNumber: phoneNumber || null,
        notes: notes || null,
        status,
        created_by: user?.id,
      };

      if (modalType === "add") {
        res = await apiPost("/api/investors", payload);
      } else {
        res = await apiPut(`/api/investors/${editId}`, payload);
      }

      if (res?.success) {
        showSuccessToast(lang("investor.saved", "Saved successfully"));
        closeModal();
        fetchInvestors();
      } else {
        showErrorToast(res.message || lang("common.error", "Error"));
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
      const res = await apiDelete(`/api/investors/${row.user_id}/${row.project_id}`);
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

  const projectHasInvestor = investors?.some(
    (inv) => Number(inv?.projects?.investor_id || 0) > 0
  );

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
    {
      accessorKey: "status",
      header: () => lang("common.status", "Status"),
      cell: ({ row }) => {
        const data = row.original;
        const project = data?.projects;

        const investorId = Number(project?.investor_id || project?.investorId || 0);
        const userId = Number(data?.user_id);

        const isActive = investorId === userId;
        const hasInvestor = investorId > 0;

        if (isActive) {
          return (
            <span className="badge bg-soft-success text-success">
              {lang("common.active", "Active")}
            </span>
          );
        }

        if (hasInvestor) return "-";

        return (
          <Button
            size="small"
            variant="contained"
            onClick={() => handleMarkInvestor(data)}
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
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">{lang("investor.investors", "Investors")}</h6>
        {!projectHasInvestor && (
          <Button
            variant="contained"
            onClick={openAdd}
            className="common-grey-color"
          >
            + {lang("investor.addInvestor", "Add Investor")}
          </Button>
        )}
      </div>

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
              <Autocomplete
                options={userOptions}
                getOptionLabel={(option) =>
                  `${option.full_name || ""} (${option.email || ""})`
                }
                value={selectedUser}
                onChange={(event, newValue) => {
                  setSelectedUser(newValue);

                  if (newValue) {
                    setFullName(newValue.full_name || "");
                    setEmail(newValue.email || "");
                    setPhoneNumber(newValue.phone_number || "");
                  }

                  setErrors(prev => ({
                    ...prev,
                    fullName: "",
                    email: "",
                    phoneNumber: "",
                  }));
                }}
                onInputChange={(e, value) => {
                  fetchUsers(value);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={lang("investor.selectFromUsers", "Select From Users")}
                    fullWidth
                  />
                )}
              />

              <TextField
                label={lang("investor.fullName", "Full Name")}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) {
                    setErrors(prev => ({ ...prev, fullName: "" }));
                  }
                }}
                required
                error={!!errors.fullName}
                helperText={errors.fullName}
                fullWidth
              />
              <TextField
                label={lang("investor.email", "Email")}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: "" }));
                  }
                }}
                required
                error={!!errors.email}
                helperText={errors.email}
                fullWidth
              />

              <TextField
                label={lang("investor.phone", "Phone Number")}
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (errors.phoneNumber) {
                    setErrors(prev => ({ ...prev, phoneNumber: "" }));
                  }
                }}
                required
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                fullWidth
              />

              <TextField label={lang("investor.notes", "Notes")} value={notes} onChange={e => setNotes(e.target.value)} fullWidth multiline minRows={3} />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={closeModal} color="error" className="custom-orange-outline">{lang("common.cancel", "Cancel")}</Button>
            <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : null} className="common-grey-color">
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