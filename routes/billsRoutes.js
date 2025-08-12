import express from 'express';
import { getAllBills, getBillById, createBill } from '../controllers/bills.js';

const router = express.Router();

router.get('/', getAllBills);
router.get('/:id', getBillById);
router.post('/', createBill);

export default router;