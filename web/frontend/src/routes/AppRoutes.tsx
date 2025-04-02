import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage/LoginPage";
import HomePage from "../pages/HomePage/HomePage";
import AuthRoute from "./AuthRoutes";

function AppRoutes(): React.JSX.Element {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AuthRoute element={<HomePage />} />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;