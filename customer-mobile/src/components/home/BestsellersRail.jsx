import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

import AuthRequiredModal from '../common/AuthRequiredModal';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function BestsellersRail({ products = [] }) {
  const router = useRouter();

  if (!products || products.length === 0) {
    return null;
  }

  // Display top products as bestsellers from props
  const bestsellers = products.slice(0, 8);

  return (
    <View style={styles.outerContainer}>
      {/* SOFT HERBAL MIST LUXURY GRADIENT SURFACE */}
      <LinearGradient
        colors={ [ '#F7F3EC', '#D9E6D4', '#C6DABE' ] }
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.gradientSurface}
      >
        {/* SUBTLE BOTANICAL SPARKLE WATERMARK */}
        <View style={styles.watermarkWrap} pointerEvents="none">
          <Ionicons
            name="sparkles"
            size={70}
            color="rgba(197, 154, 69, 0.08)"
          />
        </View>

        {/* LUXURY SECTION HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeftCol}>
            {/* Eyebrow Pill Badge */}
            <View style={styles.eyebrowBadge}>
              <Ionicons name="sparkles" size={10} color="#C59A45" />
              <Text style={styles.eyebrowText}>MOST REORDERED BY MEMBERS</Text>
            </View>

            {/* Title with Gold Accent & Signature Underline */}
            <View style={styles.titleWrap}>
              <Text style={styles.title}>
                Best<Text style={styles.titleGold}>sellers</Text>
              </Text>
              <View style={styles.goldUnderline} />
            </View>
          </View>

          {/* VIEW ALL PILL BUTTON */}
          <Pressable
            style={({ pressed }) => [
              styles.viewAllBtn,
              pressed && styles.viewAllBtnPressed,
            ]}
            onPress={() => router.push('/(tabs)/categories')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="View all bestsellers"
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="arrow-forward" size={12} color="#113B29" />
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
              key={item.id || item.slug || index}
              product={item}
              rank={index + 1}
              onPress={() => {
                if (item?.slug) {
                  router.push(`/products/${item.slug}`);
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
            accessibilityLabel="Explore all bestsellers"
          >
            <View style={styles.viewAllIconCircle}>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.viewAllEndTitle}>View All</Text>
            <Text style={styles.viewAllEndSub}>Bestsellers</Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
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
    isAuthenticated,
    token,
    loading: authLoading,
  } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const requireLogin = () => {
    if (authLoading) return false;

    if (!isAuthenticated || !token) {
      setShowAuthModal(true);
      return false;
    }

    return true;
  };

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
    4.8
  );

  const reviews = Number(
    product?.review_count ??
    product?.reviews_count ??
    product?.reviews ??
    124
  );

  const handleAdd = (e) => {
    e?.stopPropagation?.();
    if (!requireLogin()) return;
    if (!product?.id) return;
    addToCart(product, 1, variant);
  };

  const handlePlus = (e) => {
    e?.stopPropagation?.();
    if (!requireLogin()) return;
    increaseQuantity(itemKey);
  };

  const handleMinus = (e) => {
    e?.stopPropagation?.();
    if (!requireLogin()) return;
    decreaseQuantity(itemKey);
  };

  const handleWishlist = (e) => {
    e?.stopPropagation?.();
    if (!requireLogin()) return;
    if (!product?.id) return;
    toggleWishlist(product);
  };

  const handleBuyNow = (e) => {
    e?.stopPropagation?.();
    if (!requireLogin()) return;
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
  const subtitle = variant?.name || product?.size || product?.weight || product?.category_name || '100% Ayurvedic';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product?.name || 'Product'}, ₹${price}`}
    >
      {/* IMAGE AREA: NATURAL WHITESPACE ON CLEAN WARM IVORY STAGE */}
      <View style={styles.imageStage}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.productImage}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <View style={styles.placeholderWrap}>
            <Ionicons name="leaf-outline" size={32} color="#CDE2CB" />
          </View>
        )}

        {/* TOP-LEFT: PRESTIGE RANK OR DISCOUNT BADGE */}
        <View style={styles.badgeWrap}>
          {discount > 0 ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>Save {discount}%</Text>
            </View>
          ) : (
            <View style={styles.rankBadge}>
              <Text style={styles.rankBadgeText}>★ #{rank} Bestseller</Text>
            </View>
          )}
        </View>

        {/* TOP-RIGHT: FLOATING WISHLIST CIRCLE PILL */}
        <Pressable
          style={({ pressed }) => [
            styles.wishlistBtn,
            pressed && styles.wishlistBtnPressed,
          ]}
          onPress={handleWishlist}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={16}
            color={wishlisted ? '#E53935' : '#716F68'}
          />
        </Pressable>
      </View>

      {/* CARD CONTENT */}
      <View style={styles.content}>
        {/* SUBTITLE / CATEGORY TAG */}
        <Text style={styles.categoryTag} numberOfLines={1}>
          {subtitle}
        </Text>

        {/* PRODUCT NAME */}
        <Text style={styles.productName} numberOfLines={2}>
          {product?.name || 'Ayurvedic Product'}
        </Text>

        {/* PRICE + RATING ROW */}
        <View style={styles.priceRatingRow}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{price.toLocaleString('en-IN')}</Text>
            {compareAtPrice > price && (
              <Text style={styles.comparePrice}>
                ₹{compareAtPrice.toLocaleString('en-IN')}
              </Text>
            )}
          </View>

          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={10} color="#D9A52E" />
            <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
            {reviews > 0 && (
              <Text style={styles.reviewText} numberOfLines={1}>
                ({reviews})
              </Text>
            )}
          </View>
        </View>

        {/* ACTION BUTTONS: ADD TO CART (WITH STEPPER) + BUY NOW */}
        <View style={styles.actionButtonsRow}>
          {!isAdded ? (
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                pressed && styles.btnPressed,
              ]}
              onPress={handleAdd}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Add to cart"
            >
              <Ionicons name="add" size={13} color="#FFFFFF" />
              <Text
                style={styles.addBtnText}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Add
              </Text>
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
                <Ionicons name="remove" size={12} color="#123D2B" />
              </Pressable>

              <Text style={styles.stepperValue}>{quantity}</Text>

              <Pressable
                style={styles.stepperBtn}
                onPress={handlePlus}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={12} color="#123D2B" />
              </Pressable>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.buyNowBtn,
              pressed && styles.buyNowBtnPressed,
            ]}
            onPress={handleBuyNow}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Buy now"
          >
            <Text
              style={styles.buyNowText}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Buy Now
            </Text>
          </Pressable>
        </View>
      </View>

      <AuthRequiredModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </Pressable>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    paddingHorizontal: 2,
    marginTop: 10,
    marginBottom: 14,
  },

  /* SOFT HERBAL MIST LUXURY GRADIENT SURFACE */
  gradientSurface: {
    width: '100%',
    borderRadius: 6,
    paddingTop: 16,
    paddingBottom: 16,
    borderWidth: 1.2,
    borderColor: '#DFE7DC',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },

  watermarkWrap: {
    position: 'absolute',
    top: -10,
    right: 8,
    zIndex: 0,
  },

  /* HEADER - LUXURY SECTION HEADER */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 14,
    zIndex: 1,
  },

  headerLeftCol: {
    alignItems: 'flex-start',
  },

  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(197, 154, 69, 0.10)',
    paddingHorizontal: 6,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C59A45',
    marginTop: -8,
    marginBottom: 4,
  },

  eyebrowText: {
    fontFamily: 'InterSemiBold',
    fontSize: 6,
    letterSpacing: 1.2,
    color: '#7C5318',
    fontWeight: '700',
  },

  titleWrap: {
    alignItems: 'flex-start',
  },

  title: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
    color: '#123D2B',
    letterSpacing: 0.1,
  },

  titleGold: {
    color: '#C58F1D',
  },

  goldUnderline: {
    width: 38,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#C58F1D',
    marginTop: 3,
  },

  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#E2DCD2',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  viewAllBtnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },

  viewAllText: {
    fontFamily: 'InterSemiBold',
    fontSize: 11.5,
    color: '#113B29',
    fontWeight: '700',
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 2,
    gap: 12,
    zIndex: 1,
  },

  /* LUXURY PRODUCT CARD */
  card: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#E8E3D8',
    padding: 10,
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    justifyContent: 'space-between',
  },

  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },

  /* IMAGE STAGE - CLEAN WARM IVORY STAGE */
  imageStage: {
    width: '100%',
    height: 130,
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 8,
  },

  productImage: {
    width: '88%',
    height: '88%',
  },

  placeholderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeWrap: {
    position: 'absolute',
    top: 6,
    left: 6,
    zIndex: 2,
  },

  rankBadge: {
    backgroundColor: '#C58F1D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: '#C58F1D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },

  rankBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    letterSpacing: 0.3,
    fontWeight: '700',
    fontFamily: 'InterSemiBold',
  },

  discountBadge: {
    backgroundColor: '#1B4D2B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: '#1B4D2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },

  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: 'InterSemiBold',
    letterSpacing: 0.2,
  },

  wishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 0.8,
    borderColor: '#EFE7DA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },

  wishlistBtnPressed: {
    transform: [{ scale: 0.9 }],
  },

  /* CONTENT */
  content: {
    paddingTop: 2,
  },

  categoryTag: {
    fontFamily: 'InterMedium',
    fontSize: 9.5,
    color: '#8A7B6B',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  productName: {
    fontFamily: 'InterSemiBold',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: '#1A2E22',
    minHeight: 34,
  },

  priceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -16,
    marginBottom: 8,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },

  price: {
    fontFamily: 'InterSemiBold',
    fontSize: 15.5,
    fontWeight: '800',
    color: '#123D2B',
  },

  comparePrice: {
    fontFamily: 'InterRegular',
    fontSize: 11,
    color: '#8E8A82',
    textDecorationLine: 'line-through',
  },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: '#F3E5C8',
  },

  ratingValue: {
    fontFamily: 'InterSemiBold',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#123D2B',
  },

  reviewText: {
    fontFamily: 'InterMedium',
    fontSize: 9,
    color: '#716F68',
  },

  /* ACTION BUTTONS: DUAL ACTION (ADD / STEPPER + BUY NOW) */
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    marginTop: 2,
  },

  addBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 32,
    borderRadius: 16,
    backgroundColor: '#123D2B',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 4,
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1.5,
  },

  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  addBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: 'InterSemiBold',
    textAlign: 'center',
  },

  buyNowBtn: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#C58F1D',
    backgroundColor: '#884129',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  buyNowBtnPressed: {
    opacity: 0.88,
    backgroundColor: '#F3EADB',
    transform: [{ scale: 0.98 }],
  },

  buyNowText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700', 
    fontFamily: 'InterSemiBold',
    textAlign: 'center',
  },

  stepperContainer: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#123D2B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },

  stepperBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EAF3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepperValue: {
    color: '#123D2B',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'InterSemiBold',
  },

  /* VIEW ALL END CARD */
  viewAllEndCard: {
    width: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#E8E3D8',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },

  viewAllIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#123D2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
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
    color: '#C58F1D',
    marginTop: 2,
  },
});
