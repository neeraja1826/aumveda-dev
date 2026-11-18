import "./Navbar.css";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import {
  Bell,
  ChevronDown,
  CircleCheck,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  ShoppingBag,
  Truck,
  Store,
  UserRound,
  Warehouse,
  RotateCcw,
  IndianRupee,
  Wallet,
  UsersRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import notificationApi, {
  NOTIFICATION_CHANGE_EVENT,
} from "../../services/notificationApi";

// ============================================================
// CONFIGURATION
// ============================================================

const NOTIFICATION_REFRESH_INTERVAL = 5000;

const SOUND_PREFERENCE_KEY =
  "aumveda_vendor_notification_sound";

// ============================================================
// PAGE INFORMATION
// ============================================================

const pageDetails = [
  {
    path: "/dashboard",
    title: "Dashboard",
    subtitle: "Your business at a glance",
  },
  {
    path: "/products",
    title: "Products",
    subtitle: "Manage your product catalogue",
  },
  {
    path: "/inventory",
    title: "Inventory",
    subtitle: "Manage availability and stock",
  },
  {
    path: "/orders",
    title: "Orders",
    subtitle: "Track and fulfil customer orders",
  },
  {
    path: "/shipping",
    title: "Shipping",
    subtitle: "Prepare shipments and track deliveries",
  },
  {
    path: "/returns",
    title: "Returns & Exchanges",
    subtitle: "Manage customer returns and exchanges",
  },
  {
    path: "/earnings",
    title: "Earnings",
    subtitle: "Review your business earnings",
  },
  {
    path: "/payouts",
    title: "Payouts",
    subtitle: "View your payment history",
  },
  {
    path: "/team",
    title: "Team",
    subtitle: "Manage your business team",
  },
  {
    path: "/profile",
    title: "Business Profile",
    subtitle: "Manage your business information",
  },
  {
    path: "/notifications",
    title: "Notifications",
    subtitle: "Stay informed about your business",
  },
];

// ============================================================
// QUICK NAVIGATION
// ============================================================

const quickLinks = [
  {
    label: "Dashboard",
    path: "/dashboard",
    pageKey: "dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    path: "/products",
    pageKey: "products",
    icon: Package,
  },
  {
    label: "Orders",
    path: "/orders",
    pageKey: "orders",
    icon: ShoppingBag,
  },
  {
    label: "Inventory",
    path: "/inventory",
    pageKey: "inventory",
    icon: Warehouse,
  },
  {
    label: "Shipping",
    path: "/shipping",
    pageKey: "shipping",
    icon: Truck,
  },
  {
    label: "Returns & Exchanges",
    path: "/returns",
    pageKey: "shipping",
    icon: RotateCcw,
  },
  {
    label: "Earnings",
    path: "/earnings",
    pageKey: "earnings",
    icon: IndianRupee,
  },
  {
    label: "Payouts",
    path: "/payouts",
    pageKey: "payouts",
    icon: Wallet,
  },
  {
    label: "Team",
    path: "/team",
    pageKey: "team",
    icon: UsersRound,
  },
  {
    label: "Business Profile",
    path: "/profile",
    pageKey: "profile",
    icon: Store,
  },
  {
    label: "Notifications",
    path: "/notifications",
    pageKey: null,
    icon: Bell,
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatRole(value) {
  return String(value || "member")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getSoundPreference() {
  try {
    return (
      localStorage.getItem(SOUND_PREFERENCE_KEY) !== "false"
    );
  } catch {
    return true;
  }
}

function saveSoundPreference(enabled) {
  try {
    localStorage.setItem(
      SOUND_PREFERENCE_KEY,
      String(enabled)
    );
  } catch {
    // Storage may be unavailable.
  }
}

// ============================================================
// PREMIUM DOUBLE-RING ORDER BELL
//
// Natural metallic bell harmonics.
// No external audio files required.
// ============================================================

const bellBufferCache = new WeakMap();

function createOrderBellBuffer(context) {
  const sampleRate = context.sampleRate;
  const duration = 2.1;

  const length = Math.ceil(
    sampleRate * duration
  );

  const buffer = context.createBuffer(
    1,
    length,
    sampleRate
  );

  const samples = buffer.getChannelData(0);

  const strikes = [
    {
      delay: 0,
      frequency: 1050,
      strength: 1.0,
    },
    {
      delay: 0.38,
      frequency: 1320,
      strength: 0.95,
    },
  ];

  const harmonics = [
    { ratio: 1, amplitude: 0.62, decay: 0.34 },
    { ratio: 2.01, amplitude: 0.24, decay: 0.19 },
    { ratio: 2.76, amplitude: 0.15, decay: 0.12 },
    { ratio: 4.08, amplitude: 0.08, decay: 0.065 },
    { ratio: 5.43, amplitude: 0.035, decay: 0.04 },
  ];

  let peak = 0;

  for (let i = 0; i < length; i += 1) {
    const time = i / sampleRate;

    let value = 0;

    for (const strike of strikes) {
      const t = time - strike.delay;

      if (t < 0) continue;

      const attack = Math.min(1, t / 0.004);

      let bell = 0;

      for (const harmonic of harmonics) {
        const frequency =
          strike.frequency * harmonic.ratio;

        const envelope =
          Math.exp(-t / harmonic.decay);

        bell +=
          Math.sin(
            2 * Math.PI * frequency * t
          ) *
          harmonic.amplitude *
          envelope;
      }

      value +=
        bell *
        attack *
        strike.strength;
    }

    // Soft saturation keeps the bell clear and prominent.
    value = Math.tanh(value * 1.7);

    // Smooth final fade.
    const remaining = duration - time;

    if (remaining < 0.08) {
      value *= Math.max(0, remaining / 0.08);
    }

    samples[i] = value;

    peak = Math.max(
      peak,
      Math.abs(value)
    );
  }

  // Normalize without digital clipping.
  if (peak > 0) {
    const normalization = 0.92 / peak;

    for (let i = 0; i < length; i += 1) {
      samples[i] *= normalization;
    }
  }

  return buffer;
}

function playOrderBell(context, sourceRef) {
  if (
    !context ||
    context.state !== "running"
  ) {
    return false;
  }

  try {
    // Prevent overlapping notification sounds.
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // Previous audio already ended.
      }
    }

    let buffer =
      bellBufferCache.get(context);

    if (!buffer) {
      buffer = createOrderBellBuffer(context);

      bellBufferCache.set(
        context,
        buffer
      );
    }

    const source =
      context.createBufferSource();

    const gain =
      context.createGain();

    source.buffer = buffer;

    // Strong output while respecting device volume.
    gain.gain.value = 1;

    source.connect(gain);
    gain.connect(context.destination);

    sourceRef.current = source;

    source.onended = () => {
      source.disconnect();
      gain.disconnect();

      if (sourceRef.current === source) {
        sourceRef.current = null;
      }
    };

    source.start();

    return true;

  } catch (error) {
    console.warn(
      "Order bell playback failed:",
      error
    );

    return false;
  }
}

// ============================================================
// MAIN NAVBAR COMPONENT
// ============================================================

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    vendor,
    membership,
    canAccess,
    permissionsReady,
    logout,
  } = useAuth();

  // ==========================================================
  // STATE
  // ==========================================================

  const [search, setSearch] = useState("");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [logoFailed, setLogoFailed] =
    useState(false);

  const [soundEnabled, setSoundEnabled] =
    useState(getSoundPreference);

  const [notificationState, setNotificationState] =
    useState({
      userId: null,
      count: 0,
    });

  // ==========================================================
  // REFERENCES
  // ==========================================================

  const searchRef = useRef(null);

  const profileRef = useRef(null);

  const audioContextRef = useRef(null);

  const audioSourceRef = useRef(null);

  const soundEnabledRef = useRef(soundEnabled);

  const pendingSoundRef = useRef(false);

  // ==========================================================
  // USER AND VENDOR
  // ==========================================================

  const userId =
    user?.id ||
    user?.user_id ||
    membership?.user_id;

  const unreadCount =
    notificationState.userId === userId
      ? notificationState.count
      : 0;

  const businessName =
    vendor?.business_name || "Vendor Business";

  const vendorLogo = vendor?.logo_url || "";

  const memberRole = formatRole(
    membership?.member_role
  );

  const displayName =
    user?.full_name ||
    user?.email ||
    businessName;

  const initial =
    String(displayName)
      .trim()
      .charAt(0)
      .toUpperCase() || "V";

  const isApproved =
    String(vendor?.status || "")
      .trim()
      .toLowerCase() === "approved";

  const notificationsAvailable = Boolean(
    userId &&
    isApproved &&
    permissionsReady
  );

  const isNotificationsPage =
    location.pathname === "/notifications";

  // ==========================================================
  // STOP CURRENT SOUND
  // ==========================================================

  const stopNotificationSound = useCallback(() => {
    const source = audioSourceRef.current;

    audioSourceRef.current = null;

    if (source) {
      try {
        source.stop();
      } catch {
        // Audio already stopped.
      }
    }
  }, []);

  // ==========================================================
  // PLAY SOUND
  // ==========================================================

  const playNotificationSound = useCallback(() => {
    if (!soundEnabledRef.current) {
      return false;
    }

    const played = playOrderBell(
      audioContextRef.current,
      audioSourceRef
    );

    pendingSoundRef.current = !played;

    return played;
  }, []);

  // ==========================================================
  // BUSINESS LOGO
  // ==========================================================

  useEffect(() => {
    setLogoFailed(false);
  }, [vendorLogo]);

  // ==========================================================
  // RESET SOUND ON ACCOUNT CHANGE
  // ==========================================================

  useEffect(() => {
    pendingSoundRef.current = false;

    stopNotificationSound();

  }, [
    userId,
    notificationsAvailable,
    stopNotificationSound,
  ]);

  // ==========================================================
  // BROWSER AUDIO INITIALIZATION
  // ==========================================================

  useEffect(() => {
    let active = true;

    async function unlockAudio() {
      try {
        const AudioContextClass =
          window.AudioContext ||
          window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (
          !audioContextRef.current ||
          audioContextRef.current.state === "closed"
        ) {
          audioContextRef.current =
            new AudioContextClass();
        }

        const context =
          audioContextRef.current;

        if (context.state !== "running") {
          await context.resume();
        }

        if (
          !active ||
          context !== audioContextRef.current
        ) {
          return;
        }

        if (
          pendingSoundRef.current &&
          soundEnabledRef.current
        ) {
          playNotificationSound();
        }

      } catch (error) {
        console.warn(
          "Notification audio is awaiting browser interaction.",
          error
        );
      }
    }

    window.addEventListener(
      "pointerdown",
      unlockAudio
    );

    window.addEventListener(
      "keydown",
      unlockAudio
    );

    return () => {
      active = false;

      window.removeEventListener(
        "pointerdown",
        unlockAudio
      );

      window.removeEventListener(
        "keydown",
        unlockAudio
      );

      stopNotificationSound();

      const context = audioContextRef.current;

      audioContextRef.current = null;

      if (
        context &&
        context.state !== "closed"
      ) {
        context.close().catch(() => {});
      }
    };

  }, [
    playNotificationSound,
    stopNotificationSound,
  ]);

  // ==========================================================
  // SOUND PREFERENCE SYNCHRONIZATION
  // ==========================================================

  useEffect(() => {
    function handleStorageChange(event) {
      if (
        event.key !== SOUND_PREFERENCE_KEY &&
        event.key !== null
      ) {
        return;
      }

      const enabled =
        getSoundPreference();

      soundEnabledRef.current = enabled;

      setSoundEnabled(enabled);

      if (!enabled) {
        pendingSoundRef.current = false;
        stopNotificationSound();
      }
    }

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };

  }, [stopNotificationSound]);

  // ==========================================================
  // ENABLE / DISABLE SOUND
  // ==========================================================

  async function toggleNotificationSound() {
    const enabled =
      !soundEnabledRef.current;

    soundEnabledRef.current = enabled;

    setSoundEnabled(enabled);

    saveSoundPreference(enabled);

    pendingSoundRef.current = false;

    if (!enabled) {
      stopNotificationSound();
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContextClass) return;

      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed"
      ) {
        audioContextRef.current =
          new AudioContextClass();
      }

      const context =
        audioContextRef.current;

      if (context.state !== "running") {
        await context.resume();
      }

      if (
        soundEnabledRef.current &&
        context === audioContextRef.current
      ) {
        playNotificationSound();
      }

    } catch (error) {
      console.warn(
        "Unable to play notification preview:",
        error
      );
    }
  }

  // ==========================================================
  // AUTOMATIC NOTIFICATION POLLING
  // ==========================================================

  useEffect(() => {
    if (!notificationsAvailable) {
      setNotificationState({
        userId: null,
        count: 0,
      });

      return;
    }

    let active = true;
    let requestInProgress = false;
    let refreshRequested = false;
    let controller = null;

    let baselineReady = false;

    let latestTimestamp = -Infinity;

    let latestIds = new Set();

    setNotificationState({
      userId,
      count: 0,
    });

    // ========================================================
    // INCOMING SOUND
    // ========================================================

    function playIncomingSound() {
      if (!soundEnabledRef.current) return;

      if (playNotificationSound()) {
        return;
      }

      const context = audioContextRef.current;

      if (
        context &&
        context.state !== "closed"
      ) {
        context.resume()
          .then(() => {
            if (
              active &&
              context === audioContextRef.current &&
              pendingSoundRef.current &&
              soundEnabledRef.current
            ) {
              playNotificationSound();
            }
          })
          .catch(() => {});
      }
    }

    // ========================================================
    // FETCH NOTIFICATIONS
    // ========================================================

    async function refreshNotifications() {
      if (!active) return;

      if (requestInProgress) {
        refreshRequested = true;
        return;
      }

      requestInProgress = true;

      const requestController =
        new AbortController();

      controller = requestController;

      const requestTimeout =
        window.setTimeout(() => {
          requestController.abort();
        }, 15000);

      try {
        const result =
          await notificationApi.getNotifications(
            {
              read_status: "all",
              limit: 20,
              offset: 0,
            },
            requestController.signal
          );

        if (
          !active ||
          requestController.signal.aborted
        ) {
          return;
        }

        if (!Array.isArray(result?.data)) {
          throw new Error(
            "Invalid notification response."
          );
        }

        let count = result.unread_count;

        if (
          count === undefined ||
          count === null ||
          !Number.isFinite(Number(count))
        ) {
          const countResult =
            await notificationApi.getUnreadCount(
              requestController.signal
            );

          count = countResult?.unread_count;
        }

        if (
          !active ||
          requestController.signal.aborted
        ) {
          return;
        }

        if (
          count !== null &&
          count !== undefined &&
          Number.isFinite(Number(count))
        ) {
          setNotificationState({
            userId,
            count: Math.max(
              0,
              Math.floor(Number(count))
            ),
          });
        }

        // ====================================================
        // DETECT ONLY NEWLY RECEIVED NOTIFICATIONS
        // ====================================================

        const validItems = result.data
          .filter((item) => item?.id)
          .map((item) => ({
            ...item,
            timestamp: Date.parse(
              item.created_at
            ),
          }))
          .filter((item) =>
            Number.isFinite(item.timestamp)
          );

        const newNotifications =
          baselineReady
            ? validItems.filter(
                (item) =>
                  item.is_read === false &&
                  (
                    item.timestamp > latestTimestamp ||
                    (
                      item.timestamp === latestTimestamp &&
                      !latestIds.has(item.id)
                    )
                  )
              )
            : [];

        validItems.forEach((item) => {
          if (
            item.timestamp > latestTimestamp
          ) {
            latestTimestamp = item.timestamp;

            latestIds = new Set([item.id]);

          } else if (
            item.timestamp === latestTimestamp
          ) {
            latestIds.add(item.id);
          }
        });

        baselineReady = true;

        // Supports new orders, product approvals,
        // product rejections and other notifications.

        if (newNotifications.length > 0) {
          playIncomingSound();
        }

      } catch (error) {
        if (
          !active ||
          error?.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Notification refresh failed:",
          error.message
        );

        if (
          error?.status === 401 ||
          error?.status === 403
        ) {
          setNotificationState({
            userId,
            count: 0,
          });
        }

      } finally {
        window.clearTimeout(requestTimeout);

        requestInProgress = false;

        if (controller === requestController) {
          controller = null;
        }

        if (active && refreshRequested) {
          refreshRequested = false;
          refreshNotifications();
        }
      }
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState === "visible"
      ) {
        refreshNotifications();
      }
    }

    refreshNotifications();

    const interval = window.setInterval(
      refreshNotifications,
      NOTIFICATION_REFRESH_INTERVAL
    );

    window.addEventListener(
      "focus",
      refreshNotifications
    );

    window.addEventListener(
      NOTIFICATION_CHANGE_EVENT,
      refreshNotifications
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      active = false;

      pendingSoundRef.current = false;

      controller?.abort();

      window.clearInterval(interval);

      window.removeEventListener(
        "focus",
        refreshNotifications
      );

      window.removeEventListener(
        NOTIFICATION_CHANGE_EVENT,
        refreshNotifications
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };

  }, [
    userId,
    notificationsAvailable,
    playNotificationSound,
  ]);

  // ==========================================================
  // CURRENT PAGE
  // ==========================================================

  const currentPage =
    pageDetails.find(
      (page) =>
        location.pathname === page.path ||
        location.pathname.startsWith(
          `${page.path}/`
        )
    ) || {
      title: "Vendor Workspace",
      subtitle: "Manage your AUMVEDA business",
    };

  // ==========================================================
  // PERMISSION-BASED SEARCH
  // ==========================================================

  const filteredLinks = quickLinks.filter(
    (item) => {
      const allowed = item.pageKey
        ? permissionsReady &&
          canAccess(item.pageKey)
        : notificationsAvailable;

      return (
        allowed &&
        item.label
          .toLowerCase()
          .includes(
            search.trim().toLowerCase()
          )
      );
    }
  );

  // ==========================================================
  // ROUTE CHANGE
  // ==========================================================

  useEffect(() => {
    setSearchOpen(false);
    setProfileOpen(false);
    setSearch("");
  }, [location.pathname]);

  // ==========================================================
  // CLOSE DROPDOWNS
  // ==========================================================

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };

  }, []);

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  function navigateTo(path) {
    setSearchOpen(false);
    setProfileOpen(false);

    navigate(path);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    if (filteredLinks.length > 0) {
      navigateTo(filteredLinks[0].path);
    }
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================

  async function handleLogout() {
    setProfileOpen(false);

    pendingSoundRef.current = false;

    stopNotificationSound();

    setNotificationState({
      userId: null,
      count: 0,
    });

    await logout();

    navigate("/login", {
      replace: true,
    });
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <header className="vendor-navbar">

      <div className="vendor-navbar-left">

        <div className="vendor-navbar-page-info">

          <span className="vendor-navbar-eyebrow">
            AUMVEDA VENDOR PORTAL
          </span>

          <h1 className="vendor-navbar-page-title">
            {currentPage.title}
          </h1>

          <p className="vendor-navbar-page-subtitle">
            {currentPage.subtitle}
          </p>

        </div>

      </div>

      <div className="vendor-navbar-right">

        {/* SEARCH */}

        <div
          className="vendor-navbar-search-wrap"
          ref={searchRef}
        >

          <form
            className="vendor-navbar-search"
            onSubmit={handleSearchSubmit}
          >

            <Search
              size={18}
              strokeWidth={1.8}
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Go to a section..."
              aria-label="Search vendor sections"
              aria-expanded={searchOpen}
              aria-controls="vendor-navbar-search-results"
            />

            {search && (
              <button
                type="button"
                className="vendor-navbar-search-clear"
                onClick={() => {
                  setSearch("");
                  setSearchOpen(true);
                }}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}

          </form>

          {searchOpen && (
            <div
              id="vendor-navbar-search-results"
              className="vendor-navbar-search-results"
            >

              <span className="vendor-navbar-menu-label">
                QUICK NAVIGATION
              </span>

              {filteredLinks.length > 0 ? (
                filteredLinks.map(
                  ({
                    label,
                    path,
                    icon: Icon,
                  }) => (
                    <button
                      key={path}
                      type="button"
                      onClick={() =>
                        navigateTo(path)
                      }
                    >
                      <Icon size={17} />
                      <span>{label}</span>
                    </button>
                  )
                )
              ) : (
                <p className="vendor-navbar-search-empty">
                  No matching section found.
                </p>
              )}

            </div>
          )}

        </div>

        {/* NOTIFICATION BELL */}

        <div className="vendor-navbar-notification-wrap">

          <button
            type="button"
            className={`vendor-navbar-icon-button ${
              isNotificationsPage
                ? "notification-active"
                : ""
            }`}
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-current={
              isNotificationsPage
                ? "page"
                : undefined
            }
            title={
              unreadCount > 0
                ? `${unreadCount} unread notifications`
                : "Notifications"
            }
            disabled={!notificationsAvailable}
            onClick={() =>
              navigateTo("/notifications")
            }
          >

            <Bell
              size={19}
              strokeWidth={1.8}
            />

            {unreadCount > 0 && (
              <span
                className="vendor-navbar-notification-badge"
                aria-hidden="true"
              >
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}

          </button>

        </div>

        <span className="vendor-navbar-divider" />

        {/* ACCOUNT MENU */}

        <div
          className="vendor-navbar-profile-wrap"
          ref={profileRef}
        >

          <button
            type="button"
            className={`vendor-navbar-profile ${
              profileOpen ? "open" : ""
            }`}
            onClick={() => {
              setProfileOpen(
                (previous) => !previous
              );

              setSearchOpen(false);
            }}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >

            <div
              className={`vendor-navbar-avatar ${
                vendorLogo && !logoFailed
                  ? "has-image"
                  : ""
              }`}
            >

              {vendorLogo && !logoFailed ? (
                <img
                  src={vendorLogo}
                  alt={`${businessName} logo`}
                  onError={() =>
                    setLogoFailed(true)
                  }
                />
              ) : (
                <span>{initial}</span>
              )}

            </div>

            <div className="vendor-navbar-user">

              <strong title={businessName}>
                {businessName}
              </strong>

              <span>{memberRole}</span>

            </div>

            <ChevronDown
              size={16}
              className={`vendor-navbar-chevron ${
                profileOpen ? "open" : ""
              }`}
            />

          </button>

          {profileOpen && (
            <div
              className="vendor-navbar-profile-menu"
              role="menu"
              aria-label="Vendor account"
            >

              <div className="vendor-navbar-menu-header">

                <div
                  className={`vendor-navbar-menu-avatar ${
                    vendorLogo && !logoFailed
                      ? "has-image"
                      : ""
                  }`}
                >

                  {vendorLogo && !logoFailed ? (
                    <img
                      src={vendorLogo}
                      alt={`${businessName} logo`}
                      onError={() =>
                        setLogoFailed(true)
                      }
                    />
                  ) : (
                    initial
                  )}

                </div>

                <div>

                  <strong title={displayName}>
                    {displayName}
                  </strong>

                  <span>
                    {user?.email || memberRole}
                  </span>

                </div>

              </div>

              {isApproved && (
                <div className="vendor-navbar-approved">

                  <CircleCheck size={15} />

                  Approved Vendor Partner

                </div>
              )}

              <div className="vendor-navbar-menu-divider" />

              {permissionsReady &&
                canAccess("profile") && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      navigateTo("/profile")
                    }
                  >
                    <Store size={17} />
                    Business Profile
                  </button>
                )}

              {permissionsReady &&
                canAccess("team") && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      navigateTo("/team")
                    }
                  >
                    <UserRound size={17} />
                    Team Management
                  </button>
                )}

              {notificationsAvailable && (
                <>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      navigateTo("/notifications")
                    }
                  >
                    <Bell size={17} />
                    Notifications
                  </button>

                  <button
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={soundEnabled}
                    onClick={toggleNotificationSound}
                    title={
                      soundEnabled
                        ? "Mute notification sound"
                        : "Enable notification sound"
                    }
                  >

                    {soundEnabled ? (
                      <Volume2
                        size={17}
                        color="#286447"
                      />
                    ) : (
                      <VolumeX
                        size={17}
                        color="#849188"
                      />
                    )}

                    Notification Sound:{" "}
                    {soundEnabled ? "ON" : "OFF"}

                  </button>

                </>
              )}

              <div className="vendor-navbar-menu-divider" />

              <button
                type="button"
                role="menuitem"
                className="vendor-navbar-menu-logout"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                Sign Out
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}