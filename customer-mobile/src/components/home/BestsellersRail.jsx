import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function BestsellersRail({ products = [] }) {
  const router = useRouter();

  if (!products || products.length === 0) {
    return null;
  }

  // Display top products as bestsellers
  const bestsellers = products.slice(0, 8);

  return (
    <View style={styles.container}>
      {/* SECTION HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrowSparkle}>✦</Text>
            <Text style={styles.eyebrow}>MOST REORDERED BY MEMBERS</Text>
          </View>
          <Text style={styles.title}>Bestsellers</Text>
        </View>

        <Pressable
          style={styles.viewAllBtn}
          onPress={() => router.push('/(tabs)/categories')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="View all bestsellers"
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={13} color="#123D2B" />
        </Pressable>
      </View>

      {/* HORIZONTAL CAROUSEL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {bestsellers.map((item, index) => (
          <BestsellerCard
            key={item.id || index}
            product={item}
            rank={index + 1}
            onPress={() => {
              if (item?.slug) {
                router.push(`/products/${item.slug}`);
              }
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================================
// DEDICATED FIRSTCLUB-STYLE BESTSELLER CARD
// ============================================================

function BestsellerCard({
  product,
  rank,
  onPress,
}) {
  const {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const {
    isWishlisted,
    toggleWishlist,
  } = useWishlist();

  const variant = product?.variant ?? null;
  const variantId = variant?.id ?? null;
  const itemKey = `${product?.id}-${variantId ?? 'default'}`;

  const cartItem = cartItems.find((item) => item.itemKey === itemKey);
  const quantity = Number(cartItem?.quantity ?? 0);
  const isAdded = quantity > 0;

  const image =
    product?.image_url ??
    product?.image ??
    product?.thumbnail ??
    product?.images?.[0] ??
    product?.product_images?.find((img) => img?.is_primary)?.image_url ??
    product?.product_images?.[0]?.image_url ??
    null;

  const price = Number(
    product?.price ??
    product?.variant?.price ??
    0
  );

  const compareAtPrice = Number(
    product?.compare_at_price ??
    product?.variant?.compare_at_price ??
    0
  );

  const discount =
    compareAtPrice > price && price > 0
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  const handleAdd = (e) => {
    e?.stopPropagation?.();
    if (!product?.id) return;
    addToCart(product, 1, variant);
  };

  const handlePlus = (e) => {
    e?.stopPropagation?.();
    increaseQuantity(itemKey);
  };

  const handleMinus = (e) => {
    e?.stopPropagation?.();
    decreaseQuantity(itemKey);
  };

  const handleWishlist = (e) => {
    e?.stopPropagation?.();
    if (!product?.id) return;
    toggleWishlist(product);
  };

  const wishlisted = isWishlisted(product?.id);

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product?.name || 'Product'}, ₹${price}`}
    >
      {/* =====================================================
          IMAGE STAGE WITH ALIGNED BADGES & WISHLIST
      ===================================================== */}
      <View style={styles.imageStage}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.productImage}
            contentFit="contain"
            transition={200}
          />
        ) : (
          <View style={styles.placeholderWrap}>
            <Ionicons name="leaf-outline" size={30} color="#123D2B" />
          </View>
        )}

        {/* TOP-LEFT: RANK BADGE & READABLE DISCOUNT BADGE */}
        <View style={styles.badgeColumn}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>#{rank} BESTSELLER</Text>
          </View>

          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* TOP-RIGHT: PRECISELY ALIGNED WISHLIST BUTTON */}
        <Pressable
          style={({ pressed }) => [styles.wishlistBtn, pressed && styles.wishlistBtnPressed]}
          onPress={handleWishlist}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={16}
            color={wishlisted ? '#B94A48' : '#2D4435'}
          />
        </Pressable>
      </View>

      {/* =====================================================
          CARD CONTENT
      ===================================================== */}
      <View style={styles.content}>
        {/* PRODUCT NAME */}
        <Text style={styles.productName} numberOfLines={1}>
          {product?.name || 'Ayurvedic Product'}
        </Text>

        {/* PRICE ROW */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{price.toLocaleString('en-IN')}</Text>
          {compareAtPrice > price && (
            <Text style={styles.comparePrice}>₹{compareAtPrice.toLocaleString('en-IN')}</Text>
          )}
        </View>

        {/* ACTION BUTTON / STEPPER */}
        <View style={styles.actionWrap}>
          {!isAdded ? (
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && styles.btnPressed]}
              onPress={handleAdd}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Add to cart"
            >
              <Ionicons name="bag-add-outline" size={14} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add to Cart</Text>
            </Pressable>
          ) : (
            <View style={styles.stepperContainer}>
              <Pressable
                style={({ pressed }) => [styles.stepperBtn, pressed && styles.btnPressed]}
                onPress={handleMinus}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={15} color="#FFFFFF" />
              </Pressable>

              <Text style={styles.stepperValue}>{quantity}</Text>

              <Pressable
                style={({ pressed }) => [styles.stepperBtn, pressed && styles.btnPressed]}
                onPress={handlePlus}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={15} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    marginBottom: 8,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  headerTitleWrap: {
    flex: 1,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },

  eyebrowSparkle: {
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
    fontSize: 23,
    color: '#123D2B',
  },

  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
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

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },

  // ----------------------------------------------------------
  // CARD
  // ----------------------------------------------------------
  card: {
    width: 164,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5DFD3',
    overflow: 'hidden',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 234,
  },

  imageStage: {
    height: 120,
    backgroundColor: '#F5F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#E5DFD3',
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 0.5,
  },

  productImage: {
    width: '88%',
    height: '88%',
  },

  placeholderWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5DFD3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeColumn: {
    position: 'absolute',
    top: 7,
    left: 8,
    gap: 4,
    zIndex: 10,
  },

  rankBadge: {
    backgroundColor: '#123D2B',
    paddingHorizontal: 6.5,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D9A52E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },

  rankBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
    fontSize: 7.5,
    letterSpacing: 0.4,
    fontWeight: '700',
  },

  discountBadge: {
    backgroundColor: '#D9A52E',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },

  discountBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DFD3',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },

  wishlistBtnPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: '#F5F5F0',
  },

  // ----------------------------------------------------------
  // CONTENT
  // ----------------------------------------------------------
  content: {
    padding: 11,
    flex: 1,
    justifyContent: 'space-between',
  },

  productName: {
    fontFamily: 'InterSemiBold',
    fontSize: 13,
    color: '#123D2B',
    marginBottom: 4,
    lineHeight: 16,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 10,
  },

  price: {
    fontFamily: 'InterSemiBold',
    fontSize: 15,
    color: '#123D2B',
    fontWeight: '700',
  },

  comparePrice: {
    fontFamily: 'InterRegular',
    fontSize: 11.5,
    textDecorationLine: 'line-through',
    color: '#716F68',
  },

  // ----------------------------------------------------------
  // ACTION / STEPPER
  // ----------------------------------------------------------
  actionWrap: {
    width: '100%',
  },

  addBtn: {
    width: '100%',
    height: 35,
    borderRadius: 18,
    backgroundColor: '#123D2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  addBtnText: {
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
    fontSize: 11.5,
    fontWeight: '700',
  },

  stepperContainer: {
    width: '100%',
    height: 35,
    borderRadius: 18,
    backgroundColor: '#123D2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
  },

  stepperBtn: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepperValue: {
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
