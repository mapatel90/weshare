import React from "react";
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
  MenuItem,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { showErrorToast } from "@/utils/topTost";

const ContractModal = (props) => {
  const {
    open,
    onClose,
    modalType,
    lang,
    loading,
    contractTitle,
    setContractTitle,
    contractDescription,
    setContractDescription,
    documentUpload,
    setDocumentUpload,
    documentPreviewUrl,
    applyDocumentSelection,
    titleError,
    descriptionError,
    documentError,
    setTitleError,
    setDescriptionError,
    setDocumentError,
    contractDate,
    setContractDate,
    status,
    setStatus,
    partyType,
    setPartyType,
    selectedInvestor,
    setSelectedInvestor,
    selectedOfftaker,
    setSelectedOfftaker,
    investorList = [],
    offtakerList = {},
    onSubmit,
    showPartySelection = true,
    forcedParty = "",
    projectData = null,
  } = props;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit && onSubmit(e);
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
            {modalType === "edit"
              ? lang("contract.editContract", "Edit Contract")
              : lang("contract.addContract", "Add Contract")}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {/* Show radios only when adding AND showPartySelection is true.
                If adding but showPartySelection is false, render only the forcedParty dropdown. */}
            {modalType !== "edit" && showPartySelection ? (
              <Box sx={{ display: "flex", gap: 2 }}>
                <label style={{ display: "flex", gap: 8 }}>
                  <input
                    type="radio"
                    value="offtaker"
                    checked={partyType === "offtaker"}
                    onChange={() => {
                      setPartyType("offtaker");
                      setSelectedInvestor("");
                    }}
                  />
                  <span>{lang("contract.offtaker", "Offtaker")}</span>
                </label>
                <label style={{ display: "flex", gap: 8 }}>
                  <input
                    type="radio"
                    value="investor"
                    checked={partyType === "investor"}
                    onChange={() => {
                      setPartyType("investor");
                      setSelectedOfftaker("");
                      if (!Number(projectData?.investor_id)) {
                        showErrorToast(
                          lang("contract.assignAsInvestor", "Please assign as investor first")
                        );
                      }
                    }}
                  />
                  <span>{lang("contract.investor", "Investor")}</span>
                </label>
              </Box>
            ) : modalType !== "edit" && !showPartySelection ? (
              // Add mode but party selection is forced: show only the appropriate dropdown
              <Box>
                {forcedParty === "offtaker" ? (
                  <TextField
                    select
                    label={lang("contract.offtaker", "Offtaker")}
                    value={selectedOfftaker || offtakerList?.id || ""}
                    onChange={(e) => setSelectedOfftaker(e.target.value)}
                    fullWidth
                    disabled
                  >
                    {Array.isArray(offtakerList)
                      ? offtakerList.map((o) => (
                        <MenuItem key={o.id} value={o.id}>
                          {o.fullName || o.full_name || `#${o.id}`}
                        </MenuItem>
                      ))
                      : offtakerList && offtakerList.id ? (
                        <MenuItem key={offtakerList.id} value={offtakerList.id}>
                          {offtakerList.fullName || offtakerList.full_name || `#${offtakerList.id}`}
                        </MenuItem>
                      ) : null}
                  </TextField>
                ) : (
                  <TextField
                    select
                    label={lang("contract.investor", "Investor")}
                    value={selectedInvestor}
                    onChange={(e) => setSelectedInvestor(e.target.value)}
                    fullWidth
                    disabled
                  >
                    {investorList.map((item) => (
                      <MenuItem key={item.id} value={item.user_id}>
                        {item.full_name || `#${item.id}`}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </Box>
            ) : (
              // Edit mode: show only the appropriate dropdown (no radio)
              <Box>
                {partyType === "offtaker" ? (
                  <TextField
                    select
                    label={lang("contract.offtaker", "Offtaker")}
                    value={selectedOfftaker || offtakerList?.id || ""}
                    onChange={(e) => setSelectedOfftaker(e.target.value)}
                    fullWidth
                    disabled
                  >
                    {Array.isArray(offtakerList)
                      ? offtakerList.map((o) => (
                        <MenuItem key={o.id} value={o.id}>
                          {o.fullName || o.full_name || `#${o.id}`}
                        </MenuItem>
                      ))
                      : offtakerList && offtakerList.id ? (
                        <MenuItem key={offtakerList.id} value={offtakerList.id}>
                          {offtakerList.fullName || offtakerList.full_name || `#${offtakerList.id}`}
                        </MenuItem>
                      ) : null}
                  </TextField>
                ) : (
                  <TextField
                    select
                    label={lang("contract.investor", "Investor")}
                    value={selectedInvestor || ""}
                    onChange={(e) => setSelectedInvestor(e.target.value)}
                    fullWidth
                    disabled
                  >
                    {investorList.map((item) => (
                      <MenuItem key={item.id} value={item.user_id}>
                        {item.full_name || `#${item.id}`}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </Box>
            )}

            {/* Add mode: conditional dropdowns after selecting radio */}
            {modalType !== "edit" && showPartySelection && partyType === "offtaker" && (
              <TextField
                select
                label={lang("contract.offtaker", "Offtaker")}
                value={offtakerList?.id || ""}
                fullWidth
                disabled
              >
                {offtakerList && offtakerList.id ? (
                  <MenuItem key={offtakerList.id} value={offtakerList.id}>
                    {offtakerList.fullName || offtakerList.full_name || `#${offtakerList.id}`}
                  </MenuItem>
                ) : null}
              </TextField>
            )}

            {modalType !== "edit" && showPartySelection && partyType === "investor" && (
              <TextField
                select
                label={lang("contract.investor", "Investor")}
                value={selectedInvestor}
                onChange={(e) => setSelectedInvestor(e.target.value)}
                fullWidth
                disabled
              >
                {investorList.map((item) => (
                  <MenuItem key={item.id} value={item.user_id}>
                    {item.full_name || `#${item.id}`}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label={lang("contract.title", "Title")}
              value={contractTitle}
              onChange={(e) => {
                setContractTitle(e.target.value);
                if (titleError && e.target.value.trim() !== "") {
                  setTitleError && setTitleError("");
                }
              }}
              error={!!titleError}
              helperText={titleError}
              fullWidth
            />
            <TextField
              label={lang("contract.description", "Description")}
              value={contractDescription}
              onChange={(e) => {
                setContractDescription(e.target.value);
                if (descriptionError && e.target.value.trim() !== "") {
                  setDescriptionError && setDescriptionError("");
                }
              }}
              error={!!descriptionError}
              helperText={descriptionError}
              fullWidth
              multiline
              minRows={3}
            />
            <TextField
              fullWidth
              type="file"
              inputProps={{ accept: "application/pdf" }}
              label={lang("contract.uploadDocument") || "Upload Document"}
              InputLabelProps={{ shrink: true }}
              onChange={(e) => {
                const file = (e.target.files && e.target.files[0]) || null;
                applyDocumentSelection(file);
                if (!file) setDocumentUpload("");
                if (file) {
                  setDocumentError && setDocumentError("");
                }
              }}
              error={!!documentError}
              helperText={documentError}
            />
            {(documentPreviewUrl || documentUpload) && (
              <Box>
                {documentPreviewUrl &&
                  documentPreviewUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img
                    src={documentPreviewUrl}
                    alt="preview"
                    style={{
                      width: 160,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "1px solid #eee",
                    }}
                  />
                ) : (
                  <a
                    href={documentUpload || documentPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {lang("contract.viewDocument") || "View document"}
                  </a>
                )}
              </Box>
            )}
            <TextField
              label={lang("contract.date", "Contract Date")}
              type="date"
              value={contractDate}
              onChange={(e) => setContractDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            {/* {modalType == "edit" && (
              <TextField
                select
                label={lang("common.status", "Status")}
                value={status}
                onChange={(e) => setStatus(Number(e.target.value))}
                fullWidth
              >
                <MenuItem value={0}>
                  {lang("common.pending", "Pending")}
                </MenuItem>
                <MenuItem value={1}>{lang("common.approved", "Approved")}</MenuItem>
                <MenuItem value={2}>
                  {lang("common.rejected", "Rejected")}
                </MenuItem>
              </TextField>
            )} */}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} color="error" className="custom-orange-outline">
            {lang("common.cancel", "Cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : null}
            className="common-grey-color"
          >
            {loading ? lang("common.loading", "Loading...") : lang("common.save", "Save")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ContractModal;