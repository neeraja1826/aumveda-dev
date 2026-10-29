
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Users,
  Wallet,
  Warehouse,
  RotateCcw,
} from 'lucide-react';

export const ADMIN_PAGES = {
  DASHBOARD: 'Dashboard',
  PRODUCTS: 'Products',
  CATEGORIES: 'Categories',
  VENDORS: 'Vendors',
  CUSTOMERS: 'Customers',
  ORDERS: 'Orders',
  RETURNS: 'Returns',
  INVENTORY: 'Inventory',
  REVIEWS: 'Reviews',
  FINANCE: 'Finance',
  REPORTS: 'Reports',
  SETTINGS: 'Settings',
};

const links = [
  [ADMIN_PAGES.DASHBOARD, LayoutDashboard],
  [ADMIN_PAGES.PRODUCTS, Package],
  [ADMIN_PAGES.CATEGORIES, Boxes],
  [ADMIN_PAGES.VENDORS, Store],
  [ADMIN_PAGES.CUSTOMERS, Users],
  [ADMIN_PAGES.ORDERS, ShoppingBag],
  [ADMIN_PAGES.RETURNS, RotateCcw],
  [ADMIN_PAGES.INVENTORY, Warehouse],
  [ADMIN_PAGES.REVIEWS, Star],
  [ADMIN_PAGES.FINANCE, Wallet],
  [ADMIN_PAGES.REPORTS, BarChart3],
  [ADMIN_PAGES.SETTINGS, Settings],
];

export default function Sidebar({
  activePage,
  onNavigate,
  open,
  onClose,
}) {
  return (
    <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
      <div className="sidebar-doodle-watermark" aria-hidden="true">
        <svg width="260" height="260" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" opacity="0.04" strokeWidth="1">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
        </svg>
      </div>

      <button
        type="button"
        className="sidebar-brand"
        onClick={() => onNavigate(ADMIN_PAGES.DASHBOARD)}
        aria-label="Go to dashboard"
      >
        <span className="brand-mark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#123D2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
          </svg>
        </span>
        <span>
          <strong>AUMVEDA</strong>
          <small>AYURVEDIC CONSOLE</small>
        </span>
      </button>

      <div className="sidebar-caption">WORKSPACE</div>

      <nav className="sidebar-nav" aria-label="Admin navigation">
        {links.map(([label, Icon]) => (
          <button
            key={label}
            type="button"
            className={`sidebar-link${
              activePage === label ? ' active' : ''
            }`}
            aria-current={
              activePage === label ? 'page' : undefined
            }
            onClick={() => {
              onNavigate(label);
              onClose();
            }}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="status-indicator" />
        <div className="sidebar-footer-info">
          <strong>Aumveda Live Console</strong>
          <small>Holistic Ayurvedic System</small>
        </div>
      </div>
    </aside>
  );
}
