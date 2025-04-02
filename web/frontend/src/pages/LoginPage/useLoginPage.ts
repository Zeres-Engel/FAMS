import { useWatch, useForm } from 'react-hook-form';
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { LoginForm } from "../../model/loginModels/loginModels.model";
import { authAPI } from '../../api/apiService';

function useLoginPageHook() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    setFocus,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      userName: "",
      password: "",
    },
  });
  
  const [isError, setIsError] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const watchUserName = useWatch({ control, name: "userName" });
  const watchPassword = useWatch({ control, name: "password" });
  
  const handleLogin = handleSubmit(async (data) => {
    if (!watchUserName || !watchPassword) {
      setIsError([1, 2]);
      watchUserName ? setFocus('password') : setFocus('userName');
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      const response = await authAPI.login(data.userName, data.password);
      
      if (response.data.success) {
        // Save token to cookie
        document.cookie = `jwtToken=${response.data.data.token}; path=/; max-age=${60 * 60 * 24 * 30}`;
        
        // Redirect to home page
        navigate('/');
      } else {
        setLoginError(response.data.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      setLoginError(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại');
    } finally {
      setIsLoading(false);
    }
  });
  
  const state = { 
    errors, 
    watchUserName, 
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
