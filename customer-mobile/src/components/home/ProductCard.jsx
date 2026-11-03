import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { colors } from '../../theme/colors';

export default function ProductCard({
  product,
  onPress,
  compact = false,
  theme = null,
}) {
  const router = useRouter();

  // --------------------------------------------------
  // CART
  // --------------------------------------------------
  const {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  // --------------------------------------------------
  // WISHLIST
  // --------------------------------------------------
  const {
    isWishlisted,
    toggleWishlist,
  } = useWishlist();

  // --------------------------------------------------
  // PRODUCT IMAGE
  // --------------------------------------------------
  const image =
    product?.image_url ??
    product?.image ??
    product?.thumbnail ??
    product?.images?.[0] ??
    product?.image_urls?.[0] ??
    product?.product_images?.find((img) => img?.is_primary)?.image_url ??
    product?.product_images?.[0]?.image_url ??
    null;

  // --------------------------------------------------
  // PRICE
  // --------------------------------------------------
  const price = Number(
    product?.price ??
      product?.variant?.price ??
      0
  );

  const compareAtPrice = Number(
    product?.compare_at_price ??
      product?.variant?.compare_at_price ??
      product?.mrp ??
      product?.original_price ??
      0
  );

  // --------------------------------------------------
  // DISCOUNT
  // --------------------------------------------------
  const discount =
    compareAtPrice > price && price > 0
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  // --------------------------------------------------
  // RATING
  // --------------------------------------------------
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

  // --------------------------------------------------
  // DESCRIPTION
  // --------------------------------------------------
  const rawDescription =
    product?.description ??
    product?.short_description ??
    product?.subtitle ??
    product?.category_name ??
    product?.category?.name ??
    '';

  const description =
    typeof rawDescription === 'string'
      ? rawDescription.replace(/<[^>]*>?/gm, '').trim()
      : '';

  // --------------------------------------------------
  // VARIANT
  // --------------------------------------------------
  const variant = product?.variant ?? null;
  const variantId = variant?.id ?? null;

  // --------------------------------------------------
  // CART ITEM KEY
  // --------------------------------------------------
  const itemKey = `${product?.id}-${variantId ?? 'default'}`;

  // --------------------------------------------------
  // FIND PRODUCT IN CART
  // --------------------------------------------------
  const cartItem = cartItems.find((item) => item.itemKey === itemKey);
  const quantity = Number(cartItem?.quantity ?? 0);
  const isAdded = quantity > 0;

  // --------------------------------------------------
  // ACTIONS
  // --------------------------------------------------
  const handleAddToCart = (event) => {
    event?.stopPropagation?.();
    if (!product?.id) return;
    addToCart(product, 1, variant);
  };

  const handleIncrease = (event) => {
    event?.stopPropagation?.();
    if (!product?.id) return;
    increaseQuantity(itemKey);
  };

  const handleDecrease = (event) => {
    event?.stopPropagation?.();
    if (!product?.id) return;
    decreaseQuantity(itemKey);
  };

  const handleWishlist = async (event) => {
    event?.stopPropagation?.();
    if (!product?.id) return;
    await toggleWishlist(product);
  };

  const handleBuyNow = (event) => {
    event?.stopPropagation?.();
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
      style={[
        styles.card,
        compact && styles.compactCard,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product?.name || 'Product'}, ₹${price}`}
    >
      {/* ==========================================
          IMAGE AREA (DIRECT ON CARD - NO SEPARATE CONTAINER BOX)
      ========================================== */}
      <View style={[styles.imageArea, compact && styles.compactImageArea]}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={150}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="leaf-outline" size={32} color="#CDE2CB" />
          </View>
        )}

        {/* DISCOUNT BADGE (TOP-LEFT OVERLAY) */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {discount}% OFF
            </Text>
          </View>
        )}

        {/* WISHLIST BUTTON (TOP-RIGHT OVERLAY) */}
        <Pressable
          style={styles.wishlistButton}
          onPress={handleWishlist}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={19}
            color={wishlisted ? '#B94A48' : '#716F68'}
          />
        </Pressable>
      </View>

      {/* ==========================================
          PRODUCT INFO & DETAILS
      ========================================== */}
      <View style={styles.content}>
        {/* PRODUCT NAME */}
        <Text
          style={[
            styles.name,
            compact && styles.compactName,
          ]}
          numberOfLines={2}
        >
          {product?.name || 'Product'}
        </Text>

        {/* DESCRIPTION */}
        {description ? (
          <Text
            style={[
              styles.description,
              compact && styles.compactDescription,
            ]}
            numberOfLines={1}
          >
            {description}
          </Text>
        ) : null}

        {/* PRICE + RATING ROW */}
        <View style={styles.priceRatingRow}>
          {/* PRICE (LEFT) */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ₹{price.toLocaleString('en-IN')}
            </Text>

            {compareAtPrice > price && (
              <Text style={styles.comparePrice}>
                ₹{compareAtPrice.toLocaleString('en-IN')}
              </Text>
            )}
          </View>

          {/* RATING (RIGHT) */}
          <View style={styles.ratingRow}>
            <Ionicons
              name="star"
              size={11}
              color="#D9A52E"
            />
            <Text style={styles.ratingValue}>
              {rating.toFixed(1)}
            </Text>
            {reviews > 0 && (
              <Text style={styles.reviewText} numberOfLines={1}>
                {reviews} reviews
              </Text>
            )}
          </View>
        </View>

        {/* ======================================
            ACTION BUTTONS: ADD TO CART + BUY NOW
        ====================================== */}
        <View style={styles.actionButtonsRow}>
          {/* ADD TO CART / STEPPER */}
          {isAdded ? (
            <View
              style={[
                styles.quantityContainer,
                theme?.accent && { borderColor: theme.accent },
              ]}
            >
              <Pressable
                style={[
                  styles.quantityButton,
                  theme?.accentLight && { backgroundColor: theme.accentLight },
                ]}
                onPress={handleDecrease}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons
                  name="remove"
                  size={14}
                  color={theme?.accent || colors.primary}
                />
              </Pressable>

              <Text
                style={[
                  styles.quantityText,
                  theme?.accent && { color: theme.accent },
                ]}
              >
                {quantity}
              </Text>

              <Pressable
                style={[
                  styles.quantityButton,
                  theme?.accentLight && { backgroundColor: theme.accentLight },
                ]}
                onPress={handleIncrease}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons
                  name="add"
                  size={14}
                  color={theme?.accent || colors.primary}
                />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.addToCartButton,
                theme?.accent && { backgroundColor: theme.accent },
                pressed && styles.buttonPressed,
              ]}
              onPress={handleAddToCart}
              accessibilityRole="button"
              accessibilityLabel="Add to Cart"
            >
              <Text
                style={styles.addToCartText}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Add to Cart
              </Text>
            </Pressable>
          )}

          {/* BUY NOW */}
          <Pressable
            style={({ pressed }) => [
              styles.buyNowButton,
              {
                borderColor: theme?.accent || colors.primary,
                backgroundColor: pressed
                  ? (theme?.accentLight || '#F2F2F2')
                  : '#FFFFFF',
              },
              pressed && styles.buttonPressed,
            ]}
            onPress={handleBuyNow}
            accessibilityRole="button"
            accessibilityLabel="Buy Now"
          >
            <Text
              style={[
                styles.buyNowText,
                { color: theme?.accent || colors.primary },
              ]}
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

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8E3D8',
    padding: 10,
    marginBottom: 14,
    shadowColor: '#123D2B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
  },

  compactCard: {
    width: 180,
    marginBottom: 0,
  },

  // ------------------------------------------------
  // IMAGE AREA (DIRECTLY ON CARD - NO SEPARATE BOX)
  // ------------------------------------------------
  imageArea: {
    width: '100%',
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  compactImageArea: {
    height: 120,
  },

  image: {
    width: '94%',
    height: '94%',
  },

  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  discountBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#E8F2E7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    zIndex: 2,
  },

  discountText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#123D2B',
    letterSpacing: 0.2,
  },

  wishlistButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  // ------------------------------------------------
  // CONTENT
  // ------------------------------------------------
  content: {
    paddingTop: 4,
  },

  name: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    color: '#123D2B',
  },

  compactName: {
    fontSize: 12.5,
    lineHeight: 16,
  },

  description: {
    fontSize: 10.5,
    lineHeight: 14,
    color: '#716F68',
    marginTop: 1,
    marginBottom: 2,
  },

  compactDescription: {
    fontSize: 10,
    lineHeight: 13,
  },

  // ------------------------------------------------
  // PRICE & RATING ROW
  // ------------------------------------------------
  priceRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
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

  // ------------------------------------------------
  // ACTION BUTTONS: ADD TO CART + BUY NOW
  // ------------------------------------------------
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
  },

  addToCartButton: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2E5A34',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  addToCartText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  buyNowButton: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.2,
    borderColor: '#884129',
    backgroundColor: '#884129',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  buyNowText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  quantityContainer: {
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

  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#123D2B',
  },

  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
