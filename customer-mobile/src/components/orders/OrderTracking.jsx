
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
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Order tracking</Text>
        <View style={styles.exceptionRow}>
          <Ionicons
            name={currentStatus === 'cancelled' ? 'close-circle-outline' : 'return-down-back-outline'}
            size={24}
            color={colors.danger}
          />
          <View style={styles.textContainer}>
            <Text style={styles.exceptionTitle}>
              {currentStatus === 'cancelled' ? 'Order cancelled' : 'Order returned'}
            </Text>
            <Text style={styles.description}>
              {currentStatus === 'cancelled'
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
      <Text style={styles.title}>Order tracking</Text>

      {STEPS.map((step, index) => {
        const complete = index <= activeIndex;
        const active = index === activeIndex;

        return (
          <View key={step.key} style={styles.stepRow}>
            <View style={styles.timeline}>
              <View style={[
                styles.iconCircle,
                complete && styles.iconCircleComplete,
                active && styles.iconCircleActive,
              ]}>
                <Ionicons
                  name={complete ? 'checkmark' : step.icon}
                  size={16}
                  color={complete ? '#FFFFFF' : colors.textSecondary}
                />
              </View>

              {index < STEPS.length - 1 && (
                <View style={[
                  styles.connector,
                  index < activeIndex && styles.connectorComplete,
                ]} />
              )}
            </View>

            <View style={styles.textContainer}>
              <Text style={[
                styles.stepLabel,
                complete && styles.stepLabelComplete,
              ]}>
                {step.label}
              </Text>

              {active && (
                <Text style={styles.description}>Current order status</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 17,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    marginBottom: 18,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  stepRow: {
    minHeight: 55,
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconCircleComplete: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  iconCircleActive: {
    borderWidth: 2,
  },
  connector: {
    position: 'absolute',
    top: 28,
    bottom: -1,
    width: 2,
    backgroundColor: colors.border,
  },
  connectorComplete: {
    backgroundColor: colors.primary,
  },
  textContainer: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stepLabel: {
    paddingTop: 5,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  stepLabelComplete: {
    color: colors.text,
    fontWeight: '700',
  },
  description: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textSecondary,
  },
  exceptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exceptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
