import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APPLIED_COUPON_STORAGE_KEY = '@aumveda_applied_coupon';

// Matches the exact offers shown in reference design
const FALLBACK_COUPONS = [
  {
    id: 'diwali26',
    code: 'DIWALI26',
    discount_type: 'percentage',
    discount_value: 26,
    description: 'Get flat 26% off on your diwali purchase on orders above 799',
    min_order_value: 799,
  },
  {
    id: 'goayu',
    code: 'GOAYU',
    discount_type: 'percentage',
    discount_value: 20,
    description: 'Get flat 20% off on orders above 2999',
    min_order_value: 2999,
  },
  {
    id: 'welcome10',
    code: 'WELCOME10',
    discount_type: 'percentage',
    discount_value: 10,
    description: 'Welcome discount',
    min_order_value: 499,
  },
];

export default function CouponsOffers({ coupons = [] }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const [feedbackToast, setFeedbackToast] = useState('');
  const copiedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

  const activeCoupons = (Array.isArray(coupons) && coupons.length > 0
    ? coupons
    : FALLBACK_COUPONS
  ).slice(0, 3); // Fit all 3 clearly on one screen

  const handleCopy = useCallback(async (code, coupon) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopiedCode(code);

      // Auto-revert back to "Copy" after 2.5 seconds
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current);
      }
      copiedTimerRef.current = setTimeout(() => {
        setCopiedCode(null);
      }, 2500);

      // Save to storage so checkout can consume it
      try {
        await AsyncStorage.setItem(
          APPLIED_COUPON_STORAGE_KEY,
          JSON.stringify({
            code,
            discount_type: coupon?.discount_type,
            discount_value: coupon?.discount_value,
            min_order_value: coupon?.min_order_value,
          })
        );
      } catch {
        // storage fallback
      }

      setFeedbackToast(`Coupon ${code} copied!`);
      setTimeout(() => setFeedbackToast(''), 2500);

      Alert.alert(
        'Coupon Copied',
        `${code} copied to clipboard! Use it at checkout to claim your offer.`
      );
    } catch {
      Alert.alert('Error', 'Unable to copy coupon code.');
    }
  }, []);

  const formatDiscountNumber = (coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${Number(coupon.discount_value)}%`;
    }
    if (coupon.discount_type === 'fixed_amount') {
      return `₹${Number(coupon.discount_value)}`;
    }
    return 'FREE';
  };

  const getSubText = (coupon) => {
    if (coupon.discount_type === 'free_shipping') {
      return 'DELIVERY';
    }
    return 'OFF';
  };

  return (
    <View style={styles.outerContainer}>
      {/* WARM HONEY PASTEL GRADIENT CANVAS (FULL BLEED, STRAIGHT EDGES - NO CURVES) */}
      <LinearGradient
        colors={['#FFF6E7', '#FDE8CC', '#FCE2BE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardSection}
      >
        {/* SECTION HEADER */}
        <View style={styles.headingRow}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="ticket-percent-outline"
              size={24}
              color="#123D2B"
            />
          </View>

          <View style={styles.headingTextCol}>
            <Text style={styles.title}>Available Coupons</Text>
            <Text style={styles.subtitle}>
              Use these offers at checkout and save more.
            </Text>
          </View>

          <View style={styles.badgeChip}>
            <Text style={styles.badgeText}>3 OFFERS</Text>
          </View>
        </View>

        {/* FEEDBACK TOAST BANNER */}
        {feedbackToast ? (
          <View style={styles.toastBanner}>
            <Ionicons name="checkmark-circle" size={13} color="#123D2B" />
            <Text style={styles.toastText}>{feedbackToast}</Text>
          </View>
        ) : null}

        {/* FULL-WIDTH STACK OF TICKET CHIPS WITH SCALLOP NOTCHES ON LEFT EDGE */}
        <View style={styles.chipsContainer}>
          {activeCoupons.map((coupon) => {
            const isCopied = copiedCode === coupon.code;
            const discountNum = formatDiscountNumber(coupon);
            const subText = getSubText(coupon);

            return (
              <Pressable
                key={coupon.id || coupon.code}
                style={({ pressed }) => [
                  styles.couponChip,
                  pressed && styles.couponChipPressed,
                ]}
                onPress={() => handleCopy(coupon.code, coupon)}
                accessibilityRole="button"
                accessibilityLabel={`Coupon ${coupon.code}, ${discountNum} ${subText}`}
              >
                {/* 4 SCALLOPED NOTCHES ON LEFT EDGE (MATCHING REFERENCE UI) */}
                <View style={styles.notchesColumn} pointerEvents="none">
                  <View style={styles.notchCircle} />
                  <View style={styles.notchCircle} />
                  <View style={styles.notchCircle} />
                  <View style={styles.notchCircle} />
                </View>

                {/* LEFT: DISCOUNT VALUE */}
                <View style={styles.discountCol}>
                  <Text
                    style={[
                      styles.discountNumber,
                      discountNum === 'FREE' && styles.discountNumberFree,
                    ]}
                    numberOfLines={1}
                  >
                    {discountNum}
                  </Text>
                  <Text style={styles.discountSub} numberOfLines={1}>
                    {subText}
                  </Text>
                </View>

                {/* VERTICAL DIVIDER */}
                <View style={styles.verticalDivider} />

                {/* CENTER: COUPON CODE & DESCRIPTION */}
                <View style={styles.centerInfoCol}>
                  <Text style={styles.codeText}>{coupon.code}</Text>

                  <Text style={styles.descText} numberOfLines={2}>
                    {coupon.description || `Orders above ₹${coupon.min_order_value || 0}`}
                  </Text>
                </View>

                {/* RIGHT: COPY ACTION PILL */}
                <View
                  style={[
                    styles.copyBtn,
                    isCopied && styles.copiedBtn,
                  ]}
                >
                  <Ionicons
                    name={isCopied ? 'checkmark' : 'copy-outline'}
                    size={12.5}
                    color={isCopied ? '#123D2B' : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.copyBtnText,
                      isCopied && styles.copiedBtnText,
                    ]}
                  >
                    {isCopied ? 'Copied' : 'Copy'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  /* FULL-BLEED OUTER CONTAINER */
  outerContainer: {
    width: '100%',
    marginHorizontal: 0,
    paddingHorizontal: 0,
    marginVertical: 4,
  },

  /* WARM HONEY SECTION WITH STRAIGHT EDGES */
  cardSection: {
    width: '100%',
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
    gap: 8,
  },

  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headingTextCol: {
    flex: 1,
  },

  title: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 18,
    color: '#123D2B',
    fontWeight: '700',
  },

  subtitle: {
    fontFamily: 'InterRegular',
    fontSize: 11,
    color: '#4A463D',
    marginTop: 1,
  },

  badgeChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE4D4',
    shadowColor: '#A46816',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  badgeText: {
    fontFamily: 'InterSemiBold',
    fontSize: 9.5,
    color: '#123D2B',
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDE1B3',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 6,
  },

  toastText: {
    fontFamily: 'InterMedium',
    fontSize: 10.5,
    color: '#123D2B',
  },

  /* VERTICAL STACK OF 100% WIDTH TICKET CHIPS */
  chipsContainer: {
    width: '100%',
    gap: 10,
  },

  couponChip: {
    width: '100%',
    minHeight: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE7DC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    paddingLeft: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#1A1610',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  couponChipPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },

  /* 4 SCALLOPED NOTCHES ON LEFT EDGE (MATCHING REFERENCE UI) */
  notchesColumn: {
    position: 'absolute',
    left: -5,
    top: 6,
    bottom: 6,
    width: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 3,
  },

  notchCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FDE8CC',
    borderWidth: 1,
    borderColor: '#F1D8B4',
  },

  /* DISCOUNT COLUMN (LEFT) */
  discountCol: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },

  discountNumber: {
    fontFamily: 'InterSemiBold',
    fontSize: 18,
    fontWeight: '800',
    color: '#123D2B',
    lineHeight: 21,
  },

  discountNumberFree: {
    fontSize: 13,
    lineHeight: 15,
  },

  discountSub: {
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    fontWeight: '700',
    color: '#123D2B',
    letterSpacing: 0.5,
    marginTop: 1,
  },

  /* VERTICAL DIVIDER */
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#EBE2D4',
    marginHorizontal: 12,
  },

  /* CENTER INFO COLUMN */
  centerInfoCol: {
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },

  codeText: {
    fontFamily: 'InterSemiBold',
    fontSize: 13.5,
    fontWeight: '800',
    color: '#123D2B',
    letterSpacing: 0.5,
  },

  descText: {
    fontFamily: 'InterRegular',
    fontSize: 9.8,
    color: '#4A463D',
    lineHeight: 14,
    marginTop: 1.5,
  },

  /* COPY ACTION BUTTON (RIGHT) */
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    backgroundColor: '#173F1D',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },

  copiedBtn: {
    backgroundColor: '#E4F4E7',
    borderWidth: 0.8,
    borderColor: '#173F1D',
  },

  copyBtnText: {
    fontFamily: 'InterSemiBold',
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  copiedBtnText: {
    color: '#173F1D',
  },
});
