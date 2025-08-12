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
        let sql = 'SELECT id, customer_name, bill_date, total_amount, status FROM bills';
        let params = [];

        if (search) {
            sql += ' WHERE customer_name LIKE ?';
            params.push(`%${search}%`);
        }

        sql += ' ORDER BY bill_date DESC';

        const bills = await all(sql, params);
        res.status(200).json(bills);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getBillById = async (req, res) => {
    try {
        const { id } = req.params;
        const bill = await get('SELECT * FROM bills WHERE id = ?', [id]);

        if (!bill) {
            return res.status(404).json({ error: 'Bill not found.' });
        }

        const itemsSql = `
            SELECT s.name, bi.quantity, bi.price_at_sale
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
    const { customer, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Bill must include at least one item.' });
    }

    try {
        await run('BEGIN TRANSACTION');

        const total_amount = items.reduce((sum, item) => sum + (item.price_at_sale * item.quantity), 0);
        const bill_date = new Date().toISOString();

        const billSql = `
            INSERT INTO bills (customer_name, customer_phone, customer_email, customer_address, bill_date, total_amount)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const billResult = await run(billSql, [
            customer?.name, 
            customer?.phone, 
            customer?.email, 
            customer?.address, 
            bill_date, 
            total_amount
        ]);
        
        const bill_id = billResult.id;

        const itemSql = 'INSERT INTO bill_items (bill_id, service_id, quantity, price_at_sale) VALUES (?, ?, ?, ?)';
        for (const item of items) {
            await run(itemSql, [bill_id, item.service_id, item.quantity, item.price_at_sale]);
        }

        await run('COMMIT');
        res.status(201).json({ message: 'Bill created successfully', bill_id: bill_id });

    } catch (error) {
        await run('ROLLBACK');
        res.status(500).json({ error: `Transaction Failed: ${error.message}` });
    }
};