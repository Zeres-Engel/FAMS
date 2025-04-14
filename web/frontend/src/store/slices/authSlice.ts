import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { clearAuth } from '../../services/authServices';

interface AuthState {
  role: string | null;
}

const initialState: AuthState = {
  role: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setRole(state, action: PayloadAction<string>) {
      state.role = action.payload.toLowerCase();
    },
    logout(state) {
      clearAuth()
      state.role = null;
    },
  },
});

export const { setRole, logout } = authSlice.actions;
export default authSlice.reducer;
