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
  const router = useRouter();

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

  const rating = Number(
    product?.rating ??
    product?.average_rating ??
    4.6
  );

  const reviews = Number(
    product?.review_count ??
    product?.reviews_count ??
    product?.reviews ??
    0
  );

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

  const handleBuyNow = (e) => {
    e?.stopPropagation?.();
    if (!product?.id) return;
    router.push({
      pathname: '/checkout',
      params: {
        buyNow: 'true',
        productId: String(product.id),
        productSlug: String(product.slug || ''),
        variantId: variantId ? String(variantId) : '',
        quantity: '1',
      },
    });
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
          IMAGE AREA (DIRECT ON CARD - NO SEPARATE BOX)
      ===================================================== */}
      <View style={styles.imageStage}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.productImage}
            contentFit="contain"
            transition={150}
          />
        ) : (
          <View style={styles.placeholderWrap}>
            <Ionicons name="leaf-outline" size={28} color="#CDE2CB" />
          </View>
        )}

        {/* TOP-LEFT: RANK / DISCOUNT BADGE OVERLAY */}
        <View style={styles.badgeWrap}>
          {discount > 0 ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
            </View>
          ) : (
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>#{rank} BESTSELLER</Text>
            </View>
          )}
        </View>

        {/* TOP-RIGHT: WISHLIST BUTTON OVERLAY */}
        <Pressable
          style={({ pressed }) => [styles.wishlistBtn, pressed && styles.wishlistBtnPressed]}
          onPress={handleWishlist}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={18}
            color={wishlisted ? '#B94A48' : '#716F68'}
          />
        </Pressable>
      </View>

      {/* =====================================================
          CARD CONTENT (DESCRIPTION REMOVED AS REQUESTED)
      ===================================================== */}
      <View style={styles.content}>
        {/* PRODUCT NAME */}
        <Text style={styles.productName} numberOfLines={2}>
          {product?.name || 'Ayurvedic Product'}
        </Text>

        {/* PRICE + RATING ROW */}
        <View style={styles.priceRatingRow}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{price.toLocaleString('en-IN')}</Text>
            {compareAtPrice > price && (
              <Text style={styles.comparePrice}>₹{compareAtPrice.toLocaleString('en-IN')}</Text>
            )}
          </View>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={11} color="#D9A52E" />
            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
            {reviews > 0 && (
              <Text style={styles.reviewText} numberOfLines={1}>{reviews} reviews</Text>
            )}
          </View>
        </View>

        {/* ACTION BUTTONS: ADD TO CART + BUY NOW */}
        <View style={styles.actionButtonsRow}>
          {!isAdded ? (
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && styles.btnPressed]}
              onPress={handleAdd}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Add to cart"
            >
              <Text style={styles.addBtnText} numberOfLines={1} adjustsFontSizeToFit>Add to Cart</Text>
            </Pressable>
          ) : (
            <View style={styles.stepperContainer}>
              <Pressable
                style={styles.stepperBtn}
                onPress={handleMinus}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={14} color="#123D2B" />
              </Pressable>

              <Text style={styles.stepperValue}>{quantity}</Text>

              <Pressable
                style={styles.stepperBtn}
                onPress={handlePlus}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={14} color="#123D2B" />
              </Pressable>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.buyNowBtn, pressed && styles.btnPressed]}
            onPress={handleBuyNow}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Buy now"
          >
            <Text style={styles.buyNowText} numberOfLines={1} adjustsFontSizeToFit>Buy Now</Text>
          </Pressable>
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
    fontWeight: '700',
  },

  title: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 23,
    color: '#123D2B',
    fontWeight: '700',
  },

  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },

  viewAllText: {
    fontFamily: 'InterSemiBold',
    fontSize: 11,
    color: '#123D2B',
    fontWeight: '600',
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
    width: 176,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8E3D8',
    padding: 10,
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
  },

  // ----------------------------------------------------------
  // IMAGE AREA (NO SEPARATE BOX CONTAINER)
  // ----------------------------------------------------------
  imageStage: {
    width: '100%',
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  productImage: {
    width: '94%',
    height: '94%',
  },

  placeholderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeWrap: {
    position: 'absolute',
    top: 2,
    left: 2,
    zIndex: 2,
  },

  rankBadge: {
    backgroundColor: '#123D2B',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 8,
  },

  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    letterSpacing: 0.4,
    fontWeight: '700',
  },

  discountBadge: {
    backgroundColor: '#E8F2E7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
  },

  discountBadgeText: {
    color: '#123D2B',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  wishlistBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  wishlistBtnPressed: {
    transform: [{ scale: 0.9 }],
  },

  // ----------------------------------------------------------
  // CONTENT
  // ----------------------------------------------------------
  content: {
    paddingTop: 4,
  },

  productName: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: '#123D2B',
  },

  // ----------------------------------------------------------
  // PRICE & RATING ROW
  // ----------------------------------------------------------
  priceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },

  price: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#123D2B',
  },

  comparePrice: {
    fontSize: 10.5,
    color: '#8F8D85',
    textDecorationLine: 'line-through',
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  ratingValue: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#123D2B',
  },

  reviewText: {
    fontSize: 9.5,
    color: '#716F68',
  },

  // ----------------------------------------------------------
  // ACTION BUTTONS: ADD TO CART + BUY NOW
  // ----------------------------------------------------------
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
  },

  addBtn: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2E5A34',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  buyNowBtn: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.2,
    borderColor: '#2E5A34',
    backgroundColor: '#884129',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  buyNowText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  stepperContainer: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8F2E7',
    borderWidth: 1,
    borderColor: '#CDE2CB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
  },

  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepperValue: {
    color: '#123D2B',
    fontSize: 11.5,
    fontWeight: '800',
  },
});
