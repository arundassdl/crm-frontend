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
import { styled } from "@mui/material/styles";
import { showToast } from "@/components/ToastNotificationNew";
import imageCompression from "browser-image-compression";
import CustomAvatar from "@/@core/components/mui/Avatar";
import { useClickContext } from "@/app/GlobalProvider";

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
  title:string;
  imageArry: {
    name: string;
    file_url: string;
    file_name: string;
  }[];
};

type ChildProps = BasicProps | AdvancedProps;

const ProfileImageUpload: React.FC<ChildProps> = (props) => {
  const theme = useTheme();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Explicitly typing as File[]
  // const [images, setImages] = useState<Image[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Checks if the screen size is small or below
  const [images, setImages] = useState<Image[]>([]);
 const { profileImage, setProfileImage } = useClickContext();

 const [uploadImage, setUploadImage] = useState<any>("");
 const [btnTitle, setBtnTitle] = useState<string>(("title" in props)?props?.title:"Upload New Photo");

  useEffect(() => {
    // Type guard to check if props is of type AdvancedProps
    if ('imageArry' in props && Array.isArray(props.imageArry)) {
      const formattedImages = props.imageArry.map((item, index) => ({
        id: index + 1, // Unique identifier
        name: item.name,
        src: item.file_url,
        alt: item.file_name,
      }));
      setImages(formattedImages);
      if(formattedImages.length >0){
        setUploadImage(formattedImages[0].src);
      }
      console.log("formattedImages",formattedImages);
      
    }
  }, [props]);
// Empty dependency array ensures this runs only once

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files?.length ? Array.from(e.target.files) : [];

    if (files.length > 1) {
      showToast("Upload only single image", "error");
    } else {
      let validimage = true;

      if (files.length > 0) {
        const options = {
          maxSizeMB: 5, // Maximum size in MB
          maxWidthOrHeight: 400, // Maximum width or height in pixels (adjust as needed)
          initialQuality: 0.9, // Maintain higher quality during compression
          useWebWorker: true, // Use web worker for compression
        };

        // Compress all files
        const compressedImages = await Promise.all(
          files.map(async (file, index) => {
            try {
              // Compress the image
              const compressedFile = await imageCompression(file, options);
              setUploadImage(URL.createObjectURL(compressedFile))
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
        const validCompressedImages = compressedImages.filter(
          (image): image is Image => image !== null
        );
        // setTimeout(() => {
          setImages(validCompressedImages);
          console.log("Compressed images:", validCompressedImages);  
        // }, 500);
        // Append the new images to the existing ones
        
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

    if (
      "onDeleteImages" in props &&
      typeof props.onDeleteImages === "function"
    ) {
      props.onDeleteImages(enq);
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
    if (updatedImages) {
      setImages(updatedImages);
      if (index === currentIndex && updatedImages.length > 0) {
        setCurrentIndex((prev) => (prev === 0 ? 0 : prev - 1));
      } else if (updatedImages.length === 0) {
        setCurrentIndex(0);
      }
      const newArray = [
        ...selectedFiles.slice(0, index),
        ...selectedFiles.slice(index + 1),
      ];
      setSelectedFiles(newArray);
      props.onSendData(newArray);
    }
  };
  console.warn(" test images img_Arry ",images);

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
        textAlign: "left",
        height: "auto",
      }}
    >
      <div className="flex flex-col justify-self-start  gap-6">
        <div className="flex  gap-4 flex-wrap is-full">
          <div className="flex items-start gap-4">
          {images.length > 0 ? (
            <Box>
              <img
                src={uploadImage}
                alt={`Uploaded Image ${currentIndex + 1}`}
                style={{
                  width: "100%",
                  height: "100px", // Fills the height of the parent Box
                  objectFit: "contain",
                  borderRadius: "10px",
                }}
              />
            </Box>
            ) : ("")}
            <div className="flex flex-col justify-self-start items-start">
              <Button
                size="small"
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
              >
                {btnTitle}
                <VisuallyHiddenInput
                  type="file"
                  id="input-file"
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                />
              </Button>

              <>
                {isMobile ? (
                  <>
                    <Typography className="gap-3" sx={{ pt: 2 }}>
                      {" "}
                      Photos in JPG or PNG format with a maximum file size of 5
                      MB are allowed.
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography className="gap-3" sx={{ pt: 2 }}>
                      {" "}
                      Photos in JPG or PNG format,{" "}
                    </Typography>
                    <Typography>
                      {" "}
                      with a maximum file size of 5 MB are allowed.
                    </Typography>
                  </>
                )}
              </>
            </div>
          </div>
        </div>
      </div>     
    </Box>
  );
};

export default ProfileImageUpload;
