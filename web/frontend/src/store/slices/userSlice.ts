// userSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { Data } from '../../model/tableModels/tableDataModels.model';

interface UserState {
  user: null | Data[];
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
};

export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`https://api.escuelajs.co/api/v1/users`);
      return response.data; // Trả về dữ liệu từ API
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);  // Nếu có lỗi, trả về message lỗi
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;  // Lưu lỗi vào state nếu có
      });
  },
});

export default userSlice.reducer;
