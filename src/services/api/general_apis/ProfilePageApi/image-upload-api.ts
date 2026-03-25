import axios from 'axios';
import { CONSTANTS } from '../../../config/app-config';

const ProfileImageUpload = async (request: any, token: any) => {
  let response: any;
  const version = CONSTANTS.VERSION;
  const method = 'image_upload_compress';
  const entity = 'profile';
  console.log(request, 'body');
  const params = `?version=${version}&method=${method}&entity=${entity}`;
  let url: any
  let form_data = request.files;

  console.log('request',request);

  url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}${params}&customer_id=${request.customer_id}`

  const config = {
    headers: {
      Authorization: token,
      // Accept: 'application/json',
      'Content-Type': 'multipart/form-data' 
    },
  };
  //    const val= JSON.stringify(body)


  try {
    const res = await axios.post(url, form_data, {
      ...config,
    });
    
    response = res?.data?.message;
    console.log('image uplaod :', response);
  } catch (error:any) {
    console.error('Error uploading images:', error);
    if (error.code === 'ECONNABORTED') {
      response = 'Request timed out';
    } else if (error.code === 'ERR_BAD_REQUEST') {
      response = 'Bad Request';
    } else if (error.code === 'ERR_INVALID_URL') {
      response = 'Invalid URL';
    } else {
      response = error;
    }
  }
  return response;

  // await axios
  //   .post(
  //     url,
  //     event,
  //     { ...config, timeout: 5000 }
  //   )
  //   .then((res) => {
  //     console.log(res, 'rrrr');
  //     response = res;
  //   })
  //   .catch((err) => {
  //     if (err.code === 'ECONNABORTED') {
  //       response = 'Request timed out';
  //     } else if (err.code === 'ERR_BAD_REQUEST') {
  //       response = 'Bad Request';
  //     } else if (err.code === 'ERR_INVALID_URL') {
  //       response = 'Invalid URL';
  //     } else {
  //       response = err;
  //     }
  //   });
  // return response;
};

const ProfileImageUploadApi = (request: any, token: any) => ProfileImageUpload(request, token);

export default ProfileImageUploadApi;
