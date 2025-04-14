// rootReducer.ts
import { combineReducers } from 'redux';
import userSlice from './slices/userSlice';
import loginSlice from './slices/loginSlice';
import loadingSlice from './slices/loadingSlice';
import authSlice from './slices/authSlice';
// Kết hợp tất cả reducers lại
export const rootReducer = combineReducers({
  users: userSlice, // Tên 'users' sẽ là key trong state toàn cục, chứa dữ liệu từ userReducer
  login: loginSlice,
  loading:loadingSlice,
  authUser:authSlice
});