import React, { useState, useRef } from 'react';
import CustomizedButtons from './CustomizedButtons';
import axios from 'axios';

const AudioRecorder = () => {
  const [recording, setRecording] = useState(false);
  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const sendChunkIntervalIdRef = useRef(null);

  const BACKEND_URL = 'http://localhost:5000'; // Update with your backend URL

  const startRecording = () => {
    console.log('audio recording started');
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: 'audio/wav',
          });
          const audioURL = URL.createObjectURL(audioBlob);

          // Set the audio source and controls for playback
          audioRef.current.src = audioURL;
          audioRef.current.controls = true;

          // Reset the recording state and audioChunksRef
          setRecording(false);
          audioChunksRef.current = [];

          // Clear the send chunk interval when recording stops
          clearInterval(sendChunkIntervalIdRef.current);
        };

        // Set recording state and start mediaRecorder
        setRecording(true);
        mediaRecorderRef.current.start();

        // Initialize a timer to send audio chunks every 5 seconds
        const sendChunkInterval = setInterval(() => {
          // Check if there are audio chunks to send
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, {
              type: 'audio/wav',
            });

            // Create a FormData object and append the audio blob
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.wav');

            // Send the audio data to the backend
            axios
              .post(`${BACKEND_URL}/upload_audio_chunk`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              })
              .then((response) => {
                console.log('Audio chunk sent to the backend.');
              })
              .catch((error) => {
                console.error('Error sending audio chunk:', error);
              });

            // Clear the audio chunks array
            audioChunksRef.current = [];
          }
        }, 5000); // Send chunks every 5 seconds

        // Save the interval ID for later cleanup
        sendChunkIntervalIdRef.current = sendChunkInterval;
      })
      .catch((error) => {
        console.error('Error accessing the microphone:', error);
      });
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div
      style={{ background: '#66b2b2', padding: '10px', borderRadius: '5px' }}
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
