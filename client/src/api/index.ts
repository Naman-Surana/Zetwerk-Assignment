import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api'),
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      window.dispatchEvent(new CustomEvent('api-network-error', { detail: { type: 'timeout' } }));
    } else if (error.message === 'Network Error' || !error.response) {
      window.dispatchEvent(new CustomEvent('api-network-error', { detail: { type: 'network_error' } }));
    }
    return Promise.reject(error);
  }
);

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

export const loginWithMfa = async (data: { tempToken: string, code: string }) => {
  const res = await api.post('/auth/login/mfa', data);
  return res.data;
};

export const setupMfa = async () => {
  const res = await api.get('/auth/mfa/setup');
  return res.data;
};

export const verifyMfaSetup = async (data: { code: string }) => {
  const res = await api.post('/auth/mfa/verify', data);
  return res.data;
};

// --- ACCOUNTS (CLIENT) ---
export const getMyAccount = async () => {
  const res = await api.get('/accounts/my-account');
  return res.data;
};

export const getMyTransactions = async (counterpartyId?: string, page: number = 1, limit: number = 10) => {
  const url = counterpartyId 
    ? `/accounts/my-account/transactions?counterpartyId=${counterpartyId}&page=${page}&limit=${limit}` 
    : `/accounts/my-account/transactions?page=${page}&limit=${limit}`;
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

export const adminGetUserTransactions = async (userId: string, page: number = 1, limit: number = 10) => {
  const res = await api.get(`/admin/users/${userId}/transactions?page=${page}&limit=${limit}`);
  return res.data;
};
