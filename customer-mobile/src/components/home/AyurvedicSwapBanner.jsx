import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function AyurvedicSwapBanner() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F3826', '#092317']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* GOLD ACCENT BORDER */}
        <View style={styles.goldBar} />

        {/* EYEBROW */}
        <View style={styles.eyebrowRow}>
          <Text style={styles.sparkle}>✦</Text>
          <Text style={styles.eyebrow}>THE AUMVEDA CLEAN SWAP</Text>
        </View>

        {/* HEADLINE */}
        <Text style={styles.headline}>
          Replace Chemical Synthetics with Wildcrafted Vedic Science
        </Text>

        {/* COMPARISON TILES */}
        <View style={styles.comparisonRow}>
          {/* CONVENTIONAL / RED */}
          <View style={styles.compareTileOld}>
            <View style={styles.tileHeaderRed}>
              <Ionicons name="close-circle" size={14} color="#EF4444" />
              <Text style={styles.tileRedLabel}>Conventional</Text>
            </View>
            <Text style={styles.tileRedItem}>• Sulfates & Parabens</Text>
            <Text style={styles.tileRedItem}>• Synthetic Minoxidil</Text>
            <Text style={styles.tileRedItem}>• Chemical Fragrances</Text>
          </View>

          {/* ARROW ICON */}
          <View style={styles.arrowBadge}>
            <Ionicons name="swap-horizontal" size={16} color="#D9A52E" />
          </View>

          {/* CLEAN AYURVEDA / GREEN */}
          <View style={styles.compareTileNew}>
            <View style={styles.tileHeaderGreen}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.tileGreenLabel}>Vedic Purity</Text>
            </View>
            <Text style={styles.tileGreenItem}>• 100% Wild Herbs</Text>
            <Text style={styles.tileGreenItem}>• Cold-Pressed Extracts</Text>
            <Text style={styles.tileGreenItem}>• 0 Artificial Toxins</Text>
          </View>
        </View>

        {/* CTA BUTTON */}
        <Pressable
          style={styles.ctaButton}
          onPress={() => router.push('/(tabs)/categories')}
          accessibilityRole="button"
          accessibilityLabel="Explore pure formulations"
        >
          <LinearGradient
            colors={['#F7DF9B', '#D9A52E', '#B8821F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Explore 100% Clean Formulations</Text>
            <Ionicons name="arrow-forward" size={14} color="#123D2B" />
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 18,
  },

  card: {
    borderRadius: 20,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(217, 165, 46, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },

  goldBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#D9A52E',
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    marginBottom: 6,
  },

  sparkle: {
    color: '#D9A52E',
    fontSize: 11,
  },

  eyebrow: {
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    letterSpacing: 2,
    color: '#D9A52E',
  },

  headline: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
    marginBottom: 14,
  },

  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },

  compareTileOld: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },

  tileHeaderRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },

  tileRedLabel: {
    fontFamily: 'InterSemiBold',
    fontSize: 10.5,
    color: '#F87171',
  },

  tileRedItem: {
    fontFamily: 'InterRegular',
    fontSize: 9.5,
    color: '#D1D5DB',
    lineHeight: 15,
  },

  arrowBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#071A11',
    borderWidth: 1,
    borderColor: '#D9A52E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  compareTileNew: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 165, 46, 0.4)',
  },

  tileHeaderGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },

  tileGreenLabel: {
    fontFamily: 'InterSemiBold',
    fontSize: 10.5,
    color: '#34D399',
  },

  tileGreenItem: {
    fontFamily: 'InterRegular',
    fontSize: 9.5,
    color: '#F3F4F6',
    lineHeight: 15,
  },

  ctaButton: {
    borderRadius: 22,
    overflow: 'hidden',
  },

  ctaGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  ctaText: {
    fontFamily: 'InterSemiBold',
    fontSize: 12,
    color: '#082315',
    letterSpacing: 0.2,
  },
});
