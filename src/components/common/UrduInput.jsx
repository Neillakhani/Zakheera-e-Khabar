import React, { useState } from 'react';
import { TextField, Box } from '@mui/material';
import UrduKeyboard from './UrduKeyboard';

const UrduInput = ({ 
  value, 
  onChange, 
  label, 
  placeholder, 
  multiline = false,
  rows = 1,
  hideKeyboard = false,  // Add this prop
  ...props 
}) => {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleKeyPress = (char) => {
    const newValue = value.slice(0, cursorPosition) + char + value.slice(cursorPosition);
    onChange(newValue);
    setCursorPosition(cursorPosition + char.length);
  };

  const handleBackspace = () => {
    if (cursorPosition > 0) {
      const newValue = value.slice(0, cursorPosition - 1) + value.slice(cursorPosition);
      onChange(newValue);
      setCursorPosition(cursorPosition - 1);
    }
  };

  const handleSelect = (event) => {
    setCursorPosition(event.target.selectionStart);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setCursorPosition(e.target.selectionStart);
        }}
        onSelect={handleSelect}
        label={label}
        placeholder={placeholder}
        multiline={multiline}
        rows={rows}
        fullWidth
        InputProps={{
          sx: { 
            fontFamily: 'Noto Nastaliq Urdu, serif',
            textAlign: 'right',
            direction: 'rtl'
          }
        }}
        InputLabelProps={{
          sx: { 
            fontFamily: 'Noto Nastaliq Urdu, serif',
            right: 0,
            left: 'auto',
            transformOrigin: 'right'
          }
        }}
        {...props}
      />
      {!hideKeyboard && (
        <UrduKeyboard
          show={showKeyboard}
          toggleKeyboard={() => setShowKeyboard(!showKeyboard)}
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
        />
      )}
    </Box>
  );
};

export default UrduInput;