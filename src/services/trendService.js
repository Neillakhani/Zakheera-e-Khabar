import axios from 'axios';

const API_URL = 'http://localhost:5000/trends';

export const analyzeTrends = async (words, viewType) => {
    try {
        const response = await axios.post(`${API_URL}/analyze`, {
            words,
            view_type: viewType
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getTopWords = async () => {
    try {
        const response = await axios.get(`${API_URL}/top-words`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getTopWordsByYear = async () => {
    try {
        const response = await axios.get(`${API_URL}/top-words-by-year`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getArticlesWithWord = async (word, year = null) => {
    try {
        // Use the trends endpoint for article matching
        const response = await axios.post(`${API_URL}/articles-with-word`, {
            word,
            year
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching articles with word:', error);
        throw error.response?.data || error.message;
    }
};

export const getFullArticle = async (filename) => {
    try {
        const response = await axios.get(`${API_URL}/article-content/${filename}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};