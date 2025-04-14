const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const saveTokens = (accessToken: string, refreshToken: string) => {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const getAccessToken = (): string | null => {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
};
export const setAccessToken = (token: string) =>
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);

export const setRefreshToken = (token: string) =>
  localStorage.setItem(REFRESH_TOKEN_KEY, token);

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const removeTokens = () => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};
