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
} from 'lucide-react';

const links = [
  ['Dashboard', LayoutDashboard],
  ['Products', Package],
  ['Categories', Boxes],
  ['Vendors', Store],
  ['Customers', Users],
  ['Orders', ShoppingBag],
  ['Inventory', Warehouse],
  ['Reviews', Star],
  ['Finance', Wallet],
  ['Reports', BarChart3],
  ['Settings', Settings],
];

export default function Sidebar({ activePage, onNavigate, open, onClose }) {
  return (
    <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
      <button className="sidebar-brand" onClick={() => onNavigate('Dashboard')}>
        <span className="brand-mark">A</span>
        <span>
          <strong>AUMVEDA</strong>
          <small>ADMIN CONSOLE</small>
        </span>
      </button>

      <div className="sidebar-caption">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Admin navigation">
        {links.map(([label, Icon]) => (
          <button
            key={label}
            className={`sidebar-link${activePage === label ? ' active' : ''}`}
            aria-current={activePage === label ? 'page' : undefined}
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
        <span>Admin workspace</span>
      </div>
    </aside>
  );
}
