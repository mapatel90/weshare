"use client";
import React, { useState, useEffect } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { showSuccessToast, showErrorToast } from "@/utils/topTost";
import {
  Box,
  TextField,
  Typography,
  Checkbox,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import { FiArrowLeft, FiSave, FiHelpCircle } from "react-icons/fi";
import { useDarkMode } from "@/utils/common";

// Capability labels for display
const CAPABILITY_LABELS = {
  view_own: "View (Own)",
  view_global: "View(Global)",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  view_all_templates: "View All Templates",
};

const RolePermissions = ({ roleId }) => {
  const { lang } = useLanguage();
  const isDark = useDarkMode();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState(null);
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState({});

  // Fetch role and permissions
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await apiGet(`/api/roles/permissions/${roleId}`);
      if (response.success) {
        setRole(response.data.role);
        setModules(response.data.modules);
        setPermissions(response.data.permissions || {});
      } else {
        showErrorToast(response.message || "Failed to load permissions");
        router.push("/admin/settings/role");
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      showErrorToast("Failed to load permissions");
      router.push("/admin/settings/role");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleId) {
      fetchPermissions();
    }
  }, [roleId]);

  // Handle checkbox change
  const handlePermissionChange = (module, capability, checked) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...(prev[module] || {}),
        [capability]: checked,
      },
    }));
  };

  // Save permissions
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiPut(`/api/roles/permissions/${roleId}`, {
        permissions,
      });
      if (response.success) {
        showSuccessToast(lang("roles.permissionsUpdated") || "Permissions updated successfully");
      } else {
        showErrorToast(response.message || "Failed to update permissions");
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      showErrorToast("Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  // Go back to role list
  const handleBack = () => {
    router.push("/admin/settings/role");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={handleBack} sx={{ color: "#666" }}>
            <FiArrowLeft size={20} />
          </IconButton>
          <Typography variant="h5" fontWeight={600}>
            {lang("roles.managePermissions") || "Manage Permissions"}
          </Typography>
        </Box>
        {/* <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : <FiSave />}
          className="common-grey-color"
          sx={{ minWidth: 120 }}
        >
          {saving ? (lang("common.saving") || "Saving...") : (lang("common.save") || "Save")}
        </Button> */}
      </Box>

      {/* Role Name Field */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: isDark ? "#121a2d" : "#fff" }}>
        <Typography
          variant="body2"
          color={isDark ? "#ea4d4d" : "#ea4d4d"}
          sx={{ mb: 1, fontWeight: 500 }}
        >
          * {lang("roles.roleName") || "Role Name"}
        </Typography>
        <TextField
          value={role?.name || ""}
          disabled
          fullWidth
          size="small"
          sx={{
            "& .MuiInputBase-input.Mui-disabled": {
              WebkitTextFillColor: isDark ? "#ffffff" : "#333",
              backgroundColor: isDark ? "#121a2d" : "#f5f5f5",
            },
          }}
        />
      </Paper>

      {/* Permissions Table */}
      <TableContainer component={Paper} sx={{ backgroundColor: isDark ? "#121a2d" : "#fff" }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: isDark ? "#121a2d" : "#f8f9fa" }}>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  color: isDark ? "#ffffff" : "#333",
                  borderBottom: "2px solid #dee2e6",
                  width: "30%",
                }}
              >
                {lang("roles.features") || "Features"}
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  color: isDark ? "#ffffff" : "#333",
                  borderBottom: "2px solid #dee2e6",
                }}
              >
                {lang("roles.capabilities") || "Capabilities"}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modules.map((moduleConfig) => (
              <TableRow
                key={moduleConfig.module}
                sx={{
                  "&:hover": { backgroundColor: isDark ? "#121a2d" : "#f8f9fa" },
                  borderBottom: "1px solid #e9ecef",
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: 500,
                    color: isDark ? "#ffffff" : "#333",
                    verticalAlign: "top",
                    pt: 2,
                  }}
                >
                  {moduleConfig.label}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {moduleConfig.capabilities.map((capability) => (
                      <Box
                        key={capability}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Checkbox
                          checked={
                            permissions[moduleConfig.module]?.[capability] || false
                          }
                          onChange={(e) =>
                            handlePermissionChange(
                              moduleConfig.module,
                              capability,
                              e.target.checked
                            )
                          }
                          size="small"
                          sx={{
                            color: isDark ? "#ffffff" : "#adb5bd",
                            "&.Mui-checked": {
                              color: "#1976d2",
                            },
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ color: isDark ? "#ffffff" : "#495057", cursor: "pointer" }}
                          onClick={() =>
                            handlePermissionChange(
                              moduleConfig.module,
                              capability,
                              !permissions[moduleConfig.module]?.[capability]
                            )
                          }
                        >
                          {capability}
                        </Typography>
                        {capability === "view_own" && (
                          <Tooltip title="User can only view records they created or are assigned to">
                            <IconButton size="small" sx={{ ml: 0.5, color: isDark ? "#ffffff" : "#adb5bd" }}>
                              <FiHelpCircle size={14} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Save Button at Bottom */}
      {/* Sticky Save / Cancel Bar */}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 10,
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          borderTop: "1px solid",
          borderColor: isDark ? "#1e293b" : "#e5e7eb",
          p: 2,
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          onClick={handleBack}
          className="custom-orange-outline"
        >
          {lang("common.cancel") || "Cancel"}
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : <FiSave />}
          className="common-grey-color"
          sx={{ minWidth: 120 }}
        >
          {saving ? (lang("common.saving") || "Saving...") : (lang("common.save") || "Save")}
        </Button>
      </Box>

    </Box>
  );
};

export default RolePermissions;

