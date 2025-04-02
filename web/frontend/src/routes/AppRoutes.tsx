import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "../pages/LoginPage/LoginPage";
import HomePage from "../pages/HomePage/HomePage";

const router = createBrowserRouter([
    { path: "/", element: <HomePage /> },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}