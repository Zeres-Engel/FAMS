import React from "react";
import "./HomePage.scss";
import LayoutComponent from "../../components/Layout/Layout";
import useHomePageHook from "./useHomePageHook";
import NotifyBar from "../../components/NotifyBar/NotifyBar";
function HomePage(): React.JSX.Element {
  const {state,handler}=useHomePageHook()
  return (
    <LayoutComponent pageHeader="Home Page">
      {state?.alertMessage && (
        <NotifyBar
          notifyID={state?.notifyID}
          notifyType="warning"
          notifyContent={state?.alertMessage}
        />
      )}
      Home Page
    </LayoutComponent>
  );
}
export default HomePage;
