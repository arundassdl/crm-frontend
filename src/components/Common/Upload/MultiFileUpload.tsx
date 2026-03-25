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
  Typography,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import Image from "next/image";
import { CONSTANTS } from "@/services/config/app-config";
import ConfirmDialog from "@/components/UI/ConfirmDialog";
import { AttachmentCard } from "./AttachmentCard";
import { Accept, useDropzone } from "react-dropzone";
import { showToast } from "@/components/ToastNotificationNew";
import ReactImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";
import ImageGallery from "./ImageGallery";
import AttachmentContainer from "./AttachmentContainer";

const frappeBaseUrl = CONSTANTS.API_BASE_URL || "";

interface UploadedFile {
  name: string;
  file_url: string;
  file_name: string;
  file_size: number;
}

interface MultiFileUploadProps {
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
}

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
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
  const maxFilesAllowed = maxFiles ?? 10;
  const [dropzoneOpen, setDropzoneOpen] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const handleDrop = async (acceptedFiles: File[]) => {
    const totalFiles = uploadedFiles.length + acceptedFiles.length;
    if (totalFiles > maxFilesAllowed) {
      alert(`You can upload up to ${maxFilesAllowed} files only.`);
      return;
    }

    setUploading(true);

    const uploaded: UploadedFile[] = [];
    setUploading(true);
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

      try {
        const res = await fetch("/api/multifile-upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `${userToken?.access_token}`,
          },
        });

        const result = await res.json();
        console.log("result here =>", result);
        if (result?.message?.file_url) {
          uploaded.push({
            name: result.message.name,
            file_url: result.message.file_url,
            file_name: result.message.file_name,
            file_size: result.message.file_size,
          });
        }
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }
    setUploading(true);
    const finalFiles = [...uploadedFiles, ...uploaded];
    setUploadedFiles(finalFiles);
    onUploadComplete?.(finalFiles);
    setUploading(false);
    setDropzoneOpen(false); // Close after upload
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
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // event.target.value = "";
    const files = event.target.files;
    console.log("files=>", files);
    if (uploading) return;

    // console.log("files=>",files);
    // return

    if (!files) return;
    const newFiles = Array.from(files);

    const totalFiles = uploadedFiles.length + newFiles.length;

    //Block if total exceeds max limit
    if (totalFiles > maxFilesAllowed) {
      alert(`You can upload up to ${maxFilesAllowed} files only.`);
      return;
    }

    const uploaded: UploadedFile[] = [];
    setUploading(true);

    for (const file of Array.from(files)) {
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
      try {
        const res = await fetch("/api/multifile-upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `${userToken?.access_token}`,
          },
        });

        const result = await res.json();
        console.log("result here =>", result);

        if (result?.message?.file_url) {
          uploaded.push({
            name: result.message.name,
            file_url: result.message.file_url,
            file_name: result.message.file_name,
            file_size: file.size,
          });
        }
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }

    setUploading(false);
    const finalFiles = [...uploadedFiles, ...uploaded];
    setUploadedFiles(finalFiles);
    onUploadComplete?.(finalFiles);
  };
  const handleView = (file: any) => {
    window.open(getFullUrl(file.file_url), "_blank");
  };

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);

    onUploadComplete?.(newFiles);

    // deleteFile(file.file_url)
    //   .then(() => {
    //     setUploadedFiles((prev) => prev.filter((f) => f.file_url !== file.file_url))
    //   })
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
      setLoading(false);
      setUploadedFiles(files);
    });
  }, [attachedToDoctype]);

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
  console.log("uploadeedfiles",uploadedFiles);
  

  return (
    <> 
   
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

      <div>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={2}
        >
          {/* Left Side: Heading */}
          <Typography variant="h6">{heading || "Attachments"}</Typography>

          {/* Right Side: Upload Button */}
          <Box display="flex" alignItems="center" gap={2}>
            {uploadedFiles.length >= maxFilesAllowed && (
              <Typography color="error" variant="body2">
                A maximum of {maxFilesAllowed} files is allowed.
              </Typography>
            )}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setDropzoneOpen(true)}
              disabled={uploading || uploadedFiles.length >= maxFilesAllowed}
            >
              {uploading ? "Uploading..." : btnHeading || "Attach File"}
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {/* {loading && <CircularProgress />} */}
          <AttachmentContainer
                uploadedFiles={uploadedFiles}
                loading={loading}
                handleView={handleView}
                handleDelete={handleDelete}
                deletingFile={deletingFile}
              />          
        </Grid>
      </div>
    </>
  );
};

export default MultiFileUpload;
