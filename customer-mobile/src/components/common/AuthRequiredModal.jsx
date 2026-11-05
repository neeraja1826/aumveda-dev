import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function AuthRequiredModal({
  visible,
  onClose,
}) {
  const router = useRouter();

  const handleLogin = () => {
    onClose();
    router.push('/(auth)/login');
  };

  const handleSignup = () => {
    onClose();
    router.push('/(auth)/register');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <View style={styles.modalCard}>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>A</Text>
          </View>

          <Text style={styles.title}>
            Welcome to AUMVEDA
          </Text>

          <Text style={styles.description}>
            Please login or create an account to continue
            with your wellness journey.
          </Text>

          <Pressable
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>
              Login
            </Text>
          </Pressable>

          <Pressable
            style={styles.signupButton}
            onPress={handleSignup}
          >
            <Text style={styles.signupButtonText}>
              Create Account
            </Text>
          </Pressable>

          <Pressable
            style={styles.continueButton}
            onPress={onClose}
          >
            <Text style={styles.continueText}>
              Continue Browsing
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#F8F5EE',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: '#776C62',
  },
  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#576654',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: 'Georgia',
    fontWeight: '600',
  },
  title: {
    fontSize: 21,
    fontFamily: 'Georgia',
    fontWeight: '600',
    color: '#381F12',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: '#776C62',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  loginButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#576654',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  signupButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#576654',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  signupButtonText: {
    color: '#576654',
    fontSize: 14,
    fontWeight: '700',
  },
  continueButton: {
    marginTop: 18,
    padding: 6,
  },
  continueText: {
    color: '#776C62',
    fontSize: 12,
    fontWeight: '600',
  },
});
