import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../root-reducer';
import getTokenLoginApi from '@/services/api/auth/token-login-api';
import { showToast } from '@/components/ToastNotificationNew';
import { UpdatePartyName } from '../general_slices/profile-page-slice';
import { ProfileDataFetch } from '@/services/api/general_apis/ProfilePageApi/profile-page-api';
import { persistUserProfileData } from '@/utils/userProfileDataStorage';
import { persistAccessTokenData } from '@/utils/accessTokenDataStorage';
import { get_array_from_roledoctype } from '@/services/api/roles/roles-api';
// import { companyProfilePage } from '@/services/api/my-company/my-comapny-api';


export const getAccessToken: any = createAsyncThunk(
  'accessToken/getAccessToken',
  async (param: any, { dispatch }) => {
    const AccessTokenData = await getTokenLoginApi(param);
    console.log(AccessTokenData, 'AccessTokenData');
    
    if (AccessTokenData?.data?.hasOwnProperty('access_token')) {
      const ProfileOrderData = await ProfileDataFetch(AccessTokenData?.data?.access_token);

      // Only use localStorage in the browser (avoids SSR and unsupported environments)
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem('isLoggedIn', 'true');

          // Safe access: profile API returns message as array or single object
          const message = ProfileOrderData?.data?.message;
          const permissionData = Array.isArray(message) ? message[0]?.permission : message?.permission;
          const permissionArray = Array.isArray(permissionData) ? permissionData : [];
          localStorage.setItem('userpermission', JSON.stringify(permissionArray));

          if (message !== undefined) {
            const profileForStorage = Array.isArray(message) ? message[0] : message
            if (profileForStorage != null && typeof profileForStorage === 'object') {
              persistUserProfileData(profileForStorage)
            }
          }
          persistAccessTokenData(AccessTokenData?.data);
        } catch (e) {
          console.error('Failed to write to localStorage:', e);
        }
      }

      document.cookie = 'isLoggedIn=true';
      document.cookie = 'role_profile=' + AccessTokenData?.data?.role_profile;

      const profileMessage = ProfileOrderData?.data?.message;
      const fullName = Array.isArray(profileMessage) ? profileMessage[0]?.full_name : profileMessage?.full_name;
      dispatch(UpdatePartyName(fullName));
      showToast('logged in successfully', 'success');

      // Populate menuListData before redirect so the sidebar renders immediately on landing
      await get_array_from_roledoctype().catch(() => {});

      setTimeout(() => {
        window.location.href ="/"
      }, 1200);
    } else {
      showToast('Invalid Credentials', 'error');
    }
    return AccessTokenData;
  }
);
interface RepoAccessTokenState {
  token: any;
  error: string;
  isLoading: 'idle' | 'pending' | 'succeeded' | 'failed';
}

const initialState: RepoAccessTokenState = {
  token: '',
  error: '',
  isLoading: 'idle',
};

export const GetAccessTokenScreen = createSlice({
  name: 'accessToken',
  initialState,
  reducers: {
    ClearToken(state?: any, action?: any) {
      state.token = '';
      state.error = '';
      state.isLoading = 'idle';
    },
    updateAccessToken(state?: any, action?: any) {
      console.log('new access token payload', action.payload);
      state.token = action?.payload;
      state.error = '';
      state.isLoading = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getAccessToken.pending, (state) => {
      state.isLoading = 'pending';
      state.token = '';
    });
    builder.addCase(getAccessToken.fulfilled, (state, action) => {
      console.log('token payload', action?.payload);
      if (action?.payload?.data?.hasOwnProperty('access_token')) {
        state.token = action?.payload?.data?.access_token;
        state.isLoading = 'succeeded';
      }
    });
    builder.addCase(getAccessToken.rejected, (state, action) => {
      state.isLoading = 'failed';
      state.token = '';
      state.error = 'failed to store token';
    });
  },
});

export const get_access_token = (state: RootState) =>
  state.GetAccessTokenScreen;
export const { ClearToken, updateAccessToken }: any =
  GetAccessTokenScreen.actions;

export default GetAccessTokenScreen.reducer;

