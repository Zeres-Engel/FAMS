import { createBrowserRouter, RouterProvider } from "react-router";
import LoginPage from "../pages/LoginPage/LoginPage";
import HomePage from "../pages/HomePage/HomePage";
import ProfilePage from "../pages/ProfilePage/ProfilePage";
import SchedulePage from "../pages/SchedulePage/SchedulePage";
import ClassPage from "../pages/ClassPage/ClassPage";
import AuthWrapper from "./AuthRoutes";
import HomePageAdmin from "../pages/HomePage/HomePageAdmin/HomePageAdmin";
import UserManagementPage from "../pages/UserManagementPage/UserManagementPage";
import ScheduleManagementPage from "../pages/ScheduleManagementPage/ScheduleManagementPage";
import ClassManagementPage from "../pages/ClassManagementPage/ClassManagementPage";
import AttendanceManagementPage from "../pages/AttendanceManagementPage/AttendanceManagementPage";
import IdentifyManagementPage from "../pages/IdentifyManagement/IdentifyManagementPage";
import AttendancePage from "../pages/AttendancePage/AttendancePage";
import NotifyPage from "../pages/NotifyPage/NotifyPage";

const router = createBrowserRouter([
  // { path: "/", element: <AuthWrapper mode="admin" element={<HomePageAdmin />} /> },
  // {
  //   path: "*",
  //   element: <AuthWrapper mode="admin" element={<HomePageAdmin />} />,
  // },
  {
    path: "/",
    element: <AuthWrapper mode="private" element={<></>} />,
  },
  {
    path: "/AdminHomePage",
    element: <AuthWrapper mode="admin" element={<HomePageAdmin />} />,
  },
  {
    path: "/IdentifyManagement",
    element: <AuthWrapper mode="admin" element={<IdentifyManagementPage />} />,
  },
  {
    path: "/UserManagement",
    element: <AuthWrapper mode="admin" element={<UserManagementPage />} />,
  },
  {
    path: "/ClassManagement",
    element: <AuthWrapper mode="admin" element={<ClassManagementPage />} />,
  },
  {
    path: "/NotifyManagement",
    element: <AuthWrapper mode="admin" element={<NotifyPage />} />,
  },
  {
    path: "/Notify",
    element: <AuthWrapper mode="private" element={<NotifyPage />} />,
  },
  {
    path: "/ScheduleManagement",
    element: <AuthWrapper mode="admin" element={<ScheduleManagementPage />} />,
  },
  {
    path: "/AttendanceManagement",
    element: <AuthWrapper mode="admin" element={<AttendanceManagementPage />} />,
  },
  {
    path: "/login",
    element: <AuthWrapper mode="guest" element={<LoginPage />} />,
  },
  {
    path: "/UserHomePage",
    element: <AuthWrapper mode="private" element={<HomePage />} />,
  },
  {
    path: "/profile",
    element: <AuthWrapper mode="private" element={<ProfilePage />} />,
  },
  {
    path: "/Schedule",
    element: <AuthWrapper mode="private" element={<ScheduleManagementPage />} />,
  },
  {
    path: "/Class",
    element: <AuthWrapper mode="private" element={<ClassPage />} />,
  },
  {
    path: "/Attendance",
    element: <AuthWrapper mode="private" element={<AttendancePage />} />,
  },
  {
    path: "*",
    element: <AuthWrapper mode="private" element={<HomePage />} />,
  },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
