import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'), (err) => {
  if (err) {
    console.error('DB connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) console.error("Could not enable foreign keys:", err.message);
    });
  }
});

db.serialize(() => {
  console.log('Setting up database schema for Service Industry...');

  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT,
      cost REAL NOT NULL,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      supplier_id INTEGER,
      FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      customer_address TEXT,
      bill_date TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'UNPAID' -- e.g., UNPAID, PAID
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      discount_percent REAL DEFAULT 0,
      gst_percent REAL DEFAULT 0,
      price_at_sale REAL NOT NULL, -- The price charged for the service on this bill
      FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services (id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      amount_paid REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_type TEXT NOT NULL, -- e.g., 'Cash', 'UPI', 'Card'
      FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE
    )
  `);

  console.log('Database schema setup complete.');
});