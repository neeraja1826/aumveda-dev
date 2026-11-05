import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import ProductCard from './ProductCard';

export default function FeaturedProducts({
  products = [],
}) {
  const router = useRouter();

  if (!products || !products.length) {
    return null;
  }

  return (
    <View style={styles.outerContainer}>
      {/* CLEAN LUXURY IVORY / SILK SURFACE (NO TITLE) */}
      <LinearGradient
        colors={['#FCFAF7', '#F7F3EC', '#F2ECE2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientSurface}
      >
        {/* HORIZONTAL PRODUCT CAROUSEL */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalProductsScroll}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id || product.slug}
              product={product}
              compact={true}
              onPress={() => {
                if (product?.slug) {
                  router.push(`/products/${product.slug}`);
                }
              }}
            />
          ))}

          {/* VIEW ALL END CARD */}
          <Pressable 
            style={({ pressed }) => [
              styles.viewAllEndCard,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push('/(tabs)/categories')}
            accessibilityRole="button"
            accessibilityLabel="Explore all products"
          >
            <View style={styles.viewAllIconCircle}>
              <Ionicons name="arrow-forward" size={18} color="#123D2B" />
            </View>
            <Text style={styles.viewAllEndTitle}>View All</Text>
            <Text style={styles.viewAllEndSub}>Products</Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
  },

  /* CLEAN LUXURY SURFACE - FRAMES CARDS BEAUTIFULLY WITHOUT TITLE CLUTTER */
  gradientSurface: {
    width: '100%',
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: '#EDE5D8',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },

  horizontalProductsScroll: {
    paddingHorizontal: 12,
    gap: 12,
    alignItems: 'center',
  },

  /* VIEW ALL END CARD MATCHING COMPACT PRODUCT CARDS */
  viewAllEndCard: {
    width: 124,
    minHeight: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8E3D8',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },

  viewAllIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  viewAllEndTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 13,
    color: '#123D2B',
    fontWeight: '700',
  },

  viewAllEndSub: {
    fontFamily: 'InterMedium',
    fontSize: 10.5,
    color: '#8C4E3A',
    marginTop: 2,
  },
});
