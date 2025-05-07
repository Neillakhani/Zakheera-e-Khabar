import React, { useState } from 'react';
import { Box, Fab, Drawer, TextField, IconButton, Tooltip } from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import UrduKeyboard from './UrduKeyboard';

const FloatingKeyboard = () => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleKeyPress = (char) => {
    const newValue = text.slice(0, cursorPosition) + char + text.slice(cursorPosition);
    setText(newValue);
    setCursorPosition(cursorPosition + char.length);
  };

  const handleBackspace = () => {
    if (cursorPosition > 0) {
      const newValue = text.slice(0, cursorPosition - 1) + text.slice(cursorPosition);
      setText(newValue);
      setCursorPosition(cursorPosition - 1);
    }
  };

  const handleSelect = (event) => {
    setCursorPosition(event.target.selectionStart);
  };

  const handleChange = (event) => {
    setText(event.target.value);
    setCursorPosition(event.target.selectionStart);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <>
      <Fab
        size="small"
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 1000
        }}
        onClick={() => setOpen(true)}
      >
        <KeyboardIcon />
      </Fab>

      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            maxHeight: '60vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            p: 2
          }
        }}
      >
        <Box sx={{ width: '100%', mb: 2 }}>
          <Box sx={{ 
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1
          }}>
            <Tooltip title="Copy text">
              <IconButton 
                onClick={handleCopy}
                sx={{ mt: 1 }}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
            <TextField
              value={text}
              onChange={handleChange}
              onSelect={handleSelect}
              multiline
              rows={2}
              fullWidth
              placeholder="یہاں اردو میں ٹائپ کریں..."
              InputProps={{
                sx: { 
                  fontFamily: 'Noto Nastaliq Urdu, serif',
                  textAlign: 'right',
                  direction: 'rtl',
                  fontSize: '1.2rem',
                  lineHeight: 2,
                  '& .MuiInputBase-input': {
                    paddingRight: 2,
                  }
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.paper',
                }
              }}
            />
          </Box>
        </Box>
        <UrduKeyboard
          show={true}
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          toggleKeyboard={() => {}}
        />
      </Drawer>
    </>
  );
};

export default FloatingKeyboard;