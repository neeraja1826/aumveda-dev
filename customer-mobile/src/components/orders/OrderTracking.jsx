import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const STEPS = [
  { key: 'placed', label: 'Placed', icon: 'receipt-outline' },
  { key: 'processing', label: 'Processing', icon: 'cube-outline' },
  { key: 'shipped', label: 'Shipped', icon: 'truck-outline' },
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
          <View
            style={[
              styles.headerIconWrap,
              isCancelled ? styles.iconWrapDanger : styles.iconWrapWarning,
            ]}
          >
            <Ionicons
              name={isCancelled ? 'close-circle-outline' : 'return-down-back-outline'}
              size={17}
              color={isCancelled ? colors.danger : '#A87E34'}
            />
          </View>
          <Text style={styles.title}>Order Tracking</Text>
        </View>

        <View style={styles.exceptionBox}>
          <Text
            style={[
              styles.exceptionTitle,
              isCancelled ? styles.exceptionTitleDanger : styles.exceptionTitleWarning,
            ]}
          >
            {isCancelled ? 'Order Cancelled' : 'Order Returned'}
          </Text>
          <Text style={styles.exceptionDesc}>
            {isCancelled
              ? 'This order has been cancelled and will not be delivered.'
              : 'This order has been marked as returned.'}
          </Text>
        </View>
      </View>
    );
  }

  const rawIndex = STEP_ORDER.indexOf(currentStatus);
  const activeIndex = rawIndex < 0 ? 0 : rawIndex;

  // Percentage width for the completed portion of the connecting line
  const fillWidthPercent =
    activeIndex === 0
      ? '0%'
      : activeIndex === 1
        ? '33.3%'
        : activeIndex === 2
          ? '66.6%'
          : '100%';

  return (
    <View style={styles.card}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.headerIconWrap}>
          <MaterialCommunityIcons
            name="truck-delivery-outline"
            size={18}
            color="#123D2B"
          />
        </View>
        <Text style={styles.title}>Order Tracking</Text>
      </View>

      {/* HORIZONTAL TIMELINE STEPPER */}
      <View style={styles.stepperWrapper}>
        {/* CONTINUOUS BACKGROUND CONNECTING TRACK */}
        <View style={styles.trackBackground} pointerEvents="none">
          <View style={[styles.trackFill, { width: fillWidthPercent }]} />
        </View>

        {/* STEP NODES */}
        <View style={styles.nodesRow}>
          {STEPS.map((step, index) => {
            const isCompleted = index <= activeIndex;

            return (
              <View key={step.key} style={styles.stepItem}>
                <View
                  style={[
                    styles.nodeCircle,
                    isCompleted ? styles.nodeCompleted : styles.nodePending,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : step.icon === 'truck-outline' ? (
                    <MaterialCommunityIcons
                      name="truck-outline"
                      size={15}
                      color="#8A7E6C"
                    />
                  ) : (
                    <Ionicons
                      name={step.icon}
                      size={15}
                      color="#8A7E6C"
                    />
                  )}
                </View>

                <Text
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7DA',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
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
    borderRadius: 10,
    backgroundColor: '#EDF5EB',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
    letterSpacing: -0.2,
  },

  /* HORIZONTAL STEPPER */
  stepperWrapper: {
    position: 'relative',
    paddingVertical: 4,
  },

  trackBackground: {
    position: 'absolute',
    top: 20,
    left: 28,
    right: 28,
    height: 2,
    backgroundColor: '#EBE2D4',
    borderRadius: 1,
  },

  trackFill: {
    height: 2,
    backgroundColor: '#123D2B',
    borderRadius: 1,
  },

  nodesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  stepItem: {
    alignItems: 'center',
    width: 66,
  },

  nodeCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  nodeCompleted: {
    backgroundColor: '#123D2B',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  nodePending: {
    backgroundColor: '#FAF6F0',
    borderWidth: 1.2,
    borderColor: '#E2D7C5',
  },

  stepLabel: {
    fontSize: 11.5,
    color: '#7A7366',
    fontFamily: 'InterRegular',
    textAlign: 'center',
  },

  stepLabelCompleted: {
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
  },

  /* EXCEPTION BOX */
  exceptionBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FAF7F2',
  },

  exceptionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'InterSemiBold',
    marginBottom: 4,
  },

  exceptionTitleDanger: {
    color: colors.danger,
  },

  exceptionTitleWarning: {
    color: '#A87E34',
  },

  exceptionDesc: {
    fontSize: 12,
    color: '#70685D',
    lineHeight: 16,
  },
});
