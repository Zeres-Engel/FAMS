import * as React from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "../../model/loginModels/loginModels.model";
import api from '../../api/axiosConfig';

function useLoginPageHook() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState(null);
  
  const [isError, setIsError] = React.useState<number[]>([]);
  const [watchUserName, setWatchUserName] = React.useState("");
  const [watchPassword, setWatchPassword] = React.useState("");
  
  // Kiểm tra kết nối API khi component mount
  React.useEffect(() => {
    async function testConnection() {
      try {
        console.log("Đang kiểm tra kết nối API...");
        const response = await api.get('/test');
        console.log("Kết quả kiểm tra API:", response.data);
      } catch (error) {
        console.error("Lỗi kết nối API:", error);
      }
    }
    
    testConnection();
  }, []);
  
  const register = (name: string) => ({
    name,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if(name === "userName") {
        setWatchUserName(e.target.value);
      } else if (name === "password") {
        setWatchPassword(e.target.value);
      }
    }
  });
  
  const setFocus = (field: string) => {
    const element = document.getElementById(field);
    if (element) {
      element.focus();
    }
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if(!watchUserName || !watchPassword){
      setIsError([1,2]);
      watchUserName ? setFocus('password') : setFocus('userName');
      return;
    }
    
    setIsLoading(true);
    setLoginError(null);
    
    try {
      console.log("Đang gửi yêu cầu đăng nhập:", {
        userId: watchUserName,
        password: watchPassword ? "***" : undefined
      });
      
      // Call the login API
      const response = await api.post('/auth/login', {
        userId: watchUserName,
        password: watchPassword
      });
      
      console.log("Kết quả đăng nhập:", response.data);
      
      // If login is successful
      if (response.data.success) {
        // Store the token in a cookie
        document.cookie = `jwtToken=${response.data.data?.token}; path=/; max-age=2592000`; // 30 days
        
        // Redirect to homepage
        navigate('/');
      }
    } catch (error) {
      console.error("Chi tiết lỗi đăng nhập:", error);
      
      // Handle login errors
      setLoginError(
        error.response?.data?.message || 
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const state = { 
    errors: {}, 
    watchUserName, 
    watchPassword,
    isError,
    setIsError,
    isLoading,
    loginError
  };
  
  const handler = { 
    register, 
    handleLogin 
  };
  
  return { state, handler };
}

export default useLoginPageHook;
