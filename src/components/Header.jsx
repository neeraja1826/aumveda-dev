
import { LogOut, Menu } from 'lucide-react';

export default function Header({
  title,
  tokenConnected,
  onMenuClick,
  onLogout,
}) {
  return (
    <header className="topbar">
      <div className="topbar-doodle-bg" aria-hidden="true">
        <svg width="220" height="76" viewBox="0 0 220 76" fill="none" opacity="0.08">
          <path d="M20 70C40 40 80 30 110 50C140 70 170 30 200 40" stroke="#123D2B" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M160 20C175 10 190 15 200 30C195 40 180 40 170 30Z" fill="#123D2B" />
          <path d="M90 20C100 12 112 16 118 28C112 36 100 35 94 28Z" fill="#123D2B" />
        </svg>
      </div>

      <button
        className="menu-button"
        aria-label="Open navigation"
        onClick={onMenuClick}
      >
        <Menu size={21} />
      </button>

      <div className="topbar-title">
        <div className="topbar-eyebrow-row">
          <span className="topbar-leaf-icon">✦</span>
          <span className="topbar-eyebrow">AUMVEDA AYURVEDIC ADMIN</span>
        </div>
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
