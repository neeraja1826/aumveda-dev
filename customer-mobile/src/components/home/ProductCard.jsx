import React from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Image } from 'expo-image';

import { Ionicons } from '@expo/vector-icons';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';

import { colors } from '../../theme/colors';

export default function ProductCard({
  product,
  onPress,
  compact = false,
}) {
  // --------------------------------------------------
  // CART
  // --------------------------------------------------
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
  // --------------------------------------------------
  // PRODUCT IMAGE
  // --------------------------------------------------

  const image =
    product?.image_url ??
    product?.image ??
    product?.thumbnail ??
    product?.images?.[0] ??
    product?.image_urls?.[0] ??
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
      0
  );

  // --------------------------------------------------
  // DISCOUNT
  // --------------------------------------------------

  const discount =
    compareAtPrice > price && price > 0
      ? Math.round(
          ((compareAtPrice - price) /
            compareAtPrice) *
            100
        )
      : 0;

  // --------------------------------------------------
  // RATING
  // --------------------------------------------------

  const rating =
    product?.rating ??
    product?.average_rating ??
    0;

  const reviews =
    product?.review_count ?? 0;

  // --------------------------------------------------
  // DESCRIPTION
  // --------------------------------------------------

  const description =
    product?.description ??
    product?.short_description ??
    '';

  // --------------------------------------------------
  // VARIANT
  // --------------------------------------------------

  const variant =
    product?.variant ?? null;

  const variantId =
    variant?.id ?? null;

  // --------------------------------------------------
  // CART ITEM KEY
  //
  // Must match CartContext:
  // `${product.id}-${variantId ?? 'default'}`
  // --------------------------------------------------

  const itemKey =
    `${product?.id}-${variantId ?? 'default'}`;

  // --------------------------------------------------
  // FIND PRODUCT IN CART
  // --------------------------------------------------

  const cartItem = cartItems.find(
    (item) =>
      item.itemKey === itemKey
  );

  const quantity = Number(
    cartItem?.quantity ?? 0
  );

  const isAdded =
    quantity > 0;

  // --------------------------------------------------
  // ADD TO CART
  // --------------------------------------------------


