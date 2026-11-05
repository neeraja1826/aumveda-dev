import React from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, loading } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout of your Aumveda account?',
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
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <View style={styles.loadingCard}>
          <MaterialCommunityIcons
            name="flower-tulip-outline"
            size={36}
            color="#E5BD69"
            style={styles.loadingIcon}
          />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ============================================================
     GUEST / LOGGED-OUT PROFILE VIEW
  ============================================================ */
  if (!user) {
    return (
      <View style={styles.screenWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* BOTANICAL HERO BANNER */}
          <ImageBackground
            source={require('../../assets/deals-botanical.jpg')}
            resizeMode="cover"
            style={[styles.guestHero, { paddingTop: Math.max(insets.top, 16) }]}
          >
            <LinearGradient
              colors={[
                'rgba(18, 61, 43, 0.90)',
                'rgba(18, 61, 43, 0.76)',
                'rgba(18, 61, 43, 0.45)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.heroOverlay}
            />

            {/* TOP BAR WITH BRAND AND SETTINGS */}
            <View style={styles.topBar}>
              <View style={styles.brandRow}>
                <MaterialCommunityIcons
                  name="flower-tulip-outline"
                  size={24}
                  color="#E5BD69"
                  style={styles.brandIcon}
                />
                <Text style={styles.heroBrandText}>AUMVEDA</Text>
                <Text style={styles.registeredMark}>®</Text>
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Settings"
                style={styles.heroSettingsBtn}
                onPress={() => router.push('/account/settings')}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={19} color="#FFFDF6" />
              </TouchableOpacity>
            </View>

            {/* HERO AVATAR & WELCOME */}
            <View style={styles.guestHeroBody}>
              <View style={styles.avatarRingOuter}>
                <View style={styles.avatarRingInner}>
                  <Ionicons name="person-outline" size={36} color="#123D2B" />
                </View>
              </View>

              <Text style={styles.guestHeroTitle}>Welcome to Aumveda</Text>
              <Text style={styles.guestHeroSubtitle}>
                Your sanctuary of Ayurvedic wellbeing. Sign in to access your orders,
                wishlist, and personalized wellness rituals.
              </Text>
            </View>
          </ImageBackground>

          {/* MAIN ACTIONS CARD */}
          <View style={styles.authCard}>
            <Image
              source={require('../../assets/leaves-top-left.png')}
              style={styles.authCardLeaf}
              resizeMode="contain"
              pointerEvents="none"
            />

            <View style={styles.authCardContent}>
              <View style={styles.welcomeRow}>
                <View style={styles.eyebrowRule} />
                <Text style={styles.authCardEyebrow}>MEMBER ACCESS</Text>
                <View style={styles.eyebrowRule} />
              </View>

              {/* LOGIN GRADIENT BUTTON */}
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.88}
                style={styles.loginPillBtn}
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/login',
                    params: { returnTo: '/(tabs)/profile' },
                  })
                }
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
                      size={28}
                      color="rgba(255, 255, 255, 0.12)"
                    />
                  </View>
                  <Text style={styles.loginPillText}>Sign In to Account</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              {/* CREATE ACCOUNT SECONDARY BUTTON */}
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.85}
                style={styles.registerSecondaryBtn}
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/register',
                    params: { returnTo: '/(tabs)/profile' },
                  })
                }
              >
                <Text style={styles.registerSecondaryText}>Create an Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* MEMBER PRIVILEGES BANNER */}
          <View style={styles.privilegesCard}>
            <Text style={styles.privilegesTitle}>Member Privileges</Text>
            <View style={styles.privilegesGrid}>
              <View style={styles.privilegeItem}>
                <View style={styles.privilegeIconCircle}>
                  <Ionicons name="leaf-outline" size={18} color="#123D2B" />
                </View>
                <Text style={styles.privilegeHeading}>Ayurvedic Care</Text>
                <Text style={styles.privilegeSub}>Personalized wellness</Text>
              </View>

              <View style={styles.privilegeItem}>
                <View style={styles.privilegeIconCircle}>
                  <Ionicons name="cube-outline" size={18} color="#123D2B" />
                </View>
                <Text style={styles.privilegeHeading}>Live Tracking</Text>
                <Text style={styles.privilegeSub}>Instant order updates</Text>
              </View>

              <View style={styles.privilegeItem}>
                <View style={styles.privilegeIconCircle}>
                  <Ionicons name="sparkles-outline" size={18} color="#123D2B" />
                </View>
                <Text style={styles.privilegeHeading}>Exclusive Offers</Text>
                <Text style={styles.privilegeSub}>Early member access</Text>
              </View>
            </View>
          </View>

          {/* ACCOUNT & EXPLORE SECTION */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Account Services</Text>

            <View style={styles.menuCard}>
              <ProfileMenuItem
                icon="bag-handle-outline"
                title="My Orders"
                subtitle="Track and view past shipments"
                badgeText="Login"
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/login',
                    params: { returnTo: '/orders' },
                  })
                }
              />

              <ProfileMenuItem
                icon="heart-outline"
                title="Wishlist"
                subtitle="View your saved herbal essentials"
                badgeText="Login"
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/login',
                    params: { returnTo: '/wishlist' },
                  })
                }
              />

              <ProfileMenuItem
                icon="location-outline"
                title="Saved Addresses"
                subtitle="Manage your delivery addresses"
                badgeText="Login"
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/login',
                    params: { returnTo: '/address' },
                  })
                }
              />
            </View>

            <Text style={styles.sectionTitle}>Support & About</Text>

            <View style={styles.menuCard}>
              <ProfileMenuItem
                icon="help-circle-outline"
                title="Help & Customer Care"
                subtitle="Consult with our Ayurvedic advisors"
                onPress={() => router.push('/contact')}
              />

              <ProfileMenuItem
                icon="information-circle-outline"
                title="About Aumveda"
                subtitle="Our Vedic heritage and philosophy"
                onPress={() => router.push('/about')}
              />

              <ProfileMenuItem
                icon="settings-outline"
                title="App Settings"
                subtitle="Notifications, currency, and theme"
                onPress={() => router.push('/account/settings')}
              />
            </View>
          </View>

          {/* FOOTER NOTE */}
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
          <Text style={styles.footerText}>Mindful wellness, naturally</Text>
          <Text style={styles.version}>AUMVEDA • v1.0.0</Text>
          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    );
  }

  /* ============================================================
     AUTHENTICATED / LOGGED-IN PROFILE VIEW
  ============================================================ */
  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* BOTANICAL LUXURY HERO HEADER */}
        <ImageBackground
          source={require('../../assets/deals-botanical.jpg')}
          resizeMode="cover"
          style={[styles.authHero, { paddingTop: Math.max(insets.top, 16) }]}
        >
          <LinearGradient
            colors={[
              'rgba(18, 61, 43, 0.94)',
              'rgba(18, 61, 43, 0.82)',
              'rgba(18, 61, 43, 0.52)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.heroOverlay}
          />

          {/* TOP BAR */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <MaterialCommunityIcons
                name="flower-tulip-outline"
                size={22}
                color="#E5BD69"
                style={styles.brandIcon}
              />
              <Text style={styles.heroBrandText}>AUMVEDA</Text>
              <Text style={styles.registeredMark}>®</Text>
            </View>

            <View style={styles.topBarActions}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
                style={styles.heroIconBtn}
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={18} color="#FFFDF6" />
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Settings"
                style={styles.heroIconBtn}
                onPress={() => router.push('/account/settings')}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={18} color="#FFFDF6" />
              </TouchableOpacity>
            </View>
          </View>

          {/* USER PROFILE INFO ROW */}
          <View style={styles.authProfileHero}>
            {/* AVATAR WITH DOUBLE GOLD RING */}
            <View style={styles.authAvatarOuter}>
              <View style={styles.authAvatarInner}>
                <Text style={styles.authAvatarText}>{getInitials(user)}</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Edit Profile"
                style={styles.avatarEditBadge}
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.85}
              >
                <Ionicons name="pencil" size={11} color="#123D2B" />
              </TouchableOpacity>
            </View>

            <View style={styles.authProfileText}>
              <View style={styles.memberPill}>
                <Ionicons name="sparkles" size={10} color="#E5BD69" />
                <Text style={styles.memberPillText}>AUMVEDA PRIVILEGE</Text>
              </View>

              <Text style={styles.authUserName} numberOfLines={1}>
                {user?.name ||
                  user?.full_name ||
                  user?.username ||
                  'Aumveda Customer'}
              </Text>

              <Text style={styles.authUserEmail} numberOfLines={1}>
                {user?.email || 'No email available'}
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* QUICK SHORTCUTS HUB (OVERLAPPING HERO) */}
        <View style={styles.quickHub}>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.quickCard}
            onPress={() => router.push('/orders')}
            activeOpacity={0.85}
          >
            <View style={styles.quickIconCircle}>
              <Ionicons name="bag-handle-outline" size={20} color="#123D2B" />
            </View>
            <Text style={styles.quickTitle}>My Orders</Text>
            <Text style={styles.quickSub}>Track & History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            style={styles.quickCard}
            onPress={() => router.push('/wishlist')}
            activeOpacity={0.85}
          >
            <View style={styles.quickIconCircle}>
              <Ionicons name="heart-outline" size={20} color="#123D2B" />
            </View>
            <Text style={styles.quickTitle}>Wishlist</Text>
            <Text style={styles.quickSub}>Saved Items</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            style={styles.quickCard}
            onPress={() => router.push('/address')}
            activeOpacity={0.85}
          >
            <View style={styles.quickIconCircle}>
              <Ionicons name="location-outline" size={20} color="#123D2B" />
            </View>
            <Text style={styles.quickTitle}>Addresses</Text>
            <Text style={styles.quickSub}>Delivery Hub</Text>
          </TouchableOpacity>
        </View>

        {/* AYURVEDIC WELLNESS CARD */}
        <View style={styles.wellnessBannerWrapper}>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.wellnessCard}
            onPress={() => router.push('/contact')}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F9F5EC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.wellnessCardGradient}
            >
              <View style={styles.wellnessIconBox}>
                <MaterialCommunityIcons
                  name="flower-tulip-outline"
                  size={24}
                  color="#123D2B"
                />
              </View>

              <View style={styles.wellnessContent}>
                <View style={styles.wellnessBadge}>
                  <Text style={styles.wellnessBadgeText}>AYURVEDIC SANCTUARY</Text>
                </View>
                <Text style={styles.wellnessTitle}>Consult a Wellness Advisor</Text>
                <Text style={styles.wellnessSubtitle}>
                  Personalized Ayurvedic dosha care & herbal guidance.
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#B8A888" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

          {/* PREFERENCES & SETTINGS */}
          <Text style={styles.sectionTitle}>Preferences & Care</Text>

          <View style={styles.menuCard}>
            <ProfileMenuItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Manage order updates and wellness news"
              onPress={() => router.push('/account/notifications')}
            />

            <ProfileMenuItem
              icon="language-outline"
              title="Language"
              subtitle="English (Default)"
              onPress={() => router.push('/account/language')}
            />

            <ProfileMenuItem
              icon="settings-outline"
              title="App Settings"
              subtitle="Security, currency, and preferences"
              onPress={() => router.push('/account/settings')}
            />
          </View>

          {/* AUMVEDA HERITAGE */}
          <Text style={styles.sectionTitle}>Aumveda Heritage</Text>

          <View style={styles.menuCard}>
            <ProfileMenuItem
              icon="help-circle-outline"
              title="Help & Customer Care"
              subtitle="Consult with our Ayurvedic care team"
              onPress={() => router.push('/contact')}
            />

            <ProfileMenuItem
              icon="information-circle-outline"
              title="About Aumveda"
              subtitle="Our Vedic story & purity commitments"
              onPress={() => router.push('/about')}
            />
          </View>

          {/* LOGOUT BUTTON */}
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={19} color="#B42318" />
            <Text style={styles.logoutText}>Logout of Account</Text>
          </TouchableOpacity>

          {/* FOOTER NOTE */}
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
          <Text style={styles.footerText}>Mindful wellness, naturally</Text>
          <Text style={styles.version}>AUMVEDA • v1.0.0</Text>

          <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

