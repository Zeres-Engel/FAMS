import React, { useState } from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import LayoutComponent from "../../components/Layout/Layout";
import FaceIdentificationSetting from "../../components/SystemSettingComponent/FaceIdentificationSetting/FaceIdentificationSetting";
import RFIDSetting from "../../components/SystemSettingComponent/RFIDSetting/RFIDSetting";
import DeviceSetting from "../../components/SystemSettingComponent/DeviceSetting/DeviceSetting";
import CurriculumSetting from "../../components/SystemSettingComponent/CurriculumSetting/CurriculumSetting";
import ScheduleFormatSetting from "../../components/SystemSettingComponent/ScheduleFormatSetting/ScheduleFormatSetting";
import AcademicYearSetting from "../../components/SystemSettingComponent/AcademicYearSetting/AcademicYearSetting";
import useIdentifyManagementHook from "./useIdentifyManagementHook";

// Import các setting component

const SETTINGS = [
  { label: "Face Identification Setting", value: "face" },
  { label: "RFID Setting", value: "rfid" },
  { label: "Device Setting", value: "device" },
  { label: "Curriculum Setting", value: "curriculum" },
  { label: "Schedule Format Setting", value: "schedule" },
  { label: "Academic Year Setting", value: "academic" },
];

function SystemManagementPage(): React.JSX.Element {
  const [selectedSetting, setSelectedSetting] = useState<string>("face");
  const { state, handler } = useIdentifyManagementHook();

  const renderSelectedSetting = () => {
    switch (selectedSetting) {
      case "face":
        return <FaceIdentificationSetting />;
      case "rfid":
        return <RFIDSetting />;
      case "device":
        return <DeviceSetting />;
      case "curriculum":
        return <CurriculumSetting />;
      case "schedule":
        return <ScheduleFormatSetting />;
      case "academic":
        return <AcademicYearSetting />;
      default:
        return null;
    }
  };

  return (
    <LayoutComponent pageHeader="System Management Page">
      <Box p={2}>
        {/* Option chọn setting */}
        <Box
          display="flex"
          flexWrap="wrap"
          gap={2}
          justifyContent="center"
          mb={4}
        >
          {SETTINGS.map(setting => (
            <Button
              key={setting.value}
              variant={selectedSetting === setting.value ? "contained" : "outlined"}
              onClick={() => setSelectedSetting(setting.value)}
            >
              {setting.label}
            </Button>
          ))}
          
          {/* Nút Refresh Data */}
          {selectedSetting === "rfid" && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={handler.refreshRFIDData}
              disabled={state.loading}
              startIcon={state.loading ? <CircularProgress size={20} /> : null}
            >
              {state.loading ? "Refreshing..." : "Refresh RFID Data"}
            </Button>
          )}
        </Box>

        {/* Nội dung Setting */}
        <Box mt={2}>
          {renderSelectedSetting()}
        </Box>
      </Box>
    </LayoutComponent>
  );
}

export default SystemManagementPage;
