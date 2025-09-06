import React, { useState, useEffect, useMemo } from "react";
import {useLocation} from 'react-router-dom';
import apiClient from "../api";

const BillingPage = () => {
  // --- STATE MANAGEMENT ---
  const [services, setServices] = useState([]);
  const [searchService, setSearchService] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCost, setNewServiceCost] = useState("");
  const [initialPayment, setInitialPayment] = useState({
    amount: '',
    type: 'Cash', // Default type
    notes: ''
  });
  const [gstRate, setGstRate] = useState(0); // default 0%
  const location = useLocation();

  // --- API & DATA FUNCTIONS ---
  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/services");
      setServices(response.data);
    } catch (err) {
      setError("Failed to fetch services.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    if (location.state?.bill) {
      const bill = location.state.bill;
      console.log("Editing data",bill);
      setCustomer({
        name: bill.customer_name || "",
        phone: bill.customer_phone || "",
        email: bill.customer_email || ""
      });
      setBillItems(
      Array.isArray(bill.items) ? bill.items.map(item => ({
        key: Date.now() + Math.random(),
        service_id: item.service_id,
        name: item.name,
        quantity: item.quantity,
        price_at_sale: item.price_at_sale,
        discount_percent: item.discount_percent,
        discount_value: (item.price_at_sale * item.quantity * item.discount_percent) / 100
      })) : []
    );
    setGstRate(bill.gst_percent || 0);
    setInitialPayment({
      amount: bill.amount_paid?.toString() || '',
      type: 'Cash',
      notes: ''
    });
    }
  }, []);

  // --- EVENT HANDLERS ---
  const handleAddToBill = (service) => {
    const newItem = {
      key: Date.now() + Math.random(), // unique key
      service_id: service.id,
      name: service.name,
      quantity: 1,
      price_at_sale: service.cost,
      discount_percent: 0,
    };
    setBillItems([...billItems, newItem]);
  };

  const handleRemoveFromBill = (itemKey) => {
    setBillItems(billItems.filter((item) => item.key !== itemKey));
  };

  const handleItemChange = (itemKey, field, value) => {
    setBillItems((prevItems) =>
      prevItems.map((item) => {
        if (item.key !== itemKey) return item;

        let updatedItem = { ...item };

        if (field === "discount_percent") {
          updatedItem.discount_percent = parseFloat(value) || 0;
          updatedItem.discount_value =
            (updatedItem.price_at_sale *
              updatedItem.quantity *
              updatedItem.discount_percent) /
            100;
        } else if (field === "discount_value") {
          updatedItem.discount_value = parseFloat(value) || 0;
          updatedItem.discount_percent =
            (updatedItem.discount_value /
              (updatedItem.price_at_sale * updatedItem.quantity)) *
            100;
        } else if (field === "quantity") {
          updatedItem.quantity = parseFloat(value) || 1;
          // Recalculate discount value if percent exists
          if (updatedItem.discount_percent) {
            updatedItem.discount_value =
              (updatedItem.price_at_sale *
                updatedItem.quantity *
                updatedItem.discount_percent) /
              100;
          }
        } else {
          updatedItem[field] = parseFloat(value) || 0;
        }

        return updatedItem;
      })
    );
  };

