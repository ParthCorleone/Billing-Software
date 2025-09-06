import React from 'react';
import { Link } from 'react-router-dom';

const DashboardCard = ({ to, title, description, emoji }) => (
  <Link 
    to={to} 
    className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-transform duration-300"
  >
    <div className="text-4xl mb-4">{emoji}</div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </Link>
);

const HomePage = () => {
  return (
    <div className="p-6 md:p-10">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-600">Welcome! Select an option below to get started.</p>
      </header>
      
      {/* Grid container for the navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <DashboardCard 
          to="/billing"
          emoji="🧾"
          title="Create New Bill"
          description="Go to the billing section to create a new invoice for a customer."
        />
        
        <DashboardCard 
          to="/inventory"
          emoji="📦"
          title="Manage Inventory"
          description="View, add, or update your physical products and supplier information."
        />
        
        <DashboardCard 
          to="/bills"
          emoji="📂"
          title="View All Bills"
          description="Search, view, and print all previously created bills and invoices."
        />

      </div>
    </div>
  );
};

export default HomePage;