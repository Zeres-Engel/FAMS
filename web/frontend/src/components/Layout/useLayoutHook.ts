
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

function useLayoutHook() {
  const role =useSelector((state: RootState) => state.authUser.role); 
    const state = {role};
    const handler = {};
    return { state, handler };
  }
  export default useLayoutHook;