import React, { useState, useRef } from 'react';
import CustomizedButtons from './CustomizedButtons';

const AudioRecorder = () => {
  const [recording, setRecording] = useState(false);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = () => {
    console.log('the start button is pressed');
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        console.log('get user media function is running');
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorderRef.current.onstop = () => {
          console.log('Recording stopped');
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/wav',
          });
          const audioURL = URL.createObjectURL(audioBlob);

          // Set the audio source and controls for playback
          audioRef.current.src = audioURL;
          audioRef.current.controls = true;

          // Now you can send the audioURL to the backend for further processing or save it as a WAV file.
          console.log('Audio URL:', audioURL);

          // Reset the recording state and audioChunksRef
          setRecording(false);
          audioChunksRef.current = [];
        };

        // Set recording state and start mediaRecorder
        setRecording(true);
        mediaRecorderRef.current.start();
      })
      .catch((error) => {
        console.error('Error accessing the microphone:', error);
      });
  };

  const stopRecording = () => {
    console.log('the stop button is pressed');
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div
      style={{
        background: '#66b2b2',
        padding: '10px',
        borderRadius: '5px',
      }}
    >
      <audio ref={audioRef} controls style={{ marginTop: '20px' }} />
      {recording ? (
        <CustomizedButtons text='Stop' onClick={stopRecording} />
      ) : (
        <CustomizedButtons text='Start' onClick={startRecording} />
      )}
    </div>
  );
};

export default AudioRecorder;
