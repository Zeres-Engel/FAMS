import { useWatch, useForm } from 'react-hook-form';
import { useState } from "react";
import { LoginForm } from "../../model/loginModels/loginModels.model";
import authService from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import tokenRefresher from '../../services/tokenRefresher';

function useLoginPageHook() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
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
  
  const [isError, setIsError] = useState<number[]>([]);
  const watchUserId = useWatch({ control, name: "userId" });
  const watchPassword = useWatch({ control, name: "password" });
  
  const handleLogin = handleSubmit(async (data: LoginForm) => {
    // Reset previous errors
    setLoginError(null);
    
    // Validate form
    if(!watchUserId || !watchPassword) {
      setIsError([1,2]);
      watchUserId ? setFocus('password') : setFocus('userId');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Login attempt with:', { userId: data.userId });
      
      // Call auth service login method
      const user = await authService.login(data);
      
      console.log('Login successful:', user);
      
      // Start token refresh mechanism
      tokenRefresher.startTokenRefresh();
      
      // Redirect to homepage or dashboard based on role
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Improved error message handling
      let errorMessage = 'Đăng nhập không thành công. Vui lòng thử lại.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  });
  
  const state = { 
    errors, 
    watchUserId, 
    watchPassword, 
    isError, 
    setIsError, 
    isLoading, 
    loginError 
  };
  const handler = { register, handleLogin };
  
  return { state, handler };
}

export default useLoginPageHook;
