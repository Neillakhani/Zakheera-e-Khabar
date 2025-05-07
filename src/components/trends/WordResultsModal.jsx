import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent,
    Typography,
    Box,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WordResultsList from './WordResultsList';

const WordResultsModal = ({ open, onClose, selectedWord, selectedYear }) => {
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        Articles containing "{selectedWord}"
                        {selectedYear && ` in ${selectedYear}`}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <WordResultsList 
                    selectedWord={selectedWord} 
                    year={selectedYear} 
                />
            </DialogContent>
        </Dialog>
    );
};

export default WordResultsModal; 