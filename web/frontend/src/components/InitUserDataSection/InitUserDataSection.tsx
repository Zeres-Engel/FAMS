import React from "react";
import { Box, Typography, Button, Link } from "@mui/material";

interface InitUserDataSectionProps {
  initUserFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

const InitUserDataSection: React.FC<InitUserDataSectionProps> = ({
  initUserFile,
  onFileChange,
  onSubmit,
}) => {
  return (
    <Box
      mt={4}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      margin={0}
    >
      <Typography variant="h6" sx={{ mb: 1 }}>
        Init New User Data
      </Typography>

      {/* Nút tải template */}
      <Box mb={2}>
        <Button
          variant="text"
          href="/templates/user_template.xlsx"
          // download
        >
          Download Template
        </Button>
      </Box>

      <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
        <Button variant="outlined" component="label">
          Choose File
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            hidden
            onChange={onFileChange}
          />
        </Button>

        {initUserFile && (
          <Typography
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 150,
              alignSelf: "center",
            }}
          >
            {initUserFile.name}
          </Typography>
        )}

        <Button variant="contained" onClick={onSubmit} disabled={!initUserFile}>
          Submit
        </Button>
      </Box>
    </Box>
  );
};

export default InitUserDataSection;
