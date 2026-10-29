
import { LogOut, Menu } from 'lucide-react';

export default function Header({
  title,
  tokenConnected,
  onMenuClick,
  onLogout,
}) {
  return (
    <header className="topbar">
      <button
        className="menu-button"
        aria-label="Open navigation"
        onClick={onMenuClick}
      >
        <Menu size={21} />
      </button>

      <div className="topbar-title">
        <span className="topbar-eyebrow">AUMVEDA ADMIN</span>
        <h1>{title}</h1>
      </div>

      <div className="topbar-actions">
        <span
          className={`connection-state${tokenConnected ? ' connected' : ''}`}
        >
          <i />
          {tokenConnected ? 'API connected' : 'API disconnected'}
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
