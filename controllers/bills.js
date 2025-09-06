import { db } from '../db.js';

const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
    });
});
const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

export const getAllBills = async (req, res) => {
  try {
    const { search } = req.query;

    let sql = `
      SELECT 
        b.id, 
        b.customer_name, 
        b.customer_phone,
        b.bill_date, 
        b.total_amount, 
        b.status,
        IFNULL(SUM(p.amount_paid), 0) AS amount_paid,
        b.total_amount - IFNULL(SUM(p.amount_paid), 0) AS pending_amount
      FROM bills b
      LEFT JOIN payments p ON b.id = p.bill_id
    `;
    let params = [];
    if (search) {
      sql += ' WHERE b.customer_name LIKE ?';
      params.push(`%${search}%`);
    }
    sql += ' GROUP BY b.id ORDER BY b.bill_date DESC';
    const bills = await all(sql, params);
    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const billSql = `
      SELECT 
        b.*, 
        IFNULL(SUM(p.amount_paid), 0) AS amount_paid,
        b.total_amount - IFNULL(SUM(p.amount_paid), 0) AS pending_amount
      FROM bills b
      LEFT JOIN payments p ON b.id = p.bill_id
      WHERE b.id = ?
      GROUP BY b.id
    `;
    const bill = await get(billSql, [id]);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found.' });
    }
    const itemsSql = `
      SELECT s.name, bi.quantity, bi.price_at_sale, bi.discount_percent, bi.gst_percent
      FROM bill_items bi
      JOIN services s ON bi.service_id = s.id
      WHERE bi.bill_id = ?
    `;
    const items = await all(itemsSql, [id]);
    res.status(200).json({ ...bill, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createBill = async (req, res) => {
    const { customer, items, gst_rate, initialPayment } = req.body;
    const GST_RATE = typeof gst_rate === 'number' ? gst_rate : 0;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Bill must include at least one item.' });
    }
    let subTotal = 0;
    let totalDiscount = 0;
    items.forEach(item => {
        const itemTotal = (parseFloat(item.price_at_sale) || 0) * (parseFloat(item.quantity) || 0);
        const itemDiscount = itemTotal * ((parseFloat(item.discount_percent) || 0) / 100);
        subTotal += itemTotal;
        totalDiscount += itemDiscount;
    });
    const totalAfterDiscount = subTotal - totalDiscount;
    const gstAmount = GST_RATE > 0 ? totalAfterDiscount * (GST_RATE / 100) : 0;
    const total_amount = totalAfterDiscount + gstAmount;
    const status = parseFloat(initialPayment.amount) >=total_amount ? 'PAID' : 'UNPAID';

    try {
        await run('BEGIN TRANSACTION');

        const bill_date = new Date().toISOString();
        const billSql = `
            INSERT INTO bills (customer_name, customer_phone, customer_email, customer_address, bill_date, total_amount, status)
            VALUES (?, ?, ?, ?, ?, ?,?)
        `;
        const billResult = await run(billSql, [
            customer?.name || null,
            customer?.phone || null,
            customer?.email || null,
            customer?.address || null,
            bill_date,
            total_amount,
            status
        ]);

        const bill_id = billResult.id;

        // 2. Insert all the bill items
        const itemSql = `
            INSERT INTO bill_items (bill_id, service_id, quantity, price_at_sale, discount_percent, gst_percent) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        for (const item of items) {
            await run(itemSql, [
                bill_id, item.service_id, item.quantity, item.price_at_sale,
                item.discount_percent || 0, GST_RATE
            ]);
        }

        if (initialPayment && parseFloat(initialPayment.amount) > 0) {
            const paymentSql = `
                INSERT INTO payments (bill_id, amount_paid, payment_date, payment_type)
                VALUES (?, ?, ?, ?)
            `;
            await run(paymentSql, [
                bill_id,
                parseFloat(initialPayment.amount),
                bill_date,
                initialPayment.type || 'Unknown'
            ]);
        }

        await run('COMMIT');
        res.status(201).json({ message: 'Bill created successfully', bill_id });

    } catch (error) {
        await run('ROLLBACK');
        res.status(500).json({ error: `Transaction Failed: ${error.message}` });
    }
};

export const editBill = async (req, res) => {
    const { id } = req.params;
    const { customer, items, gst_rate, initialPayment } = req.body;
    const GST_RATE = typeof gst_rate === 'number' ? gst_rate : 0;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Bill must include at least one item.' });
    }

    let subTotal = 0;
    let totalDiscount = 0;
    items.forEach(item => {
        const itemTotal = (parseFloat(item.price_at_sale) || 0) * (parseFloat(item.quantity) || 0);
        const itemDiscount = itemTotal * ((parseFloat(item.discount_percent) || 0) / 100);
        subTotal += itemTotal;
        totalDiscount += itemDiscount;
    });
    const totalAfterDiscount = subTotal - totalDiscount;
    const gstAmount = GST_RATE > 0 ? totalAfterDiscount * (GST_RATE / 100) : 0;
    const total_amount = totalAfterDiscount + gstAmount;
    const status = parseFloat(initialPayment?.amount) >= total_amount ? 'PAID' : 'UNPAID';

    try {
        await run('BEGIN TRANSACTION');

        // 1. Update bill details
        const billSql = `
            UPDATE bills
            SET customer_name = ?, customer_phone = ?, customer_email = ?, customer_address = ?, bill_date = ?, total_amount = ?, status = ?
            WHERE id = ?
        `;
        const bill_date = new Date().toISOString();
        await run(billSql, [
            customer?.name || null,
            customer?.phone || null,
            customer?.email || null,
            customer?.address || null,
            bill_date,
            total_amount,
            status,
            id
        ]);

        // 2. Delete existing bill items
        await run('DELETE FROM bill_items WHERE bill_id = ?', [id]);

        // 3. Insert new bill items
        const itemSql = `
            INSERT INTO bill_items (bill_id, service_id, quantity, price_at_sale, discount_percent, gst_percent) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        for (const item of items) {
            await run(itemSql, [
                id, item.service_id, item.quantity, item.price_at_sale,
                item.discount_percent || 0, GST_RATE
            ]);
        }

        // 4. Optionally update payments (here: delete and re-insert initial payment)
        if (initialPayment && parseFloat(initialPayment.amount) > 0) {
            await run('DELETE FROM payments WHERE bill_id = ?', [id]);
            const paymentSql = `
                INSERT INTO payments (bill_id, amount_paid, payment_date, payment_type)
                VALUES (?, ?, ?, ?)
            `;
            await run(paymentSql, [
                id,
                parseFloat(initialPayment.amount),
                bill_date,
                initialPayment.type || 'Unknown'
            ]);
        }

        await run('COMMIT');
        res.status(200).json({ message: 'Bill updated successfully', bill_id: id });

    } catch (error) {
        await run('ROLLBACK');
        res.status(500).json({ error: `Transaction Failed: ${error.message}` });
    }
};