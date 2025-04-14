import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useForm, Controller } from "react-hook-form";
import { EditUserForm } from "../../../model/tableModels/tableDataModels.model";

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (editUserForm: EditUserForm, idUser: string) => void;
  userType: string;
  formData: EditUserForm;
  idUser: string;
}

export default function EditUserModal({
  open,
  onClose,
  onSave,
  userType,
  formData,
  idUser,
}: EditUserModalProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditUserForm>({
    defaultValues: {
      ...formData,
      parentGenders:
        formData.parentGenders?.length === 2
          ? formData.parentGenders
          : [true, true],
      gender: formData.gender ?? true,
    },
  });

  const [classIDs, setClassIDs] = useState<string[]>(
    Array.isArray(formData.classId)
      ? formData.classId
      : [formData.classId || ""]
  );

  useEffect(() => {
    reset({
      ...formData,
      parentGenders:
        formData.parentGenders?.length === 2
          ? formData.parentGenders
          : [true, true],
      gender: formData.gender ?? true,
    });

    setClassIDs(
      Array.isArray(formData.classId)
        ? formData.classId
        : [formData.classId || ""]
    );
  }, [formData, reset]);

  const handleAddClassID = () => {
    setClassIDs([...classIDs, ""]);
  };

  const handleClassIDChange = (value: string, index: number) => {
    const updated = [...classIDs];
    updated[index] = value;
    setClassIDs(updated);
  };

  const onSubmit = (data: EditUserForm) => {
    const finalClassID =
      userType === "teacher"
        ? classIDs
        : [
            Array.isArray(data.classId)
              ? data.classId[0]
              : (data.classId as any),
          ];
    console.log(idUser);
    
    onSave({ ...data, classId: finalClassID }, idUser);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      BackdropProps={{ sx: { backgroundColor: "rgba(0, 0, 0, 0.2)" } }}
    >
      <DialogTitle>
        Edit {userType === "student" ? "Student" : "Teacher"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              {...register("firstName", { required: "First name is required" })}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
            />
            <TextField
              fullWidth
              label="Last Name"
              {...register("lastName", { required: "Last name is required" })}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
            />
            <TextField
              fullWidth
              type="date"
              label="Date of Birth"
              InputLabelProps={{ shrink: true }}
              {...register("dob", { required: "Date of birth is required" })}
              error={!!errors.dob}
              helperText={errors.dob?.message}
            />

            <Box sx={{ width: "100%" }}>
              <FormLabel component="legend">Gender</FormLabel>
              <Controller
                control={control}
                name="gender"
                rules={{
                  validate: value =>
                    value === true || value === false || "Gender is required",
                }}
                render={({ field }) => (
                  <RadioGroup
                    row
                    value={
                      field.value === true
                        ? "true"
                        : field.value === false
                        ? "false"
                        : ""
                    }
                    onChange={e => field.onChange(e.target.value === "true")}
                  >
                    <FormControlLabel
                      value="true"
                      control={<Radio />}
                      label="Male"
                    />
                    <FormControlLabel
                      value="false"
                      control={<Radio />}
                      label="Female"
                    />
                  </RadioGroup>
                )}
              />
              {errors.gender && (
                <Box sx={{ color: "red", fontSize: 12 }}>
                  {errors.gender.message}
                </Box>
              )}
            </Box>

            <TextField
              fullWidth
              label="Phone"
              {...register("phone", {
                required: "Phone is required",
                pattern: { value: /^[0-9]+$/, message: "Numbers only" },
              })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">+84</InputAdornment>
                ),
              }}
              error={!!errors.phone}
              helperText={errors.phone?.message}
            />

            <TextField
              fullWidth
              label="Address"
              {...register("address", { required: "Address is required" })}
              error={!!errors.address}
              helperText={errors.address?.message}
            />

            {userType === "student" && (
              <TextField
                fullWidth
                label="Class ID"
                {...register("classId", { required: "Class ID is required" })}
                error={!!errors.classId}
                helperText={errors.classId?.message as string}
              />
            )}

            {userType === "teacher" && (
              <>
                <TextField fullWidth label="Major" {...register("major")} />
                <TextField
                  fullWidth
                  label="Weekly Capacity"
                  {...register("weeklyCapacity")}
                />

                <Box sx={{ width: "100%" }}>
                  <Typography variant="h6">Class IDs</Typography>
                  {classIDs.map((id, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <TextField
                        fullWidth
                        label={`Class ID ${index + 1}`}
                        value={id}
                        onChange={e =>
                          handleClassIDChange(e.target.value, index)
                        }
                      />
                      {classIDs.length > 1 && (
                        <Tooltip title="Remove">
                          <IconButton
                            color="error"
                            onClick={() => {
                              const updated = [...classIDs];
                              updated.splice(index, 1);
                              setClassIDs(updated);
                              setValue("classId", updated);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                  <Button variant="outlined" onClick={handleAddClassID}>
                    + Add Class ID
                  </Button>
                </Box>
              </>
            )}

            {userType === "student" && (
              <>
                <Typography variant="h6" sx={{ mt: 2, width: "100%" }}>
                  Parent Information
                </Typography>
                {[0, 1].map(index => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <TextField
                      fullWidth
                      label={`Parent ${index + 1} Name`}
                      {...register(`parentNames.${index}` as const)}
                    />
                    <TextField
                      fullWidth
                      label={`Parent ${index + 1} Phone`}
                      {...register(`parentPhones.${index}` as const, {
                        pattern: {
                          value: /^[0-9]+$/,
                          message: "Numbers only",
                        },
                      })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">+84</InputAdornment>
                        ),
                      }}
                      error={!!errors.parentPhones?.[index]}
                      helperText={errors.parentPhones?.[index]?.message}
                    />
                    <TextField
                      fullWidth
                      label={`Parent ${index + 1} Career`}
                      {...register(`parentCareers.${index}` as const)}
                    />
                    <Box sx={{ width: "100%" }}>
                      <FormLabel>{`Parent ${index + 1} Gender`}</FormLabel>
                      <Controller
                        control={control}
                        name={`parentGenders.${index}` as const}
                        render={({ field }) => (
                          <RadioGroup
                            row
                            value={field.value === true ? "true" : "false"}
                            onChange={e =>
                              field.onChange(e.target.value === "true")
                            }
                          >
                            <FormControlLabel
                              value="true"
                              control={<Radio />}
                              label="Male"
                            />
                            <FormControlLabel
                              value="false"
                              control={<Radio />}
                              label="Female"
                            />
                          </RadioGroup>
                        )}
                      />
                    </Box>
                  </Box>
                ))}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
