
import { useState } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './modules/Dashboard.jsx';
import Products from './modules/Products.jsx';
import Categories from './modules/Categories.jsx';
import Vendors from './modules/Vendors.jsx';
import Customers from './modules/Customers.jsx';
import Orders from './modules/Orders.jsx';
import Inventory from './modules/Inventory.jsx';
import Reviews from './modules/Reviews.jsx';
import Finance from './modules/Finance.jsx';
import Reports from './modules/Reports.jsx';
import Settings from './modules/Settings.jsx';
import Login from './modules/Login.jsx';
import { getAdminToken, setAdminToken } from './services/api.js';
import './index.css';

const pages = {
  Dashboard,
  Products,
  Categories,
  Vendors,
  Customers,
  Orders,
  Inventory,
  Reviews,
  Finance,
  Reports,
  Settings,
};

export default function App() {
  const [token, setToken] = useState(() => getAdminToken());
  const [activePage, setActivePage] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleLogin() {
    setToken(getAdminToken());
    setActivePage('Dashboard');
    setRefreshKey((current) => current + 1);
  }

  function handleLogout() {
  setAdminToken('');
  setToken('');
  setActivePage('Dashboard');
  setSidebarOpen(false);
}

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  const Page = pages[activePage] || Dashboard;

  return (
    <div className="admin-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          setSidebarOpen(false);
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <button
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
          onTokenChange={() => {
            setToken(getAdminToken());
            setRefreshKey((current) => current + 1);
          }}
          onLogout={handleLogout}
        />

        <main className="page-content" key={`${activePage}-${refreshKey}`}>
          <Page />
        </main>
      </div>
    </div>
  );
}
