/**
 * Seed script: generates realistic sample pricing data for 20 stores, 50 SKUs.
 * Run: npx ts-node src/scripts/seed.ts
 */
import db from '../config/database';

const STORE_IDS = Array.from({ length: 20 }, (_, i) => `STORE-${String(i + 1).padStart(4, '0')}`);
const SKUS = [
  { sku: 'MILK-2L', name: 'Full Cream Milk 2L' },
  { sku: 'BREAD-WW', name: 'Wholemeal Bread 700g' },
  { sku: 'EGG-12', name: 'Free Range Eggs 12pk' },
  { sku: 'BUTTER-500', name: 'Unsalted Butter 500g' },
  { sku: 'CHKN-BRST', name: 'Chicken Breast 1kg' },
  { sku: 'RICE-5KG', name: 'Basmati Rice 5kg' },
  { sku: 'PASTA-500', name: 'Spaghetti 500g' },
  { sku: 'TOMATO-CAN', name: 'Crushed Tomatoes 400g' },
  { sku: 'OLIVE-OIL', name: 'Extra Virgin Olive Oil 500ml' },
  { sku: 'APPLE-KG', name: 'Red Apples per kg' },
  { sku: 'BANANA-KG', name: 'Bananas per kg' },
  { sku: 'ORANGE-KG', name: 'Navel Oranges per kg' },
  { sku: 'YOGURT-1KG', name: 'Greek Yogurt 1kg' },
  { sku: 'CHEDDAR-400', name: 'Cheddar Cheese 400g' },
  { sku: 'JUICE-OJ', name: 'Orange Juice 2L' },
  { sku: 'COFFEE-200', name: 'Ground Coffee 200g' },
  { sku: 'TEA-50', name: 'Black Tea 50 bags' },
  { sku: 'SOAP-BAR', name: 'Bath Soap 4pk' },
  { sku: 'TOOTHPASTE', name: 'Toothpaste 110g' },
  { sku: 'SHAMPOO-400', name: 'Shampoo 400ml' },
].concat(
  Array.from({ length: 30 }, (_, i) => ({ sku: `SKU-${String(i + 100).padStart(5, '0')}`, name: `Product ${i + 100}` }))
);

const BASE_PRICES: Record<string, number> = {
  'MILK-2L': 3.5, 'BREAD-WW': 4.2, 'EGG-12': 6.8, 'BUTTER-500': 5.5, 'CHKN-BRST': 12.0,
  'RICE-5KG': 9.9, 'PASTA-500': 2.1, 'TOMATO-CAN': 1.8, 'OLIVE-OIL': 8.5, 'APPLE-KG': 3.9,
  'BANANA-KG': 2.2, 'ORANGE-KG': 3.3, 'YOGURT-1KG': 5.0, 'CHEDDAR-400': 7.5, 'JUICE-OJ': 4.8,
  'COFFEE-200': 11.0, 'TEA-50': 4.5, 'SOAP-BAR': 5.5, 'TOOTHPASTE': 3.2, 'SHAMPOO-400': 7.8,
};

function randomPrice(base: number): number {
  const variance = (Math.random() - 0.5) * 0.2 * base;
  return Math.round((base + variance) * 100) / 100;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

const insertBatch = db.prepare(`
  INSERT OR IGNORE INTO upload_batches (filename, original_filename, record_count, success_count, error_count, status)
  VALUES ('seed.csv', 'seed-data.csv', ?, ?, 0, 'completed')
`);

const insertRecord = db.prepare(`
  INSERT OR REPLACE INTO pricing_records (store_id, sku, product_name, price, date, upload_batch_id)
  VALUES (@store_id, @sku, @product_name, @price, @date, @batchId)
`);

const seed = db.transaction(() => {
  const recordCount = STORE_IDS.length * SKUS.length;
  const { lastInsertRowid } = insertBatch.run(recordCount, recordCount);
  const batchId = Number(lastInsertRowid);

  const today = new Date();
  let inserted = 0;

  for (const storeId of STORE_IDS) {
    for (const { sku, name } of SKUS) {
      const base = BASE_PRICES[sku] ?? (5 + Math.random() * 45);
      // Insert 3 days of pricing history
      for (let d = 2; d >= 0; d--) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        insertRecord.run({
          store_id: storeId,
          sku,
          product_name: name,
          price: randomPrice(base),
          date: formatDate(date),
          batchId,
        });
        inserted++;
      }
    }
  }
  console.log(`✅ Seeded ${inserted} pricing records across ${STORE_IDS.length} stores and ${SKUS.length} SKUs.`);
});

seed();
