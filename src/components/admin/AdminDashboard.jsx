import { useState, useEffect } from 'react';
import { Box, Container, Grid, Paper, Typography, Button, Input, CircularProgress, Alert, IconButton, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Newspaper as NewspaperIcon, DocumentScanner as ScannerIcon, Close as CloseIcon } from '@mui/icons-material';
import NewspaperList from '../newspapers/NewspaperList';
import { processNewspaperOCR, getProcessedNewspapers } from '../../services/ocrService';
import { useOCR } from '../../contexts/OCRContext';
import OCRProgressViewer from './OCRProgressViewer';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newspaperDate, setNewspaperDate] = useState('');
  const [newspaperName, setNewspaperName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processedNewspapers, setProcessedNewspapers] = useState([]);
  
  // Use the global OCR context
  const { ocrProgress, isOCRInProgress, startOCRProcessing, completeOCRProcessing } = useOCR();

  // Fetch the list of processed newspapers when component mounts
  useEffect(() => {
    const fetchNewspapers = async () => {
      try {
        const newspapers = await getProcessedNewspapers();
        setProcessedNewspapers(newspapers);
      } catch (error) {
        console.error('Failed to fetch newspapers:', error);
      }
    };

    fetchNewspapers();
  }, [success]); // Refresh when success state changes (after OCR completion)

  const handleAddNewspaperClick = () => {
    navigate('/admin/add-newspaper');
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 2) {
      setError('You can only select up to 2 files');
      return;
    }
    setSelectedFiles(files);
    setError(null);
  };

  const handleFileRemove = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleOCRProcess = async () => {
    // Validate inputs
    if (selectedFiles.length === 0) {
      setError('براہ کرم کم از کم ایک فائل منتخب کریں۔');
      return;
    }

    if (!newspaperDate) {
      setError('براہ کرم اخبار کی تاریخ درج کریں۔');
      return;
    }

    if (!newspaperName) {
      setError('براہ کرم اخبار کا نام درج کریں۔');
      return;
    }

    // Set loading states
    setIsLoading(true);
    startOCRProcessing(newspaperDate);
    setError(null);
    setSuccess(null);

    try {
      // Process newspaper with new OCR API
      const result = await processNewspaperOCR(selectedFiles, newspaperDate, newspaperName);
      
      // Success message
      let successMessage = 'OCR پروسیسنگ اور خلاصہ سازی کامیابی سے مکمل ہو گئی! اخبار اب ڈیٹابیس میں محفوظ ہے۔';
      
      // Log MongoDB ID if available
      if (result.mongodb_id) {
        console.log('Newspaper saved to MongoDB with ID:', result.mongodb_id);
        successMessage += ` (ID: ${result.mongodb_id})`;
      }
      
      // Complete OCR processing
      completeOCRProcessing(successMessage);
      setSuccess(successMessage);
      
      // Reset form
      setSelectedFiles([]);
      setNewspaperDate('');
      setNewspaperName('');
    } catch (err) {
      console.error('OCR Processing Error:', err);
      const errorMessage = err.error || err.message || 'OCR پروسیسنگ میں خرابی';
      completeOCRProcessing(null, errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            onClick={handleAddNewspaperClick}
          >
            <NewspaperIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" component="h2" gutterBottom>
              Add New Newspaper
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Upload new newspaper articles in Urdu
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <ScannerIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" component="h2" gutterBottom>
              Process Newspaper OCR & Summarization
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Uploaded newspapers will be automatically processed and summarized
            </Typography>
            
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <TextField
                label="اخبار کا نام"
                placeholder="مثال: روزنامہ جنگ"
                value={newspaperName}
                onChange={(e) => setNewspaperName(e.target.value)}
                fullWidth
                sx={{ mb: 2, direction: 'rtl' }}
              />
              
              <TextField
                label="اخبار کی تاریخ"
                placeholder="مثال: 2025-05-03"
                value={newspaperDate}
                onChange={(e) => setNewspaperDate(e.target.value)}
                fullWidth
                sx={{ mb: 2, direction: 'rtl' }}
                helperText="YYYY-MM-DD format recommended"
              />
            </Box>

            <Input
              type="file"
              inputProps={{
                multiple: true,
                accept: 'image/*'
              }}
              onChange={handleFileSelect}
              sx={{ mb: 2 }}
            />

            {selectedFiles.length > 0 && (
              <Box sx={{ width: '100%', mb: 2 }}>
                {selectedFiles.map((file, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1 
                    }}
                  >
                    <Typography variant="body2">
                      {file.name}
                    </Typography>
                    <IconButton 
                      size="small"
                      onClick={() => handleFileRemove(index)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            <Button
              variant="contained"
              onClick={handleOCRProcess}
              disabled={isOCRInProgress || selectedFiles.length === 0 || !newspaperDate || !newspaperName || isLoading}
              sx={{ mt: 2 }}
            >
              {(isOCRInProgress || isLoading) ? (
                <>
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  Processing...
                </>
              ) : (
                'Process Newspaper with OCR & Summarization'
              )}
            </Button>

            {(error || ocrProgress.error) && (
              <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                {error || ocrProgress.error}
              </Alert>
            )}
            {(success || ocrProgress.success) && (
              <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
                {success || ocrProgress.success}
              </Alert>
            )}
            
            {/* Basic progress indicator when we don't have a job ID yet */}
            {isOCRInProgress && !ocrProgress.jobId && (
              <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={20} />
                  <Typography>OCR پروسیسنگ اور خلاصہ سازی چل رہی ہے... براہ کرم انتظار کریں۔</Typography>
                </Box>
              </Alert>
            )}
            
            {/* OCR Progress Viewer with visual feedback */}
            {isOCRInProgress && ocrProgress.jobId && (
              <OCRProgressViewer jobId={ocrProgress.jobId} />
            )}
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Existing Newspapers
        </Typography>
        <NewspaperList />
      </Box>
    </Container>
  );
} 