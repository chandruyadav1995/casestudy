import { useCallback, useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { feedsApi } from '../services/api';

interface UploadResult {
  batch_id: number;
  filename: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  errors: Array<{ row: number; message: string }>;
}

interface Props {
  onSuccess?: (result: UploadResult) => void;
}

export default function FileUpload({ onSuccess }: Props) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setFile(null); setProgress(0); setResult(null); setError(null); };

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      setError('Only CSV files are accepted.');
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      const { data } = await feedsApi.upload(file, setProgress);
      setResult(data);
      onSuccess?.(data);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {!result && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={clsx(
            'relative border-2 border-dashed rounded-xl p-10 text-center transition-all',
            dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'
          )}
        >
          <input
            type="file"
            accept=".csv,text/csv"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={onFileChange}
          />
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">
            Drag & drop a CSV file, or <span className="text-blue-600">browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Max 50MB · CSV only</p>
          <p className="text-xs text-gray-400 mt-2">
            Expected columns: <code className="bg-gray-100 px-1 rounded">store_id, sku, product_name, price, date</code>
          </p>
        </div>
      )}

      {/* Selected file */}
      {file && !result && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-800">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button onClick={reset} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Uploading & processing…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success result */}
      {result && (
        <div className="card p-5 border border-green-200 bg-green-50 space-y-3">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <CheckCircle className="w-5 h-5" />
            Upload Complete
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <p className="text-2xl font-bold text-gray-800">{result.total_rows}</p>
              <p className="text-xs text-gray-500">Total Rows</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-100">
              <p className="text-2xl font-bold text-green-600">{result.success_count}</p>
              <p className="text-xs text-gray-500">Imported</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-red-100">
              <p className="text-2xl font-bold text-red-500">{result.error_count}</p>
              <p className="text-xs text-gray-500">Errors</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-red-600 font-medium">View validation errors ({result.errors.length})</summary>
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-red-500">Row {e.row}: {e.message}</li>
                ))}
              </ul>
            </details>
          )}
          <button onClick={reset} className="btn-secondary w-full justify-center">
            Upload Another File
          </button>
        </div>
      )}

      {/* Upload button */}
      {file && !result && !uploading && (
        <button onClick={upload} className="btn-primary w-full justify-center">
          <Upload className="w-4 h-4" />
          Upload & Process CSV
        </button>
      )}

      {uploading && (
        <button disabled className="btn-primary w-full justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing…
        </button>
      )}
    </div>
  );
}
