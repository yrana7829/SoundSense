import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';
import AudioRecorder from './Recorders/AudioRecorder';
import audioBufferToWav from 'audiobuffer-to-wav';
import img from '../assets/bottom.png';
import CustomizedButtons from '../components/Recorders/CustomizedButtons';
import { CircularProgress, Typography } from '@mui/material';
import YouTube from 'react-youtube';
import io from 'socket.io-client';

const Home = () => {
  const BACKEND_URL = 'http://localhost:5000';
  const [audioFile, setAudioFile] = useState(null);
  const audioInputRef = useRef(null);
  const [transcription, setTranscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // Add a state variable for incremental transcription
  const [partialTranscription, setPartialTranscription] = useState(null);
  const [videoInput, setVideoInput] = useState('');
  const [videoId, setVideoId] = useState('');

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const sendChunkIntervalIdRef = useRef(null);

  let cancelTokenSource;

  // const startRecording = () => {
  //   console.log('audio recording started');
  //   navigator.mediaDevices
  //     .getUserMedia({ audio: true })
  //     .then((stream) => {
  //       console.log('getUserMedia succeeded.');
  //       mediaRecorderRef.current = new MediaRecorder(stream);
  //       mediaRecorderRef.current.ondataavailable = (event) => {
  //         if (event.data.size > 0) {
  //           console.log('Data available:', event.data.size); // Log data availability
  //           audioChunksRef.current.push(event.data);
  //         }
  //       };

  //       mediaRecorderRef.current.onstop = () => {
  //         const audioBlob = new Blob(audioChunksRef.current, {
  //           type: 'audio/wav',
  //         });
  //         const audioURL = URL.createObjectURL(audioBlob);

  //         // Set the audio source and controls for playback
  //         audioRef.current.src = audioURL;
  //         audioRef.current.controls = true;

  //         // Reset the recording state and audioChunksRef
  //         setRecording(false);
  //         audioChunksRef.current = [];

  //         // Clear the send chunk interval when recording stops
  //         clearInterval(sendChunkIntervalIdRef.current);
  //       };

  //       // Set recording state and start mediaRecorder
  //       setRecording(true);
  //       mediaRecorderRef.current.start();

  //       // Initialize a timer to send audio chunks every 5 seconds
  //       const sendChunkInterval = setInterval(() => {
  //         // Check if there are audio chunks to send
  //         if (audioChunksRef.current.length > 0) {
  //           const audioBlob = new Blob(audioChunksRef.current, {
  //             type: 'audio/wav',
  //           });

  //           // Create a FormData object and append the audio blob
  //           const formData = new FormData();
  //           formData.append('audio', audioBlob, 'audio.wav');

  //           // Send the audio data to the backend
  //           axios
  //             .post(`${BACKEND_URL}/upload_audio_chunk`, formData, {
  //               headers: {
  //                 'Content-Type': 'multipart/form-data',
  //               },
  //             })
  //             .then((response) => {
  //               console.log('Audio chunk sent to the backend.');
  //             })
  //             .catch((error) => {
  //               console.error('Error sending audio chunk:', error);
  //             });

  //           // Clear the audio chunks array
  //           audioChunksRef.current = [];
  //         }
  //       }, 5000); // Send chunks every 5 seconds

  //       // Save the interval ID for later cleanup
  //       sendChunkIntervalIdRef.current = sendChunkInterval;
  //     })
  //     .catch((error) => {
  //       console.error('Error accessing the microphone:', error);
  //     });
  // };

  const scriptNodeRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socket = io('http://127.0.0.1:5000'); // Connect to your Flask-SocketIO server

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('transcription', (response) => {
      console.log('Received transcription:', response);

      // Set the transcription in your state
      setTranscription(response.transcription);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  const startRecording = async () => {
    console.log('audio recording started');

    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('getUserMedia succeeded.');

      const sourceNode = audioContext.createMediaStreamSource(stream);
      const scriptNode = audioContext.createScriptProcessor(4096, 1, 1);

      sourceNode.connect(scriptNode);
      scriptNode.connect(audioContext.destination);

      scriptNode.onaudioprocess = (event) => {
        const audioBuffer = event.inputBuffer;
        const audioData = audioBuffer.getChannelData(0);

        console.log('Data available:', audioData.length);

        // Send audio data to the backend via WebSocket
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ audioData: Array.from(audioData) }));
        }
      };

      audioContext.resume();
      setRecording(true);
      scriptNodeRef.current = scriptNode;
    } catch (error) {
      console.error('Error accessing the microphone:', error);
    }
  };

  const stopRecording = () => {
    if (scriptNodeRef.current) {
      scriptNodeRef.current.disconnect();
      scriptNodeRef.current.onaudioprocess = null;
    }

    setRecording(false);
  };

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

          // Create a CancelToken source
          cancelTokenSource = axios.CancelToken.source();

          // Make a POST request to the 'whisper_transcribe' endpoint.
          axios
            .post(`${BACKEND_URL}/whisper_transcribe`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              cancelToken: cancelTokenSource.token,
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
              if (axios.isCancel(error)) {
                console.log('Transcription was canceled.');
              } else {
                console.error('Error:', error);
              }
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

          // Create a CancelToken source
          cancelTokenSource = axios.CancelToken.source();

          // Make a POST request to the 'whisper_transcribe' endpoint.
          axios
            .post(`${BACKEND_URL}/small_whisper_transcribe`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              cancelToken: cancelTokenSource.token,
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
              if (axios.isCancel(error)) {
                console.log('Transcription was canceled.');
              } else {
                console.error('Error:', error);
              }
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

          // Create a CancelToken source
          cancelTokenSource = axios.CancelToken.source();

          // Make a POST request to the 'whisper_transcribe' endpoint.
          axios
            .post(`${BACKEND_URL}/md_whisper_transcribe`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              cancelToken: cancelTokenSource.token,
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
              if (axios.isCancel(error)) {
                console.log('Transcription was canceled.');
              } else {
                console.error('Error:', error);
              }
              setIsLoading(false);
            });
        });
    } else {
      console.error('Uploaded audio data not found in local storage.');
    }
  };

  const LongwhisperHandler = () => {
    console.log('Whisper Long model is started');
    setIsLoading(true);
    setTranscription(false);
    setPartialTranscription('');

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

          // Create a CancelToken source
          cancelTokenSource = axios.CancelToken.source();

          // Make a POST request to the 'long_whisper_transcribe' endpoint.
          axios
            .post(`${BACKEND_URL}/long_whisper_transcribe`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              responseType: 'text', // Set the response type to text
              onDownloadProgress: (progressEvent) => {
                console.log('Progress Event:', progressEvent);
                console.log(
                  'event inside Progress Event:',
                  progressEvent.event
                );
                console.log(
                  'target inside Progress Event:',
                  progressEvent.event.currentTarget
                );
                console.log(
                  'data',
                  progressEvent.event.currentTarget.responseText
                );
                if (progressEvent.event && progressEvent.event.currentTarget) {
                  // Read the response as text
                  const responseText =
                    progressEvent.event.currentTarget.responseText;
                  console.log('Partial Transcription:', responseText);
                  setPartialTranscription(
                    (prevPartialTranscription) =>
                      prevPartialTranscription + responseText
                  );
                }
              },
              cancelToken: cancelTokenSource.token, // Set the CancelToken
            })
            .then(() => {
              // The transcription is complete
              setIsLoading(false);
            })
            .catch((error) => {
              if (axios.isCancel(error)) {
                console.log('Transcription was canceled.');
              } else {
                console.error('Error:', error);
              }
              setIsLoading(false);
            });
        });
    } else {
      console.error('Uploaded audio data not found in local storage.');
    }
  };

  const stopwhisperHandler = () => {
    if (cancelTokenSource) {
      // Cancel the transcription request
      cancelTokenSource.cancel('Transcription canceled by user.');
      setIsLoading(false);
    }
  };

  const clearTranscription = () => {
    setTranscription(false);
    setPartialTranscription(false);
  };

  // const [videoUrl, setVideoUrl] = useState('');

  // Modify the playVideo function to set the videoUrl state variable
  // const playVideo = () => {
  //   console.log('video to audio processing started');
  //   // Extract the video ID from the URL or use the entered ID
  //   let videoId = '';

  //   // Check if the input is a valid YouTube URL
  //   const urlRegex =
  //     /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]+)/;
  //   const match = videoInput.match(urlRegex);

  //   if (match) {
  //     videoId = match[5]; // Extract the video ID
  //   } else {
  //     // If the input is not a URL, treat it as a video ID
  //     videoId = videoInput;
  //   }

  //   if (!videoId) {
  //     console.error('Invalid YouTube URL or ID.');
  //     return;
  //   }

  //   // Set the video URL
  //   const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  //   console.log('video url is', videoUrl);

  //   // Call the function to extract audio
  //   // extractAudioFromYouTube(videoUrl);
  // };

  // // Add a new function to extract audio from YouTube and send it to the backend
  // const extractAudioFromYouTube = async (videoUrl) => {
  //   try {
  //     console.log('audio extraction started');
  //     const response = await axios.post(
  //       `${BACKEND_URL}/extract_audio`,
  //       { videoUrl: videoUrl }, // Send the videoUrl as data
  //       {
  //         headers: {
  //           'Content-Type': 'application/json', // Set the content type to JSON
  //         },
  //       }
  //     );

  //     console.log('response after extraction is', response);

  //     // Assuming the response contains the extracted audio
  //     const extractedAudioBlob = response.data.audioBlob;

  //     // Create a FormData object
  //     const formData = new FormData();

  //     // Append the extracted audio Blob to the FormData
  //     formData.append('audio', extractedAudioBlob, 'audio.wav');

  //     // Make a POST request to the transcription endpoint.
  //     axios
  //       .post(`${BACKEND_URL}/whisper_transcribe`, formData, {
  //         headers: {
  //           'Content-Type': 'multipart/form-data',
  //         },
  //       })
  //       .then((response) => {
  //         console.log('Transcription successful:', response.data.transcription);
  //         setTranscription(response.data.transcription);
  //       })
  //       .catch((error) => {
  //         console.error('Error:', error);
  //       });
  //   } catch (error) {
  //     console.error('Error extracting audio:', error);
  //   }
  // };

  // useEffect(() => {
  //   if (videoUrl) {
  //     extractAudioFromYouTube(videoUrl);
  //   }
  // }, [videoUrl]);

  // const playVideo = async () => {
  //   console.log('video to audio processing started');
  //   // Extract the video ID from the URL or use the entered ID
  //   let videoId = '';

  //   // Check if the input is a valid YouTube URL
  //   const urlRegex =
  //     /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]+)/;
  //   const match = videoInput.match(urlRegex);

  //   if (match) {
  //     videoId = match[5];
  //   } else {
  //     // If the input is not a URL, treat it as a video ID
  //     videoId = videoInput;
  //   }

  //   // Set the videoId to play the video
  //   setVideoId(videoId);

  //   // Extract audio from YouTube video using youtube-dl
  //   try {
  //     const response = await axios.get(
  //       `${BACKEND_URL}/extract_audio?videoId=${videoId}`
  //     );

  //     // Assuming the response contains the extracted audio
  //     const extractedAudioBlob = response.data.audioBlob;

  //     // Create a FormData object
  //     const formData = new FormData();

  //     // Append the extracted audio Blob to the FormData
  //     formData.append('audio', extractedAudioBlob, 'audio.wav');

  //     // Make a POST request to the transcription endpoint.
  //     axios
  //       .post(`${BACKEND_URL}/whisper_transcribe`, formData, {
  //         headers: {
  //           'Content-Type': 'multipart/form-data',
  //         },
  //       })
  //       .then((response) => {
  //         console.log('Transcription successful:', response.data.transcription);
  //         setTranscription(response.data.transcription);
  //       })
  //       .catch((error) => {
  //         console.error('Error:', error);
  //       });
  //   } catch (error) {
  //     console.error('Error extracting audio:', error);
  //   }
  // };

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
          height: '550px',
          border: '2px solid teal',
          display: 'grid', // Use CSS grid
          gridTemplateColumns: '3fr 1fr 3fr', // Two columns with equal width
          gridGap: '40px', // Gap between columns
          justifyContent: 'center', // Center horizontally
          alignItems: 'center', // Center vertically
          textAlign: 'center',
        }}
      >
        <div>
          <h5>Record Audio From Your Microphone</h5>
          {/* <AudioRecorder /> */}
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
        </div>
        <div>
          {/* <h5>Enter a YouTube Video URL or ID</h5>
          <div style={{ margin: '10px 0' }}>
            <input
              type='text'
              placeholder='Enter YouTube URL or ID'
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
            />
            <button onClick={playVideo}>Play Video</button>
          </div>
          <div
            style={{
              margin: '20px',
            }}
          >
            <YouTube
              videoId={videoId} // Use the videoId state variable
              opts={{
                width: '90%',
              }}
            />
          </div> */}
          <h4>OR</h4>
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
          margin: '2% 1%',
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
          onClick={() => LongwhisperHandler(audioFile)}
        >
          Long form Transcriptions (more than 30s)
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

      {partialTranscription && (
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
              Transcripted Long Audio
            </h3>
            <h6>
              <p>{partialTranscription}</p>
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
            margin: '0 10px',
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
        <button
          id='button2'
          style={{
            margin: '0 10px',
            padding: '10px',
            borderRadius: '10px',
            // background: '#66b2b2',
            background: '#801818',
            fontSize: 'large',
            color: 'white',
          }}
          onClick={() => clearTranscription()}
        >
          Clear The Transcription
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
