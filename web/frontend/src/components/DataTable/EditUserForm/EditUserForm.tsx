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
  } from "@mui/material";
  import React from "react";
import { AddUserForm } from "../../../model/tableModels/tableDataModels.model";
import useEditTableFormHook from "./useEditUserFormHook";
  
  interface EditUserModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (editUserForm:AddUserForm) => void;
    userType: string;
    formData: any;
  }
  
  export default function EditUserModal({
    open,
    onClose,
    onSave,
    userType,
    formData,
  }: EditUserModalProps) {
    const {state,handler} = useEditTableFormHook(formData)
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <DialogTitle>Edit {userType === "student" ? "Student" : "Teacher"}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={state.editingUser?.fullName}
              onChange={handler.handleEditChange}
            />
            <TextField
              fullWidth
              type="date"
              label="Date of Birth"
              name="dob"
              InputLabelProps={{ shrink: true }}
              value={state.editingUser?.dob}
              onChange={handler.handleEditChange}
            />
  
            {/* Gender Field */}
            <Box sx={{ width: "100%" }}>
              <FormLabel component="legend">Gender</FormLabel>
              <RadioGroup
                row
                name="gender"
                value={state.editingUser?.gender}
                onChange={handler.handleEditChange}
              >
                <FormControlLabel value="1" control={<Radio />} label="Male" />
                <FormControlLabel value="2" control={<Radio />} label="Female" />
              </RadioGroup>
            </Box>
  
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={state.editingUser?.phone}
              onChange={handler.handleEditChange}
            />
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={state.editingUser?.address}
              onChange={handler.handleEditChange}
            />
  
            {userType === "student" ? (
              <>
                <TextField
                  fullWidth
                  label="Parent Names"
                  name="parentNames"
                  value={state.editingUser?.parentNames}
                  onChange={handler.handleEditChange}
                />
                <TextField
                  fullWidth
                  label="Careers"
                  name="careers"
                  value={state.editingUser?.careers}
                  onChange={handler.handleEditChange}
                />
                <TextField
                  fullWidth
                  label="Parent Phones"
                  name="parentPhones"
                  value={state.editingUser?.parentPhones}
                  onChange={handler.handleEditChange}
                />
  
                {/* Parent Genders */}
                <Box sx={{ width: "100%" }}>
                  <FormLabel component="legend">Parent Genders</FormLabel>
                  <RadioGroup
                    row
                    name="parentGenders"
                    value={state.editingUser?.parentGenders}
                    onChange={handler.handleEditChange}
                  >
                    <FormControlLabel value="1" control={<Radio />} label="Male" />
                    <FormControlLabel value="2" control={<Radio />} label="Female" />
                  </RadioGroup>
                </Box>
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Major"
                  name="major"
                  value={state.editingUser?.major}
                  onChange={handler.handleEditChange}
                />
                <TextField
                  fullWidth
                  label="Weekly Capacity"
                  name="weeklyCapacity"
                  value={state.editingUser?.weeklyCapacity}
                  onChange={handler.handleEditChange}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={()=>{onSave(state.editingUser)}} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
  