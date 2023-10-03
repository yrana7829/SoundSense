import React, { useRef, useState } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';
import AudioRecorder from './Recorders/AudioRecorder';
import audioBufferToWav from 'audiobuffer-to-wav';
import img from '../assets/bottom.png';
import CustomizedButtons from '../components/Recorders/CustomizedButtons';
import { CircularProgress, Typography } from '@mui/material';

const Home = () => {
  const BACKEND_URL = 'http://localhost:5000';
  const [audioFile, setAudioFile] = useState(null);
  const audioInputRef = useRef(null);
  const [transcription, setTranscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setAudioFile(file);
  };

  // const loadModelHandler = async () => {
  //   try {
  //     // Make a GET request to load the model
  //     const response = await axios.get(`${BACKEND_URL}/load_model`);

  //     // Handle the response as needed
  //     console.log(response.data.message);
  //   } catch (error) {
  //     console.error('Error loading the model:', error);
  //   }
  // }

  const handleUpload = () => {
    console.log('Handle upload is started');
    // If audioFile is null or empty, no file has been selected.
    if (!audioFile) {
      alert('Please select an audio file.');
      return;
    }

    // Read the file contents using FileReader
    const reader = new FileReader();
    reader.onload = (event) => {
      // event.target.result contains the file contents as a ArrayBuffer
      const fileContentArrayBuffer = event.target.result;

      // Convert the ArrayBuffer to a Blob with .wav format
      const audioBlob = new Blob([fileContentArrayBuffer], {
        type: 'audio/wav', // Set the appropriate MIME type for .wav
      });

      // Log the audioBlob to verify its contents
      console.log('audioBlob:', audioBlob);

      const audioBlobURL = URL.createObjectURL(audioBlob); // Create a URL for the Blob
      localStorage.setItem(
        'uploadedAudio',
        JSON.stringify({ audio: audioBlobURL }) // Store the URL in local storage
      );

      setAudioFile(audioBlob);
    };

    // Start reading the file as an ArrayBuffer
    reader.readAsArrayBuffer(audioFile);
  };

  const whisperHandler = () => {
    console.log('Whisper model is started');
    setIsLoading(true);
    setTranscription(false);

    // Retrieve the uploaded audio data from local storage
    const uploadedAudioData = JSON.parse(localStorage.getItem('uploadedAudio'));

    if (uploadedAudioData) {
      // Retrieve the audio data URL and convert it back to a Blob
      const audioDataURL = uploadedAudioData.audio;
      fetch(audioDataURL)
        .then((response) => response.blob())
        .then((audioBlob) => {
          // Create a new FormData object
          const formData = new FormData();

          // Create a new Blob with the .wav format and name it 'audio.wav'
          const audioWavBlob = new Blob([audioBlob], { type: 'audio/wav' });

          // Append the 'audio.wav' Blob to the FormData
          formData.append('audio', audioWavBlob, 'audio.wav');

          // Make a POST request to the 'whisper_transcribe' endpoint.
          axios
            .post(`${BACKEND_URL}/whisper_transcribe`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            })
            .then((response) => {
              console.log(
                'Whisper transcription successful:',
                response.data.transcription
              );
              setTranscription(response.data.transcription);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error('Error during Whisper transcription:', error);
              setIsLoading(false);
            });
        });
    } else {
      console.error('Uploaded audio data not found in local storage.');
    }
  };

  const smallwhisperHandler = () => {
    console.log('Whisper model is started');
    setIsLoading(true);
    setTranscription(false);

    // Retrieve the uploaded audio data from local storage
    const uploadedAudioData = JSON.parse(localStorage.getItem('uploadedAudio'));

    if (uploadedAudioData) {
      // Retrieve the audio data URL and convert it back to a Blob
      const audioDataURL = uploadedAudioData.audio;
      fetch(audioDataURL)
        .then((response) => response.blob())
        .then((audioBlob) => {
          // Create a new FormData object
          const formData = new FormData();

          // Create a new Blob with the .wav format and name it 'audio.wav'
          const audioWavBlob = new Blob([audioBlob], { type: 'audio/wav' });

          // Append the 'audio.wav' Blob to the FormData
          formData.append('audio', audioWavBlob, 'audio.wav');

          // Make a POST request to the 'whisper_transcribe' endpoint.
          axios
            .post(`${BACKEND_URL}/small_whisper_transcribe`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            })
            .then((response) => {
              console.log(
                'Whisper transcription successful:',
                response.data.transcription
              );
              setTranscription(response.data.transcription);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error('Error during Whisper transcription:', error);
              setIsLoading(false);
            });
        });
    } else {
      console.error('Uploaded audio data not found in local storage.');
    }
  };

  const mdwhisperHandler = () => {
    console.log('Whisper model is started');
    setIsLoading(true);
    setTranscription(false);

    // Retrieve the uploaded audio data from local storage
    const uploadedAudioData = JSON.parse(localStorage.getItem('uploadedAudio'));

    if (uploadedAudioData) {
      // Retrieve the audio data URL and convert it back to a Blob
      const audioDataURL = uploadedAudioData.audio;
      fetch(audioDataURL)
        .then((response) => response.blob())
        .then((audioBlob) => {
          // Create a new FormData object
          const formData = new FormData();

          // Create a new Blob with the .wav format and name it 'audio.wav'
          const audioWavBlob = new Blob([audioBlob], { type: 'audio/wav' });

          // Append the 'audio.wav' Blob to the FormData
          formData.append('audio', audioWavBlob, 'audio.wav');

          // Make a POST request to the 'whisper_transcribe' endpoint.
          axios
            .post(`${BACKEND_URL}/md_whisper_transcribe`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            })
            .then((response) => {
              console.log(
                'Whisper transcription successful:',
                response.data.transcription
              );
              setTranscription(response.data.transcription);
              setIsLoading(false);
            })
            .catch((error) => {
              console.error('Error during Whisper transcription:', error);
              setIsLoading(false);
            });
        });
    } else {
      console.error('Uploaded audio data not found in local storage.');
    }
  };

  const stopwhisperHandler = () => {
    setIsLoading(false);
    setTranscription(false);
  };

  return (
    <>
      <Navbar />
      <div
        style={{
          color: 'black',
          marginTop: '105px',
          padding: '20px',
          justifyContent: 'center', // Center horizontally
          alignItems: 'center', // Center vertically
          textAlign: 'center',
          background: '#66b2b2',
        }}
      >
        <p>
          <h2>SoundSense</h2>
        </p>
        <p>
          <h4>Transforming speech into text, effortlessly and accurately</h4>
        </p>
      </div>

      <div
        style={{
          color: 'black',
          padding: '10px 50px',
          height: '300px',
          border: '2px solid teal',
          display: 'grid', // Use CSS grid
          gridTemplateColumns: '1fr 1fr 1fr', // Two columns with equal width
          gridGap: '20px', // Gap between columns
          justifyContent: 'center', // Center horizontally
          alignItems: 'center', // Center vertically
          textAlign: 'center',
        }}
      >
        <div>
          <h5>Record Audio From Your Microphone</h5>
          <AudioRecorder />
        </div>
        <div>
          <h2> OR</h2>
        </div>
        <div>
          <h5>Upload An Audio File</h5>
          {/* <AudioUploader onClick={wav2vec2Handler} /> */}
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
        </div>
      </div>

      <div
        style={{
          height: '50px',
          justifyContent: 'center', // Center horizontally
          alignItems: 'center', // Center vertically
          textAlign: 'center',
          margin: '2% 10%',
        }}
      >
        <button
          id='button2'
          style={{
            padding: '10px',
            margin: '0 20px',
            borderRadius: '10px',
            background: '#0c6980',
            fontSize: 'large',
            color: 'white',
          }}
          onClick={() => whisperHandler(audioFile)}
        >
          Transcribe with Whisper-Base
        </button>

        <button
          id='button2'
          style={{
            padding: '10px',
            margin: '0 20px',
            borderRadius: '10px',
            background: '#0c6980',
            fontSize: 'large',
            color: 'white',
          }}
          onClick={() => smallwhisperHandler(audioFile)}
        >
          Transcribe with Whisper-Small
        </button>

        <button
          id='button2'
          style={{
            padding: '10px',
            margin: '0 20px',
            borderRadius: '10px',
            background: '#0c6980',
            fontSize: 'large',
            color: 'white',
          }}
          onClick={() => mdwhisperHandler(audioFile)}
        >
          Transcribe with Whisper-Medium
        </button>
      </div>
      {isLoading ? (
        <div
          className='loader'
          style={{
            margin: '10px 40px',
            height: 'auto',
            border: '1px solid gray',
            padding: '20px',
            borderRadius: '10px',
            justifyContent: 'center',
          }}
        >
          <Typography align='center'>
            <CircularProgress size={24} sx={{ color: '#0c6980' }} />
          </Typography>
          Loading The Transcripted Audio......
        </div>
      ) : (
        <></>
      )}
      {transcription && (
        <div
          style={{
            margin: '10px 40px',
            height: 'auto',
            border: '1px solid gray',
            padding: '20px',
            borderRadius: '10px',
          }}
        >
          <p>
            <h3
              style={{
                justifyContent: 'center', // Center horizontally
                alignItems: 'center', // Center vertically
                textAlign: 'center',
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '2px solid gray',
              }}
            >
              Transcripted Audio
            </h3>
            <h6>
              <p>{transcription}</p>
            </h6>
          </p>
        </div>
      )}

      <div
        style={{
          height: '50px',
          justifyContent: 'center', // Center horizontally
          alignItems: 'center', // Center vertically
          textAlign: 'center',
          margin: '2% 30%',
        }}
      >
        <button
          id='button2'
          style={{
            padding: '10px',
            borderRadius: '10px',
            // background: '#66b2b2',
            background: '#801818',
            fontSize: 'large',
            color: 'white',
          }}
          onClick={() => stopwhisperHandler()}
        >
          Stop The Transcription
        </button>
      </div>

      <div
        style={{
          marginTop: '20px',
          height: '200px',
          justifyContent: 'center', // Center horizontally
          alignItems: 'center', // Center vertically
          textAlign: 'center',
        }}
      >
        <img src={img} alt='Logo' style={{ width: '320px', height: '180px' }} />
      </div>

      <Footer />
    </>
  );
};

export default Home;
