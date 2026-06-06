import { create } from 'zustand';
import api from '../utils/api.js';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('aquabill_user') || 'null'),
  token: localStorage.getItem('aquabill_token') || null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('aquabill_token', data.token);
      localStorage.setItem('aquabill_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
      return { success: true, role: data.user.role };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem('aquabill_token');
    localStorage.removeItem('aquabill_user');
    set({ user: null, token: null });
  }
}));

export default useAuthStore;
