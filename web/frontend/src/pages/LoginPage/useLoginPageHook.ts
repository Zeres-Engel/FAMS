import { useWatch, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  LoginForm,
  LoginTest,
} from "../../model/loginModels/loginModels.model";
import { useDispatch, useSelector } from "react-redux";
import { loginRequest } from "../../store/slices/loginSlice";
import { AppDispatch, RootState } from "../../store/store";
import { useLocation, useNavigate } from "react-router";
import { saveTokens } from "../../services/tokenServices";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

function useLoginPageHook() {
  const {
    register,
    handleSubmit,
    control,
    setFocus,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      userId: "",
      password: "",
    },
  });
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [notifyID, setNotifyID] = useState(0);
  const location = useLocation();
  const [alertMessage, setAlertMessage] = useState("");
  const dispatch = useDispatch<AppDispatch>();
  const { loginData, loading, error } = useSelector(
    (state: RootState) => state.login
  );
  const [isError, setIsError] = useState<number[]>([]);
  const watchUserName = useWatch({ control, name: "userId" });
  const watchPassword = useWatch({ control, name: "password" });
  const navigate = useNavigate();
  useEffect(() => {
    // Nếu có message truyền vào từ redirect thì hiển thị
    if (location.state?.message) {
      setAlertMessage(location.state.message);
      setNotifyID(prev => prev + 1);
    }
  }, [location.state]);
  useEffect(() => {
    if (loginData) {
      navigate("/", {
        state: { message: "Đăng nhập thành công!" },
      });
    }
  }, [loginData, navigate]);
  useEffect(() => {
    if (error) {
      setAlertMessage(
        "Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu."
      );
      setNotifyID(prev => prev + 1);
    }
  }, [error]);
  const handleSubmitLogin = handleSubmit(data => {
    if (!watchUserName || !watchPassword) {
      setIsError([1, 2]);
      watchUserName ? setFocus("password") : setFocus("userId");
    } else {
      const userLogin :LoginForm = { userId: watchUserName, password: watchPassword };
      handleLogin(userLogin);
    }
  });
  const handleLogin = async (formData: LoginForm) => {
    await dispatch(loginRequest(formData));
  };
  const state = {
    errors,
    watchUserName,
    watchPassword,
    isError,
    setIsError,
    alertMessage,
    isMobile,
    isTablet,
    notifyID
  };
  const handler = { register, handleSubmitLogin };
  return { state, handler };
}
export default useLoginPageHook;
