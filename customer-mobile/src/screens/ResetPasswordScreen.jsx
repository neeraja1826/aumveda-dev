import React from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { colors } from '../theme/colors';

export default function ResetPasswordScreen() {
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

      <View style={styles.decorCircleLarge} />
      <View style={styles.decorCircleSmall} />

      <View style={styles.authCard}>

        {/* Brand */}
        <View style={styles.brandSection}>

          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>
              A
            </Text>
          </View>

          <Text style={styles.eyebrow}>
            ACCOUNT RECOVERY
          </Text>

          <Text style={styles.brand}>
            AUMVEDA
          </Text>

          <Text style={styles.brandDescription}>
            Rooted in nature. Guided by Ayurveda.
          </Text>

        </View>

        {/* Content */}
        <View style={styles.formSection}>

          <View style={styles.iconCircle}>
            <Text style={styles.icon}>
              ✓
            </Text>
          </View>

          <Text style={styles.headingEyebrow}>
            PASSWORD RESET
          </Text>

          <Text style={styles.title}>
            Reset password
          </Text>

          <Text style={styles.subtitle}>
            Open the password reset link from your email to continue.
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>
              Back to Login
            </Text>
          </TouchableOpacity>

          <View style={styles.footerNote}>
            <View style={styles.footerDot} />

            <Text style={styles.footerText}>
              Mindful wellness, naturally
            </Text>

            <View style={styles.footerDot} />
          </View>

        </View>

      </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 30,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },

  decorCircleLarge: {
    position: 'absolute',
    width: 310,
    height: 310,
    borderRadius: 155,
    borderWidth: 1,
    borderColor: 'rgba(87, 102, 84, 0.16)',
    right: -165,
    top: -85,
  },

  decorCircleSmall: {
    position: 'absolute',
    width: 195,
    height: 195,
    borderRadius: 98,
    borderWidth: 1,
    borderColor: 'rgba(87, 102, 84, 0.11)',
    right: -90,
    top: -28,
  },

  authCard: {
    width: '100%',
    borderRadius: 26,
    backgroundColor: '#f8f5ee',
    borderWidth: 1,
    borderColor: 'rgba(56, 31, 18, 0.09)',

    shadowColor: '#381f12',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,

    overflow: 'hidden',
  },

  brandSection: {
    backgroundColor: '#576654',
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 28,
  },

  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 20,
  },

  brandMarkText: {
    color: '#fff',
    fontFamily: 'Georgia',
    fontSize: 25,
    fontWeight: '600',
  },

  eyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },

  brand: {
    color: '#fff',
    fontFamily: 'Georgia',
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: 1,
  },

  brandDescription: {
    marginTop: 9,
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    lineHeight: 20,
  },

  formSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },

  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(87, 102, 84, 0.11)',
    borderWidth: 1,
    borderColor: 'rgba(87, 102, 84, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },

  icon: {
    color: '#576654',
    fontSize: 25,
    fontWeight: '700',
  },

  headingEyebrow: {
    color: '#576654',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },

  title: {
    color: '#381f12',
    fontFamily: 'Georgia',
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '600',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 10,
    color: '#776c62',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
  },

  loginButton: {
    width: '100%',
    height: 50,
    marginTop: 28,
    borderRadius: 12,
    backgroundColor: '#576654',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#381f12',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 23,
  },

  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#576654',
    opacity: 0.5,
  },

  footerText: {
    color: '#9a9087',
    fontSize: 9,
    letterSpacing: 0.5,
  },
});