import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';

import { useAuth } from '../src/context/AuthContext';
import {
  getOrders,
  getOrderReturnRequests,
} from '../src/services/orderService';
import { colors } from '../src/theme/colors';

function formatAmount(value, currency = 'INR') {
  const amount = Number(value);
  const formattedNumber = Number.isFinite(amount)
    ? amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00';
  return currency === 'INR' || currency === '₹'
    ? `₹${formattedNumber}`
    : `${currency} ${formattedNumber}`;
}

function formatDate(dateValue) {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusTheme(statusRaw) {
  const status = String(statusRaw || '').toLowerCase();

  if (status.includes('deliver') || status.includes('complete')) {
    return {
      bg: '#EAF6EA',
      border: '#C8E6C9',
      color: '#1B5E20',
      icon: 'checkmark-circle',
      label: 'Delivered',
    };
  }

  if (status.includes('cancel')) {
    return {
      bg: '#FEECEC',
      border: '#F8C8C8',
      color: '#C62828',
      icon: 'close-circle',
      label: 'Cancelled',
    };
  }

  if (status.includes('return')) {
    return {
      bg: '#FFF8E6',
      border: '#FFE0B2',
      color: '#E65100',
      icon: 'return-down-back',
      label: 'Returned',
    };
  }

  if (
    status.includes('ship') ||
    status.includes('transit') ||
    status.includes('dispatch') ||
    status.includes('out_for_delivery')
  ) {
    return {
      bg: '#E8F4F8',
      border: '#BEE3F0',
      color: '#0277BD',
      icon: 'cube',
      label: 'In Transit',
    };
  }

  if (status.includes('process') || status.includes('confirm')) {
    return {
      bg: '#F3E5F5',
      border: '#E1BEE7',
      color: '#7B1FA2',
      icon: 'time',
      label: 'Processing',
    };
  }

  return {
    bg: '#FFF8E1',
    border: '#FFE57F',
    color: '#B78103',
    icon: 'time',
    label: status.replaceAll('_', ' ') || 'Placed',
  };
}

function getReturnStatusTheme(statusRaw) {
  const status = String(statusRaw || '').trim().toLowerCase();
  const labels = {
    requested: 'Request received',
    under_review: 'Under review',
    approved: 'Approved',
    rejected: 'Rejected',
    pickup_scheduled: 'Pickup scheduled',
    item_received: 'Item received',
    replacement_processing: 'Replacement processing',
    refund_processing: 'Refund processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  if (status === 'rejected' || status === 'cancelled') {
    return {
      label: labels[status],
      backgroundColor: '#FDEEEE',
      borderColor: '#F7D7D7',
      color: '#B85C5C',
      icon: 'close-circle-outline',
    };
  }

  if (status === 'completed' || status === 'approved') {
    return {
      label: labels[status],
      backgroundColor: '#E8F2E7',
      borderColor: '#CDE2CB',
      color: '#123D2B',
      icon: 'checkmark-circle-outline',
    };
  }

  if (
    status === 'pickup_scheduled' ||
    status === 'item_received' ||
    status === 'replacement_processing' ||
    status === 'refund_processing'
  ) {
    return {
      label: labels[status],
      backgroundColor: '#EBF4F6',
      borderColor: '#BDE0E8',
      color: '#1C5B6B',
      icon: 'sync-outline',
    };
  }

  return {
    label:
      labels[status] ||
      (status ? status.replaceAll('_', ' ') : 'Status unavailable'),
    backgroundColor: '#FEF7E6',
    borderColor: '#EBDCB9',
    color: '#A87E34',
    icon: 'time-outline',
  };
}

function getLatestReturnRequestByOrder(requests) {
  return requests.reduce((latestByOrder, request) => {
    const orderId = request?.order_id;

    if (!orderId) {
      return latestByOrder;
    }

    const existing = latestByOrder.get(String(orderId));
    const requestTime = Date.parse(
      request.updated_at || request.created_at || ''
    );
    const existingTime = Date.parse(
      existing?.updated_at || existing?.created_at || ''
    );

    if (
      !existing ||
      (Number.isFinite(requestTime) &&
        (!Number.isFinite(existingTime) || requestTime > existingTime))
    ) {
      latestByOrder.set(String(orderId), request);
    }

    return latestByOrder;
  }, new Map());
}

function OrderCard({ order, returnRequest, onPress }) {
  const statusTheme = getStatusTheme(order.status);
  const returnStatusTheme = returnRequest
    ? getReturnStatusTheme(returnRequest.status)
    : null;
  const items = Array.isArray(order.items) ? order.items : [];
  const firstItem = items[0];

  const quantity = Number(firstItem?.quantity) || 1;
  const unitPrice = Number(firstItem?.unit_price) || 0;

  const itemPrice =
    firstItem?.total_price != null
      ? Number(firstItem.total_price)
      : unitPrice * quantity;

  const productName =
    firstItem?.product_name ||
    firstItem?.product?.name ||
    'Botanical Product';

  const productImages = firstItem?.product?.product_images || [];

  const productImage =
    firstItem?.image_url ||
    firstItem?.product?.image_url ||
    productImages.find((img) => img.is_primary)?.image_url ||
    productImages[0]?.image_url ||
    null;

  const variantName =
    firstItem?.variant_name ||
    firstItem?.variant?.name ||
    '';

  const orderDate = formatDate(order.created_at || order.order_date || order.date);

  const orderTotal = Number(
    order.total_amount ??
      order.total_price ??
      order.total ??
      order.grand_total ??
      items.reduce(
        (sum, it) =>
          sum +
          (Number(it.total_price) ||
            (Number(it.unit_price) || 0) * (Number(it.quantity) || 1)),
        0
      )
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.order_number || order.id}, ${statusTheme.label}`}
      style={({ pressed }) => [
        styles.orderCard,
        pressed && styles.orderCardPressed,
      ]}
    >
      {/* 1. TOP HEADER ROW: ORDER # & DATE ON LEFT, STATUS BADGE ON RIGHT */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.orderMetaCol}>
          <View style={styles.orderNumberRow}>
            <Ionicons name="receipt-outline" size={13.5} color="#123D2B" />
            <Text style={styles.orderNumberText} numberOfLines={1}>
              #{order.order_number || String(order.id).slice(0, 8)}
            </Text>
          </View>

          {orderDate ? (
            <Text style={styles.orderDateText}>{orderDate}</Text>
          ) : null}
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: statusTheme.bg,
              borderColor: statusTheme.border,
            },
          ]}
        >
          <Ionicons
            name={statusTheme.icon}
            size={11}
            color={statusTheme.color}
          />
          <Text
            style={[
              styles.statusText,
              { color: statusTheme.color },
            ]}
          >
            {statusTheme.label}
          </Text>
        </View>
      </View>

      {returnStatusTheme ? (
        <View
          style={[
            styles.returnStatusRow,
            {
              backgroundColor: returnStatusTheme.backgroundColor,
              borderColor: returnStatusTheme.borderColor,
            },
          ]}
        >
          <Ionicons
            name={returnStatusTheme.icon}
            size={14}
            color={returnStatusTheme.color}
          />
          <Text style={styles.returnStatusLabel}>
            {returnRequest.request_type === 'replacement'
              ? 'Replacement'
              : 'Return'}{' '}
            status:
          </Text>
          <Text
            style={[
              styles.returnStatusValue,
              { color: returnStatusTheme.color },
            ]}
            numberOfLines={1}
          >
            {returnStatusTheme.label}
          </Text>
        </View>
      ) : null}

      {/* HAIRLINE DIVIDER */}
      <View style={styles.cardDivider} />

      {/* 2. MAIN ITEM ROW: COMPACT THUMBNAIL + CONCISE PRODUCT DETAILS */}
      <View style={styles.productSection}>
        <View style={styles.thumbnailBox}>
          {productImage ? (
            <Image
              source={{ uri: productImage }}
              style={styles.productImage}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={150}
            />
          ) : (
            <View style={styles.productPlaceholder}>
              <Ionicons
                name="leaf-outline"
                size={24}
                color="#A3C9A8"
              />
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {productName}
          </Text>

          {variantName ? (
            <Text style={styles.variantName} numberOfLines={1}>
              {variantName}
            </Text>
          ) : null}

          <View style={styles.qtyPriceRow}>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyBadgeText}>Qty: {quantity}</Text>
            </View>

            <Text style={styles.productPrice}>
              {formatAmount(itemPrice, order.currency || 'INR')}
            </Text>
          </View>

          {items.length > 1 ? (
            <Text style={styles.moreItemsText}>
              +{items.length - 1} more {items.length - 1 === 1 ? 'item' : 'items'}
            </Text>
          ) : null}
        </View>
      </View>

      {/* HAIRLINE DIVIDER */}
      <View style={styles.cardDivider} />

      {/* 3. FOOTER ROW: TOTAL ORDER AMOUNT ON LEFT, DETAILS BUTTON ON RIGHT */}
      <View style={styles.cardFooter}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.totalAmount}>
            {formatAmount(orderTotal, order.currency || 'INR')}
          </Text>
        </View>

        <View style={styles.detailsButton}>
          <Text style={styles.detailsText}>View Details</Text>
          <Ionicons
            name="chevron-forward"
            size={13.5}
            color="#123D2B"
          />
        </View>
      </View>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [returnRequestsByOrder, setReturnRequestsByOrder] = useState(new Map());
  const [returnStatusError, setReturnStatusError] = useState('');

  const loadOrders = useCallback(async (isActive = () => true, isRefresh = false) => {
    if (!token) {
      setOrders([]);
      setReturnRequestsByOrder(new Map());
      setError(null);
      setReturnStatusError('');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setReturnStatusError('');

    try {
      const [ordersResult, returnRequestsResult] = await Promise.allSettled([
        getOrders(token),
        getOrderReturnRequests(token),
      ]);

      if (ordersResult.status === 'rejected') {
        throw ordersResult.reason;
      }

      if (isActive()) {
        setOrders(ordersResult.value);

        if (returnRequestsResult.status === 'fulfilled') {
          setReturnRequestsByOrder(
            getLatestReturnRequestByOrder(returnRequestsResult.value)
          );
        } else {
          console.error(
            'Load return request statuses error:',
            returnRequestsResult.reason
          );
          setReturnRequestsByOrder(new Map());
          setReturnStatusError(
            'Unable to load return request statuses. Pull to refresh.'
          );
        }
      }
    } catch (loadError) {
      console.error('Load orders error:', loadError);
      if (isActive()) {
        setError(loadError?.message || 'Unable to load your orders.');
      }
    } finally {
      if (isActive()) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadOrders(() => active);
      return () => {
        active = false;
      };
    }, [loadOrders])
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.safeHeaderArea}>
        <LinearGradient
          colors={['#EBF5EA', '#DEEFE0', '#D3E7D5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              hitSlop={10}
              style={({ pressed }) => [
                styles.circleButton,
                pressed && styles.circleButtonPressed,
              ]}
            >
              <Ionicons name="arrow-back" size={18} color="#123D2B" />
            </Pressable>

            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerEyebrow}>PURCHASE HISTORY</Text>
              <Text style={styles.title}>My Orders</Text>
            </View>

            {orders.length > 0 ? (
              <View style={styles.countBadge}>
                <Ionicons name="bag-check-outline" size={12.5} color="#123D2B" />
                <Text style={styles.countBadgeText}>
                  {orders.length}
                </Text>
              </View>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
        </LinearGradient>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.contentSafeArea}>
        {loading && !refreshing ? (
          <View style={styles.center}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#123D2B" />
              <Text style={styles.loadingText}>Loading your orders...</Text>
            </View>
          </View>
        ) : !token ? (
          <View style={styles.center}>
            <View style={styles.stateCard}>
              <View style={styles.stateIconOuter}>
                <View style={styles.stateIconInner}>
                  <Ionicons
                    name="person-outline"
                    size={30}
                    color="#123D2B"
                  />
                </View>
              </View>
              <Text style={styles.emptyTitle}>Sign In to View Orders</Text>
              <Text style={styles.message}>
                Your order history is securely linked to your Aumveda wellness account.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.actionButtonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <View style={styles.stateCard}>
              <View style={[styles.stateIconOuter, styles.errorIconOuter]}>
                <View style={[styles.stateIconInner, styles.errorIconInner]}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={30}
                    color={colors.danger}
                  />
                </View>
              </View>
              <Text style={styles.emptyTitle}>Unable to Load Orders</Text>
              <Text style={styles.message}>{error}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => loadOrders(undefined, false)}
              >
                <Ionicons name="refresh" size={15} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Try Again</Text>
              </Pressable>
            </View>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.stateCard}>
              <View style={styles.stateIconOuter}>
                <View style={styles.stateIconInner}>
                  <Ionicons
                    name="bag-handle-outline"
                    size={30}
                    color="#123D2B"
                  />
                </View>
              </View>
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.message}>
                Your curated Ayurvedic herbal purchases will appear here after checkout.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={styles.actionButtonText}>Explore Botanicals</Text>
                <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadOrders(undefined, true)}
                tintColor="#123D2B"
                colors={['#123D2B']}
              />
            }
          >
            {returnStatusError ? (
              <Text style={styles.returnStatusLoadError}>
                {returnStatusError}
              </Text>
            ) : null}
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                returnRequest={returnRequestsByOrder.get(String(order.id))}
                onPress={() => router.push(`/orders/${encodeURIComponent(order.id)}`)}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  safeHeaderArea: {
    backgroundColor: '#EBF5EA',
  },
  headerGradient: {
    width: '100%',
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderColor: '#CDE2CB',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    minHeight: 46,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  circleButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.85,
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerEyebrow: {
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    letterSpacing: 1.4,
    color: '#65776C',
    marginBottom: 1,
    fontWeight: '700',
  },
  title: {
    fontFamily: 'InterSemiBold',
    fontSize: 18,
    color: '#123D2B',
    fontWeight: '800',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#CDE2CB',
  },
  countBadgeText: {
    fontFamily: 'InterSemiBold',
    fontSize: 11.5,
    color: '#123D2B',
    fontWeight: '700',
  },
  headerSpacer: {
    width: 36,
  },
  contentSafeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontFamily: 'InterMedium',
    fontSize: 13,
    color: '#716F68',
  },
  stateCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAE5DC',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2.5,
  },
  stateIconOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stateIconInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1.5,
  },
  errorIconOuter: {
    backgroundColor: '#FDEEEE',
  },
  errorIconInner: {
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 17,
    color: '#123D2B',
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'InterRegular',
    fontSize: 12,
    color: '#716F68',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 20,
    backgroundColor: '#123D2B',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontFamily: 'InterSemiBold',
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  /* ORDERS LIST */
  list: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },

  /* PREMIUM ORDER CARD */
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: '#EAE5DC',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  orderCardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.94,
  },

  /* TOP HEADER ROW */
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  orderMetaCol: {
    flex: 1,
    gap: 2,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  orderNumberText: {
    fontFamily: 'InterSemiBold',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#123D2B',
  },
  orderDateText: {
    fontFamily: 'InterRegular',
    fontSize: 10.5,
    color: '#7E7A72',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: 'InterSemiBold',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  returnStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
  },
  returnStatusLabel: {
    color: '#716F68',
    fontFamily: 'InterMedium',
    fontSize: 10.5,
  },
  returnStatusValue: {
    flex: 1,
    fontFamily: 'InterSemiBold',
    fontSize: 10.5,
    textTransform: 'capitalize',
  },
  returnStatusLoadError: {
    color: colors.danger,
    fontFamily: 'InterMedium',
    fontSize: 11,
    paddingHorizontal: 4,
    paddingBottom: 2,
  },

  /* HAIRLINE CARD DIVIDER */
  cardDivider: {
    height: 1,
    backgroundColor: '#F0ECE4',
    width: '100%',
  },

  /* MAIN PRODUCT SECTION */
  productSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 11,
  },
  thumbnailBox: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: '#FAF8F4',
    borderWidth: 1,
    borderColor: '#EDE7DC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '90%',
    height: '90%',
  },
  productPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  productName: {
    fontFamily: 'InterSemiBold',
    fontSize: 13,
    lineHeight: 17,
    color: '#1A2E22',
    fontWeight: '700',
  },
  variantName: {
    fontFamily: 'InterRegular',
    fontSize: 10.5,
    color: '#7E7A72',
  },
  qtyPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  qtyBadge: {
    backgroundColor: '#F4F1EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  qtyBadgeText: {
    fontFamily: 'InterMedium',
    fontSize: 10.5,
    color: '#5C5850',
    fontWeight: '600',
  },
  productPrice: {
    fontFamily: 'InterSemiBold',
    fontSize: 13.5,
    color: '#123D2B',
    fontWeight: '700',
  },
  moreItemsText: {
    fontFamily: 'InterMedium',
    fontSize: 10,
    color: '#8C4E3A',
    fontWeight: '600',
    marginTop: 1,
  },

  /* CARD FOOTER */
  cardFooter: {
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalContainer: {
    gap: 1,
  },
  totalLabel: {
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    letterSpacing: 0.8,
    color: '#8E8A82',
    fontWeight: '700',
  },
  totalAmount: {
    fontFamily: 'InterSemiBold',
    fontSize: 14.5,
    color: '#123D2B',
    fontWeight: '800',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F2F7F2',
    borderWidth: 1,
    borderColor: '#CDE2CB',
  },
  detailsText: {
    fontFamily: 'InterSemiBold',
    fontSize: 11,
    color: '#123D2B',
    fontWeight: '700',
  },
});
