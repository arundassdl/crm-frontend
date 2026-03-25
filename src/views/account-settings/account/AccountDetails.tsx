'use client'
import { useState, useEffect, ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import { Card, CardContent, Button, Typography, TextField, Grid } from '@mui/material';
import { fetchprofileDataThunk } from '@/store/slices/general_slices/profile-page-slice';
import { get_access_token } from '@/store/slices/auth/token-login-slice';
import { ProfileValidation } from '@/validation/profileFormValidation';
import storeProfileData from '@/services/api/general_apis/ProfilePageApi/store-profile-api';
import { ProfileDataFetch } from '@/services/api/general_apis/ProfilePageApi/profile-page-api';
import { showToast } from '@/components/ToastNotificationNew';
import ProfileImageUploadApi from '@/services/api/general_apis/ProfilePageApi/image-upload-api';
import { CONSTANTS } from '@/services/config/app-config';
import ProfileImageUpload from '@/components/UI/ProfileImageUpload';

const AccountDetails = ({
  allProfileData,
}: any) => {
  // console.log("profileList1",allProfileData);
  // const { profileList } = useProfilePage();

  const [initialValues, setInitialValues] = useState({
    // address: "",
    // associated_to: "",
    // company_code: "",
    // company_name: "",
    full_name: "",
    customer_id: "",
    last_name: "",
    email: "",
    first_name: "",
    user_image: "",
    username: "",
  });
  const [profileData, setProfileData] = useState<any>(allProfileData || initialValues);

  // States
  const [formData, setFormData] = useState<any>(initialValues);
  const [fileInput, setFileInput] = useState<string>('');
  const [imgSrc, setImgSrc] = useState<any>([]);
  const [language, setLanguage] = useState<string[]>(['English']);
  const dispatch = useDispatch();
  const TokenFromStore: any = useSelector(get_access_token);
  const [userToken, setUserToken] = useState<any>(()=>{
    const initialValue = JSON.parse(localStorage.getItem('AccessTokenData') || '{}');
    return initialValue || "";
  });
  let [profile_list, setProfileImgList] = useState<any>([]);


  useEffect(() => {
    console.log("allProfileData on load:", allProfileData);
  
    if (allProfileData && allProfileData) {
      setProfileData(allProfileData);
      setInitialValues(allProfileData);
      const img_Arry = [
        {
          name: allProfileData?.username,
          file_url: CONSTANTS?.API_BASE_URL+allProfileData?.user_image,
          file_name: allProfileData?.username,
        },
      ];
      console.log("img_Arry", img_Arry);
      setImgSrc(img_Arry);
      console.log("img_Arryimgsrc", imgSrc);
    }
  }, [allProfileData]);


  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    const { files } = event.target;

    if (files && files.length > 0) {
      reader.onload = () => {
        setImgSrc(reader.result as string);
        setFileInput(reader.result as string);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleFileInputReset = () => {
    setFileInput('');
    const imgFile = (profileData?.user_image) ?CONSTANTS?.API_BASE_URL+ profileData?.user_image : "/images/avatars/5.png"

    setImgSrc(imgFile);
  };

  const updateLocalProfile = async () => {
    const profiledata = await ProfileDataFetch(userToken?.access_token);
    console.log("profiledata jjjjjjjjj",profiledata);
    
    localStorage.setItem('userProfileData', JSON.stringify(profiledata?.data?.message));
    
  };

  const handlesubmit = async (values: any) => {
    try {
      // console.log(values, 'storeProfileUpdateApiResvalues');
      const storeProfileUpdateApiRes = await storeProfileData(values);
      console.log(storeProfileUpdateApiRes, 'storeProfileUpdateApiRes');
      await updateLocalProfile();
      showToast(storeProfileUpdateApiRes?.data.msg, "success");

    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleFileChangeCompress = async (data) => {
    const values = {}
  
    const formData = new FormData();
   
    
    for (const file of data) {
      if (!file.name.match(/\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/)) {
        showToast("Please select valid image", "error");
        return false;
      }
      formData.append('images[]', file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      // console.log("reader.result",reader.result);

      
      reader.onload = () => {
        setImgSrc(reader.result as string);
      };
      reader.onerror = () => {
        // console.log(reader.error);
      };

    }
    // console.log("reader.formData",formData);
 
    values['files'] = formData;
    values['customer_id'] = allProfileData && allProfileData?.email;
    // console.log("values=>", values);

    let profileImageUpload: any = await ProfileImageUploadApi(values, TokenFromStore?.token);
    // console.log('here', profileImageUpload);
    if (profileImageUpload?.msg === "success") {

      showToast(profileImageUpload?.data.msg, "success");
      // router.push("/survey");

      const uploaded_file = CONSTANTS.API_BASE_URL + profileImageUpload?.data.file
      let profile_details = Object.assign({}, allProfileData);
      profile_details.user_image = profileImageUpload?.data.file

      let profile_list = Object.assign({}, allProfileData);
      profile_list.profile_details = profile_details
      
      localStorage.setItem('userProfileData', JSON.stringify(profile_list?.profile_details));
      setProfileImgList(profile_list)
    } else {
      showToast(profileImageUpload?.error, "error");
    }

  };

  const formik = useFormik({
    initialValues: profileData || initialValues,
    enableReinitialize: true,
    validationSchema: ProfileValidation,
    onSubmit: async (values, actions) => {
      
      const requestParams = {
        value: { ...values },
        token: userToken?.access_token,
      };
      console.log("requestParams",requestParams)
      
      await handlesubmit(requestParams);

      dispatch(fetchprofileDataThunk(userToken?.access_token));
      actions.resetForm();
    },
  });
  const handleChildData = (data:  File[]) => {
    console.log("data22222@@@",data);
    handleFileChangeCompress(data);
  };
console.log("imgSrcimgSrcimgSrc img_Arry",imgSrc);


  return (
    <Card>
      <CardContent className='mbe-5'>
        <div className='flex max-sm:flex-col gap-6'>
          {/* <img height={100} width={100} className='rounded' src={imgSrc[0]?.file_url} alt='Profile' /> */}
          <ProfileImageUpload onSendData={handleChildData} imageArry={imgSrc}/>
          <div className='flex flex-grow flex-col gap-4'>
            <div className='flex flex-col sm:flex-row gap-4'>
            
              {/* <Button component='label' size='small' variant='contained' htmlFor='account-settings-upload-image'>
                Upload New Photo                
                <input
                  hidden
                  type='file'
                  value={fileInput}
                  accept='image/png, image/jpeg'
                  onChange={handleFileChange}
                  id='account-settings-upload-image'
                />
              </Button> */}
              {/* <Button size='small' variant='outlined' color='error' onClick={handleFileInputReset}>
                Reset
              </Button> */}
            </div>
            {/* <Typography>Allowed JPG, GIF or PNG. Max size of 800K</Typography> */}
          </div>
        </div>
      </CardContent>
      <CardContent>
        <form onSubmit={formik.handleSubmit} className='flex flex-col gap-5'>
          {/* <TextField
            id="customer_id"
            name="customer_id"
            value={formik.values.customer_id}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            sx={{ display: 'none' }}
          /> */}
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="first_name"
                name="first_name"
                label="First Name"
                value={formik.values.first_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.first_name && Boolean(formik.errors.first_name)}
                helperText={formik.touched.first_name && typeof formik.errors.first_name == 'string' ? formik.errors.first_name:' '}
              />
            </Grid>
              <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="last_name"
                name="last_name"
                label="Last Name"
                value={formik.values.last_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.last_name && Boolean(formik.errors.last_name)}
                helperText={formik.touched.last_name && typeof formik.errors.last_name == 'string' ? formik.errors.last_name:' '}
              />
            </Grid>
 <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="username"
                name="username"
                label="User Name"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.username && Boolean(formik.errors.username)}
                helperText={formik.touched.username && typeof formik.errors.username == 'string' ? formik.errors.username:' '}
              />
            </Grid>
            {/* <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name"
                placeholder="Company Name"
                value={(formik.values.company_name != null) ? formik.values.company_name : ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.company_name && Boolean(formik.errors.company_name)}
                helperText={formik.touched.company_name && typeof formik.errors.company_name == 'string' ? formik.errors.company_name:' '}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile Number"
                placeholder="Mobile Number"
                value={formik.values.contact_no}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.contact_no && Boolean(formik.errors.contact_no)}
                helperText={formik.touched.contact_no && typeof formik.errors.contact_no == 'string' ? formik.errors.contact_no:' '}
                disabled
              />
            </Grid> */}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                placeholder="Enter Email Address"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && typeof formik.errors.email == 'string' ? formik.errors.email:' '}
                disabled
              />
            </Grid>
            {/* <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="User Type"
                placeholder="User Type"
                value={formik.values.userType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.userType && Boolean(formik.errors.userType)}
                helperText={formik.touched.userType && typeof formik.errors.userType == 'string' ? formik.errors.userType:' '}
                disabled
              />
            </Grid>
            {(profileData.userType === "Dealer" || profileData.userType === "Sub Dealer" || profileData.userType === "Customer" || profileData.userType === "Surveyor") ? (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="associated_to"
                  name="associated_to"
                  label={profileData.userType === "Dealer" ? "Distributor name" : "Dealer name"}
                  placeholder={profileData.userType === "Dealer" ? "Distributor name" : "Dealer name"}
                  value={formik.values.associated_to}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.associated_to && Boolean(formik.errors.associated_to)}
                  helperText={formik.touched.associated_to && typeof formik.errors.associated_to == 'string' ? formik.errors.associated_to:' '}
                />
              </Grid>
            ) : null} */}

            

            <Grid item xs={12} className='flex gap-4 flex-wrap'>
              <Button variant='contained' type='submit'>
                Save Changes
              </Button>
              <Button variant='outlined' type='reset' color='secondary' onClick={() => setInitialValues(profileData)}>
                Reset
              </Button>
            </Grid>
          </Grid>
        </form>

      </CardContent>
    </Card>
  );
};

export default AccountDetails;
