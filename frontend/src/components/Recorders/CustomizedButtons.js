import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { purple } from '@mui/material/colors';

const ColorButton = styled(Button)(({ theme }) => ({
  color: theme.palette.getContrastText(purple[500]),
  backgroundColor: '#0c6980',
  fontSize: '20px',
  marginLeft: 'auto',
  marginRight: 'auto',
  marginTop: '20px',
  '&:hover': {
    backgroundColor: '#0c6980',
  },
}));

export default function CustomizedButtons({ text, onClick }) {
  return (
    <Stack spacing={2} direction='row'>
      <ColorButton variant='contained' onClick={onClick}>
        {' '}
        {text}
      </ColorButton>
    </Stack>
  );
}
