"use client";
import React, { useState, useEffect } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiTrash2, FiEdit3, FiPlus } from "react-icons/fi";
import Table from "@/components/shared/table/Table";
import RoleHeaderSetting from "./RoleHeader";
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

const RoleTable = () => {
  const { lang } = useLanguage();
  const [rolesData, setRolesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [modalMode, setModalMode] = useState(null);
  const [roleName, setRoleName] = useState("");
  const [status, setStatus] = useState("");
  const [editingRole, setEditingRole] = useState(null);
  const [error, setError] = useState("");

  /** ✅ Fetch all roles */
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await apiGet("/api/roles/");
      if (response.success && response.data.roles) {
        setRolesData(response.data.roles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  /** ✅ Open Add Modal */
  const handleAdd = () => {
    setModalMode("add");
    setRoleName("");
    setStatus("");
    setEditingRole(null);
    setError("");
  };

  /** ✅ Open Edit Modal */
  const handleEdit = (role) => {
    setModalMode("edit");
    setEditingRole(role);
    setRoleName(role.name);
    setStatus(role.status.toString());
    setError("");
  };

  /** ✅ Close Modal */
  const handleClose = () => {
    setModalMode(null);
    setRoleName("");
    setStatus("");
    setEditingRole(null);
    setError("");
  };

  /** ✅ Add / Update Role */
  const handleSubmit = async () => {
    if (!roleName.trim()) {
      setError(lang("roles.roleNameRequired") || "Role name is required");
      return;
    }

    try {
      let response;
      if (modalMode === "add") {
        response = await apiPost("/api/roles/", {
          name: roleName,
          status: status === "" ? 1 : parseInt(status),
        });
      } else {
        response = await apiPut(`/api/roles/${editingRole.id}`, {
          name: roleName,
          status: parseInt(status),
        });
      }

      if (response.success) {
        showSuccessToast(
          modalMode === "add"
            ? lang("roles.createdSuccessfully") || "Role created successfully"
            : lang("roles.updatedSuccessfully") || "Role updated successfully"
        );
        handleClose();
        fetchRoles(); // refresh table
      } else {
        setError(response.message || "Something went wrong");
      }
    } catch (err) {
      console.error("Role save error:", err);
      setError("Server error");
    }
  };

  /** ✅ Delete Role */
  const handleDelete = async (roleId) => {
    const result = await Swal.fire({
      title: lang("messages.confirmDelete") || "Are you sure you want to delete this role?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: lang("common.yesDelete") || "Yes, delete it!",
      cancelButtonText: lang("common.cancel") || "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      const response = await apiDelete(`/api/roles/${roleId}`);
      if (response.success) {
        showSuccessToast(lang("roles.deletedSuccessfully") || "Role deleted successfully");
        fetchRoles();
      } else {
        alert(response.message || "Failed to delete role");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      alert("Failed to delete role");
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  /** ✅ Table Columns */
  const columns = [
    {
      accessorKey: "name",
      header: () => lang("roles.roleName"),
      cell: (info) => {
        const roleName = info.getValue();
        return (
          <div className="hstack gap-3">
            <div className="text-white avatar-text user-avatar-text avatar-md">
              {roleName?.substring(0, 1)}
            </div>
            <div>
              <span className="fw-semibold">{roleName}</span>
              <small className="fs-12 text-muted d-block">
                {lang("roles.roleManagement")}
              </small>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => lang("common.status"),
      cell: (info) => {
        const status = info.getValue();
        const config = {
          1: { label: lang("common.active"), color: "#17c666" },
          0: { label: lang("common.inactive"), color: "#ea4d4d" },
        }[status] || { label: "Unknown", color: "#999" };

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
      header: () => lang("table.actions"),
      cell: (info) => {
        const row = info.row.original;
        return (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
            <IconButton
              size="small"
              onClick={() => handleEdit(row)}
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
              onClick={() => handleDelete(row.id)}
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
        );
      },
     meta: { disableSort: true },
    },
  ];

  /** ✅ Loader */
  // Commented out - using global loader instead
  // if (loading) {
  //   return (
  //     <div className="text-center py-5">
  //       <div className="spinner-border text-primary" role="status">
  //         <span className="visually-hidden">Loading...</span>
  //       </div>
  //     </div>
  //   );
  // }

  /** ✅ Render */

  return (
    <>
      {/* Table */}
      <div className="content-area" data-scrollbar-target="#psScrollbarInit">
        {/* Header with Add Role button triggers modal */}
        <RoleHeaderSetting onAddRole={handleAdd} isSubmitting={false} />

        <div className="content-area-body">
          <div className="card-body">
            <Table data={rolesData} columns={columns} />
          </div>
        </div>
      </div>

      <Dialog
        open={!!modalMode}
        onClose={handleClose}
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
            {modalMode === "add"
              ? lang("roles.addRole")
              : `${lang("common.edit")} ${lang("roles.role")}`}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={handleClose}
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
              label={lang("roles.role")}
              placeholder={lang("roles.roleName")}
              value={roleName}
              onChange={(e) => {
                setRoleName(e.target.value);
                if (error) setError("");
              }}
              error={!!error}
              helperText={error}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel id="role-status-select-label">{lang("common.status")}</InputLabel>
              <Select
                labelId="role-status-select-label"
                value={status}
                label={lang("common.status")}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="">{lang("roles.selectStatus")}</MenuItem>
                <MenuItem value="1">{lang("common.active")}</MenuItem>
                <MenuItem value="0">{lang("common.inactive")}</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} color="error" variant="outlined">
            {lang("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {modalMode === "add" ? lang("common.save") : lang("common.update")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RoleTable;
