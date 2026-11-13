import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  Package,
  Image,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Users,
  Wallet,
  Warehouse,
  RotateCcw,
  TicketPercent,
  Bell,
  Headset,
} from 'lucide-react';

import { useLocation, useNavigate } from 'react-router-dom';

export const ADMIN_PAGES = {
  DASHBOARD: 'Dashboard',
  PRODUCTS: 'Products',
  CATEGORIES: 'Categories',
  CONTENT_MANAGEMENT: 'Content Management',
  COUPONS: 'Coupons',
  VENDORS: 'Vendors',
  CUSTOMERS: 'Customers',
  ORDERS: 'Orders',
  RETURNS: 'Returns',
  INVENTORY: 'Inventory',
  REVIEWS: 'Reviews',
  FINANCE: 'Finance',
  REPORTS: 'Reports',
  SETTINGS: 'Settings',
  NOTIFICATIONS: 'Notifications',
  SUPPORT: 'Support',
};

const links = [
  [ADMIN_PAGES.DASHBOARD, LayoutDashboard, '/admin/dashboard'],
  [ADMIN_PAGES.PRODUCTS, Package, '/admin/products'],
  [ADMIN_PAGES.CATEGORIES, Boxes, '/admin/categories'],
  [ADMIN_PAGES.CONTENT_MANAGEMENT, Image, '/admin/content-management'],
  [ADMIN_PAGES.COUPONS, TicketPercent, '/admin/coupons'],
  [ADMIN_PAGES.VENDORS, Store, '/admin/vendors'],
  [ADMIN_PAGES.CUSTOMERS, Users, '/admin/customers'],
  [ADMIN_PAGES.ORDERS, ShoppingBag, '/admin/orders'],
  [ADMIN_PAGES.RETURNS, RotateCcw, '/admin/returns'],
  [ADMIN_PAGES.INVENTORY, Warehouse, '/admin/inventory'],
  [ADMIN_PAGES.REVIEWS, Star, '/admin/reviews'],
  [ADMIN_PAGES.FINANCE, Wallet, '/admin/finance'],
  [ADMIN_PAGES.REPORTS, BarChart3, '/admin/reports'],
  [ADMIN_PAGES.SETTINGS, Settings, '/admin/settings'],
  [ADMIN_PAGES.NOTIFICATIONS, Bell, '/admin/notifications'],
  [ADMIN_PAGES.SUPPORT, Headset, '/admin/support'],
];

export default function Sidebar({
  open = false,
  onClose = () => {},
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const getActivePage = () => {
    const currentPath = location.pathname;

    const matchedLink = links.find(([, , path]) => {
      if (path === '/admin/vendors') {
        return (
          currentPath === path ||
          currentPath.startsWith('/admin/vendors/')
        );
      }

      if (path === '/admin/orders') {
        return (
          currentPath === path ||
          currentPath.startsWith('/admin/orders/')
        );
      }

      return currentPath === path;
    });

    return matchedLink?.[0] ?? ADMIN_PAGES.DASHBOARD;
  };

  const activePage = getActivePage();

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
      <div className="sidebar-doodle-watermark" aria-hidden="true">
        <svg
          width="260"
          height="260"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          opacity="0.04"
          strokeWidth="1"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      </div>

      <button
        type="button"
        className="sidebar-brand"
        onClick={() => handleNavigate('/admin/dashboard')}
        aria-label="Go to dashboard"
      >
        <span className="brand-mark">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#123D2B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        </span>

        <span>
          <strong>AUMVEDA</strong>
          <small>AYURVEDIC CONSOLE</small>
        </span>
      </button>

      <div className="sidebar-caption">WORKSPACE</div>

      <nav className="sidebar-nav" aria-label="Admin navigation">
        {links.map(([label, Icon, path]) => (
          <button
            key={label}
            type="button"
            className={`sidebar-link${
              activePage === label ? ' active' : ''
            }`}
            aria-current={
              activePage === label ? 'page' : undefined
            }
            onClick={() => handleNavigate(path)}
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
