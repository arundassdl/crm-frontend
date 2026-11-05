import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../root-reducer";
export const getAccessToken: any = createAsyncThunk(
  "accessToken/getAccessToken",
  async () => {
    throw new Error("Use centralized EVOQ SSO.");
  },
);
const slice = createSlice({
  name: "accessToken",
  initialState: { token: "", error: "", isLoading: "idle" },
  reducers: {
    ClearToken(state) {
      state.token = "";
    },
    updateAccessToken(state) {
      state.token = "";
    },
  },
});
export const GetAccessTokenScreen = slice;
export const get_access_token = (state: RootState) =>
  state.GetAccessTokenScreen;
export const { ClearToken, updateAccessToken } = slice.actions;
export default slice.reducer;
