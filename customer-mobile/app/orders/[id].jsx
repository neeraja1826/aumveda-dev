import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import OrderTracking from '../../src/components/orders/OrderTracking';
import { useAuth } from '../../src/context/AuthContext';
import {
  createReturnRequest,
  getOrder,
  getOrderReturnRequests,
} from '../../src/services/orderService';
import { colors } from '../../src/theme/colors';

function formatAmount(value, currency = 'INR') {
  const amount = Number(value);
  const formattedNumber = Number.isFinite(amount)
    ? amount.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00';
  return currency === 'INR' || currency === '₹'
    ? `₹${formattedNumber}`
    : `${currency} ${formattedNumber}`;
}

function getStatusTheme(statusRaw) {
  const s = String(statusRaw || '').toLowerCase();
  if (s.includes('deliver') || s.includes('complete')) {
    return {
      bg: '#E8F2E7',
      border: '#CDE2CB',
      color: '#123D2B',
      icon: 'checkmark-circle-outline',
    };
  }
  if (s.includes('cancel')) {
    return {
      bg: '#FDEEEE',
      border: '#F7D7D7',
      color: '#B85C5C',
      icon: 'close-circle-outline',
    };
  }
  if (s.includes('return')) {
    return {
      bg: '#FEF7E6',
      border: '#EBDCB9',
      color: '#A87E34',
      icon: 'return-down-back-outline',
    };
  }
  if (s.includes('ship') || s.includes('transit')) {
    return {
      bg: '#EBF4F6',
      border: '#BDE0E8',
      color: '#1C5B6B',
      icon: 'car-outline',
    };
  }
  return {
    bg: '#FEF7E6',
    border: '#F6E5C8',
    color: '#B8860B',
    icon: 'time-outline',
  };
}

function getReturnStatusTheme(statusRaw) {
  const status = String(statusRaw || '').trim().toLowerCase();
  const labels = {
    requested: 'Request received',
    under_review: 'Under review',
    approved: 'Approved',
    rejected: 'Rejected',
    pickup_scheduled: 'Pickup scheduled',
    item_received: 'Item received',
    replacement_processing: 'Replacement processing',
    refund_processing: 'Refund processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  if (status === 'rejected' || status === 'cancelled') {
    return {
      label: labels[status],
      backgroundColor: '#FDEEEE',
      color: '#B85C5C',
      icon: 'close-circle-outline',
    };
  }

  if (status === 'completed' || status === 'approved') {
    return {
      label: labels[status],
      backgroundColor: '#E8F2E7',
      color: '#123D2B',
      icon: 'checkmark-circle-outline',
    };
  }

  if (
    status === 'pickup_scheduled' ||
    status === 'item_received' ||
    status === 'replacement_processing' ||
    status === 'refund_processing'
  ) {
    return {
      label: labels[status],
      backgroundColor: '#EBF4F6',
      color: '#1C5B6B',
      icon: 'sync-outline',
    };
  }

  return {
    label:
      labels[status] ||
      (status ? status.replaceAll('_', ' ') : 'Status unavailable'),
    backgroundColor: '#FEF7E6',
    color: '#A87E34',
    icon: 'time-outline',
  };
}

