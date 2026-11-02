import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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

import { useAuth } from '../src/context/AuthContext';
import { getOrders } from '../src/services/orderService';
import { colors } from '../src/theme/colors';

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
}

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

function getStatusTheme(statusRaw) {
  const s = String(statusRaw || '').toLowerCase();
  if (s.includes('deliver') || s.includes('complete')) {
    return {
      bg: '#E8F2E7',
      border: '#CDE2CB',
      color: '#123D2B',
      icon: 'checkmark-circle-outline',
    };
  }
  if (s.includes('cancel')) {
    return {
      bg: '#FDEEEE',
      border: '#F7D7D7',
      color: '#B85C5C',
      icon: 'close-circle-outline',
    };
  }
  if (s.includes('return')) {
    return {
      bg: '#FEF7E6',
      border: '#EBDCB9',
      color: '#A87E34',
      icon: 'return-down-back-outline',
    };
  }
  if (s.includes('ship') || s.includes('transit')) {
    return {
      bg: '#EBF4F6',
      border: '#BDE0E8',
      color: '#1C5B6B',
      icon: 'car-outline',
    };
  }
  return {
    bg: '#FEF7E6',
    border: '#EBDCB9',
    color: '#8A6510',
    icon: 'time-outline',
  };
}

function OrderCard({ order, onPress }) {
  const status = String(order.status || 'placed').replaceAll('_', ' ');
  const statusTheme = getStatusTheme(order.status);
  const itemsCount = Array.isArray(order.items) ? order.items.length : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.order_number || order.id}, ${status}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.orderCard,
        pressed && styles.orderCardPressed,
      ]}
    >
      <View style={styles.orderHeading}>
        <View style={styles.orderIconWrap}>
          <Ionicons name="receipt-outline" size={19} color="#123D2B" />
        </View>

        <View style={styles.orderTitleGroup}>
          <Text style={styles.orderNumber}>
            Order #{order.order_number || order.id}
          </Text>
          <View style={styles.orderMetaRow}>
            <Ionicons name="calendar-outline" size={12} color="#716F68" />
            <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
            {itemsCount > 0 ? (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.orderItemsCount}>
                  {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusTheme.bg, borderColor: statusTheme.border },
          ]}
        >
          <Ionicons
            name={statusTheme.icon}
            size={12}
            color={statusTheme.color}
            style={styles.statusIcon}
          />
          <Text style={[styles.status, { color: statusTheme.color }]}>
            {status}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.amountLabel}>ORDER TOTAL</Text>
          <Text style={styles.amount}>
            {formatAmount(order.total_amount, order.currency || 'INR')}
          </Text>
        </View>

        <View style={styles.detailsButton}>
          <Text style={styles.detailsText}>View Details</Text>
          <Ionicons name="chevron-forward" size={14} color="#123D2B" />
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
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async (isActive = () => true) => {
    if (!token) {
      setOrders([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getOrders(token);
      if (isActive()) setOrders(result);
    } catch (loadError) {
      console.error('Load orders error:', loadError);
      if (isActive()) {
        setError(loadError?.message || 'Unable to load your orders.');
      }
    } finally {
      if (isActive()) setLoading(false);
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
          colors={['#E5F2E4', '#D9EAD7', '#CDE2CB']}
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
              <Ionicons name="arrow-back" size={20} color="#123D2B" />
            </Pressable>

            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerEyebrow}>PURCHASE HISTORY</Text>
              <Text style={styles.title}>My Orders</Text>
            </View>

            {orders.length > 0 ? (
              <View style={styles.countBadge}>
                <Ionicons name="bag-check-outline" size={13} color="#123D2B" />
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
        {loading ? (
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
                    size={34}
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
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
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
                    size={34}
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
                onPress={() => loadOrders()}
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
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
                    size={34}
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
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
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
    backgroundColor: '#F5F1E8',
  },
  safeHeaderArea: {
    backgroundColor: '#E5F2E4',
  },
  headerGradient: {
    width: '100%',
    paddingTop: 6,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderWidth: 0.2,
    borderColor: '#276345',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F4E7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  circleButtonPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: '#F5F5F0',
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
    color: '#716F68',
    marginBottom: 2,
    fontWeight: '700',
  },
  title: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 21,
    color: '#123D2B',
    fontWeight: '700',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 0.8,
    borderColor: '#CDE2CB',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  countBadgeText: {
    fontFamily: 'InterSemiBold',
    fontSize: 12,
    color: '#123D2B',
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  contentSafeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'InterMedium',
    fontSize: 13,
    color: '#716F68',
  },
  stateCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EFE6',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  stateIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F2E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stateIconInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  errorIconOuter: {
    backgroundColor: '#FDEEEE',
  },
  errorIconInner: {
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 19,
    color: '#123D2B',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'InterRegular',
    fontSize: 12.5,
    color: '#716F68',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 24,
    backgroundColor: '#123D2B',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  actionButtonText: {
    fontFamily: 'InterSemiBold',
    fontSize: 13.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  list: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  orderCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EFE6',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  orderHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  orderIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E8F2E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTitleGroup: {
    flex: 1,
    gap: 3,
  },
  orderNumber: {
    fontFamily: 'InterSemiBold',
    fontSize: 14,
    color: '#123D2B',
    fontWeight: '700',
  },
  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderDate: {
    fontFamily: 'InterRegular',
    fontSize: 11.5,
    color: '#716F68',
  },
  metaDot: {
    fontSize: 10,
    color: '#716F68',
    marginHorizontal: 1,
  },
  orderItemsCount: {
    fontFamily: 'InterRegular',
    fontSize: 11.5,
    color: '#716F68',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 14,
    borderWidth: 0.8,
  },
  statusIcon: {
    marginRight: -1,
  },
  status: {
    fontFamily: 'InterSemiBold',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8EFE6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontFamily: 'InterSemiBold',
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: '#716F68',
    fontWeight: '600',
  },
  amount: {
    marginTop: 2,
    fontFamily: 'InterSemiBold',
    fontSize: 15.5,
    color: '#123D2B',
    fontWeight: '700',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F5F4E7',
    borderWidth: 0.8,
    borderColor: '#D9EAD7',
  },
  detailsText: {
    fontFamily: 'InterSemiBold',
    fontSize: 11.5,
    color: '#123D2B',
    fontWeight: '700',
  },
});
