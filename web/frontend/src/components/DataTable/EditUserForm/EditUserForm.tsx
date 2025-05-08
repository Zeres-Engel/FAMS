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
import { useForm, Controller, useWatch } from "react-hook-form";
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

    // Xử lý classIds một cách an toàn hơn
    let parsedClassIDs: ClassID[] = [];

    // Kiểm tra xem classId có phải là mảng và có các phần tử là đối tượng không
    if (Array.isArray(formData.classId)) {
      parsedClassIDs = formData.classId
        .filter((cls: any) => cls && typeof cls === "object") // Lọc các giá trị hợp lệ
        .map((cls: any) => ({
          academicYear:
            (cls as ClassID).academicYear || state.currentAcademicYear,
          classId: (cls as ClassID).classId || "",
          className: (cls as ClassID).className || "",
          grade: (cls as ClassID).grade || "10",
          isHomeroom: (cls as ClassID).isHomeroom || false,
        }));
    }

    // Set academic year to the current one
    const updatedClassIDs =
      parsedClassIDs.length > 0
        ? parsedClassIDs
        : [
            {
              academicYear: state.currentAcademicYear,
              classId: "",
              className: "",
              grade: "10", // Grade as string
              isHomeroom: false,
            },
          ];

    console.log("Initializing form with classIDs:", updatedClassIDs);
    setClassIDs(updatedClassIDs);

    // Lấy grade từ class đầu tiên của user và khởi tạo tìm kiếm
    if (updatedClassIDs.length > 0 && updatedClassIDs[0].grade) {
      const userGrade = updatedClassIDs[0].grade.toString();
      console.log("Initializing class search with grade:", userGrade);
      // Gọi hàm khởi tạo tìm kiếm với grade đã chọn
      handler.initializeClassSearch(userGrade);
    }
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

  const handleGradeChange = (grade: string, index: number) => {
    const updated = [...classIDs];

    updated[index] = {
      ...updated[index],
      grade: grade,
      className: "",
      classId: "",
    };

    console.log("Grade changed to:", grade);
    setClassIDs(updated);

    // Gọi tìm kiếm class mới
    handler.initializeClassSearch(grade);
  };

  // Handle class selection
  const handleClassSelect = (selectedClass: any, index: number) => {
    if (selectedClass && typeof selectedClass === "object") {
      console.log("Selected class:", selectedClass);
      handleClassIDChange("className", selectedClass.className, index);
      handleClassIDChange("classId", selectedClass.classId.toString(), index);
      handleClassIDChange("grade", selectedClass.grade.toString(), index);
      // Academic year is already set to current
    }
  };
  const watchParentNames = useWatch({ control, name: "parentNames" });
  const watchParentPhones = useWatch({ control, name: "parentPhones" });
  const watchParentEmails = useWatch({ control, name: "parentEmails" });
  const watchParentCareers = useWatch({ control, name: "parentCareers" });
  const watchParentGenders = useWatch({ control, name: "parentGenders" });

  const isParentFieldTouched = (index: number) => {
    return (
      watchParentNames?.[index] ||
      watchParentPhones?.[index] ||
      watchParentEmails?.[index] ||
      watchParentCareers?.[index] ||
      watchParentGenders?.[index]
    );
  };
  const onSubmit = (data: EditUserForm) => {
    console.log("Submitting user ID:", idUser);

    // Chuẩn bị dữ liệu lớp học
    let finalClassIDs = [];
    let classIds = [];

    if (userType === "teacher") {
      // Giáo viên có thể dạy nhiều lớp
      finalClassIDs = classIDs;
      classIds = classIDs.map(cls => Number(cls.classId));
    } else {
      // Học sinh vẫn giữ lại các lớp hiện có
      // Lấy lớp mới/đang chỉnh sửa (lớp cuối cùng trong mảng classIDs)
      const newClass = classIDs[classIDs.length - 1];

      // Lấy tất cả các lớp từ formData ban đầu (dữ liệu gốc)
      const existingClasses = Array.isArray(formData.classId)
        ? formData.classId
        : formData.classId
        ? [formData.classId]
        : [];

      // Kết hợp các lớp hiện có với lớp mới
      // Nếu đang sửa lớp cuối, thay thế nó; nếu không, thêm vào
      if (existingClasses.length > 0 && classIDs.length > 0) {
        finalClassIDs = [...existingClasses.slice(0, -1), newClass];
      } else {
        finalClassIDs = [newClass];
      }

      // Chuyển đổi classIds thành mảng số để API xử lý
      classIds = finalClassIDs.map((cls: any) =>
        typeof cls === "object" && cls.classId
          ? Number(cls.classId)
          : Number(cls)
      );

      // Log để debug
      console.log("Original formData.classId:", formData.classId);
      console.log("New class being edited:", newClass);
      console.log("Combined finalClassIDs:", finalClassIDs);
      console.log("Extracted numeric classIds:", classIds);
    }

    // Prepare data for API submission - KHÔNG thay đổi kiểu dữ liệu của gender
    const userData: EditUserForm = {
      ...data,
      classId: finalClassIDs, // Đảm bảo classId được cập nhật chính xác
    };

    // Chuẩn bị dữ liệu bổ sung để gửi cho API
    const apiData = {
      ...data,
      classIds: classIds, // Gửi đúng danh sách classIds
      dateOfBirth: data.dob,
      gender: data.gender === true ? "Male" : "Female",
      phone: data.phone?.replace(/^0/, ""),
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
              {...register("fullName", {
                required: "Full name is required",
                maxLength: {
                  value: 50,
                  message: "Full name must be at most 50 characters",
                },
                pattern: {
                  value: /^[A-Za-zÀ-ỹ\s\-]+$/,
                  message: "Only letters, spaces, and hyphens are allowed",
                },
              })}
              onChange={e => {
                const value = e.target.value;
                const filtered = value.replace(/[^A-Za-zÀ-ỹ\s\-]/g, "");
                e.target.value = filtered;
              }}
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
                      backgroundColor: avatarPreview
                        ? "transparent"
                        : "#f0f0f0",
                    }}
                    onClick={() => {
                      const fileInput = document.getElementById(
                        `avatar-input-${idUser}`
                      );
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
                    onChange={async e => {
                      const file = e.target.files?.[0] || null;
                      setValue("avatar", file as any);
                      if (file) {
                        const previewURL = URL.createObjectURL(file);
                        setAvatarPreview(previewURL);

                        // Upload the avatar immediately when selected
                        const uploadResult = await handler.uploadAvatar(
                          idUser,
                          file
                        );
                        if (uploadResult.success && uploadResult.avatarUrl) {
                          // Cập nhật giá trị form
                          setValue("avatar", uploadResult.avatarUrl);
                        } else {
                          console.error(
                            "Failed to upload avatar:",
                            uploadResult.message
                          );
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
                            console.error(
                              "Failed to delete avatar:",
                              result.message
                            );
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
                {...register("dob", {
                  required: "Date of birth is required",
                  validate: value => {
                    const selectedDate = new Date(value);
                    const today = new Date();

                    let minAge = 0,
                      maxAge = 0; // Default values
                    if (userType === "student") {
                      minAge = 14;
                      maxAge = 20;
                    } else if (userType === "teacher") {
                      minAge = 22;
                      maxAge = 65;
                    }

                    const maxBirthDate = new Date();
                    maxBirthDate.setFullYear(today.getFullYear() - minAge);

                    const minBirthDate = new Date();
                    minBirthDate.setFullYear(today.getFullYear() - maxAge);

                    if (selectedDate > maxBirthDate) {
                      return `Must be at least ${minAge} years old`;
                    }
                    if (selectedDate < minBirthDate) {
                      return `Must be under ${maxAge} years old`;
                    }
                    return true;
                  },
                })}
                inputProps={{
                  max: new Date(
                    new Date().setFullYear(
                      new Date().getFullYear() -
                        (userType === "student" ? 14 : 22)
                    )
                  )
                    .toISOString()
                    .split("T")[0],
                  min: new Date(
                    new Date().setFullYear(
                      new Date().getFullYear() -
                        (userType === "student" ? 20 : 65)
                    )
                  )
                    .toISOString()
                    .split("T")[0],
                }}
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
                validate: value =>
                  /^[0-9]{10,11}$/.test(value) || "Phone must be 10–11 digits",
              })}
              inputProps={{ maxLength: 11 }}
              onChange={e => {
                const onlyNums = e.target.value.replace(/[^0-9]/g, "");
                e.target.value = onlyNums;
              }}
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

                {classIDs.length > 0 ? (
                  classIDs.map((classItem, index) => {
                    const isEditable =
                      userType === "teacher" || index === classIDs.length - 1;

                    return (
                      <Box
                        key={`class-${index}-${userType}-${idUser}`}
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        {/* Grade Dropdown */}
                        <FormControl fullWidth>
                          <InputLabel>Grade</InputLabel>
                          <Select
                            label="Grade"
                            value={classItem.grade}
                            onChange={e => {
                              const newGrade = e.target.value.toString();
                              handleGradeChange(newGrade, index);
                            }}
                            disabled={!isEditable}
                          >
                            {state.gradeOptions.map((grade, gradeIndex) => (
                              <MenuItem
                                key={`grade-${grade}-${gradeIndex}-${index}`}
                                value={grade.toString()}
                              >
                                {grade}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        {/* Class Name with Autocomplete */}
                        <Autocomplete
                          fullWidth
                          freeSolo
                          options={state.classOptions}
                          getOptionLabel={option => {
                            if (typeof option === "string") return option;
                            if (option && option.className)
                              return option.className;
                            return "";
                          }}
                          loading={state.loading}
                          onInputChange={(_, value) => handleClassSearch(value)}
                          onChange={(_, value) => {
                            if (value && typeof value === "object") {
                              handleClassSelect(value, index);
                            } else if (typeof value === "string") {
                              handleClassIDChange("className", value, index);
                            }
                          }}
                          value={classItem.className || ""}
                          renderInput={params => (
                            <TextField
                              {...params}
                              label="Class Name"
                              placeholder="Type to search classes"
                              InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                  <React.Fragment>
                                    {state.loading ? (
                                      <CircularProgress
                                        color="inherit"
                                        size={20}
                                      />
                                    ) : null}
                                    {params.InputProps.endAdornment}
                                  </React.Fragment>
                                ),
                              }}
                              onFocus={() => {
                                if (
                                  classItem.grade &&
                                  state.classOptions.length === 0
                                ) {
                                  handler.fetchClassSuggestions(
                                    "",
                                    classItem.grade.toString()
                                  );
                                }
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

                        {/* Academic Year */}
                        <TextField
                          fullWidth
                          label="Academic Year"
                          value={state.currentAcademicYear}
                          disabled
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
                  })
                ) : (
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    No classes added yet.
                  </Typography>
                )}

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
                          grade: "10", // Grade default
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
                      {...register(`parentNames.${parentIndex}` as const, {
                        validate: value =>
                          isParentFieldTouched(parentIndex) && !value
                            ? "Name is required if other fields are filled"
                            : true,
                        pattern: {
                          value: /^[A-Za-zÀ-ỹ\s\-]+$/,
                          message: "Name must contain only letters and spaces",
                        },
                        maxLength: {
                          value: 50,
                          message: "Max 50 characters allowed",
                        },
                      })}
                      error={!!errors.parentNames?.[parentIndex]}
                      helperText={errors.parentNames?.[parentIndex]?.message}
                    />

                    <TextField
                      fullWidth
                      label={`Parent ${parentIndex + 1} Phone`}
                      {...register(`parentPhones.${parentIndex}` as const, {
                        validate: value =>
                          isParentFieldTouched(parentIndex) && !value
                            ? "Phone is required if other fields are filled"
                            : true,
                        pattern: {
                          value: /^[0-9]{10,11}$/,
                          message: "Phone must be 10–11 digits",
                        },
                      })}
                      inputProps={{ maxLength: 11 }}
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
                        validate: value =>
                          isParentFieldTouched(parentIndex) && !value
                            ? "Email is required if other fields are filled"
                            : true,
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
                      {...register(`parentCareers.${parentIndex}` as const, {
                        validate: value =>
                          isParentFieldTouched(parentIndex) && !value
                            ? "Career is required if other fields are filled"
                            : true,
                        maxLength: {
                          value: 50,
                          message: "Max 50 characters allowed",
                        },
                      })}
                      error={!!errors.parentCareers?.[parentIndex]}
                      helperText={errors.parentCareers?.[parentIndex]?.message}
                    />

                    <Box sx={{ width: "100%" }}>
                      <FormLabel>{`Parent ${
                        parentIndex + 1
                      } Gender`}</FormLabel>
                      <Controller
                        control={control}
                        name={`parentGenders.${parentIndex}` as const}
                        rules={{
                          validate: value =>
                            isParentFieldTouched(parentIndex) && !value
                              ? "Gender is required if other fields are filled"
                              : true,
                        }}
                        render={({ field }) => (
                          <>
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
                            {errors.parentGenders?.[parentIndex] && (
                              <Typography variant="caption" color="error">
                                {errors.parentGenders?.[parentIndex]?.message}
                              </Typography>
                            )}
                          </>
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
                <TextField fullWidth label="Major" {...register("major")} />
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
          {userType === "student" && (
            <Button
              onClick={async () => {
                if (idUser) {
                  const result = await handler.cleanStudentData(idUser);
                  if (result.success) {
                    alert("Dữ liệu học sinh đã được làm sạch thành công!");
                    // Refresh form data
                    onClose();
                  } else {
                    alert("Không thể làm sạch dữ liệu: " + result.message);
                  }
                }
              }}
              color="secondary"
            >
              Làm sạch dữ liệu
            </Button>
          )}
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
