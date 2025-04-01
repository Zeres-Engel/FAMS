import { useWatch,useForm } from 'react-hook-form';
import {  useState } from "react";
import { LoginForm } from "../../model/loginModels/loginModels.model";

function useLoginPageHook() {
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
  // const watchError = useWatch(!userName || !password)
  const [isError, setIsError] = useState<number[]>([]);
  const watchUserName = useWatch({ control, name: "userName" });
  const watchPassword = useWatch({ control, name: "password" });
  const handleLogin = handleSubmit(data => {
    if(!watchUserName || !watchPassword){
      setIsError([1,2])
      watchUserName ? setFocus('password') : setFocus('userName')
    }
    console.log(data);
    
  });
  const state = { errors, watchUserName, watchPassword,isError,setIsError };
  const handler = { register, handleLogin };
  return { state, handler };
}
export default useLoginPageHook;
