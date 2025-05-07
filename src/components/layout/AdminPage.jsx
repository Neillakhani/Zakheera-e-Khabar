import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Box,
  TextField,
  Input,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Divider
} from '@mui/material';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOCR } from '../../contexts/OCRContext';
import NewspaperList from '../newspapers/NewspaperList';
import OCRProgressViewer from '../admin/OCRProgressViewer';
import { 
  Add as AddIcon,
  DocumentScanner as ScannerIcon,
  Close as CloseIcon 
} from '@mui/icons-material';
import { processNewspaperOCR } from '../../services/ocrService';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newspaperDate, setNewspaperDate] = useState('');
  
  // Create a reference to the file input element so we can reset it
  const fileInputRef = React.useRef(null);
  
  // Use the global OCR context for persistent processing state
  const { ocrProgress, startOCRProcessing, completeOCRProcessing, setJobId, showProgressView } = useOCR();
  
  // Add local state to directly control button disabled state
  const [isProcessingLocally, setIsProcessingLocally] = useState(false);

  // Add state for newspaper refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh newspapers list
  const refreshNewspapers = () => {
    console.log('Triggering newspaper list refresh');
    setRefreshTrigger(prev => prev + 1);
  };

  // Only show the main admin content if we're at the /admin route exactly
  const isMainAdminPage = location.pathname === '/admin';

  if (!isMainAdminPage) {
    return <Outlet />;
  }

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 2) {
      setError('آپ صرف 2 فائلیں منتخب کر سکتے ہیں۔');
      return;
    }
    setSelectedFiles(files);
    setError(null);
  };

  const handleFileRemove = (indexToRemove) => {
    // Remove the file from the selected files array
    setSelectedFiles(prev => {
      const updatedFiles = prev.filter((_, index) => index !== indexToRemove);
      
      // If all files have been removed, reset the file input element
      if (updatedFiles.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      return updatedFiles;
    });
  };

  const handleOCRProcess = async () => {
    if (selectedFiles.length === 0) {
      setError('براہ کرم کم از کم ایک فائل منتخب کریں۔');
      return;
    }

    if (!newspaperDate) {
      setError('براہ کرم اخبار کی تاریخ درج کریں۔');
      return;
    }

    // Check for token before processing
    const token = localStorage.getItem('token');
    if (!token) {
      setError('براہ کرم دوبارہ لاگ ان کریں۔');
      navigate('/login');
      return;
    }

    // Set both global and local processing states
    setIsProcessingLocally(true); // Set local state to disable button
    startOCRProcessing(newspaperDate);
    setError(null);
    setSuccess(null);

    // Clear selected files immediately when OCR process starts
    const filesToProcess = [...selectedFiles]; // Keep a copy for processing
    setSelectedFiles([]); // Clear the files list immediately
    setNewspaperDate(''); // Also clear the newspaper date
    
    // Reset the file input element so it visually shows as cleared
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // This clears the actual HTML input element
    }

    try {
      console.log('Starting OCR with token:', token); // Debug log
      const result = await processNewspaperOCR(filesToProcess, newspaperDate);
      
      // Set job ID for tracking progress
      if (result.job_id) {
        console.log('Received job_id from backend:', result.job_id);
        setJobId(result.job_id);
      } else {
        console.error('No job_id was returned from the backend');
      }
      
      // Set success message based on result
      let successMessage;
      if (result.summaries_generated) {
        successMessage = 'OCR پروسیسنگ اور خلاصہ سازی کامیابی سے مکمل ہو گئی! اخبار اب فرنٹ اینڈ پر دستیاب ہے۔';
      } else {
        successMessage = 'OCR پروسیسنگ کامیابی سے مکمل ہو گئی لیکن خلاصہ سازی میں مسئلہ تھا۔';
      }
      
      // We're now keeping the progress view visible until the user manually dismisses it
      // The progress visualization remains displayed after OCR completion
      setSuccess(successMessage);
      setSelectedFiles([]);
      setNewspaperDate('');
      
      // Refresh the newspaper list to show the newly processed newspaper
      refreshNewspapers();
      
      // Mark OCR processing as complete but keep the progress view visible
      // This allows the user to see the results but also enables the OCR button for new files
      completeOCRProcessing(true, null);
      
      // Explicitly reset the local processing state to ensure button is enabled
      setIsProcessingLocally(false);
    } catch (err) {
      if (err.message === 'No authentication token found') {
        const authError = 'براہ کرم دوبارہ لاگ ان کریں۔';
        completeOCRProcessing(null, authError);
        setIsProcessingLocally(false); // Ensure button is enabled even on error
        setError(authError);
        navigate('/login');
      } else {
        const errorMessage = err.message || 'OCR پروسیسنگ میں خرابی';
        completeOCRProcessing(null, errorMessage);
        setIsProcessingLocally(false); // Ensure button is enabled even on error
        setError(errorMessage);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{
          fontFamily: 'Noto Nastaliq Urdu, serif',
          textAlign: 'right',
          mb: 4
        }}
      >
        {`خوش آمدید، ${user?.name || 'ایڈمن'}`}
      </Typography>

      <Grid container spacing={3}>
        {/* Add Newspaper Card */}

        {/* OCR Processing Card - always full width */}
        <Grid item xs={12} md={12}>
          <Card sx={{ height: '100%', width: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <ScannerIcon />
              </Box>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{
                  fontFamily: 'Noto Nastaliq Urdu, serif',
                  textAlign: 'right'
                }}
              >
                اخبار کی OCR پروسیسنگ اور خلاصہ سازی
              </Typography>

              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <TextField
                  label="اخبار کی تاریخ"
                  placeholder="مثال: 26thjan2024"
                  value={newspaperDate}
                  onChange={(e) => setNewspaperDate(e.target.value)}
                  fullWidth
                  sx={{ 
                    mb: 2,
                    direction: 'rtl',
                    '& label': {
                      fontFamily: 'Noto Nastaliq Urdu, serif',
                      right: 0,
                      transformOrigin: 'right',
                    },
                    '& input': {
                      fontFamily: 'Noto Nastaliq Urdu, serif',
                      textAlign: 'right'
                    }
                  }}
                />

                <Input
                  type="file"
                  inputRef={fileInputRef}
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
                          justifyContent: 'flex-end',
                          mb: 1 
                        }}
                      >
                        <IconButton 
                          size="small"
                          onClick={() => handleFileRemove(index)}
                        >
                          <CloseIcon />
                        </IconButton>
                        <Typography 
                          variant="body2"
                          sx={{
                            fontFamily: 'Noto Nastaliq Urdu, serif',
                            ml: 1
                          }}
                        >
                          {file.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Use local state for button disabling instead of global state */}
                {console.log('OCR Button State:', {
                  locallyProcessing: isProcessingLocally,
                  globalInProgress: ocrProgress.inProgress,
                  filesSelected: selectedFiles.length > 0
                })}
                <Button
                  variant="contained"
                  onClick={handleOCRProcess}
                  disabled={isProcessingLocally || selectedFiles.length === 0}
                  sx={{ 
                    mt: 2,
                    fontFamily: 'Noto Nastaliq Urdu, serif'
                  }}
                >
                  {ocrProgress.inProgress ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'OCR پروسیس کریں'
                  )}
                </Button>
              </Box>

              {/* {(error || ocrProgress.error) && (
                <Alert severity="error" sx={{ mt: 2, width: '100%', textAlign: 'right' }}>
                  {error || ocrProgress.error}
                </Alert>
              )}
              {(success || ocrProgress.success) && (
                <Alert severity="success" sx={{ mt: 2, width: '100%', textAlign: 'right' }}>
                  {success || ocrProgress.success}
                </Alert>
              )} */}
              
              {/* Global OCR progress indicator - only show during active processing */}
              {/* {isOCRInProgress && ocrProgress.inProgress && (
                <Alert severity="info" sx={{ mt: 2, width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography sx={{ fontFamily: 'Noto Nastaliq Urdu, serif', textAlign: 'right' }}>
                      OCR پروسیسنگ اور خلاصہ سازی چل رہی ہے... براہ کرم انتظار کریں۔
                    </Typography>
                  </Box>
                </Alert>
              )} */}
              
              {/* OCR Progress Visualization - Always show when OCR has started, but stays visible after completion */}
              {ocrProgress.showProgress && (
                <Box sx={{ mt: 3, mb: 2, border: '1px solid #e0e0e0', borderRadius: 1, p: 2, backgroundColor: '#f5f5f5', width: '100%', maxWidth: '100%' }}>
                  <Divider sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontFamily: 'Noto Nastaliq Urdu, serif', fontWeight: 'bold' }}>
                      OCR کی پیش رفت
                    </Typography>
                  </Divider>
                  
                  {ocrProgress.jobId ? (
                    <OCRProgressViewer jobId={ocrProgress.jobId} />
                  ) : ocrProgress.inProgress ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress size={40} />
                      <Typography sx={{ ml: 2, fontFamily: 'Noto Nastaliq Urdu, serif' }}>
                        قطار میں شامل کرنے کا انتظار ہے...
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      

        {/* Newspaper list */}
        <Grid item xs={12}>
          <Typography 
            variant="h5" 
            component="h2" 
            gutterBottom
            sx={{
              fontFamily: 'Noto Nastaliq Urdu, serif',
              textAlign: 'right',
              mb: 3
            }}
          >
            موجودہ اخبارات
          </Typography>
          <NewspaperList refreshTrigger={refreshTrigger} />
        </Grid>
      </Grid> {/* Close of main container Grid */}
    </Container>
  );
};

export default AdminPage; 