const handleCreateBill = async () => {
  if (billItems.length === 0) {
    alert("Cannot create an empty bill. Please add services first.");
    return;
  }

  const billPayload = {
    customer,
    gst_rate: gstRate,
    items: billItems,
    initialPayment: parseFloat(initialPayment.amount) > 0 ? initialPayment : null
  };

  try {
    await apiClient.post("/bills", billPayload);
    alert("Bill created successfully!");
    setBillItems([]);
    setCustomer({ name: "", phone: "", email: "" });
    setInitialPayment({ amount: '', type: 'Cash', notes: '' });
  } catch (err) {
    console.error("Axios error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    alert("Failed to create bill.");
  }
};

  const handleEditClick = (service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/services/${editingService.id}`, editingService);
      setIsModalOpen(false);
      setEditingService(null);
      fetchServices();
    } catch (err) {
      alert("Failed to update service.");
      console.error(err);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await apiClient.delete(`/services/${serviceId}`);
        fetchServices();
      } catch (err) {
        alert("Failed to delete service.");
      }
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newServiceName || !newServiceCost) return;
    try {
      await apiClient.post("/services", {
        name: newServiceName,
        cost: parseFloat(newServiceCost),
      });
      setNewServiceName("");
      setNewServiceCost("");
      fetchServices();
    } catch (err) {
      alert("Failed to add service.");
    }
  };

  // --- CALCULATIONS using useMemo for efficiency ---
  const billTotals = useMemo(() => {
    let subTotal = 0;
    let totalDiscount = 0;

    billItems.forEach((item) => {
      const itemTotal = item.price_at_sale * item.quantity;
      subTotal += itemTotal;
      totalDiscount += item.discount_value || 0;
    });

    const totalAfterDiscount = subTotal - totalDiscount;
    const gstAmount = gstRate > 0 ? totalAfterDiscount * (gstRate / 100) : 0;
    const grandTotal = totalAfterDiscount + gstAmount;

    return { subTotal, totalDiscount, gstAmount, grandTotal };
  }, [billItems, gstRate]);

  const filterServices = services.filter(service => 
    service.name.toLowerCase().includes(searchService.toLowerCase())
  );
  
  // --- JSX RENDER ---
  return (
    <div className="p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ===== LEFT/MAIN SECTION: CREATE BILL ===== */}
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Create a New Bill</h2>

        {/* Customer Details */}
        <div className="mb-6 border-b pb-6">
          <h3 className="text-lg font-semibold mb-3">
            Customer Details (Optional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={customer.name}
              onChange={(e) =>
                setCustomer({ ...customer, name: e.target.value })
              }
              className="p-2 border rounded-md"
            />
            <input
              type="text"
              placeholder="Phone"
              value={customer.phone}
              onChange={(e) =>
                setCustomer({ ...customer, phone: e.target.value })
              }
              className="p-2 border rounded-md"
            />
            <input
              type="email"
              placeholder="Email"
              value={customer.email}
              onChange={(e) =>
                setCustomer({ ...customer, email: e.target.value })
              }
              className="p-2 border rounded-md"
            />
          </div>
        </div>

        {/* Bill Items */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Bill Items</h3>
          <div className="space-y-3">
            {billItems.length === 0 ? (
              <p className="text-gray-500">
                Select a service from the right to begin.
              </p>
            ) : (
              billItems.map((item) => (
                <div
                  key={item.key}
                  className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-md"
                >
                  <span className="col-span-4 font-semibold">{item.name}</span>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(item.key, "quantity", e.target.value)
                      }
                      className="w-full p-1 border rounded-md"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Disc %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.discount_percent}
                      onChange={(e) =>
                        handleItemChange(
                          item.key,
                          "discount_percent",
                          e.target.value
                        )
                      }
                      className="w-full p-1 border rounded-md"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500">Disc ₹</label>
                    <input
                      type="number"
                      min={0}
                      value={item.discount_value}
                      onChange={(e) =>
                        handleItemChange(
                          item.key,
                          "discount_value",
                          e.target.value
                        )
                      }
                      className="w-full p-1 border rounded-md"
                    />
                  </div>

                  <span className="col-span-3 text-right">
                    ₹
                    {(
                      item.price_at_sale *
                      item.quantity *
                      (1 - item.discount_percent / 100)
                    ).toFixed(2)}
                  </span>
                  <div className="col-span-1 text-right">
                    <button
                      onClick={() => handleRemoveFromBill(item.key)}
                      className="text-red-500 hover:text-red-700 font-bold text-xl"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>GST % (optional)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={gstRate}
                      onChange={(e) =>
                        setGstRate(parseFloat(e.target.value) || 0)
                      }
                      className="w-20 text-right p-1 border rounded-md"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
  <h4 className="text-lg font-semibold mb-4 border-b pb-2">
    Initial Payment
  </h4>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Amount */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Amount
      </label>
      <input
        type="number"
        value={initialPayment.amount}
        onChange={(e) =>
          setInitialPayment({ ...initialPayment, amount: e.target.value })
        }
        className="w-full border rounded-md p-2 focus:ring focus:ring-blue-300 focus:border-blue-500"
        placeholder="Enter amount"
      />
    </div>

    {/* Type */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Type
      </label>
      <select
        value={initialPayment.type}
        onChange={(e) =>
          setInitialPayment({ ...initialPayment, type: e.target.value })
        }
        className="w-full border rounded-md p-2 bg-white focus:ring focus:ring-blue-300 focus:border-blue-500"
      >
        <option value="Cash">Cash</option>
        <option value="UPI">UPI</option>
        <option value="Card">Card</option>
      </select>
    </div>
  </div>

  {/* Notes */}
  <div className="mt-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Notes
    </label>
    <input
      type="text"
      value={initialPayment.notes}
      onChange={(e) =>
        setInitialPayment({ ...initialPayment, notes: e.target.value })
      }
      className="w-full border rounded-md p-2 focus:ring focus:ring-blue-300 focus:border-blue-500"
      placeholder="Optional notes..."
    />
  </div>
</div>

        {/* Totals Section */}
        <div className="mt-6 border-t pt-4">
          <div className="space-y-2 text-right text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{billTotals.subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Discount</span>
              <span>- ₹{billTotals.totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST ({gstRate}%)</span>
              <span>+ ₹{billTotals.gstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-2xl text-black mt-2 pt-2 border-t">
              <span>Grand Total</span>
              <span>₹{billTotals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Save Bill Button */}
        <div className="mt-6 text-right">
          <button
            onClick={handleCreateBill}
            className="bg-green-500 text-white font-bold py-2 px-6 rounded-md hover:bg-green-600"
          >
            Save Bill
          </button>
        </div>
      </div>

      {/* ===== RIGHT/SIDEBAR SECTION: MANAGE SERVICES ===== */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Services</h2>
        {/* Add Service Form */}
        <form onSubmit={handleAddService} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="New Service Name"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            className="flex-grow p-2 border rounded-md"
            required
          />
          <input
            type="number"
            placeholder="Cost"
            value={newServiceCost}
            onChange={(e) => setNewServiceCost(e.target.value)}
            className="w-24 p-2 border rounded-md"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-3 rounded-md hover:bg-blue-600"
          >
            +
          </button>
        </form>
        <input type="text" value={searchService} onChange={(e) => setSearchService(e.target.value)} placeholder="search" 
        className="w-full border rounded-md p-2 focus:ring focus:ring-blue-300 focus:border-blue-500"/>
        {/* Services List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {filterServices.map((service) => (
            <div
              key={service.id}
              className="flex justify-between items-center p-2 rounded hover:bg-gray-100"
            >
              <div>
                <p className="font-semibold">{service.name}</p>
                <p className="text-sm text-gray-600">
                  ₹{service.cost.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToBill(service)}
                  className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded hover:bg-green-300"
                >
                  Add to Bill
                </button>
                <button
                  onClick={() => handleEditClick(service)}
                  className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteService(service.id)}
                  className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded hover:bg-red-300"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== EDIT SERVICE MODAL ===== */}
      {isModalOpen && editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Edit Service</h2>
            <form onSubmit={handleUpdateService}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Service Name
                </label>
                <input
                  type="text"
                  value={editingService.name}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      name: e.target.value,
                    })
                  }
                  className="p-2 border rounded-md w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Cost
                </label>
                <input
                  type="number"
                  value={editingService.cost}
                  onChange={(e) =>
                    setEditingService({
                      ...editingService,
                      cost: parseFloat(e.target.value),
                    })
                  }
                  className="p-2 border rounded-md w-full"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingPage;
