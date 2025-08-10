import React, { useState, useEffect } from 'react';
import ProductForm from './components/ProductForm';
import BillSummary from './components/BillSummary';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">🧾 Billing Software</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProductForm
          products={products}
          setProducts={setProducts}
          cart={cart}
          setCart={setCart}
        />
        <BillSummary
          cart={cart}
          setCart={setCart}
        />
      </div>
    </div>
  );
}
