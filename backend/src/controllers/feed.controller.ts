import { Request, Response } from 'express';
import fs from 'fs';
import db from '../config/database';
import { parseCsvFile } from '../services/csv.service';
import { UploadBatch } from '../types';

export async function uploadFeed(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: 'No CSV file provided.' });
    return;
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;
  const storedName = req.file.filename;

  // Create batch record as "processing"
  const batchInsert = db.prepare(`
    INSERT INTO upload_batches (filename, original_filename, record_count, success_count, error_count, status)
    VALUES (?, ?, 0, 0, 0, 'processing')
  `);
  const { lastInsertRowid } = batchInsert.run(storedName, originalName);
  const batchId = Number(lastInsertRowid);

  try {
    const { valid, errors } = await parseCsvFile(filePath);
    const total = valid.length + errors.length;

    const insertRecord = db.prepare(`
      INSERT INTO pricing_records (store_id, sku, product_name, price, date, upload_batch_id)
      VALUES (@store_id, @sku, @product_name, @price, @date, @batchId)
      ON CONFLICT (store_id, sku, date) DO UPDATE SET
        product_name = excluded.product_name,
        price        = excluded.price,
        updated_at   = datetime('now'),
        upload_batch_id = excluded.upload_batch_id
    `);

    const insertMany = db.transaction((rows: typeof valid) => {
      let inserted = 0;
      for (const row of rows) {
        insertRecord.run({
          store_id: row.store_id,
          sku: row.sku,
          product_name: row.product_name,
          price: parseFloat(row.price),
          date: row.date,
          batchId,
        });
        inserted++;
      }
      return inserted;
    });

    const successCount = insertMany(valid);

    // Update batch to completed
    db.prepare(`
      UPDATE upload_batches
      SET record_count = ?, success_count = ?, error_count = ?, status = ?,
          errors = ?
      WHERE id = ?
    `).run(
      total,
      successCount,
      errors.length,
      errors.length === total && total > 0 ? 'failed' : 'completed',
      errors.length > 0 ? JSON.stringify(errors.slice(0, 100)) : null,
      batchId
    );

    res.status(201).json({
      batch_id: batchId,
      filename: originalName,
      total_rows: total,
      success_count: successCount,
      error_count: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (err) {
    db.prepare(`UPDATE upload_batches SET status = 'failed', errors = ? WHERE id = ?`)
      .run(String(err), batchId);
    fs.unlink(filePath, () => {});
    throw err;
  }
}

export function getFeeds(req: Request, res: Response): void {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
  const offset = (page - 1) * limit;

  const total = (db.prepare('SELECT COUNT(*) as count FROM upload_batches').get() as { count: number }).count;
  const batches = db.prepare(`
    SELECT * FROM upload_batches ORDER BY uploaded_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset) as UploadBatch[];

  res.json({
    data: batches.map(b => ({ ...b, errors: b.errors ? JSON.parse(b.errors) : [] })),
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  });
}

export function getFeedById(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const batch = db.prepare('SELECT * FROM upload_batches WHERE id = ?').get(id) as UploadBatch | undefined;
  if (!batch) {
    res.status(404).json({ error: 'Feed not found.' });
    return;
  }
  res.json({ ...batch, errors: batch.errors ? JSON.parse(batch.errors) : [] });
}

export function deleteFeed(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);
  const batch = db.prepare('SELECT * FROM upload_batches WHERE id = ?').get(id) as UploadBatch | undefined;
  if (!batch) {
    res.status(404).json({ error: 'Feed not found.' });
    return;
  }

  // Cascade handled by FK; also try to remove physical file
  db.prepare('DELETE FROM upload_batches WHERE id = ?').run(id);
  const filePath = `${process.env.UPLOAD_DIR || './uploads'}/${batch.filename}`;
  fs.unlink(filePath, () => {});

  res.json({ message: 'Feed and associated records deleted.' });
}
