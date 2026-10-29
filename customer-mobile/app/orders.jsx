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

import { useAuth } from '../src/context/AuthContext';
import { getOrders } from '../src/services/orderService';
import { colors } from '../src/theme/colors';

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString();
}

function formatAmount(value, currency = 'INR') {
  const amount = Number(value);
  return `${currency} ${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
}

function OrderCard({ order, onPress }) {
  const status = String(order.status || 'pending').replaceAll('_', ' ');

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
        <View style={styles.orderTitleGroup}>
          <Text style={styles.orderNumber}>
            Order {order.order_number || order.id}
          </Text>
          <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.amountLabel}>Order total</Text>
          <Text style={styles.amount}>
            {formatAmount(order.total_amount, order.currency || 'INR')}
          </Text>
        </View>
        <View style={styles.detailsLink}>
          <Text style={styles.detailsText}>Details</Text>
          <Ionicons name="chevron-forward" size={17} color={colors.primary} />
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>My Orders</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !token ? (
        <View style={styles.center}>
          <Ionicons
            name="person-circle-outline"
            size={48}
            color={colors.primary}
          />
          <Text style={styles.emptyTitle}>Sign in to view your orders</Text>
          <Text style={styles.message}>
            Your order history is linked to your Aumveda account.
          </Text>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.actionButtonText}>Sign in</Text>
          </Pressable>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.message}>{error}</Text>
          <Pressable
            style={styles.actionButton}
            onPress={() => loadOrders()}
          >
            <Text style={styles.actionButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="bag-handle-outline"
            size={42}
            color={colors.primary}
          />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.message}>
            Your orders will appear here after checkout.
          </Text>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.actionButtonText}>Start shopping</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
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
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  headerSpacer: { width: 24 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  list: { padding: 20, gap: 12 },
  orderCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderCardPressed: { opacity: 0.82 },
  orderHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  orderTitleGroup: { flex: 1, gap: 5 },
  orderNumber: { color: colors.text, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.cream,
  },
  status: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderDate: { color: colors.textSecondary, fontSize: 12 },
  cardFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: { color: colors.textSecondary, fontSize: 11 },
  amount: { marginTop: 4, color: colors.text, fontWeight: '700' },
  detailsLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailsText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  emptyTitle: { marginTop: 14, color: colors.text, fontSize: 18, fontWeight: '700' },
  message: {
    marginTop: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  actionButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  actionButtonText: { color: colors.white, fontWeight: '700' },
});
