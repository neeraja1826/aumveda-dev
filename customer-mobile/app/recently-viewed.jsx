import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import ProductCard from '../src/components/home/ProductCard';
import { useAuth } from '../src/context/AuthContext';
import { getRecentlyViewed } from '../src/services/recentlyViewedService';

export default function RecentlyViewedScreen() {
  const router = useRouter();
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = useCallback(async (isActive = () => true) => {
    if (authLoading) return;

    if (!isAuthenticated || !token) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const recentProducts = await getRecentlyViewed(token, 20);
      if (isActive()) {
        setProducts(Array.isArray(recentProducts) ? recentProducts : []);
      }
    } catch (loadError) {
      console.error('Load recently viewed products error:', loadError);
      if (isActive()) {
        setError(
          loadError?.message || 'Unable to load recently viewed products.'
        );
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [authLoading, isAuthenticated, token]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadProducts(() => active);
      return () => {
        active = false;
      };
    }, [loadProducts])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#123D2B" />
          <Text style={styles.message}>Loading your recently viewed products...</Text>
        </View>
      );
    }

    if (!isAuthenticated || !token) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={34} color="#123D2B" />
          <Text style={styles.emptyTitle}>Sign in to view your history</Text>
          <Text style={styles.message}>
            Recently viewed products are saved to your account.
          </Text>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.actionButtonText}>Sign In</Text>
          </Pressable>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={34} color="#B94A48" />
          <Text style={styles.emptyTitle}>Unable to load products</Text>
          <Text style={styles.message}>{error}</Text>
          <Pressable style={styles.actionButton} onPress={() => loadProducts()}>
            <Text style={styles.actionButtonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="time-outline" size={34} color="#123D2B" />
        <Text style={styles.emptyTitle}>No recently viewed products</Text>
        <Text style={styles.message}>
          Products you view will appear here.
        </Text>
      </View>
    );
  };

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
              onPress={handleBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color="#123D2B" />
            </Pressable>
            <View style={styles.headerTitle}>
              <Text style={styles.eyebrow}>YOUR BROWSING HISTORY</Text>
              <Text style={styles.title}>Recently Viewed</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.content}>
        <FlatList
          data={products}
          keyExtractor={(item, index) =>
            String(item?.id ?? item?.slug ?? index)
          }
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => {
                if (item?.slug) router.push(`/products/${item.slug}`);
                else if (item?.id) router.push(`/products/${item.id}`);
              }}
            />
          )}
          numColumns={2}
          columnWrapperStyle={products.length > 1 ? styles.productRow : undefined}
          contentContainerStyle={[
            styles.listContent,
            products.length === 0 && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading && products.length > 0}
              onRefresh={() => loadProducts()}
              tintColor="#123D2B"
              colors={['#123D2B']}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
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
    backgroundColor: '#E5F2E4',
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
    backgroundColor: '#F5F4E7',
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
    color: '#716F68',
    fontWeight: '700',
  },
  title: {
    fontSize: 21,
    color: '#123D2B',
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  emptyTitle: {
    color: '#123D2B',
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
