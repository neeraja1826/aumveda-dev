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
import { useRouter } from 'expo-router';

const APPLIED_COUPON_STORAGE_KEY = '@aumveda_applied_coupon';

// Matches the exact offers shown in the reference image
export const FALLBACK_COUPONS = [
  {
    id: 'shop40',
    code: 'SHOP40',
    discount_type: 'percentage',
    discount_value: 40,
    description: 'Get flat 40% off on orders above 5999',
    min_order_value: 5999,
  },
  {
    id: 'diwali26',
    code: 'DIWALI26',
    discount_type: 'percentage',
    discount_value: 26,
    description: 'Get flat 26% off on your diwali purchase on orders above 799',
    min_order_value: 799,
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

// Color themes per card matching reference screenshot: Mint Green, Lavender, Buttery Gold
const COUPON_THEMES = [
  {
    colBg: '#EBF5E7',
    textColor: '#174C26',
    borderColor: '#DFEFD4',
  },
  {
    colBg: '#F5ECF8',
    textColor: '#48164E',
    borderColor: '#EBD8F5',
  },
  {
    colBg: '#FFF7E4',
    textColor: '#8C590A',
    borderColor: '#F8EAC2',
  },
];

export default function CouponsOffers({ coupons = [] }) {
  const router = useRouter();
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

  const activeCoupons =
    Array.isArray(coupons) && coupons.length > 0
      ? coupons
      : FALLBACK_COUPONS;

  const handleCopy = useCallback(async (code, coupon) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopiedCode(code);

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
      {/* WARM SOFT BEIGE SURFACE (CLEAN, NO LEAF) */}
      <LinearGradient
        colors={['#F8EFE5', '#F5E8DC', '#EFE1D2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientSurface}
      >
        {/* HEADER ROW: TICKET PERCENT ICON + "Available Coupons" + VIEW ALL BUTTON */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons
              name="ticket-percent-outline"
              size={24}
              color="#633611"
              style={styles.ticketIcon}
            />
            <Text style={styles.title}>Available Coupons</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View all available coupons"
            onPress={() => router.push('/coupons')}
            style={({ pressed }) => [
              styles.viewAllBtn,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="arrow-forward" size={12} color="#2C160C" />
          </Pressable>
        </View>

        {/* FEEDBACK TOAST BANNER */}
        {feedbackToast ? (
          <View style={styles.toastBanner}>
            <Ionicons name="checkmark-circle" size={13} color="#1A5323" />
            <Text style={styles.toastText}>{feedbackToast}</Text>
          </View>
        ) : null}

        {/* STATIC 3-COLUMN ROW OF COUPON TICKETS (NO HORIZONTAL SCROLL) */}
        <View style={styles.cardsRow}>
          {activeCoupons.slice(0, 3).map((coupon, index) => {
            const isCopied = copiedCode === coupon.code;
            const discountNum = formatDiscountNumber(coupon);
            const subText = getSubText(coupon);
            const theme = COUPON_THEMES[index % COUPON_THEMES.length];

            return (
              <Pressable
                key={coupon.id || coupon.code || index}
                style={({ pressed }) => [
                  styles.couponCard,
                  pressed && styles.cardPressed,
                ]}
                onPress={() => handleCopy(coupon.code, coupon)}
                accessibilityRole="button"
                accessibilityLabel={`Coupon ${coupon.code}, ${discountNum} ${subText}`}
              >
                {/* LEFT INWARD TICKET NOTCH */}
                <View style={styles.notchLeft} pointerEvents="none" />

                {/* RIGHT INWARD TICKET NOTCH */}
                <View style={styles.notchRight} pointerEvents="none" />

                {/* LEFT: PASTEL DISCOUNT COLUMN */}
                <View
                  style={[
                    styles.discountCol,
                    { backgroundColor: theme.colBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.discountNumber,
                      { color: theme.textColor },
                      discountNum === 'FREE' && styles.discountNumberFree,
                    ]}
                    numberOfLines={1}
                  >
                    {discountNum}
                  </Text>
                  <Text
                    style={[
                      styles.discountSub,
                      { color: theme.textColor },
                    ]}
                    numberOfLines={1}
                  >
                    {subText}
                  </Text>
                </View>

                {/* VERTICAL DASHED DIVIDER */}
                <View style={styles.verticalDivider} />

                {/* RIGHT: COUPON CODE & DESCRIPTION */}
                <View style={styles.infoCol}>
                  <View style={styles.codeRow}>
                    <Text style={styles.codeText}>{coupon.code}</Text>
                    {isCopied && (
                      <Ionicons
                        name="checkmark-circle"
                        size={10}
                        color="#1A5323"
                      />
                    )}
                  </View>

                  <Text style={styles.descText} numberOfLines={2}>
                    {coupon.description ||
                      `Get discount on orders above ₹${coupon.min_order_value || 0}`}
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

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 12,
  },

  /* WARM VANILLA / BEIGE SURFACE */
  gradientSurface: {
    width: '100%',
    borderRadius: 24,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 10,
    borderWidth: 1.2,
    borderColor: '#EBDCCE',
    shadowColor: '#381E11',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },

  /* HEADER ROW */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  ticketIcon: {
    transform: [{ rotate: '-12deg' }],
  },

  title: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 20,
    fontWeight: '700',
    color: '#381E10',
    letterSpacing: -0.2,
  },

  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EDE1D5',
    shadowColor: '#381E11',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  viewAllText: {
    fontFamily: 'InterSemiBold',
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2C160C',
  },

  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#395C21',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },

  toastText: {
    fontFamily: 'InterMedium',
    fontSize: 10.5,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  /* STATIC 3-CARD ROW (NO HORIZONTAL SCROLL) */
  cardsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },

  /* COUPON TICKET CARD */
  couponCard: {
    flex: 1,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE2D7',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#381E11',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },

  /* LEFT INWARD NOTCH (SEMICIRCULAR CUTOUT) */
  notchLeft: {
    position: 'absolute',
    left: -5,
    top: '50%',
    marginTop: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F5E8DC',
    borderWidth: 1,
    borderColor: '#EDE2D7',
    zIndex: 10,
  },

  /* RIGHT INWARD NOTCH (SEMICIRCULAR CUTOUT) */
  notchRight: {
    position: 'absolute',
    right: -5,
    top: '50%',
    marginTop: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F5E8DC',
    borderWidth: 1,
    borderColor: '#EDE2D7',
    zIndex: 10,
  },

  /* LEFT PASTEL DISCOUNT COLUMN */
  discountCol: {
    width: '38%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },

  discountNumber: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 19,
    textAlign: 'center',
  },

  discountNumberFree: {
    fontSize: 11,
    letterSpacing: 0,
  },

  discountSub: {
    fontFamily: 'PlayfairMedium',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: -1,
  },

  /* VERTICAL DASHED DIVIDER */
  verticalDivider: {
    width: 1,
    height: '100%',
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: '#DED3C8',
  },

  /* RIGHT INFO COLUMN */
  infoCol: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    paddingLeft: 5,
    paddingRight: 6,
    paddingVertical: 4,
  },

  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  codeText: {
    fontFamily: 'InterSemiBold',
    fontSize: 10,
    fontWeight: '800',
    color: '#28170F',
    letterSpacing: 0.1,
  },

  descText: {
    fontFamily: 'InterRegular',
    fontSize: 8.5,
    lineHeight: 11,
    color: '#554942',
    marginTop: 2,
  },
});
