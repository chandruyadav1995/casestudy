export interface PricingRecord {
  id: number;
  store_id: string;
  sku: string;
  product_name: string;
  price: number;
  date: string;
  created_at: string;
  updated_at: string;
  upload_batch_id: number | null;
}

export interface UploadBatch {
  id: number;
  filename: string;
  original_filename: string;
  uploaded_at: string;
  record_count: number;
  success_count: number;
  error_count: number;
  status: 'processing' | 'completed' | 'failed';
  errors: Array<{ row: number; message: string; data: Record<string, string> }>;
}

export interface PricingSearchParams {
  store_id?: string;
  sku?: string;
  product_name?: string;
  price_min?: string;
  price_max?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: 'store_id' | 'sku' | 'product_name' | 'price' | 'date' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface DashboardStats {
  total_records: number;
  total_stores: number;
  total_batches: number;
  avg_price: number | null;
  recent_batches: Pick<UploadBatch, 'id' | 'original_filename' | 'uploaded_at' | 'record_count' | 'success_count' | 'error_count' | 'status'>[];
}

export interface AuditLog {
  id: number;
  record_id: number;
  field_changed: string;
  old_value: string;
  new_value: string;
  changed_at: string;
  changed_by: string;
}
