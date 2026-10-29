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
import {
  Link,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import AppButton from '../components/common/AppButton';
import AppTextInput from '../components/common/AppTextInput';

import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../services/googleAuth';
import { colors } from '../theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams();
  const postLoginRoute = returnTo === '/checkout' ? '/checkout' : '/(tabs)';

  const { login, loginWithGoogleSession } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert(
        'Required',
        'Please enter your email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      await login(
        email.trim(),
        password
      );

      router.replace(postLoginRoute);
    } catch (error) {
      Alert.alert(
        'Login failed',
        error?.message || 'Unable to login. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

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
          {/* Decorative circles */}
          <View style={styles.decorCircleLarge} />
          <View style={styles.decorCircleSmall} />

          {/* Main authentication card */}
          <View style={styles.authCard}>

            {/* Brand section */}
            <View style={styles.brandSection}>
              <View style={styles.brandMark}>
                <Text style={styles.brandMarkText}>
                  A
                </Text>
              </View>

              <Text style={styles.eyebrow}>
                NATURAL WELLNESS
              </Text>

              <Text style={styles.brand}>
                AUMVEDA
              </Text>

              <Text style={styles.brandDescription}>
                Rooted in nature. Guided by Ayurveda.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formSection}>

              <View style={styles.heading}>
                <Text style={styles.headingEyebrow}>
                  WELCOME BACK
                </Text>

                <Text style={styles.title}>
                  Sign in
                </Text>

                <Text style={styles.subtitle}>
                  Sign in to continue your wellness journey.
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

                <AppTextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                />

                <Link
                  href={{
                    pathname: '/(auth)/forgot-password',
                    params: { returnTo: postLoginRoute },
                  }}
                  style={styles.forgot}
                >
                  Forgot Password?
                </Link>

                <View style={styles.buttonWrapper}>
                  <AppButton
                    title="Login"
                    onPress={handleLogin}
                    loading={loading}
                  />
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.8}
                  style={styles.googleButton}

                  onPress={async () => {
                    try {
                      setLoading(true);

                      console.log('Starting Google sign-in');

                      const { session, error, cancelled } = await signInWithGoogle();

                      console.log('Google sign-in result:', {
                        hasSession: !!session,
                        cancelled,
                        error: error?.message ?? null,
                      });

                      if (error) {
                        Alert.alert('Google Sign-In Failed', error.message);
                        return;
                      }

                      if (cancelled) {
                        console.log('Google sign-in was cancelled');
                        return;
                      }

                      if (session) {
                        await loginWithGoogleSession(session);
                        router.replace(postLoginRoute);
                      } else {
                        Alert.alert(
                          'Sign-in incomplete',
                          'Google sign-in finished without an authenticated session. Please try again.'
                        );
                      }
                    } catch (error) {
                      console.error('Google button error:', error);
                      Alert.alert(
                        'Google Sign-In Failed',
                        error?.message || 'Please try again.'
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}

                >
                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Account switch */}
              <View style={styles.accountSwitch}>
                <Text style={styles.accountText}>
                  Don&apos;t have an account?
                </Text>

                <Link
                  href="/(auth)/register"
                  style={styles.accountLink}
                >
                  Create Account
                </Link>
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
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: 'rgba(87, 102, 84, 0.16)',
    right: -155,
    top: -80,
  },

  decorCircleSmall: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: 'rgba(87, 102, 84, 0.11)',
    right: -85,
    top: -25,
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
    position: 'relative',
    overflow: 'hidden',
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
    letterSpacing: 2.1,
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
    fontSize: 31,
    lineHeight: 38,
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

  forgot: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 15,
    color: '#576654',
    fontSize: 11,
    fontWeight: '600',
  },

  buttonWrapper: {
    marginTop: 3,
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