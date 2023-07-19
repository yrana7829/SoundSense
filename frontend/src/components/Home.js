import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import AudioRecorder from './Recorders/AudioRecorder';
import AudioUploader from './Recorders/AudioUploader';
import img from '../assets/bottom.png';

const Home = () => {
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
          <AudioUploader />
        </div>
      </div>

      <div
        style={{
          height: '250px',
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
