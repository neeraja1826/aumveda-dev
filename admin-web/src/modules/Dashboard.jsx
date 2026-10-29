import { useEffect, useState } from 'react';
import { getDashboardSummary } from '../services/adminService.js';
import {
  AyurvedicHeroBanner,
  AyurvedicLeafDoodle,
  MortarPestleDoodle,
  LotusFlowerDoodle,
  TeaCupDoodle,
  BottleTonicDoodle,
} from '../components/AyurvedicDoodles.jsx';

const metrics = [
  ['Products', 'total_products', MortarPestleDoodle, 'Active formulations in catalog'],
  ['Orders', 'total_orders', TeaCupDoodle, 'Customer wellness remedy orders'],
  ['Customers', 'total_customers', LotusFlowerDoodle, 'Registered holistic wellness profiles'],
  ['Vendors', 'total_vendors', BottleTonicDoodle, 'Verified herbal suppliers & partners'],
  ['Pending products', 'pending_products', AyurvedicLeafDoodle, 'Formulations awaiting catalog review'],
  ['Pending vendors', 'pending_vendors', AyurvedicLeafDoodle, 'Supplier accounts to onboard'],
];

export default function Dashboard({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getDashboardSummary()
      .then((result) => {
        if (active) setSummary(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="module-page dashboard-page">
      <AyurvedicHeroBanner
        eyebrow="AUMVEDA OPERATIONS CONSOLE"
        title="Store Overview & Holistic Metrics"
        description="Real-time operations, fulfillment metrics, and inventory overview."
        badgeText="Live Operations"
        doodle="leaf"
      />

      {loading && (
        <div className="dashboard-loading-card">
          <div className="dashboard-spinner" />
          <span>Loading operations data…</span>
        </div>
      )}

      {error && <div className="error-state" role="alert">{error}</div>}

      {summary && (
        <>
          <div className="dashboard-metrics">
            {metrics.map(([label, key, Icon, subtitle]) => {
              const isPending = key.includes('pending');
              return (
                <article className={`dashboard-metric${isPending ? ' is-pending' : ''}`} key={key}>
                  <div className="dashboard-metric-header">
                    <span>{label}</span>
                    <span className={`dashboard-metric-badge${isPending ? ' badge-pending' : ' badge-normal'}`}>
                      {isPending ? 'Action' : 'Active'}
                    </span>
                  </div>
                  <div className="dashboard-metric-body">
                    <strong>{Number(summary[key] ?? 0).toLocaleString('en-IN')}</strong>
                    <div className="dashboard-metric-icon-wrap">
                      <Icon size={26} color="#123D2B" opacity={0.85} />
                    </div>
                  </div>
                  <div className="dashboard-metric-subtitle">{subtitle}</div>
                </article>
              );
            })}
          </div>

          <div className="dashboard-quick-hub">
            <div className="dashboard-hub-header">
              <div>
                <h3>Ayurvedic Operations & Management</h3>
                <p>Direct shortcuts to high-frequency console workflows</p>
              </div>
              <span className="dashboard-hub-badge">✦ Classical System</span>
            </div>

            <div className="dashboard-hub-grid">
              <button
                type="button"
                className="dashboard-hub-card"
                onClick={() => onNavigate?.('Products')}
              >
                <div className="dashboard-hub-icon-wrap">
                  <MortarPestleDoodle size={28} color="#123D2B" opacity={0.85} />
                </div>
                <div className="dashboard-hub-card-content">
                  <strong>Herbal Catalog & Remedies</strong>
                  <p>Manage formulations, dosages, variants, pricing, and category aisles.</p>
                  <span className="dashboard-hub-link">Open Catalog →</span>
                </div>
              </button>

              <button
                type="button"
                className="dashboard-hub-card"
                onClick={() => onNavigate?.('Orders')}
              >
                <div className="dashboard-hub-icon-wrap">
                  <TeaCupDoodle size={28} color="#123D2B" opacity={0.85} />
                </div>
                <div className="dashboard-hub-card-content">
                  <strong>Order Fulfillment & Shipments</strong>
                  <p>Process pending customer remedies, shipping addresses, and invoices.</p>
                  <span className="dashboard-hub-link">Review Orders →</span>
                </div>
              </button>

              <button
                type="button"
                className="dashboard-hub-card"
                onClick={() => onNavigate?.('Inventory')}
              >
                <div className="dashboard-hub-icon-wrap">
                  <BottleTonicDoodle size={28} color="#123D2B" opacity={0.85} />
                </div>
                <div className="dashboard-hub-card-content">
                  <strong>Stock Movements & Warehouses</strong>
                  <p>Audit warehouse stock levels, adjust thresholds, and record batch movements.</p>
                  <span className="dashboard-hub-link">Audit Stock →</span>
                </div>
              </button>

              <button
                type="button"
                className="dashboard-hub-card"
                onClick={() => onNavigate?.('Returns')}
              >
                <div className="dashboard-hub-icon-wrap">
                  <AyurvedicLeafDoodle size={28} color="#123D2B" opacity={0.85} />
                </div>
                <div className="dashboard-hub-card-content">
                  <strong>Returns & Reverse Logistics</strong>
                  <p>Inspect returned remedies, approve replacements, and process customer refunds.</p>
                  <span className="dashboard-hub-link">Inspect Returns →</span>
                </div>
              </button>
            </div>
          </div>

          <div className="dashboard-assurance-card">
            <div className="dashboard-assurance-content">
              <span className="dashboard-assurance-eyebrow">✦ AUMVEDA HERBAL PURITY & QUALITY ASSURANCE</span>
              <h4>Ayurvedic Pharmacopoeia & System Integrity</h4>
              <p>All catalog formulations, batch movements, customer wellness data, and vendor commissions operate under authenticated classical Ayurvedic standards with real-time API encryption.</p>
            </div>
            <div className="dashboard-assurance-status">
              <span className="aumveda-pulse-dot" />
              <span>System Pure & Encrypted</span>
            </div>
          </div>
        </>
      )}

      {!loading && !error && !summary && (
        <div className="empty-state">No dashboard summary was returned.</div>
      )}

      <style>{`
        .dashboard-page {
          align-content: start;
          gap: 24px;
        }
        .dashboard-loading-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 50px 20px;
          background: #FFFFFF;
          border: 1px solid #E2ECE0;
          border-radius: 16px;
          color: #716F68;
          font-size: 13.5px;
          gap: 12px;
        }
        .dashboard-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid #E8F2E7;
          border-top-color: #123D2B;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .dashboard-metrics {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }
        .dashboard-metric {
          min-height: 148px;
          padding: 22px 24px;
          background: #FFFFFF;
          border: 1px solid #E2ECE0;
          border-radius: 18px;
          box-shadow: 0 4px 16px -2px rgba(18, 61, 43, 0.04);
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s, border-color 0.2s;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        .dashboard-metric:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 26px -4px rgba(18, 61, 43, 0.09);
          border-color: #CDE2CB;
        }
        .dashboard-metric.is-pending {
          border-left: 4.5px solid #D9A52E;
        }
        .dashboard-metric-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .dashboard-metric span {
          color: #716F68;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.2px;
        }
        .dashboard-metric-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 12px;
          letter-spacing: 0.3px;
        }
        .badge-normal {
          background: #E8F2E7;
          color: #123D2B;
          border: 1px solid #CDE2CB;
        }
        .badge-pending {
          background: #FEF7E6;
          color: #946800;
          border: 1px solid #F8E2A7;
        }
        .dashboard-metric-body {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-top: 12px;
        }
        .dashboard-metric strong {
          display: block;
          margin-top: 0;
          color: #123D2B;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 34px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .dashboard-metric-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #E5F2E4 0%, #D9EAD7 100%);
          border: 1.5px solid #CDE2CB;
          box-shadow: 0 2px 8px rgba(18, 61, 43, 0.06);
        }
        .dashboard-metric-subtitle {
          color: #8C9990;
          font-size: 11.5px;
          margin-top: 10px;
          font-weight: 400;
        }

        /* Quick Operations Hub */
        .dashboard-quick-hub {
          background: #FFFFFF;
          border: 1px solid #E2ECE0;
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 4px 18px rgba(18, 61, 43, 0.04);
        }
        .dashboard-hub-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 18px;
          border-bottom: 1px solid #EDF3EC;
          margin-bottom: 20px;
        }
        .dashboard-hub-header h3 {
          margin: 0;
          color: #123D2B;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 20px;
          font-weight: 700;
        }
        .dashboard-hub-header p {
          margin: 4px 0 0;
          color: #716F68;
          font-size: 13px;
        }
        .dashboard-hub-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: 20px;
          background: #FAF9F4;
          border: 1px solid #E2ECE0;
          color: #D9A52E;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .dashboard-hub-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .dashboard-hub-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 18px 20px;
          background: #FAF9F4;
          border: 1px solid #E2ECE0;
          border-radius: 14px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dashboard-hub-card:hover {
          background: #FFFFFF;
          border-color: #276345;
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(18, 61, 43, 0.08);
        }
        .dashboard-hub-icon-wrap {
          display: grid;
          place-items: center;
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: #E8F2E7;
          border: 1px solid #CDE2CB;
          flex-shrink: 0;
        }
        .dashboard-hub-card-content strong {
          display: block;
          color: #123D2B;
          font-size: 14.5px;
          font-weight: 700;
        }
        .dashboard-hub-card-content p {
          margin: 4px 0 8px;
          color: #716F68;
          font-size: 12px;
          line-height: 1.5;
        }
        .dashboard-hub-link {
          color: #276345;
          font-size: 11.5px;
          font-weight: 700;
          display: inline-block;
          transition: transform 0.15s ease;
        }
        .dashboard-hub-card:hover .dashboard-hub-link {
          color: #123D2B;
          transform: translateX(3px);
        }

        /* Holistic Quality Assurance Banner */
        .dashboard-assurance-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 28px;
          border-radius: 18px;
          background: linear-gradient(135deg, #F5F4E7 0%, #FAF9F4 50%, #F5F4E7 100%);
          border: 1px solid rgba(217, 165, 46, 0.35);
          box-shadow: 0 4px 16px rgba(18, 61, 43, 0.03);
          gap: 20px;
        }
        .dashboard-assurance-eyebrow {
          color: #D9A52E;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-transform: uppercase;
        }
        .dashboard-assurance-content h4 {
          margin: 4px 0 0;
          color: #123D2B;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px;
          font-weight: 700;
        }
        .dashboard-assurance-content p {
          margin: 4px 0 0;
          color: #716F68;
          font-size: 12.5px;
          line-height: 1.5;
          max-width: 720px;
        }
        .dashboard-assurance-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          background: #FFFFFF;
          border: 1px solid #399E5B;
          color: #123D2B;
          font-size: 11.5px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(18, 61, 43, 0.06);
        }

        @media (max-width: 900px) {
          .dashboard-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          .dashboard-hub-grid {
            grid-template-columns: 1fr;
          }
          .dashboard-assurance-card {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        @media (max-width: 540px) {
          .dashboard-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}

