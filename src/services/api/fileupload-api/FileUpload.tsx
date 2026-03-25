// 'use client'

// import React, { useState } from 'react';
// import { CONSTANTS } from '../../config/app-config';
// import axios from 'axios';

// export const handleFileUpload = async (token: any,event: React.ChangeEvent<HTMLInputElement>,setUploadProgress) => {
//   let response: any;
//   const version = CONSTANTS.VERSION;
//   const method = 'upload_images';
//   const entity = 'survey';
//   // const [uploadProgress, setUploadProgress] = useState(0);

//   // console.log("fileevent======", event.target.files);
//   // const formData = new FormData();
//   // formData.append('file', event.target.files);
//   // console.log("formDatafile======", formData);
//     const config = {
//       headers: {
//         Authorization: token,
//         'Content-Type': 'multipart/form-data' 
//       },
//     };
  
//     const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}`;
  
//     console.log('search url', url);
   
//     // await axios
//     //   .post(`${url}`, { ...config, timeout: 5000, data: formData,  })
//     //   .then((res) => {
//     //     console.log('filters check in file uplaod api res successful', res);
//     //     response = res?.data?.message?.data;
//     //   })
//     //   .catch((err) => {
//     //     if (err.code === 'ECONNABORTED') {
//     //       response = 'Request timed out';
//     //     } else if (err.code === 'ERR_BAD_REQUEST') {
//     //       response = 'Bad Request';
//     //     } else if (err.code === 'ERR_INVALID_URL') {
//     //       response = 'Invalid URL';
//     //     } else {
//     //       response = err;
//     //     }
//     //   });
//     // return response;


//     // try {
//     //   const res = await axios.post(url, event, {
//     //     ...config,
//     //     timeout: 5000, 
//     //     // method: "upload_file",  
//     //   });
//     //   console.log('filters check in file upload api res successful', res);
//     //   response = res?.data?.message?.data;
//     // } catch (err) {
//     //   if (err.code === 'ECONNABORTED') {
//     //     response = 'Request timed out';
//     //   } else if (err.code === 'ERR_BAD_REQUEST') {
//     //     response = 'Bad Request';
//     //   } else if (err.code === 'ERR_INVALID_URL') {
//     //     response = 'Invalid URL';
//     //   } else {
//     //     response = err;
//     //   }
//     // }
//     try {
//       const res = await axios.post(url, event, {
//         ...config,
//         onUploadProgress: function(progressEvent) {
//           const percentCompleted = Math.round((progressEvent.loaded * 100) / Number(progressEvent.total));
//           setUploadProgress(percentCompleted);
//         }
//       });
//       console.log('Upload successful:', response.data);
//       response = res?.data?.message?.data;
//     } catch (error) {
//       console.error('Error uploading images:', error);
//       if (error.code === 'ECONNABORTED') {
//         response = 'Request timed out';
//       } else if (error.code === 'ERR_BAD_REQUEST') {
//         response = 'Bad Request';
//       } else if (error.code === 'ERR_INVALID_URL') {
//         response = 'Invalid URL';
//       } else {
//         response = error;
//       }
//     }
//     return response;
 

//   };

  
// //   import { useState } from 'react';
// //   import { useSelector } from "react-redux";
// //   import { get_access_token } from "../../../store/slices/auth/token-login-slice";
  
// // const UploadImages = () => {
// //   const [selectedFiles, setSelectedFiles] = useState([]);
// //     let response: any;
// //   const version = CONSTANTS.VERSION;
// //   const method = 'upload_images';
// //   const entity = 'survey';
// //   const TokenFromStore: any = useSelector(get_access_token);
// //   const [uploadProgress, setUploadProgress] = useState(0);

// //   const handleFileChange = (e) => {
// //     setSelectedFiles(Array.from(e.target.files));
// //   };

// //   const handleUpload = async () => {
// //     const formData = new FormData();
// //     selectedFiles.forEach((file) => {
// //       formData.append('images[]', file);
// //       // formData.append('file_name', file["name"]);
// //     });
// //     // formData.append("file", selectedFiles[0]);
// //     // formData.append('file_name', selectedFiles[0]['name']);
// //     // console.log('selectedfiles',selectedFiles[0]['name']);
// //     // const url = `${CONSTANTS.API_BASE_URL}/api/method/upload_file`;
// //     const url = `${CONSTANTS.API_BASE_URL}${CONSTANTS.API_MANDATE_PARAMS}?version=${version}&method=${method}&entity=${entity}`;

// //     try {
// //       const response = await axios.post(url, formData, {
// //         headers: {
// //           Authorization: TokenFromStore?.token,
// //           'Content-Type': 'multipart/form-data',
// //         },
// //         // onUploadProgress: function(progressEvent) {
// //         //   const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
// //         //   setUploadProgress(percentCompleted);
// //         // }
// //       });
// //       console.log('Upload successful:', response.data);
// //     } catch (error) {
// //       console.error('Error uploading images:', error);
// //     }
// //   };

// //   return (
// //     <div className="align-items-center justify-content-center mt-5 mb-5" style={{padding:'100px'}}>

// //       <input type="file" multiple onChange={handleFileChange} />
// //       <button onClick={handleUpload}>Upload</button>
// //       <progress value={uploadProgress} max="100"></progress>
// //     </div>
// //   );
// // };

// export default handleFileUpload;
