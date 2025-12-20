"use client";
import React, { useEffect, useMemo, useState } from "react";
import Table from "@/components/shared/table/Table";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet, apiDelete, apiPut } from "@/lib/api";
import { showSuccessToast } from "@/utils/topTost";
import Swal from "sweetalert2";
import { FiTrash2, FiEye, FiEdit } from "react-icons/fi";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Stack,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";

const LeaseTable = () => {
  const { lang } = useLanguage();

  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal state & lists
  const [editData, setEditData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const fetchLeases = async () => {
    try {
      setLoading(true);
      const res = await apiGet(`/api/lease`);
      if (res?.success && Array.isArray(res?.data)) {
        setLeases(res.data);
      } else {
        setLeases([]);
      }
    } catch (e) {
      setLeases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeases();
  }, []);

  const handleView = (item) => {
    setSelected(item);
  };

  const handleCloseDialog = () => {
    setSelected(null);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: lang("messages.confirmDelete") || "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: lang("common.yesDelete") || "Yes, delete it!",
      cancelButtonText: lang("common.cancel") || "Cancel",
    });
    if (!result.isConfirmed) return;
    try {
      setDeleting(true);
      const res = await apiDelete(`/api/lease/${id}`);
      if (res?.success) {
        showSuccessToast(
          lang("leaseRequest.deleted") || "Deleted successfully"
        );
        fetchLeases();
      }
    } catch (e) {
      // noop
    } finally {
      setDeleting(false);
    }
  };

  // fetch option lists (assumes these endpoints exist)
  const fetchCountries = async () => {
    try {
      setLoadingOptions(true);
      const res = await apiGet("/api/locations/countries");
      if (res?.success && Array.isArray(res?.data)) setCountries(res.data);
      else setCountries([]);
    } catch (e) {
      setCountries([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchStates = async (countryId) => {
    if (!countryId) return setStates([]);
    try {
      setLoadingOptions(true);
      const res = await apiGet(`/api/locations/countries/${countryId}/states`);
      if (res?.success && Array.isArray(res?.data)) setStates(res.data);
      else setStates([]);
    } catch (e) {
      setStates([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchCities = async (stateId) => {
    if (!stateId) return setCities([]);
    try {
      setLoadingOptions(true);
      const res = await apiGet(`/api/locations/states/${stateId}/cities`);
      if (res?.success && Array.isArray(res?.data)) setCities(res.data);
      else setCities([]);
    } catch (e) {
      setCities([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleEdit = async (item) => {
    // prepare edit payload
    const payload = {
      id: item.id,
      fullName: item.full_name || "",
      email: item.email || "",
      phoneNumber: item.phone_number || "",
      countryId: item.country_id || (item.countries ? item.countries.id : null),
      stateId: item.state_id || (item.states ? item.states.id : null),
      cityId: item.city_id || (item.cities ? item.cities.id : null),
      address: item.address || "",
      subject: item.subject || "",
      message: item.message || "",
    };

    setEditData(payload);
    // load options for dropdowns and dependent lists
    await fetchCountries();
    if (payload.countryId) await fetchStates(payload.countryId);
    if (payload.stateId) await fetchCities(payload.stateId);
  };

  const handleCloseEdit = () => {
    setEditData(null);
    setCountries([]);
    setStates([]);
    setCities([]);
  };

  const handleUpdateSubmit = async () => {
    if (!editData) return;
    try {
      setSubmitting(true);
      const res = await apiPut(`/api/lease/${editData.id}`, {
        fullName: editData.fullName,
        email: editData.email,
        phoneNumber: editData.phoneNumber || null,
        countryId: editData.countryId ? Number(editData.countryId) : null,
        stateId: editData.stateId ? Number(editData.stateId) : null,
        cityId: editData.cityId ? Number(editData.cityId) : null,
        address: editData.address || null,
        subject: editData.subject || null,
        message: editData.message,
      });
      if (res?.success) {
        showSuccessToast(
          lang("leaseRequest.updated") || "Updated successfully"
        );
        handleCloseEdit();
        fetchLeases();
      }
    } catch (e) {
      // noop or show error
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "full_name",
        header: () => lang("leaseRequest.fullNameTable") || "Full Name",
      },
      {
        accessorKey: "email",
        header: () => lang("leaseRequest.emailTable") || "Email",
      },
      {
        accessorKey: "phone_number",
        header: () => lang("leaseRequest.phoneTable") || "Phone",
      },
      {
        accessorKey: "address",
        header: () => lang("leaseRequest.Address") || "Address",
        // cell: ({ row }) => {
        //   const addr = row.original.address || "";
        //   const parts = [addr];
        //   if (row.original.cityId) parts.push(`City:${row.original.cityId}`);
        //   if (row.original.stateId) parts.push(`State:${row.original.stateId}`);
        //   if (row.original.countryId) parts.push(`Country:${row.original.countryId}`);
        //   return parts.filter(Boolean).join(" • ");
        // },
      },
      {
        accessorKey: "subject",
        header: () => lang("leaseRequest.subject") || "Subject",
      },
      {
        accessorKey: "message",
        header: () => lang("leaseRequest.messageTable") || "Message",
        cell: ({ row }) => {
          const t = row.original.message || "";
          return t.length > 80 ? `${t.slice(0, 80)}…` : t;
        },
      },
      {
        accessorKey: "location",
        header: () => lang("leaseRequest.location") || "Location",
        cell: ({ row }) => {
          const parts = [];
          if (row.original.cities) parts.push(row.original.cities.name);
          if (row.original.states) parts.push(row.original.states.name);
          if (row.original.countries) parts.push(row.original.countries.name);
          return parts.length > 0 ? parts.join(", ") : "-";
        },
      },
      {
        accessorKey: "actions",
        header: () => lang("common.actions") || "Actions",
        meta: { disableSort: true },
        cell: ({ row }) => (
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              onClick={() => handleView(row.original)}
              sx={{ color: "#1976d2" }}
            >
              <FiEye size={16} />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => handleEdit(row.original)}
              sx={{ color: "#1976d2" }}
            >
              {/* reuse edit icon visually - FiEye kept for minimal imports; replace with FiEdit if desired */}
              <FiEdit size={16} />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => handleDelete(row.original.id)}
              sx={{ color: "#d32f2f" }}
              disabled={deleting}
            >
              <FiTrash2 size={16} />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [lang, deleting]
  );

  return (
    <>
      <Box sx={{ maxHeight: "60vh", overflowY: "auto" }}>
        <Table data={leases} columns={columns} loading={loading} />
      </Box>

      <Dialog
        open={!!selected}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1.25rem",
            borderBottom: "1px solid #e0e0e0",
            pb: 1.5,
          }}
        >
          {lang("leaseRequest.details") || "Lease Request Details"}
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            background: "#fafafa",
            px: 3,
            py: 3,
          }}
        >
          {selected && (
            <Box
              sx={{
                display: "grid",
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#666" }}
                >
                  {lang("leaseRequest.fullNameTable") || "Full Name"}
                </Typography>
                <Typography sx={{ fontSize: "1rem", fontWeight: 600, mt: 0.3 }}>
                  {selected.full_name}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#666" }}
                >
                  {lang("leaseRequest.emailTable") || "Email"}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    mt: 0.3,
                    color: "#1976d2",
                  }}
                >
                  {selected.email}
                </Typography>
              </Box>

              {selected.phone_number && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: "#666" }}
                  >
                    {lang("leaseRequest.phoneTable") || "Phone"}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "1rem", fontWeight: 500, mt: 0.3 }}
                  >
                    {selected.phone_number}
                  </Typography>
                </Box>
              )}

              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#666" }}
                >
                  {lang("leaseRequest.Address") || "Address"}
                </Typography>
                <Typography sx={{ fontSize: "1rem", fontWeight: 500, mt: 0.3 }}>
                  {selected.address || "-"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#666" }}
                >
                  {lang("leaseRequest.subject") || "Subject"}
                </Typography>
                <Typography sx={{ fontSize: "1rem", fontWeight: 500, mt: 0.3 }}>
                  {selected.subject || "-"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#666" }}
                >
                  {lang("leaseRequest.location") || "Location"}
                </Typography>
                <Typography sx={{ fontSize: "1rem", fontWeight: 500, mt: 0.3 }}>
                  {[
                    selected.cities ? selected.cities.name : null,
                    selected.states ? selected.states.name : null,
                    selected.countries ? selected.countries.name : null,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#666" }}
                >
                  {lang("leaseRequest.messageTable") || "Message"}
                </Typography>
                <Box
                  sx={{
                    mt: 0.5,
                    background: "#fff",
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                    minHeight: "90px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selected.message}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5, borderTop: "1px solid #e0e0e0" }}>
          <Button
            onClick={handleCloseDialog}
            variant="contained"
            sx={{
              background: "#424242",
              "&:hover": { background: "#333" },
              borderRadius: 2,
              textTransform: "none",
              px: 3,
            }}
          >
            {lang("common.close") || "Close"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Lease Dialog (similar to ContactUs edit modal + country/state/city dropdowns) */}
      <Dialog
        open={!!editData}
        onClose={handleCloseEdit}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {lang("leaseRequest.edit") || "Edit Lease Request"}
        </DialogTitle>
        <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
          <TextField
            label={lang("leaseRequest.fullNameTable") || "Full Name"}
            value={editData?.fullName || ""}
            onChange={(e) =>
              setEditData({ ...editData, fullName: e.target.value })
            }
            fullWidth
          />

          <TextField
            label={lang("leaseRequest.emailTable") || "Email"}
            value={editData?.email || ""}
            onChange={(e) =>
              setEditData({ ...editData, email: e.target.value })
            }
            fullWidth
          />

          <TextField
            label={lang("leaseRequest.phoneTable") || "Phone"}
            value={editData?.phoneNumber || ""}
            onChange={(e) =>
              setEditData({ ...editData, phoneNumber: e.target.value })
            }
            fullWidth
          />

          <TextField
            label={lang("leaseRequest.Address") || "Address"}
            value={editData?.address || ""}
            onChange={(e) =>
              setEditData({ ...editData, address: e.target.value })
            }
            fullWidth
          />

          <Box sx={{ display: "flex", gap: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="country-select-label">
                {lang("projects.country", "Country")}
              </InputLabel>
              <Select
                label={lang("projects.country", "Country")}
                value={editData?.countryId ?? ""}
                onChange={async (e) => {
                  const countryId = e.target.value || null;
                  setEditData({
                    ...editData,
                    countryId,
                    stateId: null,
                    cityId: null,
                  });
                  await fetchStates(countryId);
                  setCities([]);
                }}
                displayEmpty
                fullWidth
              >
                <MenuItem value="">
                  {lang("common.selectCountry") || "Select country"}
                </MenuItem>
                {countries.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="state-select-label">
                {lang("projects.state", "State")}
              </InputLabel>
              <Select
                label={lang("projects.state", "State")}
                value={editData?.stateId ?? ""}
                onChange={async (e) => {
                  const stateId = e.target.value || null;
                  setEditData({ ...editData, stateId, cityId: null });
                  await fetchCities(stateId);
                }}
                displayEmpty
                fullWidth
              >
                <MenuItem value="">
                  {lang("common.selectState") || "Select state"}
                </MenuItem>
                {states.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="city-select-label">
                {lang("projects.city", "City")}
              </InputLabel>
              <Select
                label={lang("projects.city", "City")}
                value={editData?.cityId ?? ""}
                onChange={(e) =>
                  setEditData({ ...editData, cityId: e.target.value || null })
                }
                displayEmpty
                fullWidth
              >
                <MenuItem value="">
                  {lang("common.selectCity") || "Select city"}
                </MenuItem>
                {cities.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            label={lang("leaseRequest.subject") || "Subject"}
            value={editData?.subject || ""}
            onChange={(e) =>
              setEditData({ ...editData, subject: e.target.value })
            }
            fullWidth
          />

          <TextField
            label={lang("leaseRequest.messageTable") || "Message"}
            multiline
            rows={4}
            value={editData?.message || ""}
            onChange={(e) =>
              setEditData({ ...editData, message: e.target.value })
            }
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseEdit}
            variant="outlined"
            className="custom-orange-outline"
            sx={{ textTransform: "none" }}
          >
            {lang("common.cancel") || "Cancel"}
          </Button>
          <Button
            onClick={handleUpdateSubmit}
            variant="contained"
            className="common-grey-color"
            disabled={submitting}
            sx={{ textTransform: "none" }}
          >
            {lang("common.update") || "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LeaseTable;
