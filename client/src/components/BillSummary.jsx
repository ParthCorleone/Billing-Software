  import React, { useState } from 'react';
  import axios from 'axios';

  export default function BillSummary({ cart, setCart }) {
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    const removeFromCart = (indexToRemove) => {
      setCart(cart.filter((_, index) => index !== indexToRemove));
    };

    const saveBill = async () => {
      if (cart.length === 0) return alert("Cart is empty!");
      await axios.post('http://localhost:5000/bills', {
        customerName,
        phone,
        email,
        items: cart,
        total,
      });
      alert('✅ Bill Saved');
      setCart([]);
      setCustomerName('');
      setPhone('');
      setEmail('');
    };

    const handlePrint = () => {
      window.print();
    };

    return (
      <div className="bg-white p-4 shadow rounded print:w-full print:p-0 print:shadow-none">
        <h2 className="text-xl font-semibold mb-4">🧾 Bill Summary</h2>
        <div className='flex flex-col gap-2'>
          <input
              type="text"
              placeholder="Customer name"
              className="w-full border p-2 rounded"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Phone Number"
            className="w-full border p-2 rounded"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input 
            type="text"
            placeholder="Email"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <br />
        <table className="w-full text-left border mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">#</th>
              <th className="p-2">Product</th>
              <th className="p-2">Price</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2">{idx + 1}</td>
                <td className="p-2">{item.name}</td>
                <td className="p-2">₹{item.price}</td>
                <td className="p-2">
                  <button
                    onClick={() => removeFromCart(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ❌ Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-lg font-bold mb-4">Total: ₹{total.toFixed(2)}</p>

        <div className="flex gap-3 print:hidden">
          <button onClick={saveBill} className="bg-blue-600 text-white px-4 py-2 rounded">
            Save Bill
          </button>
          <button onClick={handlePrint} className="bg-gray-700 text-white px-4 py-2 rounded">
            Print
          </button>
        </div>
      </div>
    );
  }

