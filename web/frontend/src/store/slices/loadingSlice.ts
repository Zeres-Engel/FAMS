
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LoadingState {
  isLoading: boolean;
}

const initialState: LoadingState = {
  isLoading: false,
};

const loadingSlice = createSlice({
  name: "loading",
  initialState,
  reducers: {
    showLoading: state => {
      state.isLoading = true;
    },
    hideLoading: state => {
      state.isLoading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { showLoading, hideLoading, setLoading } = loadingSlice.actions;
export default loadingSlice.reducer;