import { Bell, Home, LogOut, Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ADMIN_NOTIFICATIONS_UPDATED_EVENT,
  getAdminNotifications,
  getAdminUnreadCount,
} from '../services/adminService.js';

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
  '/admin/content-management': 'Content Management',
};

function playNotificationSound(audioContext) {
  if (!audioContext || audioContext.state !== 'running') return false;

  const startTime = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(784, startTime);
  oscillator.frequency.setValueAtTime(988, startTime + 0.12);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.08, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.3);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.31);
  return true;
}

export default function Header({ onMenuClick, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(null);
  const [notificationCountError, setNotificationCountError] = useState('');
  const audioContextRef = useRef(null);
  const audioReadyRef = useRef(false);
  const pendingNotificationSoundRef = useRef(false);
  const latestNotificationIdRef = useRef(null);
  const hasCheckedNotificationsRef = useRef(false);
  const checkingNotificationsRef = useRef(false);

  useEffect(() => {
    let active = true;

    function removeUnlockListeners() {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    }

    function unlockAudio() {
      if (audioReadyRef.current) return;

      const AudioContextConstructor =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextConstructor) {
        console.warn('Notification sound is not supported by this browser.');
        removeUnlockListeners();
        return;
      }

      try {
        const audioContext =
          audioContextRef.current || new AudioContextConstructor();
        audioContextRef.current = audioContext;

        audioContext.resume().then(() => {
          if (!active || audioContext.state !== 'running') return;

          audioReadyRef.current = true;
          removeUnlockListeners();

          if (pendingNotificationSoundRef.current) {
            pendingNotificationSoundRef.current =
              !playNotificationSound(audioContext);
          }
        }).catch((error) => {
          console.warn('Unable to enable notification sound:', error);
        });
      } catch (error) {
        console.warn('Unable to enable notification sound:', error);
      }
    }

    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      active = false;
      removeUnlockListeners();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch((error) => {
          console.warn('Unable to close notification audio:', error);
        });
        audioContextRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshUnreadCount() {
      try {
        const result = await getAdminUnreadCount();
        const count = Number(result?.unread_count);

        if (!Number.isFinite(count) || count < 0) {
          throw new Error('The unread notification count is invalid.');
        }

        if (active) {
          setUnreadCount(count);
          setNotificationCountError('');
        }
      } catch (error) {
        if (active) {
          setNotificationCountError(
            error.message || 'Unable to load notification count.'
          );
        }
      }
    }

    async function checkForNewNotifications() {
      if (checkingNotificationsRef.current) return;
      checkingNotificationsRef.current = true;

      try {
        const result = await getAdminNotifications({
          limit: 1,
          offset: 0,
        });
        const items = Array.isArray(result)
          ? result
          : result?.items || [];
        const latestId = items[0]?.id
          ? String(items[0].id)
          : null;

        if (!active) return;

        if (
          hasCheckedNotificationsRef.current &&
          latestId &&
          latestId !== latestNotificationIdRef.current
        ) {
          pendingNotificationSoundRef.current =
            !playNotificationSound(audioContextRef.current);
        }

        latestNotificationIdRef.current = latestId;
        hasCheckedNotificationsRef.current = true;
      } catch (error) {
        console.warn('Unable to check for new notifications:', error);
      } finally {
        checkingNotificationsRef.current = false;
      }
    }

    function refreshNotifications() {
      refreshUnreadCount();
      checkForNewNotifications();
    }

    refreshNotifications();
    const intervalId = window.setInterval(refreshNotifications, 15000);
    window.addEventListener(
      ADMIN_NOTIFICATIONS_UPDATED_EVENT,
      refreshUnreadCount
    );

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener(
        ADMIN_NOTIFICATIONS_UPDATED_EVENT,
        refreshUnreadCount
      );
    };
  }, [location.pathname]);

  const notificationLabel = notificationCountError
    ? 'View notifications, unread count unavailable'
    : `View notifications${
        unreadCount ? `, ${unreadCount} unread` : ''
      }`;

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
            stroke="var(--brand-primary)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          <path
            d="M160 20C175 10 190 15 200 30C195 40 180 40 170 30Z"
            fill="var(--brand-primary)"
          />

          <path
            d="M90 20C100 12 112 16 118 28C112 36 100 35 94 28Z"
            fill="var(--brand-primary)"
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
          <Home size={13} className="topbar-home-icon" />
          <span className="topbar-eyebrow-divider">›</span>
          <span className="topbar-eyebrow">
            AUMVEDA AYURVEDIC ADMIN
          </span>
        </div>

        <h1>{title}</h1>
      </div>

      <div className="topbar-actions">
        <button
          className="topbar-bell-button"
          type="button"
          onClick={() => navigate('/admin/notifications')}
          aria-label={notificationLabel}
          title={
            notificationCountError
              ? notificationCountError
              : unreadCount === null
                ? 'Notifications'
                : `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
          }
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="topbar-bell-count">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

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