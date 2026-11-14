
import { useEffect, useState } from 'react';
import {
  getSupportSummary,
  getSupportTickets,
  getSupportTicket,
  updateSupportTicket,
  replySupportTicket,
} from '../services/adminService';

const initialSummary = {
  total: 0,
  open: 0,
  in_progress: 0,
  resolved: 0,
  closed: 0,
};

export default function Support() {
  const [summary, setSummary] = useState(initialSummary);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadSupport = async () => {
    try {
      setLoading(true);

      const [summaryData, ticketData] = await Promise.all([
        getSupportSummary(),
        getSupportTickets({
          search,
          status,
          priority,
          category,
        }),
      ]);

      setSummary(summaryData || initialSummary);
      setTickets(ticketData?.items || []);
    } catch (error) {
      console.error('Support loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupport();
  }, [status, priority, category]);

  const handleSearch = async (event) => {
    if (event.key !== 'Enter') return;
    await loadSupport();
  };

  const openTicket = async (ticketId) => {
    try {
      setDetailsLoading(true);

      const data = await getSupportTicket(ticketId);

      setSelectedTicket(data);
      setReply('');
    } catch (error) {
      console.error('Ticket details error:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusChange = async (value) => {
    if (!selectedTicket?.ticket?.id) return;

    try {
      setUpdating(true);

      const updated = await updateSupportTicket(
        selectedTicket.ticket.id,
        { status: value }
      );

      setSelectedTicket((current) => ({
        ...current,
        ticket: updated,
      }));

      await loadSupport();
    } catch (error) {
      console.error('Status update error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handlePriorityChange = async (value) => {
    if (!selectedTicket?.ticket?.id) return;

    try {
      setUpdating(true);

      const updated = await updateSupportTicket(
        selectedTicket.ticket.id,
        { priority: value }
      );

      setSelectedTicket((current) => ({
        ...current,
        ticket: updated,
      }));

      await loadSupport();
    } catch (error) {
      console.error('Priority update error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket?.ticket?.id) return;

    try {
      setUpdating(true);

      await replySupportTicket(
        selectedTicket.ticket.id,
        reply.trim()
      );

      setReply('');

      const refreshed = await getSupportTicket(
        selectedTicket.ticket.id
      );

      setSelectedTicket(refreshed);
      await loadSupport();
    } catch (error) {
      console.error('Reply error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';

    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusClass = (value) => {
    return `support-status support-status-${value || 'default'}`;
  };

  const getPriorityClass = (value) => {
    return `support-priority support-priority-${value || 'default'}`;
  };

  return (
    <div className="support-page">
      <div className="support-header">
        <div>
          <h1>Support</h1>
          <p>Manage customer support tickets and conversations.</p>
        </div>

        <button
          className="support-refresh"
          onClick={loadSupport}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="support-summary">
        <div className="support-card">
          <span>Total Tickets</span>
          <strong>{summary.total}</strong>
        </div>

        <div className="support-card">
          <span>Open</span>
          <strong>{summary.open}</strong>
        </div>

        <div className="support-card">
          <span>In Progress</span>
          <strong>{summary.in_progress}</strong>
        </div>

        <div className="support-card">
          <span>Resolved</span>
          <strong>{summary.resolved}</strong>
        </div>

        <div className="support-card">
          <span>Closed</span>
          <strong>{summary.closed}</strong>
        </div>
      </div>

      <div className="support-filters">
        <input
          type="text"
          placeholder="Search ticket number or subject..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={handleSearch}
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="">All Categories</option>
          <option value="general">General</option>
          <option value="order">Order</option>
          <option value="payment">Payment</option>
          <option value="product">Product</option>
          <option value="delivery">Delivery</option>
          <option value="return">Return</option>
        </select>
      </div>

      <div className="support-table-wrapper">
        <table className="support-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Subject</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="support-empty">
                  Loading tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="7" className="support-empty">
                  No support tickets found.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="support-ticket-number">
                    {ticket.ticket_number}
                  </td>

                  <td>{ticket.subject}</td>

                  <td>
                    {ticket.category || '-'}
                  </td>

                  <td>
                    <span className={getPriorityClass(ticket.priority)}>
                      {ticket.priority || '-'}
                    </span>
                  </td>

                  <td>
                    <span className={getStatusClass(ticket.status)}>
                      {ticket.status?.replace('_', ' ') || '-'}
                    </span>
                  </td>

                  <td>{formatDate(ticket.created_at)}</td>

                  <td>
                    <button
                      className="support-view-btn"
                      onClick={() => openTicket(ticket.id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedTicket && (
        <div
          className="support-modal-overlay"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="support-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="support-modal-header">
              <div>
                <span className="support-ticket-number">
                  {selectedTicket.ticket.ticket_number}
                </span>

                <h2>{selectedTicket.ticket.subject}</h2>
              </div>

              <button
                className="support-close"
                onClick={() => setSelectedTicket(null)}
              >
                ×
              </button>
            </div>

            {detailsLoading ? (
              <div className="support-modal-loading">
                Loading ticket...
              </div>
            ) : (
              <>
                <div className="support-ticket-meta">
                  <div>
                    <label>Category</label>
                    <strong>
                      {selectedTicket.ticket.category || '-'}
                    </strong>
                  </div>

                  <div>
                    <label>Priority</label>
                    <select
                      value={selectedTicket.ticket.priority || ''}
                      onChange={(event) =>
                        handlePriorityChange(event.target.value)
                      }
                      disabled={updating}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label>Status</label>
                    <select
                      value={selectedTicket.ticket.status || ''}
                      onChange={(event) =>
                        handleStatusChange(event.target.value)
                      }
                      disabled={updating}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">
                        In Progress
                      </option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label>Created</label>
                    <strong>
                      {formatDate(
                        selectedTicket.ticket.created_at
                      )}
                    </strong>
                  </div>
                </div>

                {selectedTicket.customer && (
                  <div className="support-customer">
                    <h3>Customer</h3>

                    <p>
                      {selectedTicket.customer.full_name ||
                        selectedTicket.customer.name ||
                        'Customer'}
                    </p>

                    {selectedTicket.customer.email && (
                      <span>
                        {selectedTicket.customer.email}
                      </span>
                    )}
                  </div>
                )}

                <div className="support-conversation">
                  <h3>Conversation</h3>

                  {selectedTicket.messages?.length ? (
                    selectedTicket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`support-message ${
                          message.sender_type === 'admin'
                            ? 'support-message-admin'
                            : 'support-message-customer'
                        }`}
                      >
                        <div className="support-message-header">
                          <strong>
                            {message.sender_type === 'admin'
                              ? 'Admin'
                              : 'Customer'}
                          </strong>

                          <span>
                            {formatDate(message.created_at)}
                          </span>
                        </div>

                        <p>{message.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="support-no-messages">
                      No messages available.
                    </p>
                  )}
                </div>

                {selectedTicket.ticket.status !== 'closed' && (
                  <div className="support-reply">
                    <h3>Reply</h3>

                    <textarea
                      value={reply}
                      onChange={(event) =>
                        setReply(event.target.value)
                      }
                      placeholder="Write a reply to the customer..."
                      rows="4"
                    />

                    <button
                      onClick={handleReply}
                      disabled={updating || !reply.trim()}
                    >
                      {updating ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        .support-page {
          padding: 24px;
        }

        .support-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .support-header h1 {
          margin: 0 0 6px;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 28px;
          font-weight: 700;
          color: #123D2B;
          letter-spacing: -0.02em;
        }

        .support-header p {
          margin: 0;
          color: #5C7565;
          font-size: 14px;
        }

        .support-refresh {
          border: 1px solid #123D2B;
          border-radius: 10px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #173F1D 0%, #123D2B 100%);
          color: white;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(18, 61, 43, 0.18);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .support-refresh:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(18, 61, 43, 0.26);
        }

        .support-refresh:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .support-summary {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .support-card {
          padding: 20px 22px;
          background: white;
          border: 1px solid #E2ECE0;
          border-radius: 18px;
          box-shadow: 0 8px 24px -4px rgba(18, 61, 43, 0.07);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .support-card:hover {
          transform: translateY(-2.5px);
          box-shadow: 0 14px 30px -4px rgba(18, 61, 43, 0.12);
          border-color: #C2DEC0;
        }

        .support-card span {
          display: block;
          color: #5C7565;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 8px;
        }

        .support-card strong {
          font-size: 26px;
          font-weight: 700;
          color: #123D2B;
        }

        .support-filters {
          display: flex;
          gap: 12px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .support-filters input,
        .support-filters select {
          height: 42px;
          border: 1px solid #D5E4D2;
          border-radius: 10px;
          padding: 0 14px;
          background: white;
          color: #1F2937;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .support-filters input:focus,
        .support-filters select:focus {
          outline: none;
          border-color: #276345;
          box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.12);
        }

        .support-filters input {
          min-width: 280px;
          flex: 1;
        }

        .support-table-wrapper {
          overflow-x: auto;
          background: white;
          border: 1px solid #E2ECE0;
          border-radius: 18px;
          box-shadow: 0 8px 24px -4px rgba(18, 61, 43, 0.06);
        }

        .support-table {
          width: 100%;
          border-collapse: collapse;
        }

        .support-table th,
        .support-table td {
          padding: 16px 18px;
          text-align: left;
          border-bottom: 1px solid #F0F5EE;
          white-space: nowrap;
        }

        .support-table th {
          font-size: 12px;
          font-weight: 700;
          color: #43624D;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: #FAFDF9;
          border-bottom: 1px solid #E2ECE0;
        }

        .support-table tbody tr {
          transition: background 0.18s ease;
        }

        .support-table tbody tr:hover {
          background: #F9FCF8;
        }

        .support-ticket-number {
          font-weight: 700;
          color: #123D2B;
          font-family: monospace;
          font-size: 13px;
        }

        .support-status,
        .support-priority {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .support-status-open {
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #FDE68A;
        }

        .support-status-in_progress {
          background: #EFF6FF;
          color: #1E40AF;
          border: 1px solid #BFDBFE;
        }

        .support-status-resolved {
          background: #E8F5E9;
          color: #1E5E38;
          border: 1px solid #C8E6C9;
        }

        .support-status-closed {
          background: #F3F4F6;
          color: #4B5563;
          border: 1px solid #E5E7EB;
        }

        .support-priority-low {
          background: #F1F5F9;
          color: #475569;
          border: 1px solid #E2E8F0;
        }

        .support-priority-medium {
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #FDE68A;
        }

        .support-priority-high {
          background: #FEE2E2;
          color: #991B1B;
          border: 1px solid #FECACA;
        }

        .support-priority-urgent {
          background: #FCE7F3;
          color: #9D174D;
          border: 1px solid #FBCFE8;
        }

        .support-view-btn {
          border: 1px solid #D5E4D2;
          background: #FAFDF9;
          color: #173F1D;
          font-weight: 600;
          font-size: 13px;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .support-view-btn:hover {
          background: #123D2B;
          color: white;
          border-color: #123D2B;
          transform: translateY(-1px);
        }

        .support-empty {
          text-align: center !important;
          padding: 48px !important;
          color: #5C7565;
        }

        .support-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 31, 20, 0.45);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          z-index: 1000;
        }

        .support-modal {
          width: min(900px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 20px;
          padding: 28px 32px;
          box-shadow: 0 25px 65px -12px rgba(10, 31, 20, 0.28);
          border: 1px solid #E2ECE0;
        }

        .support-modal-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .support-modal-header h2 {
          margin: 8px 0 0;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 24px;
          color: #123D2B;
          font-weight: 700;
        }

        .support-close {
          width: 36px;
          height: 36px;
          border: 1px solid #E2ECE0;
          border-radius: 50%;
          background: #FAFDF9;
          color: #173F1D;
          font-size: 22px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .support-close:hover {
          background: #F0F5EE;
          color: #123D2B;
          transform: scale(1.05);
        }

        .support-ticket-meta {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          padding: 18px 20px;
          background: #FAFDF9;
          border: 1px solid #E2ECE0;
          border-radius: 14px;
          margin-bottom: 20px;
        }

        .support-ticket-meta label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #5C7565;
          margin-bottom: 6px;
        }

        .support-ticket-meta strong {
          color: #123D2B;
          font-size: 15px;
        }

        .support-ticket-meta select {
          width: 100%;
          border: 1px solid #D5E4D2;
          border-radius: 8px;
          padding: 8px 10px;
          background: white;
          color: #1F2937;
          font-size: 13px;
        }

        .support-customer,
        .support-conversation,
        .support-reply {
          margin-top: 22px;
        }

        .support-customer h3,
        .support-conversation h3,
        .support-reply h3 {
          margin-bottom: 12px;
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px;
          color: #123D2B;
        }

        .support-customer {
          padding-bottom: 18px;
          border-bottom: 1px solid #E2ECE0;
        }

        .support-customer p {
          margin: 0 0 4px;
          font-weight: 600;
          color: #123D2B;
        }

        .support-customer span {
          color: #5C7565;
          font-size: 14px;
        }

        .support-message {
          padding: 16px 18px;
          border-radius: 14px;
          margin-bottom: 12px;
          border: 1px solid transparent;
        }

        .support-message-customer {
          background: #FAFDF9;
          border-color: #E2ECE0;
        }

        .support-message-admin {
          background: #F0F7F2;
          border-color: #DCEDE0;
        }

        .support-message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #123D2B;
        }

        .support-message-header span {
          color: #5C7565;
          font-size: 12px;
          font-weight: 500;
        }

        .support-message p {
          margin: 0;
          line-height: 1.6;
          color: #24382B;
        }

        .support-no-messages {
          color: #5C7565;
          padding: 12px 0;
          font-style: italic;
        }

        .support-reply textarea {
          width: 100%;
          box-sizing: border-box;
          resize: vertical;
          border: 1px solid #D5E4D2;
          border-radius: 12px;
          padding: 14px;
          font: inherit;
          color: #1F2937;
          background: white;
          transition: all 0.2s ease;
        }

        .support-reply textarea:focus {
          outline: none;
          border-color: #276345;
          box-shadow: 0 0 0 3px rgba(39, 99, 69, 0.12);
        }

        .support-reply button {
          margin-top: 12px;
          border: 1px solid #123D2B;
          border-radius: 10px;
          padding: 11px 24px;
          background: linear-gradient(135deg, #173F1D 0%, #123D2B 100%);
          color: white;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(18, 61, 43, 0.18);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .support-reply button:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(18, 61, 43, 0.26);
        }

        .support-reply button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .support-modal-loading {
          padding: 50px;
          text-align: center;
          color: #5C7565;
        }

        @media (max-width: 900px) {
          .support-summary {
            grid-template-columns: repeat(2, 1fr);
          }

          .support-ticket-meta {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .support-page {
            padding: 16px;
          }

          .support-summary {
            grid-template-columns: 1fr;
          }

          .support-ticket-meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
