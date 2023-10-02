import React, { useRef, useState } from 'react';
import CustomizedButtons from './CustomizedButtons';

const AudioUploader = ({}) => {
  const BACKEND_URL = 'http://localhost:5000';
  const [audioFile, setAudioFile] = useState(null);
  const audioInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setAudioFile(file);
  };

  const handleUpload = () => {
    console.log('Handle upload is started');
    // If audioFile is null or empty, no file has been selected.
    if (!audioFile) {
      alert('Please select an audio file.');
      return;
    }

    // onClick(audioFile);

    // Now you can send the audioFile to the backend for further processing.
    // Example: Create a FormData object to send the file to the server.
    const formData = new FormData();
    formData.append('audio', audioFile);

    // You can now make a POST request to the backend with the formData.
    // Use the absolute backend URL to ensure it goes to the correct route.
    fetch(`${BACKEND_URL}/upload_audio`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Audio upload successful:', data);
      })
      .catch((error) => {
        console.error('Error uploading audio:', error);
      });
  };

  return (
    <div
      style={{
        background: '#66b2b2',
        padding: '10px',
        borderRadius: '5px',
      }}
    >
      {/* Use native file input */}
      <input
        type='file'
        accept='audio/*'
        ref={audioInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {/* Use the same CustomizedButtons component for both actions */}
      <CustomizedButtons
        text='Choose Audio'
        // Clicking the label will trigger the hidden file input
        onClick={() => audioInputRef.current.click()}
      />
      <CustomizedButtons text='Upload' onClick={handleUpload} />
      {/* Display the selected file name, if available */}
      {audioFile && <p>Selected file: {audioFile.name}</p>}
    </div>
  );
};

export default AudioUploader;
