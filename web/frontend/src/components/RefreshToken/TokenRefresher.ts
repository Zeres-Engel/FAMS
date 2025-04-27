// TokenRefresher.tsx
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { refreshAccessToken } from "../../services/authServices";

export default function TokenRefresher() {
  // const dispatch = useDispatch();
  // const [refreshError, setRefreshError] = useState<boolean>(false);

  // useEffect(() => {
  //   // Thực hiện refresh token khi component mount
  //   const doRefresh = async () => {
  //     try {
  //       const result = await refreshAccessToken(dispatch);
  //       if (!result) {
  //         console.warn("Không thể refresh token");
  //         setRefreshError(true);
  //       } else {
  //         setRefreshError(false);
  //       }
  //     } catch (error) {
  //       console.error("Lỗi khi refresh token:", error);
  //       setRefreshError(true);
  //     }
  //   };

  //   doRefresh();

  //   // Thiết lập interval để refresh token mỗi 50 phút
  //   const intervalId = setInterval(doRefresh, 50 * 60 * 1000);

  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, [dispatch]);

  // // Nếu có lỗi refresh và đang ở trang không phải login, chuyển về trang login
  // useEffect(() => {
  //   if (refreshError && window.location.pathname !== '/login') {
  //     window.location.href = '/login';
  //   }
  // }, [refreshError]);

  // return null; 
    const dispatch = useDispatch();

  useEffect(() => {
    refreshAccessToken(dispatch); // truyền dispatch để setRole sau khi refresh
  }, [dispatch]);

  return null; 
}
