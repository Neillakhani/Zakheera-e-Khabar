import axios from './axiosConfig';

// Cache for progress data to avoid unnecessary flicker during polling
const progressCache = {};

/**
 * Fetch OCR progress from the server
 * @param {string} jobId - The unique ID of the OCR job
 * @param {boolean} bypassCache - Whether to bypass the cache and force a fresh fetch
 * @returns {Object} The OCR progress data
 */
export const fetchOCRProgress = async (jobId, bypassCache = false) => {
    try {
        // Return cached data if available and not bypassing cache
        if (!bypassCache && progressCache[jobId]) {
            return progressCache[jobId];
        }
        
        // Get token for authorization
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log(`Attempting to fetch OCR progress for job: ${jobId}`);
        
        // Use a direct axios instance for this specific request to override default settings
        const response = await axios.get(`http://localhost:5000/ocr/progress/${jobId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            },
            withCredentials: true,
            // Add a timeout to prevent hanging requests
            timeout: 10000
        });

        // Cache the progress data
        if (response.data.status === 'success' && response.data.progress) {
            progressCache[jobId] = response.data.progress;
            
            // Clear cache if job is completed
            if (response.data.progress.completed) {
                // Set a timeout to clear the cache after 5 seconds
                setTimeout(() => {
                    delete progressCache[jobId];
                }, 5000);
            }
        }

        return response.data.progress;
    } catch (error) {
        console.error('Error fetching OCR progress:', error);
        // Log more detailed error information
        if (error.response) {
            console.log('Error response data:', error.response.data);
            console.log('Error response status:', error.response.status);
            console.log('Error response headers:', error.response.headers);
        } else if (error.request) {
            console.log('Error request:', error.request);
            console.log('No response received');
        } else {
            console.log('Error message:', error.message);
        }
        
        // Return cached data if available and there's an error
        if (progressCache[jobId]) {
            console.log('Returning cached OCR progress data due to fetch error');
            return progressCache[jobId];
        }
        
        // Create a minimal progress object if no cache is available
        // This prevents the UI from breaking completely
        return {
            step: 0,
            images: {},
            completed: false,
            error: true,
            error_message: error.message || 'Failed to fetch progress'
        };
    }
};

/**
 * Clear the progress cache for a specific job ID
 * @param {string} jobId - The unique ID of the OCR job to clear from cache
 */
export const clearProgressCache = (jobId) => {
    if (jobId && progressCache[jobId]) {
        delete progressCache[jobId];
    }
};
