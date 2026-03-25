// components/ConfirmDialog.tsx
import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, title, message, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title || "Confirm Delete"}</DialogTitle>
      <DialogContent>{message || "Are you sure you want to delete this item?"}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">Delete</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
