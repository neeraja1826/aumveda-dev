import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  getAvailableCustomerCoupons,
  validateCustomerCoupon,
} from '../services/orderService';
import {
  clearStoredCoupon,
  saveAppliedCoupon,
} from '../services/couponStorage';

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

export default function CouponApplication({
  placement,
  subtotal,
  coupon,
  onChange,
  variantId,
  quantity,
  contextKey,
  persist = true,
}) {
  const [coupons, setCoupons] = useState([]);
  const [enteredCode, setEnteredCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const code = enteredCode ?? coupon?.code ?? '';

  useEffect(() => {
    let active = true;

    getAvailableCustomerCoupons({
      placement,
      variantId,
      quantity,
    })
      .then((availableCoupons) => {
        if (active) {
          setCoupons(Array.isArray(availableCoupons) ? availableCoupons : []);
        }
      })
      .catch((loadError) => {
        if (!active) return;
        console.error('Unable to load available coupons:', loadError);
        setError('Unable to load available coupons right now.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [placement, variantId, quantity, contextKey]);

  useEffect(() => {
    if (!coupon?.applied || !coupon.code) return undefined;

    let active = true;
    const appliedPlacement = coupon.placement || placement;

    validateCustomerCoupon({
      code: coupon.code,
      placement: appliedPlacement,
      variantId,
      quantity,
    })
      .then(async (quote) => {
        if (!active) return;
        const updatedCoupon = {
          ...quote,
          placement: appliedPlacement,
          applied: true,
        };
        if (persist) await saveAppliedCoupon(updatedCoupon);
        onChange(updatedCoupon);
        setError('');
      })
      .catch(async (validationError) => {
        if (!active) return;
        console.error('Applied coupon revalidation failed:', validationError);
        try {
          if (persist) await clearStoredCoupon();
        } catch (storageError) {
          console.error('Unable to clear the applied coupon:', storageError);
        }
        onChange(null);
        setError(validationError?.message || 'This coupon is no longer valid.');
      });

    return () => {
      active = false;
    };
  }, [
    coupon?.applied,
    coupon?.code,
    coupon?.placement,
    onChange,
    persist,
    placement,
    subtotal,
    variantId,
    quantity,
    contextKey,
  ]);

  async function applyCoupon(rawCode) {
    const normalizedCode = String(rawCode || '').trim().toUpperCase();

    if (!normalizedCode) {
      setError('Enter a coupon code.');
      return;
    }

    setEnteredCode(normalizedCode);
    setApplying(true);
    setError('');

    try {
      const quote = await validateCustomerCoupon({
        code: normalizedCode,
        placement,
        variantId,
        quantity,
      });
      const nextCoupon = {
        ...quote,
        placement,
        applied: true,
      };
      if (persist) await saveAppliedCoupon(nextCoupon);
      onChange(nextCoupon);
    } catch (applyError) {
      setError(applyError?.message || 'Unable to apply this coupon.');
    } finally {
      setApplying(false);
    }
  }

  function handleApply() {
    return applyCoupon(code);
  }

  async function handleRemove() {
    try {
      if (persist) await clearStoredCoupon();
      onChange(null);
      setError('');
    } catch (storageError) {
      console.error('Unable to remove the applied coupon:', storageError);
      setError('Unable to remove this coupon. Please try again.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Ionicons name="ticket-outline" size={19} color="#174C36" />
        <View style={styles.headingCopy}>
          <Text style={styles.title}>Apply a coupon</Text>
          <Text style={styles.subtitle}>
            Only coupons eligible for your order are shown.
          </Text>
        </View>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          value={code}
          onChangeText={setEnteredCode}
          placeholder="Enter coupon code"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!applying}
          accessibilityLabel="Coupon code"
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          disabled={applying}
          onPress={handleApply}
          style={[styles.applyButton, applying && styles.disabledButton]}
        >
          {applying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.applyText}>
              {coupon?.applied ? 'Replace' : 'Apply'}
            </Text>
          )}
        </Pressable>
        {coupon?.applied && (
          <Pressable
            accessibilityRole="button"
            disabled={applying}
            onPress={handleRemove}
            style={[styles.removeButton, applying && styles.disabledButton]}
          >
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        )}
      </View>

      {coupon?.applied ? (
        <View style={styles.appliedRow} accessibilityRole="text">
          <Ionicons name="checkmark-circle" size={17} color="#26734D" />
          <Text style={styles.appliedText}>
            {coupon.code} applied - saving {formatPrice(coupon.discount_amount)}
          </Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

      {coupons.length > 0 ? (
        <View style={styles.availableList}>
          <Text style={styles.availableTitle}>Available here</Text>
          {coupons.map((availableCoupon) => (
            <View
              key={availableCoupon.id || availableCoupon.code}
              style={styles.availableCoupon}
            >
              <View style={styles.availableCouponDetails}>
                <Text style={styles.availableCode}>{availableCoupon.code}</Text>
                <Text style={styles.availableDescription} numberOfLines={2}>
                  {availableCoupon.description ||
                    (availableCoupon.discount_type === 'percentage'
                      ? `${availableCoupon.discount_value}% off`
                      : `${formatPrice(availableCoupon.discount_value)} off`)}
                </Text>
                {Number(availableCoupon.min_order_value) > 0 ? (
                  <Text style={styles.availableTerms}>
                    Min. order {formatPrice(availableCoupon.min_order_value)}
                  </Text>
                ) : null}
                {availableCoupon.discount_type === 'percentage' &&
                Number(availableCoupon.max_discount_amount) > 0 ? (
                  <Text style={styles.availableTerms}>
                    Maximum savings {formatPrice(availableCoupon.max_discount_amount)}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Apply coupon ${availableCoupon.code}`}
                disabled={
                  applying ||
                  (coupon?.applied && coupon.code === availableCoupon.code)
                }
                onPress={() => applyCoupon(availableCoupon.code)}
                style={[
                  styles.availableApplyButton,
                  coupon?.applied &&
                    coupon.code === availableCoupon.code &&
                    styles.availableApplyButtonApplied,
                ]}
              >
                <Text style={styles.availableApplyText}>
                  {coupon?.applied && coupon.code === availableCoupon.code
                    ? 'Applied'
                    : 'Apply'}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {!loading && coupons.length === 0 && !error ? (
        <Text style={styles.emptyText}>No coupons are available for this page.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 76, 54, 0.14)',
    backgroundColor: '#FFFFFF',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  headingCopy: {
    flex: 1,
  },
  title: {
    color: '#173E30',
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
    color: '#796F65',
    fontSize: 11,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  input: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: 'rgba(23, 76, 54, 0.2)',
    borderRadius: 10,
    color: '#173E30',
    backgroundColor: '#FFFFFF',
    fontSize: 13,
  },
  applyButton: {
    minWidth: 68,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#173E30',
  },
  disabledButton: {
    opacity: 0.65,
  },
  applyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  removeButton: {
    minHeight: 42,
    paddingHorizontal: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(23, 76, 54, 0.2)',
  },
  removeText: {
    color: '#173E30',
    fontSize: 12,
    fontWeight: '700',
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  appliedText: {
    flex: 1,
    color: '#26734D',
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    marginTop: 9,
    color: '#A33B35',
    fontSize: 12,
  },
  availableList: {
    gap: 7,
    marginTop: 13,
  },
  availableTitle: {
    color: '#796F65',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  availableCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: 9,
    borderRadius: 9,
    backgroundColor: '#F5F7F1',
  },
  availableCouponDetails: {
    flex: 1,
    gap: 3,
  },
  availableCode: {
    color: '#173E30',
    fontSize: 11,
    fontWeight: '800',
  },
  availableDescription: {
    color: '#796F65',
    fontSize: 10,
  },
  availableTerms: {
    color: '#796F65',
    fontSize: 9,
  },
  availableApplyButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(23, 76, 54, 0.2)',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  availableApplyButtonApplied: {
    backgroundColor: '#EDF5ED',
  },
  availableApplyText: {
    color: '#173E30',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 10,
    color: '#796F65',
    fontSize: 11,
  },
});
