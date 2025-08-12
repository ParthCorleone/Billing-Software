import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import billingRoutes from './routes/billingRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import billsRoutes from './routes/billsRoutes.js';

const app = express();
const PORT = 49253;

app.use(cors({
    origin: 'http://localhost:5173'
}));

app.use(express.json());

app.use('/api/services', billingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/bills', billsRoutes);

app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});

app.use((req, res) => {
    res.status(404).send("Sorry, can't find that route!");
});