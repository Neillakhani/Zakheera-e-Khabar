import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Step, StepLabel, Stepper, Chip, Alert, AlertTitle, Grid, Card, CardContent, CardMedia, Button } from '@mui/material';
import { fetchOCRProgress } from '../../services/ocrProgressService';
import { useOCR } from '../../contexts/OCRContext';

const OCRProgressViewer = ({ jobId }) => {
  const [pollingActive, setPollingActive] = useState(true);
  const { ocrProgress, updateOCRProgressWithImage, dismissProgressView } = useOCR();
  
  // Add debug logging
  console.log('OCRProgressViewer received jobId:', jobId);
  console.log('Current OCR Progress state:', ocrProgress);

  // State to track local progress info
  const [progressInfo, setProgressInfo] = useState({
    currentStep: 0,
    stepName: '',
    description: '',
    images: {},
    imageHistory: [], // Array to store all processed image updates in order
    completed: false,
    error: false,
    errorMessage: ''
  });

  // Poll for progress updates
  useEffect(() => {
    if (!jobId || !pollingActive) return;

    console.log('Starting polling for job ID:', jobId);
    
    const pollInterval = setInterval(async () => {
      try {
        console.log('Polling for OCR progress for job:', jobId);
        const progress = await fetchOCRProgress(jobId);
        console.log('Received progress update:', progress);
        
        if (progress) {
          // Check if the progress data contains an error flag from our error handler
          if (progress.error) {
            console.warn('Error received from OCR progress service:', progress.error_message);
            // Still update the state with the error information
            setProgressInfo(prev => ({
              ...prev,
              error: true,
              errorMessage: progress.error_message || 'Failed to fetch progress data',
              // Keep existing data intact in case we need to show partial progress
              completed: false
            }));
            
          } else {
            // Normal processing when no errors
            // Debug image data to help identify CORS issues
            if (progress.images) {
              Object.entries(progress.images).forEach(([step, imageData]) => {
                if (imageData) {
                  console.log(`Image data for step ${step} - length: ${imageData.length}`);
                  // Check if the data looks like valid base64
                  const isValidBase64 = imageData.startsWith('data:') || /^[A-Za-z0-9+/=]+$/.test(imageData.substring(0, 100));
                  console.log(`Image data appears to be valid: ${isValidBase64}`);
                }
              });
            }
            
            // Check if we have a new image that's not already in our history
            const currentImages = progressInfo.images;
            const newImages = progress.images || {};
            let updatedImageHistory = [...progressInfo.imageHistory];
            
            // For each step that has an image in the progress data
            Object.entries(newImages).forEach(([step, imageData]) => {
              // Only process if we have valid image data
              if (imageData) {
                // Check if this exact image is already in our history
                const imageAlreadyExists = updatedImageHistory.some(
                  historyItem => historyItem.step === parseInt(step, 10) && historyItem.imageData === imageData
                );
                
                // If not already in history or if it's an update to a current step, add it
                if (!imageAlreadyExists) {
                  console.log(`Adding new image for step ${step} to history`);
                  // Add this new image to our history with metadata
                  updatedImageHistory.push({
                    step: parseInt(step, 10),
                    stepName: progress.current_step_name || '',
                    description: progress.description || '',
                    imageData: imageData,
                    timestamp: new Date().getTime()
                  });
                }
              }
            });
            
            // Update local progress state with new images and history
            setProgressInfo({
              currentStep: progress.step,
              stepName: progress.current_step_name || '',
              description: progress.description || '',
              images: newImages,
              imageHistory: updatedImageHistory,
              completed: progress.completed,
              error: false,
              errorMessage: ''
            });
          }
          
          console.log('Updated progressInfo:', {
            currentStep: progress.step,
            images: Object.keys(progress.images || {})
          });
          
          // Update global OCR context
          const currentStepNumber = progress.step;
          if (currentStepNumber !== ocrProgress.step && progress.images && progress.images[currentStepNumber]) {
            updateOCRProgressWithImage(
              currentStepNumber,
              progress.images[currentStepNumber],
              progress.description || ''
            );
          }
          
          // Stop polling if the job is completed
          // But don't hide the progress view - we'll keep it visible until user dismisses it
          if (progress.completed) {
            setPollingActive(false);
          }
        }
      } catch (error) {
        console.error('Error polling OCR progress:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, pollingActive, updateOCRProgressWithImage, ocrProgress.step]);

  // OCR process steps with their corresponding step numbers
  const steps = {
    1: 'Detecting bounding boxes',
    2: 'Cropping article regions',
    3: 'Article regions',
    4: 'OCR text extraction'
  };

  // Check if OCR is complete
  const isOCRComplete = !progressInfo.inProgress && progressInfo.currentStep > 0;
  
  // Get step name from step number
  const getStepName = (stepNumber) => {
    return steps[stepNumber] || `Step ${stepNumber}`;
  };

  // Handler to dismiss the progress view
  const handleDismiss = () => {
    dismissProgressView();
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3, mb: 3, border: '1px solid #e0e0e0', backgroundColor: '#f9f9f9', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">OCR Progress</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
        
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleDismiss}
            size="small"
          >
            Close View
          </Button>
        </Box>
      </Box>
      
      {!jobId && (
        <Alert severity="warning" sx={{ mb: 2 }}>No job ID provided. Progress tracking is not available.</Alert>
      )}
      
      {/* Show error alert if there's an error */}
      {progressInfo.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error Loading Progress</AlertTitle>
          {progressInfo.errorMessage || 'Failed to fetch progress data. The server may be experiencing issues or restarting.'}
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Job ID: {jobId || 'Not available'}
            </Typography>
          </Box>
        </Alert>
      )}
      
      {/* Stepper to show step progress */}
      <Stepper activeStep={progressInfo.currentStep - 1} alternativeLabel sx={{ mb: 3 }}>
        {Object.entries(steps).map(([stepNumber, label]) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* Description of current step */}
      {progressInfo.currentStep > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {progressInfo.description || `Processing OCR step ${progressInfo.currentStep}`}
        </Typography>
      )}
      
      {/* Current Step Information with Completion Status */}
      {progressInfo.currentStep > 0 && (
        <Box sx={{ mb: 3, p: 2, borderRadius: 2, backgroundColor: isOCRComplete ? '#f8fdf8' : 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '100%' }}>
          <Typography variant="h6" sx={{ mb: 1, color: isOCRComplete ? 'success.main' : 'initial' }}>
            {isOCRComplete ? 'OCR Processing Complete ✓' : `Current Progress: ${getStepName(progressInfo.currentStep)}`}
          </Typography>
          
          {!isOCRComplete && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {progressInfo.description || `Processing OCR step ${progressInfo.currentStep}`}
            </Typography>
          )}
          
          {/* Show completion success message or current processing status */}
          {isOCRComplete ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3, p: 3, backgroundColor: '#e8f5e9', borderRadius: 2 }}>
              <Typography variant="body1" align="center">
                All processing steps have been completed successfully!<br/>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  You can now view the newspaper in the list below.
                </Typography>
              </Typography>
            </Box>
          ) : progressInfo.images && progressInfo.images[progressInfo.currentStep] ? (
            <Box sx={{ textAlign: 'center', p: 1 }}>
              <img 
                src={progressInfo.images[progressInfo.currentStep].startsWith('data:') 
                  ? progressInfo.images[progressInfo.currentStep] 
                  : `data:image/jpeg;base64,${progressInfo.images[progressInfo.currentStep]}`}
                alt={`Current processing - ${progressInfo.stepName}`}
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', border: '1px solid #eee' }}
                onError={(e) => {
                  console.error('Error loading current image:', e);
                  e.target.style.display = 'none';
                  e.target.insertAdjacentHTML('afterend', 
                    '<div style="padding: 20px; background: #f0f0f0; color: #555;">Unable to load image</div>'
                  );
                }}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3 }}>
              <CircularProgress size={40} sx={{ mr: 2 }} />
              <Typography>Processing images...</Typography>
            </Box>
          )}
        </Box>
      )}
      
      {/* Focused image section - Only bounding boxes as requested */}
      <Box sx={{ mb: 3 }}>
        {/* Bounding boxes image section */}
        <Card sx={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Bounding boxes
            </Typography>
            
            {/* Show the bounding image (step 1) */}
            {progressInfo.images && progressInfo.images[1] ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <img
                  src={progressInfo.images[1].startsWith('data:') 
                    ? progressInfo.images[1] 
                    : `data:image/jpeg;base64,${progressInfo.images[1]}`}
                  alt="Bounding boxes detected in the newspaper"
                  style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
                  onError={(e) => {
                    console.error('Error loading bounding box image:', e);
                    e.target.style.display = 'none';
                    e.target.insertAdjacentHTML('afterend', 
                      '<div style="padding: 20px; background: #f0f0f0; color: #555;">Unable to load bounding box image</div>'
                    );
                  }}
                />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                Bounding box image not available
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
      
      {/* No images yet - loading indicator */}
      {progressInfo.currentStep > 0 && progressInfo.imageHistory.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}
    </Paper>
  );
};

export default OCRProgressViewer;
