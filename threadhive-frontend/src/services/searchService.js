import axiosInstance from '../api/axiosInstance.js';
import { SEARCH_API } from '../config/apiConfig.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const searchThreads = async (query) => {
  const res = await axiosInstance.get(SEARCH_API.SEARCH, {
    params: { q: query },
    headers: getAuthHeaders(),
  });
  return res.data.data;
};
