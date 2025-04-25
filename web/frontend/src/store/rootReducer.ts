// rootReducer.ts
import { combineReducers } from 'redux';
import userSlice from './slices/userSlice';
import loginSlice from './slices/loginSlice';
import loadingSlice from './slices/loadingSlice';
import authSlice, { logout } from './slices/authSlice';
import notifySlice from './slices/notifySlice';
import classSlice from './slices/classSlice';
import scheduleSlice from './slices/scheduleSlice';
import teacherSlice from './slices/teacherSlice';
import classroomSlice from './slices/classroomSlice';
import subjectSlice from './slices/subjectSlice';
import classByIdSlice from './slices/classByIdSlice';
import classUserSlice from './slices/classUserSlice';
import attendanceSlice from './slices/attendanceSlice';
// Kết hợp tất cả reducers lại
const appReducer = combineReducers({
  users: userSlice,
  login: loginSlice,
  loading: loadingSlice,
  authUser: authSlice,
  notify: notifySlice,
  class: classSlice,
  schedule: scheduleSlice,
  teacher: teacherSlice,
  classroom: classroomSlice,
  subject: subjectSlice,
  classById: classByIdSlice,
  classUser:classUserSlice,
  attendanceData:attendanceSlice,
});
export const rootReducer = (state: any, action: any) => {
  if (action.type === logout.type) {
    state = undefined; // Reset toàn bộ Redux state
  }
  return appReducer(state, action);
};