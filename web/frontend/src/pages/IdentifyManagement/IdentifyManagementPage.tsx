import React, { useState } from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import LayoutComponent from "../../components/Layout/Layout";
import FaceIdentificationSetting from "../../components/SystemSettingComponent/FaceIdentificationSetting/FaceIdentificationSetting";
import RFIDSetting from "../../components/SystemSettingComponent/RFIDSetting/RFIDSetting";
import DeviceSetting from "../../components/SystemSettingComponent/DeviceSetting/DeviceSetting";
import CurriculumSetting from "../../components/SystemSettingComponent/CurriculumSetting/CurriculumSetting";
import ScheduleFormatSetting from "../../components/SystemSettingComponent/ScheduleFormatSetting/ScheduleFormatSetting";
import useIdentifyManagementHook from "./useIdentifyManagementHook";

// Import các setting component

const SETTINGS = [
  { label: "Face Identification Setting", value: "face" },
  { label: "RFID Setting", value: "rfid" },
  { label: "Curriculum Setting", value: "curriculum" },
  { label: "Schedule Format Setting", value: "schedule" },
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
      case "curriculum":
        return <CurriculumSetting />;
      case "schedule":
        return <ScheduleFormatSetting />;
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
