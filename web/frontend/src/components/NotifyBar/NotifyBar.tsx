import React, { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Slide from "@mui/material/Slide";
import { Box, Paper, Typography, IconButton, Avatar } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import "./NotifyBar.scss";

type NotifyProps = {
  notifyType: "success" | "info" | "warning" | "error";
  notifyContent: string;
  duration?: number; // ms, mặc định là 3000ms
  notifyID: number;
  title?: string;
  sender?: string;
};

export default function NotifyBar({
  notifyType,
  notifyContent,
  duration = 3000,
  notifyID = 0,
  title,
  sender
}: NotifyProps) {
  const [open, setOpen] = useState(true);
  
  useEffect(() => {
    setOpen(true); // reset để hiện lại mỗi khi nội dung thay đổi
    const timer = setTimeout(() => {
      setOpen(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [notifyContent, duration, notifyID]);

  const handleClose = () => {
    setOpen(false);
  };

  const getIcon = () => {
    switch(notifyType) {
      case "success":
        return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
      case "info":
        return <InfoIcon sx={{ color: '#2196f3' }} />;
      case "warning":
        return <WarningIcon sx={{ color: '#ff9800' }} />;
      case "error":
        return <ErrorIcon sx={{ color: '#f44336' }} />;
      default:
        return <InfoIcon sx={{ color: '#2196f3' }} />;
    }
  };

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const getAvatarColor = (type: string) => {
    switch(type) {
      case "success": return "#4caf50";
      case "info": return "#2196f3";
      case "warning": return "#ff9800";
      case "error": return "#f44336";
      default: return "#2196f3";
    }
  };

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Box
        className="notify-bar-container"
      >
        <Paper elevation={3} className="notify-bar-paper">
          <Box className="notify-bar-content">
            {sender ? (
              <Avatar 
                className="notify-avatar"
                sx={{ bgcolor: getAvatarColor(notifyType) }}
              >
                {getInitial(sender)}
              </Avatar>
            ) : (
              <Box className="notify-icon">
                {getIcon()}
              </Box>
            )}
            
            <Box className="notify-text">
              {title && (
                <Typography variant="subtitle2" className="notify-title">
                  {title}
                </Typography>
              )}
              <Typography variant="body2" className="notify-message">
                {notifyContent}
              </Typography>
            </Box>
            
            <IconButton 
              size="small" 
              className="notify-close"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      </Box>
    </Slide>
  );
}
