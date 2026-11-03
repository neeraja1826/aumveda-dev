import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Animated,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(175, Math.round(SCREEN_WIDTH * 0.46));
const CARD_GAP = 10;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const SIDE_SPACER = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const LOOPS_COUNT = 7;
const CENTER_SET = 3;

const FALLBACK_NEW_ARRIVALS = [
  {
    id: 'bhringraj-hair-oil',
    name: 'Bhringraj Hair Oil',
    slug: 'bhringraj-hair-oil',
    price: 349,
    compare_at_price: 399,
    discount_percentage: 13,
    rating: 4.8,
    review_count: 126,
    image_url: 'https://images.unsplash.com/photo-1608248597359-0091ef7e6f8a?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'herbal-hair-mask',
    name: 'Herbal Hair Mask',
    slug: 'herbal-hair-mask',
    price: 499,
    compare_at_price: 599,
    discount_percentage: 17,
    rating: 4.7,
    review_count: 98,
    image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'immunity-boost-capsules',
    name: 'Immunity Boost Capsules',
    slug: 'immunity-boost-capsules',
    price: 499,
    compare_at_price: 599,
    discount_percentage: 17,
    rating: 4.9,
    review_count: 210,
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'kumkumadi-face-serum',
    name: 'Kumkumadi Face Serum',
    slug: 'kumkumadi-face-serum',
    price: 699,
    compare_at_price: 799,
    discount_percentage: 13,
    rating: 4.9,
    review_count: 142,
    image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
  },
];

