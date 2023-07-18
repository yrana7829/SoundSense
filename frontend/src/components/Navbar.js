import React from 'react';
import { Container, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.jpg';
import './Navbar.css';

const NavBar = () => {
  return (
    <Navbar expand='md' className='navbar'>
      <Container>
        <Navbar.Brand as={Link} to='/' className='logo px-0'>
          <img src={logo} alt='Logo' className='logo-img' />
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
};

export default NavBar;
