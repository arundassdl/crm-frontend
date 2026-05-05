
// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// import { get_array_from_roledoctype } from '@/services/api/roles/roles-api';
// import { RootState } from '../../root-reducer';

// export const fetchMenulistThunkAPI = createAsyncThunk(
//   'menulist/fetchMenulist',
//   async (_, thunkAPI) => {
//     try {
//       const MenulistData = await get_array_from_roledoctype();
//       console.log('MenulistData res', MenulistData);
//       return MenulistData;
//     } catch (error) {
//       console.error('Failed to fetch menu list:', error);
//       return thunkAPI.rejectWithValue('Failed to fetch menu list');
//     }
//   }
// );

// interface RepoDisplayTag {
//   menuData: any;
//   error: string;
//   isLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
// }

// const initialState: RepoDisplayTag = {
//   menuData: [],
//   error: '',
//   isLoading: 'idle',
// };

// const menuListSlice = createSlice({
//   name: 'menuList', // 🔁 This is the key used in rootReducer
//   initialState,
//   reducers: {
//     setMenulistData(state, action) {
//       state.menuData = action.payload;
//       state.isLoading = 'succeeded';
//       state.error = '';
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchMenulistThunkAPI.pending, (state) => {
//         state.menuData = [];
//         state.isLoading = 'pending';
//         state.error = '';
//       })
//       .addCase(fetchMenulistThunkAPI.fulfilled, (state, action) => {
//         state.menuData = action.payload;
//         state.isLoading = 'succeeded'; // ✅ fixed
//         state.error = '';
//       })
//       .addCase(fetchMenulistThunkAPI.rejected, (state, action) => {
//         state.isLoading = 'failed';
//         state.error = action.payload as string;
//         state.menuData = [];
//       });
//   },
// });

// export const { setMenulistData } = menuListSlice.actions;

// // ✅ Use the same key used in rootReducer
// // export const menuListDataFromStore = (state: RootState) => state.menuList;

// export const menuListDataFromStore = (state: RootState) =>
//   state?.menuListSlice ;

// export default menuListSlice.reducer;

