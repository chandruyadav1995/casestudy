import { Request, Response } from 'express';
import db from '../config/database';
import { PricingRecord, PricingSearchParams } from '../types';

export function searchPricing(req: Request, res: Response): void {
  const p: PricingSearchParams = req.query as unknown as PricingSearchParams;
  const page = Math.max(1, parseInt(String(p.page || '1'), 10));
  const limit = Math.min(200, Math.max(1, parseInt(String(p.limit || '50'), 10)));
  const offset = (page - 1) * limit;

  const allowedSort = ['store_id', 'sku', 'product_name', 'price', 'date', 'updated_at'];
  const sortBy = allowedSort.includes(String(p.sort_by)) ? p.sort_by : 'updated_at';
  const sortOrder = p.sort_order === 'asc' ? 'ASC' : 'DESC';

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (p.store_id) { conditions.push('store_id = ?'); params.push(p.store_id); }
  if (p.sku) { conditions.push('sku LIKE ?'); params.push(`%${p.sku}%`); }
  if (p.product_name) { conditions.push('product_name LIKE ?'); params.push(`%${p.product_name}%`); }
  if (p.price_min !== undefined) { conditions.push('price >= ?'); params.push(Number(p.price_min)); }
  if (p.price_max !== undefined) { conditions.push('price <= ?'); params.push(Number(p.price_max)); }
  if (p.date_from) { conditions.push('date >= ?'); params.push(p.date_from); }
  if (p.date_to) { conditions.push('date <= ?'); params.push(p.date_to); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = (db.prepare(`SELECT COUNT(*) as count FROM pricing_records ${where}`).get(...params) as { count: number }).count;
  const data = db.prepare(`
    SELECT * FROM pricing_records ${where}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as PricingRecord[];

  res.json({ data, total, page, limit, total_pages: Math.ceil(total / limit) });
}

export function getPricingById(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const record = db.prepare('SELECT * FROM pricing_records WHERE id = ?').get(id) as PricingRecord | undefined;
  if (!record) {
    res.status(404).json({ error: 'Record not found.' });
    return;
  }
  res.json(record);
}

export function updatePricing(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const existing = db.prepare('SELECT * FROM pricing_records WHERE id = ?').get(id) as PricingRecord | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Record not found.' });
    return;
  }

  const { store_id, sku, product_name, price, date } = req.body as Partial<PricingRecord>;

  // Validate
  if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
    res.status(400).json({ error: 'Price must be a non-negative number.' });
    return;
  }
  if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'Date must be in YYYY-MM-DD format.' });
    return;
  }

  const updated: Partial<PricingRecord> = {
    store_id: store_id ?? existing.store_id,
    sku: sku ?? existing.sku,
    product_name: product_name ?? existing.product_name,
    price: price !== undefined ? Number(price) : existing.price,
    date: date ?? existing.date,
  };

  // Audit log in same transaction
  const auditInsert = db.prepare(`
    INSERT INTO audit_logs (record_id, field_changed, old_value, new_value, changed_by)
    VALUES (?, ?, ?, ?, ?)
  `);

  const doUpdate = db.transaction(() => {
    const fields = ['store_id', 'sku', 'product_name', 'price', 'date'] as const;
    for (const field of fields) {
      const oldVal = String(existing[field]);
      const newVal = String(updated[field]);
      if (oldVal !== newVal) {
        auditInsert.run(id, field, oldVal, newVal, 'user');
      }
    }
    db.prepare(`
      UPDATE pricing_records
      SET store_id = ?, sku = ?, product_name = ?, price = ?, date = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(updated.store_id, updated.sku, updated.product_name, updated.price, updated.date, id);
  });

  doUpdate();

  const result = db.prepare('SELECT * FROM pricing_records WHERE id = ?').get(id) as PricingRecord;
  res.json(result);
}

export function getPricingStats(_req: Request, res: Response): void {
  const totalRecords = (db.prepare('SELECT COUNT(*) as c FROM pricing_records').get() as { c: number }).c;
  const totalStores = (db.prepare('SELECT COUNT(DISTINCT store_id) as c FROM pricing_records').get() as { c: number }).c;
  const totalBatches = (db.prepare('SELECT COUNT(*) as c FROM upload_batches').get() as { c: number }).c;
  const recentBatches = db.prepare(`
    SELECT id, original_filename, uploaded_at, record_count, success_count, error_count, status
    FROM upload_batches ORDER BY uploaded_at DESC LIMIT 5
  `).all();
  const avgPrice = (db.prepare('SELECT ROUND(AVG(price), 2) as avg FROM pricing_records').get() as { avg: number | null }).avg;

  res.json({ total_records: totalRecords, total_stores: totalStores, total_batches: totalBatches, avg_price: avgPrice, recent_batches: recentBatches });
}

export function getAuditLog(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const logs = db.prepare('SELECT * FROM audit_logs WHERE record_id = ? ORDER BY changed_at DESC').all(id);
  res.json(logs);
}
