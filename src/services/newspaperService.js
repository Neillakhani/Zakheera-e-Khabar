import axios from 'axios';

const API_URL = 'http://localhost:5000/text-newspapers';

// Add auth token to requests
const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return {
    'Authorization': user?.token ? `Bearer ${user.token}` : '',
    'Content-Type': 'application/json',
  };
};

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

export const newspaperService = {
  createNewspaper: async (date, content) => {
    try {
      console.log('Creating newspaper with data:', { date, contentLength: content?.length });
      
      // Split content into paragraphs (articles)
      const paragraphs = content.split('\n\n').filter(p => p.trim());
      
      // Format each paragraph into an article
      const articles = paragraphs.map(paragraph => {
        const lines = paragraph.trim().split('\n');
        return {
          headline: lines[0], // First line of paragraph is headline
          content: lines.slice(1).join('\n').trim() // Rest of paragraph is content
        };
      });

      console.log('Formatted articles:', {
        numberOfArticles: articles.length,
        articles: articles.map(a => ({ 
          headlineLength: a.headline.length,
          contentPreview: a.content.substring(0, 50) + '...'
        }))
      });

      const response = await axiosInstance.post('/', {
        date,
        articles
      });
      console.log('Newspaper creation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating newspaper:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        error: error.message
      });
      throw error.response?.data || { message: `Failed to create newspaper: ${error.message}` };
    }
  },

  getAllNewspapers: async () => {
    try {
      const response = await axiosInstance.get('/');
      return response.data.newspapers;
    } catch (error) {
      console.error('Error fetching newspapers:', error);
      throw error.response?.data || { message: 'Failed to fetch newspapers' };
    }
  },

  getNewspaperDetail: async (filename) => {
    try {
      const response = await axiosInstance.get(`/${filename}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching newspaper details:', error);
      throw error.response?.data || { message: 'Failed to fetch newspaper details' };
    }
  },

  getArticle: async (filename, articleIndex) => {
    try {
      const response = await axiosInstance.get(`/${filename}/articles/${articleIndex}`);
      return response.data.article;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error.response?.data || { message: 'Failed to fetch article' };
    }
  },

  getArticleSummary: async (filename, articleIndex) => {
    try {
      const response = await axiosInstance.get(`http://localhost:5000/summary/${filename}/articles/${articleIndex}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching article summary:', error);
      throw error.response?.data || { message: 'Failed to fetch article summary' };
    }
  },

  deleteNewspaper: async (filename) => {
    try {
      console.log('Deleting newspaper:', filename);
      const response = await axiosInstance.delete(`/${filename}`);
      console.log('Newspaper deletion response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting newspaper:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        error: error.message
      });
      throw error.response?.data || { message: `Failed to delete newspaper: ${error.message}` };
    }
  },

  updateNewspaper: async (filename, articles) => {
    try {
      console.log('Updating newspaper:', { filename, numberOfArticles: articles.length });
      const response = await axiosInstance.put(`/${filename}`, {
        articles
      });
      console.log('Newspaper update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating newspaper:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        error: error.message
      });
      throw error.response?.data || { message: `Failed to update newspaper: ${error.message}` };
    }
  },

  generateSummaries: async (filename) => {
    try {
      console.log('Generating summaries for newspaper:', filename);
      const response = await axiosInstance.post(`/${filename}/generate-summaries`);
      console.log('Summary generation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error generating summaries:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        error: error.message
      });
      throw error.response?.data || { message: `Failed to generate summaries: ${error.message}` };
    }
  }
}; 