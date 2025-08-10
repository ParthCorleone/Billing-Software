const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 5000;

// Setup DB
const db = new sqlite3.Database('./db.sqlite', (err) => {
  if (err) console.error('DB connection error:', err);
  else console.log('Connected to SQLite DB');
});

// Create tables if not exist
db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      discountpercent REAL NOT NULL,
      discountvalue REAL NOT NULL,
      newPrice REAL NOT NULL,
      GST REAL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerName TEXT DEFAULT NULL,
      phone TEXT DEFAULT NULL,
      email TEXT DEFAULT NULL,
      paid REAL NOT NULL,
      pending REAL NOT NULL,
      date TEXT NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS brought (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productName TEXT NOT NULL,
      productPrice REAL NOT NULL,
      quantity REAL NOT NULL,
      totalPrice REAL NOT NULL,
      discountPercent REAL DEFAULT 0,
      discountValue REAL DEFAULT 0,
      GST REAL DEFAULT 18,
      newPrice REAL NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partyName TEXT DEFAULT NULL,
      companyNumber TEXT DEFAULT NULL,
      salesNumber TEXT DEFAULT NULL,
      paid REAL NOT NULL,
      pending REAL NOT NULL,
      date TEXT NOT NULL,
      total REAL NOT NULL
    )  
  `);
});

app.use(cors());
app.use(bodyParser.json());

// Routes

// Add product
app.post('/products', (req, res) => {
  let { name, price, discountpercent, discountvalue, GST } = req.body;

  if(!name || price == null) {
    return res.status(400).send("Name and Price Needed");
  }

  if (discountpercent != null && (discountvalue == null || discountvalue === '')) {
    discountvalue = (price * discountpercent) / 100;
  }

  else if (discountvalue != null && (discountpercent == null || discountpercent === '')) {
    discountpercent = (discountvalue / price) * 100;
  }

  else if ((discountpercent == null || discountpercent === '') && 
           (discountvalue == null || discountvalue === '')) {
    discountpercent = 0;
    discountvalue = 0;
  }

  discountvalue = parseFloat(discountvalue.toFixed(2));
  discountpercent = parseFloat(discountpercent.toFixed(2));
  GST = GST || 0;
  const newPrice = price - discountvalue + ((price - discountvalue) * GST)/100;


  db.run(`INSERT INTO products (name, price, discountpercent, discountvalue, GST, newPrice) VALUES (?, ?, ?, ?, ?, ?)`, 
    [name, price, discountpercent, discountvalue, GST, newPrice], 
    function (err) {
    if (err) return res.status(500).send(err.message);
    res.send({ id: this.lastID });
  });
});

// Get all products
app.get('/products', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Edit product
app.put('/products/:id', (req, res) => {
  let { name, price, discountpercent, discountvalue, GST } = req.body;

  if (!name || price == null) {
    return res.status(400).send("Name and price are required");
  }

  if (discountpercent != null && (discountvalue == null || discountvalue === '')) {
    discountvalue = (price * discountpercent) / 100;
  } else if (discountvalue != null && (discountpercent == null || discountpercent === '')) {
    discountpercent = (discountvalue / price) * 100;
  } else if ((discountpercent == null || discountpercent === '') && 
             (discountvalue == null || discountvalue === '')) {
    discountpercent = 0;
    discountvalue = 0;
  }

  discountpercent = parseFloat(discountpercent.toFixed(2));
  discountvalue = parseFloat(discountvalue.toFixed(2));
  GST = GST || 0;
  const newPrice = price - discountvalue + ((price - discountvalue) * GST)/100;

  db.run(
    `UPDATE products 
     SET name = ?, price = ?, discountpercent = ?, discountvalue = ?, GST = ?, newPrice = ?
     WHERE id = ?`,
    [name, price, discountpercent, discountvalue, GST, newPrice, req.params.id],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.send({ updated: this.changes });
    }
  );
});


// Delete product
app.delete('/products/:id', (req,res) => {
  db.run(`DELETE FROM products WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).send(err.message);
    res.send({ deleted: this.changes });
  });
});

// Save bill
app.post('/bills', (req, res) => {
  const { customerName, phone, items, total } = req.body;
  const date = new Date().toISOString();
  db.run(
    `INSERT INTO bills (customerName, phone, email, date, items, total) VALUES (?, ?, ?, ?, ?)`,
    [customerName, phone, date, JSON.stringify(items), total],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.send({ id: this.lastID });
    }
  );
});

// Get bills (DESC order)
app.get('/bills', (req, res) => {
  db.all(`SELECT * FROM bills ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.send(rows);
  });
});

//add brought
app.post('/buy', (req, res) => {

  let { productName, productPrice, quantity, discountPercent, discountValue, GST } = req.body;

  if (!productName || productPrice == null || quantity == null) {
    return res.status(400).send("Product Name, Price, and Quantity are required");
  }

  if (discountPercent != null && (discountValue == null || discountValue === '')) {
    discountValue = (productPrice * discountPercent) / 100;
  } else if (discountValue != null && (discountPercent == null || discountPercent === '')) {
    discountPercent = (discountValue * 100) / productPrice;
  } else if ((discountPercent == null || discountPercent === '') &&
             (discountValue == null || discountValue === '')) {
    discountPercent = 0;
    discountValue = 0;
  }

  const totalItemPriceBeforeDiscount = productPrice;
  const totalItemDiscountValue = parseFloat(discountValue).toFixed(2);
  const priceAfterDiscount = totalItemPriceBeforeDiscount - totalItemDiscountValue;
  const newPricePerItem = (priceAfterDiscount + (priceAfterDiscount * (GST || 0) / 100)).toFixed(2);
  const totalBillPrice = (newPricePerItem * quantity).toFixed(2);

  db.run(
    `INSERT INTO brought (productName, productPrice, quantity, totalPrice, discountPercent, discountValue, GST, newPrice) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [productName, productPrice, quantity, totalBillPrice, parseFloat(discountPercent.toFixed(2)), parseFloat(totalItemDiscountValue), GST || 0, newPricePerItem],
    function (err) {
      if (err) return res.status(500).send(err.message);
      res.send({ id: this.lastID, newPricePerItem: newPricePerItem, totalBillPrice: totalBillPrice });
    }
  );
});









app.listen(PORT, () => console.log(`Backend running at http://localhost:${PORT}`));
