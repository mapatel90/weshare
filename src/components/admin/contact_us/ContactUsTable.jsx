"use client";
import React, { useEffect, useMemo, useState } from "react";
import Table from "@/components/shared/table/Table";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiGet, apiPut, apiDelete } from "@/lib/api";
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
} from "@mui/material";

const ContactUsTable = () => {
  const { lang } = useLanguage();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // for view dialog
  const [editData, setEditData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await apiGet(`/api/contactus`);
      if (res?.success && Array.isArray(res?.data?.messages)) {
        setContacts(res.data.messages);
      } else {
        setContacts([]);
      }
    } catch (e) {
      // error handling if required
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(1);
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
      const res = await apiDelete(`/api/contactus/${id}`);
      if (res?.success) {
        showSuccessToast(lang("contactUs.deleted") || "Deleted successfully");
        fetchContacts();
      }
    } catch (e) {
      // noop
    }
  };

  const handleEdit = (item) => {
    setEditData({
      id: item.id,
      fullName: item.full_name,
      email: item.email,
      phoneNumber: item.phone_number || "",
      subject: item.subject,
      message: item.message,
    });
  };

  const handleCloseEdit = () => setEditData(null);

  const handleUpdateSubmit = async () => {
    if (!editData) return;

    try {
      setSubmitting(true);

      const res = await apiPut(`/api/contactus/${editData.id}`, {
        fullName: editData.fullName,
        email: editData.email,
        phoneNumber: editData.phoneNumber,
        subject: editData.subject,
        message: editData.message,
      });

      if (res?.success) {
        showSuccessToast(
          lang("contactUs.updated") || "Message updated successfully"
        );
        handleCloseEdit();
        fetchContacts();
      }
    } catch (e) {
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "full_name",
        header: () => lang("contactUs.fullNameTable") || "Full Name",
      },
      {
        accessorKey: "email",
        header: () => lang("contactUs.emailTable") || "Email",
      },
      {
        accessorKey: "phone_number",
        header: () => lang("contactUs.phoneTable") || "Phone",
      },
      {
        accessorKey: "subject",
        header: () => lang("contactUs.subject") || "Subject",
      },
      {
        accessorKey: "message",
        header: () => lang("contactUs.messageTable") || "Message",
        cell: ({ row }) => {
          const t = row.original.message || "";
          return t.length > 80 ? `${t.slice(0, 80)}…` : t;
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
              <FiEdit size={16} />
            </IconButton>

            <IconButton
              size="small"
              onClick={() => handleDelete(row.original.id)}
              sx={{ color: "#d32f2f" }}
            >
              <FiTrash2 size={16} />
            </IconButton>
          </Stack>
        ),
      },
    ],
    [lang, submitting]
  );

  return (
    <>
      <Table
        data={contacts}
        columns={columns}
        loading={loading}
        // optional: wire pagination controls to fetchContacts if Table exposes them
      />

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
          {lang("contactUs.details") || "Message Details"}
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
              {/* Full Name */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#666" }}
                >
                  {lang("contactUs.fullNameTable") || "Full Name"}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    mt: 0.3,
                  }}
                >
                  {selected.full_name}
                </Typography>
              </Box>

              {/* Email */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#666" }}
                >
                  {lang("contactUs.emailTable") || "Email"}
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

              {/* Phone */}
              {selected.phone_number && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: "#666" }}
                  >
                    {lang("contactUs.phoneTable") || "Phone"}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1rem",
                      fontWeight: 500,
                      mt: 0.3,
                    }}
                  >
                    {selected.phone_number}
                  </Typography>
                </Box>
              )}

              {/* Subject */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#666" }}
                >
                  {lang("contactUs.subject") || "Subject"}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    mt: 0.3,
                  }}
                >
                  {selected.subject}
                </Typography>
              </Box>

              {/* Message */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#666" }}
                >
                  {lang("contactUs.messageTable") || "Message"}
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

        <DialogActions
          sx={{
            px: 3,
            py: 1.5,
            borderTop: "1px solid #e0e0e0",
          }}
        >
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

      <Dialog
        open={!!editData}
        onClose={handleCloseEdit}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Message</DialogTitle>
        <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
          <TextField
            label={lang("contactUs.fullNameTable") || "Full Name"}
            value={editData?.fullName || ""}
            onChange={(e) =>
              setEditData({ ...editData, fullName: e.target.value })
            }
            fullWidth
          />

          <TextField
            label={lang("contactUs.emailTable") || "Email"}
            value={editData?.email || ""}
            onChange={(e) =>
              setEditData({ ...editData, email: e.target.value })
            }
            fullWidth
          />

          <TextField
            label={lang("contactUs.phoneTable") || "Phone"}
            value={editData?.phoneNumber || ""}
            onChange={(e) =>
              setEditData({ ...editData, phoneNumber: e.target.value })
            }
            fullWidth
          />

          <TextField
            label={lang("contactUs.subject") || "Subject"}
            value={editData?.subject || ""}
            onChange={(e) =>
              setEditData({ ...editData, subject: e.target.value })
            }
            fullWidth
          />

          <TextField
            label={lang("contactUs.messageTable") || "Message"}
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
          >
            {lang("common.cancel") || "Cancel"}
          </Button>
          <Button
            onClick={handleUpdateSubmit}
            variant="contained"
            disabled={submitting}
            className="common-grey-color"
          >
            {lang("common.update") || "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ContactUsTable;
