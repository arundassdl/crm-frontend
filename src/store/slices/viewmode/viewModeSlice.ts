// store/viewModeSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ViewState {
  viewMode: 'list' | 'kanban' | 'grid' ;
}

const initialState: ViewState = {
  viewMode: 'list',
};

const viewModeSlice = createSlice({
  name: 'viewMode',
  initialState,
  reducers: {
    setViewMode(state, action: PayloadAction<ViewState['viewMode']>) {
      state.viewMode = action.payload;
    },
  },
});

export const { setViewMode } = viewModeSlice.actions;
export default viewModeSlice.reducer;
