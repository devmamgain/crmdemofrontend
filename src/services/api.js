import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000,
});

// Normalise every failure to Error(message) so UI code can just toast err.message.
http.interceptors.response.use(
  (r) => r,
  (err) => {
    const message =
      err.response?.data?.message ||
      (err.code === 'ERR_NETWORK' ? 'Cannot reach the API server. Is it running?' : err.message);
    return Promise.reject(Object.assign(new Error(message), { status: err.response?.status }));
  }
);

const body = (p) => p.then((r) => r.data);
const data = (p) => p.then((r) => r.data.data);

export const getHealth = () => body(http.get('/health'));
export const getDashboard = () => body(http.get('/dashboard'));

export const getLeads = (params) => body(http.get('/leads', { params }));
export const createLead = (payload) => data(http.post('/leads', payload));
export const updateLead = (id, payload) => data(http.patch(`/leads/${id}`, payload));
export const deleteLead = (id) => body(http.delete(`/leads/${id}`));

export const getDeals = (params) => body(http.get('/deals', { params }));
export const createDeal = (payload) => data(http.post('/deals', payload));
export const updateDeal = (id, payload) => data(http.patch(`/deals/${id}`, payload));
export const deleteDeal = (id) => body(http.delete(`/deals/${id}`));

export const getSalespeople = () => data(http.get('/salespeople'));
export const getSalespersonReport = (salespersonId) =>
  body(http.get('/reports/overview', { params: salespersonId ? { salespersonId } : {} }));

export const analyzeFMV = (file) => {
  const form = new FormData();
  form.append('file', file);
  return body(http.post('/fmv/analyze', form, { headers: { 'Content-Type': 'multipart/form-data' } }));
};
export const getFMVHistory = () => data(http.get('/fmv/history'));
export const getFMVAnalysis = (id) => body(http.get(`/fmv/history/${id}`));
export const getMarketData = () => data(http.get('/fmv/market-data'));
export const addMarketData = (payload) => data(http.post('/fmv/market-data', payload));
export const sampleFileUrl = (name) => `${http.defaults.baseURL}/fmv/sample/${name}`;

export const generateAILeads = (payload) => body(http.post('/ai/leads/generate', payload));
