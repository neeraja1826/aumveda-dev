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

import { getCouponsForPlacement } from '../services/homeService';
import { validateCustomerCoupon } from '../services/orderService';
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
}) {
  const [coupons, setCoupons] = useState([]);
  const [enteredCode, setEnteredCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const code = enteredCode ?? coupon?.code ?? '';

  useEffect(() => {
    let active = true;

    getCouponsForPlacement(placement)
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
  }, [placement]);

  useEffect(() => {
    if (!coupon?.applied || !coupon.code) return undefined;

    let active = true;
    const appliedPlacement = coupon.placement || placement;

    validateCustomerCoupon({
      code: coupon.code,
      placement: appliedPlacement,
    })
      .then(async (quote) => {
        if (!active) return;
        const updatedCoupon = {
          ...quote,
          placement: appliedPlacement,
          applied: true,
        };
        await saveAppliedCoupon(updatedCoupon);
        onChange(updatedCoupon);
        setError('');
      })
      .catch(async (validationError) => {
        if (!active) return;
        console.error('Applied coupon revalidation failed:', validationError);
        try {
          await clearStoredCoupon();
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
    placement,
    subtotal,
  ]);

  async function handleApply() {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
      setError('Enter a coupon code.');
      return;
    }

    setApplying(true);
    setError('');

    try {
      const quote = await validateCustomerCoupon({
        code: normalizedCode,
        placement,
      });
      const nextCoupon = {
        ...quote,
        placement,
        applied: true,
      };
      await saveAppliedCoupon(nextCoupon);
      onChange(nextCoupon);
    } catch (applyError) {
      setError(applyError?.message || 'Unable to apply this coupon.');
    } finally {
      setApplying(false);
    }
  }

  async function handleRemove() {
    try {
      await clearStoredCoupon();
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
            Only coupons enabled for this page are shown.
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
        {coupon?.applied ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleRemove}
            style={styles.removeButton}
          >
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            disabled={applying}
            onPress={handleApply}
            style={[styles.applyButton, applying && styles.disabledButton]}
          >
            {applying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.applyText}>Apply</Text>
            )}
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
            <Pressable
              key={availableCoupon.id || availableCoupon.code}
              accessibilityRole="button"
              accessibilityLabel={`Enter coupon ${availableCoupon.code}`}
              onPress={() => setEnteredCode(availableCoupon.code || '')}
              style={styles.availableCoupon}
            >
              <Text style={styles.availableCode}>{availableCoupon.code}</Text>
              <Text style={styles.availableDescription} numberOfLines={2}>
                {availableCoupon.description ||
                  (availableCoupon.discount_type === 'percentage'
                    ? `${availableCoupon.discount_value}% off`
                    : `${formatPrice(availableCoupon.discount_value)} off`)}
              </Text>
            </Pressable>
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
  availableCode: {
    color: '#173E30',
    fontSize: 11,
    fontWeight: '800',
  },
  availableDescription: {
    flex: 1,
    color: '#796F65',
    fontSize: 10,
    textAlign: 'right',
  },
  emptyText: {
    marginTop: 10,
    color: '#796F65',
    fontSize: 11,
  },
});
