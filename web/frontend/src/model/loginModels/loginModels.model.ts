interface LoginForm {
  userId: string;
  password: string;
  email?:string;
  otp?:string
}
interface LoginTest {
  email: string;
  password: string;
}
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
export type { LoginForm, AuthTokens, LoginTest };
