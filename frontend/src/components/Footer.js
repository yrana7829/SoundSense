import React from 'react';
import { Col, Row } from 'react-bootstrap';
import './Footer.css';

const Footer = () => {
  return (
    <footer
      style={{
        width: '100%',
        background: '#FA6E42',
        position: 'absolute',
        bottom: '0px',
      }}
    >
      <Row className='mx-0 footer-maine-sec'>
        <Col sm={6} className='py-4 text-lg-right'>
          <div
            style={{
              fontFamily: 'Bahnschrift',
              fontStyle: 'normal',
              fontWeight: 300,
              fontSize: '18px',
              lineHeight: '38px',
              color: '#FFFFFF',
              marginLeft: '2.4rem',
            }}
          >
            © 2023 PG Dekho | All Rights Reserved | Design & Develop by
            BizzeOnline
          </div>
        </Col>
        <Col
          sm={6}
          className='py-4 d-flex justify-content-center justify-content-lg-end'
        >
          <div
            style={{
              fontFamily: 'Bahnschrift',
              fontStyle: 'normal',
              fontWeight: 300,
              fontSize: '18px',
              lineHeight: '38px',
              color: '#FFFFFF',
              textAlign: 'right',
              marginRight: '1rem',
            }}
          >
            <div className='text-center text-md-right'>
              <span className='d-inline-block mb-2 mb-sm-0'>
                Terms & Conditions
              </span>{' '}
              <span className='d-inline-block px-4'>Privacy Policy</span>
            </div>
          </div>
        </Col>
      </Row>
    </footer>
  );
};

export default Footer;
