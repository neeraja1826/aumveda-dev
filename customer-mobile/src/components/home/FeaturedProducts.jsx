import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ProductCard from './ProductCard';

export default function FeaturedProducts({
  products = [],
  categories = [],
  selectedFilter: externalFilter,
  onFilterChange,
}) {
  const router = useRouter();
  const [internalFilter, setInternalFilter] = useState('all');
  const selectedFilter = externalFilter !== undefined ? externalFilter : internalFilter;

  const handleSelectFilter = (id) => {
    setInternalFilter(id);
    onFilterChange?.(id);
  };

  // Build filter pills from available categories or defaults
  const filterPills = useMemo(() => {
    const list = [{ id: 'all', name: 'Featured Products' }];

    if (Array.isArray(categories) && categories.length > 0) {
      categories.forEach((cat) => {
        if (cat?.name && !list.some((item) => item.name === cat.name)) {
          list.push({
            id: String(cat.id || cat.slug || cat.name),
            name: cat.name,
            slug: cat.slug,
          });
        }
      });
    }

    return list.slice(0, 7);
  }, [categories]);

  // Filter products based on selected pill
  const filteredProducts = useMemo(() => {
    if (selectedFilter === 'all') {
      return products;
    }

    const activePill = filterPills.find((p) => p.id === selectedFilter);
    const filterName = activePill?.name?.toLowerCase() || '';

    return products.filter((p) => {
      const pCatName = (p?.category?.name || p?.category_name || '').toLowerCase();
      const pName = (p?.name || '').toLowerCase();
      return pCatName.includes(filterName) || pName.includes(filterName);
    });
  }, [products, selectedFilter, filterPills]);

  if (!products.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* SECTION HEADER */}
      <View style={styles.headerRow}>
        <View>
          <View style={styles.eyebrowRow}>
            <Text style={styles.sparkle}>✦</Text>
            <Text style={styles.eyebrow}>CURATED BOTANICAL APOTHECARY</Text>
          </View>
          <Text style={styles.title}>Featured Products</Text>
        </View>

        <Pressable
          style={styles.viewAllBtn}
          onPress={() => router.push('/(tabs)/categories')}
          hitSlop={8}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={13} color="#123D2B" />
        </Pressable>
      </View>

      {/* FIRSTCLUB-STYLE HORIZONTAL CATEGORY FILTER PILLS */}
      {filterPills.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {filterPills.map((pill) => {
            const isSelected = selectedFilter === pill.id;
            return (
              <Pressable
                key={pill.id}
                style={[
                  styles.pill,
                  isSelected && styles.pillActive,
                ]}
                onPress={() => handleSelectFilter(pill.id)}
                hitSlop={4}
              >
                <Text
                  style={[
                    styles.pillText,
                    isSelected && styles.pillTextActive,
                  ]}
                >
                  {pill.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* 2-COLUMN PRODUCT GRID */}
      <View style={styles.grid}>
        {(filteredProducts.length > 0 ? filteredProducts : products).map(
          (product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => {
                if (product?.slug) {
                  router.push(`/products/${product.slug}`);
                }
              }}
            />
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 10,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },

  sparkle: {
    color: '#D9A52E',
    fontSize: 10,
  },

  eyebrow: {
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    letterSpacing: 1.8,
    color: '#D9A52E',
  },

  title: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 22,
    color: '#123D2B',
  },

  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DFD3',
  },

  viewAllText: {
    fontFamily: 'InterSemiBold',
    fontSize: 11,
    color: '#123D2B',
  },

  pillsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },

  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DFD3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  pillActive: {
    backgroundColor: '#123D2B',
    borderColor: '#123D2B',
  },

  pillText: {
    fontFamily: 'InterMedium',
    fontSize: 12,
    color: '#716F68',
  },

  pillTextActive: {
    fontFamily: 'InterSemiBold',
    color: '#FFFFFF',
  },

  grid: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});