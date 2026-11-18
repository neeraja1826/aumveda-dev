import { Mail, MapPin, Package } from 'lucide-react';
import '../styles/order-notification-details.css';

function getAddressLines(address) {
  if (typeof address === 'string') {
    return [address];
  }

  if (!address || typeof address !== 'object') {
    return [];
  }

  return [
    address.recipient_name,
    address.address_line1,
    address.address_line2,
    [
      address.city,
      address.state,
      address.postal_code,
    ].filter(Boolean).join(', '),
    address.country,
    address.phone ? `Phone: ${address.phone}` : null,
  ].filter((line) => typeof line === 'string' && line.trim());
}

function formatAmount(amount, currency) {
  if (amount === null || amount === undefined || amount === '') {
    return '—';
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return '—';
  }

  const options = currency
    ? { style: 'currency', currency }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  return new Intl.NumberFormat('en-IN', options).format(numericAmount);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN');
}

export default function OrderNotificationDetails({ order }) {
  if (!order) return null;

  const shippingAddress = getAddressLines(order.shipping_address);
  const billingAddress = getAddressLines(order.billing_address);
  const orderItems = Array.isArray(order.order_items)
    ? order.order_items
    : [];
  const orderTotal = order.total_amount ?? order.total;
  const customerName =
    order.customer_name ||
    order.shipping_address?.recipient_name ||
    '—';

  return (
    <div className="notification-order-details">
      <div className="notification-order-overview">
        <div>
          <span>Order</span>
          <strong>{order.order_number || order.id || '—'}</strong>
        </div>
        <div>
          <span>Customer</span>
          <strong>{customerName || '—'}</strong>
        </div>
        {order.created_at && (
          <div>
            <span>Placed</span>
            <strong>{formatDate(order.created_at)}</strong>
          </div>
        )}
        {order.status && (
          <div>
            <span>Status</span>
            <strong>{order.status}</strong>
          </div>
        )}
        {order.payment_status && (
          <div>
            <span>Payment</span>
            <strong>{order.payment_status}</strong>
          </div>
        )}
        {orderTotal !== null && orderTotal !== undefined && (
          <div>
            <span>Total</span>
            <strong>{formatAmount(orderTotal, order.currency)}</strong>
          </div>
        )}
      </div>

      <div className="notification-order-section">
        <h3>
          <MapPin size={15} />
          Shipping address
        </h3>
        {shippingAddress.length > 0 ? (
          <address>
            {shippingAddress.map((line, index) => (
              <span key={`${line}-${index}`}>{line}</span>
            ))}
          </address>
        ) : (
          <p>Shipping address unavailable.</p>
        )}
      </div>

      {billingAddress.length > 0 && (
        <div className="notification-order-section">
          <h3>
            <MapPin size={15} />
            Billing address
          </h3>
          <address>
            {billingAddress.map((line, index) => (
              <span key={`${line}-${index}`}>{line}</span>
            ))}
          </address>
        </div>
      )}

      <div className="notification-order-section">
        <h3>
          <Package size={15} />
          Products
        </h3>
        {orderItems.length > 0 ? (
          <ul className="notification-order-products">
            {orderItems.map((item) => (
              <li key={item.id}>
                {item.image_url ? (
                  <img src={item.image_url} alt="" />
                ) : (
                  <span className="notification-order-product-placeholder">
                    <Package size={16} />
                  </span>
                )}
                <span className="notification-order-product-name">
                  <strong>
                    {item.product_name || item.product_id || '—'}
                  </strong>
                  {item.variant_name && <small>{item.variant_name}</small>}
                </span>
                <span>×{item.quantity ?? '—'}</span>
                {item.total_price !== null &&
                  item.total_price !== undefined && (
                    <strong>
                      {formatAmount(item.total_price, order.currency)}
                    </strong>
                  )}
              </li>
            ))}
          </ul>
        ) : (
          <p>Order products unavailable.</p>
        )}
      </div>

      {order.customer_email && (
        <div className="notification-order-customer-contact">
          <Mail size={15} />
          <span>{order.customer_email}</span>
        </div>
      )}
    </div>
  );
}
