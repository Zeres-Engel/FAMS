import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/useStoreHook";
import { fetchUser } from "../../store/slices/userSlice";
import {
  Data,
  HeadCell,
  NotifyHeadCell,
  NotifyProps,
} from "../../model/tableModels/tableDataModels.model";

function useNotifyPageHook() {
  const fakeNotifies: NotifyProps[] = [
    {
      id: '1',
      message: "Buổi học ngày mai sẽ bắt đầu lúc 7h sáng.",
      sender: "admin",
      receiver: "student01",
      sendDate: new Date("2025-04-18T08:00:00").toISOString(),
    },
    {
      id: '2',
      message: "Bạn có bài kiểm tra vào thứ 5 tuần này.",
      sender: "teacher01",
      receiver: "student02",
      sendDate: new Date("2025-04-17T10:30:00").toISOString(),
    },
    {
      id: '3',
      message: "Hệ thống sẽ bảo trì vào cuối tuần.",
      sender: "system",
      receiver: "all",
      sendDate: new Date("2025-04-16T15:00:00").toISOString(),
    },
    {
      id: '4',
      message: "Lịch họp giáo viên được cập nhật.",
      sender: "principal",
      receiver: "teacher01",
      sendDate: new Date("2025-04-15T09:00:00").toISOString(),
    },
    {
      id: '5',
      message: "Bạn đã được thêm vào lớp Toán 10A3.",
      sender: "admin",
      receiver: "student03",
      sendDate: new Date("2025-04-14T12:00:00").toISOString(),
    },
  ];

  const dispatch = useAppDispatch();
  const role = useAppSelector(state => state.authUser.role);
  const userState = useAppSelector(state => state.users);
  const [userMainData, setUserMainData] = useState<NotifyProps[]>(fakeNotifies);
  const headCellsData: NotifyHeadCell[] = [
    {
      id: "id",
      numeric: false,
      disablePadding: true,
      label: "ID",
    },
    {
      id: "sendDate",
      numeric: false,
      disablePadding: false,
      label: "Send Date",
    },
    {
      id: "message",
      numeric: false,
      disablePadding: true,
      label: "Message",
    },
    {
      id: "sender",
      numeric: false,
      disablePadding: false,
      label: "Sender",
    },
    {
      id: "receiver",
      numeric: false,
      disablePadding: false,
      label: "Receiver",
    },
  ];
  const isCheckBox = false;
  const tableTitle = "Notify";
//   useEffect(() => {
//     if (!userState.user) {
//       dispatch(fetchUser());
//     } else {
//       // setUserMainData(userState?.user);
//     }
//   }, [dispatch, userState.user]);
  const state = { headCellsData, userMainData, tableTitle, isCheckBox, role };
  const handler = {};

  return { state, handler };
}

export default useNotifyPageHook;
