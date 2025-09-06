import React, { useState, useEffect } from 'react';
import {useNavigate} from 'react-router-dom';
import apiClient from '../api';

const BillsListPage = () => {
  const [bills, setBills] = useState([]);
  const [searchBill, setSearchBill] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  // Fetch all bills
  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/bills', {
        params: searchBill ? { search: searchBill } : {},
      });
      setBills(response.data);
    } catch (err) {
      setError('Failed to fetch bills.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [searchBill]);

  // Display bill details
  const handleShowBill = async (billId) => {
    try {
      const response = await apiClient.get(`/bills/${billId}`);
      setSelectedBill(response.data);
    } catch (err) {
      alert('Failed to fetch bill details.');
    }
  };

  // Edit bill (open modal)
  const handleEditBill = async (bill) => {
    navigate('/billing', {state: {bill}});
  };


  // Save edited bill
const handleSaveEdit = async (editedBill) => {
  try {
    const payload = {
      customer: {
        name: editedBill.customer_name || "",
        phone: editedBill.customer_phone || "",
        email: editedBill.customer_email || "",
        address: editedBill.customer_address || ""
      },
      items: editedBill.items || [],
      gst_rate: editedBill.gst_percent || 0,
      initialPayment: {
        amount: editedBill.amount_paid || 0,
        type: 'Unknown'
      }
    };

    await apiClient.put(`/bills/${editedBill.id}`, payload);
    setIsEditModalOpen(false);
    setSelectedBill(null);
    fetchBills();
  } catch (err) {
    alert('Failed to update bill.');
  }
};



  // Print bill (simple window print)
  const handlePrintBill = () => {
    window.print();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Past Bills</h2>
      <input
        type="text"
        placeholder="Search by customer name"
        value={searchBill}
        onChange={e => setSearchBill(e.target.value)}
        className="mb-4 p-2 border rounded"
      />
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="min-w-full table-auto">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Customer</th>
              <th className="py-3 px-4 text-left">Phone</th>
              <th className="py-3 px-4 text-left">Total</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Paid</th>
              <th className="py-3 px-4 text-left">Pending</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
              <tr key={bill.id} className="border-t hover:bg-gray-50">
                <td className="py-4 px-4">{new Date(bill.bill_date).toLocaleDateString()}</td>
                <td className="py-4 px-4">{bill.customer_name}</td>
                <td className='py-4 px-4 text-black'>{bill.customer_phone}</td>
                <td className="py-4 px-4">₹{bill.total_amount.toFixed(2)}</td>
                <td className="py-4 px-4">{bill.status}</td>
                <td className="py-4 px-4">₹{bill.amount_paid.toFixed(2)}</td>
                <td className="py-4 px-4">₹{bill.pending_amount.toFixed(2)}</td>
                <td>
                  <button onClick={() => handleShowBill(bill.id)} className="mr-2 text-blue-600">View</button>
                  <button onClick={() => handleEditBill(bill)} className="mr-2 text-yellow-600">Edit</button>
                  <button onClick={handlePrintBill} className="text-green-600">Print</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Bill Details Modal */}
      {selectedBill && !isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h3 className="text-xl font-bold mb-2">Bill Details</h3>
            <p><strong>Date:</strong> {new Date(selectedBill.bill_date).toLocaleString()}</p>
            <p><strong>Customer:</strong> {selectedBill.customer_name}</p>
            <p><strong>Total:</strong> ₹{selectedBill.total_amount.toFixed(2)}</p>
            <p><strong>Status:</strong> {selectedBill.status}</p>
            <p><strong>Paid:</strong> ₹{selectedBill.amount_paid.toFixed(2)}</p>
            <p><strong>Pending:</strong> ₹{selectedBill.pending_amount.toFixed(2)}</p>
            <h4 className="mt-4 font-semibold">Items:</h4>
            <ul>
              {selectedBill.items && selectedBill.items.map((item, idx) => (
                <li key={idx}>
                  {item.name} x {item.quantity} @ ₹{item.price_at_sale} (Disc: {item.discount_percent}% GST: {item.gst_percent}%)
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setSelectedBill(null)} className="bg-gray-400 text-white px-4 py-2 rounded">Close</button>
              <button onClick={handlePrintBill} className="bg-green-500 text-white px-4 py-2 rounded">Print Bill</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bill Modal */}
      {selectedBill && isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Edit Bill</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Customer Name</label>
              <input
                type="text"
                value={selectedBill.customer_name}
                onChange={e => setSelectedBill({ ...selectedBill, customer_name: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Total Amount</label>
              <input
                type="number"
                value={selectedBill.total_amount?? ""}
                onChange={e => setSelectedBill({ ...selectedBill, total_amount: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Amount Paid</label>
              <input
                type="number"
                value={selectedBill.amount_paid?? ""}
                onChange={e => setSelectedBill({ ...selectedBill, amount_paid: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Pending Amount</label>
              <input
                type="number"
                value={selectedBill.pending_amount?? ""}
                onChange={e => setSelectedBill({ ...selectedBill, pending_amount: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={selectedBill.status}
                onChange={e => setSelectedBill({ ...selectedBill, status: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="paid">Paid</option>
                <option value="unpaid">UnPaid</option>
              </select>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setIsEditModalOpen(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
              <button onClick={() => handleSaveEdit(selectedBill)} className="bg-blue-500 text-white px-4 py-2 rounded">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsListPage;