// TokenRefresher.tsx
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { refreshAccessToken } from "../../services/authServices";

export default function TokenRefresher() {
  const dispatch = useDispatch();

  useEffect(() => {
    refreshAccessToken(dispatch); // truyền dispatch để setRole sau khi refresh
  }, [dispatch]);

  return null; 
}
