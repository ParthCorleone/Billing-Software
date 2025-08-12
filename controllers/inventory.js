import { db } from '../db.js';

const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
    });
});
const all = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

export const getAllProducts = async (req, res) => {
    try {
        const sql = `
            SELECT p.id, p.name, p.category, p.stock_quantity, s.name as supplier_name
            FROM products p
            LEFT JOIN suppliers s ON p.supplier_id = s.id
            ORDER BY p.name
        `;
        const products = await all(sql);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addProduct = async (req, res) => {
    const { name, category, stock_quantity, supplier_id } = req.body;
    if (!name) return res.status(400).json({ error: 'Product name is required.' });

    try {
        const sql = 'INSERT INTO products (name, category, stock_quantity, supplier_id) VALUES (?, ?, ?, ?)';
        const result = await run(sql, [name, category, stock_quantity || 0, supplier_id]);
        res.status(201).json({ id: result.id, name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProduct = async(req,res) => {
    const {id} = req.params;
    const {name, category, stock_quantity, supplier_id} = req.body;
    try {
        const sql = 'UPDATE products SET name = ?, category = ?, stock_quantity = ? , supplier_id = ? WHERE id = ?';
        const result = await run(sql,[name, category, stock_quantity, supplier_id, id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.status(200).json({ message: 'Product updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message});
    }
};

export const deleteProduct = async (req,res) => {
    const {id} = req.params;
    try {
        const result = await run('DELETE FROM products WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.status(200).json({ message: 'Product deleted successfully.' });
    }  catch (error) {
        res.status(500).json({ error: error.message});
    }
}

export const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await all('SELECT * FROM suppliers ORDER BY name');
        res.status(200).json(suppliers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addSupplier = async (req, res) => {
    const { name, phone, email } = req.body;
    if (!name) return res.status(400).json({ error: 'Supplier name is required.' });

    try {
        const sql = 'INSERT INTO suppliers (name, phone, email) VALUES (?, ?, ?)';
        const result = await run(sql, [name, phone, email]);
        res.status(201).json({ id: result.id, name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSupplier = async (req,res) => {
    const {id} = req.params;
    const {name, phone, email} = req.body;
    try {
        const sql = 'UPDATE suppliers SET name = ?, phone = ?, email = ? WHERE id = ?';
        const result = await run(sql,[name, phone, email, id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Supplier not found.' });
        }
        res.status(200).json({ message: 'Supplier updated successfully.' });
    }  catch (error) {
        res.status(500).json({ error: error.message});
    }
}

export const deleteSupplier = async (req,res) => {
    const {id} = req.params;
    try {
        const result = await run('DELETE FROM suppliers WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Supplier not found.' });
        }
        res.status(200).json({ message: 'Supplier deleted successfully.' });
    }  catch (error) {
        res.status(500).json({ error: error.message});
    }
}
