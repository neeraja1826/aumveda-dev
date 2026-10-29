
import { useState } from 'react';

import Header from './components/Header.jsx';
import Sidebar, { ADMIN_PAGES } from './components/Sidebar.jsx';

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

import { getAdminToken, setAdminToken } from './services/api.js';
import './index.css';

const pages = {
  [ADMIN_PAGES.DASHBOARD]: Dashboard,
  [ADMIN_PAGES.PRODUCTS]: Products,
  [ADMIN_PAGES.CATEGORIES]: Categories,
  [ADMIN_PAGES.VENDORS]: Vendors,
  [ADMIN_PAGES.CUSTOMERS]: Customers,
  [ADMIN_PAGES.ORDERS]: Orders,
  [ADMIN_PAGES.RETURNS]: Returns,
  [ADMIN_PAGES.INVENTORY]: Inventory,
  [ADMIN_PAGES.REVIEWS]: Reviews,
  [ADMIN_PAGES.FINANCE]: Finance,
  [ADMIN_PAGES.REPORTS]: Reports,
  [ADMIN_PAGES.SETTINGS]: Settings,
};

export default function App() {
  const [token, setToken] = useState(() => getAdminToken());
  const [activePage, setActivePage] = useState(ADMIN_PAGES.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleLogin() {
    setToken(getAdminToken());
    setActivePage(ADMIN_PAGES.DASHBOARD);
    setRefreshKey((current) => current + 1);
  }

  function handleLogout() {
    setAdminToken('');
    setToken('');
    setActivePage(ADMIN_PAGES.DASHBOARD);
    setSidebarOpen(false);
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  const Page = pages[activePage] ?? Dashboard;

  return (
    <div className="admin-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
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
          title={activePage}
          tokenConnected={Boolean(token)}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main
          className="page-content"
          key={`${activePage}-${refreshKey}`}
        >
          <Page onNavigate={setActivePage} />
        </main>
      </div>
    </div>
  );
}
