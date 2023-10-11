import React, { useRef, useEffect } from 'react';

const VideoPlayer = () => {
  const videoRef = useRef(null);
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  useEffect(() => {
    const videoElement = videoRef.current;
    const source = audioContext.createMediaElementSource(videoElement);
    const destination = audioContext.destination;

    // Connect the video's audio to the audio context's destination
    source.connect(destination);

    // Play the video
    videoElement.play();

    return () => {
      // Disconnect and close the audio context when the component unmounts
      source.disconnect();
      audioContext.close();
    };
  }, []);

  return (
    <div>
      <video ref={videoRef} controls>
        <source src='path-to-your-video.mp4' type='video/mp4' />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
