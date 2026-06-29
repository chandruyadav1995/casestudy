import { parse } from 'csv-parse';
import fs from 'fs';
import Joi from 'joi';
import { CsvRow, CsvParseResult } from '../types';

const rowSchema = Joi.object({
  store_id: Joi.string().trim().max(50).required(),
  sku: Joi.string().trim().max(100).required(),
  product_name: Joi.string().trim().max(255).required(),
  price: Joi.number().positive().precision(2).required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
});

// Normalize header names to lowercase snake_case
function normalizeHeaders(headers: string[]): string[] {
  return headers.map(h =>
    h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  );
}

export async function parseCsvFile(filePath: string): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    const valid: CsvRow[] = [];
    const errors: CsvParseResult['errors'] = [];
    let rowIndex = 0;

    const parser = parse({
      columns: (headers: string[]) => normalizeHeaders(headers),
      skip_empty_lines: true,
      trim: true,
      cast: false,
    });

    parser.on('readable', () => {
      let record: Record<string, string>;
      while ((record = parser.read()) !== null) {
        rowIndex++;
        const coerced = { ...record, price: parseFloat(record.price) };
        const { error } = rowSchema.validate(coerced, { abortEarly: false });
        if (error) {
          errors.push({
            row: rowIndex,
            message: error.details.map(d => d.message).join('; '),
            data: record,
          });
        } else {
          valid.push({
            store_id: record.store_id.trim(),
            sku: record.sku.trim(),
            product_name: record.product_name.trim(),
            price: record.price.trim(),
            date: record.date.trim(),
          });
        }
      }
    });

    parser.on('error', (err) => reject(err));
    parser.on('end', () => resolve({ valid, errors }));

    fs.createReadStream(filePath).pipe(parser);
  });
}
