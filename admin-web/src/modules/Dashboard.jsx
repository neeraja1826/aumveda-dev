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
  const [reload, setReload] = useState(0);

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
  }, [reload]);

  return (
    <section className="module-page dashboard-page">
      <AyurvedicHeroBanner
        eyebrow="AUMVEDA OPERATIONS CONSOLE"
        title="Store Overview & Holistic Metrics"
        description="Real-time operations, fulfillment metrics, and inventory overview."
        badgeText="Live Operations"
        doodle="leaf"
      >
        <button
          type="button"
          className="primary-button dashboard-refresh-button"
          onClick={() => setReload((current) => current + 1)}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </AyurvedicHeroBanner>

      {loading && (
        <div className="dashboard-loading-card">
          <div className="dashboard-spinner" />
          <span>Loading operations data…</span>
        </div>
      )}

      {error && (
        <div className="error-state dashboard-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setReload((current) => current + 1)}
            disabled={loading}
          >
            Try again
          </button>
        </div>
      )}

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
        .dashboard-refresh-button {
          min-width: 90px;
        }
        .dashboard-error {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .dashboard-loading-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          background: #FFFFFF;
          border: 1px solid #E2ECE0;
          border-radius: 18px;
          color: #5F6E64;
          font-size: 13.5px;
          gap: 14px;
          box-shadow: 0 4px 18px rgba(18, 61, 43, 0.03);
        }
        .dashboard-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #E8F2E7;
          border-top-color: #276345;
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
          transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s, border-color 0.22s;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        .dashboard-metric:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px -4px rgba(18, 61, 43, 0.10);
          border-color: #BED8BD;
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
          color: #5F6E64;
          font-size: 12.5px;
          font-weight: 600;
          letter-spacing: 0.2px;
        }
        .dashboard-metric-badge {
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 14px;
          letter-spacing: 0.3px;
        }
        .badge-normal {
          background: #E8F5E9;
          color: #1B5E20;
          border: 1px solid #C8E6C9;
        }
        .badge-pending {
          background: #FFF8E1;
          color: #8D6E18;
          border: 1px solid #FFE082;
        }
        .dashboard-metric-body {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-top: 14px;
        }
        .dashboard-metric strong {
          display: block;
          margin-top: 0;
          color: #123D2B;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 34px;
          font-weight: 700;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }
        .dashboard-metric-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 15px;
          background: linear-gradient(135deg, #F4F8F3 0%, #E8F2E7 100%);
          border: 1.5px solid #CDE2CB;
          box-shadow: 0 2px 8px rgba(18, 61, 43, 0.05);
          transition: transform 0.2s ease;
        }
        .dashboard-metric:hover .dashboard-metric-icon-wrap {
          transform: scale(1.04);
        }
        .dashboard-metric-subtitle {
          color: #8A968E;
          font-size: 11.5px;
          margin-top: 10px;
          font-weight: 500;
        }

        /* Quick Operations Hub */
        .dashboard-quick-hub {
          background: #FFFFFF;
          border: 1px solid #E2ECE0;
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 4px 20px rgba(18, 61, 43, 0.04);
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
          color: #5F6E64;
          font-size: 13px;
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
          padding: 20px 22px;
          background: #FFFFFF;
          border: 1px solid #E2ECE0;
          border-radius: 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(18, 61, 43, 0.02);
        }
        .dashboard-hub-card:hover {
          background: #FAFDF9;
          border-color: #276345;
          transform: translateY(-2.5px);
          box-shadow: 0 10px 26px rgba(18, 61, 43, 0.08);
        }
        .dashboard-hub-icon-wrap {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #E8F2E7;
          border: 1px solid #CDE2CB;
          flex-shrink: 0;
          transition: background-color 0.2s ease;
        }
        .dashboard-hub-card:hover .dashboard-hub-icon-wrap {
          background: #DEEFE0;
        }
        .dashboard-hub-card-content strong {
          display: block;
          color: #123D2B;
          font-size: 14.5px;
          font-weight: 700;
        }
        .dashboard-hub-card-content p {
          margin: 4px 0 8px;
          color: #5F6E64;
          font-size: 12.5px;
          line-height: 1.5;
        }
        .dashboard-hub-link {
          color: #276345;
          font-size: 12px;
          font-weight: 700;
          display: inline-block;
          transition: transform 0.18s ease;
        }
        .dashboard-hub-card:hover .dashboard-hub-link {
          color: #123D2B;
          transform: translateX(3px);
        }

        @media (max-width: 900px) {
          .dashboard-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          .dashboard-hub-grid {
            grid-template-columns: 1fr;
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

