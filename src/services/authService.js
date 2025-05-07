import axios from './axiosConfig';

const API_URL = 'http://localhost:5000/auth';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await axios.post('/auth/login', {
        email,
        password
      });
      
      // Store the token
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Debug log
        console.log('Token stored:', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/signup`, userData);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error === 'Email already registered') {
        throw { message: 'This email is already registered. Please use a different email or sign in.' };
      }
      throw error.response?.data || { message: 'An error occurred during registration' };
    }
  },

  logout: () => {
    // Only clear local storage, no navigation
    localStorage.removeItem('user');
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/change-password`,
        { currentPassword, newPassword },
        { headers: this.authHeader() }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}; 