import { useEffect, useState } from "react";
import { useLocation } from "react-router";

function useHomePageHook() {
  const [alertMessage, setAlertMessage] = useState("");
  const [notifyID, setNotifyID] = useState(0);
  const location = useLocation();
  const state = {alertMessage,notifyID};
  const handler = {};
  return { state, handler };
}
export default useHomePageHook;
