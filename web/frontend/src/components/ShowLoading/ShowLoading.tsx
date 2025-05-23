import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { CircularProgress, Box } from "@mui/material";

export default function GlobalLoading() {
  const isLoading = useSelector((state: RootState) => state.loading.isLoading);

  if (!isLoading) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1300,
        width: "100vw",
        height: "100vh",
        bgcolor: "rgba(0, 0, 0, 0.3)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CircularProgress size={60} thickness={5} />
    </Box>
  );
}