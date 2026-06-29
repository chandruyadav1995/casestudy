import axios from 'axios';
import type { PaginatedResponse, PricingRecord, PricingSearchParams, UploadBatch, DashboardStats, AuditLog } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30_000,
});

api.interceptors.response.use(
  r => r,
  err => {
    const msg = err.response?.data?.error || err.message || 'Unexpected error';
    return Promise.reject(new Error(msg));
  }
);

export const feedsApi = {
  upload: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{
      batch_id: number;
      filename: string;
      total_rows: number;
      success_count: number;
      error_count: number;
      errors: Array<{ row: number; message: string }>;
    }>('/feeds', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: e => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },
  list: (page = 1, limit = 20) =>
    api.get<PaginatedResponse<UploadBatch>>('/feeds', { params: { page, limit } }),
  getById: (id: number) => api.get<UploadBatch>(`/feeds/${id}`),
  delete: (id: number) => api.delete<{ message: string }>(`/feeds/${id}`),
};

export const pricingApi = {
  search: (params: PricingSearchParams) =>
    api.get<PaginatedResponse<PricingRecord>>('/pricing', { params }),
  getById: (id: number) => api.get<PricingRecord>(`/pricing/${id}`),
  update: (id: number, data: Partial<Omit<PricingRecord, 'id' | 'created_at' | 'updated_at' | 'upload_batch_id'>>) =>
    api.put<PricingRecord>(`/pricing/${id}`, data),
  getStats: () => api.get<DashboardStats>('/pricing/stats'),
  getAuditLog: (id: number) => api.get<AuditLog[]>(`/pricing/${id}/audit`),
};
