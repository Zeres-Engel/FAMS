import React, { useState } from "react";
import LayoutComponent from "../../components/Layout/Layout";
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  Avatar,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import useClassPageHook from "./useClassPageHook";
import { useTheme } from "@mui/material/styles";
import SchoolIcon from "@mui/icons-material/School";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";

function ClassPage(): React.JSX.Element {
  const { state, handler } = useClassPageHook();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const selectedStudents = state.classPageData;

  const handleSelectClass = (classId: number) => {
    setSelectedClassId(classId);
    handler.setFiltersClassPage(classId);
  };

  return (
    <LayoutComponent pageHeader="Class Page">
      <Box
        sx={{
          height: isMobile ? "auto" : "calc(85vh - 80px)",
          overflow: isMobile ? "visible" : "hidden",
        }}
      >
        <Container maxWidth="xl" sx={{ height: "100%", py: 2 }}>
          <Box
            display="flex"
            flexDirection={isMobile ? "column" : "row"}
            height="100%"
            gap={2}
          >
            {/* LEFT SIDEBAR */}
            <Box
              width={isMobile ? "100%" : "28%"}
              height={isMobile ? "auto" : "100%"}
              borderRadius={3}
              display="flex"
              flexDirection="column"
              sx={{
                bgcolor: "#ffffff",
                border: "1px solid #e0e0e0",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              {/* HEADER STICKY */}
              <Box
                px={2}
                py={1.5}
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  bgcolor: "#ffffff",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                <Box display="flex" alignItems="center">
                  <SchoolIcon fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight={500}>
                    Homeroom Teachers
                  </Typography>
                </Box>
              </Box>

              {/* LIST SCROLLABLE */}
              <Box
                flex={1}
                px={2}
                py={2}
                sx={{
                  overflowY: "auto",
                  scrollbarWidth: "thin",
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "#f0f0f0",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#bdbdbd",
                    borderRadius: "4px",
                    "&:hover": {
                      backgroundColor: "#9e9e9e",
                    },
                  },
                }}
              >
                <Stack spacing={1.2}>
                  {state.hoomroomTeacherList.map((cls, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      onClick={() => handleSelectClass(cls.classId)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        cursor: "pointer",
                        bgcolor:
                          cls.classId === selectedClassId
                            ? theme.palette.primary.light
                            : "#fdfdfd",
                        border: `1px solid ${
                          cls.classId === selectedClassId
                            ? theme.palette.primary.main
                            : "#ccc"
                        }`,
                        transition: "all 0.2s",
                        "&:hover": {
                          scale: "102%",
                          bgcolor: "primary.50",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                          borderColor: theme.palette.primary.main,
                        },
                      }}
                    >
                      <Typography fontWeight={500} fontSize="0.95rem">
                        {cls.className}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontStyle="italic"
                        mt={0.5}
                      >
                        {cls.homeroomTeacherId || "Updating..."}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Box>

            {/* RIGHT CONTENT */}
            <Box
              flex={1}
              height={isMobile ? "auto" : "100%"}
              display="flex"
              flexDirection="column"
              sx={{
                bgcolor: "#ffffff",
                borderRadius: 3,
                border: "1px solid #e0e0e0",
                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
              }}
            >
              {/* HEADER CỐ ĐỊNH */}
              <Box
                px={2}
                py={1.5}
                sx={{
                  position: "sticky",
                  top: 0,
                  bgcolor: "#ffffff",
                  zIndex: 10,
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                <Typography variant="h6" fontWeight={500}>
                  Students in Class
                </Typography>
              </Box>

              <Box
                flex={1}
                overflow="auto"
                px={2}
                py={2}
                sx={{
                  overflowY: "auto",
                  scrollbarWidth: "thin",
                  "&::-webkit-scrollbar": {
                    width: "6px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "#f0f0f0",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#bdbdbd",
                    borderRadius: "4px",
                    "&:hover": {
                      backgroundColor: "#9e9e9e",
                    },
                  },
                }}
              >
                {selectedStudents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Please select a class to see students.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {selectedStudents.map((student, idx) => (
                      <Paper
                        key={idx}
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          border: "1px solid #ccc", // rõ hơn
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          bgcolor: "#fefefe",
                          transition: "0.3s ease",
                          "&:hover": {
                            boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
                            transform: "translateY(-2px)",
                            borderColor: theme.palette.primary.main, // viền xanh
                          },
                        }}
                      >
                        <Box>
                          <Avatar
                            src={student.avatar}
                            alt={student.fullName}
                            sx={{ width: 44, height: 44 }}
                          />
                        </Box>
                        <Box flex={1}>
                          <Typography fontWeight={500} fontSize="1rem">
                            {student.fullName}
                          </Typography>
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mt={0.5}
                          >
                            <EmailIcon fontSize="small" color="disabled" />
                            <Typography variant="body2" color="text.secondary">
                              {student.email}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <PhoneIcon fontSize="small" color="disabled" />
                            <Typography variant="body2" color="text.secondary">
                              {student.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </LayoutComponent>
  );
}

export default ClassPage;
