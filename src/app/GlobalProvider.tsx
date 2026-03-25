'use client'
import { Box, Card } from '@mui/material';
import { createContext, useContext, useState } from 'react';

const ClickContext = createContext<any>(false);

export const useClickContext = () => useContext(ClickContext);

export const ClickProvider = ({ children }) => {
  const [isClicked, setIsClicked] = useState(true);
  const [profileImage, setProfileImage] = useState('/images/avatars/5.png');

 

  return (
    <ClickContext.Provider value={{ isClicked, setIsClicked,profileImage,setProfileImage }}>
     {/* <Box
                sx={{
                  
          height: 830,
                  bgcolor: "background.paper",
                  maxInlineSize: '100%',
                  borderRadius: 1,
                  marginTop:6
                }}
              > */}
               
      {children}
      
      {/* </Box> */}
    </ClickContext.Provider>
  );
};
