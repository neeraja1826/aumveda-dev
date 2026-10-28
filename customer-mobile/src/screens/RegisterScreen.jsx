import React, { useState } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { register } from '../services/authService';
import { signInWithGoogle } from '../services/googleAuth';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';

import AppButton from '../components/common/AppButton';
import AppTextInput from '../components/common/AppTextInput';

import { colors } from '../theme/colors';

export default function RegisterScreen() {
  const { loginWithGoogleSession } = useAuth();
  const { returnTo } = useLocalSearchParams();
  const postLoginRoute = returnTo === '/checkout' ? '/checkout' : '/(tabs)';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleRegister = async () => {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName || !trimmedEmail || !password) {
    Alert.alert('Missing Details', 'Please fill in all fields.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    Alert.alert('Invalid Email', 'Please enter a valid email address.');
    return;
  }

  if (password.length < 8) {
    Alert.alert(
      'Weak Password',
      'Your password must contain at least 8 characters.'
    );
    return;
  }

  try {
    const response = await register(
      trimmedName,
      trimmedEmail,
      password
    );

    console.log('Registration response:', response);

    Alert.alert(
      'Registration Successful',
      'Your account has been created. Please log in.',
      [
        {
          text: 'Go to Login',
          onPress: () => router.replace({
            pathname: '/(auth)/login',
            params: { returnTo: postLoginRoute },
          }),
        },
      ]
    );
  } catch (error) {
    console.error('Registration failed:', error);

    Alert.alert(
      'Registration Failed',
      error?.message || 'Unable to create your account. Please try again.'
    );
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

          {/* Brand panel */}
          <View style={styles.brandSection}>

            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>
                A
              </Text>
            </View>

            <Text style={styles.eyebrow}>
              BEGIN YOUR JOURNEY
            </Text>

            <Text style={styles.brand}>
              AUMVEDA
            </Text>

            <Text style={styles.brandDescription}>
              Thoughtful wellness rooted in nature and guided by Ayurvedic wisdom.
            </Text>

          </View>

          {/* Form */}
          <View style={styles.formSection}>

            <View style={styles.heading}>

              <Text style={styles.headingEyebrow}>
                CREATE ACCOUNT
              </Text>

              <Text style={styles.title}>
                Join AUMVEDA
              </Text>

              <Text style={styles.subtitle}>
                Create your account and begin your wellness journey.
              </Text>

            </View>

            <View style={styles.form}>

              <AppTextInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />

              <AppTextInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <AppTextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry
              />

              <View style={styles.buttonWrapper}>
                <AppButton
                  title="Create Account"
                  onPress={handleRegister}
                />
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.8}
                style={styles.googleButton}
                disabled={googleLoading}
                onPress={async () => {
                  try {
                    setGoogleLoading(true);

                    const { session, error, cancelled } =
                      await signInWithGoogle();

                    if (cancelled) return;
                    if (error) throw error;

                    if (!session) {
                      throw new Error(
                        'Google sign-in did not return a session.'
                      );
                    }

                    await loginWithGoogleSession(session);
                    router.replace(postLoginRoute);
                  } catch (error) {
                    Alert.alert(
                      'Google Sign-In Failed',
                      error?.message || 'Please try again.'
                    );
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
              >
                <Text style={styles.googleButtonText}>
                  {googleLoading ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

            </View>

            <View style={styles.accountSwitch}>

              <Text style={styles.accountText}>
                Already have an account?
              </Text>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => router.push({
                  pathname: '/(auth)/login',
                  params: { returnTo: postLoginRoute },
                })}
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
    paddingTop: 30,
    paddingBottom: 27,
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
    marginTop: 10,
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    lineHeight: 20,
  },

  formSection: {
    paddingHorizontal: 24,
    paddingVertical: 28,
  },

  heading: {
    marginBottom: 23,
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
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '600',
  },

  subtitle: {
    marginTop: 7,
    color: '#776c62',
    fontSize: 13,
    lineHeight: 20,
  },

  form: {
    gap: 4,
  },

  buttonWrapper: {
    marginTop: 5,
  },

  googleButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#d8cec0',
    borderRadius: 12,
    backgroundColor: '#fffdf9',
  },

  googleButtonText: {
    color: '#381f12',
    fontSize: 13,
    fontWeight: '600',
  },

  accountSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 23,
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