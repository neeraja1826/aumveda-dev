import { LogOut, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/coupons': 'Coupons',
  '/admin/vendors': 'Vendors',
  '/admin/customers': 'Customers',
  '/admin/orders': 'Orders',
  '/admin/returns': 'Returns',
  '/admin/inventory': 'Inventory',
  '/admin/reviews': 'Reviews',
  '/admin/finance': 'Finance',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Settings',
  '/admin/notifications': 'Notifications',
  '/admin/support': 'Support',
};

export default function Header({
  tokenConnected,
  onMenuClick,
  onLogout,
}) {
  const location = useLocation();

  const getPageTitle = () => {
    const pathname = location.pathname;

    if (pathname.startsWith('/admin/vendors/')) {
      return 'Vendor Details';
    }

    if (pathname.startsWith('/admin/orders/')) {
      return 'Order Details';
    }

    return PAGE_TITLES[pathname] || 'Dashboard';
  };

  const title = getPageTitle();

  return (
    <header className="topbar">
      <div className="topbar-doodle-bg" aria-hidden="true">
        <svg
          width="220"
          height="76"
          viewBox="0 0 220 76"
          fill="none"
          opacity="0.08"
        >
          <path
            d="M20 70C40 40 80 30 110 50C140 70 170 30 200 40"
            stroke="#123D2B"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          <path
            d="M160 20C175 10 190 15 200 30C195 40 180 40 170 30Z"
            fill="#123D2B"
          />

          <path
            d="M90 20C100 12 112 16 118 28C112 36 100 35 94 28Z"
            fill="#123D2B"
          />
        </svg>
      </div>

      <button
        className="menu-button"
        aria-label="Open navigation"
        onClick={onMenuClick}
        type="button"
      >
        <Menu size={21} />
      </button>

      <div className="topbar-title">
        <div className="topbar-eyebrow-row">
          <span className="topbar-leaf-icon">✦</span>
          <span className="topbar-eyebrow">
            AUMVEDA AYURVEDIC ADMIN
          </span>
        </div>

        <h1>{title}</h1>
      </div>

      <div className="topbar-actions">
        <span
          className={`connection-state${
            tokenConnected ? ' connected' : ''
          }`}
        >
          <i />

          {tokenConnected
            ? 'API connected'
            : 'API disconnected'}
        </span>

        <button
          className="token-button"
          type="button"
          onClick={onLogout}
          title="Sign out of the admin dashboard"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}