const handleAddToCart = (event) => {
  event?.stopPropagation?.();

  if (!product?.id) {
    return;
  }

  addToCart(
    product,
    1,
    variant
  );
};


  // --------------------------------------------------
  // INCREASE
  // --------------------------------------------------

  const handleIncrease = (
    event
  ) => {
    event?.stopPropagation?.();

    if (!product?.id) {
      return;
    }

    increaseQuantity(
      itemKey
    );
  };

  // --------------------------------------------------
  // DECREASE
  // --------------------------------------------------

  const handleDecrease = (
    event
  ) => {
    event?.stopPropagation?.();

    if (!product?.id) {
      return;
    }

    decreaseQuantity(
      itemKey
    );
  };

  // --------------------------------------------------
  // CARD
  // --------------------------------------------------

  return (
    <Pressable
      style={[
        styles.card,
        compact && styles.compactCard,
      ]}
      onPress={onPress}
      android_ripple={{ color: '#E9E8DF' }}
    >

      {/* ==========================================
          IMAGE
      ========================================== */}

      <View
        style={[
          styles.imageContainer,
          compact && styles.compactImageContainer,
        ]}
      >

        <Image
  source={{ uri: image }}
  style={[
    styles.image,
    compact && styles.compactImage,
  ]}
  contentFit="contain"
  cachePolicy="memory-disk"
  transition={150}
  onError={(event) => {
    console.log(
      'Product image failed:',
      image,
      event.error
    );
  }}
/>

        {/* DISCOUNT */}

        {discount > 0 && (
          <View
            style={[
              styles.discountBadge,
              compact && styles.compactDiscountBadge,
            ]}
          >
            <Text
              style={[
                styles.discountText,
                compact && styles.compactDiscountText,
              ]}
            >
              {discount}% OFF
            </Text>
          </View>
        )}

        {/* WISHLIST */}

        {/* WISHLIST */}

<Pressable
  style={styles.wishlistButton}
  onPress={async () => {
    console.log(
      'WISHLIST CLICKED:',
      product?.id,
      product?.name
    );

    if (!product?.id) {
      console.log('WISHLIST ERROR: Product ID missing');
      return;
    }

    const result = await toggleWishlist(product);

    console.log(
      'WISHLIST RESULT:',
      result
    );
  }}
  hitSlop={10}
>
  <Ionicons
    name={
      isWishlisted(product?.id)
        ? 'heart'
        : 'heart-outline'
    }
    size={21}
    color={
      isWishlisted(product?.id)
        ? '#B94A48'
        : '#4A4036'
    }
  />
</Pressable>
</View>

      {/* ==========================================
          CONTENT
      ========================================== */}

      <View
        style={[
          styles.content,
          compact && styles.compactContent,
        ]}
      >

        {/* PRODUCT NAME */}

        <Text
          style={[
            styles.name,
            compact && styles.compactName,
          ]}
          numberOfLines={2}
        >
          {product?.name ||
            'Product'}
        </Text>

        {/* DESCRIPTION */}

        {description ? (
          <Text
            style={
              [
                styles.description,
                compact && styles.compactDescription,
              ]
            }
            numberOfLines={1}
          >
            {description}
          </Text>
        ) : null}

        {/* RATING */}

        <View
          style={[
            styles.ratingRow,
            compact && styles.compactRatingRow,
          ]}
        >
          <Ionicons
            name="star"
            size={compact ? 15 : 11}
            color="#D9A52E"
          />

          <Text
            style={
              [
                styles.ratingValue,
                compact && styles.compactRatingValue,
              ]
            }
          >
            {Number(
              rating
            ).toFixed(1)}
          </Text>

          <Text
            style={[
              styles.dot,
              compact && styles.compactDot,
            ]}
          >
            •
          </Text>

          <Text
            style={
              [
                styles.reviewText,
                compact && styles.compactReviewText,
              ]
            }
          >
            {reviews} reviews
          </Text>
        </View>

        {/* PRICE */}

        <View
          style={[
            styles.priceRow,
            compact && styles.compactPriceRow,
          ]}
        >
          <Text
            style={[
              styles.price,
              compact && styles.compactPrice,
            ]}
          >
            ₹
            {price.toLocaleString(
              'en-IN'
            )}
          </Text>

          {compareAtPrice >
            price && (
            <Text
              style={
                [
                  styles.comparePrice,
                  compact && styles.compactComparePrice,
                ]
              }
            >
              ₹
              {compareAtPrice.toLocaleString(
                'en-IN'
              )}
            </Text>
          )}
        </View>

        {/* ======================================
            CART CONTROL
        ====================================== */}

        {isAdded ? (

          // ------------------------------------
          // QUANTITY CONTROL
          // ------------------------------------

          <View
            style={
              [
                styles.quantityContainer,
                compact && styles.compactQuantityContainer,
              ]
            }
          >

            {/* DECREASE */}

            <Pressable
              style={
                [
                  styles.quantityButton,
                  compact && styles.compactQuantityButton,
                ]
              }
              onPress={
                handleDecrease
              }
              hitSlop={6}
            >
              <Ionicons
                name="remove-outline"
                size={compact ? 20 : 18}
                color="#315C3B"
              />
            </Pressable>

            {/* QUANTITY */}

            <Text
              style={
                [
                  styles.quantityText,
                  compact && styles.compactQuantityText,
                ]
              }
            >
              {quantity}
            </Text>

            {/* INCREASE */}

            <Pressable
              style={
                [
                  styles.quantityButton,
                  compact && styles.compactQuantityButton,
                ]
              }
              onPress={
                handleIncrease
              }
              hitSlop={6}
            >
              <Ionicons
                name="add-outline"
                size={compact ? 20 : 18}
                color="#315C3B"
              />
            </Pressable>

          </View>

        ) : (

          // ------------------------------------
          // ADD TO CART
          // ------------------------------------

          <Pressable
            style={
              [
                styles.addButton,
                compact && styles.compactAddButton,
              ]
            }
            onPress={
              handleAddToCart
            }
          >
            <Ionicons
              name="bag-add-outline"
              size={compact ? 20 : 16}
              color="#FFFFFF"
            />

            <Text
              style={
                [
                  styles.addButtonText,
                  compact && styles.compactAddButtonText,
                ]
              }
            >
              Add to Cart
            </Text>
          </Pressable>

        )}

      </View>

    </Pressable>
  );
}

