import React, { useState } from 'react';
import { Box, Button, Paper, IconButton } from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import BackspaceIcon from '@mui/icons-material/Backspace';

const UrduKeyboard = ({ onKeyPress, onBackspace, show, toggleKeyboard }) => {
  // Urdu keyboard layout
  const keyboardLayout = [
    ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ہ', 'خ', 'ح', 'ج', 'چ'],
    ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
    ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'ژ', 'ڑ'],
    ['ں', 'ء', 'آ', 'اً', 'ۃ', 'ة', 'ؤ', 'ئ', 'ي', 'ے'],
    // Additional characters
    ['۔', '؟', '،', 'ٰ', 'ٖ', 'ٗ', 'ً', 'ْ', 'ِ', 'ُ', 'َ', 'ّ']
  ];

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      <IconButton 
        onClick={toggleKeyboard}
        sx={{ mb: 1 }}
      >
        <KeyboardIcon />
      </IconButton>

      {show && (
        <Paper 
          elevation={3}
          sx={{
            p: 1,
            bgcolor: 'background.paper',
            position: 'relative',
            zIndex: 1000
          }}
        >
          {keyboardLayout.map((row, rowIndex) => (
            <Box 
              key={rowIndex}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 0.5,
                mb: 0.5
              }}
            >
              {row.map((key, keyIndex) => (
                <Button
                  key={keyIndex}
                  variant="outlined"
                  size="small"
                  onClick={() => onKeyPress(key)}
                  sx={{
                    minWidth: '36px',
                    height: '36px',
                    p: 0,
                    fontFamily: 'Noto Nastaliq Urdu, serif',
                    fontSize: '1.1rem'
                  }}
                >
                  {key}
                </Button>
              ))}
            </Box>
          ))}
          <Box 
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
              mt: 1
            }}
          >
            <Button
              variant="outlined"
              onClick={onBackspace}
              startIcon={<BackspaceIcon />}
              sx={{
                fontFamily: 'Noto Nastaliq Urdu, serif'
              }}
            >
              حذف کریں
            </Button>
            <Button
              variant="outlined"
              onClick={() => onKeyPress(' ')}
              sx={{
                minWidth: '120px',
                fontFamily: 'Noto Nastaliq Urdu, serif'
              }}
            >
              خالی جگہ
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default UrduKeyboard;