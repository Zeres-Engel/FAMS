// store/slices/notifySlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

let notifyIdCounter = 0;

export type Notify = {
  id: number;
  type: "success" | "info" | "warning" | "error";
  message: string;
  duration?: number;
};

const notifySlice = createSlice({
  name: "notify",
  initialState: [] as Notify[],
  reducers: {
    addNotify: (state, action: PayloadAction<Omit<Notify, "id">>) => {
      state.push({
        id: ++notifyIdCounter,
        ...action.payload,
      });
    },
    removeNotify: (state, action: PayloadAction<number>) => {
      return state.filter((n) => n.id !== action.payload);
    },
  },
});

export const { addNotify, removeNotify } = notifySlice.actions;
export default notifySlice.reducer;
