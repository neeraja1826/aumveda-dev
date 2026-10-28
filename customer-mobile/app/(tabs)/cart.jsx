import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useCart } from '../../src/context/CartContext';
import { useWishlist } from '../../src/context/WishlistContext';
import { getProductById } from '../../src/services/productService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CartScreen() {
  const router = useRouter();
  const [productDescriptions, setProductDescriptions] = useState({});
  const requestedDescriptions = useRef(new Set());
  const isMounted = useRef(true);

  // -----------------------------------------
  // CART
  // -----------------------------------------

  const {
    cartItems,
    cartCount,
    subtotal,
    isEmpty,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = useCart();

  // -----------------------------------------
  // WISHLIST
  // -----------------------------------------

  const {
    addProduct,
  } = useWishlist();

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    cartItems.forEach((item) => {
      if (
        item.description ||
        !item.productId ||
        requestedDescriptions.current.has(item.itemKey)
      ) {
        return;
      }

      requestedDescriptions.current.add(item.itemKey);

      getProductById(item.productId)
        .then((product) => {
          const description =
            product?.description ??
            product?.short_description;

          if (
            isMounted.current &&
            typeof description === 'string' &&
            description.trim()
          ) {
            setProductDescriptions((current) => ({
              ...current,
              [item.itemKey]: description.trim(),
            }));
          }
        })
        .catch((error) => {
          console.error(
            'Cart product description error:',
            error
          );
        });
    });
  }, [cartItems]);

  // -----------------------------------------
  // REMOVE ITEM
  // -----------------------------------------

  const handleRemovePress = (item) => {
    if (!item?.itemKey) {
      return;
    }

    Alert.alert(
      'Remove Product',
      `What would you like to do with "${item.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Remove from Cart',
          style: 'destructive',
          onPress: () => {
            removeFromCart(
              item.itemKey
            );
          },
        },

        {
          text: 'Move to Wishlist',
          onPress: async () => {
            try {
              const product = {
                id: item.productId,
                name: item.name,
                slug: item.slug,
                image: item.image,
                price: item.price,

                variant: item.variantId
                  ? {
                      id: item.variantId,
                      name: item.variantName,
                      price: item.price,
                    }
                  : null,
              };

              const result =
                await addProduct(
                  product
                );

              if (!result?.success) {
                Alert.alert(
                  'Unable to move',
                  result?.error?.message ||
                    'Could not add this product to your wishlist.'
                );

                return;
              }

              // Remove from cart only
              // after wishlist succeeds.
              removeFromCart(
                item.itemKey
              );

              Alert.alert(
                'Moved to Wishlist',
                `${item.name} has been moved to your wishlist.`
              );
            } catch (error) {
              console.error(
                'MOVE TO WISHLIST ERROR:',
                error
              );

              Alert.alert(
                'Unable to move',
                'Something went wrong. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleProductPress = (item) => {
    if (!item?.slug) {
      console.warn(
        'Cart product does not have a slug:',
        item
      );
      return;
    }

    router.push({
      pathname: '/products/[slug]',
      params: {
        slug: item.slug,
      },
    });
  };

  // -----------------------------------------
  // EMPTY CART
  // -----------------------------------------
  if (isEmpty) {
    return (
      <SafeAreaView style={styles.emptyContainer} edges={['top', 'bottom']}>
        <View style={styles.emptyIconWrapper}>
          <View style={styles.emptyIconInner}>
            <Ionicons name="bag-handle-outline" size={42} color="#A87E34" />
          </View>
        </View>

        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>

        <Text style={styles.emptyDescription}>
          Immerse yourself in authentic Ayurvedic wellness and discover pure botanical formulations crafted for daily harmony.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.shopButtonWrapper,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push('/products')}
          accessibilityRole="button"
          accessibilityLabel="Explore Formulations"
        >
          <LinearGradient
            colors={['#F5D68E', '#DCA84E', '#B88226']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shopButton}
          >
            <Text style={styles.shopButtonText}>Explore Formulations</Text>
            <Ionicons name="arrow-forward" size={16} color="#082618" />
          </LinearGradient>
        </Pressable>

        <View style={styles.emptyTrustRow}>
          <View style={styles.emptyTrustItem}>
            <Ionicons name="sparkles" size={13} color="#A87E34" />
            <Text style={styles.emptyTrustText}>100% Authentic</Text>
          </View>
          <View style={styles.emptyTrustDivider} />
          <View style={styles.emptyTrustItem}>
            <Ionicons name="shield-checkmark" size={13} color="#A87E34" />
            <Text style={styles.emptyTrustText}>Secure Checkout</Text>
          </View>
          <View style={styles.emptyTrustDivider} />
          <View style={styles.emptyTrustItem}>
            <Ionicons name="gift-outline" size={13} color="#A87E34" />
            <Text style={styles.emptyTrustText}>Free Delivery</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // -----------------------------------------
  // MAIN CART
  // -----------------------------------------
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* ---------------------------------- */}
      {/* HEADER */}
      {/* ---------------------------------- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.eyebrowRow}>
            <Ionicons name="sparkles" size={11} color="#A87E34" />
            <Text style={styles.eyebrow}>AUMVEDA BOTANICALS</Text>
          </View>

          <Text style={styles.title}>Your Cart</Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
          </Text>
        </View>
      </View>

      {/* Free Delivery Banner */}
      <View style={styles.deliveryBanner}>
        <Ionicons name="gift-outline" size={15} color="#0F442C" />
        <Text style={styles.deliveryBannerText}>
          ✨ Complimentary Express Delivery included with your order!
        </Text>
      </View>

      {/* ---------------------------------- */}
      {/* CART ITEMS */}
      {/* ---------------------------------- */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cartItems.map((item) => (
          <View key={item.itemKey} style={styles.cartItem}>
            {/* Image */}
            <Pressable
              style={styles.imageContainer}
              onPress={() => handleProductPress(item)}
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.productImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noImage}>
                  <Ionicons name="leaf-outline" size={28} color="#0F442C" />
                </View>
              )}
            </Pressable>

            {/* Details */}
            <View style={styles.details}>
              <View style={styles.topRow}>
                <Pressable
                  style={styles.productLink}
                  onPress={() => handleProductPress(item)}
                >
                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                </Pressable>

                {/* Remove */}
                <Pressable
                  onPress={() => handleRemovePress(item)}
                  hitSlop={10}
                  style={({ pressed }) => [
                    styles.removeButton,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Remove item"
                >
                  <Ionicons name="trash-outline" size={17} color="#948E84" />
                </Pressable>
              </View>

              {(item.description || productDescriptions[item.itemKey]) ? (
                <Text style={styles.description} numberOfLines={1}>
                  {item.description || productDescriptions[item.itemKey]}
                </Text>
              ) : null}

              {/* Variant Badge */}
              {item.variantName ? (
                <View style={styles.variantBadge}>
                  <Text style={styles.variantText}>{item.variantName}</Text>
                </View>
              ) : null}

              {/* Price & Quantity Controls */}
              <View style={styles.bottomRow}>
                <View style={styles.quantityContainer}>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => decreaseQuantity(item.itemKey)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease quantity"
                  >
                    <Ionicons name="remove" size={14} color="#0F442C" />
                  </Pressable>

                  <Text style={styles.quantity}>{item.quantity}</Text>

                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => increaseQuantity(item.itemKey)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel="Increase quantity"
                  >
                    <Ionicons name="add" size={14} color="#0F442C" />
                  </Pressable>
                </View>

                {/* Item Total */}
                <Text style={styles.itemTotal}>
                  ₹{(Number(item.price || 0) * Number(item.quantity || 0)).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* -------------------------------- */}
        {/* CART TOTALS AND CHECKOUT */}
        {/* -------------------------------- */}
        <LinearGradient
          colors={['#0C2B1D', '#061D13']}
          style={styles.summary}
        >
          <View style={styles.summaryHeaderRow}>
            <Ionicons name="sparkles" size={12} color="#D4AF37" />
            <Text style={styles.summaryEyebrow}>ORDER SUMMARY</Text>
          </View>

          <View style={styles.summaryDetails}>
            <View style={styles.summaryDetailRow}>
              <Text style={styles.summaryLabel}>Total Items</Text>
              <Text style={styles.summaryValue}>{cartCount}</Text>
            </View>

            <View style={styles.summaryDetailRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                ₹{Number(subtotal || 0).toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.summaryDetailRow}>
              <Text style={styles.summaryLabel}>Standard Delivery</Text>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.summaryPrice}>
              ₹{Number(subtotal || 0).toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Checkout Button */}
          <Pressable
            style={({ pressed }) => [
              styles.checkoutButtonWrapper,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/checkout')}
            accessibilityRole="button"
            accessibilityLabel="Proceed to Checkout"
          >
            <LinearGradient
              colors={['#F5D68E', '#DCA84E', '#B88226']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkoutButton}
            >
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={18} color="#082618" />
            </LinearGradient>
          </Pressable>

          {/* Trust Badges */}
          <View style={styles.trustRow}>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#D4AF37" />
              <Text style={styles.trustText}>Secure Checkout</Text>
            </View>

            <View style={styles.trustBadge}>
              <Ionicons name="leaf" size={14} color="#D4AF37" />
              <Text style={styles.trustText}>100% Authentic</Text>
            </View>
          </View>

          <Text style={styles.summaryFootnote}>
            Taxes, delivery address and payment methods will be finalized during checkout.
          </Text>
        </LinearGradient>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },

  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },

  // --------------------------------
  // HEADER
  // --------------------------------
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flex: 1,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },

  eyebrow: {
    fontSize: 10,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#A87E34',
  },

  title: {
    fontSize: 27,
    lineHeight: 32,
    fontFamily: 'PlayfairSemiBold',
    fontWeight: '700',
    color: '#112D20',
    letterSpacing: 0.2,
  },

  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 63, 42, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(15, 63, 42, 0.14)',
  },

  countBadgeText: {
    fontSize: 12,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#0F3F2A',
  },

  deliveryBanner: {
    marginHorizontal: 18,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 63, 42, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(15, 63, 42, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  deliveryBannerText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: 'InterMedium',
    fontWeight: '600',
    color: '#0F3F2A',
  },

  // --------------------------------
  // SCROLL
  // --------------------------------
  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },

  // --------------------------------
  // CART ITEM
  // --------------------------------
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECE7DC',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#172C1E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  imageContainer: {
    width: 94,
    height: 104,
    borderRadius: 14,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#EFECE4',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  productImage: {
    width: '90%',
    height: '90%',
  },

  noImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  productLink: {
    flex: 1,
    paddingRight: 6,
  },

  productName: {
    fontSize: 14.5,
    lineHeight: 19,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#152E22',
  },

  removeButton: {
    padding: 3,
  },

  description: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'InterRegular',
    color: '#768278',
  },

  variantBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: '#F5F2EB',
    borderWidth: 1,
    borderColor: '#E6E0D4',
  },

  variantText: {
    fontSize: 10,
    fontFamily: 'InterMedium',
    fontWeight: '600',
    color: '#756345',
  },

  bottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  quantityContainer: {
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5DFD2',
    backgroundColor: '#F4F0E8',
    flexDirection: 'row',
    alignItems: 'center',
  },

  quantityButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantity: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#112B1F',
  },

  itemTotal: {
    fontSize: 16,
    fontFamily: 'InterSemiBold',
    fontWeight: '800',
    color: '#0F3F2A',
  },

  bottomSpace: {
    height: 24,
  },

  // --------------------------------
  // SUMMARY
  // --------------------------------
  summary: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 22,
    borderRadius: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },

  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  summaryEyebrow: {
    fontSize: 10,
    fontFamily: 'InterSemiBold',
    fontWeight: '800',
    letterSpacing: 1.6,
    color: '#D4AF37',
  },

  summaryDetails: {
    marginTop: 16,
    gap: 12,
  },

  summaryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  summaryLabel: {
    fontSize: 13,
    fontFamily: 'InterRegular',
    color: '#D1DDD6',
  },

  summaryValue: {
    fontSize: 13.5,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#FFFFFF',
  },

  freeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },

  freeBadgeText: {
    fontSize: 10.5,
    fontFamily: 'InterSemiBold',
    fontWeight: '800',
    color: '#F5D68E',
    letterSpacing: 0.5,
  },

  summaryDivider: {
    height: 1,
    marginTop: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
  },

  summaryTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  totalLabel: {
    fontSize: 14.5,
    fontFamily: 'InterMedium',
    fontWeight: '600',
    color: '#E0EDE6',
  },

  summaryPrice: {
    fontSize: 24,
    fontFamily: 'PlayfairSemiBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },

  checkoutButtonWrapper: {
    marginTop: 20,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },

  checkoutButton: {
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  checkoutText: {
    fontSize: 14,
    fontFamily: 'InterSemiBold',
    fontWeight: '800',
    color: '#082618',
    letterSpacing: 0.2,
  },

  trustRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  trustBadge: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },

  trustText: {
    fontSize: 10.5,
    fontFamily: 'InterMedium',
    fontWeight: '600',
    color: '#E2EBE5',
  },

  summaryFootnote: {
    marginTop: 14,
    fontSize: 10,
    fontFamily: 'InterRegular',
    lineHeight: 14,
    color: '#9EAEA5',
    textAlign: 'center',
  },

  // --------------------------------
  // EMPTY CART
  // --------------------------------
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F8F6F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.8,
    borderColor: '#D4AF37',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#172C1E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },

  emptyIconInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    fontSize: 25,
    fontFamily: 'PlayfairSemiBold',
    fontWeight: '700',
    color: '#112D20',
    letterSpacing: 0.2,
  },

  emptyDescription: {
    marginTop: 10,
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: 'InterRegular',
    color: '#69776E',
    textAlign: 'center',
  },

  shopButtonWrapper: {
    marginTop: 26,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },

  shopButton: {
    height: 50,
    paddingHorizontal: 26,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  shopButtonText: {
    color: '#082618',
    fontSize: 14,
    fontFamily: 'InterSemiBold',
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  emptyTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 36,
    gap: 12,
  },

  emptyTrustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  emptyTrustText: {
    fontSize: 11,
    fontFamily: 'InterMedium',
    fontWeight: '600',
    color: '#6B7A70',
  },

  emptyTrustDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C5BEB0',
  },
});