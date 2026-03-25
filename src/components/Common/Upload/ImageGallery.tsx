"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Skeleton,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { CONSTANTS } from "@/services/config/app-config";
import { Accept, useDropzone } from "react-dropzone";
import { showToast } from "@/components/ToastNotificationNew";
import "react-image-gallery/styles/css/image-gallery.css";

import { Avatar, Tooltip, Badge, Modal } from "@mui/material";
import { Delete, ZoomIn, Close, Info } from "@mui/icons-material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules"; // For Swiper v8 or below
import "swiper/css";
import "swiper/css/navigation";
import FilePreview from "./FilePreview";

const frappeBaseUrl = CONSTANTS.API_BASE_URL || "";

interface UploadedFile {
  id: number;
  name: string;
  file_url: string;
  file_name: string;
  file_size: number;
  type: string;
}

interface ImageGalleryProps {
  attachedToDoctype: string;
  attachedToName: string;
  attachedToField?: string;
  folder?: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  allowedTypes?: string[];
  multiple?: boolean;
  initialFiles?: UploadedFile[];
  maxFiles?: number;
  heading?: string;
  btnHeading?: string;
  primaryImage?: string;
  thumbnailLimit?: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  attachedToDoctype,
  attachedToName,
  attachedToField,
  folder = "Home",
  onUploadComplete,
  allowedTypes = ["image/*"],
  multiple = true,
  initialFiles = [],
  maxFiles,
  heading,
  btnHeading,
  primaryImage,
  thumbnailLimit = 5,
}) => {
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] =
    useState<UploadedFile[]>(initialFiles);
  const [userToken, setUserToken] = useState<any>(() => {
    const initialValue = JSON.parse(
      localStorage.getItem("AccessTokenData") || "{}"
    );
    return initialValue || "";
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const maxFilesAllowed = maxFiles ?? 5;
  const [dropzoneOpen, setDropzoneOpen] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const [primary, setPrimary] = useState(uploadedFiles[0]?.name);
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState<any>(0);

  const [selectedImage, setSelectedImage] = useState(uploadedFiles[0]);
  const [primaryImageId, setPrimaryImageId] = useState<any>(
    primaryImage || null
  );
  const [gallery, setGallery] = useState(uploadedFiles);
  // const type = file.type.startsWith("video/") ? "video" : "image";

  useEffect(() => {
    if (uploadedFiles?.length > 0) {
      setSelectedImage(uploadedFiles[0]);
      setPrimary(uploadedFiles[0].name);
    }
  }, [uploadedFiles]);

  const handleThumbnailClick = (img) => setSelectedImage(img);

  const handleMakePrimary = async (img) => {
    console.log("img", img);
    try {
      const res = await fetch("/api/set-primary", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${userToken?.access_token}`,
        },
        body: JSON.stringify({
          doctype: attachedToDoctype,
          docname: attachedToName,
          field: "image",
          imagePath: img.file_url, // e.g., '/files/image1.png'
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update local UI
      setPrimary(img.id);
      setPrimaryImageId(img.file_url);
      showToast(data?.message, "success");
    } catch (err) {
      showToast("Error setting primary image", "error");
      // console.error("Error setting primary image:", err.message);
    }
  };

  const handleClose = () => setOpen(false);

  console.log("selectedImage=>", selectedImage);

  const handleOpenModal = (imageId) => {
    const index = uploadedFiles.findIndex((img) => img.name === imageId);
    setStartIndex(index);
    setOpen(true);
  };

  const handleDrop = async (acceptedFiles: File[]) => {
    const totalFiles = uploadedFiles.length + acceptedFiles.length;
    if (totalFiles > maxFilesAllowed) {
      alert(`You can upload up to ${maxFilesAllowed} files only.`);
      return;
    }

    setUploading(true);

    const uploaded: UploadedFile[] = [];

    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("is_private", "0");
        formData.append("folder", folder);
        formData.append("doctype", "File");
        formData.append("attached_to_doctype", attachedToDoctype);
        formData.append("attached_to_name", attachedToName);
        if (attachedToField) {
          formData.append("attached_to_field", attachedToField);
        }

        const res = await fetch("/api/multifile-upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `${userToken?.access_token}`,
          },
        });

        const result = await res.json();
        console.log("Upload result =>", result);

        if (res.ok && result?.message?.file_url) {
          const fileType = detectFileType(file);

          uploaded.push({
            id: result.message.id,
            name: result.message.name,
            file_url: result.message.file_url,
            file_name: result.message.file_name,
            file_size: result.message.file_size,
            type: fileType,
          });
        } else {
          console.error("Upload error response:", result);
        }
      }

      const finalFiles = [...uploadedFiles, ...uploaded];
      setUploadedFiles(finalFiles);
      onUploadComplete?.(finalFiles);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
      setDropzoneOpen(false); // Close modal/dropzone after completion
    }
  };

  const detectFileType = (
    file: File
  ): "image" | "video" | "pdf" | "doc" | "other" => {
    const mime = file.type;
    const name = file.name.toLowerCase();

    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime === "application/pdf") return "pdf";
    if (
      mime === "application/msword" ||
      mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".doc") ||
      name.endsWith(".docx")
    )
      return "doc";

    return "other";
  };
  const getFileType = (file: { type?: string; file_name?: string }): string => {
    const name = file.file_name?.toLowerCase() || "";
    const mime = file.type || "";

    if (mime.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/.test(name))
      return "image";
    if (mime.startsWith("video/") || /\.(mp4|webm|ogg)$/.test(name))
      return "video";
    if (mime === "application/pdf" || /\.pdf$/.test(name)) return "pdf";
    if (
      mime.includes("msword") ||
      mime.includes("officedocument") ||
      /\.(doc|docx)$/.test(name)
    )
      return "doc";

    return "other";
  };
   const accept: Accept = allowedTypes.reduce((acc, type) => {
    acc[type] = [];
    return acc;
  }, {} as Accept);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: accept,
    multiple,
  });

  const getFullUrl = (url: string) => {
    return url.startsWith("http") ? url : `${frappeBaseUrl}${url}`;
  };

  const listFiles = async (doctype: string, name: string) => {
    setLoading(true);
    const res = await fetch("/api/list-files", {
      method: "POST",
      body: JSON.stringify({ doctype, name }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `${userToken?.access_token}`,
      },
    });
    const data = await res.json();
    return data.data || [];
  };
  useEffect(() => {
    listFiles(attachedToDoctype, attachedToName).then((files) => {
      console.log("files", files);
      setLoading(false);
      setUploadedFiles(files);
    });
  }, []);

  const deleteFile = async (file: any) => {
    setDeletingFile(file.file_url);
    try {
      const res = await fetch("/api/delete-file", {
        method: "POST",
        body: JSON.stringify({ file }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `${userToken?.access_token}`,
        },
      });
      const data = await res.json();
      showToast("Record deleted successfully", "success");
      return data;
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletingFile(null);
    }
  };
  const handleDelete = (file: any) => {
    setFileToDelete(file);
    setConfirmOpen(true);
  };
  console.log("uploadeedfiles", uploadedFiles);

  const array = [...Array(thumbnailLimit + 2)];
  return (
    <>
      <Box>
        <Box>
          {/* {loading && <CircularProgress />} */}

          {loading ? (
            <>
              <Skeleton
                variant="rectangular"
                width={(thumbnailLimit + 2) * 46}
                height={120}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 1,
                }}
              />
              <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                {array.map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={46}
                    sx={{
                      border: "1px solid #ccc",
                      width: 46,
                      height: 46,
                      bgcolor: "#f0f0f0",
                    }}
                  />
                ))}
              </Box>
            </>
          ) : null}

          {selectedImage && !loading && (
            <Box
              sx={{
                // border: '1px solid #ddd',
                borderRadius: 2,
                p: 2,
                mb: 2,
                maxWidth: (thumbnailLimit + 2) * 46,
                textAlign: "center",
                position: "relative",
                cursor: "pointer",
                "&:hover .zoom-icon": { opacity: 1 },
              }}
            >
              <Box
                sx={{
                  border: "1px solid #ccc",
                  borderRadius: 2,
                  width: (thumbnailLimit + 2) * 46,
                  maxHeight: 400,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    cursor: "pointer",
                    maxHeight: 400,
                    "&:hover .zoom-icon": { opacity: 1 },
                  }}
                  onClick={() => handleOpenModal(selectedImage.name)}
                >
                  {/* <Box
                    component="img"
                    src={getFullUrl(selectedImage?.file_url)}
                    sx={{ width: "100%", borderRadius: 1 }}
                  /> */}
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: "100%",
                      height: 200, // fixed height for the wrapper
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      // borderRadius: 2,
                      border: "1px solid #ccc",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <FilePreview file={selectedImage} />
                  </Box>
                  <Box
                    className="zoom-icon"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      opacity: 0,
                      transition: "0.3s",
                      bgcolor: "rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ZoomIn sx={{ color: "#fff", fontSize: 42 }} />{" "}
                    {/* You can adjust fontSize as needed */}
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 1,
                  }}
                >
                  {/* {selectedImage.file_url} */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      ml: 5,
                      mt: 5,
                    }}
                  >
                    {primaryImageId && (
                      <>
                        {selectedImage.file_url === primaryImageId ? (
                          <Badge
                            color="success"
                            badgeContent="Primary"
                            sx={{ ml: 5 }}
                          >
                            {/* <CheckCircleIcon fontSize="small" /> */}
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => handleMakePrimary(selectedImage)}
                            size="small"
                          >
                            Mark as Primary
                          </Button>
                        )}
                      </>
                    )}
                  </Box>
                  <Tooltip title="Delete Image">
                    <IconButton
                      onClick={() => handleDelete(selectedImage)}
                      size="small"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 1 }}>
            {uploadedFiles.slice(0, thumbnailLimit).map((img) => (
              <Avatar
                key={img.name}
                variant="rounded"
                src={getFullUrl(img.file_url)}
                sx={{
                  border:
                    img.name === selectedImage?.name
                      ? "2px solid #1976d2"
                      : "1px solid #ccc",
                  width: 46,
                  height: 46,
                  cursor: "pointer",
                  transition: "0.2s",
                }}
                onClick={() => handleThumbnailClick(img)}
              />
            ))}

            {uploadedFiles.length > thumbnailLimit && (
              <Tooltip title="View more images">
                <Avatar
                  variant="rounded"
                  sx={{
                    width: 46,
                    height: 46,
                    bgcolor: "#e3edf7",
                    color: "#000",
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                  onClick={() =>
                    handleOpenModal(uploadedFiles[thumbnailLimit]?.name)
                  }
                >
                  {/* <AddIcon fontSize="small" sx={{ mr: 0.5 }} /> */}+
                  {uploadedFiles.length - thumbnailLimit}
                </Avatar>
              </Tooltip>
            )}
            {!loading && (
              <Tooltip title="Upload">
                <label htmlFor="upload-image">
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 46,
                      height: 46,
                      bgcolor: "#1976d2",
                      color: "#fff",
                      cursor: "pointer",
                      transition: "0.2s",
                      "&:hover": {
                        bgcolor: "#1565c0",
                      },
                    }}
                    onClick={() => setDropzoneOpen(true)}
                    // disabled={uploading || uploadedFiles.length >= maxFilesAllowed}
                  >
                    <AddIcon />
                  </Avatar>
                </label>
              </Tooltip>
            )}
          </Box>
          {/* <Box sx={{ display: 'flex', gap: 1 }}>
           {images.map((img) => (
             <Avatar
               key={img.name}
               variant="rounded"
               src={getFullUrl(img.file_url)}
               sx={{
                 border: img.name === selectedImage?.name ? '2px solid #1976d2' : '1px solid #ccc',
                 width: 56,
                 height: 56,
                 cursor: 'pointer',
                 transition: '0.2s',
               }}
               onClick={() => handleThumbnailClick(img)}
             />
           ))}
         </Box> */}
        </Box>

        {/* Modal with Swiper + Arrows + Close Button */}
        <Modal open={open} onClose={handleClose}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "#fff",
              boxShadow: 24,
              p: 2,
              borderRadius: 2,
              width: "70%",
              maxHeight: "100%",
            }}
          >
            <Box display="flex" justifyContent="flex-end">
              <IconButton onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>

            <Swiper
              modules={[Navigation]}
              navigation
              initialSlide={startIndex}
              spaceBetween={10}
              slidesPerView={1}
            >
              {uploadedFiles.map((img) => (
                <SwiperSlide key={img.name}>
                  <Box
                    sx={{
                      height: "70vh",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      px: 2,
                    }}
                  >
                    {/* FilePreview supports image/video/pdf/doc */}
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: "100%",
                        height: "70vh", // fixed height for the wrapper
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        // borderRadius: 2,

                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <FilePreview file={img} />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "95%",
                        mt: 5,
                        mx: 5,
                      }}
                    >
                      {primaryImageId && (
                        <>
                          {img.file_url === primaryImageId ? (
                            <Badge color="success" badgeContent="Primary">
                              {/* You can optionally include a CheckCircleIcon here */}
                            </Badge>
                          ) : (
                            <Button
                              onClick={() => handleMakePrimary(img)}
                              size="small"
                            >
                              Mark as Primary
                            </Button>
                          )}
                        </>
                      )}

                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDelete(img)}
                          size="small"
                        >
                          <Delete fontSize="small" sx={{ color: "#000" }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </SwiperSlide>
              ))}
            </Swiper>
          </Box>
        </Modal>
      </Box>

      <Dialog
        open={dropzoneOpen}
        onClose={() => setDropzoneOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{btnHeading || "Add Attachment"}</DialogTitle>
        <DialogContent>
          <Box
            {...getRootProps()}
            sx={{
              border: "2px dashed #aaa",
              borderRadius: 2,
              padding: 4,
              textAlign: "center",
              cursor: "pointer",
              bgcolor: isDragActive ? "#f0f0f0" : "transparent",
            }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={20} color="inherit" />
                <Typography>Uploading...</Typography>
              </Box>
            ) : (
              <Typography>
                {isDragActive
                  ? "Drop files here..."
                  : "Drag & drop files here, or click to select and upload"}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDropzoneOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this file?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={async () => {
              if (fileToDelete?.name) {
                setConfirmOpen(false);
                await deleteFile(fileToDelete);
                setUploadedFiles((prev) =>
                  prev.filter((f) => f.name !== fileToDelete?.name)
                );
              }

              setFileToDelete(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImageGallery;
