"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import DeleteIcon from "@mui/icons-material/Delete";
import Image from "next/image";
import { CONSTANTS } from "@/services/config/app-config";
import ConfirmDialog from "@/components/UI/ConfirmDialog";

const frappeBaseUrl = CONSTANTS.API_BASE_URL || "";

interface UploadedFile {
  name: string;
  file_url: string;
  file_name: string;
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
}

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  attachedToDoctype,
  attachedToName,
  attachedToField='image',
  folder = "Home",
  onUploadComplete,
  allowedTypes = ["image/*", "application/pdf"],
  multiple = true,
  initialFiles = [],
  maxFiles
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

        if (result?.message?.file_url) {
          
          uploaded.push({
            name: result.message.name,
            file_url: result.message.file_url,
            file_name: result.message.file_name,
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
    window.open(file.file_url, "_blank");
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
  }, []);

  const deleteFile = async (file: any) => {
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
      return data;
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <>
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

      <Box>
        <input
          accept={allowedTypes.join(",")}
          multiple={multiple}
          type="file"
          hidden
          id={`upload-input-${attachedToName}`}
          onChange={handleFileChange}
        />
        <label htmlFor={`upload-input-${attachedToName}`}>
          <Button
            variant="contained"
            component="span"
            startIcon={<UploadIcon />}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Files"}
          </Button>
        </label>

        {uploading && <CircularProgress size={24} sx={{ ml: 2, mt: 1 }} />}
      </Box>
      <Box
        mt={2}
        display="flex"
        flexWrap="wrap"
        gap={2}
        alignItems="flex-start"
      >
        {loading && <CircularProgress size={24} sx={{ ml: 2, mt: 1 }} />}
        {uploadedFiles
          .filter((f) => f.file_url.match(/\.(jpeg|jpg|png|gif|webp)$/))
          .map((file, name) => (
            <Box
              key={name}
              sx={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                border: "1px solid #ccc",
                borderRadius: 2,
                overflow: "hidden",
                width: 200,
              }}
            >
              {/* Delete Icon */}
              <IconButton
                size="small"
                onClick={() => {
                  setFileToDelete(file);
                  setConfirmOpen(true);
                }}
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  backgroundColor: "rgba(255,255,255,0.8)",
                  zIndex: 1,
                  "&:hover": {
                    backgroundColor: "rgba(255,0,0,0.1)",
                  },
                }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>

              {/* Image */}
              <Image
                src={getFullUrl(file.file_url)}
                alt={file.file_name}
                width={200}
                height={200}
                style={{ objectFit: "contain", borderRadius: 8 }}
              />

              {/* Optional: File name below image */}
              <Box px={1} py={0.5} textAlign="center">
                <Typography variant="caption" noWrap sx={{ maxWidth: "100%" }}>
                  <Chip
                    key={name}
                    label={file.file_name}
                    variant="outlined"
                    sx={{ maxWidth: 200 }}
                  />
                </Typography>
              </Box>
            </Box>
          ))}
      </Box>
    </>
  );
};

export default MultiFileUpload;
