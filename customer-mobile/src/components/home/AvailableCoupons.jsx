import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APPLIED_COUPON_STORAGE_KEY = '@aumveda_applied_coupon';

const COUPONS_DATA = [
  {
    id: 'welcome15',
    code: 'WELCOME15',
    headline: '15% OFF',
    subtitle: 'On your first order',
    condition: '• Min. ₹499',
    icon: 'gift-outline',
  },
  {
    id: 'ayur100',
    code: 'AYUR100',
    headline: '₹100 OFF',
    subtitle: 'On orders above ₹799',
    condition: null,
    icon: 'tag-outline',
  },
  {
    id: 'freeship',
    code: 'FREESHIP',
    headline: 'FREE DELIVERY',
    subtitle: 'On orders above ₹999',
    condition: null,
    icon: 'truck-delivery-outline',
  },
];

export default function AvailableCoupons() {
  const [appliedCode, setAppliedCode] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Load existing applied coupon from storage if any
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(APPLIED_COUPON_STORAGE_KEY);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          setAppliedCode(parsed?.code || null);
        }
      } catch {
        // silent fallback
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleApplyCoupon = useCallback(
    async (coupon) => {
      try {
        if (appliedCode === coupon.code) {
          // If already applied, tap again to remove
          await AsyncStorage.removeItem(APPLIED_COUPON_STORAGE_KEY);
          setAppliedCode(null);
          setFeedbackMessage(`Coupon ${coupon.code} removed`);
          setTimeout(() => setFeedbackMessage(''), 2500);
          return;
        }

        // Apply coupon
        await AsyncStorage.setItem(
          APPLIED_COUPON_STORAGE_KEY,
          JSON.stringify({
            code: coupon.code,
            headline: coupon.headline,
            condition: coupon.condition,
          })
        );
        setAppliedCode(coupon.code);
        setFeedbackMessage(`Code ${coupon.code} applied successfully!`);
        setTimeout(() => setFeedbackMessage(''), 3000);
      } catch {
        setAppliedCode(coupon.code);
      }
    },
    [appliedCode]
  );

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {/* BOTANICAL LEAF DECORATION IN TOP RIGHT */}
        <View style={styles.decorativeLeafWrap} pointerEvents="none">
          <MaterialCommunityIcons
            name="leaf"
            size={72}
            color="#A8D5B1"
            style={styles.decorativeLeaf}
          />
        </View>

        {/* SECTION HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons
              name="ticket-percent-outline"
              size={26}
              color="#123D2B"
            />
          </View>

          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Available Coupons</Text>
            <Text style={styles.headerSubtitle}>
              Use these offers at checkout and save more.
            </Text>
          </View>
        </View>

        {/* FEEDBACK TOAST MESSAGE IF APPLIED */}
        {feedbackMessage ? (
          <View style={styles.feedbackBanner}>
            <MaterialCommunityIcons
              name="check-circle"
              size={14}
              color="#123D2B"
            />
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        ) : null}

        {/* HORIZONTAL COUPONS SCROLL */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {COUPONS_DATA.map((coupon) => {
            const isApplied = appliedCode === coupon.code;

            return (
              <View key={coupon.id} style={styles.ticketCard}>
                {/* TICKET NOTCHES */}
                <View style={styles.notchLeft} />
                <View style={styles.notchRight} />

                {/* TICKET INNER CONTENT */}
                <View style={styles.ticketInner}>
                  {/* LEFT ICON */}
                  <View style={styles.ticketIconCircle}>
                    <MaterialCommunityIcons
                      name={coupon.icon}
                      size={22}
                      color="#123D2B"
                    />
                  </View>

                  {/* CENTER INFO */}
                  <View style={styles.ticketInfoCol}>
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeBadgeText}>{coupon.code}</Text>
                    </View>

                    <Text
                      style={[
                        styles.headlineText,
                        coupon.headline === 'FREE DELIVERY' &&
                          styles.headlineFreeDelivery,
                      ]}
                      numberOfLines={1}
                    >
                      {coupon.headline}
                    </Text>

                    <Text style={styles.subtitleText} numberOfLines={1}>
                      {coupon.subtitle}
                    </Text>

                    {coupon.condition ? (
                      <Text style={styles.conditionText} numberOfLines={1}>
                        {coupon.condition}
                      </Text>
                    ) : null}
                  </View>

                  {/* RIGHT ACTION: APPLY BUTTON */}
                  <View style={styles.applyBtnCol}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.applyBtn,
                        isApplied && styles.appliedBtn,
                        pressed && styles.applyBtnPressed,
                      ]}
                      onPress={() => handleApplyCoupon(coupon)}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`Apply coupon ${coupon.code}`}
                    >
                      <Text
                        style={[
                          styles.applyBtnText,
                          isApplied && styles.appliedBtnText,
                        ]}
                      >
                        {isApplied ? 'Applied ✓' : 'Apply'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 16,
  },

  cardContainer: {
    backgroundColor: '#EAF5EB',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4EAD7',
    paddingTop: 16,
    paddingBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },

  /* DECORATIVE BOTANICAL LEAF */
  decorativeLeafWrap: {
    position: 'absolute',
    top: -12,
    right: -10,
    opacity: 0.35,
    transform: [{ rotate: '18deg' }],
  },

  decorativeLeaf: {
    opacity: 0.9,
  },

  /* HEADER */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },

  headerIconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTextCol: {
    flex: 1,
  },

  headerTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 17,
    fontWeight: '700',
    color: '#123D2B',
  },

  headerSubtitle: {
    fontFamily: 'InterRegular',
    fontSize: 11.5,
    color: '#4A6252',
    marginTop: 2,
  },

  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DBEFE0',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },

  feedbackText: {
    fontFamily: 'InterMedium',
    fontSize: 11,
    color: '#123D2B',
  },

  /* HORIZONTAL SCROLL */
  scrollContent: {
    paddingHorizontal: 14,
    gap: 10,
    alignItems: 'center',
  },

  /* TICKET CARD */
  ticketCard: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E6DB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  /* TICKET NOTCHES: Semicircular cutouts on left and right edges */
  notchLeft: {
    position: 'absolute',
    top: '50%',
    left: -7,
    marginTop: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EAF5EB',
    borderWidth: 1,
    borderColor: '#D4EAD7',
  },

  notchRight: {
    position: 'absolute',
    top: '50%',
    right: -7,
    marginTop: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#EAF5EB',
    borderWidth: 1,
    borderColor: '#D4EAD7',
  },

  ticketInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  /* TICKET ICON */
  ticketIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF6EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* INFO COL */
  ticketInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },

  codeBadge: {
    backgroundColor: '#EDF5EE',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },

  codeBadgeText: {
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    fontWeight: '700',
    color: '#123D2B',
    letterSpacing: 0.6,
  },

  headlineText: {
    fontFamily: 'InterSemiBold',
    fontSize: 15,
    fontWeight: '800',
    color: '#123D2B',
    lineHeight: 18,
  },

  headlineFreeDelivery: {
    fontSize: 13,
    lineHeight: 16,
  },

  subtitleText: {
    fontFamily: 'InterRegular',
    fontSize: 10,
    color: '#556D5E',
    marginTop: 1,
  },

  conditionText: {
    fontFamily: 'InterRegular',
    fontSize: 9.5,
    color: '#716F68',
    marginTop: 1,
  },

  /* APPLY BUTTON */
  applyBtnCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },

  applyBtn: {
    backgroundColor: '#173F1D',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  applyBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },

  appliedBtn: {
    backgroundColor: '#E4F4E7',
    borderWidth: 1,
    borderColor: '#173F1D',
  },

  applyBtnText: {
    fontFamily: 'InterSemiBold',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  appliedBtnText: {
    color: '#173F1D',
  },
});

