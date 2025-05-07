import axios from './axiosConfig';

/**
 * Process newspaper images through OCR pipeline with summarization
 * @param {Array} files - Array of image files to process (1-10 files)
 * @param {string} newspaperDate - Date of the newspaper in any common format
 * @param {string} newspaperName - Name of the newspaper
 * @returns {Object} Response data including mongoDB ID and processing status
 */
export const processNewspaperOCR = async (files, newspaperDate, newspaperName = 'Unknown Newspaper') => {
    const formData = new FormData();
    
    // Debug logging
    console.log('Files to upload:', files);
    console.log('Newspaper date:', newspaperDate);
    console.log('Newspaper name:', newspaperName);
    
    // Validate file count (1-10 files allowed)
    if (files.length < 1 || files.length > 10) {
        throw new Error(`Invalid number of files. Expected 1-10, got ${files.length}`);
    }
    
    // Add files to form data (use 'images' key for the new API)
    files.forEach((file, index) => {
        formData.append('images', file);
        console.log(`Adding file ${index}:`, file.name);
    });
    
    // Add metadata
    formData.append('newspaper_date', newspaperDate);
    formData.append('newspaper_name', newspaperName);

    // Get the token
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        console.log('Sending OCR request to process-newspaper endpoint...');
        
        const response = await axios({
            method: 'post',
            url: '/api/ocr/process-newspaper',
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
            },
            // Increase timeout for large files or slow connections
            timeout: 300000 // 5 minutes
        });
        
        console.log('OCR processing response:', response.data);
        
        return {
            ...response.data,
            success: true,
            mongodb_id: response.data.mongodb_id || null
        };
    } catch (error) {
        console.error('OCR processing error:', error);
        
        // Handle authentication errors
        if (error.response?.status === 401) {
            console.error('Authentication failed:', error.response.data);
            if (error.response.data.message === 'Token is missing' || 
                error.response.data.message === 'Invalid token') {
                window.location.href = '/login';
            }
        }
        
        throw error.response?.data || { error: error.message };
    }
};

/**
 * Get a list of all processed newspapers
 * @returns {Array} List of newspapers with metadata
 */
export const getProcessedNewspapers = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await axios.get('/api/ocr/newspapers', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.data.newspapers || [];
    } catch (error) {
        console.error('Error fetching processed newspapers:', error);
        throw error.response?.data || { error: error.message };
    }
};

/**
 * Get details of a specific newspaper by ID
 * @param {string} newspaperId - MongoDB ID of the newspaper
 * @returns {Object} Newspaper data with articles and summaries
 */
export const getNewspaperDetails = async (newspaperId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await axios.get(`/api/ocr/newspapers/${newspaperId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return response.data.newspaper || null;
    } catch (error) {
        console.error(`Error fetching newspaper ${newspaperId}:`, error);
        throw error.response?.data || { error: error.message };
    }
};

/**
 * Generate summaries for all articles in a newspaper
 * @param {string} newspaperId - MongoDB ID of the newspaper to summarize
 * @returns {Object} Result of the summarization operation
 */
export const generateNewspaperSummaries = async (newspaperId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await axios.post(`/api/ocr/summarize/${newspaperId}`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            message: response.data.message,
            newspaperId: response.data.newspaper_id
        };
    } catch (error) {
        console.error(`Error generating summaries for newspaper ${newspaperId}:`, error);
        throw error.response?.data || { error: error.message };
    }
};

/**
 * Update newspaper metadata and article content
 * @param {string} newspaperId - MongoDB ID of the newspaper to update
 * @param {Object} updateData - The data to update (name, date, articles)
 * @returns {Object} The updated newspaper
 */
export const updateMongoNewspaper = async (newspaperId, updateData) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await axios.put(`/api/ocr/newspapers/${newspaperId}`, updateData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // After updating, get the updated newspaper data
        const updatedNewspaper = await getNewspaperDetails(newspaperId);
        
        return {
            success: true,
            message: 'Newspaper updated successfully',
            newspaper: updatedNewspaper.newspaper || null
        };
    } catch (error) {
        console.error(`Error updating newspaper ${newspaperId}:`, error);
        throw error.response?.data || { error: error.message };
    }
};

/**
 * Delete a newspaper (admin only)
 * @param {string} newspaperId - MongoDB ID of the newspaper to delete
 * @returns {Object} Result of the deletion operation
 */
export const deleteNewspaper = async (newspaperId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        console.log('OCR Service: Deleting MongoDB newspaper with ID:', newspaperId);
        // Using explicit axios instance with base URL to avoid proxy issues
        const response = await axios({
            method: 'DELETE',
            url: `/api/ocr/newspapers/${newspaperId}`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Delete response:', response.data);
        return {
            success: true,
            message: response.data.message || 'Newspaper deleted successfully',
            newspaperId: response.data.newspaper_id || newspaperId
        };
    } catch (error) {
        console.error(`Error deleting MongoDB newspaper ${newspaperId}:`, error);
        
        // More detailed error handling
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const errorMessage = error.response.data?.error || error.response.data?.message || 'Server error';
            console.error('Server responded with error:', { 
                status: error.response.status, 
                data: error.response.data,
                message: errorMessage
            });
            throw { error: errorMessage, status: error.response.status };
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received from server:', error.request);
            throw { error: 'No response from server. Please check your connection and the API endpoint.', request: true };
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error in request setup:', error.message);
            throw { error: error.message };
        }
    }
};