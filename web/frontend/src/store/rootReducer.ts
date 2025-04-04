// rootReducer.ts
import { combineReducers } from 'redux';
import userSlice from './slices/userSlice';
// Kết hợp tất cả reducers lại
export const rootReducer = combineReducers({
  users: userSlice, // Tên 'users' sẽ là key trong state toàn cục, chứa dữ liệu từ userReducer
});