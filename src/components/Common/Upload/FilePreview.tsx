import { Box, Typography } from "@mui/material";
import { CONSTANTS } from "@/services/config/app-config";

const getFileType = (file: { type?: string; file_name?: string }): string => {
  const name = file.file_name?.toLowerCase() || "";
  const mime = file.type || "";

  if (mime.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)$/.test(name)) return "image";
  if (mime.startsWith("video/") || /\.(mp4|webm|ogg)$/.test(name)) return "video";
  if (mime === "application/pdf" || /\.pdf$/.test(name)) return "pdf";
  if (
    mime.includes("msword") ||
    mime.includes("officedocument") ||
    /\.(doc|docx)$/.test(name)
  ) return "doc";

  return "other";
};
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

const FilePreview = ({ file }) => {
  const fileType = getFileType(file);
  const fileUrl = file.file_url?.startsWith("http")
    ? file.file_url
    : `${CONSTANTS.API_BASE_URL}${file.file_url}`;

  switch (fileType) {
    case "image":
      return (     
  <Box
    component="img"
    src={fileUrl}
    alt={file.file_name}
    sx={{
      maxHeight: "100%",
      maxWidth: "100%",
      objectFit: "contain",
    }}
  />
      );
    case "video":
      return (
        <>
        {/* <Box height={100}>
        <VideoLibraryIcon/>
</Box> */}
        <video controls width="100%" style={{ maxHeight: 200 }}>
          <source src={fileUrl} type="video/mp4" />          
          Your browser does not support the video tag.
        </video>
        </>
      );
    case "pdf":
      return (
        <iframe
          src={fileUrl}
          title={file.file_name}
          style={{ width: "100%", height: "400px", border: "none" }}
        />
      );
    case "doc":
      return (
        <Box>
          <Typography variant="body2">
            📄 <a href={fileUrl} target="_blank" rel="noopener noreferrer">{file.file_name}</a>
          </Typography>
        </Box>
      );
    default:
      return (
        <Box>
          <Typography variant="body2">
            📎 <a href={fileUrl} target="_blank" rel="noopener noreferrer">{file.file_name}</a>
          </Typography>
        </Box>
      );
  }
};

export default FilePreview;