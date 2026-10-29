import { useEffect, useState } from 'react';
import { getDashboardSummary } from '../services/adminService.js';

const metrics = [
  ['Products', 'total_products'],
  ['Orders', 'total_orders'],
  ['Customers', 'total_customers'],
  ['Vendors', 'total_vendors'],
  ['Pending products', 'pending_products'],
  ['Pending vendors', 'pending_vendors'],
];

export default function Dashboard() {
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
      <div className="module-intro">
        <div>
          <h2>Store overview</h2>
          <p>Current Aumveda operations at a glance.</p>
        </div>
      </div>
      {loading && <div className="loading-state">Loading dashboard…</div>}
      {error && <div className="error-state" role="alert">{error}</div>}
      {summary && (
        <div className="dashboard-metrics">
          {metrics.map(([label, key]) => (
            <article className="dashboard-metric" key={key}>
              <span>{label}</span>
              <strong>{Number(summary[key] ?? 0).toLocaleString('en-IN')}</strong>
            </article>
          ))}
        </div>
      )}
      {!loading && !error && !summary && (
        <div className="empty-state">No dashboard summary was returned.</div>
      )}
      <style>{`
        .dashboard-page { align-content: start; }
        .dashboard-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .dashboard-metric { min-height: 132px; padding: 22px; background: #fffefd; border: 1px solid #eee6dc; border-radius: 16px; }
        .dashboard-metric span { color: #77747a; font-size: 12px; }
        .dashboard-metric strong { display: block; margin-top: 18px; color: #343522; font-family: 'Playfair Display', serif; font-size: 32px; }
        @media (max-width: 700px) {
          .dashboard-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        }
      `}</style>
    </section>
  );
}
