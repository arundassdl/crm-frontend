import React, { useState } from 'react';
import Camera from 'react-html5-camera-photo';
import 'react-html5-camera-photo/build/css/index.css';

const TakePhoto = (props) => {

  const [uri, setUri] = useState(null)
  const handleTakePhoto = (dataUri) => {
    // Do stuff with the photo...
    console.log('takePhoto', dataUri);
    setUri(dataUri)
  };

  return (
    <div>
    {/* <Camera
      onTakePhoto={(dataUri) => handleTakePhoto(dataUri)}
      onCameraError={error => {
        onCameraError(error)
      }
    }

    /> */}
    {uri && (
        <img src={uri} />
    )}
    </div>
  );
}

export default TakePhoto;