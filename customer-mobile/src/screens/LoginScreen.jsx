import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Link,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../services/googleAuth';
import { colors } from '../theme/colors';
import { getPostLoginRoute } from '../utils/authNavigation';

export default function LoginScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams();
  const postLoginRoute = getPostLoginRoute(returnTo);

  const { login, loginWithGoogleSession } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ==========================================
              HERO HEADER AREA WITH BOTANICAL BACKDROP
          ========================================== */}
          <ImageBackground
            source={require('../../assets/deals-botanical.jpg')}
            resizeMode="cover"
            style={styles.hero}
          >
            {/* RICH FOREST GREEN LUXURY GRADIENT OVERLAY */}
            <LinearGradient
              colors={['rgba(18, 61, 43, 0.88)', 'rgba(18, 61, 43, 0.72)', 'rgba(18, 61, 43, 0.40)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.heroOverlay}
            />

            <View style={styles.heroContent}>
              {/* GOLD LOTUS EMBLEM */}
              <MaterialCommunityIcons
                name="flower-tulip-outline"
                size={38}
                color="#E5BD69"
                style={styles.brandMark}
              />

              {/* BRAND TITLE WITH REGISTERED MARK */}
              <View style={styles.brandRow}>
                <Text style={styles.brand}>AUMVEDA</Text>
                <Text style={styles.registeredMark}>®</Text>
              </View>

              {/* SUBTITLE */}
              <Text style={styles.eyebrow}>— NATURAL WELLNESS —</Text>

              {/* TAGLINE */}
              <Text style={styles.brandDescription}>
                Rooted in nature. Guided by Ayurveda.
              </Text>
            </View>
          </ImageBackground>

          {/* ==========================================
              LUXURY SIGN IN FORM CARD
          ========================================== */}
          <View style={styles.authCard}>
            {/* TOP-RIGHT SUBTLE WATERMARK LEAF */}
            <Image
              source={require('../../assets/leaves-top-left.png')}
              style={styles.topRightLeaf}
              resizeMode="contain"
              pointerEvents="none"
            />

            <View style={styles.formSection}>
              {/* HEADING BLOCK */}
              <View style={styles.heading}>
                <View style={styles.welcomeRow}>
                  <View style={styles.headingRule} />
                  <Text style={styles.headingEyebrow}>WELCOME BACK</Text>
                  <View style={styles.headingRule} />
                </View>

                <Text style={styles.title}>Sign In</Text>

                <Text style={styles.subtitle}>
                  Sign in to continue your wellness journey.
                </Text>
              </View>

              {/* FORM FIELDS */}
              <View style={styles.form}>
                {/* EMAIL ADDRESS */}
                <View style={styles.labelRow}>
                  <Ionicons name="mail-outline" size={15} color="#123D2B" />
                  <Text style={styles.inputLabel}>Email Address</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color="#8F877B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#8F877B"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    style={styles.input}
                    returnKeyType="next"
                  />
                </View>

                {/* PASSWORD */}
                <View style={[styles.labelRow, styles.passwordLabelRow]}>
                  <Ionicons name="lock-closed-outline" size={15} color="#123D2B" />
                  <Text style={styles.inputLabel}>Password</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color="#8F877B"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#8F877B"
                    secureTextEntry={!passwordVisible}
                    textContentType="password"
                    autoCapitalize="none"
                    style={styles.input}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      passwordVisible ? 'Hide password' : 'Show password'
                    }
                    onPress={() => setPasswordVisible((visible) => !visible)}
                    hitSlop={10}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={passwordVisible ? 'eye-outline' : 'eye-off-outline'}
                      size={19}
                      color="#8F877B"
                    />
                  </Pressable>
                </View>

                {/* FORGOT PASSWORD */}
                <Link
                  href={{
                    pathname: '/(auth)/forgot-password',
                    params: { returnTo: postLoginRoute },
                  }}
                  style={styles.forgot}
                >
                  Forgot Password?
                </Link>

                {/* LOGIN BUTTON WITH GRADIENT & SUBTLE LEAF */}
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.88}
                  style={[styles.loginButton, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#174C35', '#123D2B', '#0D3021']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginGradient}
                  >
                    <View style={styles.btnLeafWatermark} pointerEvents="none">
                      <Ionicons
                        name="leaf"
                        size={30}
                        color="rgba(255, 255, 255, 0.12)"
                      />
                    </View>

                    {loading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <View style={styles.loginBtnContent}>
                        <Text style={styles.loginButtonText}>Login</Text>
                        <Ionicons
                          name="arrow-forward"
                          size={17}
                          color={colors.white}
                        />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* DIVIDER */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* GOOGLE SIGN IN BUTTON */}
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.85}
                  style={[
                    styles.googleButton,
                    loading && styles.buttonDisabled,
                  ]}
                  disabled={loading}
                  onPress={async () => {
                    try {
                      setLoading(true);

                      const { session, error, cancelled } =
                        await signInWithGoogle();

                      if (error) {
                        Alert.alert('Google Sign-In Failed', error.message);
                        return;
                      }

                      if (cancelled) {
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
                      Alert.alert(
                        'Google Sign-In Failed',
                        error?.message || 'Please try again.'
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <View style={styles.googleIconCircle}>
                    <Ionicons name="logo-google" size={17} color="#EA4335" />
                  </View>
                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>
              </View>

              {/* CREATE ACCOUNT SWITCH */}
              <View style={styles.accountSwitch}>
                <Text style={styles.accountText}>
                  Don&apos;t have an account?
                </Text>
                <Link href="/(auth)/register" style={styles.accountLink}>
                  Create Account
                </Link>
              </View>

              {/* FOOTER MOTIF */}
              <View style={styles.footerNote}>
                <View style={styles.footerRule} />
                <MaterialCommunityIcons
                  name="leaf"
                  size={16}
                  color="#7A945A"
                  style={styles.footerLeafIcon}
                />
                <View style={styles.footerRule} />
              </View>
              <Text style={styles.footerText}>
                Mindful wellness, naturally
              </Text>
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
    backgroundColor: '#FAF6F0',
  },

  content: {
    flexGrow: 1,
    backgroundColor: '#FAF6F0',
  },

  /* HERO AREA */
  hero: {
    height: 270,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  heroContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    alignItems: 'flex-start',
  },

  brandMark: {
    marginBottom: 4,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  brand: {
    color: '#FFFDF6',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 2.2,
  },

  registeredMark: {
    color: '#E5BD69',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 3,
    marginTop: 2,
  },

  eyebrow: {
    color: '#E8DDBF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.8,
    marginTop: 4,
    fontFamily: 'InterSemiBold',
  },

  brandDescription: {
    marginTop: 10,
    color: '#F4ECE0',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    fontSize: 13.5,
    fontStyle: 'italic',
  },

  /* AUTH SHEET CARD */
  authCard: {
    marginTop: -28,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: '#EFE7DA',
    backgroundColor: '#FAF6F0',
    overflow: 'hidden',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    paddingBottom: 24,
    position: 'relative',
  },

  topRightLeaf: {
    position: 'absolute',
    width: 90,
    height: 80,
    top: 10,
    right: -15,
    opacity: 0.22,
    transform: [{ scaleX: -1 }],
  },

  formSection: {
    paddingHorizontal: 22,
    paddingTop: 24,
  },

  /* HEADING */
  heading: {
    alignItems: 'center',
    marginBottom: 22,
  },

  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 6,
  },

  headingRule: {
    width: 30,
    height: 1,
    backgroundColor: '#B8A888',
  },

  headingEyebrow: {
    color: '#706047',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    fontFamily: 'InterSemiBold',
  },

  title: {
    color: '#123D2B',
    fontFamily: 'PlayfairSemiBold',
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  subtitle: {
    marginTop: 4,
    color: '#655E54',
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    fontFamily: 'InterRegular',
  },

  /* FORM INPUTS */
  form: {
    width: '100%',
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
  },

  passwordLabelRow: {
    marginTop: 16,
  },

  inputLabel: {
    color: '#123D2B',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'InterSemiBold',
  },

  inputContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E6DCC8',
    backgroundColor: '#FFFFFF',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'InterRegular',
    color: '#1A2E22',
    paddingVertical: 10,
  },

  eyeBtn: {
    padding: 6,
    marginLeft: 6,
  },

  forgot: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 18,
    color: '#123D2B',
    fontSize: 12.5,
    fontFamily: 'InterSemiBold',
    fontWeight: '600',
  },

  /* LOGIN BUTTON */
  loginButton: {
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },

  loginGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 20,
  },

  btnLeafWatermark: {
    position: 'absolute',
    right: 20,
    top: 8,
  },

  loginBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  loginButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'InterSemiBold',
    letterSpacing: 0.3,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  /* DIVIDER */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E4DC CE',
  },

  dividerText: {
    color: '#7E766B',
    fontSize: 11.5,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    letterSpacing: 1,
  },

  /* GOOGLE BUTTON */
  googleButton: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.2,
    borderColor: '#E2D7C5',
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  googleIconCircle: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  googleButtonText: {
    color: '#2B1E14',
    fontSize: 13.5,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
  },

  /* ACCOUNT SWITCH */
  accountSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 20,
  },

  accountText: {
    color: '#686258',
    fontSize: 12.5,
    fontFamily: 'InterRegular',
  },

  accountLink: {
    color: '#123D2B',
    fontSize: 12.5,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  /* FOOTER NOTE */
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
  },

  footerRule: {
    width: 32,
    height: 1,
    backgroundColor: '#C8BEAA',
  },

  footerLeafIcon: {
    marginTop: -1,
  },

  footerText: {
    marginTop: 4,
    color: '#7A6E5F',
    fontSize: 11,
    fontStyle: 'italic',
    letterSpacing: 1.2,
    textAlign: 'center',
    fontFamily: 'PlayfairItalic',
  },
});
