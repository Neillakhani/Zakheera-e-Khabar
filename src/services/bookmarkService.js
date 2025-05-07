import axios from 'axios';

const API_URL = 'http://localhost:5000/bookmarks';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor
axiosInstance.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const bookmarkService = {
  addBookmark: async (articleData) => {
    try {
      const response = await axiosInstance.post('/', articleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add bookmark' };
    }
  },

  getBookmarks: async () => {
    try {
      console.log('Fetching bookmarks from server...');
      const response = await axiosInstance.get('/');
      
      // Add extra validation to ensure proper format
      const data = response.data;
      console.log('Raw bookmark response:', JSON.stringify(data));
      
      // Ensure we have a bookmarks array
      if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
        console.error('Invalid bookmark data format - missing bookmarks array');
        return { bookmarks: [] }; // Return empty array as fallback
      }
      
      // Validate each bookmark to ensure proper format
      const validatedBookmarks = data.bookmarks.filter(bookmark => {
        // Check that we have both filename and article_index
        const hasFilename = bookmark.filename || bookmark.newspaper_filename;
        const hasArticleIndex = bookmark.article_index !== undefined;
        
        if (!hasFilename || !hasArticleIndex) {
          console.warn('Invalid bookmark format:', bookmark);
          return false;
        }
        return true;
      });
      
      console.log(`Validated ${validatedBookmarks.length} of ${data.bookmarks.length} bookmarks`);
      
      // Return validated data
      return {
        ...data,
        bookmarks: validatedBookmarks
      };
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      throw error.response?.data || { message: 'Failed to fetch bookmarks' };
    }
  },

  removeBookmark: async (bookmarkId) => {
    try {
      const response = await axiosInstance.delete(`/${bookmarkId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to remove bookmark' };
    }
  },

  checkIfBookmarked: async (filename, articleIndex) => {
    try {
      console.log(`Checking if bookmarked: filename=${filename}, article_index=${articleIndex}`);
      const response = await axiosInstance.get('/check', {
        params: { filename, article_index: articleIndex }
      });
      
      // Log the response for debugging
      console.log('Bookmark check response:', response.data);
      
      // Make sure we're getting a boolean back, not just any truthy value
      const isBookmarked = response.data.is_bookmarked === true;
      return isBookmarked;
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  },

  generateSummary: async () => {
    try {
      const response = await axiosInstance.get('/summary');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to generate summary' };
    }
  },

  getArticleSummary: async (filename, articleIndex) => {
    try {
      const response = await axiosInstance.get(`http://localhost:5000/summary/${filename}/articles/${articleIndex}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw { message: 'Please log in to view summaries' };
      }
      throw error.response?.data || error.message;
    }
  }
}; 