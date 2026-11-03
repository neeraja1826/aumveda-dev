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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { useAuth } from '../../context/AuthContext';
import {
  getRecentlyViewed,
  getLocalRecentlyViewed,
} from '../../services/recentlyViewedService';

export default function RecentlyViewed({ products: fallbackProducts = [] }) {
  const router = useRouter();
  const { token } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRecentlyViewed = useCallback(async () => {
    try {
      setLoading(true);
      let items = [];

      // 1. Try fetching from backend if authenticated
      if (token) {
        const remote = await getRecentlyViewed(token);
        if (Array.isArray(remote) && remote.length > 0) {
          items = remote;
        }
      }

      // 2. Fetch from local storage (actual viewed products in this app session)
      const local = await getLocalRecentlyViewed();
      if (Array.isArray(local) && local.length > 0) {
        const seen = new Set(items.map((x) => String(x.id || x.slug)));
        local.forEach((loc) => {
          const key = String(loc.id || loc.slug);
          if (!seen.has(key)) {
            items.push(loc);
            seen.add(key);
          }
        });
      }

      // 3. If user has viewed products, show them. Otherwise use existing products from app.
      if (items.length > 0) {
        setProducts(items);
      } else if (Array.isArray(fallbackProducts) && fallbackProducts.length > 0) {
        setProducts(fallbackProducts.slice(0, 6));
      } else {
        setProducts([]);
      }
    } catch {
      if (Array.isArray(fallbackProducts) && fallbackProducts.length > 0) {
        setProducts(fallbackProducts.slice(0, 6));
      } else {
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [token, fallbackProducts]);

  // Refresh whenever Home screen becomes active
  useFocusEffect(
    useCallback(() => {
      loadRecentlyViewed();
    }, [loadRecentlyViewed])
  );

  // If still loading and no products yet
  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#123D2B" size="small" />
      </View>
    );
  }

  // If there are no products at all, return null
  if (!products.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* SECTION HEADER */}
      <View style={styles.header}>
        <View style={styles.headingWrap}>
          <View style={styles.eyebrowRow}>
            <Ionicons name="time-outline" size={11} color="#8C5338" />
            <Text style={styles.eyebrow}>RECENTLY VIEWED</Text>
          </View>

          <Text style={styles.title}>Recently Viewed</Text>
          <Text style={styles.subtitle}>Pick up where you left off</Text>
        </View>

        <Pressable
          onPress={loadRecentlyViewed}
          style={styles.refreshButton}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Refresh recently viewed"
        >
          <Ionicons name="refresh-outline" size={16} color="#123D2B" />
        </Pressable>
      </View>

      {/* HORIZONTAL CUBES CAROUSEL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {products.map((product) => {
          // Resolve image directly from existing product data
          const image =
            product?.image_url ??
            product?.image ??
            product?.thumbnail ??
            product?.images?.[0] ??
            product?.image_urls?.[0] ??
            product?.product_images?.find((img) => img?.is_primary)?.image_url ??
            product?.product_images?.[0]?.image_url ??
            null;

          return (
            <Pressable
              key={product.id || product.slug}
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
              accessibilityLabel={product.name}
            >
              {/* CUBE IMAGE BOX (1:1 RATIO) */}
              <View style={styles.imageBox}>
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
                    <MaterialCommunityIcons
                      name="leaf"
                      size={28}
                      color="#B8CEBA"
                    />
                  </View>
                )}
              </View>

              {/* ONLY PRODUCT NAME */}
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 14,
    marginBottom: 10,
  },

  loadingContainer: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headingWrap: {
    flex: 1,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },

  eyebrow: {
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    letterSpacing: 1.2,
    color: '#8C5338',
    fontWeight: '700',
  },

  title: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 20,
    color: '#123D2B',
    fontStyle: 'italic',
    lineHeight: 24,
  },

  subtitle: {
    fontFamily: 'InterRegular',
    fontSize: 11,
    color: '#6E6A60',
    marginTop: 1,
  },

  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DEC8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingRight: 8,
    gap: 10,
    alignItems: 'flex-start',
  },

  /* SMALL CUBE CARD */
  cubeCard: {
    width: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE1D3',
    padding: 6,
    alignItems: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  cubeCardPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },

  /* 1:1 SQUARE IMAGE BOX */
  imageBox: {
    width: 82,
    height: 82,
    backgroundColor: '#FAF8F4',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 4,
  },

  productImage: {
    width: '92%',
    height: '92%',
  },

  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ONLY PRODUCT NAME */
  productName: {
    marginTop: 6,
    fontFamily: 'InterMedium',
    fontSize: 10,
    lineHeight: 13.5,
    color: '#123D2B',
    textAlign: 'center',
    paddingHorizontal: 2,
    minHeight: 27,
  },
});
