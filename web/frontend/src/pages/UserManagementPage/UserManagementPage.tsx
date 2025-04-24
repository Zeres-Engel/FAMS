import React, { useState, useEffect, useMemo } from "react";
import "./UserManagementPage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import Container from "@mui/material/Container";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, IconButton, Paper, Tab, Tabs, Typography, Checkbox, Snackbar, Alert, TextField, FormControl, InputLabel, Select, MenuItem, Grid } from "@mui/material";
import DataTable from "../../components/DataTable/DataTable";
import useUserManagementPageHook from "./useUserManagementPageHook";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";

function UserManagementPage(): React.JSX.Element {
  const { state, handler } = useUserManagementPageHook();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  // Debug logs
  console.log("UserManagementPage rendering with state:", {
    availableClassNames: state.availableClassNames,
    className: state.className,
    academicYear: state.academicYear
  });

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
    setTabValue(0);
    setPreviewData([]);
    setSearchTerm("");
    setRoleFilter("all");
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDownloadTemplate = () => {
    // Download template from API
    const downloadUrl = 'http://14.225.204.42:3001/api/users/download/template';
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', 'FAMS_template.xlsx');
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  };

  // Update previewData when uploadedUserData changes
  useEffect(() => {
    if (state.uploadedUserData && state.uploadedUserData.length > 0) {
      setPreviewData(state.uploadedUserData);
      setTabValue(1); // Switch to preview tab
    }
  }, [state.uploadedUserData]);

  // Process file upload and handle response
  const handleProcessFile = async () => {
    if (!state.initUserFile) return;
    
    const userData = await handler.handleSubmitInitUserData();
    // The state will be updated in the hook, which will trigger the useEffect above
  };

  // Handle user selection toggle
  const handleToggleUserSelection = (index: number) => {
    handler.toggleUserSelection(index);
  };

  // Handle import confirmation
  const handleConfirmImport = async () => {
    setIsImporting(true);
    
    try {
      const result = await handler.confirmImportUsers();
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Users imported successfully!',
          severity: 'success'
        });
        handleCloseImportDialog();
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Import failed',
          severity: 'error'
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'An error occurred during import',
        severity: 'error'
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handle role filter change
  const handleRoleFilterChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    setRoleFilter(event.target.value);
  };

  // Filter data based on search term and role
  const filteredPreviewData = useMemo(() => {
    return previewData.filter(user => {
      const nameMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = roleFilter === "all" || user.role === roleFilter;
      return nameMatch && roleMatch;
    });
  }, [previewData, searchTerm, roleFilter]);

  // Count selected users in filtered data
  const selectedUsersCount = filteredPreviewData.filter(user => user.chosen !== false).length;

  // Total selected users in all data
  const totalSelectedUsers = previewData.filter(user => user.chosen !== false).length;

  return (
    <LayoutComponent pageHeader="User Management">
      <Container maxWidth={false} className="userManagementPage-Container">
        <Box className="userManagementPage-Box">
          {/* Action buttons row */}
          <Box className="import-button-container">
            <Button
              variant="contained"
              color="primary"
              startIcon={<CloudUploadIcon />}
              onClick={handleOpenImportDialog}
            >
              Import Users
            </Button>
          </Box>
          
          <Box mb={4}>
            <DataTable
              headCellsData={state.headCellsData}
              tableMainData={state.userMainData}
              tableTitle={state.tableTitle}
              isCheckBox={state.isCheckBox}
              isAdmin={true}
              isUserManagement={true}
              setFiltersUser={handler.setFiltersUser}
              classOptions={state.availableClassNames}
              className={state.className}
              onClassChange={handler.handleClassChange}
              pagination={state.pagination}
              onPageChange={handler.handlePageChange}
              availableAcademicYears={state.availableAcademicYears}
              onAcademicYearChange={handler.handleAcademicYearChange}
            />
          </Box>
        </Box>
      </Container>

      {/* Import Users Dialog */}
      <Dialog 
        open={importDialogOpen} 
        onClose={handleCloseImportDialog}
        fullWidth
        maxWidth="lg" // Increased to "lg" for larger preview
        className="import-dialog"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Import Users</Typography>
            <IconButton
              aria-label="close"
              onClick={handleCloseImportDialog}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Import" />
            <Tab label="Preview" disabled={previewData.length === 0} />
          </Tabs>
          
          {tabValue === 0 && (
            <Box sx={{ mt: 3, p: 2 }}>
              <Stack spacing={3} alignItems="center">
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Download the template and fill it with user data
                  </Typography>
                </Box>
                
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadTemplate}
                    sx={{ mb: 2 }}
                  >
                    Download Template
                  </Button>
                </Box>
                
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Upload your completed Excel file
                  </Typography>
                </Box>
                
                <Box sx={{ width: '100%', maxWidth: 400 }}>
                  <Box 
                    className="file-upload-area"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept=".xlsx, .xls"
                      style={{ display: 'none' }}
                      onChange={handler.handleFileChange}
                    />
                    <CloudUploadIcon className="upload-icon" fontSize="large" />
                    <Typography variant="body1" sx={{ mt: 1, mb: 1 }}>
                      {state.initUserFile ? state.initUserFile.name : 'Drag and drop file here or click to select'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Supports .xlsx files only
                    </Typography>
                  </Box>
                </Box>
                
                {state.initUserFile && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<FileOpenIcon />}
                      onClick={handleProcessFile}
                      disabled={state.isUploading}
                    >
                      {state.isUploading ? 'Processing...' : 'Process File'}
                    </Button>
                  </Box>
                )}
              </Stack>
            </Box>
          )}
          
          {tabValue === 1 && (
            <Box sx={{ mt: 3 }}>
              {/* Table title */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Users to be imported ({totalSelectedUsers}/{previewData.length})
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Click on the checkbox to include/exclude a user
                </Typography>
              </Box>

              <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                {/* Search Box - Now placed above the table */}
                <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                    <TextField
                      size="small"
                      placeholder="Search in table..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      sx={{ minWidth: '250px', flexGrow: 1 }}
                      InputProps={{
                        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />,
                      }}
                    />
                    <FormControl size="small" sx={{ minWidth: '150px' }}>
                      <Select
                        displayEmpty
                        value={roleFilter}
                        onChange={handleRoleFilterChange}
                      >
                        <MenuItem value="all">All Roles</MenuItem>
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="teacher">Teacher</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="body2">
                      {filteredPreviewData.length} of {previewData.length} users
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ maxHeight: '500px', overflow: 'auto' }}>
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>Select</th>
                        <th>Name</th>
                        <th>Gender</th>
                        <th>Date of Birth</th>
                        <th>Role</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Parent Info</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPreviewData.length > 0 ? (
                        filteredPreviewData.map((user, index) => {
                          // Find original index in previewData array for correct toggle
                          const originalIndex = previewData.findIndex(u => 
                            u.name === user.name && 
                            u.phone === user.phone && 
                            u.dayOfBirth === user.dayOfBirth
                          );
                          
                          return (
                            <tr key={index} className={user.chosen === false ? 'excluded-row' : ''}>
                              <td className="checkbox-cell">
                                <Checkbox 
                                  checked={user.chosen !== false} 
                                  onChange={() => handleToggleUserSelection(originalIndex)}
                                  color="primary"
                                />
                              </td>
                              <td>{user.name}</td>
                              <td>{user.gender}</td>
                              <td>{user.dayOfBirth}</td>
                              <td>{user.role}</td>
                              <td>{user.phone}</td>
                              <td>{user.address}</td>
                              <td>
                                {user.parent1 && (
                                  <div>
                                    <div><strong>{user.parent1.relationship || 'Mother'}:</strong> {user.parent1.name}</div>
                                    {user.parent1.phone && <div>Phone: {user.parent1.phone}</div>}
                                  </div>
                                )}
                                {user.parent2 && (
                                  <div style={{ marginTop: '8px' }}>
                                    <div><strong>{user.parent2.relationship || 'Father'}:</strong> {user.parent2.name}</div>
                                    {user.parent2.phone && <div>Phone: {user.parent2.phone}</div>}
                                  </div>
                                )}
                                {!user.parent1 && !user.parent2 && "-"}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center' }}>
                            No user data to preview
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseImportDialog}>Cancel</Button>
          {tabValue === 1 && previewData.length > 0 && (
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleConfirmImport}
              disabled={isImporting || totalSelectedUsers === 0}
            >
              {isImporting ? 'Importing...' : `Confirm Import (${totalSelectedUsers})`}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </LayoutComponent>
  );
}

export default UserManagementPage;
