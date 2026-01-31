import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button } from "@mui/material";

const TransactionDialog = ({
    open,
    onClose,
    onSubmit,
    txId,
    setTxId,
    selectedFile,
    setSelectedFile,
    errors = {},
    lang,
    showTxId = true,
    loading = false,
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{lang("payouts.add_details")}</DialogTitle>
            <DialogContent>
                {showTxId && (
                    <TextField
                        fullWidth
                        label={lang("payouts.enterTransactionId", "Enter Transaction ID")}
                        value={txId}
                        onChange={(e) => {
                            const value = e.target.value;
                            setTxId(value);
                            if (value) {
                                if (errors.transactionId) {
                                    // Remove only this field's error
                                    errors.transactionId = undefined;
                                }
                            }
                        }}
                        sx={{ mt: 1 }}
                        error={!!errors.transactionId}
                        helperText={errors.transactionId}
                    />
                )}

                <TextField
                    fullWidth
                    type="file"
                    inputProps={{ accept: "image/*" }}
                    label={lang("projects.uploadImage")}
                    InputLabelProps={{ shrink: true }}
                    onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedFile(file);
                        if (file) {
                            if (errors.document) {
                                errors.document = undefined;
                            }
                        }
                    }}
                    sx={{ mt: showTxId ? 3 : 1 }}
                    error={!!errors.document}
                    helperText={errors.document}
                />
                <DialogActions>
                    <Button onClick={onClose} color="error" variant="outlined" className="custom-orange-outline">
                        {lang("common.close")}
                    </Button>
                    <Button
                        variant="contained"
                        className="common-grey-color"
                        onClick={onSubmit}
                        disabled={loading}
                    >
                        {lang("payouts.save_mark_paid", "Save & Mark as Paid")}
                    </Button>
                </DialogActions>
            </DialogContent>
        </Dialog>
    );
};

export default TransactionDialog;
