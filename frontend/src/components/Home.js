import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Home = () => {
  return (
    <>
      <Navbar />
      <div style={{ color: 'black', marginTop: '100px' }}>
        <div>Home page div-2</div>
      </div>
      <Footer />
    </>
  );
};

export default Home;
