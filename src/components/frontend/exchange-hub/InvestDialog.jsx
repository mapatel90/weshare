import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";

const InvestDialog = ({
  open,
  onClose,
  lang,
  submitting,
  fullName,
  setFullName,
  email,
  setEmail,
  phone,
  setPhone,
  notes,
  setNotes,
  onSubmit,
}) => {
  return (
    <Dialog
      open={!!open}
      onClose={onClose}
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
          fontSize: "1.1rem",
          borderBottom: "1px solid #e0e0e0",
          pb: 1,
        }}
      >
        {lang("home.exchangeHub.investNow") || "Invest Now"}
      </DialogTitle>

      <form onSubmit={onSubmit}>
        <DialogContent
          dividers
          sx={{
            background: "#fafafa",
            px: 3,
            py: 3,
            display: "grid",
            gap: 2,
          }}
        >
          <TextField
            label={lang("contactUs.fullNameTable") || "Full Name"}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label={lang("contactUs.emailTable") || "Email"}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label={lang("contactUs.phoneTable") || "Phone"}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label={lang("home.exchangeHub.notes") || "Notes"}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5, borderTop: "1px solid #e0e0e0" }}>
          <Button
            onClick={onClose}
            className="custom-orange-outline"
            variant="outlined"
            disabled={submitting}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            {lang("common.cancel") || "Cancel"}
          </Button>
          <Button
            type="submit"
            className="common-grey-color"
            variant="contained"
            disabled={submitting}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            {submitting
              ? lang("home.exchangeHub.submitting") || "Submitting..."
              : lang("home.exchangeHub.submit") || "Submit"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default InvestDialog;


