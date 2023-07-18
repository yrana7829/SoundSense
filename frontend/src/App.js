import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';

function App() {
  return (
    <Router>
      <React.Fragment>
        <Routes>
          <Route path='/' element={<Home />} />
        </Routes>
      </React.Fragment>
    </Router>
  );
}

export default App;
