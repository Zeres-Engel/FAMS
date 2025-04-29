import React from "react";
import { Box, Typography } from "@mui/material";

function DeviceSetting() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Device Setting
      </Typography>
      <Typography>Manage devices such as cameras, RFID readers, and face scanners.</Typography>
    </Box>
  );
}

export default DeviceSetting;