function DetailRow({ label, value, emphasized = false, valueColor }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, emphasized && styles.emphasizedLabel]}>
        {label}
      </Text>
      <Text
        style={[
          styles.detailValue,
          emphasized && styles.totalValue,
          valueColor ? { color: valueColor } : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function addressLines(order) {
  const address = order?.shipping_address;

  if (!address || typeof address !== 'object') {
    return null;
  }

  const street = [address.address_line1, address.address_line2]
    .filter(Boolean)
    .join(', ');

  const location = [address.city, address.state, address.postal_code, address.country]
    .filter(Boolean)
    .join(', ');

  return {
    recipient_name: address.recipient_name || '',
    phone: address.phone || '',
    street,
    location,
  };
}

export default function OrderDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const orderId = Array.isArray(id) ? id[0] : id;
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [returnRequests, setReturnRequests] = useState([]);
  const [returnLoading, setReturnLoading] = useState(true);
  const [returnError, setReturnError] = useState('');
  const [returnFormItemId, setReturnFormItemId] = useState(null);
  const [returnType, setReturnType] = useState('return');
  const [returnQuantity, setReturnQuantity] = useState('1');
  const [returnReason, setReturnReason] = useState('damaged_product');
  const [returnDescription, setReturnDescription] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnSubmitError, setReturnSubmitError] = useState('');
  const [returnSubmitSuccess, setReturnSubmitSuccess] = useState('');

  useEffect(() => {
    let active = true;
    getOrder(token, orderId)
      .then((result) => {
        if (active) {
          setOrder(result);
          setError('');
        }
      })
      .catch((loadError) => {
        console.error('Load order details error:', loadError);
        if (active) {
          setError(loadError?.message || 'Unable to load order details.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orderId, retryKey, token]);

  useEffect(() => {
    let active = true;

    async function loadReturnRequests() {
      if (!token || !orderId) {
        setReturnRequests([]);
        setReturnLoading(false);
        return;
      }

      setReturnLoading(true);
      setReturnError('');

      try {
        const requests = await getOrderReturnRequests(token, orderId);

        if (active) {
          setReturnRequests(requests);
        }
      } catch (err) {
        console.error('Load return requests error:', err);

        if (active) {
          setReturnError('Unable to load return details.');
        }
      } finally {
        if (active) {
          setReturnLoading(false);
        }
      }
    }

    loadReturnRequests();

    return () => {
      active = false;
    };
  }, [token, orderId]);

  async function submitReturnRequest(item) {
    if (!token) {
      router.push('/(auth)/login');
      return;
    }

    if (!item?.id) {
      setReturnSubmitError('This order item is missing its ID.');
      return;
    }

    const quantity = Number(returnQuantity);
    const availableQuantity = Number(item.quantity) || 0;

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > availableQuantity) {
      setReturnSubmitError(`Enter a quantity between 1 and ${availableQuantity}.`);
      return;
    }

    if (!returnReason.trim()) {
      setReturnSubmitError('Please select a reason for your request.');
      return;
    }

    setReturnSubmitting(true);
    setReturnSubmitError('');
    setReturnSubmitSuccess('');

    try {
      await createReturnRequest({
        token,
        orderId,
        orderItemId: item.id,
        requestType: returnType,
        requestedQuantity: quantity,
        reason: returnReason,
        description: returnDescription,
      });

      const requests = await getOrderReturnRequests(token, orderId);
      setReturnRequests(requests);
      setReturnFormItemId(null);
      setReturnDescription('');
      setReturnQuantity('1');
      setReturnSubmitSuccess('Your request has been submitted successfully.');
    } catch (submitError) {
      console.error('Create return request error:', submitError);
      setReturnSubmitError(
        submitError?.message || 'Unable to submit your return request.'
      );
    } finally {
      setReturnSubmitting(false);
    }
  }

  const currency = order?.currency || 'INR';
  const items = Array.isArray(order?.items) ? order.items : [];
  const addressData = order ? addressLines(order) : null;
  const statusTheme = getStatusTheme(order?.status);

  // Formatted order ID string (matches mockup: #AUM-20261105065552518)
  const displayOrderId = order
    ? order.order_number
      ? String(order.order_number).startsWith('#')
        ? order.order_number
        : String(order.order_number).startsWith('AUM-')
          ? `#${order.order_number}`
          : `#AUM-${order.order_number}`
      : `#AUM-${order.id}`
    : '';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* TOP-RIGHT CORNER BOTANICAL BRANCH ACCENT */}
      <Image
        source={require('../../assets/leaves-top-left.png')}
        style={styles.topRightBranch}
        resizeMode="contain"
        pointerEvents="none"
      />

      {/* TOP NAVIGATION BAR */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.circleBackButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#123D2B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      {/* BODY CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#123D2B" />
          <Text style={styles.helperText}>Loading order details…</Text>
        </View>
      ) : !token ? (
        <View style={styles.center}>
          <View style={styles.stateCard}>
            <View style={styles.stateIconOuter}>
              <View style={styles.stateIconInner}>
                <Ionicons name="person-outline" size={34} color="#123D2B" />
              </View>
            </View>
            <Text style={styles.emptyTitle}>Sign In Required</Text>
            <Text style={styles.message}>Sign in to view details for this order.</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <View style={styles.stateCard}>
            <View style={[styles.stateIconOuter, styles.errorIconOuter]}>
              <View style={[styles.stateIconInner, styles.errorIconInner]}>
                <Ionicons name="alert-circle-outline" size={34} color={colors.danger} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>Order Error</Text>
            <Text style={styles.message}>{error}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                setLoading(true);
                setRetryKey((key) => key + 1);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : !order ? (
        <View style={styles.center}>
          <View style={styles.stateCard}>
            <View style={styles.stateIconOuter}>
              <View style={styles.stateIconInner}>
                <Ionicons name="search-outline" size={34} color="#123D2B" />
              </View>
            </View>
            <Text style={styles.emptyTitle}>Order Not Found</Text>
            <Text style={styles.message}>This order could not be located in your history.</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Back to Orders</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ============================================================
              CARD 1: PURCHASED BOTANICALS & ORDER ID / STATUS CARD
          ============================================================ */}
          <View style={styles.mainCard}>
            {items.map((item, index) => {
              const quantity = Number(item.quantity) || 1;
              const unitPrice = Number(item.unit_price) || 0;
              const lineTotal =
                item.total_price == null
                  ? unitPrice * quantity
                  : Number(item.total_price);
              const productImages = item.product?.product_images || [];
              const imageUrl =
                item.image_url ||
                item.product?.image_url ||
                productImages.find((image) => image.is_primary)?.image_url ||
                productImages[0]?.image_url ||
                '';
              const productSlug =
                item.product?.slug || item.product_slug || item.slug;

              const existingRequest = returnRequests.find(
                (request) => String(request.order_item_id) === String(item.id)
              );
              const returnStatus = existingRequest
                ? getReturnStatusTheme(existingRequest.status)
                : null;
              const isDelivered =
                String(order.status || '').toLowerCase() === 'delivered';
              const canRequestReturn =
                isDelivered &&
                !returnLoading &&
                !returnError &&
                !existingRequest &&
                Boolean(item.id);
              const isFormOpen = String(returnFormItemId) === String(item.id);

              return (
                <View key={item.id || `${item.product_id || 'item'}-${index}`}>
                  {/* PRODUCT ITEM ROW */}
                  <TouchableOpacity
                    style={styles.productRow}
                    onPress={() => {
                      if (!productSlug) {
                        console.warn(
                          'Order product does not have a slug:',
                          item
                        );
                        return;
                      }

                      router.push({
                        pathname: '/products/[slug]',
                        params: { slug: String(productSlug) },
                      });
                    }}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                  >
                    {/* THUMBNAIL */}
                    <View style={styles.productThumbWrap}>
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.productThumb}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.thumbPlaceholder}>
                          <Ionicons name="leaf-outline" size={24} color="#123D2B" />
                        </View>
                      )}
                    </View>

                    {/* PRODUCT DETAILS */}
                    <View style={styles.productInfoWrap}>
                      <Text style={styles.productTitle} numberOfLines={2}>
                        {item.product_name || item.product_id || 'Ayurvedic Botanical'}
                      </Text>

                      {/* VARIANT PILL (e.g. 50 g) */}
                      <View style={styles.variantPill}>
                        <Text style={styles.variantPillText}>
                          {item.variant_name || '50 g'}
                        </Text>
                      </View>

                      {/* QTY */}
                      <Text style={styles.qtyText}>Qty: {quantity}</Text>
                    </View>

                    {/* PRICE ALIGNED ON THE RIGHT */}
                    <Text style={styles.productPrice}>
                      {formatAmount(lineTotal, currency)}
                    </Text>
                  </TouchableOpacity>

                  {/* RETURN / REPLACEMENT ACTION IF DELIVERED */}
                  {canRequestReturn ? (
                    <View style={styles.returnActionWrap}>
                      <TouchableOpacity
                        style={styles.returnActionButton}
                        onPress={() => {
                          setReturnFormItemId(isFormOpen ? null : item.id);
                          setReturnType('return');
                          setReturnQuantity('1');
                          setReturnReason('damaged_product');
                          setReturnDescription('');
                          setReturnSubmitError('');
                          setReturnSubmitSuccess('');
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isFormOpen ? 'close' : 'return-down-back-outline'}
                          size={14}
                          color="#123D2B"
                        />
                        <Text style={styles.returnActionText}>
                          {isFormOpen ? 'Cancel Request' : 'Request Return / Replacement'}
                        </Text>
                      </TouchableOpacity>

                      {isFormOpen ? (
                        <View style={styles.returnForm}>
                          <Text style={styles.formLabel}>REQUEST TYPE</Text>
                          <View style={styles.choiceRow}>
                            {[
                              { label: 'Return & Refund', value: 'return' },
                              { label: 'Replacement', value: 'replacement' },
                            ].map((choice) => (
                              <TouchableOpacity
                                key={choice.value}
                                style={[
                                  styles.choiceButton,
                                  returnType === choice.value &&
                                    styles.choiceButtonActive,
                                ]}
                                onPress={() => setReturnType(choice.value)}
                              >
                                <Text
                                  style={[
                                    styles.choiceButtonText,
                                    returnType === choice.value &&
                                      styles.choiceButtonTextActive,
                                  ]}
                                >
                                  {choice.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          <Text style={styles.formLabel}>
                            QUANTITY (MAX {quantity})
                          </Text>
                          <TextInput
                            value={returnQuantity}
                            onChangeText={setReturnQuantity}
                            keyboardType="number-pad"
                            maxLength={String(quantity).length || 1}
                            style={styles.formInput}
                            placeholder="Enter quantity"
                            placeholderTextColor="#8F8D85"
                          />

                          <Text style={styles.formLabel}>REASON</Text>
                          <View style={styles.reasonChoices}>
                            {[
                              {
                                label: 'Damaged Product',
                                value: 'damaged_product',
                              },
                              { label: 'Wrong Item', value: 'wrong_item' },
                              {
                                label: 'Quality Issue',
                                value: 'quality_issue',
                              },
                              { label: 'Other', value: 'other' },
                            ].map((choice) => (
                              <TouchableOpacity
                                key={choice.value}
                                style={[
                                  styles.reasonChip,
                                  returnReason === choice.value &&
                                    styles.reasonChipActive,
                                ]}
                                onPress={() => setReturnReason(choice.value)}
                              >
                                <Text
                                  style={[
                                    styles.reasonChipText,
                                    returnReason === choice.value &&
                                      styles.reasonChipTextActive,
                                  ]}
                                >
                                  {choice.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          <Text style={styles.formLabel}>
                            ADDITIONAL DETAILS (OPTIONAL)
                          </Text>
                          <TextInput
                            value={returnDescription}
                            onChangeText={setReturnDescription}
                            multiline
                            maxLength={1000}
                            placeholder="Please describe any issues..."
                            placeholderTextColor="#8F8D85"
                            style={[styles.formInput, styles.descriptionInput]}
                            textAlignVertical="top"
                          />

                          {returnSubmitError ? (
                            <Text style={styles.formError}>
                              {returnSubmitError}
                            </Text>
                          ) : null}

                          <TouchableOpacity
                            style={[
                              styles.submitButton,
                              returnSubmitting && styles.buttonDisabled,
                            ]}
                            disabled={returnSubmitting}
                            onPress={() => submitReturnRequest(item)}
                          >
                            {returnSubmitting ? (
                              <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                              <Text style={styles.submitButtonText}>
                                Submit Request
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  ) : existingRequest ? (
                    <View
                      style={[
                        styles.existingRequestBadge,
                        { backgroundColor: returnStatus.backgroundColor },
                      ]}
                    >
                      <Ionicons
                        name={returnStatus.icon}
                        size={14}
                        color={returnStatus.color}
                      />
                      <View style={styles.existingRequestInfo}>
                        <Text style={styles.existingRequestText}>
                          {existingRequest.request_type === 'replacement'
                            ? 'Replacement request'
                            : 'Return request'}
                        </Text>
                        <Text
                          style={[
                            styles.existingRequestStatus,
                            { color: returnStatus.color },
                          ]}
                        >
                          {returnStatus.label}
                        </Text>
                        {returnSubmitSuccess ? (
                          <Text style={styles.returnSubmitSuccessText}>
                            {returnSubmitSuccess}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ) : returnLoading ? (
                    <View style={styles.returnStatusNotice}>
                      <ActivityIndicator size="small" color="#A87E34" />
                      <Text style={styles.returnStatusNoticeText}>
                        Checking return request status...
                      </Text>
                    </View>
                  ) : returnError ? (
                    <Text style={styles.returnStatusError}>{returnError}</Text>
                  ) : null}
                </View>
              );
            })}

            {/* DIVIDER LINE */}
            <View style={styles.cardDivider} />

            {/* BOTTOM ROW: ORDER ID & STATUS WITH VERTICAL DIVIDER */}
            <View style={styles.orderMetaRow}>
              {/* ORDER ID */}
              <View style={styles.orderIdGroup}>
                <Text style={styles.metaLabel}>Order ID</Text>
                <Text style={styles.orderIdText}>{displayOrderId}</Text>
              </View>

              {/* VERTICAL DIVIDER */}
              <View style={styles.verticalDivider} />

              {/* STATUS */}
              <View style={styles.statusGroup}>
                <Text style={styles.metaLabel}>Status</Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: statusTheme.bg,
                      borderColor: statusTheme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={statusTheme.icon}
                    size={14}
                    color={statusTheme.color}
                    style={styles.statusIcon}
                  />
                  <Text style={[styles.statusPillText, { color: statusTheme.color }]}>
                    {String(order.status || 'Placed').replaceAll('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ============================================================
              CARD 2: ORDER TRACKING (HORIZONTAL STEPPER)
          ============================================================ */}
          <OrderTracking status={order.status} />

          {/* ============================================================
              CARD 3: PAYMENT SUMMARY
          ============================================================ */}
          <View style={styles.sectionCard}>
            {/* WATERMARK LEAF IN TOP RIGHT OF CARD */}
            <Image
              source={require('../../assets/leaves-top-left.png')}
              style={styles.cardWatermarkLeaf}
              resizeMode="contain"
              pointerEvents="none"
            />

            {/* HEADER */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="card-outline" size={17} color="#123D2B" />
              </View>
              <Text style={styles.sectionTitle}>Payment Summary</Text>
            </View>

            {/* SUBTOTAL */}
            <DetailRow
              label="Subtotal"
              value={formatAmount(order.subtotal, currency)}
            />

            {/* DISCOUNT IF ANY */}
            {Number(order.discount) > 0 ? (
              <DetailRow
                label="Discount"
                value={`− ${formatAmount(order.discount, currency)}`}
                valueColor="#2E7D32"
              />
            ) : null}

            {Number(order.discount_amount) > 0 ? (
              <DetailRow
                label="Discount"
                value={`− ${formatAmount(order.discount_amount, currency)}`}
                valueColor="#2E7D32"
              />
            ) : null}

            {/* DIVIDER */}
            <View style={styles.totalDivider} />

            {/* GRAND TOTAL */}
            <DetailRow
              label="Grand Total"
              value={formatAmount(order.total_amount, currency)}
              emphasized
            />

            {/* PAYMENT METHOD ROW */}
            <View style={styles.paymentMethodRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <View style={styles.paymentMethodBadge}>
                <Ionicons name="card-outline" size={13} color="#1A2E22" />
                <Text style={styles.paymentMethodBadgeText}>
                  {String(order.payment_method || 'COD').replaceAll('_', ' ')}
                </Text>
              </View>
            </View>
          </View>

          {/* ============================================================
              CARD 4: DELIVERY ADDRESS
          ============================================================ */}
          <View style={styles.sectionCard}>
            {/* HEADER */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="location-outline" size={18} color="#123D2B" />
              </View>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>

            {/* WARM ADDRESS CONTAINER */}
            {addressData ? (
              <View style={styles.addressBox}>
                {addressData.recipient_name ? (
                  <Text style={styles.addressName}>
                    {addressData.recipient_name}
                  </Text>
                ) : null}

                {addressData.phone ? (
                  <Text style={styles.addressPhone}>{addressData.phone}</Text>
                ) : null}

                {addressData.street ? (
                  <Text style={styles.addressStreet}>{addressData.street}</Text>
                ) : null}

                {addressData.location ? (
                  <Text style={styles.addressLocation}>
                    {addressData.location}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.helperText}>
                No delivery address was provided.
              </Text>
            )}
          </View>

          {/* ============================================================
              CARD 5: NEED HELP WITH THIS ORDER BANNER
          ============================================================ */}
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.helpCard}
            onPress={() => router.push('/contact')}
            activeOpacity={0.85}
          >
            <View style={styles.helpIconWrap}>
              <Ionicons name="headset-outline" size={20} color="#123D2B" />
            </View>

            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>Need help with this order?</Text>
              <Text style={styles.helpSubtitle}>
                Get support for returns, exchanges or other queries.
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#123D2B" />
          </TouchableOpacity>

          <View style={styles.bottomSpace} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    position: 'relative',
  },

  topRightBranch: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 130,
    height: 130,
    opacity: 0.35,
    transform: [{ scaleX: -1 }],
  },

  /* HEADER BAR */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 14,
  },

  circleBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7DA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
    letterSpacing: -0.2,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },

  /* ============================================================
     CARD 1: PRODUCT & ORDER ID/STATUS
  ============================================================ */
  mainCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7DA',
    padding: 16,
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },

  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  productThumbWrap: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#F6F1E7',
    borderWidth: 1,
    borderColor: '#EFE8DC',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  productThumb: {
    width: '100%',
    height: '100%',
  },

  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  productInfoWrap: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
    justifyContent: 'center',
  },

  productTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1A2E22',
    fontFamily: 'InterSemiBold',
    lineHeight: 21,
    marginBottom: 4,
  },

  variantPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: '#F5EFE6',
    marginBottom: 4,
  },

  variantPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#78603C',
    fontFamily: 'InterSemiBold',
  },

  qtyText: {
    fontSize: 13,
    color: '#655E54',
    fontFamily: 'InterRegular',
    marginTop: 2,
  },

  productPrice: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#F0E9DC',
    marginVertical: 14,
  },

  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  orderIdGroup: {
    flex: 1,
  },

  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E786E',
    fontFamily: 'InterSemiBold',
    marginBottom: 4,
  },

  orderIdText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
    letterSpacing: 0.1,
  },

  verticalDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#EFE8DC',
    marginHorizontal: 16,
  },

  statusGroup: {
    alignItems: 'flex-start',
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },

  statusIcon: {
    marginRight: 5,
  },

  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'InterSemiBold',
    textTransform: 'capitalize',
  },

  /* ============================================================
     COMMON SECTION CARD STYLING
  ============================================================ */
  sectionCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7DA',
    padding: 16,
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },

  cardWatermarkLeaf: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 82,
    height: 76,
    opacity: 0.22,
    transform: [{ scaleX: -1 }],
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },

  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EDF5EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
    letterSpacing: -0.2,
  },

  /* DETAIL ROWS */
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },

  detailLabel: {
    fontSize: 13.5,
    color: '#5E5950',
    fontFamily: 'InterRegular',
  },

  emphasizedLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
  },

  detailValue: {
    fontSize: 14,
    color: '#1A2E22',
    fontFamily: 'InterRegular',
  },

  totalValue: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
  },

  totalDivider: {
    height: 1,
    backgroundColor: '#F0E9DC',
    marginVertical: 10,
  },

  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 4,
  },

  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#E6DCC8',
  },

  paymentMethodBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A2E22',
    fontFamily: 'InterSemiBold',
    textTransform: 'uppercase',
  },

  /* ============================================================
     DELIVERY ADDRESS BOX
  ============================================================ */
  addressBox: {
    borderRadius: 14,
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#EFE8DC',
    padding: 14,
  },

  addressName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1A2E22',
    fontFamily: 'InterSemiBold',
    marginBottom: 2,
  },

  addressPhone: {
    fontSize: 13,
    color: '#555046',
    fontFamily: 'InterRegular',
    marginTop: 2,
  },

  addressStreet: {
    fontSize: 13,
    color: '#555046',
    fontFamily: 'InterRegular',
    marginTop: 2,
  },

  addressLocation: {
    fontSize: 13,
    color: '#555046',
    fontFamily: 'InterRegular',
    marginTop: 2,
  },

  /* ============================================================
     NEED HELP WITH THIS ORDER BANNER
  ============================================================ */
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#EDF5EB',
    borderWidth: 1,
    borderColor: '#DCEADC',
    marginBottom: 14,
  },

  helpIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  helpContent: {
    flex: 1,
    paddingRight: 8,
  },

  helpTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
    marginBottom: 2,
  },

  helpSubtitle: {
    fontSize: 11.5,
    color: '#5E6E60',
    fontFamily: 'InterRegular',
  },

  bottomSpace: {
    height: 20,
  },

  /* ============================================================
     FALLBACK & STATE STYLING
  ============================================================ */
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  helperText: {
    marginTop: 10,
    fontSize: 13,
    color: '#7E766B',
    fontFamily: 'InterRegular',
    textAlign: 'center',
  },

  stateCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE7DA',
    width: '100%',
    maxWidth: 340,
  },

  stateIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3EFE6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  stateIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorIconOuter: {
    backgroundColor: '#FDEEEE',
  },

  errorIconInner: {
    backgroundColor: '#FFFFFF',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
    marginBottom: 6,
  },

  message: {
    fontSize: 13,
    color: '#655E54',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#123D2B',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'InterSemiBold',
  },

  /* RETURN REQUEST FORM & BADGES */
  returnActionWrap: {
    marginTop: 10,
  },

  returnActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#123D2B',
    alignSelf: 'flex-start',
  },

  returnActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
  },

  returnForm: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },

  formLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#706047',
    fontFamily: 'InterSemiBold',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 6,
  },

  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },

  choiceButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6DCC8',
    alignItems: 'center',
  },

  choiceButtonActive: {
    backgroundColor: '#123D2B',
    borderColor: '#123D2B',
  },

  choiceButtonText: {
    fontSize: 11.5,
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
  },

  choiceButtonTextActive: {
    color: '#FFFFFF',
  },

  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6DCC8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#1A2E22',
  },

  descriptionInput: {
    height: 70,
  },

  reasonChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  reasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6DCC8',
  },

  reasonChipActive: {
    backgroundColor: '#123D2B',
    borderColor: '#123D2B',
  },

  reasonChipText: {
    fontSize: 11,
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
  },

  reasonChipTextActive: {
    color: '#FFFFFF',
  },

  submitButton: {
    marginTop: 12,
    backgroundColor: '#123D2B',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'InterSemiBold',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  formError: {
    marginTop: 6,
    color: colors.danger,
    fontSize: 11.5,
  },

  existingRequestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },

  existingRequestInfo: {
    flex: 1,
  },

  existingRequestText: {
    fontSize: 11.5,
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
  },

  existingRequestStatus: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: 'InterSemiBold',
    textTransform: 'capitalize',
  },

  returnSubmitSuccessText: {
    marginTop: 2,
    color: '#123D2B',
    fontSize: 11,
  },

  returnStatusNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },

  returnStatusNoticeText: {
    color: '#706047',
    fontSize: 11,
  },

  returnStatusError: {
    marginTop: 8,
    color: colors.danger,
    fontSize: 11,
  },
});
