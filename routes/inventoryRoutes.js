import express from 'express';
import { getAllProducts, addProduct, updateProduct, deleteProduct, getAllSuppliers, addSupplier, updateSupplier, deleteSupplier } from '../controllers/inventory.js';

const router = express.Router();
router.get('/products', getAllProducts);
router.post('/products', addProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/suppliers', getAllSuppliers);
router.post('/suppliers', addSupplier);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

export default router;