import axios from 'axios';

const API_URL = 'http://localhost:5000/search';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token if available
axiosInstance.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const searchService = {
  semanticSearch: async (query, numResults = 5) => {
    try {
      const response = await axiosInstance.post('/', {
        query,
        num_results: numResults
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to perform search' };
    }
  },

  advancedSearch: async (query, options = {}) => {
    try {
      const response = await axiosInstance.post('/advanced', {
        query,
        num_results: options.numResults || 5,
        min_score: options.minScore || 0.65,
        date_range: options.dateRange
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to perform advanced search' };
    }
  },

  getArticleSummary: async (filename, articleIndex, content = '') => {
    try {
      console.log('Getting summary for:', {filename, articleIndex});
      console.log('Article index type:', typeof articleIndex);
      console.log('Content length:', content ? content.length : 0);
      
      // Make sure articleIndex is a number
      const numericIndex = Number(articleIndex);
      console.log('Converted article index:', numericIndex);
      
      // Properly encode the filename parameter to handle special characters in MongoDB IDs
      const encodedFilename = encodeURIComponent(filename);
      
      // Build URL with query parameters for identifying the article
      let url = `http://localhost:5000/summary/${encodedFilename}/articles/${numericIndex}`;
      const params = [];
      
      // Handle different content parameter formats
      if (content) {
        // If content is an object with article payload
        if (typeof content === 'object') {
          // Pass article_number as a separate parameter
          if (content.article_number !== undefined) {
            params.push(`article_number=${content.article_number}`);
          }
          
          // If the object has a content property, use it as the content parameter
          if (content.content && typeof content.content === 'string') {
            // Limit content length for URL size constraints
            const shortContent = content.content.substring(0, 200);  // Use shorter length
            params.push(`content=${encodeURIComponent(shortContent)}`);
          }
        } 
        // If content is directly a string
        else if (typeof content === 'string') {
          // Limit content length for URL size constraints
          const shortContent = content.substring(0, 200);  // Use shorter length
          params.push(`content=${encodeURIComponent(shortContent)}`);
        }
      }
      
      // Add query parameters if any exist
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      // Use axiosInstance for summary requests as well to include auth token
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw { message: 'Please log in to view summaries' };
      }
      throw error.response?.data || error.message;
    }
  }
}; 