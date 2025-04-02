declare module 'axios' {
  import * as AxiosOriginal from 'axios';
  
  // Re-export all axios exports
  export * from 'axios';
  
  // Create interfaces for the axios types
  export interface AxiosRequestConfig extends AxiosOriginal.AxiosRequestConfig {}
  export interface AxiosResponse<T = any> extends AxiosOriginal.AxiosResponse<T> {}
  export interface AxiosError<T = any> extends AxiosOriginal.AxiosError<T> {}
  
  // Default export is the axios instance
  const axios: AxiosOriginal.AxiosStatic;
  export default axios;
} 