export default function JustArrived({ products = [] }) {
  const router = useRouter();
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const baseProducts = useMemo(() => {
    return Array.isArray(products) && products.length > 0
      ? products
      : FALLBACK_NEW_ARRIVALS;
  }, [products]);

  const N = baseProducts.length;
  const initialIndex = N > 1 ? CENTER_SET * N : 0;
  const initialOffset = initialIndex * SNAP_INTERVAL;

  const scrollX = useRef(new Animated.Value(initialOffset)).current;

  // Build the looped array of products
  const loopedProducts = useMemo(() => {
    if (N <= 1) return baseProducts;
    const items = [];
    for (let set = 0; set < LOOPS_COUNT; set++) {
      baseProducts.forEach((item, itemIdx) => {
        items.push({
          ...item,
          _loopKey: `${item.id || item.slug || itemIdx}-loop-${set}`,
        });
      });
    }
    return items;
  }, [baseProducts, N]);

  // Center on middle set on mount
  useEffect(() => {
    if (N > 1 && initialOffset > 0) {
      scrollX.setValue(initialOffset);
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: initialOffset,
          animated: false,
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [initialOffset, N, scrollX]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const currentItemIndex = Math.round(offsetX / SNAP_INTERVAL);
        const actualIndex = ((currentItemIndex % N) + N) % N;
        setActiveIndex(actualIndex);
      },
    }
  );

  const handleMomentumScrollEnd = (event) => {
    if (N <= 1) return;
    const currentOffset = event.nativeEvent.contentOffset.x;
    const currentItemIndex = Math.round(currentOffset / SNAP_INTERVAL);
    const actualIndex = ((currentItemIndex % N) + N) % N;
    setActiveIndex(actualIndex);

    // If user scrolled near the buffer edges (outside sets 2, 3, 4)
    if (currentItemIndex < N * 2 || currentItemIndex >= N * 5) {
      const resetIndex = CENTER_SET * N + actualIndex;
      const resetOffset = resetIndex * SNAP_INTERVAL;
      scrollX.setValue(resetOffset);
      scrollRef.current?.scrollTo({
        x: resetOffset,
        animated: false,
      });
    }
  };

  return (
    <View style={styles.sectionContainer}>
      {/* BOTANICAL LUXURY IVORY/CREAM GRADIENT BACKGROUND */}
      <LinearGradient
        colors={['#FAF7F0', '#F6F0E4', '#F0E8DC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientSurface}
      >
        {/* TOP-RIGHT BOTANICAL LEAF OVERHANG */}
        <View style={styles.foliageWrap} pointerEvents="none">
          <MaterialCommunityIcons
            name="leaf"
            size={56}
            color="#8DB895"
            style={styles.foliageLeafOne}
          />
          <MaterialCommunityIcons
            name="leaf"
            size={36}
            color="#A8CCA9"
            style={styles.foliageLeafTwo}
          />
        </View>

        {/* SECTION HEADER - CENTERED */}
        <View style={styles.header}>
          {/* CENTER BOTANICAL MOTIF */}
          <View style={styles.motifRow}>
            <MaterialCommunityIcons
              name="leaf"
              size={14}
              color="#173F1D"
              style={styles.motifLeftLeaf}
            />
            <MaterialCommunityIcons
              name="leaf"
              size={14}
              color="#173F1D"
              style={styles.motifRightLeaf}
            />
          </View>

          {/* EYEBROW */}
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowLine} />
            <Text style={styles.eyebrowText}>NEW LAUNCHES</Text>
            <View style={styles.eyebrowLine} />
          </View>

          {/* MAIN TITLE */}
          <Text style={styles.title}>Just Arrived</Text>
        </View>

        {/* FOCUSED COVERFLOW CAROUSEL (INFINITE LOOP) */}
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum={true}
          contentOffset={{ x: initialOffset, y: 0 }}
          contentContainerStyle={[
            styles.productList,
            { paddingHorizontal: SIDE_SPACER },
          ]}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
        >
          {loopedProducts.map((product, index) => {
            const inputRange = [
              (index - 1) * SNAP_INTERVAL,
              index * SNAP_INTERVAL,
              (index + 1) * SNAP_INTERVAL,
            ];

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.90, 1.02, 0.90],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.75, 1.0, 0.75],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={product._loopKey || `${product.id || product.slug}-${index}`}
                style={[
                  styles.animatedCardWrap,
                  {
                    width: CARD_WIDTH,
                    marginRight: index === loopedProducts.length - 1 ? 0 : CARD_GAP,
                    transform: [{ scale }],
                    opacity,
                  },
                ]}
              >
                <NewArrivalCard
                  product={product}
                  onPress={() => {
                    if (product?.slug) {
                      router.push(`/products/${product.slug}`);
                    }
                  }}
                />
              </Animated.View>
            );
          })}
        </Animated.ScrollView>

        {/* CAROUSEL PAGINATION DOTS */}
        {baseProducts.length > 1 && (
          <View style={styles.paginationDotsRow}>
            {baseProducts.slice(0, 5).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  activeIndex === i ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        )}

        {/* BOTTOM ORGANIC BOTANICAL WAVE SEPARATOR */}
        <View style={styles.bottomWaveWrap} pointerEvents="none">
          <View style={styles.bottomWaveLayer} />
        </View>
      </LinearGradient>
    </View>
  );
}

// ============================================================
// DEDICATED NEW ARRIVAL LUXURY PRODUCT CARD
// ============================================================

