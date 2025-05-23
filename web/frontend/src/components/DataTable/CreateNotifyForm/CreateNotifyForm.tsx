import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Chip,
  Autocomplete,
  Alert,
  CircularProgress,
} from "@mui/material";
import useCreateNotifyFormHook from "./useCreateNotifyFormHook";

interface CreateNotifyFormProps {
  role: string;
}

export default function CreateNotifyForm({
  role,
}: CreateNotifyFormProps): React.JSX.Element {
  const {
    state: {
      message,
      userIDs,
      loading,
      error,
      success,
    },
    handler: {
      setMessage,
      setUserIDs,
      handleSubmit,
    },
  } = useCreateNotifyFormHook(role);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{ mt: 4, px: 2 }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 800 }}>
        <Typography variant="h5" gutterBottom>
          Send Notification
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Notification sent successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Message input */}
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
            disabled={loading}
          />

          {/* User IDs input */}
          <Autocomplete
            multiple
            freeSolo
            options={[]} // No suggestions needed
            value={userIDs}
            onChange={(event, newValue) => {
              // Combine all values and handle paste with commas
              const flatList = newValue
                .flatMap(v => (typeof v === "string" ? v.split(",") : [v]))
                .map(v => typeof v === "string" ? v.trim() : v)
                .filter(v => v !== "");
              setUserIDs(flatList);
            }}
            renderTags={(value: readonly string[], getTagProps) =>
              value.map((option: string, index: number) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                />
              ))
            }
            renderInput={params => (
              <TextField
                {...params}
                label="Enter User IDs (leave empty to send to yourself)"
                placeholder="e.g. user001, user002, user003"
                disabled={loading}
              />
            )}
            disabled={loading}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Recipients: {userIDs.length > 0 ? userIDs.join(", ") : "Yourself"}
          </Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{ alignSelf: "flex-end", mt: 2 }}
            disabled={loading || !message}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? "Sending..." : "Send Notification"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
