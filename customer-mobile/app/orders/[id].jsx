import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/context/AuthContext';
import { getOrder } from '../../src/services/orderService';
import { colors } from '../../src/theme/colors';
import OrderTracking from '../../src/components/orders/OrderTracking';
function formatAmount(value, currency = 'INR') {
  const amount = Number(value);
  return `${currency} ${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
}

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString();
}

function DetailRow({ label, value, emphasized = false }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, emphasized && styles.totalValue]}>
        {value}
      </Text>
    </View>
  );
}


function addressLines(order) {
  const address = order?.shipping_address;

  if (!address || typeof address !== 'object') {
    return [];
  }

  return [
    address.recipient_name,
    address.phone,
    address.address_line1,
    address.address_line2,
    [address.city, address.state, address.postal_code]
      .filter(Boolean)
      .join(', '),
    address.country,
  ].filter(Boolean);
}


export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const orderId = Array.isArray(id) ? id[0] : id;
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    getOrder(token, orderId)
      .then((result) => {
        if (active) {
          setOrder(result);
          setError('');
        }
      })
      .catch((loadError) => {
        console.error('Load order details error:', loadError);
        if (active) {
          setError(loadError?.message || 'Unable to load order details.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId, retryKey, token]);

  const currency = order?.currency || 'INR';
const items = Array.isArray(order?.items) ? order.items : [];
  const shippingLines = order ? addressLines(order) : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back to orders"
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={23} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading order details…</Text>
        </View>
      ) : !token ? (
        <View style={styles.center}>
          <Text style={styles.message}>Sign in to view this order.</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </Pressable>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={42} color={colors.danger} />
          <Text style={styles.message}>{error}</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              setLoading(true);
              setRetryKey((key) => key + 1);
            }}
          >
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : !order ? (
        <View style={styles.center}>
          <Text style={styles.message}>This order could not be found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <OrderTracking status={order.status} />
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="bag-check-outline" size={25} color={colors.primary} />
            </View>
            <Text style={styles.orderNumber}>
              Order {order.order_number || order.id}
            </Text>
            <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {String(order.status || 'pending').replaceAll('_', ' ')}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items</Text>
            {items.length === 0 ? (
              <Text style={styles.helperText}>No item details were provided for this order.</Text>
            ) : items.map((item, index) => {
              const quantity = Number(item.quantity) || 0;
              const unitPrice = Number(item.unit_price) || 0;
             const lineTotal = item.total_price == null
  ? unitPrice * quantity
  : Number(item.total_price);
              const imageUrl = typeof item.image_url === 'string'
                ? item.image_url.trim()
                : '';

              return (
                <View
                  key={item.id || `${item.product_id || 'item'}-${index}`}
                  style={[styles.itemRow, index > 0 && styles.itemDivider]}
                >
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productPlaceholder}>
                      <Ionicons name="leaf-outline" size={21} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.itemDescription}>
                    <Text style={styles.itemName}>
                      {item.product_name || item.product_id || 'Product'}
                    </Text>
                    {item.variant_name ? (
                      <Text style={styles.helperText}>{item.variant_name}</Text>
                    ) : null}
                    <Text style={styles.itemMeta}>
                      {quantity} × {formatAmount(unitPrice, currency)}
                    </Text>
                  </View>
                  <Text style={styles.lineTotal}>
                    {formatAmount(lineTotal, currency)}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment summary</Text>
            <DetailRow label="Subtotal" value={formatAmount(order.subtotal, currency)} />
            {Number(order.discount) > 0 ? (
  <DetailRow
    label="Discount"
    value={`− ${formatAmount(order.discount, currency)}`}
  />
) : null}
            {Number(order.discount_amount) > 0 ? (
              <DetailRow
                label="Discount"
                value={`− ${formatAmount(order.discount_amount, currency)}`}
              />
            ) : null}
            <View style={styles.totalDivider} />
            <DetailRow
              label="Total"
              value={formatAmount(order.total_amount, currency)}
              emphasized
            />
            <DetailRow
              label="Payment method"
              value={String(order.payment_method || '—').replaceAll('_', ' ')}
            />
            <DetailRow
              label="Payment status"
              value={String(order.payment_status || '—').replaceAll('_', ' ')}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery address</Text>
            {shippingLines.length > 0 ? shippingLines.map((line, index) => (
              <Text
                key={`${index}-${line}`}
                style={[styles.addressLine, index === 0 && styles.addressName]}
              >
                {line}
              </Text>
            )) : (
              <Text style={styles.helperText}>No delivery address was provided.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 32, alignItems: 'flex-start' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  headerSpacer: { width: 32 },
  content: { padding: 16, paddingBottom: 28, gap: 14 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  summaryCard: {
    alignItems: 'center',
    padding: 22,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  orderNumber: {
    marginTop: 12,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  orderDate: { marginTop: 5, color: colors.textSecondary, fontSize: 12 },
  statusBadge: {
    marginTop: 12,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.cream,
  },
  statusText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  card: {
    padding: 17,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    marginBottom: 13,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 5 },
  itemDivider: {
    paddingTop: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  productImage: { width: 54, height: 54, borderRadius: 10, backgroundColor: colors.cream },
  productPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  itemDescription: { flex: 1, gap: 4 },
  itemName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  helperText: { color: colors.textSecondary, fontSize: 12 },
  itemMeta: { color: colors.textSecondary, fontSize: 11 },
  lineTotal: { color: colors.text, fontSize: 12, fontWeight: '700' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  detailLabel: { color: colors.textSecondary, fontSize: 12 },
  detailValue: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 12,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  totalDivider: {
    marginVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalValue: { fontSize: 14, fontWeight: '700' },
  addressLine: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  addressName: { color: colors.text, fontWeight: '700' },
  message: {
    marginTop: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  primaryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.white, fontWeight: '700' },
});
