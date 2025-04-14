// components/NotifyContainer.tsx
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { Notify } from "../../store/slices/notifySlice";
import NotifyBar from "../NotifyBar/NotifyBar";

export default function NotifyContainer() {
  const notifies = useSelector((state: RootState) => state.notify);
//   const dispatch = useDispatch<AppDispatch>();

  return (
    <>
      {notifies.map((notify:Notify) => (
        <NotifyBar
          key={notify.id}
          notifyID={notify.id}
          notifyType={notify.type}
          notifyContent={notify.message}
          duration={notify.duration || 3000}
        />
      ))}
    </>
  );
}
