import React from "react";
import "./LoginPage.scss";
import useLoginPageHook from "./useLoginPage";
import { Container } from "@mui/material";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { Button, TextField, CircularProgress } from "@mui/material";

function LoginPage(): React.JSX.Element {
  const { state, handler } = useLoginPageHook();
  const validateField = {
    isRequired: {
      "& .MuiInputBase-root": {
        "&.MuiOutlinedInput-root": {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "red",
            borderWidth: "2px",
          },
        },
      },
    },
  };
  return (
    <Container maxWidth={false}>
      <div className="login-Page">
        <Grid
          container
          spacing={1}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <Grid size={8}>
            <div className="login-Img">
              <img src="https://www.21kschool.com/vn/wp-content/uploads/sites/5/2022/09/5-Benefits-of-Personalized-Learning.png" alt="Findy Home" />
            </div>
          </Grid>
          <Grid
            size={4}
            container
            justifyContent={"center"}
            alignItems={"center"}
            className="login-Section"
          >
            <Grid size={12}>
              <div className="login-Form">
                <div className="login-Form-Header">
                  <Typography variant="h4" align="center" fontWeight={700} className="title-1">
                    Đăng nhập
                  </Typography>
                </div>
                <form
                  onSubmit={handler.handleLogin}
                  className="login-Main-Form"
                >
                  <TextField
                    {...handler.register("userName")}
                    sx={
                      state?.isError?.includes(1) && !state?.watchUserName
                        ? validateField.isRequired
                        : {}
                    }
                    className="login-Input"
                    id="userName"
                    label="Tên đăng nhập"
                    variant="outlined"
                    name="userName"
                    value={state.watchUserName}
                    onBlur={() => {
                      if (!state.watchUserName)
                        state?.setIsError((err) => [...err, 1]);
                      else state?.setIsError((err) => [...err.slice(1)]);
                    }}
                    disabled={state.isLoading}
                  />
                  {state?.isError?.includes(1) && !state?.watchUserName && (
                    <Typography className="isBlank">
                      {"Tên đăng nhập không để trống"}
                    </Typography>
                  )}
                  <TextField
                    {...handler.register("password")}
                    sx={
                      state?.isError?.includes(2) && !state?.watchPassword
                        ? { ...validateField.isRequired }
                        : {}
                    }
                    className="login-Input"
                    id="password"
                    label="Mật khẩu"
                    variant="outlined"
                    type="password"
                    name="password"
                    value={state.watchPassword}
                    onBlur={() => {
                      if (!state.watchPassword)
                        state?.setIsError((err) => [...err, 2]);
                      else state?.setIsError((err) => [...err.slice(2)]);
                    }}
                    disabled={state.isLoading}
                  />
                  {state?.isError?.includes(2) && !state?.watchPassword && (
                    <Typography className="isBlank">
                      {"Mật khẩu không để trống"}
                    </Typography>
                  )}
                  
                  {state.loginError && (
                    <Typography className="login-error" color="error" align="center" sx={{ mt: 1 }}>
                      {state.loginError}
                    </Typography>
                  )}
                  
                  <div className="forgot-Pass">
                    <Typography variant="body1">
                      <a href="youtube.com">Quên mật khẩu</a>
                    </Typography>
                  </div>
                  <div className="login-Submit">
                    <Button
                      type="submit"
                      className="submit-Button"
                      variant="contained"
                      disabled={state.isLoading}
                    >
                      {state.isLoading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        <Typography variant="body2">Đăng nhập</Typography>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </Grid>
          </Grid>
        </Grid>
      </div>
    </Container>
  );
}
export default LoginPage;
