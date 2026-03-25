// import React from 'react';
// import { useDropzone } from 'react-dropzone';
// import {
//   Box,
//   Typography,
//   Button,
//   Card,
//   CardContent,
//   CardMedia,
//   IconButton,
//   Grid,
// } from '@mui/material';
// import CloudUploadIcon from '@mui/icons-material/CloudUpload';
// import DeleteIcon from '@mui/icons-material/Delete';

// type Props = {
//     setFieldValue: (field: string, value: any) => void;
//   };

// const CustomDropzone: React.FC<Props> = ({ setFieldValue }) => {
//     const [files, setFiles] = React.useState<File[]>([]);

// //   const onDrop = (acceptedFiles: File[]) => {
// //     // setFiles((prev) => [...prev, ...acceptedFiles]);
// //     if (acceptedFiles.length > 0) {
// //         setFiles([acceptedFiles[0]]); // ✅ keep only the latest file
// //         setFieldValue('image', acceptedFiles[0]);
// //       }
// //   };
// const onDrop = (acceptedFiles: File[]) => {
    
    
//     if (acceptedFiles.length > 0) {
//         setFieldValue('image', acceptedFiles[0]);
//         console.log("acceptedFiles.length",acceptedFiles[0]);
//         setFiles([acceptedFiles[0]]);
//     }
//   };

  
// // const onDrop = (acceptedFiles: File[]) => {
// //     // ✅ acceptedFiles is an array, not a string
// //     console.log("acceptedFiles",acceptedFiles); // [File, File, ...]
// //   };
  
//   const { getRootProps, getInputProps, open } = useDropzone({
//     multiple: false,
//     onDrop,
//     noClick: true,
//     noKeyboard: true,
//     accept: 'image/*',
//     maxSize: 5 * 1024 * 1024, // 5MB
//   });

//   const handleRemove = (file: File) => {
//     setFiles((prev) => prev.filter((f) => f !== file));
    
//   };

//   return (
//     <Box
//       {...getRootProps()}
//       sx={{
//         border: '2px dashed #aaa',
//         padding: 4,
//         textAlign: 'center',
//         borderRadius: 2,
//         // backgroundColor: '#fafafa',
//       }}
//     >
//       <input {...getInputProps()} />
//       <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
//       <Typography variant="h6" mt={2}>
//         Drag & Drop files here or click below
//       </Typography>
//       <Typography variant="body2" color="textSecondary" mb={2}>
//         Only images are allowed (max 5MB)
//       </Typography>

//       <Button variant="contained" color="primary" onClick={open}>
//         Select Files
//       </Button>

//       {/* Preview section */}
//       <Grid container spacing={2} mt={2} justifyContent="center">
//         {files.map((file, index) => (
//           <Grid item key={index}>
//             <Card sx={{ width: 160 }}>
//               {file.type.startsWith('image/') ? (
//                 <CardMedia
//                   component="img"
//                   height="100"
//                   image={URL.createObjectURL(file)}
//                   alt={file.name}
//                 />
//               ) : (
//                 <CardContent>
//                   <Typography variant="body2" noWrap>
//                     📄 {file.name}
//                   </Typography>
//                 </CardContent>
//               )}
//               <IconButton
//                 size="small"
//                 onClick={() => handleRemove(file)}
//                 color="error"
//               >
//                 <DeleteIcon />
//               </IconButton>
//             </Card>
//           </Grid>
//         ))}
//       </Grid>
//     </Box>
//   );
// };

// export default CustomDropzone;
