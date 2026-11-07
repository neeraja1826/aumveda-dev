import { useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';

import Dashboard from './modules/Dashboard.jsx';
import Products from './modules/Products.jsx';
import Categories from './modules/Categories.jsx';
import Vendors from './modules/Vendors.jsx';
import Customers from './modules/Customers.jsx';
import Orders from './modules/Orders.jsx';
import Returns from './modules/Returns.jsx';
import Inventory from './modules/Inventory.jsx';
import Reviews from './modules/Reviews.jsx';
import Finance from './modules/Finance.jsx';
import Reports from './modules/Reports.jsx';
import Settings from './modules/Settings.jsx';
import Login from './modules/Login.jsx';
import Coupons from './modules/Coupons.jsx';
import Notifications from './modules/Notifications.jsx';
import Support from './modules/Support.jsx';

import { getAdminToken, setAdminToken } from './services/api.js';

import './index.css';

function AdminLayout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const token = getAdminToken();

  return (
    <div className="admin-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="admin-main">
        <Header
          tokenConnected={Boolean(token)}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
        />

        <main className="page-content">
          <Routes>
            <Route
              path="/admin/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/admin/products"
              element={<Products />}
            />

            <Route
              path="/admin/categories"
              element={<Categories />}
            />

            <Route
              path="/admin/coupons"
              element={<Coupons />}
            />

            <Route
              path="/admin/vendors"
              element={<Vendors />}
            />

            <Route
              path="/admin/vendors/:vendorId"
              element={<Vendors />}
            />

            <Route
              path="/admin/customers"
              element={<Customers />}
            />

            <Route
              path="/admin/orders"
              element={<Orders />}
            />

            <Route
              path="/admin/orders/:orderId"
              element={<Orders />}
            />

            <Route
              path="/admin/returns"
              element={<Returns />}
            />

            <Route
              path="/admin/inventory"
              element={<Inventory />}
            />

            <Route
              path="/admin/reviews"
              element={<Reviews />}
            />

            <Route
              path="/admin/finance"
              element={<Finance />}
            />

            <Route
              path="/admin/reports"
              element={<Reports />}
            />

            <Route
              path="/admin/notifications"
              element={<Notifications />}
            />

            <Route
              path="/admin/support"
              element={<Support />}
            />

            <Route
              path="/admin/settings"
              element={<Settings />}
            />

            <Route
              path="/admin"
              element={
                <Navigate
                  to="/admin/dashboard"
                  replace
                />
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/admin/dashboard"
                  replace
                />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const token = getAdminToken();

  const handleLogin = () => {
    window.location.href = '/admin/dashboard';
  };

  const handleLogout = () => {
    setAdminToken('');
    window.location.href = '/';
  };

  if (!token) {
    return (
      <BrowserRouter>
        <Login onLogin={handleLogin} />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <AdminLayout onLogout={handleLogout} />
    </BrowserRouter>
  );
}