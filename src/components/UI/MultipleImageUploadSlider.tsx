
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from '@mui/material/styles';
import { showToast } from "@/components/ToastNotificationNew";
import imageCompression from 'browser-image-compression';


const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface Image {
  id: number;
  name: string;
  src: string;
  alt: string;
}
type BasicProps = {
  onSendData: (data: File[]) => void; // Required
};

type AdvancedProps = BasicProps & {
  onDeleteImages?: (data: Image) => Promise<string>; 
  imageArry: {
    name: string;
    file_url: string;
    file_name: string;
  }[];
};
 
type ChildProps = BasicProps | AdvancedProps;



const MultipleImageUploadSlider: React.FC<ChildProps> = (props) => {
  const theme = useTheme();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Explicitly typing as File[]
  // const [images, setImages] = useState<Image[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Checks if the screen size is small or below
  const [images, setImages] = useState<Image[]>([]);

  useEffect(() => {
    if ("imageArry" in props && props.imageArry) {
    const formattedImages = props.imageArry.map((item, index) => ({
      id: index + 1, // Unique identifier
      name: item.name,
      src: item.file_url, // Image URL
      alt: item.file_name, // Alt text
    }));
    setImages(formattedImages); // Initialize state with transformed images
  }
  }, []); // Empty dependency array ensures this runs only once

  
  console.log("images========>123",images);
  
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files?.length ? Array.from(e.target.files) : [];

  if (files.length > 3) {
    showToast("Upload only 3 images", "error");
  } else {
    let validimage = true;

    if (files.length > 0) {
      const options = {
        maxSizeMB: 5, // Maximum size in MB
        maxWidthOrHeight: 1100, // Maximum width or height in pixels (adjust as needed)
        initialQuality: 0.9, // Maintain higher quality during compression
        useWebWorker: true, // Use web worker for compression
      };

      // Compress all files
      const compressedImages = await Promise.all(
        files.map(async (file, index) => {
          try {
            // Compress the image
            const compressedFile = await imageCompression(file, options);
            return {
              id: Date.now() + index, // Unique ID for each image
              name: "",
              src: URL.createObjectURL(compressedFile), // URL for preview
              alt: file.name,
            };
          } catch (error) {
            console.error("Error compressing file:", file.name, error);
            return null;
          }
        })
      );

      // Filter out any null (failed compressions)
      const validCompressedImages = compressedImages.filter((image) => image !== null);

      // Append the new images to the existing ones
      setImages((prevImages) => [...prevImages, ...(validCompressedImages as Image[])]);

      console.log("Compressed images:", validCompressedImages);

      // Update selected files and send data
      setSelectedFiles(files);
      props.onSendData(files);
      console.log("selectedFiles11 here", selectedFiles);
    }
  }
};


  // Handle next and previous navigation
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };


  // Handle delete image
  const handleDeleteImage = async (enq: Image) => {
    console.log("Deleting image:", enq);
  
    if ("onDeleteImages" in props && typeof props.onDeleteImages === "function") {
      props.onDeleteImages(enq)
      // console.log("deltesucc",deltesucc);
      const updatedImages = images.filter((image) => image.id !== enq.id);
      console.log("updatedImages:", updatedImages);
      setImages(updatedImages);

    } else {
      console.warn("onDeleteImages is not available in props"); 
    }
  };
  

  const handleDelete = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    if(updatedImages){
      setImages(updatedImages);
      if (index === currentIndex && updatedImages.length > 0) {
        setCurrentIndex((prev) => (prev === 0 ? 0 : prev - 1));
      } else if (updatedImages.length === 0) {
      setCurrentIndex(0);
    }
    const newArray = [...selectedFiles.slice(0, index), ...selectedFiles.slice(index + 1)];
    setSelectedFiles((newArray))
    props.onSendData(newArray);
  }
  };
  console.log("images========>22222",images);
  return (
    <Box
      sx={{
        width: "100%",
        margin: "auto",
        position: "relative",
        overflow: "hidden",
        // borderRadius: "10px",
        // boxShadow: 3,
        padding: "16px",
        textAlign: "center",
        height: "420px",
      }}
    >
    

      {/* Slider */}
      {images.length > 0 ? (
        <Box>
          <Box
            sx={{
              position: "relative",
              textAlign: "center",
              borderRadius: "10px",
              overflow: "hidden",
              paddingTop: 5,
            }}
          >
            
            <img
              src={images[currentIndex].src}
              alt={`Uploaded Image ${currentIndex + 1}`}
              style={{
                width: "100%",
                height: "320px", // Fills the height of the parent Box
                objectFit: "contain",
                borderRadius: "10px",
              }}
            />
            <IconButton
              sx={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "rgba(255, 0, 0, 0.8)",
                "&:hover": { backgroundColor: "rgba(255, 0, 0, 1)" },
              }}
              onClick={() => {(images[currentIndex].name!="")?handleDeleteImage(images[currentIndex]):handleDelete(currentIndex)} }
            >
              <DeleteIcon sx={{ color: "white" }} />
            </IconButton>
          </Box>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <IconButton
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "10px",
                  transform: "translateY(-50%)",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.8)" },
                }}
                onClick={handlePrev}
              >
                <ArrowBackIosNewIcon sx={{ color: "white" }} />
              </IconButton>
              <IconButton
                sx={{
                  position: "absolute",
                  top: "50%",
                  right: "10px",
                  transform: "translateY(-50%)",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.8)" },
                }}
                onClick={handleNext}
              >
                <ArrowForwardIosIcon sx={{ color: "white" }} />
              </IconButton>
            </>
          )}
        </Box>
      ) : (
        <>
          <div className="col-md-12">            
            <img
              src="/assets/images/no_image.png"
              style={{ height: "100px" }}
            />
            <Typography variant="h6" sx={{ padding: "16px" }}>
              No images uploaded yet.
            </Typography>
          </div>
        </>
      )}
        {/* Upload button */}
        <Button
        component="label"
        role={undefined}
        variant="contained"
        tabIndex={-1}
        startIcon={<CloudUploadIcon />}
      >
        Upload
        <VisuallyHiddenInput
          type="file"
          id="input-file"
          multiple
          onChange={handleFileChange}
        />
      </Button>
      {images.length == 0 ? (
        <>
          {isMobile ? (
            <>
              <Typography className="gap-3" sx={{ pt: 2 }}>
                {" "}
                A maximum of three photos in JPG or PNG format, with a file size
                of up to 5 MB, are allowed.
              </Typography>
            </>
          ) : (
            <>
              <Typography className="gap-3" sx={{ pt: 2 }}>
                {" "}
                A maximum of three photos in JPG or PNG format,{" "}
              </Typography>
              <Typography>
                {" "}
                with a file size of up to 5 MB, are allowed.
              </Typography>
            </>
          )}
        </>
      ) : null}
    </Box>
  );
};

export default MultipleImageUploadSlider;