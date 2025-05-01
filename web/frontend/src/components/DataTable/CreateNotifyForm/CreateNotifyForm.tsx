import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel,
  Chip,
  Checkbox,
  Autocomplete,
} from "@mui/material";
import useCreateNotifyFormHook, {
  ReceiverOptionType,
} from "./useCreateNotifyFormHook";
interface CreateNotifyFormProps {
  role: string;
}

export default function CreateNotifyForm({
  role,
}: CreateNotifyFormProps): React.JSX.Element {
  const {
    state: {
      message,
      receiverOption,
      classIDs,
      userIDs,
      classOptions,
      userOptions,
    },
    handler: {
      setMessage,
      setReceiverOption,
      setClassIDs,
      setUserIDs,
      handleSubmit,
    },
  } = useCreateNotifyFormHook(role);

  const handleChangeReceiverOption = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setReceiverOption(e.target.value as ReceiverOptionType);
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{ mt: 4, px: 2 }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: 800 }}>
        <Typography variant="h5" gutterBottom>
          Create Notification
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Message input */}
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />

          {/* Receiver Option Radios */}
          {(role === "admin" || role === "supervisor") && (
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={receiverOption}
                onChange={handleChangeReceiverOption}
              >
                <FormControlLabel
                  value="all-students"
                  control={<Radio />}
                  label="All Students"
                />
                <FormControlLabel
                  value="all-teachers"
                  control={<Radio />}
                  label="All Teachers"
                />
                <FormControlLabel
                  value="all-system"
                  control={<Radio />}
                  label="All System"
                />
                {/* <FormControlLabel
                  value="specific"
                  control={<Radio />}
                  label="Specific"
                /> */}
              </RadioGroup>
            </FormControl>
          )}
          {role === "student" && (
            <Autocomplete
            multiple
            freeSolo
            options={[]} // Không cần gợi ý
            value={userIDs}
            onChange={(event, newValue) => {
              // Gộp tất cả giá trị và xử lý nếu có user paste vào bằng dấu phẩy
              const flatList = newValue
                .flatMap(v => (typeof v === "string" ? v.split(",") : []))
                .map(v => v.trim())
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
                label="Enter User IDs"
                placeholder="e.g. user001, user002"
              />
            )}
          />
          )}
          {(role === "teacher" ||
            (receiverOption === "specific" &&
              !(role === "student" || role === "parent")) ||
            role === "admin" ||
            role === "supervisor") && (
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={receiverOption}
                onChange={handleChangeReceiverOption}
              >
                <FormControlLabel
                  value="class"
                  control={<Radio />}
                  label="By Class"
                />
                <FormControlLabel
                  value="user"
                  control={<Radio />}
                  label="By User ID"
                />
              </RadioGroup>
            </FormControl>
          )}

          {receiverOption === "class" && (
            <Autocomplete
              multiple
              options={classOptions}
              getOptionLabel={option => option.label}
              value={classOptions.filter(c => classIDs.includes(c.value))}
              onChange={(event, newValue) =>
                setClassIDs(newValue.map(opt => opt.value))
              }
              disableCloseOnSelect
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props;
                return (
                  <li key={key} {...optionProps}>
                    <Checkbox style={{ marginRight: 8 }} checked={selected} />
                    {option.label}
                  </li>
                );
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Select Classes"
                  placeholder="Classes"
                />
              )}
            />
          )}

          {receiverOption === "user" && (
            <Autocomplete
              multiple
              freeSolo
              options={[]} // Không cần gợi ý
              value={userIDs}
              onChange={(event, newValue) => {
                // Gộp tất cả giá trị và xử lý nếu có user paste vào bằng dấu phẩy
                const flatList = newValue
                  .flatMap(v => (typeof v === "string" ? v.split(",") : []))
                  .map(v => v.trim())
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
                  label="Enter User IDs"
                  placeholder="e.g. user001, user002"
                />
              )}
            />
          )}

          {/* Preview */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              Preview:
            </Typography>
            <Chip
              label={`To: ${receiverOption}${
                classIDs.length ? " | Classes: " + classIDs.join(", ") : ""
              }${userIDs.length ? " | Users: " + userIDs.join(", ") : ""}`}
              variant="outlined"
            />
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{ alignSelf: "flex-end", mt: 2 }}
          >
            Send
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
