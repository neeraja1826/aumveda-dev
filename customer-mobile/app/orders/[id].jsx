import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
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
    border: '#EBDCB9',
    color: '#8A6510',
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
    return [];
  }

  return [
    address.recipient_name,
    address.phone,
    address.address_line1,
    address.address_line2,
    [address.city, address.state, address.postal_code]
      .filter(Boolean)
      .join(', '),
    address.country,
  ].filter(Boolean);
}

export default function OrderDetailsScreen() {
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
  const shippingLines = order ? addressLines(order) : [];
  const statusTheme = getStatusTheme(order?.status);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.safeHeaderArea}>
        <LinearGradient
          colors={['#E5F2E4', '#D9EAD7', '#CDE2CB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back to orders"
              onPress={() => router.back()}
              hitSlop={10}
              style={({ pressed }) => [
                styles.circleButton,
                pressed && styles.circleButtonPressed,
              ]}
            >
              <Ionicons name="arrow-back" size={20} color="#123D2B" />
            </Pressable>

            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerEyebrow}>ORDER SUMMARY</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {order?.order_number ? `Order #${order.order_number}` : 'Order Details'}
              </Text>
            </View>

            {order?.status ? (
              <View
                style={[
                  styles.headerStatusBadge,
                  { backgroundColor: statusTheme.bg, borderColor: statusTheme.border },
                ]}
              >
                <Text style={[styles.headerStatusText, { color: statusTheme.color }]}>
                  {String(order.status).replaceAll('_', ' ')}
                </Text>
              </View>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
        </LinearGradient>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.contentSafeArea}>
        {loading ? (
          <View style={styles.center}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#123D2B" />
              <Text style={styles.helperText}>Loading order details…</Text>
            </View>
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
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.primaryButtonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </Pressable>
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
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  setLoading(true);
                  setRetryKey((key) => key + 1);
                }}
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </Pressable>
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
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.back()}
              >
                <Text style={styles.primaryButtonText}>Back to Orders</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* HERO SUMMARY CARD */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeaderRow}>
                <View style={styles.summaryIconWrap}>
                  <Ionicons name="bag-check" size={22} color="#123D2B" />
                </View>
                <View style={styles.summaryTitleGroup}>
                  <Text style={styles.orderNumber}>
                    Order #{order.order_number || order.id}
                  </Text>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={12} color="#716F68" />
                    <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusTheme.bg, borderColor: statusTheme.border },
                  ]}
                >
                  <Ionicons
                    name={statusTheme.icon}
                    size={13}
                    color={statusTheme.color}
                    style={styles.statusBadgeIcon}
                  />
                  <Text style={[styles.statusText, { color: statusTheme.color }]}>
                    {String(order.status || 'placed').replaceAll('_', ' ')}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryMetricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>TOTAL AMOUNT</Text>
                  <Text style={styles.metricValue}>
                    {formatAmount(order.total_amount, currency)}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>ITEMS</Text>
                  <Text style={styles.metricValue}>
                    {items.length} {items.length === 1 ? 'Product' : 'Products'}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>PAYMENT</Text>
                  <Text style={styles.metricValue} numberOfLines={1}>
                    {String(order.payment_status || 'Pending').replaceAll('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>

            {/* ORDER TRACKING */}
            <OrderTracking status={order.status} />

            {/* RETURN DETAILS */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconWrap}>
                  <Ionicons name="repeat-outline" size={18} color="#123D2B" />
                </View>
                <Text style={styles.sectionTitle}>Return & Exchange Details</Text>
              </View>

              {returnSubmitSuccess ? (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#123D2B" />
                  <Text style={styles.returnSuccessText}>{returnSubmitSuccess}</Text>
                </View>
              ) : null}

              {returnLoading ? (
                <View style={styles.returnLoading}>
                  <ActivityIndicator size="small" color="#123D2B" />
                  <Text style={styles.helperText}>
                    Checking return requests...
                  </Text>
                </View>
              ) : returnError ? (
                <Text style={styles.helperText}>{returnError}</Text>
              ) : returnRequests.length === 0 ? (
                <View style={styles.returnEmpty}>
                  <View style={styles.returnEmptyIconWrap}>
                    <Ionicons
                      name="receipt-outline"
                      size={20}
                      color="#123D2B"
                    />
                  </View>
                  <View style={styles.returnEmptyTextWrap}>
                    <Text style={styles.returnEmptyTitle}>
                      No active return or replacement
                    </Text>
                    {String(order.status).toLowerCase() === 'delivered' ? (
                      <Text style={styles.returnHint}>
                        Eligible items can be selected below for return or replacement.
                      </Text>
                    ) : (
                      <Text style={styles.helperText}>
                        Return options will become available once your package is delivered.
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                returnRequests.map((request) => {
                  const item = items.find(
                    (entry) => String(entry.id) === String(request.order_item_id)
                  );

                  const requestStatus = String(
                    request.status || 'requested'
                  ).replaceAll('_', ' ');

                  const refundMessage =
                    request.request_type === 'replacement'
                      ? 'This is a replacement request, not a refund confirmation.'
                      : request.status === 'refund_processing'
                        ? 'Refund processing is in progress. Payment confirmation is pending.'
                        : request.status === 'completed'
                          ? 'Return workflow completed. Check your original payment method for refund reflection.'
                          : 'Refund has not been confirmed. Check the latest return status.';

                  return (
                    <View key={request.id} style={styles.returnRequest}>
                      <View style={styles.returnStatusRow}>
                        <View style={styles.returnIcon}>
                          <Ionicons
                            name="return-down-back-outline"
                            size={20}
                            color="#123D2B"
                          />
                        </View>

                        <View style={styles.returnTitleGroup}>
                          <Text style={styles.returnProduct}>
                            {item?.product_name || 'Order item'}
                          </Text>
                          <Text style={styles.returnType}>
                            {request.request_type === 'replacement'
                              ? 'Replacement request'
                              : 'Return request'}
                          </Text>
                        </View>

                        <View style={styles.returnBadge}>
                          <Text style={styles.returnBadgeText}>
                            {requestStatus}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.returnDivider} />

                      <DetailRow
                        label="Quantity"
                        value={String(request.requested_quantity ?? '—')}
                      />

                      <DetailRow
                        label="Reason"
                        value={request.reason ? request.reason.replaceAll('_', ' ') : 'Not provided'}
                      />

                      <DetailRow
                        label="Requested on"
                        value={formatDate(request.created_at)}
                      />

                      <DetailRow
                        label="Last updated"
                        value={formatDate(request.updated_at)}
                      />

                      <View style={styles.refundNotice}>
                        <Ionicons
                          name="information-circle-outline"
                          size={17}
                          color="#123D2B"
                        />
                        <Text style={styles.refundNoticeText}>
                          {refundMessage}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* ORDER ITEMS */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconWrap}>
                  <Ionicons name="cube-outline" size={18} color="#123D2B" />
                </View>
                <Text style={styles.sectionTitle}>Purchased Botanicals</Text>
                <View style={styles.sectionCountPill}>
                  <Text style={styles.sectionCountText}>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              </View>

              {items.length === 0 ? (
                <Text style={styles.helperText}>
                  No item details were provided for this order.
                </Text>
              ) : (
                items.map((item, index) => {
                  const quantity = Number(item.quantity) || 0;
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
                  const isDelivered =
                    String(order.status || '').toLowerCase() === 'delivered';
                  const canRequestReturn =
                    isDelivered && !existingRequest && Boolean(item.id);
                  const isFormOpen = String(returnFormItemId) === String(item.id);

                  return (
                    <View
                      key={item.id || `${item.product_id || 'item'}-${index}`}
                      style={[
                        styles.orderItemContainer,
                        index > 0 && styles.itemDivider,
                      ]}
                    >
                      <View style={styles.itemRow}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.productDetailsLink,
                            pressed && productSlug && styles.buttonPressed,
                          ]}
                          disabled={!productSlug}
                          onPress={() => {
                            if (productSlug) {
                              router.push({
                                pathname: '/products/[slug]',
                                params: { slug: String(productSlug) },
                              });
                            }
                          }}
                          accessibilityRole={productSlug ? 'button' : undefined}
                          accessibilityLabel={
                            productSlug
                              ? `View details for ${item.product_name || 'this product'}`
                              : undefined
                          }
                        >
                          {imageUrl ? (
                            <Image
                              source={{ uri: imageUrl }}
                              style={styles.productImage}
                            />
                          ) : (
                            <View style={styles.productPlaceholder}>
                              <Ionicons
                                name="leaf-outline"
                                size={22}
                                color="#123D2B"
                              />
                            </View>
                          )}
                          <View style={styles.itemDescription}>
                            <Text style={styles.itemName}>
                              {item.product_name || item.product_id || 'Botanical Product'}
                            </Text>
                            {item.variant_name ? (
                              <View style={styles.variantBadge}>
                                <Text style={styles.variantText}>
                                  {item.variant_name}
                                </Text>
                              </View>
                            ) : null}
                            <Text style={styles.itemMeta}>
                              {quantity} × {formatAmount(unitPrice, currency)}
                            </Text>
                          </View>
                        </Pressable>
                        <Text style={styles.lineTotal}>
                          {formatAmount(lineTotal, currency)}
                        </Text>
                      </View>

                      {canRequestReturn ? (
                        <View style={styles.returnActionArea}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.outlineButton,
                              pressed && styles.buttonPressed,
                            ]}
                            onPress={() => {
                              setReturnFormItemId(isFormOpen ? null : item.id);
                              setReturnType('return');
                              setReturnQuantity('1');
                              setReturnReason('damaged_product');
                              setReturnDescription('');
                              setReturnSubmitError('');
                              setReturnSubmitSuccess('');
                            }}
                          >
                            <Ionicons
                              name={isFormOpen ? 'close' : 'return-down-back-outline'}
                              size={14}
                              color="#123D2B"
                            />
                            <Text style={styles.outlineButtonText}>
                              {isFormOpen
                                ? 'Cancel Request'
                                : 'Request Return / Replacement'}
                            </Text>
                          </Pressable>

                          {isFormOpen ? (
                            <View style={styles.returnForm}>
                              <Text style={styles.formLabel}>REQUEST TYPE</Text>
                              <View style={styles.choiceRow}>
                                {[
                                  { label: 'Return & Refund', value: 'return' },
                                  { label: 'Replacement', value: 'replacement' },
                                ].map((choice) => (
                                  <Pressable
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
                                  </Pressable>
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
                                  <Pressable
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
                                  </Pressable>
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
                                placeholder="Please describe any issues encountered..."
                                placeholderTextColor="#8F8D85"
                                style={[styles.formInput, styles.descriptionInput]}
                                textAlignVertical="top"
                              />

                              {returnSubmitError ? (
                                <Text style={styles.formError}>
                                  {returnSubmitError}
                                </Text>
                              ) : null}

                              <Pressable
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
                              </Pressable>
                            </View>
                          ) : null}
                        </View>
                      ) : existingRequest ? (
                        <View style={styles.existingRequestBadge}>
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={14}
                            color="#123D2B"
                          />
                          <Text style={styles.existingRequestText}>
                            {existingRequest.request_type === 'replacement'
                              ? 'Replacement'
                              : 'Return'}{' '}
                            request already submitted for this item.
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>

            {/* PAYMENT SUMMARY */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconWrap}>
                  <Ionicons name="card-outline" size={18} color="#123D2B" />
                </View>
                <Text style={styles.sectionTitle}>Payment Summary</Text>
              </View>

              <DetailRow
                label="Subtotal"
                value={formatAmount(order.subtotal, currency)}
              />

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

              <View style={styles.totalDivider} />

              <DetailRow
                label="Grand Total"
                value={formatAmount(order.total_amount, currency)}
                emphasized
              />

              <View style={styles.paymentMetaBox}>
                <View style={styles.paymentMetaRow}>
                  <Text style={styles.paymentMetaLabel}>Method</Text>
                  <View style={styles.paymentBadge}>
                    <Ionicons
                      name="wallet-outline"
                      size={13}
                      color="#123D2B"
                    />
                    <Text style={styles.paymentBadgeText}>
                      {String(order.payment_method || 'Online').replaceAll(
                        '_',
                        ' '
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.paymentMetaRow}>
                  <Text style={styles.paymentMetaLabel}>Status</Text>
                  <View style={styles.paymentBadge}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={13}
                      color="#123D2B"
                    />
                    <Text style={styles.paymentBadgeText}>
                      {String(order.payment_status || 'Paid').replaceAll(
                        '_',
                        ' '
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* DELIVERY ADDRESS */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconWrap}>
                  <Ionicons name="location-sharp" size={18} color="#123D2B" />
                </View>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
              </View>

              {shippingLines.length > 0 ? (
                <View style={styles.addressBox}>
                  {shippingLines.map((line, index) => (
                    <Text
                      key={`${index}-${line}`}
                      style={[
                        styles.addressLine,
                        index === 0 && styles.addressName,
                      ]}
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.helperText}>
                  No delivery address was provided.
                </Text>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1E8',
  },
  safeHeaderArea: {
    backgroundColor: '#E5F2E4',
  },
  headerGradient: {
    width: '100%',
    paddingTop: 6,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderWidth: 0.2,
    borderColor: '#276345',
    shadowColor: '#123D2B',
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
    shadowColor: '#123D2B',
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
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    letterSpacing: 1.4,
    color: '#716F68',
    marginBottom: 2,
    fontWeight: '700',
  },
  headerTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 19,
    color: '#123D2B',
    fontWeight: '700',
  },
  headerStatusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 14,
    borderWidth: 0.8,
  },
  headerStatusText: {
    fontFamily: 'InterSemiBold',
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  headerSpacer: {
    width: 40,
  },
  contentSafeArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
  },
  stateCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EFE6',
    shadowColor: '#123D2B',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  errorIconOuter: {
    backgroundColor: '#FDEEEE',
  },
  errorIconInner: {
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 19,
    color: '#123D2B',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'InterRegular',
    fontSize: 12.5,
    color: '#716F68',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 24,
    backgroundColor: '#123D2B',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: 'InterSemiBold',
    fontSize: 13.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  summaryCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EFE6',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  summaryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#E8F2E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitleGroup: {
    flex: 1,
    gap: 2,
  },
  orderNumber: {
    fontFamily: 'InterSemiBold',
    color: '#123D2B',
    fontSize: 15,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderDate: {
    fontFamily: 'InterRegular',
    color: '#716F68',
    fontSize: 11.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 0.8,
  },
  statusBadgeIcon: {
    marginRight: -1,
  },
  statusText: {
    fontFamily: 'InterSemiBold',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  summaryMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF9F4',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 0.8,
    borderColor: '#E5DFD3',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: 'InterSemiBold',
    fontSize: 8.5,
    letterSpacing: 0.8,
    color: '#716F68',
    marginBottom: 3,
    fontWeight: '700',
  },
  metricValue: {
    fontFamily: 'InterSemiBold',
    fontSize: 12.5,
    color: '#123D2B',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: '#D9D5CB',
  },
  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EFE6',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    borderRadius: 16,
    backgroundColor: '#E8F2E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: 'InterSemiBold',
    color: '#123D2B',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  sectionCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#F5F4E7',
    borderWidth: 0.8,
    borderColor: '#D9EAD7',
  },
  sectionCountText: {
    fontFamily: 'InterSemiBold',
    fontSize: 10.5,
    color: '#123D2B',
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  productDetailsLink: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemDivider: {
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8EFE6',
  },
  productImage: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#F5F4E7',
    borderWidth: 0.6,
    borderColor: '#E8EFE6',
  },
  productPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F2E7',
    borderWidth: 0.6,
    borderColor: '#CDE2CB',
  },
  itemDescription: {
    flex: 1,
    gap: 3,
  },
  itemName: {
    fontFamily: 'InterSemiBold',
    color: '#123D2B',
    fontSize: 13.5,
    fontWeight: '600',
  },
  variantBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F4E7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 1,
  },
  variantText: {
    fontFamily: 'InterMedium',
    fontSize: 10.5,
    color: '#716F68',
  },
  helperText: {
    fontFamily: 'InterRegular',
    color: '#716F68',
    fontSize: 12,
    lineHeight: 18,
  },
  itemMeta: {
    fontFamily: 'InterRegular',
    color: '#716F68',
    fontSize: 11.5,
  },
  lineTotal: {
    fontFamily: 'InterSemiBold',
    color: '#123D2B',
    fontSize: 13.5,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  detailLabel: {
    fontFamily: 'InterRegular',
    color: '#716F68',
    fontSize: 12.5,
  },
  emphasizedLabel: {
    fontFamily: 'InterSemiBold',
    color: '#123D2B',
    fontSize: 14.5,
    fontWeight: '700',
  },
  detailValue: {
    flexShrink: 1,
    fontFamily: 'InterMedium',
    color: '#123D2B',
    fontSize: 12.5,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  totalDivider: {
    marginVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8EFE6',
  },
  totalValue: {
    fontFamily: 'InterSemiBold',
    fontSize: 16.5,
    fontWeight: '700',
    color: '#123D2B',
  },
  paymentMetaBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8EFE6',
    gap: 8,
  },
  paymentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentMetaLabel: {
    fontFamily: 'InterRegular',
    fontSize: 12,
    color: '#716F68',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F5F4E7',
    borderWidth: 0.8,
    borderColor: '#D9EAD7',
  },
  paymentBadgeText: {
    fontFamily: 'InterSemiBold',
    fontSize: 11,
    color: '#123D2B',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  addressBox: {
    backgroundColor: '#FAF9F4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.8,
    borderColor: '#E5DFD3',
  },
  addressLine: {
    fontFamily: 'InterRegular',
    color: '#716F68',
    fontSize: 12.5,
    lineHeight: 20,
  },
  addressName: {
    fontFamily: 'InterSemiBold',
    color: '#123D2B',
    fontWeight: '700',
    fontSize: 13.5,
    marginBottom: 4,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E8F2E7',
    borderWidth: 0.8,
    borderColor: '#CDE2CB',
  },
  returnSuccessText: {
    flex: 1,
    fontFamily: 'InterMedium',
    color: '#123D2B',
    fontSize: 12,
    lineHeight: 18,
  },
  returnLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  returnEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FAF9F4',
    borderWidth: 0.8,
    borderColor: '#E5DFD3',
  },
  returnEmptyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F2E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnEmptyTextWrap: {
    flex: 1,
  },
  returnEmptyTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 12.5,
    color: '#123D2B',
    fontWeight: '600',
  },
  returnHint: {
    fontFamily: 'InterRegular',
    color: '#399E5B',
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 2,
  },
  returnRequest: {
    gap: 6,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FAF9F4',
    borderWidth: 0.8,
    borderColor: '#E5DFD3',
    marginBottom: 10,
  },
  returnStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  returnIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E8F2E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnTitleGroup: {
    flex: 1,
    gap: 2,
  },
  returnProduct: {
    fontFamily: 'InterSemiBold',
    color: '#123D2B',
    fontSize: 13,
    fontWeight: '700',
  },
  returnType: {
    fontFamily: 'InterRegular',
    color: '#716F68',
    fontSize: 11,
  },
  returnBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F2E7',
    borderWidth: 0.8,
    borderColor: '#CDE2CB',
  },
  returnBadgeText: {
    fontFamily: 'InterSemiBold',
    color: '#123D2B',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  returnDivider: {
    marginVertical: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5DFD3',
  },
  refundNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#E8F2E7',
    borderWidth: 0.8,
    borderColor: '#CDE2CB',
  },
  refundNoticeText: {
    flex: 1,
    fontFamily: 'InterRegular',
    color: '#123D2B',
    fontSize: 11,
    lineHeight: 16,
  },
  orderItemContainer: {
    gap: 10,
  },
  returnActionArea: {
    paddingTop: 4,
    paddingBottom: 4,
    gap: 10,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#399E5B',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: '#F8FAF7',
  },
  outlineButtonText: {
    fontFamily: 'InterSemiBold',
    color: '#123D2B',
    fontSize: 11.5,
    fontWeight: '600',
  },
  returnForm: {
    padding: 14,
    gap: 10,
    borderRadius: 14,
    backgroundColor: '#FAF9F4',
    borderWidth: 1,
    borderColor: '#E5DFD3',
  },
  formLabel: {
    fontFamily: 'InterSemiBold',
    color: '#123D2B',
    fontSize: 10.5,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceButton: {
    borderWidth: 1,
    borderColor: '#E5DFD3',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  choiceButtonActive: {
    backgroundColor: '#123D2B',
    borderColor: '#123D2B',
  },
  choiceButtonText: {
    fontFamily: 'InterMedium',
    color: '#716F68',
    fontSize: 11.5,
    fontWeight: '600',
  },
  choiceButtonTextActive: {
    color: '#FFFFFF',
  },
  formInput: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#E5DFD3',
    borderRadius: 12,
    color: '#123D2B',
    backgroundColor: '#FFFFFF',
    fontFamily: 'InterRegular',
    fontSize: 13,
  },
  descriptionInput: {
    minHeight: 74,
  },
  reasonChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  reasonChip: {
    borderWidth: 1,
    borderColor: '#E5DFD3',
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  reasonChipActive: {
    backgroundColor: '#E8F2E7',
    borderColor: '#399E5B',
  },
  reasonChipText: {
    fontFamily: 'InterMedium',
    color: '#716F68',
    fontSize: 11,
  },
  reasonChipTextActive: {
    color: '#123D2B',
    fontWeight: '700',
  },
  formError: {
    fontFamily: 'InterMedium',
    color: colors.danger,
    fontSize: 11.5,
    lineHeight: 16,
  },
  submitButton: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: '#123D2B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontFamily: 'InterSemiBold',
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  existingRequestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#E8F2E7',
    alignSelf: 'flex-start',
  },
  existingRequestText: {
    fontFamily: 'InterMedium',
    color: '#123D2B',
    fontSize: 11,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});
