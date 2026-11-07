
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
          font-size: 28px;
          font-weight: 700;
        }

        .support-header p {
          margin: 0;
          color: #737373;
        }

        .support-refresh {
          border: 0;
          border-radius: 10px;
          padding: 10px 18px;
          background: #111827;
          color: white;
          cursor: pointer;
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
          padding: 20px;
          background: white;
          border: 1px solid #ececec;
          border-radius: 14px;
        }

        .support-card span {
          display: block;
          color: #737373;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .support-card strong {
          font-size: 25px;
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
          border: 1px solid #dedede;
          border-radius: 9px;
          padding: 0 12px;
          background: white;
        }

        .support-filters input {
          min-width: 280px;
          flex: 1;
        }

        .support-table-wrapper {
          overflow-x: auto;
          background: white;
          border: 1px solid #ececec;
          border-radius: 14px;
        }

        .support-table {
          width: 100%;
          border-collapse: collapse;
        }

        .support-table th,
        .support-table td {
          padding: 15px 16px;
          text-align: left;
          border-bottom: 1px solid #eeeeee;
          white-space: nowrap;
        }

        .support-table th {
          font-size: 12px;
          color: #737373;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .support-ticket-number {
          font-weight: 600;
        }

        .support-status,
        .support-priority {
          display: inline-flex;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 12px;
          text-transform: capitalize;
        }

        .support-status-open {
          background: #fff3cd;
          color: #856404;
        }

        .support-status-in_progress {
          background: #e0ecff;
          color: #2457a6;
        }

        .support-status-resolved {
          background: #e5f6ed;
          color: #24744b;
        }

        .support-status-closed {
          background: #eeeeee;
          color: #555;
        }

        .support-priority-low {
          background: #f1f5f9;
          color: #475569;
        }

        .support-priority-medium {
          background: #fff3cd;
          color: #856404;
        }

        .support-priority-high {
          background: #ffe5e5;
          color: #b42318;
        }

        .support-priority-urgent {
          background: #fce7f3;
          color: #9d174d;
        }

        .support-view-btn {
          border: 0;
          background: transparent;
          font-weight: 600;
          cursor: pointer;
        }

        .support-empty {
          text-align: center !important;
          padding: 45px !important;
          color: #737373;
        }

        .support-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
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
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
        }

        .support-modal-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .support-modal-header h2 {
          margin: 8px 0 0;
          font-size: 22px;
        }

        .support-close {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 50%;
          background: #f3f4f6;
          font-size: 22px;
          cursor: pointer;
        }

        .support-ticket-meta {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          padding: 18px;
          background: #f8f8f8;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .support-ticket-meta label {
          display: block;
          font-size: 12px;
          color: #737373;
          margin-bottom: 6px;
        }

        .support-ticket-meta select {
          width: 100%;
          border: 1px solid #ddd;
          border-radius: 7px;
          padding: 7px;
          background: white;
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
        }

        .support-customer {
          padding-bottom: 18px;
          border-bottom: 1px solid #eeeeee;
        }

        .support-customer p {
          margin: 0 0 4px;
          font-weight: 600;
        }

        .support-customer span {
          color: #737373;
          font-size: 14px;
        }

        .support-message {
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .support-message-customer {
          background: #f6f7f8;
        }

        .support-message-admin {
          background: #eef4ff;
        }

        .support-message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 7px;
          font-size: 13px;
        }

        .support-message-header span {
          color: #737373;
          font-size: 12px;
        }

        .support-message p {
          margin: 0;
          line-height: 1.5;
        }

        .support-no-messages {
          color: #737373;
        }

        .support-reply textarea {
          width: 100%;
          box-sizing: border-box;
          resize: vertical;
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 12px;
          font: inherit;
        }

        .support-reply button {
          margin-top: 10px;
          border: 0;
          border-radius: 9px;
          padding: 11px 20px;
          background: #111827;
          color: white;
          cursor: pointer;
        }

        .support-reply button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .support-modal-loading {
          padding: 50px;
          text-align: center;
          color: #737373;
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
