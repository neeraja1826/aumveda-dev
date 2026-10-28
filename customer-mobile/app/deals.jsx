import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import ProductCard from '../src/components/home/ProductCard';
import { getProducts } from '../src/services/productService';
import { useCart } from '../src/context/CartContext';

export default function DealsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { cartCount } = useCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const bannerWidth = Math.min(width - 20, 640);
  const bannerHeight = Math.round(bannerWidth / (761 / 328));

  const fetchDeals = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      setError(null);
      const allProducts = await getProducts({ limit: 60 });
      const list = Array.isArray(allProducts) ? allProducts : [];

      // Filter products on deal: compare_at_price > price
      const deals = list.filter((p) => {
        const price = Number(p.price ?? p.variant?.price ?? 0);
        const compare = Number(p.compare_at_price ?? p.variant?.compare_at_price ?? 0);
        return compare > price;
      });

      setProducts(deals.length > 0 ? deals : list.slice(0, 16));
    } catch (err) {
      console.error('Error loading deals:', err);
      setError(err?.message || 'Unable to load deals.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getProducts({ limit: 60 })
      .then((allProducts) => {
        if (!isMounted) return;
        const list = Array.isArray(allProducts) ? allProducts : [];
        const deals = list.filter((p) => {
          const price = Number(p.price ?? p.variant?.price ?? 0);
          const compare = Number(p.compare_at_price ?? p.variant?.compare_at_price ?? 0);
          return compare > price;
        });
        setProducts(deals.length > 0 ? deals : list.slice(0, 16));
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || 'Unable to load deals.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = () => {
    fetchDeals(true);
  };

  const handleProductPress = (product) => {
    if (product?.slug) {
      router.push(`/products/${product.slug}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* TOP NAVIGATION HEADER */}
      <View style={styles.headerBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#123D2B" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Deals of the Week</Text>
          <Text style={styles.headerSubtitle}>Exclusive Ayurvedic Offers</Text>
        </View>

        <Pressable
          onPress={() => router.push('/cart')}
          style={({ pressed }) => [styles.cartBtn, pressed && styles.pressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Cart with ${cartCount} items`}
        >
          <Ionicons name="cart-outline" size={23} color="#123D2B" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount > 99 ? '99+' : cartCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* PRODUCTS LIST */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#123D2B" />
          <Text style={styles.loadingText}>Loading deals...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => fetchDeals(false)}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) => String(item?.id ?? item?.slug ?? index)}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#123D2B"
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {/* DEALS BANNER */}
              <View
                style={[
                  styles.bannerContainer,
                  { width: bannerWidth, height: bannerHeight },
                ]}
              >
                <Image
                  source={require('../assets/Deals-of-the-week.png')}
                  style={styles.bannerImage}
                  resizeMode="contain"
                />
              </View>

              {/* TICKER */}
              <View style={styles.tickerBar}>
                <Text style={styles.tickerText}>
                  ✦ UP TO 40% OFF  •  LIMITED TIME ONLY  •  FREE DISPATCH ✦
                </Text>
              </View>

              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Featured Deal Products</Text>
                <Text style={styles.itemsCount}>{products.length} Items</Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleProductPress(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetag-outline" size={48} color="#9BB5A5" />
              <Text style={styles.emptyTitle}>No deals active right now</Text>
              <Text style={styles.emptySubtitle}>
                Check back soon for new weekly offers on Ayurvedic essentials.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F3ED',
  },

  /* HEADER BAR */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E1D5',
    backgroundColor: '#FFFFFF',
  },

  backBtn: {
    padding: 4,
  },

  headerTitleWrap: {
    alignItems: 'center',
  },

  headerTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 18,
    color: '#123D2B',
    fontWeight: '700',
  },

  headerSubtitle: {
    fontFamily: 'InterMedium',
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#716F68',
    marginTop: 1,
  },

  cartBtn: {
    padding: 4,
    position: 'relative',
  },

  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D9A52E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  cartBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
    fontSize: 8.5,
    fontWeight: '800',
  },

  pressed: {
    opacity: 0.7,
  },

  /* LIST STYLES */
  listContent: {
    paddingBottom: 28,
  },

  listHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },

  bannerContainer: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },

  tickerBar: {
    width: '92%',
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F2E7',
    borderWidth: 1,
    borderColor: 'rgba(18, 61, 43, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  tickerText: {
    fontFamily: 'InterSemiBold',
    fontSize: 10,
    letterSpacing: 1,
    color: '#123D2B',
  },

  sectionHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },

  sectionTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 19,
    color: '#123D2B',
    fontWeight: '700',
  },

  itemsCount: {
    fontFamily: 'InterMedium',
    fontSize: 12,
    color: '#716F68',
  },

  row: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    fontFamily: 'InterMedium',
    fontSize: 14,
    color: '#716F68',
  },

  errorText: {
    fontFamily: 'InterRegular',
    fontSize: 14,
    color: '#B85C5C',
    textAlign: 'center',
    marginBottom: 12,
  },

  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#123D2B',
  },

  retryText: {
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
    fontSize: 13,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },

  emptyTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 18,
    color: '#123D2B',
    marginTop: 12,
    marginBottom: 4,
  },

  emptySubtitle: {
    fontFamily: 'InterRegular',
    fontSize: 13,
    color: '#716F68',
    textAlign: 'center',
  },
});
