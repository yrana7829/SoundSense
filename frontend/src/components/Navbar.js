import React from 'react';
import { Container, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Navbar.css';

const NavBar = () => {
  return (
    <Navbar expand='md' className='navbar'>
      <Container fluid>
        <img src={logo} alt='Logo' className='logo-img' />
      </Container>
    </Navbar>
  );
};

export default NavBar;
