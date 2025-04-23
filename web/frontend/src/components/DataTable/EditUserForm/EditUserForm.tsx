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
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress,
  InputLabel,
  FormControl,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useForm, Controller } from "react-hook-form";
import {
  ClassID,
  EditUserForm,
} from "../../../model/tableModels/tableDataModels.model";
import useEditUserFormHook from "./useEditUserFormHook";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

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

  // Use our custom hook for class suggestions
  const { state, handler } = useEditUserFormHook();
  
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
            academicYear: state.currentAcademicYear, // Use the current academic year
            classId: "",
            className: "",
            grade: "10", // Grade as string
            isHomeroom: false,
          },
        ]
  );

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
    
    // Set academic year to the current one
    const updatedClassIDs = parsedClassIDs.map(cls => ({
      ...cls,
      academicYear: state.currentAcademicYear
    }));

    setClassIDs(updatedClassIDs.length > 0 ? updatedClassIDs : [
      {
        academicYear: state.currentAcademicYear,
        classId: "",
        className: "",
        grade: "10", // Grade as string
        isHomeroom: false,
      }
    ]);
  }, [formData, reset, state.currentAcademicYear]);

  const handleClassIDChange = (
    field: keyof ClassID,
    value: string | boolean | number,
    index: number
  ) => {
    const updated = [...classIDs];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setClassIDs(updated);
  };

  // Handle class search
  const handleClassSearch = (searchValue: string) => {
    handler.setSearchTerm(searchValue);
  };

  // Handle grade change for class search
  const handleGradeChange = (grade: string, index: number) => {
    // Update the grade in the class data
    handleClassIDChange("grade", grade, index);
    // Update the search filter grade
    handler.setSelectedGrade(grade);
  };

  // Handle class selection
  const handleClassSelect = (selectedClass: any, index: number) => {
    if (selectedClass && typeof selectedClass === 'object') {
      console.log("Selected class:", selectedClass);
      handleClassIDChange("className", selectedClass.className, index);
      handleClassIDChange("classId", selectedClass.classId.toString(), index);
      handleClassIDChange("grade", selectedClass.grade.toString(), index);
      // Academic year is already set to current
    }
  };

  const onSubmit = (data: EditUserForm) => {
    const finalClassID = userType === "teacher" ? classIDs : classIDs[0];
    console.log("Submitting user ID:", idUser);

    // Extract classIds for the API request
    const classIds = Array.isArray(finalClassID) 
      ? finalClassID.map(cls => Number(cls.classId))
      : [Number(finalClassID.classId)];
      
    // Prepare data for API submission - KHÔNG thay đổi kiểu dữ liệu của gender
    const userData: EditUserForm = {
      ...data,
      classId: Array.isArray(finalClassID) ? finalClassID : [finalClassID],
    };
    
    // Chuẩn bị dữ liệu bổ sung để gửi cho API
    const apiData = {
      ...data,
      classIds: classIds,
      dateOfBirth: data.dob,
      gender: data.gender === true ? "Male" : "Female",
      phone: data.phone?.replace(/^0/, "")
    };

    console.log("Prepared user data for API:", apiData);
    
    // Call update user API with correct type for EditUserForm
    onSave(userData, idUser);
  };

  return (
    <Dialog
      key={`dialog-${idUser}`}
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
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      overflow: "hidden",
                      position: "relative",
                      mx: "auto",
                      cursor: "pointer",
                      "&:hover .avatar-overlay": {
                        opacity: 1,
                      },
                      border: avatarPreview ? "none" : "2px dashed #ccc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: avatarPreview ? "transparent" : "#f0f0f0",
                    }}
                    onClick={() => {
                      const fileInput = document.getElementById(`avatar-input-${idUser}`);
                      if (fileInput) fileInput.click();
                    }}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Click to choose
                      </Typography>
                    )}
                    
                    <Box
                      className="avatar-overlay"
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        opacity: 0,
                        transition: "opacity 0.3s",
                      }}
                    >
                      <Tooltip title="Upload new avatar">
                        <IconButton 
                          color="primary" 
                          aria-label="upload picture" 
                          component="span" 
                          sx={{ color: "white" }}
                        >
                          <PhotoCameraIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <input
                    id={`avatar-input-${idUser}`}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0] || null;
                      setValue("avatar", file as any);
                      if (file) {
                        const previewURL = URL.createObjectURL(file);
                        setAvatarPreview(previewURL);
                        
                        // Upload the avatar immediately when selected
                        const uploadResult = await handler.uploadAvatar(idUser, file);
                        if (uploadResult.success && uploadResult.avatarUrl) {
                          // Cập nhật giá trị form
                          setValue("avatar", uploadResult.avatarUrl);
                        } else {
                          console.error("Failed to upload avatar:", uploadResult.message);
                          // Nếu tải lên thất bại, vẫn giữ preview local
                          // Don't set avatar to File object since it expects a string
                        }
                      } else {
                        setAvatarPreview(null);
                        setValue("avatar", undefined);
                      }
                    }}
                  />

                  {avatarPreview && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={async () => {
                        if (idUser) {
                          // Gọi API xóa avatar
                          const result = await handler.deleteAvatar(idUser);
                          if (result.success) {
                            // Cập nhật UI sau khi xóa thành công
                            setAvatarPreview(null);
                            setValue("avatar", undefined);
                          } else {
                            console.error("Failed to delete avatar:", result.message);
                            // Có thể hiển thị thông báo lỗi ở đây nếu cần
                          }
                        } else {
                          // Nếu không có idUser (trường hợp người dùng mới), chỉ xóa ở local
                          setAvatarPreview(null);
                          setValue("avatar", undefined);
                        }
                      }}
                    >
                      Remove Avatar
                    </Button>
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
                      key={`class-${index}-${userType}-${idUser}`}
                      sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}
                    >
                      {/* Grade Dropdown - Moved to top */}
                      <FormControl fullWidth>
                        <InputLabel>Grade</InputLabel>
                        <Select
                          label="Grade"
                          value={classItem.grade}
                          onChange={(e) => {
                            const newGrade = e.target.value.toString();
                            handleGradeChange(newGrade, index);
                          }}
                          disabled={!isEditable}
                        >
                          {state.gradeOptions.map((grade, gradeIndex) => (
                            <MenuItem key={`grade-${grade}-${gradeIndex}-${index}`} value={grade.toString()}>
                              {grade}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      {/* Class Name with Autocomplete - Moved below Grade */}
                      <Autocomplete
                        fullWidth
                        freeSolo
                        options={state.classOptions}
                        getOptionLabel={(option) => {
                          if (typeof option === 'string') return option;
                          if (option && option.className) return option.className;
                          return '';
                        }}
                        loading={state.loading}
                        onInputChange={(_, value) => handleClassSearch(value)}
                        onChange={(_, value) => {
                          if (value && typeof value === 'object') {
                            handleClassSelect(value, index);
                          } else if (typeof value === 'string') {
                            handleClassIDChange("className", value, index);
                          }
                        }}
                        value={classItem.className || ''}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Class Name"
                            placeholder="Type to search classes"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <React.Fragment>
                                  {state.loading ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </React.Fragment>
                              ),
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props} key={option.classId}>
                            {option.className}
                          </li>
                        )}
                        disabled={!isEditable}
                      />
                      
                      {/* Academic Year (disabled) */}
                      <TextField
                        fullWidth
                        label="Academic Year"
                        value={state.currentAcademicYear}
                        disabled={true}
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
                          academicYear: state.currentAcademicYear,
                          classId: "",
                          className: "",
                          grade: "10", // Grade as string
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
                {[0, 1].map(parentIndex => (
                  <Box
                    key={`parent-${parentIndex}-${idUser}`}
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <TextField
                      fullWidth
                      label={`Parent ${parentIndex + 1} Name`}
                      {...register(`parentNames.${parentIndex}` as const)}
                    />
                    <TextField
                      fullWidth
                      label={`Parent ${parentIndex + 1} Phone`}
                      {...register(`parentPhones.${parentIndex}` as const, {
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
                      error={!!errors.parentPhones?.[parentIndex]}
                      helperText={errors.parentPhones?.[parentIndex]?.message}
                    />
                    <TextField
                      fullWidth
                      label={`Parent ${parentIndex + 1} Email`}
                      {...register(`parentEmails.${parentIndex}` as const, {
                        pattern: {
                          value: /^\S+@\S+\.\S+$/,
                          message: "Invalid email format",
                        },
                      })}
                      error={!!errors.parentEmails?.[parentIndex]}
                      helperText={errors.parentEmails?.[parentIndex]?.message}
                    />
                    <TextField
                      fullWidth
                      label={`Parent ${parentIndex + 1} Career`}
                      {...register(`parentCareers.${parentIndex}` as const)}
                    />
                    <Box sx={{ width: "100%" }}>
                      <FormLabel>{`Parent ${parentIndex + 1} Gender`}</FormLabel>
                      <Controller
                        control={control}
                        name={`parentGenders.${parentIndex}` as const}
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
            
            {/* Additional fields for teacher */}
            {userType === "teacher" && (
              <>
                <TextField
                  fullWidth
                  label="Major"
                  {...register("major")}
                />
                <TextField
                  fullWidth
                  label="Weekly Capacity"
                  type="number"
                  {...register("weeklyCapacity")}
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
