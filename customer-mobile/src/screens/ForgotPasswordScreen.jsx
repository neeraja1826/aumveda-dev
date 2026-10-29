import React, { useState } from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import AppButton from '../components/common/AppButton';
import AppTextInput from '../components/common/AppTextInput';

import { forgotPassword } from '../services/authService';
import { colors } from '../theme/colors';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      Alert.alert(
        'Required',
        'Enter your email address to continue.'
      );
      return;
    }

    try {
      setLoading(true);

      await forgotPassword(normalizedEmail);

      Alert.alert(
        'Check your email',
        'If an account exists for that address, you will receive a password reset link.'
      );
    } catch (error) {
      Alert.alert(
        'Request failed',
        error?.message || 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

        <View style={styles.decorCircleLarge} />
        <View style={styles.decorCircleSmall} />

        <View style={styles.authCard}>

          {/* Top green brand area */}
          <View style={styles.brandSection}>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>
                ‹
              </Text>

              <Text style={styles.backLabel}>
                Back
              </Text>
            </TouchableOpacity>

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

          </View>

          {/* Form section */}
          <View style={styles.formSection}>

            <View style={styles.heading}>

              <Text style={styles.headingEyebrow}>
                PASSWORD RESET
              </Text>

              <Text style={styles.title}>
                Forgot Password?
              </Text>

              <Text style={styles.subtitle}>
                Enter your registered email address and we'll send you a link to reset your password.
              </Text>

            </View>

            <View style={styles.form}>

              <AppTextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <View style={styles.buttonWrapper}>
                <AppButton
                  title="Send Reset Link"
                  onPress={handleForgotPassword}
                  loading={loading}
                />
              </View>

            </View>

            <View style={styles.accountSwitch}>

              <Text style={styles.accountText}>
                Remember your password?
              </Text>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.accountLink}>
                  Login
                </Text>
              </TouchableOpacity>

            </View>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 30,
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
    paddingTop: 25,
    paddingBottom: 27,
  },

  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backText: {
    color: '#fff',
    fontSize: 27,
    lineHeight: 27,
    marginRight: 4,
  },

  backLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 18,
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

  formSection: {
    paddingHorizontal: 24,
    paddingVertical: 28,
  },

  heading: {
    marginBottom: 24,
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
  },

  subtitle: {
    marginTop: 9,
    color: '#776c62',
    fontSize: 13,
    lineHeight: 21,
  },

  form: {
    gap: 4,
  },

  buttonWrapper: {
    marginTop: 5,
  },

  accountSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 24,
  },

  accountText: {
    color: '#7a7068',
    fontSize: 12,
  },

  accountLink: {
    color: '#576654',
    fontSize: 12,
    fontWeight: '700',
  },

  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
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