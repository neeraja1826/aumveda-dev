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
  return `${currency} ${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
}

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString();
}

function DetailRow({ label, value, emphasized = false }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, emphasized && styles.totalValue]}>
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
      } catch (error) {
        console.error('Load return requests error:', error);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back to orders"
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={23} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading order details…</Text>
        </View>
      ) : !token ? (
        <View style={styles.center}>
          <Text style={styles.message}>Sign in to view this order.</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </Pressable>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={42} color={colors.danger} />
          <Text style={styles.message}>{error}</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => {
              setLoading(true);
              setRetryKey((key) => key + 1);
            }}
          >
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : !order ? (
        <View style={styles.center}>
          <Text style={styles.message}>This order could not be found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <OrderTracking status={order.status} />
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Return Details</Text>

            {returnSubmitSuccess ? (
              <Text style={styles.returnSuccessText}>{returnSubmitSuccess}</Text>
            ) : null}

            {returnLoading ? (
              <View style={styles.returnLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.helperText}>
                  Loading return details...
                </Text>
              </View>
            ) : returnError ? (
              <Text style={styles.helperText}>{returnError}</Text>
            ) : returnRequests.length === 0 ? (
              <View style={styles.returnEmpty}>
                <Ionicons
                  name="receipt-outline"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.helperText}>
                  No return or replacement request has been submitted for this order.
                </Text>
                {String(order.status).toLowerCase() === 'delivered' && (
                  <Text style={styles.returnHint}>
                    Eligible items can be selected for return or replacement.
                  </Text>
                )}
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
                        ? 'Return workflow completed. Check the payment provider or finance records to confirm whether the refund was paid.'
                        : 'Refund has not been confirmed. Check the latest return status.';

                return (
                  <View key={request.id} style={styles.returnRequest}>
                    <View style={styles.returnStatusRow}>
                      <View style={styles.returnIcon}>
                        <Ionicons
                          name="return-down-back-outline"
                          size={21}
                          color={colors.primary}
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
                      value={request.reason || 'Not provided'}
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
                        size={18}
                        color={colors.primary}
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
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons name="bag-check-outline" size={25} color={colors.primary} />
            </View>
            <Text style={styles.orderNumber}>
              Order {order.order_number || order.id}
            </Text>
            <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {String(order.status || 'placed').replaceAll('_', ' ')}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Items</Text>
            {items.length === 0 ? (
              <Text style={styles.helperText}>No item details were provided for this order.</Text>
            ) : items.map((item, index) => {
              const quantity = Number(item.quantity) || 0;
              const unitPrice = Number(item.unit_price) || 0;
             const lineTotal = item.total_price == null
  ? unitPrice * quantity
  : Number(item.total_price);
              const imageUrl = typeof item.image_url === 'string'
                ? item.image_url.trim()
                : '';

              const existingRequest = returnRequests.find(
                (request) => String(request.order_item_id) === String(item.id)
              );
              const isDelivered = String(order.status || '').toLowerCase() === 'delivered';
              const canRequestReturn = isDelivered && !existingRequest && Boolean(item.id);
              const isFormOpen = String(returnFormItemId) === String(item.id);

              return (
                <View
                  key={item.id || `${item.product_id || 'item'}-${index}`}
                  style={[styles.orderItemContainer, index > 0 && styles.itemDivider]}
                >
                  <View style={styles.itemRow}>
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.productImage} />
                    ) : (
                      <View style={styles.productPlaceholder}>
                        <Ionicons name="leaf-outline" size={21} color={colors.primary} />
                      </View>
                    )}
                    <View style={styles.itemDescription}>
                      <Text style={styles.itemName}>
                        {item.product_name || item.product_id || 'Product'}
                      </Text>
                      {item.variant_name ? (
                        <Text style={styles.helperText}>{item.variant_name}</Text>
                      ) : null}
                      <Text style={styles.itemMeta}>
                        {quantity} × {formatAmount(unitPrice, currency)}
                      </Text>
                    </View>
                    <Text style={styles.lineTotal}>
                      {formatAmount(lineTotal, currency)}
                    </Text>
                  </View>

                  {canRequestReturn ? (
                    <View style={styles.returnActionArea}>
                      <Pressable
                        style={styles.outlineButton}
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
                        <Text style={styles.outlineButtonText}>
                          {isFormOpen ? 'Cancel request' : 'Request Return / Replacement'}
                        </Text>
                      </Pressable>

                      {isFormOpen ? (
                        <View style={styles.returnForm}>
                          <Text style={styles.formLabel}>Request type</Text>
                          <View style={styles.choiceRow}>
                            {[
                              { label: 'Return', value: 'return' },
                              { label: 'Replacement', value: 'replacement' },
                            ].map((choice) => (
                              <Pressable
                                key={choice.value}
                                style={[
                                  styles.choiceButton,
                                  returnType === choice.value && styles.choiceButtonActive,
                                ]}
                                onPress={() => setReturnType(choice.value)}
                              >
                                <Text
                                  style={[
                                    styles.choiceButtonText,
                                    returnType === choice.value && styles.choiceButtonTextActive,
                                  ]}
                                >
                                  {choice.label}
                                </Text>
                              </Pressable>
                            ))}
                          </View>

                          <Text style={styles.formLabel}>Quantity (max {quantity})</Text>
                          <TextInput
                            value={returnQuantity}
                            onChangeText={setReturnQuantity}
                            keyboardType="number-pad"
                            maxLength={String(quantity).length || 1}
                            style={styles.formInput}
                            placeholder="Quantity"
                          />

                          <Text style={styles.formLabel}>Reason</Text>
                          <View style={styles.reasonChoices}>
                            {[
                              { label: 'Damaged product', value: 'damaged_product' },
                              { label: 'Wrong item', value: 'wrong_item' },
                              { label: 'Quality issue', value: 'quality_issue' },
                              { label: 'Other', value: 'other' },
                            ].map((choice) => (
                              <Pressable
                                key={choice.value}
                                style={[
                                  styles.reasonChip,
                                  returnReason === choice.value && styles.reasonChipActive,
                                ]}
                                onPress={() => setReturnReason(choice.value)}
                              >
                                <Text
                                  style={[
                                    styles.reasonChipText,
                                    returnReason === choice.value && styles.reasonChipTextActive,
                                  ]}
                                >
                                  {choice.label}
                                </Text>
                              </Pressable>
                            ))}
                          </View>

                          <Text style={styles.formLabel}>Additional details (optional)</Text>
                          <TextInput
                            value={returnDescription}
                            onChangeText={setReturnDescription}
                            multiline
                            maxLength={1000}
                            placeholder="Describe the issue..."
                            style={[styles.formInput, styles.descriptionInput]}
                            textAlignVertical="top"
                          />

                          {returnSubmitError ? (
                            <Text style={styles.formError}>{returnSubmitError}</Text>
                          ) : null}

                          <Pressable
                            style={[
                              styles.primaryButton,
                              returnSubmitting && styles.buttonDisabled,
                            ]}
                            disabled={returnSubmitting}
                            onPress={() => submitReturnRequest(item)}
                          >
                            {returnSubmitting ? (
                              <ActivityIndicator color={colors.white} />
                            ) : (
                              <Text style={styles.primaryButtonText}>Submit Request</Text>
                            )}
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  ) : existingRequest ? (
                    <Text style={styles.existingRequestText}>
                      {existingRequest.request_type === 'replacement'
                        ? 'Replacement'
                        : 'Return'} request already submitted for this item.
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment summary</Text>
            <DetailRow label="Subtotal" value={formatAmount(order.subtotal, currency)} />
            {Number(order.discount) > 0 ? (
  <DetailRow
    label="Discount"
    value={`− ${formatAmount(order.discount, currency)}`}
  />
) : null}
            {Number(order.discount_amount) > 0 ? (
              <DetailRow
                label="Discount"
                value={`− ${formatAmount(order.discount_amount, currency)}`}
              />
            ) : null}
            <View style={styles.totalDivider} />
            <DetailRow
              label="Total"
              value={formatAmount(order.total_amount, currency)}
              emphasized
            />
            <DetailRow
              label="Payment method"
              value={String(order.payment_method || '—').replaceAll('_', ' ')}
            />
            <DetailRow
              label="Payment status"
              value={String(order.payment_status || '—').replaceAll('_', ' ')}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery address</Text>
            {shippingLines.length > 0 ? shippingLines.map((line, index) => (
              <Text
                key={`${index}-${line}`}
                style={[styles.addressLine, index === 0 && styles.addressName]}
              >
                {line}
              </Text>
            )) : (
              <Text style={styles.helperText}>No delivery address was provided.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 32, alignItems: 'flex-start' },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  headerSpacer: { width: 32 },
  content: { padding: 16, paddingBottom: 28, gap: 14 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  summaryCard: {
    alignItems: 'center',
    padding: 22,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  orderNumber: {
    marginTop: 12,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  orderDate: { marginTop: 5, color: colors.textSecondary, fontSize: 12 },
  statusBadge: {
    marginTop: 12,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.cream,
  },
  statusText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  card: {
    padding: 17,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    marginBottom: 13,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 5 },
  itemDivider: {
    paddingTop: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  productImage: { width: 54, height: 54, borderRadius: 10, backgroundColor: colors.cream },
  productPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  itemDescription: { flex: 1, gap: 4 },
  itemName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  helperText: { color: colors.textSecondary, fontSize: 12 },
  itemMeta: { color: colors.textSecondary, fontSize: 11 },
  lineTotal: { color: colors.text, fontSize: 12, fontWeight: '700' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  detailLabel: { color: colors.textSecondary, fontSize: 12 },
  detailValue: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 12,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  totalDivider: {
    marginVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalValue: { fontSize: 14, fontWeight: '700' },
  addressLine: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  addressName: { color: colors.text, fontWeight: '700' },
  message: {
    marginTop: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  primaryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  primaryButtonText: { color: colors.white, fontWeight: '700' },
  returnLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  returnEmpty: {
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  returnHint: {
    color: colors.primary,
    fontSize: 12,
    lineHeight: 18,
  },
  returnRequest: {
    gap: 8,
  },
  returnStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  returnIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnTitleGroup: {
    flex: 1,
    gap: 4,
  },
  returnProduct: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  returnType: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  returnBadge: {
    maxWidth: 115,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.cream,
  },
  returnBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  returnDivider: {
    marginVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  refundNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    padding: 11,
    borderRadius: 10,
    backgroundColor: colors.cream,
  },
  refundNoticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },

  orderItemContainer: { gap: 10 },
  returnActionArea: { paddingBottom: 6, gap: 10 },
  outlineButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  outlineButtonText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  returnForm: {
    padding: 13,
    gap: 9,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formLabel: { color: colors.text, fontSize: 12, fontWeight: '700' },
  choiceRow: { flexDirection: 'row', gap: 8 },
  choiceButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  choiceButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceButtonText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  choiceButtonTextActive: { color: colors.white },
  formInput: {
    minHeight: 42,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    color: colors.text,
    backgroundColor: colors.white,
    fontSize: 13,
  },
  descriptionInput: { minHeight: 78 },
  reasonChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  reasonChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.white,
  },
  reasonChipActive: { backgroundColor: colors.cream, borderColor: colors.primary },
  reasonChipText: { color: colors.textSecondary, fontSize: 11 },
  reasonChipTextActive: { color: colors.primary, fontWeight: '700' },
  formError: { color: colors.danger, fontSize: 12, lineHeight: 17 },
  returnSuccessText: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 9,
    backgroundColor: colors.cream,
    color: colors.primary,
    fontSize: 12,
    lineHeight: 18,
  },
  existingRequestText: { color: colors.textSecondary, fontSize: 11, paddingBottom: 6 },
  buttonDisabled: { opacity: 0.65 },
});
