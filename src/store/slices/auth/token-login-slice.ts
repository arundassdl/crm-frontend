import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../root-reducer';
import getTokenLoginApi from '@/services/api/auth/token-login-api';
import { showToast } from '@/components/ToastNotificationNew';
import { UpdatePartyName } from '../general_slices/profile-page-slice';
import { ProfileDataFetch } from '@/services/api/general_apis/ProfilePageApi/profile-page-api';
// import { companyProfilePage } from '@/services/api/my-company/my-comapny-api';


export const getAccessToken: any = createAsyncThunk(
  'accessToken/getAccessToken',
  async (param: any, { dispatch }) => {
    const AccessTokenData = await getTokenLoginApi(param);
    console.log(AccessTokenData, 'AccessTokenData');
    
    if (AccessTokenData?.data?.hasOwnProperty('access_token')) {
      localStorage.setItem('isLoggedIn', 'true');

      const ProfileOrderData = await ProfileDataFetch(AccessTokenData?.data?.access_token);
      console.log(ProfileOrderData?.data?.message?.data?.billing_address, ' ProfileOrderData1');
      
      // const company: any = await companyProfilePage({limit: 10,},AccessTokenData?.data?.access_token);
      // console.log("userCompanyData=========>2", JSON.stringify(company?.detail));
         
      // localStorage.setItem("userCompanyData", JSON.stringify(company?.detail));
      localStorage.setItem('userProfileData', JSON.stringify(ProfileOrderData?.data?.message));
      // localStorage.setItem('userAddress', JSON.stringify(ProfileOrderData?.data?.message?.data?.billing_address));
      localStorage.setItem('AccessTokenData', JSON.stringify(AccessTokenData?.data));

      document.cookie = "isLoggedIn=true; path=/;userProfileData=" + JSON.stringify(ProfileOrderData?.data?.message) + "AccessTokenData" + JSON.stringify(AccessTokenData?.data);

      dispatch(UpdatePartyName(ProfileOrderData?.data?.message?.full_name));
      showToast('logged in successfully', 'success');
        // console.log("userProfileData=========>2", JSON.stringify(ProfileOrderData?.data?.message));
        
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
