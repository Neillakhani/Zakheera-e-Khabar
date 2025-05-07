import React, { createContext, useContext, useState } from 'react';

// Create the OCR context
const OCRContext = createContext();

// Custom hook to use the OCR context
export const useOCR = () => useContext(OCRContext);

// OCR context provider component
export const OCRProvider = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({
    inProgress: false,
    status: '',
    step: 0, // 0: Not started, 1: Detecting bounding boxes, 2: Processing headlines, 3: Article break detection, 4: Page connection
    error: null,
    success: null,
    filename: null,
    jobId: null,
    progressImages: {},
    descriptions: {},
    showProgress: false // New flag to control visibility of progress view
  });

  // Start OCR processing
  const startOCRProcessing = (filename, jobId = null) => {
    setOcrProgress({
      inProgress: true,
      status: 'OCR processing in progress...',
      step: 1, // Start with step 1: Detecting bounding boxes
      error: null,
      success: null,
      filename,
      jobId,
      progressImages: {},
      descriptions: {},
      showProgress: true // Show progress view when processing starts
    });
  };

  // Complete OCR processing
  const completeOCRProcessing = (success, error = null) => {
    console.log('Completing OCR processing, success:', success, 'error:', error);
    
    // Force immediate update to inProgress state as a separate update for reliability
    setIsProcessing(false);
    
    // Simple direct update with explicit inProgress=false to force button to enable
    setOcrProgress(prev => {
      console.log('Previous OCR state before completion update:', prev);
      
      // Create a completely new state object with inProgress explicitly false
      const newState = {
        ...prev,
        inProgress: false,   // CRITICAL: Explicitly disable processing state to enable the button
        showProgress: true,  // Keep progress view visible until dismissed
        status: success ? 'Processing completed successfully!' : 'Processing completed with errors.',
        error: error,
        success: success
      };
      
      console.log('New OCR state after completion:', newState);
      return newState;
    });
    
    // Log confirmation of the state update
    console.log('OCR processing marked as complete');
  };
  
  // Update OCR progress with an image
  const updateOCRProgressWithImage = (step, stepImage, description) => {
    setOcrProgress(prev => ({
      ...prev,
      step,
      progressImages: { ...prev.progressImages, [step]: stepImage },
      descriptions: { ...prev.descriptions, [step]: description }
    }));
  };
  
  // Set the job ID for tracking OCR progress
  const setJobId = (jobId) => {
    setOcrProgress(prev => ({
      ...prev,
      jobId
    }));
  };
  
  // Dismiss progress view (new function)
  const dismissProgressView = () => {
    console.log('Dismissing progress view');
    // Reset the entire OCR progress state rather than just a few fields
    setOcrProgress({
      inProgress: false,
      status: '',
      step: 0,
      error: null,
      success: null,
      filename: null,
      jobId: null,
      progressImages: {},
      descriptions: {},
      showProgress: false
    });
  };

  return (
    <OCRContext.Provider
      value={{
        ocrProgress,
        isOCRInProgress: ocrProgress.inProgress,
        showProgressView: ocrProgress.showProgress,
        startOCRProcessing,
        completeOCRProcessing,
        updateOCRProgressWithImage,
        setJobId,
        dismissProgressView
      }}
    >
      {children}
    </OCRContext.Provider>
  );
};
