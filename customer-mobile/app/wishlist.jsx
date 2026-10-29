import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';

import { useWishlist } from '../src/context/WishlistContext';
import { useCart } from '../src/context/CartContext';
import { colors } from '../src/theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WishlistScreen() {
  const router = useRouter();

  // -----------------------------------------
  // WISHLIST
  // -----------------------------------------

  const {
    wishlist,
    loading,
    removeProduct,
    loadWishlist,
  } = useWishlist();

  // -----------------------------------------
  // AUTH
  // -----------------------------------------

  // -----------------------------------------
  // CART
  // -----------------------------------------

  const {
    cartItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  // -----------------------------------------
  // FIND CART ITEM
  // -----------------------------------------

  const getCartItem = (product) => {
    if (!product?.id) {
      return null;
    }

    const variantId =
      product?.variant?.id ?? null;

    return (
      cartItems.find((item) => {
        if (
          item?.productId !==
          product.id
        ) {
          return false;
        }

        // Match exact variant
        if (variantId) {
          return (
            item?.variantId ===
            variantId
          );
        }

        return true;
      }) || null
    );
  };

  // -----------------------------------------
  // ADD TO CART
  // -----------------------------------------

  const handleAddToCart = (
    product
  ) => {
    if (!product?.id) {
      return;
    }

    const existingCartItem =
      getCartItem(product);

    // Already in cart
    if (existingCartItem) {
      increaseQuantity(
        existingCartItem.itemKey
      );

      return;
    }

    // Not in cart
    addToCart(
      product,
      1,
      product?.variant ?? null
    );
  };

  // -----------------------------------------
  // PLUS
  // -----------------------------------------

  const handleIncrease = (
    product
  ) => {
    const cartItem =
      getCartItem(product);

    if (!cartItem) {
      handleAddToCart(product);
      return;
    }

    increaseQuantity(
      cartItem.itemKey
    );
  };

  // -----------------------------------------
  // MINUS
  // -----------------------------------------

  const handleDecrease = (
    product
  ) => {
    const cartItem =
      getCartItem(product);

    if (!cartItem) {
      return;
    }

    decreaseQuantity(
      cartItem.itemKey
    );
  };

  // -----------------------------------------
  // REMOVE FROM WISHLIST
  // -----------------------------------------

  const handleRemove = async (
    productId
  ) => {
    const result =
      await removeProduct(
        productId
      );

    if (!result?.success) {
      Alert.alert(
        'Unable to remove',
        'Please try again.'
      );
    }
  };

  // -----------------------------------------
  // OPEN PRODUCT
  // -----------------------------------------

  const openProduct = (
    product
  ) => {
    if (!product?.slug) {
      return;
    }

    router.push(
      `/products/${product.slug}`
    );
  };

  // -----------------------------------------
  // PRODUCT CARD
  // -----------------------------------------

  const renderProduct = ({
    item,
  }) => {
    const cartItem =
      getCartItem(item);

    const quantity =
      Number(
        cartItem?.quantity || 0
      );

    const isInCart =
      !!cartItem &&
      quantity > 0;

    return (
      <View
        style={
          styles.productCard
        }
      >
        {/* -------------------------------- */}
        {/* PRODUCT IMAGE */}
        {/* -------------------------------- */}

        <Pressable
          style={
            styles.imageContainer
          }
          onPress={() =>
            openProduct(item)
          }
        >
          {item.image ? (
            <Image
              source={{
                uri: item.image,
              }}
              style={
                styles.productImage
              }
              resizeMode="contain"
            />
          ) : (
            <View
              style={
                styles.imagePlaceholder
              }
            >
              <Ionicons
                name="image-outline"
                size={32}
                color={colors.textLight}
              />
            </View>
          )}

          {/* REMOVE FROM WISHLIST */}

          <Pressable
            style={
              styles.removeButton
            }
            onPress={() =>
              handleRemove(
                item.id
              )
            }
            hitSlop={10}
          >
            <Ionicons
              name="heart"
              size={20}
              color={colors.danger}
            />
          </Pressable>
        </Pressable>

        {/* -------------------------------- */}
        {/* PRODUCT DETAILS */}
        {/* -------------------------------- */}

        <View
          style={
            styles.productInfo
          }
        >
          <Pressable
            onPress={() =>
              openProduct(item)
            }
          >
            {/* NAME */}

            <Text
              style={
                styles.productName
              }
              numberOfLines={2}
            >
              {item.name}
            </Text>

            {/* RATING */}

            {item.rating ? (
              <View
                style={
                  styles.ratingRow
                }
              >
                <Ionicons
                  name="star"
                  size={14}
                  color={colors.rating}
                />

                <Text
                  style={
                    styles.rating
                  }
                >
                  {Number(
                    item.rating
                  ).toFixed(1)}
                </Text>

                {item.review_count ? (
                  <Text
                    style={
                      styles.reviewCount
                    }
                  >
                    ({item.review_count})
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* PRICE */}

            <View
              style={
                styles.priceRow
              }
            >
              <Text
                style={
                  styles.price
                }
              >
                ₹{item.price}
              </Text>

              {item.compare_at_price &&
              Number(
                item.compare_at_price
              ) >
                Number(
                  item.price
                ) ? (
                <Text
                  style={
                    styles.comparePrice
                  }
                >
                  ₹
                  {
                    item.compare_at_price
                  }
                </Text>
              ) : null}
            </View>
          </Pressable>

          {/* -------------------------------- */}
          {/* CART CONTROL */}
          {/* -------------------------------- */}

          {!isInCart ? (
            <Pressable
              style={
                styles.addToCartButton
              }
              onPress={() =>
                handleAddToCart(
                  item
                )
              }
            >
              <Ionicons
                name="bag-add-outline"
                size={18}
                color={colors.white}
              />

              <Text
                style={
                  styles.addToCartText
                }
              >
                Add to Cart
              </Text>
            </Pressable>
          ) : (
            <View
              style={
                styles.quantityContainer
              }
            >
              {/* MINUS */}

              <Pressable
                style={
                  styles.quantityButton
                }
                onPress={() =>
                  handleDecrease(
                    item
                  )
                }
                hitSlop={8}
              >
                <Ionicons
                  name="remove"
                  size={19}
                  color={colors.text}
                />
              </Pressable>

              {/* QUANTITY */}

              <Text
                style={
                  styles.quantityText
                }
              >
                {quantity}
              </Text>

              {/* PLUS */}

              <Pressable
                style={
                  styles.quantityButton
                }
                onPress={() =>
                  handleIncrease(
                    item
                  )
                }
                hitSlop={8}
              >
                <Ionicons
                  name="add"
                  size={19}
                  color={colors.text}
                />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  // -----------------------------------------
  // EMPTY STATE
  // -----------------------------------------

  const renderEmpty = () => {
    if (loading) {
      return (
        <View
          style={
            styles.centerState
          }
        >
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text
            style={
              styles.stateText
            }
          >
            Loading your wishlist...
          </Text>
        </View>
      );
    }

    return (
      <View
        style={
          styles.emptyState
        }
      >
        <View
          style={
            styles.emptyIconCircle
          }
        >
          <Ionicons
            name="heart-outline"
            size={42}
            color={colors.danger}
          />
        </View>

        <Text
          style={
            styles.emptyTitle
          }
        >
          Your Wishlist is Empty
        </Text>

        <Text
          style={
            styles.emptyDescription
          }
        >
          Save products you love and
          come back to them anytime.
        </Text>

        <Pressable
          style={
            styles.shopButton
          }
          onPress={() =>
            router.replace(
              '/(tabs)'
            )
          }
        >
          <Text
            style={
              styles.shopButtonText
            }
          >
            Explore Products
          </Text>
        </Pressable>
      </View>
    );
  };

  // -----------------------------------------
  // MAIN SCREEN
  // -----------------------------------------

  return (
    <SafeAreaView
      style={
        styles.container
      }
      edges={['top', 'bottom']}
    >
      {/* HEADER */}

      <View
        style={
          styles.header
        }
      >
        <Pressable
          onPress={() =>
            router.back()
          }
          hitSlop={10}
          style={
            styles.headerButton
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </Pressable>

        <View
          style={
            styles.headerCenter
          }
        >
          <Text style={styles.headerEyebrow}>
            AUMVEDA | SAVED FOR YOU
          </Text>

          <Text
            style={
              styles.headerTitle
            }
          >
            Wishlist
          </Text>

          {wishlist.length > 0 && (
            <Text
              style={
                styles.itemCount
              }
            >
              {wishlist.length}{' '}
              {wishlist.length === 1
                ? 'item'
                : 'items'}
            </Text>
          )}
        </View>

        <View
          style={
            styles.headerButton
          }
        >
          <Ionicons
            name="heart"
            size={22}
            color={colors.danger}
          />
        </View>
      </View>

      {/* PRODUCT LIST */}

      <FlatList
        data={wishlist}
        keyExtractor={(item) =>
          String(item.id)
        }
        renderItem={
          renderProduct
        }
        contentContainerStyle={[
          styles.listContent,

          wishlist.length === 0 &&
            styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={
              loadWishlist
            }
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          renderEmpty
        }
      />
    </SafeAreaView>
  );
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // -----------------------------------------------
  // HEADER
  // -----------------------------------------------

  header: {
    minHeight: 82,
    paddingHorizontal: 20,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: colors.background,

    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  headerButton: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.white,
  },

  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerEyebrow: {
    marginBottom: 3,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: colors.secondary,
  },

  headerTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
    marginTop: 20,

  },

  itemCount: {
    marginTop: 3,
    fontSize: 11,
    color: colors.textSecondary,
  },

  headerSpacer: {
    width: 42,
  },

  // -----------------------------------------------
  // LIST
  // -----------------------------------------------

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 40,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  // -----------------------------------------------
  // PRODUCT CARD
  // -----------------------------------------------

  productCard: {
    flexDirection: 'row',

    backgroundColor: colors.white,

    borderRadius: 22,

    marginBottom: 16,

    padding: 13,

    borderWidth: 1,
    borderColor: colors.border,

    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 13,
    elevation: 3,
  },

  // -----------------------------------------------
  // IMAGE
  // -----------------------------------------------

  imageContainer: {
    width: 125,
    height: 145,

    borderRadius: 17,

    backgroundColor: colors.cream,

    alignItems: 'center',
    justifyContent: 'center',

    position: 'relative',

    overflow: 'hidden',
  },

  productImage: {
    width: '92%',
    height: '92%',
  },

  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // -----------------------------------------------
  // REMOVE WISHLIST
  // -----------------------------------------------

  removeButton: {
    position: 'absolute',

    top: 8,
    right: 8,

    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,

    alignItems: 'center',
    justifyContent: 'center',

    elevation: 3,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },

  // -----------------------------------------------
  // PRODUCT DETAILS
  // -----------------------------------------------

  productInfo: {
    flex: 1,

    paddingLeft: 14,
    paddingVertical: 4,
  },

  productName: {
    fontSize: 16,
    lineHeight: 21,

    fontWeight: '700',

    color: colors.text,

    marginRight: 8,
  },

  // -----------------------------------------------
  // RATING
  // -----------------------------------------------

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 9,
  },

  rating: {
    marginLeft: 4,

    fontSize: 13,

    fontWeight: '600',

    color: colors.textSecondary,
  },

  reviewCount: {
    marginLeft: 4,

    fontSize: 12,

    color: colors.textLight,
  },

  // -----------------------------------------------
  // PRICE
  // -----------------------------------------------

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 9,
  },

  price: {
    fontSize: 18,

    fontWeight: '800',

    color: colors.text,
  },

  comparePrice: {
    marginLeft: 8,

    fontSize: 13,

    color: colors.textLight,

    textDecorationLine:
      'line-through',
  },

  // -----------------------------------------------
  // ADD TO CART
  // -----------------------------------------------

  addToCartButton: {
    marginTop: 12,

    height: 42,

    borderRadius: 21,

    backgroundColor: colors.primary,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 12,

    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 3,
  },

  addToCartText: {
    marginLeft: 7,

    fontSize: 13,

    fontWeight: '700',

    color: colors.white,
  },

  // -----------------------------------------------
  // QUANTITY
  // -----------------------------------------------

  quantityContainer: {
    marginTop: 12,

    height: 42,

    borderRadius: 21,

    backgroundColor: colors.white,

    borderWidth: 1,

    borderColor: colors.primary,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 5,
  },

  quantityButton: {
    width: 32,
    height: 32,

    borderRadius: 9,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.white,
  },

  quantityText: {
    minWidth: 28,

    textAlign: 'center',

    fontSize: 15,

    fontWeight: '800',

    color: colors.text,
  },

  // -----------------------------------------------
  // LOADING
  // -----------------------------------------------

  centerState: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 30,
  },

  stateText: {
    marginTop: 12,

    fontSize: 14,

    color: colors.textSecondary,
  },

  // -----------------------------------------------
  // EMPTY
  // -----------------------------------------------

  emptyState: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 32,
  },

  emptyIconCircle: {
    width: 96,
    height: 96,

    borderRadius: 48,

    backgroundColor: colors.white,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 22,

    borderWidth: 1,
    borderColor: colors.border,

    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  emptyTitle: {
    fontSize: 23,

    fontWeight: '800',

    color: colors.text,

    textAlign: 'center',
  },

  emptyDescription: {
    marginTop: 10,

    fontSize: 14,

    lineHeight: 21,

    color: colors.textSecondary,

    textAlign: 'center',

    maxWidth: 320,
  },

  shopButton: {
    marginTop: 24,

    height: 46,

    paddingHorizontal: 26,

    borderRadius: 23,

    backgroundColor: colors.primary,

    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,

    alignItems: 'center',
    justifyContent: 'center',
  },

  shopButtonText: {
    fontSize: 14,

    fontWeight: '700',

    color: colors.white,
  },
});