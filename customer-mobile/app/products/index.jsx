import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProductCard from '../../src/components/home/ProductCard';
import { getProducts } from '../../src/services/productService';
import { colors } from '../../src/theme/colors';

export default function ProductsRoute() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadProducts = async () => {
    try {
      setError(null);

      const data = await getProducts({
        limit: 50,
        offset: 0,
      });

      console.log(
        'PRODUCTS PAGE DATA:',
        JSON.stringify(data, null, 2)
      );

      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Products page error:', err);
      setError(
        err?.message || 'Unable to load products.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
  }, []);

  const handleProductPress = (product) => {
    if (!product?.slug) {
      console.warn(
        'Product does not have a slug:',
        product
      );
      return;
    }

    router.push({
      pathname: '/products/[slug]',
      params: {
        slug: product.slug,
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.center}
        edges={['top', 'bottom']}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading products...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView
        style={styles.center}
        edges={['top', 'bottom']}
      >
        <Text style={styles.errorTitle}>
          Something went wrong
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          AUMVEDA COLLECTION
        </Text>

        <Text style={styles.title}>
          Shop Products
        </Text>

        <Text style={styles.subtitle}>
          Discover authentic Ayurvedic wellness
          products crafted for everyday living.
        </Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item, index) =>
          String(item?.id ?? item?.slug ?? index)
        }
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() =>
              handleProductPress(item)
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              No products found
            </Text>

            <Text style={styles.emptyText}>
              Products added to the database
              will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 18,
  },

  eyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    color: colors.textSecondary,
    marginBottom: 6,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
  },

  subtitle: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    maxWidth: 340,
  },

  list: {
    paddingHorizontal: 12,
    paddingBottom: 120,
  },

  row: {
    justifyContent: 'space-between',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },

  errorText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },

  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.textSecondary,
  },
});