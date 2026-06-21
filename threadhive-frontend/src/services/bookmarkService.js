import axiosInstance from '../api/axiosInstance.js';
import { BOOKMARK_API } from '../config/apiConfig.js';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const saveThread = async (threadId) => {
  const res = await axiosInstance.post(BOOKMARK_API.SAVE(threadId), null, {
    headers: getAuthHeaders(),
  });
  return res.data.data.savedThreads;
};

export const unsaveThread = async (threadId) => {
  const res = await axiosInstance.delete(BOOKMARK_API.UNSAVE(threadId), {
    headers: getAuthHeaders(),
  });
  return res.data.data.savedThreads;
};

export const fetchSavedThreads = async () => {
  const res = await axiosInstance.get(BOOKMARK_API.GET_ALL, {
    headers: getAuthHeaders(),
  });
  return res.data.data;
};