function ProfileMenuItem({
  icon,
  title,
  subtitle,
  badgeText,
  onPress,
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
      onPress={onPress}
      android_ripple={{ color: '#F2EDE4' }}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={20} color="#123D2B" />
      </View>

      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>

      {badgeText ? (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badgeText}</Text>
        </View>
      ) : null}

      <Ionicons name="chevron-forward" size={17} color="#B8A888" />
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

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FAF6F0',
  },

  center: {
    flex: 1,
    backgroundColor: '#FAF6F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loadingIcon: {
    marginBottom: 12,
  },

  loadingText: {
    fontSize: 14,
    color: '#706047',
    fontFamily: 'InterSemiBold',
  },

  /* ============================================================
     TOP BAR & BRAND
  ============================================================ */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 20,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandIcon: {
    marginRight: 6,
  },

  heroBrandText: {
    color: '#FFFDF6',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },

  registeredMark: {
    color: '#E5BD69',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
    marginTop: -4,
  },

  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  heroIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroSettingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  /* ============================================================
     GUEST HERO
  ============================================================ */
  guestHero: {
    minHeight: 280,
    overflow: 'hidden',
    position: 'relative',
    paddingBottom: 36,
  },

  guestHeroBody: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  avatarRingOuter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: '#E5BD69',
    backgroundColor: 'rgba(229, 189, 105, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  avatarRingInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  guestHeroTitle: {
    color: '#FFFDF6',
    fontFamily: 'PlayfairSemiBold',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginBottom: 6,
  },

  guestHeroSubtitle: {
    color: '#F4ECE0',
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: 'InterRegular',
    maxWidth: 320,
  },

  /* ============================================================
     AUTHENTICATED HERO
  ============================================================ */
  authHero: {
    paddingBottom: 38,
    position: 'relative',
    overflow: 'hidden',
  },

  authProfileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
  },

  authAvatarOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#E5BD69',
    backgroundColor: 'rgba(229, 189, 105, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  authAvatarInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFDF6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  authAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'PlayfairSemiBold',
  },

  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5BD69',
    borderWidth: 1.5,
    borderColor: '#123D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  authProfileText: {
    flex: 1,
    marginLeft: 16,
  },

  memberPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(229, 189, 105, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(229, 189, 105, 0.45)',
    marginBottom: 5,
  },

  memberPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#E5BD69',
    fontFamily: 'InterSemiBold',
  },

  authUserName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFDF6',
    fontFamily: 'PlayfairSemiBold',
    letterSpacing: 0.2,
  },

  authUserEmail: {
    marginTop: 2,
    fontSize: 12,
    color: '#E8DDBF',
    fontFamily: 'InterRegular',
    opacity: 0.9,
  },

  /* ============================================================
     QUICK SHORTCUTS HUB (OVERLAPPING HERO)
  ============================================================ */
  quickHub: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 14,
  },

  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DA',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  quickIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4EFE6',
    borderWidth: 1,
    borderColor: '#EAE1CF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  quickTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
    textAlign: 'center',
  },

  quickSub: {
    marginTop: 2,
    fontSize: 10,
    color: '#8A8275',
    fontFamily: 'InterRegular',
    textAlign: 'center',
  },

  /* ============================================================
     WELLNESS BANNER
  ============================================================ */
  wellnessBannerWrapper: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },

  wellnessCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8DEC8',
    overflow: 'hidden',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  wellnessCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },

  wellnessIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3EFE6',
    borderWidth: 1,
    borderColor: '#E6DCC8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  wellnessContent: {
    flex: 1,
  },

  wellnessBadge: {
    alignSelf: 'flex-start',
    marginBottom: 2,
  },

  wellnessBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#8C7A58',
    fontFamily: 'InterSemiBold',
  },

  wellnessTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
  },

  wellnessSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#70685D',
    fontFamily: 'InterRegular',
    lineHeight: 15,
  },

  /* ============================================================
     AUTH CARD (GUEST VIEW)
  ============================================================ */
  authCard: {
    marginTop: -22,
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFE7DA',
    backgroundColor: '#FFFFFF',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },

  authCardLeaf: {
    position: 'absolute',
    top: 4,
    right: -10,
    width: 75,
    height: 70,
    opacity: 0.16,
    transform: [{ scaleX: -1 }],
  },

  authCardContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },

  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },

  eyebrowRule: {
    width: 24,
    height: 1,
    backgroundColor: '#B8A888',
  },

  authCardEyebrow: {
    color: '#706047',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'InterSemiBold',
  },

  loginPillBtn: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },

  loginGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
    paddingHorizontal: 20,
  },

  btnLeafWatermark: {
    position: 'absolute',
    right: 18,
    top: 7,
  },

  loginPillText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: 'InterSemiBold',
    letterSpacing: 0.3,
  },

  registerSecondaryBtn: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#123D2B',
    backgroundColor: '#FAF6F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  registerSecondaryText: {
    color: '#123D2B',
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'InterSemiBold',
    letterSpacing: 0.2,
  },

  /* ============================================================
     PRIVILEGES BANNER
  ============================================================ */
  privilegesCard: {
    marginTop: 18,
    marginHorizontal: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F7F3EA',
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },

  privilegesTitle: {
    color: '#706047',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    fontFamily: 'InterSemiBold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  privilegesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  privilegeItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  privilegeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6DCC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  privilegeHeading: {
    color: '#123D2B',
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'InterSemiBold',
    textAlign: 'center',
  },

  privilegeSub: {
    marginTop: 2,
    color: '#7A6E5F',
    fontSize: 9.5,
    textAlign: 'center',
    lineHeight: 13,
  },

  /* ============================================================
     MENU SECTION
  ============================================================ */
  menuSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },

  sectionTitle: {
    marginTop: 16,
    marginBottom: 10,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
    letterSpacing: -0.2,
    marginLeft: 20,
  },

  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE7DA',
    overflow: 'hidden',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginLeft: 16,
    marginRight: 16,
  },

  menuItem: {
    minHeight: 66,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE6',
  },

  menuItemPressed: {
    backgroundColor: '#FBF8F2',
  },

  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3EFE6',
    borderWidth: 1,
    borderColor: '#EAE1CF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuText: {
    flex: 1,
    marginLeft: 12,
  },

  menuTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1A2E22',
    fontFamily: 'InterSemiBold',
  },

  menuSubtitle: {
    marginTop: 3,
    fontSize: 11,
    color: '#7E766B',
    fontFamily: 'InterRegular',
  },

  menuBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: '#F2EDE4',
    borderWidth: 1,
    borderColor: '#E2D7C5',
    marginRight: 6,
  },

  menuBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
  },

  /* ============================================================
     LOGOUT BUTTON
  ============================================================ */
  logoutButton: {
    height: 52,
    marginTop: 22,
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
    fontSize: 13.5,
    fontWeight: '700',
    color: '#B42318',
    fontFamily: 'InterSemiBold',
  },

  /* ============================================================
     FOOTER MOTIF
  ============================================================ */
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

  version: {
    textAlign: 'center',
    marginTop: 6,
    fontSize: 10.5,
    color: '#9C9283',
    fontFamily: 'InterRegular',
    letterSpacing: 1,
  },

  bottomSpace: {
    height: 24,
  },
});
