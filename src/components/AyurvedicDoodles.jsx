import React from 'react';

export function AyurvedicLeafDoodle({ size = 32, color = '#123D2B', opacity = 1, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ opacity, display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

export function MortarPestleDoodle({ size = 32, color = '#123D2B', opacity = 1, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ opacity, display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <path d="m19 5-6 6" />
      <path d="M4 11h16a1 1 0 0 1 1 1c0 5-4 9-9 9s-9-4-9-9a1 1 0 0 1 1-1Z" />
      <path d="M9 16h6" />
      <path d="M12 13v6" />
    </svg>
  );
}

export function LotusFlowerDoodle({ size = 32, color = '#123D2B', opacity = 1, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ opacity, display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <path d="M12 3c-2 4-5 8-8 10 3 1 7 1 8-2 1 3 5 3 8 2-3-2-6-6-8-10Z" />
      <path d="M12 11c-1.5 3-4 5-7 6 2 2 5 3 7 1 2 2 5 1 7-1-3-1-5.5-3-7-6Z" />
      <path d="M12 17v4" />
    </svg>
  );
}

export function TeaCupDoodle({ size = 32, color = '#123D2B', opacity = 1, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ opacity, display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v7a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8Z" />
      <path d="M6 1v3" />
      <path d="M10 1v3" />
      <path d="M14 1v3" />
    </svg>
  );
}

export function BottleTonicDoodle({ size = 32, color = '#123D2B', opacity = 1, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ opacity, display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    >
      <path d="M10 2h4" />
      <path d="M10 5h4" />
      <path d="M12 2v3" />
      <path d="M8 8a2 2 0 0 0-2 2v9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-9a2 2 0 0 0-2-2H8Z" />
      <path d="M12 12v4" />
      <path d="M10 14h4" />
    </svg>
  );
}

export function AyurvedicHeroBanner({
  eyebrow = 'AUMVEDA AYURVEDIC CONSOLE',
  title,
  description,
  badgeText = 'Holistic Care',
  doodle = 'leaf',
  children,
}) {
  const doodleIcons = {
    leaf: <AyurvedicLeafDoodle size={108} color="#123D2B" opacity={0.14} />,
    mortar: <MortarPestleDoodle size={108} color="#123D2B" opacity={0.14} />,
    flower: <LotusFlowerDoodle size={108} color="#123D2B" opacity={0.14} />,
    tea: <TeaCupDoodle size={108} color="#123D2B" opacity={0.14} />,
    tonic: <BottleTonicDoodle size={108} color="#123D2B" opacity={0.14} />,
  };

  return (
    <div className="aumveda-hero-banner">
      <div className="aumveda-hero-content">
        {eyebrow && <span className="aumveda-hero-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      <div className="aumveda-hero-aside">
        {badgeText && (
          <div className="aumveda-hero-badge">
            <span className="aumveda-pulse-dot" />
            <span>{badgeText}</span>
          </div>
        )}
        {children}
      </div>

      <div className="aumveda-hero-watermark">
        {doodleIcons[doodle] ?? doodleIcons.leaf}
      </div>
    </div>
  );
}

export function AyurvedicEmptyState({
  doodle = 'leaf',
  title = 'No Records Found',
  description = 'No active records or matching entries are currently available.',
  children,
}) {
  const doodleIcons = {
    leaf: <AyurvedicLeafDoodle size={52} color="#276345" opacity={0.65} />,
    mortar: <MortarPestleDoodle size={52} color="#276345" opacity={0.65} />,
    flower: <LotusFlowerDoodle size={52} color="#276345" opacity={0.65} />,
    tea: <TeaCupDoodle size={52} color="#276345" opacity={0.65} />,
    tonic: <BottleTonicDoodle size={52} color="#276345" opacity={0.65} />,
  };

  return (
    <div className="aumveda-empty-state">
      <div className="aumveda-empty-icon-wrap">
        {doodleIcons[doodle] || doodleIcons.leaf}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {children && <div className="aumveda-empty-actions">{children}</div>}
    </div>
  );
}

