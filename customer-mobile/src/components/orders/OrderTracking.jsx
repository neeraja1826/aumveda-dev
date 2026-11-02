
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const STEPS = [
  { key: 'placed', label: 'Order placed', icon: 'receipt-outline' },
  { key: 'processing', label: 'Processing', icon: 'cube-outline' },
  { key: 'shipped', label: 'Shipped', icon: 'car-outline' },
  { key: 'delivered', label: 'Delivered', icon: 'home-outline' },
];

const STEP_ORDER = STEPS.map((step) => step.key);

export default function OrderTracking({ status }) {
  const currentStatus = String(status || 'placed').toLowerCase();

  if (currentStatus === 'cancelled' || currentStatus === 'returned') {
    const isCancelled = currentStatus === 'cancelled';
    return (
      <View style={[styles.card, isCancelled ? styles.cardCancelled : styles.cardReturned]}>
        <View style={styles.headerRow}>
          <View style={[styles.headerIconWrap, isCancelled ? styles.iconWrapDanger : styles.iconWrapWarning]}>
            <Ionicons
              name={isCancelled ? 'close-circle' : 'return-down-back'}
              size={18}
              color={isCancelled ? colors.danger : colors.gold}
            />
          </View>
          <Text style={styles.title}>Order Tracking</Text>
        </View>

        <View style={styles.exceptionRow}>
          <View style={styles.textContainer}>
            <Text style={[styles.exceptionTitle, isCancelled && styles.exceptionTitleDanger]}>
              {isCancelled ? 'Order Cancelled' : 'Order Returned'}
            </Text>
            <Text style={styles.description}>
              {isCancelled
                ? 'This order has been cancelled.'
                : 'This order has been marked as returned.'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const currentIndex = STEP_ORDER.indexOf(currentStatus);
  const activeIndex = currentIndex < 0 ? 0 : currentIndex;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerIconWrap}>
          <Ionicons name="compass-outline" size={17} color="#123D2B" />
        </View>
        <Text style={styles.title}>Order Tracking</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>
            {currentStatus.replaceAll('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.timelineContainer}>
        {STEPS.map((step, index) => {
          const complete = index <= activeIndex;
          const active = index === activeIndex;

          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.timeline}>
                <View
                  style={[
                    styles.iconCircle,
                    complete && styles.iconCircleComplete,
                    active && styles.iconCircleActive,
                  ]}
                >
                  <Ionicons
                    name={complete && !active ? 'checkmark' : step.icon}
                    size={active ? 15 : complete ? 14 : 14}
                    color={complete || active ? '#FFFFFF' : '#8F8D85'}
                  />
                </View>

                {index < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.connector,
                      index < activeIndex && styles.connectorComplete,
                    ]}
                  />
                )}
              </View>

              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.stepLabel,
                    complete && styles.stepLabelComplete,
                    active && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>

                {active && (
                  <View style={styles.activePill}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activePillText}>Current Status</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  cardCancelled: {
    backgroundColor: '#FFF8F8',
    borderColor: '#F7D7D7',
  },
  cardReturned: {
    backgroundColor: '#FAF9F4',
    borderColor: '#EBDCB9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 9,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F2E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: {
    backgroundColor: '#FDEEEE',
  },
  iconWrapWarning: {
    backgroundColor: '#FEF7E6',
  },
  title: {
    fontSize: 15.5,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#123D2B',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F2E7',
    borderWidth: 0.8,
    borderColor: '#CDE2CB',
  },
  statusBadgeText: {
    color: '#123D2B',
    fontSize: 11,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  timelineContainer: {
    paddingTop: 4,
  },
  stepRow: {
    minHeight: 52,
    flexDirection: 'row',
  },
  timeline: {
    width: 32,
    alignItems: 'center',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E5DFD3',
    backgroundColor: '#F5F4E7',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconCircleComplete: {
    backgroundColor: '#123D2B',
    borderColor: '#123D2B',
  },
  iconCircleActive: {
    backgroundColor: '#123D2B',
    borderWidth: 3,
    borderColor: '#CDE2CB',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  connector: {
    position: 'absolute',
    top: 28,
    bottom: -1,
    width: 2,
    backgroundColor: '#E5DFD3',
  },
  connectorComplete: {
    backgroundColor: '#123D2B',
  },
  textContainer: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 14,
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 13,
    fontFamily: 'InterMedium',
    color: '#716F68',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  stepLabelComplete: {
    color: '#123D2B',
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#399E5B',
  },
  activePillText: {
    fontSize: 11,
    fontFamily: 'InterMedium',
    color: '#399E5B',
    fontWeight: '600',
  },
  exceptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  exceptionTitle: {
    fontSize: 14,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#123D2B',
    marginBottom: 4,
  },
  exceptionTitleDanger: {
    color: colors.danger,
  },
  description: {
    fontSize: 12,
    fontFamily: 'InterRegular',
    color: '#716F68',
    lineHeight: 18,
  },
});
