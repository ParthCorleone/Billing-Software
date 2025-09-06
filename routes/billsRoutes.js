import express from 'express';
import { getAllBills, getBillById, createBill, editBill } from '../controllers/bills.js';

const router = express.Router();

router.get('/', getAllBills);
router.get('/:id', getBillById);
router.post('/', createBill);
router.put('/:id', editBill);

export default router;