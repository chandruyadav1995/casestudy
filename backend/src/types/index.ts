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
  errors: string | null;
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

export interface PricingSearchParams {
  store_id?: string;
  sku?: string;
  product_name?: string;
  price_min?: number;
  price_max?: number;
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

export interface CsvRow {
  store_id: string;
  sku: string;
  product_name: string;
  price: string;
  date: string;
}

export interface CsvParseResult {
  valid: CsvRow[];
  errors: Array<{ row: number; message: string; data: Record<string, string> }>;
}
