import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';

export default function ProfileScreen() {
  const { user, logout, loading } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.center}
        edges={['top', 'bottom']}
      >
        <Text style={styles.loadingText}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView
        style={styles.loggedOutContainer}
        edges={['top', 'bottom']}
      >
        <View style={styles.iconCircle}>
          <Ionicons
            name="person-outline"
            size={34}
            color={colors.primary}
          />
        </View>

        <Text style={styles.loggedOutTitle}>
          Welcome to Aumveda
        </Text>

        <Text style={styles.loggedOutDescription}>
          Login to access your profile, orders,
          wishlist and more.
        </Text>

        <Pressable
          style={styles.loginButton}
          onPress={() =>
            router.push({
              pathname: '/(auth)/login',
              params: { returnTo: '/(tabs)/profile' },
            })
          }
        >
          <Text style={styles.loginButtonText}>
            Login
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/(auth)/register',
              params: { returnTo: '/(tabs)/profile' },
            })
          }
        >
          <Text style={styles.registerText}>
            Don&apos;t have an account?{' '}
            <Text style={styles.registerHighlight}>
              Register
            </Text>
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            MY ACCOUNT
          </Text>

          <Text style={styles.title}>
            Profile
          </Text>
        </View>

        <Pressable
          style={styles.settingsButton}
          onPress={() => router.push('/account/settings')}
        >
          <Ionicons
            name="settings-outline"
            size={21}
            color={colors.text}
          />
        </Pressable>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {getInitials(user)}
          </Text>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.memberLabel}>
            AUMVEDA MEMBER
          </Text>

          <Text
            style={styles.userName}
            numberOfLines={1}
          >
            {user?.name ||
              user?.full_name ||
              user?.username ||
              'Aumveda Customer'}
          </Text>

          <Text
            style={styles.userEmail}
            numberOfLines={1}
          >
            {user?.email || 'No email available'}
          </Text>
        </View>

        <Pressable
          style={styles.editButton}
          onPress={() => router.push('/edit-profile')}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={colors.primary}
          />
        </Pressable>
      </View>

      {/* Account */}
      <Text style={styles.sectionTitle}>
        Account
      </Text>

      <View style={styles.menuCard}>
        <ProfileMenuItem
          icon="bag-handle-outline"
          title="My Orders"
          subtitle="Track and view your orders"
          onPress={() => router.push('/orders')}
        />

        <ProfileMenuItem
          icon="heart-outline"
          title="Wishlist"
          subtitle="Your saved products"
          onPress={() =>
            router.push('/wishlist')
          }
        />

        <ProfileMenuItem
          icon="location-outline"
          title="Saved Addresses"
          subtitle="Manage your delivery addresses"
          onPress={() => router.push('/address')}
        />
      </View>

      {/* Preferences */}
      <Text style={styles.sectionTitle}>
        Preferences
      </Text>

      <View style={styles.menuCard}>
        <ProfileMenuItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Manage notification preferences"
          onPress={() => router.push('/account/notifications')}
        />

        <ProfileMenuItem
          icon="language-outline"
          title="Language"
          subtitle="English"
          onPress={() => router.push('/account/language')}
        />

        <ProfileMenuItem
          icon="help-circle-outline"
          title="Help & Support"
          subtitle="Get help with your account"
          onPress={() => router.push('/contact')}
        />
      </View>

      {/* Aumveda */}
      <Text style={styles.sectionTitle}>
        Aumveda
      </Text>

      <View style={styles.menuCard}>
        {/* About Us */}
        <ProfileMenuItem
          icon="information-circle-outline"
          title="About Us"
          subtitle="Learn more about Aumveda"
          onPress={() =>
            router.push('/about')
          }
        />

        {/* Contact Us */}
        <ProfileMenuItem
          icon="mail-outline"
          title="Contact Us"
          subtitle="Get in touch with our team"
          onPress={() =>
            router.push('/contact')
          }
        />
      </View>

      {/* Logout */}
      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color="#B42318"
        />

        <Text style={styles.logoutText}>
          Logout
        </Text>
      </Pressable>

      <Text style={styles.version}>
        Aumveda
      </Text>

      <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileMenuItem({
  icon,
  title,
  subtitle,
  onPress,
}) {
  return (
    <Pressable
      style={styles.menuItem}
      onPress={onPress}
      android_ripple={{
        color: '#EEE9DD',
      }}
    >
      <View style={styles.menuIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>
          {title}
        </Text>

        <Text style={styles.menuSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

function getInitials(user) {
  const name =
    user?.name ||
    user?.full_name ||
    user?.username ||
    '';

  if (!name) {
    return 'A';
  }

  const parts = name
    .trim()
    .split(/\s+/);

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.4,
    color: colors.textSecondary,
    marginBottom: 7,
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.8,
  },

  settingsButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderRadius: 26,
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
  },

  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },

  memberLabel: {
    marginBottom: 5,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: colors.cream,
    opacity: 0.78,
  },

  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },

  userEmail: {
    marginTop: 4,
    fontSize: 12,
    color: colors.cream,
    opacity: 0.82,
  },

  editButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionTitle: {
    marginTop: 30,
    marginBottom: 12,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },

  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  menuItem: {
    minHeight: 76,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuText: {
    flex: 1,
    marginLeft: 14,
  },

  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },

  menuSubtitle: {
    marginTop: 5,
    fontSize: 11,
    color: colors.textSecondary,
  },

  logoutButton: {
    height: 54,
    marginTop: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1C5C2',
    backgroundColor: '#FFF7F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B42318',
  },

  version: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 11,
    color: colors.textSecondary,
  },

  bottomSpace: {
    height: 28,
  },

  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  loggedOutContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },

  loggedOutTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  loggedOutDescription: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },

  loginButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },

  loginButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },

  registerText: {
    marginTop: 20,
    fontSize: 13,
    color: colors.textSecondary,
  },

  registerHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
});