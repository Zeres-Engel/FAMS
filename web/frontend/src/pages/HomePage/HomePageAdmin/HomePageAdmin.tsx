import React from "react";
import "./HomePageAdmin.scss";
import LayoutComponent from "../../../components/Layout/Layout";
import useHomePageAdminHook from "./useHomePageAdminHook";
function HomePageAdmin(): React.JSX.Element {
  const {state,handler} = useHomePageAdminHook()
  return <LayoutComponent pageHeader='Home Page Admin'>Home Page Admin</LayoutComponent>;
}
export default HomePageAdmin;
