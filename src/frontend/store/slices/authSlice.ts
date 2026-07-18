import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthState = {
  isAuthenticated: boolean;
  displayName: string;
  email: string;
};

const initialState: AuthState = {
  isAuthenticated: false,
  displayName: "",
  email: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ displayName: string; email: string }>) => {
      state.isAuthenticated = true;
      state.displayName = action.payload.displayName;
      state.email = action.payload.email;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.displayName = "";
      state.email = "";
    },
    register: (
      state,
      action: PayloadAction<{ displayName: string; email: string }>,
    ) => {
      state.isAuthenticated = true;
      state.displayName = action.payload.displayName;
      state.email = action.payload.email;
    },
  },
});

export const { login, logout, register } = authSlice.actions;
export const authReducer = authSlice.reducer;
