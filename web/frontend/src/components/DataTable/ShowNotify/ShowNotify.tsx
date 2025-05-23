import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Divider,
  } from "@mui/material";
  import React from "react";
import { NotifyProps } from "../../../model/tableModels/tableDataModels.model";
  
  
  interface ShowNotifyProps {
    open: boolean;
    onClose: () => void;
    notifyData: NotifyProps;
  }
  
  export default function ShowNotify({
    open,
    onClose,
    notifyData,
  }: ShowNotifyProps) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle>Notification Detail</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Sender:
            </Typography>
            <Typography>{notifyData.sender}</Typography>
  
            <Divider />
  
            <Typography variant="subtitle2" color="textSecondary">
              Receivers:
            </Typography>
            <Typography>
              {notifyData.receiver}
            </Typography>
  
            <Divider />
  
            <Typography variant="subtitle2" color="textSecondary">
              Message:
            </Typography>
            <Typography>{notifyData.message}</Typography>
  
            <Divider />
  
            <Typography variant="subtitle2" color="textSecondary">
              Send Date:
            </Typography>
            <Typography>
              {new Date(notifyData.sendDate).toLocaleString()}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
  