import { useWatch, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { LoginForm } from "../../model/loginModels/loginModels.model";
import { useDispatch, useSelector } from "react-redux";
import { loginRequest } from "../../store/slices/loginSlice";
import { AppDispatch, RootState } from "../../store/store";
import { useLocation, useNavigate } from "react-router";
import { saveTokens } from "../../services/tokenServices";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { addNotify } from "../../store/slices/notifySlice";

function useLoginPageHook() {
  const {
    register,
    handleSubmit,
    control,
    setFocus,
    resetField,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      userId: "",
      password: "",
      email: "",
      otp: "",
    },
  });
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [notifyID, setNotifyID] = useState(0);
  const [alertMessage, setAlertMessage] = useState("");
  const [isError, setIsError] = useState<number[]>([]);
  const [isForgotMode, setIsForgotMode] = useState(false); // State cho màn hình quên mật khẩu
  const [resendTime, setResendTime] = useState(0); // Thời gian đếm ngược resend OTP
  const dispatch = useDispatch<AppDispatch>();
  const { loginData, loading, error } = useSelector(
    (state: RootState) => state.login
  );
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const watchUserName = useWatch({ control, name: "userId" });
  const watchPassword = useWatch({ control, name: "password" });
  const watchEmail = useWatch({ control, name: "email" });
  const watchOtp = useWatch({ control, name: "otp" });
  const navigate = useNavigate();
  const location = useLocation();

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
    if (resendTime > 0) {
      const timer = setInterval(() => {
        setResendTime(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendTime]);

  const handleSubmitLogin = handleSubmit(data => {
    if (!watchUserName || !watchPassword) {
      setIsError([1, 2]);
      watchUserName ? setFocus("password") : setFocus("userId");
    } else {
      const userLogin: LoginForm = { userId: watchUserName, password: watchPassword };
      handleLogin(userLogin);
    }
  });

  const handleLogin = async (formData: LoginForm) => {
    await dispatch(loginRequest(formData));
  };

  const handleSubmitForgotPassword = handleSubmit(async (data) => {
    if (!watchEmail || !watchOtp) {
      setIsError([1, 2]);
      watchEmail ? setFocus("otp") : setFocus("email");
    } else {
      try {
        // Giả lập xác minh OTP
        console.log("Verifying OTP:", watchOtp);
        // Nếu OTP hợp lệ
        setIsOtpVerified(true); // Chuyển sang bước nhập mật khẩu mới
        setAlertMessage("OTP verified successfully!");
        setNotifyID((prev) => prev + 1);
        resetField("otp");
        resetField("email");
        // Clear dữ liệu của các trường "New Password" và "Confirm New Password"
        resetField("newPassword");
        resetField("confirmNewPassword");
      } catch (error) {
        console.error("Error verifying OTP:", error);
        setAlertMessage("Invalid OTP. Please try again.");
        setNotifyID((prev) => prev + 1);
      }
    }
  });
  const handleSubmitNewPassword = handleSubmit(async (data) => {
    if (!data.newPassword || !data.confirmNewPassword) {
      setIsError([3, 4]); // Đánh dấu lỗi nếu trường mật khẩu trống
      return;
    }
  
    if (data.newPassword !== data.confirmNewPassword) {
      setAlertMessage("Passwords do not match!");
      setNotifyID((prev) => prev + 1);
      return;
    }
  
    try {
      // Logic cập nhật mật khẩu mới
      console.log("Updating password:", data.newPassword);
      setAlertMessage("Password updated successfully!");
      setNotifyID((prev) => prev + 1);

      resetToLogin(); // Reset toàn bộ logic sau khi cập nhật thành công
    } catch (error) {
      console.error("Error updating password:", error);
      setAlertMessage("Failed to update password. Please try again.");
      setNotifyID((prev) => prev + 1);
    }
  });
  const handleResendOtp = async () => {
    if (watchEmail && resendTime === 0) {
      // Gửi OTP mới cho email
      // await sendOtpRequest(watchEmail, "");
      setResendTime(50); // Đặt lại thời gian đếm ngược 50s
    }
  };
  const handleSubmitEmail = async () => {
    if (!watchEmail) {
      setIsError([1]); // Đánh dấu lỗi nếu email trống
      setFocus("email"); // Đặt focus vào trường email
      return;
    }
  
    try {
      // Logic gửi email (ví dụ: gọi API gửi email)
      console.log("Submitting email:", watchEmail);
      setAlertMessage("Email submitted successfully!");
      setNotifyID((prev) => prev + 1);
  
      // Bắt đầu đếm ngược cho nút Resend
      setResendTime(50); // Đặt thời gian đếm ngược (ví dụ: 50 giây)
    } catch (error) {
      console.error("Error submitting email:", error);
      setAlertMessage("Failed to submit email. Please try again.");
      setNotifyID((prev) => prev + 1);
    }
  };
  const toggleForgotMode = () => {
    resetField("email"); // Xóa dữ liệu email
    resetField("otp"); // Xóa dữ liệu OTP
    resetField("newPassword"); // Xóa dữ liệu mật khẩu mới
    resetField("confirmNewPassword"); // Xóa dữ liệu xác nhận mật khẩu
    setIsForgotMode(prev => !prev);
  };

  const resetToLogin = () => {
    setIsForgotMode(false); // Quay lại chế độ đăng nhập
    setIsOtpVerified(false); // Reset trạng thái OTP
    setIsError([]); // Xóa lỗi
    resetField("email"); // Xóa dữ liệu email
    resetField("otp"); // Xóa dữ liệu OTP
    resetField("newPassword"); // Xóa dữ liệu mật khẩu mới
    resetField("confirmNewPassword"); // Xóa dữ liệu xác nhận mật khẩu
  };

  const state = {
    errors,
    watchUserName,
    watchPassword,
    watchEmail,
    watchOtp,
    isError,
    setIsError,
    alertMessage,
    isMobile,
    isTablet,
    notifyID,
    isForgotMode,
    resendTime,
    isOtpVerified
  };

  const handler = {
    register,
    handleSubmitLogin,
    resetToLogin,
    handleSubmitForgotPassword,
    handleResendOtp,
    toggleForgotMode,
    handleSubmitEmail,
    handleSubmitNewPassword,
    handleBlurUsername: (e: React.FocusEvent<HTMLInputElement>) => {
      if (!e.target.value) setIsError([1]);
      else setIsError(prev => prev.filter(i => i !== 1));
    },
    handleBlurPassword: (e: React.FocusEvent<HTMLInputElement>) => {
      if (!e.target.value) setIsError([2]);
      else setIsError(prev => prev.filter(i => i !== 2));
    },
    handleBlurEmail: (e: React.FocusEvent<HTMLInputElement>) => {
      if (!e.target.value) setIsError([1]);
      else setIsError(prev => prev.filter(i => i !== 1));
    },
    handleBlurOtp: (e: React.FocusEvent<HTMLInputElement>) => {
      if (!e.target.value) setIsError([2]);
      else setIsError(prev => prev.filter(i => i !== 2));
    },
  };

  return { state, handler };
}

export default useLoginPageHook;
