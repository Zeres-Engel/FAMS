import React, { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Slide from "@mui/material/Slide";
import { Box } from "@mui/material";

type NotifyProps = {
  notifyType: "success" | "info" | "warning" | "error";
  notifyContent: string;
  duration?: number; // ms, mặc định là 3000ms,
  notifyID: number
};

export default function NotifyBar({
  notifyType,
  notifyContent,
  duration = 3000,
  notifyID=0,
}: NotifyProps) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    setOpen(true); // reset để hiện lại mỗi khi nội dung thay đổi
    const timer = setTimeout(() => {
      setOpen(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [notifyContent, duration,notifyID]);

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: "fixed",
          bottom: { xs: 16, sm: 24 },
          left: { xs: 16, sm: 24 },
          zIndex: 9999,
          width: { xs: "90%", sm: "auto" },
        }}
      >
        <Stack spacing={1}>
          <Alert
            variant="filled"
            severity={notifyType}
            sx={{
              width: "100%",
              minWidth: "250px",
              maxWidth: "400px",
            }}
          >
            {notifyContent}
          </Alert>
        </Stack>
      </Box>
    </Slide>
  );
}
