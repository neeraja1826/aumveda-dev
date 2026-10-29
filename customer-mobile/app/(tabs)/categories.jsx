
import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { getProducts } from '../../src/services/productService';
import { apiRequest } from '../../src/services/api';
import HomeHeader from '../../src/components/home/HomeHeader';
import ProductCard from '../../src/components/home/ProductCard';
import { colors } from '../../src/theme/colors';

export default function CategoriesScreen() {
  const router = useRouter();

  const {
    categoryId: routeCategoryId,
    categoryName: routeCategoryName,
  } = useLocalSearchParams();

  const paramCategoryId = Array.isArray(routeCategoryId)
    ? routeCategoryId[0]
    : routeCategoryId;

  const paramCategoryName = Array.isArray(routeCategoryName)
    ? routeCategoryName[0]
    : routeCategoryName;

  const initialCategoryId =
    paramCategoryId && paramCategoryId !== 'all'
      ? String(paramCategoryId)
      : '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedCategoryId, setSelectedCategoryId] =
    useState(initialCategoryId);

  const [selectedCategoryName, setSelectedCategoryName] =
    useState(paramCategoryName || 'All Products');

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');

  // Sync the selected filter when navigation supplies a category.
  const [prevParamCategoryId, setPrevParamCategoryId] =
    useState(paramCategoryId);
  if (prevParamCategoryId !== paramCategoryId) {
    setPrevParamCategoryId(paramCategoryId);
    const nextId =
      paramCategoryId && paramCategoryId !== 'all'
        ? String(paramCategoryId)
        : '';
    setSelectedCategoryId(nextId);
    setSelectedCategoryName(
      nextId ? paramCategoryName || 'Products' : 'All Products'
    );
  }

  // Load categories for the filter row.
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiRequest('/home/categories');
        const data = response?.data ?? [];

        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log('Products categories error:', err);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  // Load all products, or products from the selected category.
  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        setError('');

        const data = await getProducts({
          categoryId: selectedCategoryId || undefined,
          limit: 100,
          offset: 0,
        });

        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.log('Products loading error:', err);

        if (!cancelled) {
          setProducts([]);
          setError('Unable to load products. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId]);

  const getCategoryId = (category) =>
    category?.id ?? category?.category_id;

  const getCategoryName = (category) =>
    category?.name ??
    category?.category_name ??
    category?.title ??
    'Category';

  const selectCategory = (category) => {
    const id = getCategoryId(category);

    setSelectedCategoryId(id == null ? '' : String(id));
    setSelectedCategoryName(getCategoryName(category));
  };

  const renderListHeader = () => (
    <>
      {/* 2. Collection Filters Carousel */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeaderRow}>
          <Ionicons name="apps-outline" size={13} color="#0F3F2A" />
          <Text style={styles.filterTitle}>Explore Collections</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <Pressable
            style={({ pressed }) => [
              styles.filterChip,
              !selectedCategoryId && styles.filterChipActive,
              pressed && styles.filterChipPressed,
            ]}
            onPress={() => {
              setSelectedCategoryId('');
              setSelectedCategoryName('All Products');
            }}
          >
            {!selectedCategoryId && (
              <View style={styles.activeDot} />
            )}
            <Text
              style={[
                styles.filterText,
                !selectedCategoryId && styles.filterTextActive,
              ]}
            >
              All Products
            </Text>
          </Pressable>

          {categories.map((category, index) => {
            const id = getCategoryId(category);

            if (id == null) {
              return null;
            }

            const isSelected =
              selectedCategoryId === String(id);

            return (
              <Pressable
                key={String(id ?? index)}
                style={({ pressed }) => [
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                  pressed && styles.filterChipPressed,
                ]}
                onPress={() => selectCategory(category)}
              >
                {isSelected && (
                  <View style={styles.activeDot} />
                )}
                <Text
                  style={[
                    styles.filterText,
                    isSelected && styles.filterTextActive,
                  ]}
                >
                  {getCategoryName(category)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Results Header & Count Badge */}
      <View style={styles.resultsHeader}>
        <View style={styles.resultsLeft}>
          <Ionicons name="leaf" size={13} color="#C89B48" />
          <Text style={styles.resultsTitle}>
            {selectedCategoryName || 'All Products'}
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {loadingProducts
              ? 'Loading...'
              : `${products.length} Products`}
          </Text>
        </View>
      </View>
    </>
  );

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onPress={() => {
        if (item?.slug) {
          router.push(`/products/${item.slug}`);
        }
      }}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <HomeHeader />

      <FlatList
        key="products-grid"
        data={products}
        ListHeaderComponent={renderListHeader}
        renderItem={renderProduct}
        keyExtractor={(item, index) =>
          String(item?.id ?? item?.slug ?? index)
        }
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loadingProducts ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />
              <Text style={styles.stateText}>
                Loading products...
              </Text>
            </View>
          ) : (
            <View style={styles.stateContainer}>
              <Ionicons
                name={error ? 'alert-circle-outline' : 'leaf-outline'}
                size={38}
                color={colors.primary}
              />

              <Text style={styles.emptyTitle}>
                {error ? 'Something went wrong' : 'No products found'}
              </Text>

              <Text style={styles.stateText}>
                {error ||
                  'There are no products available in this category yet.'}
              </Text>

              {error ? (
                <Pressable
                  style={styles.retryButton}
                  onPress={() => {
                    setSelectedCategoryId((current) => current);
                    setError('');
                    setLoadingProducts(true);
                    // Trigger a fresh load by changing the filter.
                    setSelectedCategoryId((current) => current);
                  }}
                >
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },

  listContent: {
    paddingBottom: 32,
    paddingHorizontal: 16,
  },

  headerWrapper: {
    paddingTop: 10,
  },

  heroBanner: {
    backgroundColor: '#F1EFEA',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E6E1D6',
    marginBottom: 14,
  },

  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },

  heroEyebrow: {
    fontSize: 10,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#A87E34',
  },

  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'PlayfairSemiBold',
    fontWeight: '700',
    color: '#112D20',
    letterSpacing: 0.2,
  },

  heroSubtitle: {
    marginTop: 5,
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: 'InterRegular',
    color: '#68736B',
  },

  filterSection: {
    marginHorizontal: -16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ECE7DC',
    backgroundColor: '#F8F6F0',
  },

  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  filterTitle: {
    fontSize: 13,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#163826',
  },

  filters: {
    paddingHorizontal: 16,
    gap: 8,
  },

  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2DDD2',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1A2E22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },

  filterChipActive: {
    backgroundColor: '#0F3F2A',
    borderColor: '#D4AF37',
  },

  filterChipPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.88,
  },

  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D4AF37',
    marginRight: 6,
  },

  filterText: {
    fontSize: 12,
    fontFamily: 'InterMedium',
    fontWeight: '600',
    color: '#3A4C40',
  },

  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  resultsHeader: {
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  resultsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 10,
  },

  resultsTitle: {
    fontSize: 16,
    fontFamily: 'PlayfairSemiBold',
    fontWeight: '700',
    color: '#142C1E',
  },

  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 63, 42, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(15, 63, 42, 0.12)',
  },

  countText: {
    fontSize: 11,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#0F3F2A',
  },

  productRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  stateContainer: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },

  stateText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'InterRegular',
    textAlign: 'center',
    color: '#727B75',
  },

  emptyTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairSemiBold',
    fontWeight: '700',
    color: '#163826',
  },

  retryButton: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#0F3F2A',
  },

  retryText: {
    fontSize: 13,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