// ==================================================
// STYLES
// ==================================================

const styles =
  StyleSheet.create({

    // ------------------------------------------------
    // CARD
    // ------------------------------------------------

    card: {
      width: '47.8%',

      borderWidth: 1,
      borderColor: '#E8E3D8',

      marginBottom: 14,

      borderRadius: 16,

      overflow: 'hidden',

      shadowColor: '#172C1E',

      shadowOffset: {
        width: 0,
        height: 2,
      },

      shadowOpacity: 0.08,

      shadowRadius: 5,

      backgroundColor:
        '#FFFFFF',

      elevation: 2,
    },

    // ------------------------------------------------
    // IMAGE
    // ------------------------------------------------

    imageContainer: {
      height: 120,

      backgroundColor:
        '#F9F7F2',

      position: 'relative',

      alignItems: 'center',

      justifyContent:
        'center',
    },

    image: {
      width: '88%',
      height: '88%',
    },

    // ------------------------------------------------
    // DISCOUNT
    // ------------------------------------------------

    discountBadge: {
      position: 'absolute',

      left: 8,

      top: 8,

      paddingHorizontal: 7,

      paddingVertical: 3.5,

      borderRadius: 5,

      backgroundColor:
        '#D9A52E',
    },

    discountText: {
      fontSize: 9,

      fontWeight: '700',

      color: '#FFFFFF',

      letterSpacing: 0.2,
    },

    // ------------------------------------------------
    // WISHLIST
    // ------------------------------------------------

wishlistButton: {
  position: 'absolute',
  top: 10,
  right: 10,
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'rgba(255,255,255,0.94)',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
  elevation: 3,
},


    // ------------------------------------------------
    // NO IMAGE
    // ------------------------------------------------

    noImage: {
      flex: 1,

      width: '100%',

      alignItems: 'center',

      justifyContent:
        'center',
    },

    noImageText: {
      marginTop: 4,

      fontSize: 8,

      color:
        colors.textSecondary,
    },

    // ------------------------------------------------
    // CONTENT
    // ------------------------------------------------

    content: {
      paddingHorizontal: 9,

      paddingTop: 9,

      paddingBottom: 9,
    },

    // ------------------------------------------------
    // NAME
    // ------------------------------------------------

    name: {
      minHeight: 32,

      color: '#123D2B',

      fontSize: 12,

      lineHeight: 16,

      fontWeight: '600',
    },

    // ------------------------------------------------
    // DESCRIPTION
    // ------------------------------------------------

    description: {
      marginTop: -15,

      fontSize: 9,

      lineHeight: 12,

      color: '#716F68',
    },

    // ------------------------------------------------
    // RATING
    // ------------------------------------------------

    ratingRow: {
      marginTop: 5,

      flexDirection: 'row',

      alignItems: 'center',
    },

    ratingValue: {
      marginLeft: 3,

      fontSize: 10,

      fontWeight: '600',

      color: '#123D2B',
    },

    dot: {
      marginHorizontal: 4,

      fontSize: 9,

      color: '#716F68',
    },

    reviewText: {
      fontSize: 9,

      color: '#716F68',
    },

    // ------------------------------------------------
    // PRICE
    // ------------------------------------------------

    priceRow: {
      marginTop: 5,

      flexDirection: 'row',

      alignItems: 'center',
    },

    price: {
      fontSize: 14,

      fontWeight: '700',

      color: '#123D2B',
    },

    comparePrice: {
      marginLeft: 6,

      fontSize: 10,

      color: '#716F68',

      textDecorationLine:
        'line-through',
    },

    // ------------------------------------------------
    // ADD TO CART
    // ------------------------------------------------

    addButton: {
      marginTop: 7,

      height: 33,

      borderRadius: 16,

      backgroundColor:
        '#123D2B',

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',
    },

    addButtonText: {
      marginLeft: 5,

      color: '#FFFFFF',

      fontSize: 10.5,

      fontWeight: '700',
    },

    // ------------------------------------------------
    // QUANTITY
    // ------------------------------------------------

    quantityContainer: {
      marginTop: 7,

      height: 34,

      borderRadius: 10,

      backgroundColor:
        '#E8F2E7',

      borderWidth: 1,

      borderColor:
        '#CDE2CB',

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      paddingHorizontal: 4,
    },

    quantityButton: {
      width: 29,

      height: 29,

      borderRadius: 8,

      backgroundColor:
        '#FFFFFF',

      alignItems: 'center',

      justifyContent:
        'center',
    },

    quantityText: {
      fontSize: 12,

      fontWeight: '600',

      color: '#123D2B',
    },

    compactCard: {
      width: 220,
      marginBottom: 0,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: '#E5DFD3',
      backgroundColor: '#FFFFFF',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.16,
      shadowRadius: 8,
      elevation: 4,
    },

    compactImageContainer: {
      height: 190,
      backgroundColor: '#F5F1E8',
    },

    compactImage: {
      width: '92%',
      height: '92%',
    },

    compactDiscountBadge: {
      left: 14,
      top: 14,
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 13,
      backgroundColor: '#D9A52E',
    },

    compactDiscountText: {
      fontSize: 12,
      letterSpacing: 0.1,
      color: '#FFFFFF',
    },

    compactWishlist: {
      right: 13,
      top: 13,
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#FFFFFF',
      borderColor: '#E5DFD3',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 2,
    },

    compactContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
    },

    compactName: {
      minHeight: 44,
      fontSize: 17,
      lineHeight: 21,
      fontWeight: '700',
      color: '#123D2B',
    },

    compactDescription: {
      marginTop: 0,
      minHeight: 18,
      fontSize: 12,
      lineHeight: 17,
      color: '#716F68',
    },

    compactRatingRow: {
      marginTop: 10,
    },

    compactRatingValue: {
      marginLeft: 5,
      fontSize: 13,
      fontWeight: '600',
      color: '#123D2B',
    },

    compactDot: {
      marginHorizontal: 6,
      fontSize: 12,
      color: '#716F68',
    },

    compactReviewText: {
      fontSize: 12,
      color: '#716F68',
      flexShrink: 1,
    },

    compactPriceRow: {
      marginTop: 10,
    },

    compactPrice: {
      fontSize: 20,
      fontWeight: '800',
      color: '#123D2B',
    },

    compactComparePrice: {
      marginLeft: 8,
      fontSize: 13,
      color: '#716F68',
    },

    compactAddButton: {
      marginTop: 14,
      height: 48,
      borderRadius: 15,
      backgroundColor: '#123D2B',
    },

    compactAddButtonText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    compactQuantityContainer: {
      marginTop: 14,
      height: 48,
      borderRadius: 15,
      paddingHorizontal: 5,
      backgroundColor: '#E8F2E7',
      borderColor: '#CDE2CB',
      borderWidth: 1,
    },

    compactQuantityButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
    },

    compactQuantityText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#123D2B',
    },
    
  });