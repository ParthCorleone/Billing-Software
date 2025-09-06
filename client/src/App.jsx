import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import BillingPage from './pages/BillingPage';
import InventoryPage from './pages/InventoryPage';
import BillsListPage from './pages/BillsListPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/bills" element={<BillsListPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;