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

  const activeCoupons = (Array.isArray(coupons) ? coupons : []).slice(0, 3);

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

  if (activeCoupons.length === 0) {
    return null;
  }

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
      {/* SEAMLESS WARM GOLDEN SANDALWOOD CANVAS (BLENDED EDGES, ZERO HARSH CUTOFFS) */}
      <LinearGradient
        colors={[
          '#F5F1E8', // Blends seamlessly into page background (no hard top border)
          '#F7EFE3', // Gentle warm sandstone dawn
          '#F4E5D1', // Soft warm honey sandalwood
          '#EFDCC4', // Core rich golden amber center
          '#F4E5D1', // Soft warm honey sandalwood
          '#F7EFE3', // Gentle warm sandstone dawn
          '#F5F1E8', // Blends seamlessly back into page background (no hard bottom border)
        ]}
        locations={[0, 0.12, 0.28, 0.5, 0.72, 0.88, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardSection}
      >
        {/* TOP-RIGHT SUBTLE BOTANICAL SANDALWOOD FOLIAGE WATERMARK */}
        <View style={styles.foliageWrap} pointerEvents="none">
          <MaterialCommunityIcons
            name="leaf"
            size={52}
            color="#D8C5AE"
            style={styles.foliageLeafOne}
          />
          <MaterialCommunityIcons
            name="leaf"
            size={34}
            color="#E7D6C2"
            style={styles.foliageLeafTwo}
          />
        </View>

        {/* SECTION EYEBROW & MOTIF */}
        <View style={styles.headerContainer}>
          <View style={styles.motifRow}>
            <MaterialCommunityIcons
              name="leaf"
              size={12}
              color="#8A5A20"
              style={styles.motifLeftLeaf}
            />
            <MaterialCommunityIcons
              name="leaf"
              size={12}
              color="#8A5A20"
              style={styles.motifRightLeaf}
            />
          </View>

          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowLine} />
            <Text style={styles.eyebrowText}>EXCLUSIVE OFFERS</Text>
            <View style={styles.eyebrowLine} />
          </View>

          {/* MAIN HEADING ROW */}
          <View style={styles.headingRow}>
            <View style={styles.headingTextCol}>
              <Text style={styles.title}>Available Coupons</Text>
              <Text style={styles.subtitle}>
                Use these offers at checkout and save more.
              </Text>
            </View>

            <View style={styles.badgeChip}>
              <MaterialCommunityIcons
                name="ticket-percent"
                size={13}
                color="#123D2B"
              />
              <Text style={styles.badgeText}>
                {activeCoupons.length} {activeCoupons.length === 1 ? 'OFFER' : 'OFFERS'}
              </Text>
            </View>
          </View>
        </View>

        {/* FEEDBACK TOAST BANNER */}
        {feedbackToast ? (
          <View style={styles.toastBanner}>
            <Ionicons name="checkmark-circle" size={13} color="#123D2B" />
            <Text style={styles.toastText}>{feedbackToast}</Text>
          </View>
        ) : null}

        {/* FULL-WIDTH STACK OF TICKET CHIPS WITH SCALLOP NOTCHES */}
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
                {/* 4 SCALLOPED NOTCHES ON LEFT EDGE (BLEND WITH BACKGROUND) */}
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
  /* OUTER CONTAINER */
  outerContainer: {
    width: '100%',
    marginHorizontal: 0,
    paddingHorizontal: 0,
    marginTop: 6,
    marginBottom: 6,
  },

  /* WARM SANDALWOOD SECTION WITH SEAMLESS BLENDED EDGES */
  cardSection: {
    width: '100%',
    paddingTop: 18,
    paddingBottom: 20,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },

  /* TOP RIGHT BOTANICAL SANDALWOOD FOLIAGE WATERMARK */
  foliageWrap: {
    position: 'absolute',
    top: -8,
    right: -8,
    opacity: 0.35,
    transform: [{ rotate: '15deg' }],
  },

  foliageLeafOne: {
    opacity: 0.85,
  },

  foliageLeafTwo: {
    position: 'absolute',
    top: 14,
    right: 14,
    opacity: 0.7,
    transform: [{ rotate: '-25deg' }],
  },

  /* HEADER CONTAINER */
  headerContainer: {
    marginBottom: 12,
    zIndex: 2,
  },

  motifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginBottom: 2,
  },

  motifLeftLeaf: {
    transform: [{ rotate: '-25deg' }],
  },

  motifRightLeaf: {
    transform: [{ rotate: '25deg' }, { scaleX: -1 }],
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 6,
  },

  eyebrowLine: {
    width: 20,
    height: 1.2,
    backgroundColor: '#8A5A20',
  },

  eyebrowText: {
    fontFamily: 'InterSemiBold',
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: '#8A5A20',
    fontWeight: '700',
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    gap: 8,
  },

  headingTextCol: {
    flex: 1,
  },

  title: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 21,
    color: '#123D2B',
    fontStyle: 'italic',
    lineHeight: 26,
  },

  subtitle: {
    fontFamily: 'InterRegular',
    fontSize: 11,
    color: '#5A5448',
    marginTop: 2,
  },

  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DCCB',
    shadowColor: '#3A2016',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
    backgroundColor: '#F3E4D0',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
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
    zIndex: 2,
  },

  couponChip: {
    width: '100%',
    minHeight: 58,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EADBCE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    paddingLeft: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#3A2016',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },

  couponChipPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },

  /* 4 SCALLOPED NOTCHES ON LEFT EDGE (BLEND WITH SEAMLESS BACKGROUND) */
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
    backgroundColor: '#EFDCC4',
    borderWidth: 1,
    borderColor: '#E4D0B8',
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
    color: '#8A5A20',
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
    color: '#555045',
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
    backgroundColor: '#EAF4EC',
    borderWidth: 0.9,
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
