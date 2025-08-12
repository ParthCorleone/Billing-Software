import express from 'express';

import { getAllServices, addService, updateService, deleteService } from '../controllers/billing.js';

const router = express.Router();
router.get('/', getAllServices);
router.post('/', addService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);

export default router;