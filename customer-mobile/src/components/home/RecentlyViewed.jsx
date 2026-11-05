import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';

import { useAuth } from '../../context/AuthContext';
import {
  getRecentlyViewed,
} from '../../services/recentlyViewedService';
import { getBuyAgainProducts } from '../../services/orderService';

export default function RecentlyViewed({ products: fallbackProducts = [] }) {
  const router = useRouter();
  const { token, isAuthenticated, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('recent');
  const [products, setProducts] = useState([]);
  const [buyAgainProducts, setBuyAgainProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    if (authLoading || !isAuthenticated || !token) {
      setProducts([]);
      setBuyAgainProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let recentItems = [];

      try {
        const remote = await getRecentlyViewed(token);

        if (Array.isArray(remote)) {
          recentItems = remote;
        }
      } catch (error) {
        console.log('Recently Viewed API error:', error.message);
      }

      if (recentItems.length === 0 && fallbackProducts.length > 0) {
        recentItems = fallbackProducts.slice(0, 8);
      }

      setProducts(recentItems.slice(0, 8));

      try {
        const previousPurchases = await getBuyAgainProducts(token);

        setBuyAgainProducts(
          Array.isArray(previousPurchases)
            ? previousPurchases
                .filter((item) => item?.product)
                .map((item) => ({
                  ...item.product,
                  image_url:
                    item.product.image_url ||
                    item.product.image ||
                    item.product.thumbnail ||
                    item.product.images?.[0] ||
                    null,
                  variant: item.variant,
                  last_purchased_at: item.last_purchased_at,
                  purchase_count: item.purchase_count,
                }))
                .slice(0, 8)
            : []
        );
      } catch (error) {
        console.log('Buy Again API error:', error.message);
        setBuyAgainProducts([]);
      }
    } catch (error) {
      console.log('Continue Shopping error:', error.message);
      setProducts([]);
      setBuyAgainProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated, authLoading, fallbackProducts]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  if (authLoading || !isAuthenticated) {
    return null;
  }

  const activeProducts =
    activeTab === 'recent' ? products : buyAgainProducts;

  if (loading && products.length === 0 && buyAgainProducts.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#123D2B" size="small" />
      </View>
    );
  }

  if (!products.length && !buyAgainProducts.length) {
    return null;
  }

  return (
    <View style={styles.outerContainer}>
      <LinearGradient
        colors={['#EDF6ED', '#E5F2E5', '#DFEEDF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientSurface}
      >
        {/* HEADER ROW: CLOCK ICON + "Recently Viewed" + "View All →" BUTTON */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons
              name="time-outline"
              size={24}
              color="#2E7D32"
              style={styles.clockIcon}
            />
            <Text style={styles.title}>Recently Viewed</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              activeTab === 'buyAgain'
                ? 'View all orders'
                : 'View all recently viewed products'
            }
            onPress={() =>
              router.push(
                activeTab === 'buyAgain' ? '/orders' : '/recently-viewed'
              )
            }
            style={({ pressed }) => [
              styles.viewAllBtn,
              pressed && styles.cubeCardPressed,
            ]}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="arrow-forward" size={12} color="#123D2B" />
          </Pressable>
        </View>

        {/* TAB SWITCHER (ONLY IF BUY AGAIN ITEMS EXIST) */}
        {buyAgainProducts.length > 0 && (
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => setActiveTab('recent')}
              style={[
                styles.tabButton,
                activeTab === 'recent' && styles.activeTabButton,
              ]}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={activeTab === 'recent' ? '#FFFFFF' : '#45634C'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'recent' && styles.activeTabText,
                ]}
              >
                Recently Viewed
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('buyAgain')}
              style={[
                styles.tabButton,
                activeTab === 'buyAgain' && styles.activeTabButton,
              ]}
            >
              <Ionicons
                name="refresh-outline"
                size={14}
                color={activeTab === 'buyAgain' ? '#FFFFFF' : '#45634C'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'buyAgain' && styles.activeTabText,
                ]}
              >
                Buy Again
              </Text>
            </Pressable>
          </View>
        )}

        {/* HORIZONTAL SCROLL OF SMALL WHITE CUBE CARDS */}
        {loading && activeProducts.length === 0 ? (
          <ActivityIndicator
            color="#123D2B"
            size="small"
            style={{ paddingVertical: 20 }}
          />
        ) : activeProducts.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {activeProducts.map((product, index) => {
              const image =
                product?.image_url ??
                product?.image ??
                product?.thumbnail ??
                product?.images?.[0] ??
                product?.image_urls?.[0] ??
                product?.product_images?.find(
                  (img) => img?.is_primary
                )?.image_url ??
                product?.product_images?.[0]?.image_url ??
                null;

              const productName =
                product.name || product.product_name || 'Product';

              return (
                <Pressable
                  key={product.id || product.slug || index}
                  style={({ pressed }) => [
                    styles.cubeCard,
                    pressed && styles.cubeCardPressed,
                  ]}
                  onPress={() => {
                    if (product.slug) {
                      router.push(`/products/${product.slug}`);
                    } else if (product.id) {
                      router.push(`/products/${product.id}`);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={productName}
                >
                  <View style={styles.imageWrap}>
                    {image ? (
                      <Image
                        source={{ uri: image }}
                        style={styles.productImage}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                        transition={150}
                      />
                    ) : (
                      <View style={styles.imageFallback}>
                        <Ionicons
                          name="leaf-outline"
                          size={26}
                          color="#C0DCC0"
                        />
                      </View>
                    )}
                  </View>

                  <Text style={styles.productName} numberOfLines={2}>
                    {productName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>
            {activeTab === 'recent'
              ? 'Your recently viewed products will appear here.'
              : 'Your previously purchased products will appear here.'}
          </Text>
        )}
      </LinearGradient>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    paddingHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
  },

  gradientSurface: {
    width: '100%',
    borderRadius: 24,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D4E9D5',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },

  loadingContainer: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* HEADER ROW */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  clockIcon: {
    marginRight: 0,
  },

  title: {
    fontFamily: 'InterSemiBold',
    fontSize: 18.5,
    fontWeight: '800',
    color: '#123D2B',
    letterSpacing: -0.2,
  },

  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8EBD9',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  viewAllText: {
    fontFamily: 'InterSemiBold',
    fontSize: 11.5,
    fontWeight: '700',
    color: '#123D2B',
  },

  /* HORIZONTAL SCROLL */
  scrollContent: {
    paddingRight: 6,
    gap: 10,
    alignItems: 'center',
  },

  /* SMALL CUBE CARD (PURE WHITE WITH NAME & IMAGE ONLY) */
  cubeCard: {
    width: 88,
    height: 118,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2EBE2',
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1.5,
  },

  cubeCardPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },

  imageWrap: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* PRODUCT NAME ONLY (2 LINES MAX) */
  productName: {
    fontFamily: 'InterSemiBold',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: '#1B2E24',
    textAlign: 'center',
    paddingHorizontal: 2,
    minHeight: 26,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#DCEBDD',
    padding: 3,
    borderRadius: 14,
    marginBottom: 12,
  },

  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 11,
  },

  activeTabButton: {
    backgroundColor: '#245B38',
  },

  tabText: {
    fontFamily: 'InterSemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#45634C',
  },

  activeTabText: {
    color: '#FFFFFF',
  },

  emptyText: {
    textAlign: 'center',
    color: '#718276',
    fontSize: 12,
    paddingVertical: 20,
  },
});
