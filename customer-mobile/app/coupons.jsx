import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { FALLBACK_COUPONS } from '../src/components/home/CouponsOffers';
import { getHomeData } from '../src/services/homeService';

const APPLIED_COUPON_STORAGE_KEY = '@aumveda_applied_coupon';

function formatDiscount(coupon) {
  if (coupon.discount_type === 'percentage') {
    return `${Number(coupon.discount_value)}%`;
  }
  if (coupon.discount_type === 'fixed_amount') {
    return `₹${Number(coupon.discount_value)}`;
  }
  return 'FREE';
}

export default function CouponsScreen() {
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const homeData = await getHomeData({ forceRefresh: true });
      setCoupons(
        Array.isArray(homeData?.coupons) && homeData.coupons.length > 0
          ? homeData.coupons
          : FALLBACK_COUPONS
      );
    } catch (loadError) {
      console.error('Load available coupons error:', loadError);
      setError(loadError?.message || 'Unable to load available coupons.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCoupons();
    }, [loadCoupons])
  );

  const handleCopy = async (coupon) => {
    try {
      await Clipboard.setStringAsync(coupon.code);
      await AsyncStorage.setItem(
        APPLIED_COUPON_STORAGE_KEY,
        JSON.stringify({
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          min_order_value: coupon.min_order_value,
        })
      );
      Alert.alert(
        'Coupon Copied',
        `${coupon.code} copied to clipboard. Use it at checkout to claim your offer.`
      );
    } catch (copyError) {
      console.error('Copy coupon error:', copyError);
      Alert.alert('Error', 'Unable to copy coupon code.');
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.safeHeaderArea}>
        <LinearGradient
          colors={['#FFF5F1', '#FFEFE7', '#FEE9E0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={handleBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color="#3D1E10" />
            </Pressable>
            <View style={styles.headerTitle}>
              <Text style={styles.eyebrow}>SAVE ON YOUR NEXT ORDER</Text>
              <Text style={styles.title}>Available Coupons</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.content}>
        {loading && coupons.length === 0 ? (
          <View style={styles.state}>
            <ActivityIndicator size="large" color="#123D2B" />
            <Text style={styles.message}>Loading available coupons...</Text>
          </View>
        ) : error && coupons.length === 0 ? (
          <View style={styles.state}>
            <Ionicons name="alert-circle-outline" size={34} color="#B94A48" />
            <Text style={styles.stateTitle}>Unable to load coupons</Text>
            <Text style={styles.message}>{error}</Text>
            <Pressable style={styles.actionButton} onPress={loadCoupons}>
              <Text style={styles.actionButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={loadCoupons}
                tintColor="#123D2B"
                colors={['#123D2B']}
              />
            }
          >
            {coupons.length === 0 ? (
              <View style={styles.state}>
                <Ionicons name="ticket-outline" size={34} color="#E07A2A" />
                <Text style={styles.stateTitle}>No coupons available</Text>
                <Text style={styles.message}>
                  Please check back later for new offers.
                </Text>
              </View>
            ) : (
              coupons.map((coupon, index) => {
                const discount = formatDiscount(coupon);
                const isDelivery = coupon.discount_type === 'free_shipping';
                return (
                  <Pressable
                    key={coupon.id || coupon.code || index}
                    accessibilityRole="button"
                    accessibilityLabel={`Copy coupon ${coupon.code}`}
                    onPress={() => handleCopy(coupon)}
                    style={({ pressed }) => [
                      styles.couponCard,
                      pressed && styles.couponPressed,
                    ]}
                  >
                    <View style={styles.discountBox}>
                      <Text style={styles.discount}>{discount}</Text>
                      <Text style={styles.discountLabel}>
                        {isDelivery ? 'DELIVERY' : 'OFF'}
                      </Text>
                    </View>
                    <View style={styles.couponInfo}>
                      <View style={styles.codeRow}>
                        <Text style={styles.code}>{coupon.code}</Text>
                        <Ionicons name="copy-outline" size={16} color="#3D1E10" />
                      </View>
                      <Text style={styles.description}>
                        {coupon.description ||
                          `Get discount on orders above ₹${coupon.min_order_value || 0}`}
                      </Text>
                      {Number(coupon.min_order_value) > 0 ? (
                        <Text style={styles.minimum}>
                          Minimum order ₹{Number(coupon.min_order_value).toLocaleString('en-IN')}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  safeHeaderArea: {
    backgroundColor: '#FFF5F1',
  },
  headerGradient: {
    paddingTop: 6,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: '#7A6257',
    fontWeight: '700',
  },
  title: {
    fontSize: 21,
    color: '#3D1E10',
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  list: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
  },
  couponCard: {
    minHeight: 112,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1DDD2',
    borderRadius: 18,
    overflow: 'hidden',
  },
  couponPressed: {
    opacity: 0.8,
  },
  discountBox: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1E8',
    borderRightWidth: 1,
    borderRightColor: '#EBD8CF',
  },
  discount: {
    color: '#A45124',
    fontSize: 25,
    fontWeight: '800',
  },
  discountLabel: {
    color: '#A45124',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  couponInfo: {
    flex: 1,
    justifyContent: 'center',
    padding: 14,
    gap: 5,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  code: {
    color: '#3D1E10',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  description: {
    color: '#6E625C',
    fontSize: 12,
    lineHeight: 17,
  },
  minimum: {
    color: '#8C776D',
    fontSize: 10,
    fontWeight: '600',
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  stateTitle: {
    color: '#3D1E10',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: '#716F68',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#123D2B',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
