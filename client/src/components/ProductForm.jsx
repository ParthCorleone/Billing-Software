import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ProductForm({ products, setProducts, cart, setCart }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  let [discountPercent, setDiscountPercent] = useState('');
  let [discountValue, setDiscountValue] = useState('');
  const [GST, setGST] = useState('');
  const [editId, setEditId] = useState(null);
  const fetchProducts = async () => {
    const res = await axios.get('http://localhost:5000/products');
    setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) return;
    if (editId) {
      await axios.put(`http://localhost:5000/products/${editId}`,{
        name,
        price: parseFloat(price),
        discountpercent: parseFloat(discountPercent),
        discountvalue: parseFloat(discountValue),
        GST: parseFloat(GST)
      });
    } else {
      await axios.post('http://localhost:5000/products', {
        name,
        price: parseFloat(price),
        discountpercent: parseFloat(discountPercent),
        discountvalue: parseFloat(discountValue),
        GST: parseFloat(GST)
      });
    }
    setName('');
    setPrice('');
    setDiscountPercent('');
    setDiscountValue('');
    setGST('');
    setEditId(null);
    await fetchProducts();
  };

  const handleDelete = async (prodId) => {
    if (!prodId) return;
    await axios.delete(`http://localhost:5000/products/${prodId}`);
    await fetchProducts();
    setEditId(null);
    await fetchProducts();
  };

  const addToCart = (product) => {
    setCart([...cart, product]);
  };

  return (
    <div className="bg-white p-4 shadow rounded">
      <h2 className="text-xl font-semibold mb-4">➕ Add Product</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Discount Percentage"
          value={discountPercent}
          onChange={(e) => {
            const percentage = e.target.value;
            setDiscountPercent(percentage);
            if (price && percentage) {
              setDiscountValue(((parseFloat(price) * parseFloat(percentage)) / 100 ).toFixed(2));
            } else {
              setDiscountValue('');
            }
          }}
          className=" border p-2 rounded"
        />
        <input
          type="number"
          placeholder="Disount Value"
          value={discountValue}
          onChange={(e) => {
            const val = e.target.value;
            setDiscountValue(val);
            if (price && val) {
              setDiscountPercent(((parseFloat(val) * 100) / parseFloat(price)).toFixed(2));
            } else {
              setDiscountPercent('');
            }
          }}
          className="border p-2 rounded"
        />
        <input
          type="number"
          placeholder="GST"
          value={GST}
          onChange={(e) => setGST(e.target.value)}
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {editId ? "Update Product" : "Add Product"}
        </button>
      </form>

      <h3 className="mt-6 mb-2 font-bold">📦 Products</h3>
      <ul className="space-y-2">
        {products.map((prod) => (
          <li key={prod.id} className="flex justify-between items-center border p-2 rounded">
            <div>{prod.name} - ₹{prod.price} - ₹{prod.newPrice}</div>
            <button
              onClick={() => {
                setName(prod.name);
                setPrice(prod.price);
                setDiscountPercent(prod.discountpercent);
                setDiscountValue(prod.discountvalue);
                setGST(prod.GST);
                setEditId(prod.id); // 🧠 set the ID we're editing
              }}
              className="text-sm bg-yellow-500 text-white px-3 py-1 rounded">
              ✏️ Edit
            </button>
            <button
              onClick={() => addToCart(prod)}
              className="text-sm bg-green-500 text-white px-3 py-1 rounded"
            >
              Add to Bill
            </button>
            <button
              onClick={() => handleDelete(prod.id)}
              className="text-sm bg-red-500 text-white px-3 py-1 rounded"
            >
              🗑️Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