function NewArrivalCard({ product, onPress }) {
  const router = useRouter();
  const { cartItems, addToCart, increaseQuantity, decreaseQuantity } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

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
      : Number(product?.discount_percentage || 0);

  const rating = Number(
    product?.rating ??
    product?.average_rating ??
    4.8
  );

  const reviews = Number(
    product?.review_count ??
    product?.reviews_count ??
    product?.reviews ??
    126
  );

  const wishlisted = isWishlisted(product?.id);

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

  const handleWishlistToggle = (e) => {
    e?.stopPropagation?.();
    if (product?.id) {
      toggleWishlist(product.id, product);
    }
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
      {/* UPPER IMAGE CONTAINER BOX (MATCHING REFERENCE UI) */}
      <View style={styles.imageBox}>
        {/* TOP OVERLAYS: NEW PILL BADGE & WISHLIST HEART */}
        <View style={styles.topBadgeRow}>
          <View style={styles.newBadgePill}>
            <MaterialCommunityIcons name="leaf" size={10} color="#FFFFFF" />
            <Text style={styles.newBadgeText}>New</Text>
          </View>

          <Pressable
            style={styles.wishlistBtn}
            onPress={handleWishlistToggle}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Ionicons
              name={wishlisted ? 'heart' : 'heart-outline'}
              size={17}
              color={wishlisted ? '#B94A48' : '#173F1D'}
            />
          </Pressable>
        </View>

        {/* PRODUCT IMAGE */}
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
            <View style={styles.fallbackImageWrap}>
              <Ionicons name="leaf-outline" size={34} color="#C4DEC8" />
            </View>
          )}
        </View>
      </View>

      {/* LOWER CONTENT AREA */}
      <View style={styles.detailsWrap}>
        {/* PRODUCT TITLE */}
        <Text style={styles.productTitle} numberOfLines={1}>
          {product?.name || 'Ayurvedic Essential'}
        </Text>

        {/* RATING ROW */}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={11.5} color="#F5A623" />
          <Text style={styles.ratingText}>
            {rating.toFixed(1)} ({reviews} reviews)
          </Text>
        </View>

        {/* PRICE & DISCOUNT ROW */}
        <View style={styles.priceRow}>
          <View style={styles.priceGroup}>
            <Text style={styles.currentPrice}>
              ₹{price.toLocaleString('en-IN')}
            </Text>

            {compareAtPrice > price && (
              <Text style={styles.originalPrice}>
                ₹{compareAtPrice.toLocaleString('en-IN')}
              </Text>
            )}
          </View>

          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* ACTION BUTTONS ROW: ADD TO CART (OR STEPPER) + BUY NOW */}
        <View style={styles.actionButtonsRow}>
          {isAdded ? (
            <View style={styles.stepperContainer}>
              <Pressable
                style={styles.stepperBtn}
                onPress={handleMinus}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={12} color="#173F1D" />
              </Pressable>

              <Text style={styles.stepperQuantity}>{quantity}</Text>

              <Pressable
                style={styles.stepperBtn}
                onPress={handlePlus}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={12} color="#173F1D" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.addToCartBtn,
                pressed && styles.addToCartBtnPressed,
              ]}
              onPress={handleAdd}
              accessibilityRole="button"
              accessibilityLabel={`Add ${product?.name} to cart`}
            >
              <Ionicons name="cart-outline" size={12} color="#FFFFFF" />
              <Text
                style={styles.addToCartText}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Add to Cart
              </Text>
            </Pressable>
          )}

          {/* BUY NOW ACTION BUTTON */}
          <Pressable
            style={({ pressed }) => [
              styles.buyNowBtn,
              pressed && styles.buyNowBtnPressed,
            ]}
            onPress={handleBuyNow}
            accessibilityRole="button"
            accessibilityLabel={`Buy ${product?.name} now`}
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
    </Pressable>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  sectionContainer: {
    width: '100%',
    marginTop: 6,
    marginBottom: 4,
  },

  gradientSurface: {
    width: '100%',
    paddingTop: 12,
    paddingBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },

  /* TOP RIGHT BOTANICAL FOLIAGE OVERHANG */
  foliageWrap: {
    position: 'absolute',
    top: -10,
    right: -10,
    opacity: 0.32,
    transform: [{ rotate: '15deg' }],
  },

  foliageLeafOne: {
    opacity: 0.85,
  },

  foliageLeafTwo: {
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.7,
    transform: [{ rotate: '-25deg' }],
  },

  /* HEADER */
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
    zIndex: 2,
  },

  motifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginBottom: 2,
  },

  motifLeftLeaf: {
    transform: [{ rotate: '-25deg' }],
  },

  motifRightLeaf: {
    transform: [{ rotate: '25deg' }, { scaleX: -1 }],
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },

  eyebrowLine: {
    width: 18,
    height: 1,
    backgroundColor: '#8FA893',
  },

  eyebrowText: {
    fontFamily: 'InterSemiBold',
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: '#173F1D',
    fontWeight: '700',
  },

  title: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 24,
    color: '#123D2B',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
  },

  /* HORIZONTAL PRODUCT LIST */
  productList: {
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 2,
  },

  animatedCardWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* PRODUCT CARD */
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE5DC',
    padding: 8,
    paddingBottom: 10,
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2.5,
  },

  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.95,
  },

  /* IMAGE BOX (LIKE UI REFERENCE CARD) */
  imageBox: {
    width: '100%',
    height: 104,
    backgroundColor: '#F9F7F2',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  topBadgeRow: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },

  newBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#173F1D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  newBadgeText: {
    fontFamily: 'InterSemiBold',
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  wishlistBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },

  imageWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 6,
  },

  productImage: {
    width: '95%',
    height: '95%',
  },

  fallbackImageWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* LOWER DETAILS WRAP */
  detailsWrap: {
    paddingTop: 6,
  },

  productTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#123D2B',
    lineHeight: 16,
    marginBottom: 2,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 3,
  },

  ratingText: {
    fontFamily: 'InterMedium',
    fontSize: 10,
    color: '#556052',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },

  currentPrice: {
    fontFamily: 'InterSemiBold',
    fontSize: 14,
    fontWeight: '800',
    color: '#123D2B',
  },

  originalPrice: {
    fontFamily: 'InterRegular',
    fontSize: 10,
    color: '#8A857B',
    textDecorationLine: 'line-through',
  },

  discountBadge: {
    backgroundColor: '#FDEBD9',
    paddingHorizontal: 4.5,
    paddingVertical: 1,
    borderRadius: 5,
  },

  discountText: {
    fontFamily: 'InterSemiBold',
    fontSize: 8,
    fontWeight: '700',
    color: '#914D1A',
  },

  /* ACTION BUTTONS: ADD TO CART + BUY NOW */
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },

  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: '#173F1D',
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 2,
    shadowColor: '#173F1D',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1.5,
  },

  addToCartBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  addToCartText: {
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0,
  },

  buyNowBtn: {
    flex: 1,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.1,
    borderColor: '#173F1D',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  buyNowBtnPressed: {
    opacity: 0.85,
    backgroundColor: '#EAF3EC',
    transform: [{ scale: 0.98 }],
  },

  buyNowText: {
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    fontWeight: '700',
    color: '#173F1D',
    letterSpacing: 0,
  },

  stepperContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    height: 28,
    borderRadius: 14,
    borderWidth: 1.1,
    borderColor: '#173F1D',
    paddingHorizontal: 3,
  },

  stepperBtn: {
    width: 19,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9.5,
    backgroundColor: '#EAF3EC',
  },

  stepperQuantity: {
    fontFamily: 'InterSemiBold',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#173F1D',
  },

  /* CAROUSEL PAGINATION DOTS */
  paginationDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 6,
    zIndex: 2,
  },

  dot: {
    height: 5,
    borderRadius: 2.5,
  },

  activeDot: {
    width: 14,
    backgroundColor: '#173F1D',
  },

  inactiveDot: {
    width: 5,
    backgroundColor: '#C8D7C9',
  },

  /* BOTTOM BOTANICAL WAVE SEPARATOR */
  bottomWaveWrap: {
    position: 'absolute',
    bottom: -14,
    left: 0,
    right: 0,
    height: 20,
    overflow: 'hidden',
  },

  bottomWaveLayer: {
    width: '120%',
    left: '-10%',
    height: 28,
    borderRadius: 20,
    backgroundColor: 'rgba(189, 212, 193, 0.4)',
    transform: [{ rotate: '-1.2deg' }],
  },
});
