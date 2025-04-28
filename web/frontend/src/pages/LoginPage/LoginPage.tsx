import React from "react";
import "./LoginPage.scss";
import useLoginPageHook from "./useLoginPageHook";
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
} from "@mui/material";
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
      <div className="login-Page">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="row"
        >
          <Box
            sx={{
              width: state?.isTablet ? "100%" : "50%",
              padding: state?.isTablet ? "0" : "20px",
              textAlign: "center",
            }}
            className={state?.isTablet ? "tabletMode" : ""}
          >
            <div className="login-Img">
              <img
                src="https://www.21kschool.com/vn/wp-content/uploads/sites/5/2022/09/5-Benefits-of-Personalized-Learning.png"
                alt="Login Img"
                style={{ width: "100%" }}
              />
            </div>
          </Box>

          <Box
            sx={{
              width: state?.isTablet
                ? state?.isMobile
                  ? "100%"
                  : "80%"
                : "40%",
              // padding: state?.isTablet ? '0 10px' : '20px',
            }}
            display="flex"
            justifyContent="end"
            alignItems="center"
            className="login-Section"
          >
            <Box
              sx={{
                width: state?.isTablet
                  ? state?.isMobile
                    ? "100%"
                    : "80%"
                  : "70%",
              }}
            >
              <div className="login-Form">
                <div className="login-Form-Header">
                  <Typography
                    variant="h4"
                    align="center"
                    fontWeight={700}
                    className="title-1"
                  >
                    {state.isForgotMode ? "Forgot Password" : "Login"}
                  </Typography>
                </div>

                {state.isForgotMode ? (
                  // Forgot Password Form
                  <form
                    onSubmit={handler.handleSubmitForgotPassword}
                    className="login-Main-Form"
                  >
                    <TextField
                      {...handler.register("email")}
                      sx={
                        state?.isError?.includes(1) && !state?.watchEmail
                          ? validateField.isRequired
                          : {}
                      }
                      className="login-Input"
                      id="email"
                      label="Email"
                      variant="outlined"
                      name="email"
                      onBlur={handler.handleBlurEmail}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              disabled={!state.watchEmail}
                              onClick={handler.handleSubmitEmail} // Thêm handler cho nút "Submit Email"
                              size="small"
                            >
                              Send otp
                            </Button>
                          </InputAdornment>
                        ),
                      }}
                    />
                    {state?.isError?.includes(1) && !state?.watchEmail && (
                      <Typography className="isBlank">
                        {"Email cannot be empty"}
                      </Typography>
                    )}

                    <TextField
                      {...handler.register("otp")}
                      disabled={!state.watchEmail}
                      sx={
                        state?.isError?.includes(2) && !state?.watchOtp
                          ? validateField.isRequired
                          : {}
                      }
                      className="login-Input"
                      id="otp"
                      label="OTP Code"
                      variant="outlined"
                      name="otp"
                      onBlur={handler.handleBlurOtp}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              disabled={
                                state.resendTime > 0 || !state.watchEmail
                              }
                              onClick={handler.handleResendOtp}
                              size="small"
                            >
                              {state.resendTime > 0
                                ? `${state.resendTime}s`
                                : "Resend"}
                            </Button>
                          </InputAdornment>
                        ),
                      }}
                    />
                    {state?.isError?.includes(2) && !state?.watchOtp && (
                      <Typography className="isBlank">
                        {"OTP Code cannot be empty"}
                      </Typography>
                    )}

                    <div className="login-Submit">
                      <Button
                        type="submit"
                        className="submit-Button"
                        variant="contained"
                        fullWidth
                      >
                        <Typography variant="body2">Submit</Typography>
                      </Button>
                    </div>

                    <div className="forgot-Pass" style={{ marginTop: 8 }}>
                      <Typography variant="body1" align="center">
                        <button
                          style={{
                            cursor: "pointer",
                            background: "none",
                            border: "none",
                            color: "blue",
                            textDecoration: "underline",
                            padding: 0,
                          }}
                          onClick={handler.toggleForgotMode}
                        >
                          {"Back to Login"}
                        </button>
                      </Typography>
                    </div>
                  </form>
                ) : (
                  // Normal Login Form
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
                      onBlur={handler.handleBlurUsername}
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
                          ? validateField.isRequired
                          : {}
                      }
                      className="login-Input"
                      id="password"
                      label="Password"
                      variant="outlined"
                      type="password"
                      name="password"
                      onBlur={handler.handleBlurPassword}
                    />
                    {state?.isError?.includes(2) && !state?.watchPassword && (
                      <Typography className="isBlank">
                        {"Password cannot be empty"}
                      </Typography>
                    )}

                    <div className="forgot-Pass">
                      <Typography variant="body1">
                        <button
                          style={{
                            cursor: "pointer",
                            background: "none",
                            border: "none",
                            color: "blue",
                            textDecoration: "underline",
                            padding: 0,
                          }}
                          onClick={handler.toggleForgotMode}
                        >
                          Forgot password?
                        </button>
                      </Typography>
                    </div>

                    <div className="login-Submit">
                      <Button
                        type="submit"
                        className="submit-Button"
                        variant="contained"
                        fullWidth
                      >
                        <Typography variant="body2">Login</Typography>
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Box>
          </Box>
        </Box>
      </div>
    </Container>
  );
}

export default LoginPage;
