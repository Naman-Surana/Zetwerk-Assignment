import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api'),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- AUTH ---
export const login = async (data: any) => {
  const res = await api.post('/auth/login', data);
  return res.data;
};

export const register = async (data: any) => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

export const forgotPassword = async (data: { email: string }) => {
  const res = await api.post('/auth/forgot-password', data);
  return res.data;
};

export const resetPassword = async (data: { token: string, newPassword: string }) => {
  const res = await api.post('/auth/reset-password', data);
  return res.data;
};

// --- ACCOUNTS (CLIENT) ---
export const getMyAccount = async () => {
  const res = await api.get('/accounts/my-account');
  return res.data;
};

export const getMyTransactions = async (counterpartyId?: string) => {
  const url = counterpartyId ? `/accounts/my-account/transactions?counterpartyId=${counterpartyId}` : `/accounts/my-account/transactions`;
  const res = await api.get(url);
  return res.data;
};

export const transferMoney = async (data: { toAccountNumber: string, amount: number, description?: string }) => {
  const res = await api.post('/transfers', data);
  return res.data;
};

// --- ADMIN ---
export const adminGetUsers = async () => {
  const res = await api.get('/admin/users');
  return res.data;
};

export const adminGetUserAccount = async (userId: string) => {
  const res = await api.get(`/admin/users/${userId}/account`);
  return res.data;
};

export const adminGetUserTransactions = async (userId: string) => {
  const res = await api.get(`/admin/users/${userId}/transactions`);
  return res.data;
};
