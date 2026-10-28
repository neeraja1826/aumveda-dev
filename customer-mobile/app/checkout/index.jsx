import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';

import {
  getAddresses,
} from '../../src/services/addressService';

import {
  createOrder,
} from '../../src/services/orderService';

import { colors } from '../../src/theme/colors';

import {
  getProductBySlug,
} from '../../src/services/productService';

export default function CheckoutRoute() {
  const router = useRouter();
const {
  buyNow,
  productId,
  productSlug,
  variantId,
  quantity,
  addressId,
} = useLocalSearchParams();
  const {
    cartItems,
    subtotal: cartSubtotal,
    isEmpty: cartIsEmpty,
    clearCart,
  } = useCart();

  const isBuyNow = buyNow === 'true';
  const initialBuyNowQuantity = Math.max(1, Number(quantity || 1));
  const [buyNowCheckoutQuantity, setBuyNowCheckoutQuantity] = useState(initialBuyNowQuantity);
  const buyNowQuantity = Math.max(1, Number(buyNowCheckoutQuantity || 1));

  useEffect(() => {
    setBuyNowCheckoutQuantity(initialBuyNowQuantity);
  }, [initialBuyNowQuantity]);

  const [buyNowProduct, setBuyNowProduct] = useState(null);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  useEffect(() => {
    if (!isBuyNow || !productSlug) {
      setBuyNowProduct(null);
      setBuyNowLoading(false);
      return;
    }

    let cancelled = false;

    const loadBuyNowProduct = async () => {
      try {
        setBuyNowLoading(true);

        console.log(
          'BUY NOW PRODUCT SLUG:',
          String(productSlug)
        );

        const data = await getProductBySlug(
          String(productSlug)
        );

        if (cancelled) return;

        console.log(
          'BUY NOW PRODUCT RESPONSE:',
          JSON.stringify(data, null, 2)
        );

        if (!data) {
          throw new Error('Product not found');
        }

        setBuyNowProduct(data);
      } catch (error) {
        if (cancelled) return;

        console.error(
          'BUY NOW PRODUCT ERROR:',
          error
        );
        setBuyNowProduct(null);
      } finally {
        if (!cancelled) {
          setBuyNowLoading(false);
        }
      }
    };

    loadBuyNowProduct();

    return () => {
      cancelled = true;
    };
  }, [isBuyNow, productSlug]);

  const buyNowItem = useMemo(() => {
    if (
      !isBuyNow ||
      !buyNowProduct ||
      !productId
    ) {
      return null;
    }

    const variant =
      buyNowProduct.variant ?? null;

    const itemPrice = Number(
      buyNowProduct.price ??
      variant?.price ??
      0
    );

    const image =
      buyNowProduct.image ??
      buyNowProduct.image_url ??
      buyNowProduct.thumbnail ??
      buyNowProduct.images?.[0] ??
      buyNowProduct.product_images?.find(
        (item) => item?.is_primary
      )?.image_url ??
      buyNowProduct.product_images?.[0]
        ?.image_url ??
      null;

    const selectedVariantId =
      variantId || variant?.id || null;

    const stock = Number(
      buyNowProduct.stock_quantity ??
      variant?.stock_quantity ??
      999999
    );

    return {
      ...buyNowProduct,
      id: buyNowProduct.id ?? productId,
      productId:
        buyNowProduct.id ?? productId,
      variantId: selectedVariantId,
      itemKey: `${productId}-${selectedVariantId || 'default'}`,
      name:
        buyNowProduct.name ??
        buyNowProduct.title ??
        'Product',
      image,
      variantName:
        buyNowProduct.variantName ??
        variant?.name ??
        '',
      price: itemPrice,
      stock_quantity: stock,
      quantity: buyNowQuantity,
    };
  }, [
    isBuyNow,
    buyNowProduct,
    productId,
    variantId,
    buyNowQuantity,
  ]);

  const checkoutItems = useMemo(
    () => isBuyNow ? (buyNowItem ? [buyNowItem] : []) : cartItems,
    [isBuyNow, buyNowItem, cartItems]
  );

  const subtotal = useMemo(
    () => checkoutItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    ),
    [checkoutItems]
  );

  const isEmpty = checkoutItems.length === 0;

  const {
    token,
    isAuthenticated,
  } = useAuth();

  // -----------------------------------------
  // ADDRESS STATE
  // -----------------------------------------

  const [addresses, setAddresses] =
    useState([]);

  const [selectedAddressId, setSelectedAddressId] =
    useState(null);

  const [loadingAddresses, setLoadingAddresses] =
    useState(true);

  const [addressError, setAddressError] =
    useState(null);

  // -----------------------------------------
  // ORDER STATE
  // -----------------------------------------

  const [placingOrder, setPlacingOrder] =
    useState(false);

  const [orderSuccessVisible, setOrderSuccessVisible] =
    useState(false);

  // The backend currently supports Cash on Delivery only.
  const [paymentMethod, setPaymentMethod] =
    useState('cod');

  // -----------------------------------------
  // DELIVERY
  // -----------------------------------------

  const deliveryCharge = useMemo(() => {
    if (subtotal >= 999) {
      return 0;
    }

    return 50;
  }, [subtotal]);

  const total = useMemo(() => {
    return (
      Number(subtotal || 0) +
      Number(deliveryCharge || 0)
    );
  }, [subtotal, deliveryCharge]);

  // -----------------------------------------
  // FORMAT PRICE
  // -----------------------------------------

  const formatPrice = (value) => {
    return `₹${Number(value || 0).toLocaleString(
      'en-IN'
    )}`;
  };

  // -----------------------------------------
  // LOAD ADDRESSES
  // -----------------------------------------

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      setAddressError(null);

      const response = await getAddresses(token);
      const addressList = Array.isArray(response)
        ? response
        : response?.addresses ?? response?.data?.addresses ?? response?.data ?? [];

      setAddresses(Array.isArray(addressList) ? addressList : []);

      if (addressList.length > 0) {
        const requestedAddress = addressId
  ? addressList.find(
      (item) => String(item.id) === String(addressId)
    )
  : null;

const defaultAddress = addressList.find(
  (item) => item?.is_default === true
);

const addressToSelect = requestedAddress || defaultAddress || null;

setSelectedAddressId(addressToSelect?.id ?? null);
      } else {
        setSelectedAddressId(null);
      }
    } catch (error) {
      console.error('Load addresses error:', error);
      setAddressError(error?.message || 'Unable to load addresses.');
      setAddresses([]);
      setSelectedAddressId(null);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      loadAddresses();
    } else {
      setAddresses([]);
      setSelectedAddressId(null);
      setLoadingAddresses(false);
    }
  }, [isAuthenticated, token, addressId]);

  const selectedAddress =
    addresses.find(
      (address) => String(address.id) === String(selectedAddressId)
    ) || null;

  const handleAddAddress = () => {
    router.push({
      pathname: '/address',
      params: {
        returnToCheckout: 'true',
        ...(buyNow ? { buyNow: String(buyNow) } : {}),
        ...(productId ? { productId: String(productId) } : {}),
        ...(productSlug ? { productSlug: String(productSlug) } : {}),
        ...(variantId ? { variantId: String(variantId) } : {}),
        ...(quantity ? { quantity: String(quantity) } : {}),
      },
    });
  };

  const handleShowAllAddresses = () => {
    router.push({
      pathname: '/address',
      params: {
        returnToCheckout: 'true',
        ...(buyNow ? { buyNow: String(buyNow) } : {}),
        ...(productId ? { productId: String(productId) } : {}),
        ...(productSlug ? { productSlug: String(productSlug) } : {}),
        ...(variantId ? { variantId: String(variantId) } : {}),
        ...(quantity ? { quantity: String(quantity) } : {}),
      },
    });
  };

  const handleEditAddress = () => {
    if (!selectedAddress?.id) return;

    router.push({
      pathname: '/address',
      params: {
        addressId: String(selectedAddress.id),
        returnToCheckout: 'true',
        ...(buyNow ? { buyNow: String(buyNow) } : {}),
        ...(productId ? { productId: String(productId) } : {}),
        ...(productSlug ? { productSlug: String(productSlug) } : {}),
        ...(variantId ? { variantId: String(variantId) } : {}),
        ...(quantity ? { quantity: String(quantity) } : {}),
      },
    });
  };

  // -----------------------------------------
  // VALIDATE ADDRESS
  // -----------------------------------------

  const validateSelectedAddress = () => {
    if (!selectedAddress) {
      Alert.alert(
        'Add delivery address',
        'Please add a delivery address before placing your order.',
        [
          {
            text: 'Add Address',
            onPress: handleAddAddress,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );

      return false;
    }

    if (
      !selectedAddress.recipient_name ||
      !selectedAddress.phone ||
      !selectedAddress.address_line1 ||
      !selectedAddress.city ||
      !selectedAddress.state ||
      !selectedAddress.postal_code
    ) {
      Alert.alert(
        'Incomplete address',
        'Please edit your address and complete all required details.'
      );

      return false;
    }

    return true;
  };

  // -----------------------------------------
  // PLACE ORDER
  // -----------------------------------------

  const handlePlaceOrder = async () => {
    if (placingOrder) {
      return;
    }

    if (isBuyNow ? checkoutItems.length === 0 : isEmpty) {
      Alert.alert(
        isBuyNow ? 'Product unavailable' : 'Cart is empty',
        isBuyNow
          ? 'The selected product could not be loaded. Please go back and try Buy Now again.'
          : 'Please add products to your cart before checkout.'
      );

      return;
    }

    if (!isAuthenticated || !token) {
      Alert.alert(
        'Login required',
        'Please login before placing your order.'
      );

      return;
    }

    if (!selectedAddress?.id) {
      Alert.alert(
        'Select delivery address',
        'Please select a delivery address before placing your order.'
      );
      return;
    }

    if (!validateSelectedAddress()) {
      return;
    }

    if (isBuyNow && checkoutItems.length !== 1) {
      Alert.alert(
        'Product unavailable',
        'The selected product could not be loaded. Please go back and try Buy Now again.'
      );
      return;
    }

    try {
      setPlacingOrder(true);

      // -----------------------------------------
      // SHIPPING ADDRESS
      // -----------------------------------------

      // -----------------------------------------
      // CREATE ORDER
      // -----------------------------------------

      const name = selectedAddress.recipient_name;
      const phone = selectedAddress.phone;
      const address = selectedAddress.address_line1;
      const pincode = selectedAddress.postal_code;
      const currentToken = token;

      if (!currentToken) {
        Alert.alert(
          'Login required',
          'Please login before placing your order.'
        );
        return;
      }
      const order =
        await createOrder({
          token: currentToken,
          addressId: selectedAddress.id,
          shippingAddress: {
            recipient_name: name.trim(),
            phone: phone.replace(/\D/g, ''),
            address_line1: address.trim(),
            city: selectedAddress.city.trim(),
            state: selectedAddress.state.trim(),
            postal_code: pincode.replace(/\D/g, ''),
            country: 'India',
          },
          paymentMethod,
          items: checkoutItems.map((item) => ({
            product_id: item.productId ?? item.id,
            variant_id: item.variantId ?? item.variant?.id ?? null,
            name: item.name,
            quantity: Number(item.quantity || 1),
            price: Number(item.price || 0),
          })),
        });

      console.log(
        'ORDER CREATED:',
        JSON.stringify(
          order,
          null,
          2
        )
      );

      if (!order) {
        throw new Error(
          'Order was not created.'
        );
      }

      // -----------------------------------------
      // CLEAR CART ONLY AFTER SUCCESS
      // -----------------------------------------
      // Buy Now is a direct checkout and must not remove
      // unrelated products from the user's cart.
      if (!isBuyNow) {
        await clearCart();
      }

      // -----------------------------------------
      // SUCCESS
      // -----------------------------------------

      // Use an in-app modal instead of Alert.alert(). React Native's
      // Alert.alert() does not reliably render native-style alerts on Expo Web.
      setOrderSuccessVisible(true);
    } catch (error) {
      console.error(
        'Place order error:',
        error
      );

      Alert.alert(
        'Order failed',
        error?.message ||
          'Something went wrong while placing your order. Please try again.'
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // -----------------------------------------
  // BUY NOW LOADING
  // -----------------------------------------

  if (isBuyNow && buyNowLoading) {
    return (
      <SafeAreaView
        style={styles.emptyContainer}
        edges={['top', 'bottom']}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text
          style={[
            styles.emptyTitle,
            { marginTop: 16 },
          ]}
        >
          Loading checkout...
        </Text>
      </SafeAreaView>
    );
  }

  // -----------------------------------------
  // EMPTY CART / INVALID BUY NOW
  // -----------------------------------------

  if (isBuyNow && !buyNowLoading && isEmpty) {
    return (
      <SafeAreaView
        style={styles.emptyContainer}
        edges={['top', 'bottom']}
      >
        <View style={styles.emptyIcon}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={colors.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          Product unavailable
        </Text>

        <Text style={styles.emptyMessage}>
          We could not load this product. Please go back and try Buy Now again.
        </Text>

        <Pressable
          style={styles.shopButton}
          onPress={() => router.back()}
        >
          <Text style={styles.shopButtonText}>
            Go Back
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!isBuyNow && isEmpty) {
    return (
      <SafeAreaView
        style={styles.emptyContainer}
        edges={['top', 'bottom']}
      >
        <View style={styles.emptyIcon}>
          <Ionicons
            name="bag-outline"
            size={42}
            color={colors.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          Your cart is empty
        </Text>

        <Text style={styles.emptyMessage}>
          Add some Ayurvedic products before
          proceeding to checkout.
        </Text>

        <Pressable
          style={styles.shopButton}
          onPress={() =>
            router.replace('/(tabs)')
          }
        >
          <Text style={styles.shopButtonText}>
            Continue Shopping
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <SafeAreaView
        style={styles.emptyContainer}
        edges={['top', 'bottom']}
      >
        <View style={styles.emptyIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={38}
            color={colors.primary}
          />
        </View>
        <Text style={styles.emptyTitle}>Sign in to continue</Text>
        <Text style={styles.emptyMessage}>
          Your cart is saved on this device. Sign in or create an account to add
          a delivery address and continue to payment.
        </Text>
        <Pressable
          style={styles.shopButton}
          onPress={() => router.push({
            pathname: '/(auth)/login',
            params: { returnTo: '/checkout' },
          })}
        >
          <Text style={styles.shopButtonText}>Sign in</Text>
        </Pressable>
        <Pressable
          style={styles.registerButton}
          onPress={() => router.push({
            pathname: '/(auth)/register',
            params: { returnTo: '/checkout' },
          })}
        >
          <Text style={styles.registerButtonText}>Create account</Text>
        </Pressable>
        <Pressable
          style={styles.backToCartButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backToCartText}>Back to cart</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // -----------------------------------------
  // CHECKOUT
  // -----------------------------------------

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text}
          />
        </Pressable>

        <View style={styles.headerHeading}>
          <Text style={styles.headerEyebrow}>
            AUMVEDA
          </Text>
          <Text style={styles.headerTitle}>
            Checkout
          </Text>
        </View>

        <View style={styles.secureHeaderBadge}>
          <Ionicons
            name="shield-checkmark-outline"
            size={17}
            color={colors.primary}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* -------------------------------- */}
        {/* DELIVERY ADDRESS */}
        {/* -------------------------------- */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons
                name="location-outline"
                size={19}
                color={colors.primary}
              />
            </View>

            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>
                Delivery Address
              </Text>

              <Text style={styles.sectionSubtitle}>
                Where should we deliver your order?
              </Text>
            </View>
          </View>

          {/* LOADING */}

          {loadingAddresses ? (
            <View style={styles.addressLoading}>
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />

              <Text
                style={styles.addressLoadingText}
              >
                Loading your addresses...
              </Text>
            </View>
          ) : null}

          {/* ERROR */}

          {!loadingAddresses &&
          addressError ? (
            <View style={styles.addressErrorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color={colors.primary}
              />

              <View
                style={
                  styles.addressErrorContent
                }
              >
                <Text
                  style={
                    styles.addressErrorTitle
                  }
                >
                  Unable to load addresses
                </Text>

                <Text
                  style={
                    styles.addressErrorText
                  }
                >
                  {addressError}
                </Text>

                <Pressable
                  onPress={loadAddresses}
                  style={
                    styles.retryButton
                  }
                >
                  <Text
                    style={
                      styles.retryButtonText
                    }
                  >
                    Try Again
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* NO ADDRESS */}

          {!loadingAddresses &&
          !addressError &&
          addresses.length === 0 ? (
            <View style={styles.noAddressBox}>
              <View style={styles.noAddressIcon}>
                <Ionicons
                  name="location-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.noAddressTitle}
              >
                No delivery address added
              </Text>

              <Text
                style={styles.noAddressText}
              >
                Add an address to continue with
                your order.
              </Text>

              <Pressable
                style={styles.addAddressButton}
                onPress={handleAddAddress}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={colors.white}
                />

                <Text
                  style={
                    styles.addAddressButtonText
                  }
                >
                  Add Address
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* SAVED ADDRESSES */}

          {!loadingAddresses &&
          !addressError &&
          addresses.length > 0 ? (
            <View>
              {selectedAddress ? (
                <View style={styles.addressCard}>
                  <View style={styles.compactAddressHeader}>
                    <View style={styles.compactAddressTitle}>
                      <Text style={styles.addressRecipient}>
                        {selectedAddress.recipient_name}
                      </Text>

                      {selectedAddress.label ? (
                        <View style={styles.compactAddressLabel}>
                          <Text style={styles.compactAddressLabelText}>
                            {selectedAddress.label.toUpperCase()}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Pressable
                      onPress={handleShowAllAddresses}
                      style={styles.compactChangeButton}
                    >
                      <Text style={styles.compactChangeText}>
                        CHANGE
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={styles.compactAddressPhone}>
                    {selectedAddress.phone}
                  </Text>

                  <Text
                    style={styles.compactAddressText}
                    numberOfLines={3}
                  >
                    {[
                      selectedAddress.address_line1,
                      selectedAddress.address_line2,
                      selectedAddress.city,
                      selectedAddress.state,
                      selectedAddress.postal_code,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </View>
              ) : (
                <View style={styles.noAddressBox}>
                  <View style={styles.noAddressIcon}>
                    <Ionicons
                      name="location-outline"
                      size={30}
                      color={colors.primary}
                    />
                  </View>

                  <Text style={styles.noAddressTitle}>
                    Select a delivery address
                  </Text>

                  <Text style={styles.noAddressText}>
                    Choose an address before placing your order.
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        {/* -------------------------------- */}
        {/* ORDER ITEMS */}
        {/* -------------------------------- */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons
                name="bag-outline"
                size={19}
                color={colors.primary}
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Your Order
              </Text>

              <Text style={styles.sectionSubtitle}>
                {checkoutItems.length}{' '}
                {checkoutItems.length === 1
                  ? 'item'
                  : 'items'}
              </Text>
            </View>
          </View>

          {checkoutItems.map((item) => (
            <View
              key={item.itemKey}
              style={styles.productRow}
            >
              <View
                style={
                  styles.productImageBox
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
                  <Ionicons
                    name="leaf-outline"
                    size={28}
                    color={
                      colors.primary
                    }
                  />
                )}
              </View>

              <View
                style={
                  styles.productInfo
                }
              >
                <Text
                  style={
                    styles.productName
                  }
                  numberOfLines={2}
                >
                  {item.name}
                </Text>

                {item.variantName ? (
                  <Text
                    style={
                      styles.variant
                    }
                  >
                    {item.variantName}
                  </Text>
                ) : null}

                <Text
                  style={
                    styles.quantity
                  }
                >
                  Qty: {item.quantity}
                </Text>

                {isBuyNow ? (
                  <View style={styles.buyNowQuantityControls}>
                    <Pressable
                      style={[
                        styles.buyNowQuantityButton,
                        item.quantity <= 1 && styles.buyNowQuantityButtonDisabled,
                      ]}
                      onPress={() => {
                        if (buyNowCheckoutQuantity > 1) {
                          setBuyNowCheckoutQuantity((current) => current - 1);
                        }
                      }}
                      disabled={buyNowCheckoutQuantity <= 1}
                    >
                      <Text style={styles.buyNowQuantityButtonText}>−</Text>
                    </Pressable>

                    <Text style={styles.buyNowQuantityValue}>
                      {buyNowCheckoutQuantity}
                    </Text>

                    <Pressable
                      style={[
                        styles.buyNowQuantityButton,
                        buyNowCheckoutQuantity >= Number(item.stock_quantity ?? item.variant?.stock_quantity ?? 999999) &&
                          styles.buyNowQuantityButtonDisabled,
                      ]}
                      onPress={() => {
                        const availableStock = Number(
                          item.stock_quantity ?? item.variant?.stock_quantity ?? 999999
                        ) || 999999;

                        if (buyNowCheckoutQuantity < availableStock) {
                          setBuyNowCheckoutQuantity((current) => current + 1);
                        }
                      }}
                    >
                      <Text style={styles.buyNowQuantityButtonText}>+</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>

              <Text
                style={
                  styles.productPrice
                }
              >
                {formatPrice(
                  Number(item.price) *
                    Number(
                      item.quantity
                    )
                )}
              </Text>
            </View>
          ))}
        </View>

        {/* -------------------------------- */}
        {/* PAYMENT METHOD */}
        {/* -------------------------------- */}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons
                name="card-outline"
                size={19}
                color={colors.primary}
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>
                Payment Method
              </Text>

              <Text style={styles.sectionSubtitle}>
                Choose how you would like to pay
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.paymentOption,
              styles.paymentOptionLast,
              paymentMethod === 'cod' &&
                styles.paymentOptionSelected,
            ]}
            onPress={() =>
              setPaymentMethod('cod')
            }
          >
            <View style={styles.paymentOptionIcon}>
              <Ionicons
                name="cash-outline"
                size={20}
                color={colors.primary}
              />
            </View>

            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>
                Cash on Delivery
              </Text>
              <Text style={styles.paymentOptionSubtitle}>
                Pay when your order arrives
              </Text>
            </View>

            <View
              style={[
                styles.radioOuter,
                paymentMethod === 'cod' &&
                  styles.radioOuterSelected,
              ]}
            >
              {paymentMethod === 'cod' ? (
                <View style={styles.radioInner} />
              ) : null}
            </View>
          </Pressable>
        </View>

        {/* -------------------------------- */}
        {/* PRICE DETAILS */}
        {/* -------------------------------- */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Price Details
          </Text>

          <View style={styles.priceRow}>
            <Text
              style={
                styles.priceLabel
              }
            >
              Subtotal
            </Text>

            <Text
              style={
                styles.priceValue
              }
            >
              {formatPrice(subtotal)}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text
              style={
                styles.priceLabel
              }
            >
              Delivery
            </Text>

            <Text
              style={[
                styles.priceValue,
                deliveryCharge === 0 &&
                  styles.freeText,
              ]}
            >
              {deliveryCharge === 0
                ? 'FREE'
                : formatPrice(
                    deliveryCharge
                  )}
            </Text>
          </View>

          {deliveryCharge === 0 ? (
            <Text
              style={
                styles.freeDeliveryNote
              }
            >
              Free delivery on orders above ₹999
            </Text>
          ) : null}

          <View
            style={styles.divider}
          />

          <View
            style={styles.totalRow}
          >
            <Text
              style={styles.totalLabel}
            >
              Total
            </Text>

            <Text
              style={styles.totalValue}
            >
              {formatPrice(total)}
            </Text>
          </View>
        </View>

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>

      {/* -------------------------------- */}
      {/* PLACE ORDER */}
      {/* -------------------------------- */}

      <View style={styles.bottomBar}>
        <View>
          <Text
            style={styles.bottomLabel}
          >
            Total Amount
          </Text>

          <Text
            style={styles.bottomTotal}
          >
            {formatPrice(total)}
          </Text>
        </View>

        <Pressable
          style={[
            styles.placeOrderButton,

            (!selectedAddress ||
              placingOrder) &&
              styles.placeOrderDisabled,
          ]}
          onPress={
            handlePlaceOrder
          }
          disabled={
            placingOrder ||
            !selectedAddress
          }
        >
          {placingOrder ? (
            <ActivityIndicator
              size="small"
              color={colors.white}
            />
          ) : (
            <>
              <Text
                style={
                  styles.placeOrderText
                }
              >
                {selectedAddress
                  ? 'Place Order'
                  : 'Add Address'}
              </Text>

              <Ionicons
                name={
                  selectedAddress
                    ? 'arrow-forward'
                    : 'location-outline'
                }
                size={18}
                color={
                  colors.white
                }
              />
            </>
          )}
        </Pressable>
      </View>
      </KeyboardAvoidingView>

      <Modal
        visible={orderSuccessVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setOrderSuccessVisible(false);
          router.replace('/(tabs)');
        }}
      >
        <View style={styles.successModalBackdrop}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={34} color="#FFFFFF" />
            </View>
            <Text style={styles.successModalTitle}>Order placed successfully!</Text>
            <Text style={styles.successModalMessage}>
              Thank you for shopping with AUMVEDA. Your order has been received.
            </Text>
            <Pressable
              style={styles.successPrimaryButton}
              onPress={() => {
                setOrderSuccessVisible(false);
                router.replace('/orders');
              }}
            >
              <Text style={styles.successPrimaryButtonText}>View Orders</Text>
            </Pressable>
            <Pressable
              style={styles.successSecondaryButton}
              onPress={() => {
                setOrderSuccessVisible(false);
                router.replace('/(tabs)');
              }}
            >
              <Text style={styles.successSecondaryButtonText}>Continue Shopping</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// =========================================
// STYLES
// =========================================

const styles = StyleSheet.create({
  successModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 22, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    padding: 26,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  successModalTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  successModalMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary || '#667085',
    textAlign: 'center',
    marginBottom: 24,
  },
  successPrimaryButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  successPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  successSecondaryButton: {
    width: '100%',
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F5F3',
    paddingHorizontal: 16,
  },
  successSecondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor:
      colors.border,
    backgroundColor: colors.white,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor: colors.background,
  },

  headerHeading: {
    flex: 1,
  },

  headerEyebrow: {
    marginBottom: 2,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: colors.secondary,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },

  secureHeaderBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },

  section: {
    marginBottom: 16,
    padding: 17,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor:
      colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.045,
    shadowRadius: 12,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    marginRight: 11,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      colors.cream,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color:
      colors.textSecondary,
  },

  // -----------------------------------------
  // ADDRESS
  // -----------------------------------------

  addressLoading: {
    minHeight: 90,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  addressLoadingText: {
    marginTop: 8,
    fontSize: 12,
    color:
      colors.textSecondary,
  },

  addressErrorBox: {
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    backgroundColor:
      colors.background,
    borderWidth: 1,
    borderColor:
      colors.border,
  },

  addressErrorContent: {
    flex: 1,
    marginLeft: 10,
  },

  addressErrorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  addressErrorText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color:
      colors.textSecondary,
  },

  retryButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },

  retryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  noAddressBox: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },

  noAddressIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      colors.cream,
  },

  noAddressTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },

  noAddressText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    color:
      colors.textSecondary,
    textAlign: 'center',
  },

  addAddressButton: {
    marginTop: 15,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 7,
    backgroundColor:
      colors.primary,
  },

  addAddressButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },

  addressCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor:
      colors.background,
    borderWidth: 1,
    borderColor:
      colors.border,
  },

  addressCardSelected: {
    borderColor:
      colors.primary,
    borderWidth: 1.5,
  },

  addressCardTop: {
    flexDirection: 'row',
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: 2,
    alignItems: 'center',
    justifyContent:
      'center',
    borderWidth: 1.5,
    borderColor:
      colors.border,
  },

  radioOuterSelected: {
    borderColor:
      colors.primary,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor:
      colors.primary,
  },

  addressMain: {
    flex: 1,
    marginLeft: 11,
  },

  addressNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  addressRecipient: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  defaultBadge: {
    marginLeft: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor:
      colors.cream,
  },

  defaultBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.primary,
  },

  addressLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '600',
    color:
      colors.textSecondary,
  },

  addressText: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 17,
    color:
      colors.textSecondary,
  },

  addressPhone: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },

  selectedAddressFooter: {
    marginTop: 12,
    paddingTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  selectedAddressText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },

  editButton: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor:
      colors.cream,
  },

  editButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },

  addNewAddressButton: {
    minHeight: 64,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor:
      colors.primary,
  },

  addNewAddressIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      colors.cream,
  },

  addNewAddressTitle: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },

  addNewAddressSubtitle: {
    marginLeft: 10,
    marginTop: 3,
    fontSize: 10,
    color:
      colors.textSecondary,
  },

  addNewAddressArrow: {
    marginLeft: 'auto',
  },

  // -----------------------------------------
  // PRODUCTS
  // -----------------------------------------

  productRow: {
    minHeight: 92,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
  },

  productImageBox: {
    width: 72,
    height: 72,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      colors.cream,
    overflow: 'hidden',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  productInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },

  productName: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.text,
  },

  variant: {
    marginTop: 3,
    fontSize: 10,
    color:
      colors.textSecondary,
  },

  quantity: {
    marginTop: 4,
    fontSize: 10,
    color:
      colors.textSecondary,
  },

  buyNowQuantityControls: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },

  buyNowQuantityButton: {
    width: 30,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buyNowQuantityButtonDisabled: {
    opacity: 0.35,
  },

  buyNowQuantityButtonText: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
  },

  buyNowQuantityValue: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },

  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  // -----------------------------------------
  // PAYMENT METHOD
  // -----------------------------------------

  paymentOption: {
    minHeight: 74,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    marginBottom: 11,
    backgroundColor: colors.background,
  },

  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.cream,
    borderWidth: 1.5,
  },

  paymentOptionLast: {
    marginBottom: 0,
  },

  paymentOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },

  paymentOptionContent: {
    flex: 1,
    marginLeft: 11,
  },

  paymentOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },

  paymentOptionSubtitle: {
    marginTop: 4,
    fontSize: 10,
    color: colors.textSecondary,
  },

  // -----------------------------------------
  // PRICE
  // -----------------------------------------

  priceRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  priceLabel: {
    fontSize: 12,
    color:
      colors.textSecondary,
  },

  priceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },

  freeText: {
    color: colors.primary,
  },

  freeDeliveryNote: {
    marginTop: 7,
    fontSize: 10,
    color: colors.primary,
  },

  divider: {
    height: 1,
    marginTop: 16,
    backgroundColor:
      colors.border,
  },

  totalRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },

  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },

  bottomSpace: {
    height: 110,
  },

  // -----------------------------------------
  // BOTTOM BAR
  // -----------------------------------------

  bottomBar: {
    minHeight: 88,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor:
      colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },

  bottomLabel: {
    fontSize: 10,
    color:
      colors.textSecondary,
  },

  bottomTotal: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },

  placeOrderButton: {
    minWidth: 165,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 9,
    backgroundColor:
      colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    elevation: 3,
  },

  placeOrderDisabled: {
    opacity: 0.65,
  },

  placeOrderText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },

  // -----------------------------------------
  // EMPTY CART
  // -----------------------------------------

  emptyContainer: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      colors.background,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      colors.cream,
  },

  emptyTitle: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },

  emptyMessage: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color:
      colors.textSecondary,
    textAlign: 'center',
  },

  shopButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      colors.primary,
  },

  shopButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  registerButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  registerButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  backToCartButton: { marginTop: 18, padding: 8 },
  backToCartText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  compactAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },

  compactAddressTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },

  compactAddressLabel: {
    backgroundColor: '#F1F3F6',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },

  compactAddressLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#565656',
  },

  compactChangeButton: {
    paddingVertical: 6,
    paddingLeft: 8,
  },

  compactChangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.4,
  },

  compactAddressPhone: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 5,
  },

  compactAddressText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#565656',
  },
});