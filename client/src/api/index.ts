import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

export const getAccounts = async () => {
  const res = await api.get('/accounts');
  return res.data;
};

export const getAccount = async (id: string) => {
  const res = await api.get(`/accounts/${id}`);
  return res.data;
};

export const getTransactions = async (id: string) => {
  const res = await api.get(`/accounts/${id}/transactions`);
  return res.data;
};

export const createAccount = async (data: { holderName: string, email: string, initialBalance: number }) => {
  const res = await api.post('/accounts', data);
  return res.data;
};

export const transferMoney = async (data: { fromAccountId: string, toAccountId: string, amount: number, description?: string }) => {
  const res = await api.post('/transfers', data);
  return res.data;
};
