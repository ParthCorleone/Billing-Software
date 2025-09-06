import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {

  const activeLinkStyle = {
    color: '#ffffff',
    backgroundColor: '#3b82f6',
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold">Billing App</h1>
      <div className="flex space-x-2">
        <NavLink 
          to="/" 
          style={({ isActive }) => isActive ? activeLinkStyle : undefined}
          className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
        >
          HOME
        </NavLink>
        <NavLink 
          to="/billing" 
          style={({ isActive }) => isActive ? activeLinkStyle : undefined}
          className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
        >
          BILLING
        </NavLink>
        <NavLink 
          to="/inventory" 
          style={({ isActive }) => isActive ? activeLinkStyle : undefined}
          className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
        >
          INVENTORY
        </NavLink>
        <NavLink 
          to="/bills" 
          style={({ isActive }) => isActive ? activeLinkStyle : undefined}
          className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
        >
          BILLS
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;