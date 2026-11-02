import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import { useWishlist } from '../src/context/WishlistContext';
import { useCart } from '../src/context/CartContext';
import { colors } from '../src/theme/colors';

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

    const variantId = product?.variant?.id ?? null;

    return (
      cartItems.find((item) => {
        if (item?.productId !== product.id) {
          return false;
        }

        // Match exact variant
        if (variantId) {
          return item?.variantId === variantId;
        }

        return true;
      }) || null
    );
  };

  // -----------------------------------------
  // ADD TO CART
  // -----------------------------------------
  const handleAddToCart = (product) => {
    if (!product?.id) {
      return;
    }

    const existingCartItem = getCartItem(product);

    // Already in cart
    if (existingCartItem) {
      increaseQuantity(existingCartItem.itemKey);
      return;
    }

    // Not in cart
    addToCart(product, 1, product?.variant ?? null);
  };

  // -----------------------------------------
  // PLUS
  // -----------------------------------------
  const handleIncrease = (product) => {
    const cartItem = getCartItem(product);

    if (!cartItem) {
      handleAddToCart(product);
      return;
    }

    increaseQuantity(cartItem.itemKey);
  };

  // -----------------------------------------
  // MINUS
  // -----------------------------------------
  const handleDecrease = (product) => {
    const cartItem = getCartItem(product);

    if (!cartItem) {
      return;
    }

    decreaseQuantity(cartItem.itemKey);
  };

  // -----------------------------------------
  // REMOVE FROM WISHLIST
  // -----------------------------------------
  const handleRemove = async (productId) => {
    const result = await removeProduct(productId);

    if (!result?.success) {
      Alert.alert('Unable to remove', 'Please try again.');
    }
  };

  // -----------------------------------------
  // OPEN PRODUCT
  // -----------------------------------------
  const openProduct = (product) => {
    if (!product?.slug) {
      return;
    }

    router.push(`/products/${product.slug}`);
  };

  // -----------------------------------------
  // SAFE BACK NAVIGATION
  // -----------------------------------------
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  // -----------------------------------------
  // PRODUCT CARD
  // -----------------------------------------
  const renderProduct = ({ item }) => {
    const cartItem = getCartItem(item);
    const quantity = Number(cartItem?.quantity || 0);
    const isInCart = Boolean(cartItem && quantity > 0);

    const price = Number(item?.price ?? item?.variant?.price ?? 0);
    const compareAtPrice = Number(
      item?.compare_at_price ?? item?.variant?.compare_at_price ?? 0
    );
    const hasDiscount = compareAtPrice > price && price > 0;
    const discount = hasDiscount
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

    const imageUrl =
      item?.image ??
      item?.image_url ??
      item?.thumbnail ??
      item?.images?.[0] ??
      item?.product_images?.[0]?.image_url ??
      null;

    const imageSource =
      typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl;

    const categoryLabel =
      item?.category_name ||
      item?.category?.name ||
      'Ayurvedic Care';

    return (
      <View style={styles.productCard}>
        {/* PRODUCT IMAGE SECTION */}
        <Pressable
          style={styles.imageContainer}
          onPress={() => openProduct(item)}
          accessibilityRole="button"
          accessibilityLabel={`View details for ${item.name}`}
        >
          {imageUrl ? (
            <Image
              source={imageSource}
              style={styles.productImage}
              contentFit="contain"
              transition={150}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="leaf-outline"
                size={30}
                color={colors.sageDark}
              />
            </View>
          )}

          {/* DISCOUNT BADGE */}
          {hasDiscount && discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}

          {/* REMOVE FROM WISHLIST BUTTON */}
          <Pressable
            style={({ pressed }) => [
              styles.removeButton,
              pressed && styles.removeButtonPressed,
            ]}
            onPress={() => handleRemove(item.id)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.name} from wishlist`}
          >
            <Ionicons name="heart" size={17} color={colors.danger} />
          </Pressable>
        </Pressable>

        {/* PRODUCT DETAILS */}
        <View style={styles.productInfo}>
          <Pressable
            onPress={() => openProduct(item)}
            style={styles.detailsPressable}
          >
            {/* CATEGORY EYEBROW */}
            <Text style={styles.categoryEyebrow} numberOfLines={1}>
              {categoryLabel.toUpperCase()}
            </Text>

            {/* NAME */}
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>

            {/* RATING */}
            {item.rating ? (
              <View style={styles.ratingRow}>
                <View style={styles.ratingChip}>
                  <Ionicons name="star" size={11} color={colors.gold} />
                  <Text style={styles.ratingText}>
                    {Number(item.rating).toFixed(1)}
                  </Text>
                </View>

                {item.review_count ? (
                  <Text style={styles.reviewCount}>
                    ({item.review_count})
                  </Text>
                ) : null}
              </View>
            ) : null}

            {/* PRICE ROW */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>
                ₹{price.toLocaleString('en-IN')}
              </Text>

              {hasDiscount && (
                <Text style={styles.comparePrice}>
                  ₹{compareAtPrice.toLocaleString('en-IN')}
                </Text>
              )}
            </View>
          </Pressable>

          {/* CART CONTROL */}
          {!isInCart ? (
            <Pressable
              style={({ pressed }) => [
                styles.addToCartButton,
                pressed && styles.addToCartButtonPressed,
              ]}
              onPress={() => handleAddToCart(item)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${item.name} to cart`}
            >
              <Ionicons
                name="bag-add-outline"
                size={16}
                color={colors.white}
              />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </Pressable>
          ) : (
            <View style={styles.quantityContainer}>
              {/* MINUS */}
              <Pressable
                style={({ pressed }) => [
                  styles.quantityButton,
                  pressed && styles.quantityButtonPressed,
                ]}
                onPress={() => handleDecrease(item)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={16} color={colors.primary} />
              </Pressable>

              {/* QUANTITY */}
              <View style={styles.quantityTextWrap}>
                <Text style={styles.quantityText}>{quantity}</Text>
                <Text style={styles.inCartSubtext}>in cart</Text>
              </View>

              {/* PLUS */}
              <Pressable
                style={({ pressed }) => [
                  styles.quantityButton,
                  pressed && styles.quantityButtonPressed,
                ]}
                onPress={() => handleIncrease(item)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={16} color={colors.primary} />
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
        <View style={styles.centerState}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Gathering your botanical treasures...
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.centerState}>
        <View style={styles.stateCard}>
          {/* DUAL RING BOTANICAL ICON */}
          <View style={styles.stateIconOuter}>
            <View style={styles.stateIconInner}>
              <Ionicons name="heart-outline" size={34} color={colors.danger} />
            </View>
          </View>

          <View style={styles.emptyEyebrowRow}>
            <Ionicons name="sparkles" size={11} color={colors.gold} />
            <Text style={styles.emptyEyebrow}>YOUR WELLNESS WISHLIST</Text>
          </View>

          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>

          <Text style={styles.emptyDescription}>
            Save your favorite Ayurvedic formulations, herbal remedies, and teas to curate your personal wellness ritual.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.shopButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="Explore Products"
          >
            <LinearGradient
              colors={['#123D2B', '#1E583E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shopButtonGradient}
            >
              <Text style={styles.shopButtonText}>Explore Products</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </LinearGradient>
          </Pressable>

          {/* TRUST BADGES ROW */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="leaf-outline" size={13} color={colors.primary} />
              <Text style={styles.trustText}>100% Herbal</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark-outline" size={13} color={colors.primary} />
              <Text style={styles.trustText}>Pure Ayurveda</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="sparkles-outline" size={13} color={colors.primary} />
              <Text style={styles.trustText}>Fast Delivery</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // -----------------------------------------
  // MAIN SCREEN
  // -----------------------------------------
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER WITH SAGE GRADIENT (SAME AS ORDERS / HOMEHEADER) */}
      <SafeAreaView edges={['top']} style={styles.safeHeaderArea}>
        <LinearGradient
          colors={['#E5F2E4', '#D9EAD7', '#CDE2CB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            {/* BACK BUTTON */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={handleBack}
              hitSlop={10}
              style={({ pressed }) => [
                styles.circleButton,
                pressed && styles.circleButtonPressed,
              ]}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </Pressable>

            {/* TITLE GROUP */}
            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerEyebrow}>AUMVEDA | SAVED FOR YOU</Text>
              <Text style={styles.title}>Wishlist</Text>
            </View>

            {/* COUNT BADGE OR SPACER */}
            {wishlist.length > 0 ? (
              <View style={styles.countBadge}>
                <Ionicons name="heart" size={13} color={colors.danger} />
                <Text style={styles.countBadgeText}>{wishlist.length}</Text>
              </View>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
        </LinearGradient>
      </SafeAreaView>

      {/* CONTENT WITH BOTTOM SAFE AREA */}
      <SafeAreaView edges={['bottom']} style={styles.contentSafeArea}>
        {/* WISHLIST PRODUCTS LIST */}
        <FlatList
          data={wishlist}
          keyExtractor={(item, index) =>
            String(item?.id ?? item?.slug ?? index)
          }
          renderItem={renderProduct}
          ListHeaderComponent={
            wishlist.length > 0 ? (
              <View style={styles.perkBanner}>
                <View style={styles.perkIconWrap}>
                  <Ionicons name="leaf" size={12} color={colors.primary} />
                </View>
                <Text style={styles.perkBannerText} numberOfLines={1}>
                  100% Pure Ayurvedic formulations • Direct from botanical gardens
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={[
            styles.listContent,
            wishlist.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadWishlist}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      </SafeAreaView>
    </View>
  );
}

// ==================================================
// STYLES
// ==================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },

  safeHeaderArea: {
    backgroundColor: '#E5F2E4',
  },

  contentSafeArea: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },

  // -----------------------------------------------
  // HEADER GRADIENT & CONTROLS (MATCHES ORDERS SCREEN)
  // -----------------------------------------------
  headerGradient: {
    width: '100%',
    paddingTop: 6,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderWidth: 0.2,
    borderColor: '#276345',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  header: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F4E7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  circleButtonPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: '#F5F5F0',
  },

  headerTitleGroup: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },

  headerEyebrow: {
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.textSecondary,
    marginBottom: 2,
    fontWeight: '700',
  },

  title: {
    fontSize: 21,
    color: colors.primary,
    fontWeight: '700',
  },

  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 0.8,
    borderColor: '#CDE2CB',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  countBadgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },

  headerSpacer: {
    width: 40,
  },

  // -----------------------------------------------
  // PERK BANNER
  // -----------------------------------------------
  perkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F2E7',
    borderWidth: 1,
    borderColor: '#CDE2CB',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },

  perkIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  perkBannerText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.primary,
  },

  // -----------------------------------------------
  // LIST
  // -----------------------------------------------
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
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
    borderRadius: 20,
    marginBottom: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8EFE6',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  // -----------------------------------------------
  // IMAGE SECTION
  // -----------------------------------------------
  imageContainer: {
    width: 120,
    height: 142,
    borderRadius: 16,
    backgroundColor: '#F5F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  productImage: {
    width: '90%',
    height: '90%',
  },

  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  discountBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    backgroundColor: colors.gold,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    zIndex: 2,
  },

  discountText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.3,
  },

  removeButton: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#E5DFD3',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  removeButtonPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: '#FFF2F2',
  },

  // -----------------------------------------------
  // PRODUCT DETAILS
  // -----------------------------------------------
  productInfo: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'space-between',
  },

  detailsPressable: {
    flex: 1,
  },

  categoryEyebrow: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: colors.gold,
    marginBottom: 3,
  },

  productName: {
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '700',
    color: colors.primary,
  },

  // -----------------------------------------------
  // RATING
  // -----------------------------------------------
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },

  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  reviewCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // -----------------------------------------------
  // PRICE
  // -----------------------------------------------
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    marginBottom: 8,
  },

  price: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.primary,
  },

  comparePrice: {
    marginLeft: 7,
    fontSize: 12,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },

  // -----------------------------------------------
  // ADD TO CART BUTTON
  // -----------------------------------------------
  addToCartButton: {
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2,
  },

  addToCartButtonPressed: {
    backgroundColor: '#0D2D20',
    transform: [{ scale: 0.98 }],
  },

  addToCartText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.white,
  },

  // -----------------------------------------------
  // QUANTITY CONTROL
  // -----------------------------------------------
  quantityContainer: {
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F2E7',
    borderWidth: 1,
    borderColor: '#CDE2CB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },

  quantityButtonPressed: {
    backgroundColor: '#E5F2E4',
    transform: [{ scale: 0.93 }],
  },

  quantityTextWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.primary,
    lineHeight: 16,
  },

  inCartSubtext: {
    fontSize: 8.5,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: -1,
  },

  // -----------------------------------------------
  // LOADING / CENTER STATE
  // -----------------------------------------------
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EFE6',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // -----------------------------------------------
  // EMPTY STATE (MATCHES ORDERS SCREEN PATTERN)
  // -----------------------------------------------
  stateCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EFE6',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  stateIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F2E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  stateIconInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  emptyEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },

  emptyEyebrow: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: colors.gold,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },

  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },

  shopButton: {
    width: '100%',
    borderRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  shopButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: 24,
  },

  shopButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.white,
  },

  // -----------------------------------------------
  // TRUST ROW
  // -----------------------------------------------
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(18, 61, 43, 0.08)',
    width: '100%',
  },

  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  trustText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },

  trustDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CDE2CB',
  },
});
