import React from "react";
import "./LoginPage.scss";
import useLoginPageHook from "./useLoginPageHook";
import { Container } from "@mui/material";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { Button, TextField } from "@mui/material";
import NotifyBar from "../../components/NotifyBar/NotifyBar";
import GlobalLoading from "../../components/ShowLoading/ShowLoading";

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
      <GlobalLoading />
      {/* {state?.alertMessage && <NotifyBar notifyID={state?.notifyID}  notifyType='warning' notifyContent={state?.alertMessage}/>} */}
      <div className="login-Page">
        <Grid
          container
          spacing={1}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <Grid size={8} className={state?.isTablet ? 'tabletMode' : ''}>
            <div className="login-Img">
              <img src="https://www.21kschool.com/vn/wp-content/uploads/sites/5/2022/09/5-Benefits-of-Personalized-Learning.png" alt="Login Image" />
            </div>
          </Grid>
          <Grid
            size={state?.isTablet ? state?.isMobile ? 12 : 8 : 4}
            container
            justifyContent={"center"}
            alignItems={"center"}
            className="login-Section"
          >
            <Grid size={10}>
              <div className="login-Form">
                <div className="login-Form-Header">
                  <Typography variant="h4" align="center" fontWeight={700} className="title-1">
                    Login
                  </Typography>
                </div>
                <form
                  onSubmit={handler.handleSubmitLogin}
                  className="login-Main-Form"
                >
                  <TextField
                    {...handler.register("userId")}
                    sx={
                      state?.isError?.includes(1) && !state?.watchUserName
                        ? validateField.isRequired
                        : {}
                    }
                    className="login-Input"
                    id="userId"
                    label="Username"
                    variant="outlined"
                    name="userId"
                    onBlur={e => {
                      if (!e?.target?.value)
                        state?.setIsError(err => [...err, 1]);
                      else state?.setIsError(err => [...err.slice(1)]);
                    }}
                  />
                  {state?.isError?.includes(1) && !state?.watchUserName && (
                    <Typography className="isBlank">
                      {"Username cannot be empty"}
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
                    label="Password"
                    variant="outlined"
                    type="password"
                    name="password"
                    onBlur={e => {
                      if (!e?.target?.value)
                        state?.setIsError(err => [...err, 2]);
                      else state?.setIsError(err => [...err.slice(2)]);
                    }}
                  />
                  {state?.isError?.includes(2) && !state?.watchPassword && (
                    <Typography className="isBlank">
                      {"Password cannot be empty"}
                    </Typography>
                  )}
                  <div className="forgot-Pass">
                    <Typography variant="body1">
                      <a href="youtube.com">Forgot password?</a>
                    </Typography>
                  </div>
                  <div className="login-Submit">
                    <Button
                      type="submit"
                      className="submit-Button"
                      variant="contained"
                    >
                      <Typography variant="body2">Login</Typography>
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
