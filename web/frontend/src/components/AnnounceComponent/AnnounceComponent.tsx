import React, { useEffect, useState } from "react";
import {
  Badge,
  Box,
  IconButton,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import axios from "axios";

interface Announcement {
  id: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

const AnnounceComponent = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // API call khi component mount
  //   useEffect(() => {
  //     const fetchAnnouncements = async () => {
  //       try {
  //         const res = await axios.get("/api/announcements");
  //         console.log("API response:", res.data);
  //         setAnnouncements(res.data.data || []); // fallback nếu không có data
  //       } catch (err) {
  //         console.error("Failed to fetch announcements", err);
  //       }
  //     };

  //     fetchAnnouncements();
  //   }, []);
  useEffect(() => {
    // Fake delay để mô phỏng gọi API
    setTimeout(() => {
      const fakeData: Announcement[] = [
        {
          id: "1",
          message: "Hệ thống sẽ bảo trì vào lúc 22:00 hôm nay.",
          timestamp: "2025-04-30T09:00:00Z",
          isRead: false,
        },
        {
          id: "2",
          message: "Điểm danh tuần này đã được cập nhật.",
          timestamp: "2025-04-29T14:30:00Z",
          isRead: true,
        },
        {
          id: "3",
          message: "Bạn có lớp học mới vào thứ Hai tuần tới.",
          timestamp: "2025-04-28T16:00:00Z",
          isRead: false,
        },
      ];
      setAnnouncements(fakeData);
    }, 1000);
  }, []);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const unreadCount = announcements.filter(a => !a.isRead).length;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9999,
        }}
      >
        <Box
          sx={{
            backgroundColor: "#f5f5f5", // nền nhẹ để làm nổi
            borderRadius: "50%",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)", // tạo hiệu ứng nổi
            p: 0.5,
            transition: "transform 0.2s ease-in-out",
            "&:hover": {
              transform: "scale(1.1)", // phóng to nhẹ khi hover
            },
            display: "inline-block",
          }}
        >
          <IconButton color="primary" onClick={handleOpen}>
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Box>
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            width: {
              xs: "90vw",
              sm: 300,
              md: 360,
            },
            maxHeight: "60vh",
            overflowY: "auto",
            p: 2,
          },
        }}
      >
        <Typography variant="h6" fontWeight={600} gutterBottom>
          System Announcements
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <List>
          {announcements.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No announcements available.
            </Typography>
          ) : (
            announcements.map(item => (
              <ListItem key={item.id} alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemText
                  primary={item.message}
                  secondary={new Date(item.timestamp).toLocaleString()}
                />
              </ListItem>
            ))
          )}
        </List>
      </Popover>
    </Box>
  );
};

export default AnnounceComponent;
