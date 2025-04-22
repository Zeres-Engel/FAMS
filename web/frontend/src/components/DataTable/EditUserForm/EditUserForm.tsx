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
import {
  ClassID,
  EditUserForm,
} from "../../../model/tableModels/tableDataModels.model";

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
      gender: formData.gender ?? true,
    },
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    formData.avatar || null
  );
  const [avatarStatus, setAvatarStatus] = useState<
    "approved" | "disapproved" | null
  >(null);
  const [classIDs, setClassIDs] = useState<ClassID[]>(
    Array.isArray(formData.classId)
      ? formData.classId
      : [
          formData.classId || {
            academicYear: "",
            classId: "",
            className: "",
            grade: "",
            isHomeroom: false,
          },
        ]
  );
  console.log(userType);
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);
  useEffect(() => {
    reset({
      ...formData,
      gender: formData.gender ?? true,
    });

    setAvatarPreview(formData.avatar || null);

    const parsedClassIDs =
      Array.isArray(formData.classId) &&
      formData.classId.every(cls => typeof cls === "object")
        ? (formData.classId as ClassID[])
        : [];

    setClassIDs(parsedClassIDs);
  }, [formData, reset]);

  // const handleAddClassID = () => {
  //   setClassIDs([...classIDs, ""]);
  // };

  const handleClassIDChange = (
    field: keyof ClassID,
    value: string | boolean,
    index: number
  ) => {
    const updated = [...classIDs];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setClassIDs(updated);
  };

  const onSubmit = (data: EditUserForm) => {
    const finalClassID = userType === "teacher" ? classIDs : classIDs[0];
    console.log(idUser);

    onSave(
      {
        ...data,
        classId: Array.isArray(finalClassID) ? finalClassID : [finalClassID],
      },
      idUser
    );
  };

  return (
    <Dialog
      key={idUser}
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      BackdropProps={{ sx: { backgroundColor: "rgba(0, 0, 0, 0.2)" } }}
    >
      <DialogTitle>
        Edit{" "}
        {userType === "student"
          ? "Student"
          : userType === "teacher"
          ? "Teacher"
          : "Parent"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              {...register("fullName", { required: "Full name is required" })}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
            />
            {(userType === "teacher" || userType === "student") && (
              <Box sx={{ width: "100%" }}>
                <FormLabel>Avatar</FormLabel>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    mt: 1,
                  }}
                >
                  <label style={{ cursor: "pointer" }}>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setValue("avatar", file as any);
                        if (file) {
                          const previewURL = URL.createObjectURL(file);
                          setAvatarPreview(previewURL);
                        } else {
                          setAvatarPreview(null);
                        }
                      }}
                    />
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "cover",
                          borderRadius: "50%", // hình tròn
                          border: "2px solid #ccc",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 100,
                          height: 100,
                          backgroundColor: "#f0f0f0",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "2px dashed #ccc",
                          fontSize: 12,
                          color: "#999",
                        }}
                      >
                        Click to choose
                      </Box>
                    )}
                  </label>

                  <Typography variant="caption" color="text.secondary">
                    Click the Img to change the avatar
                  </Typography>
                  {/* Nút Approve / Disapprove */}
                  {avatarPreview && (
                    <>
                      {avatarStatus === "approved" ? (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => setAvatarStatus("disapproved")}
                          size="small"
                        >
                          Disapprove Avatar
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={() => setAvatarStatus("approved")}
                          size="small"
                        >
                          Approve Avatar
                        </Button>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            )}

            {userType !== "parent" && (
              <TextField
                fullWidth
                type="date"
                label="Date of Birth"
                InputLabelProps={{ shrink: true }}
                {...register("dob", { required: "Date of birth is required" })}
                error={!!errors.dob}
                helperText={errors.dob?.message}
              />
            )}
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

            {userType !== "parent" && (
              <TextField
                fullWidth
                label="Address"
                {...register("address", { required: "Address is required" })}
                error={!!errors.address}
                helperText={errors.address?.message}
              />
            )}
            {userType !== "parent" && (
              <Box sx={{ width: "100%" }}>
                <Typography variant="h6">Class Information</Typography>
                {(userType === "teacher"
                  ? classIDs
                  : [classIDs[0], ...classIDs.slice(1)]
                ).map((classItem, index) => {
                  const isEditable =
                    userType === "teacher" || index === classIDs.length - 1;

                  return (
                    <Box
                      key={index}
                      sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}
                    >
                      <TextField
                        fullWidth
                        label="Class Name"
                        value={classItem.className}
                        onChange={e =>
                          handleClassIDChange(
                            "className",
                            e.target.value,
                            index
                          )
                        }
                        disabled={!isEditable}
                      />
                      <TextField
                        fullWidth
                        label="Grade"
                        value={classItem.grade}
                        onChange={e =>
                          handleClassIDChange("grade", e.target.value, index)
                        }
                        disabled={!isEditable}
                      />
                      <TextField
                        fullWidth
                        label="Academic Year"
                        value={classItem.academicYear}
                        onChange={e =>
                          handleClassIDChange(
                            "academicYear",
                            e.target.value,
                            index
                          )
                        }
                        disabled={!isEditable}
                      />
                      {userType === "teacher" && (
                        <FormControlLabel
                          control={
                            <Radio
                              checked={classItem.isHomeroom}
                              onChange={() =>
                                handleClassIDChange(
                                  "isHomeroom",
                                  !classItem.isHomeroom,
                                  index
                                )
                              }
                            />
                          }
                          label="Homeroom"
                        />
                      )}

                      {userType === "teacher" && classIDs.length > 1 && (
                        <Tooltip title="Remove">
                          <IconButton
                            color="error"
                            onClick={() => {
                              const updated = [...classIDs];
                              updated.splice(index, 1);
                              setClassIDs(updated);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  );
                })}

                {userType === "teacher" && (
                  <Button
                    variant="outlined"
                    onClick={() =>
                      setClassIDs([
                        ...classIDs,
                        {
                          academicYear: "",
                          classId: "",
                          className: "",
                          grade: "",
                          isHomeroom: false,
                        },
                      ])
                    }
                  >
                    + Add Class
                  </Button>
                )}
              </Box>
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
                      label={`Parent ${index + 1} Email`}
                      {...register(`parentEmails.${index}` as const, {
                        pattern: {
                          value: /^\S+@\S+\.\S+$/,
                          message: "Invalid email format",
                        },
                      })}
                      error={!!errors.parentEmails?.[index]}
                      helperText={errors.parentEmails?.[index]?.message}
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
                            value={field.value}
                            onChange={e => field.onChange(e.target.value)}
                          >
                            <FormControlLabel
                              value="Male"
                              control={<Radio />}
                              label="Male"
                            />
                            <FormControlLabel
                              value="Female"
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
            {userType === "parent" && (
              <>
                <TextField
                  fullWidth
                  label="Career"
                  {...register("career", { required: "Career is required" })}
                  error={!!errors.career}
                  helperText={errors.career?.message}
                />

                <TextField
                  fullWidth
                  label="Email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: "Invalid email format",
                    },
                  })}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
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
