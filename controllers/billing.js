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

export const getAllServices = async (req, res) => {
    try {
        const services = await all('SELECT * FROM services ORDER BY name');
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addService = async (req, res) => {
    const { name, category, cost, description } = req.body;
    if (!name || cost === undefined) {
        return res.status(400).json({ error: 'Service name and cost are required.' });
    }
    try {
        const sql = 'INSERT INTO services (name, category, cost, description) VALUES (?, ?, ?, ?)';
        const result = await run(sql, [name, category, cost, description]);
        res.status(201).json({ id: result.id, name, cost });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateService = async (req, res) => {
    const { id } = req.params;
    const { name, category, cost, description } = req.body;
    try {
        const sql = 'UPDATE services SET name = ?, category = ?, cost = ?, description = ? WHERE id = ?';
        const result = await run(sql, [name, category, cost, description, id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Service not found.' });
        }
        res.status(200).json({ message: 'Service updated successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteService = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await run('DELETE FROM services WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Service not found.' });
        }
        res.status(200).json({ message: 'Service deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};