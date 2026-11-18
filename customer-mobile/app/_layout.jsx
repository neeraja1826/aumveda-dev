import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import {
  Stack,
  useGlobalSearchParams,
  useRouter,
  useSegments,
} from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  AuthProvider,
  useAuth,
} from '../src/context/AuthContext';

import {
  CartProvider,
} from '../src/context/CartContext';

import {
  WishlistProvider,
} from '../src/context/WishlistContext';
import { getPostLoginRoute } from '../src/utils/authNavigation';
import { getCustomerNotifications } from '../src/services/notificationService';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function playCustomerNotificationSound(notification, requestPermission) {
  if (Platform.OS === 'web') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('customer-updates', {
      name: 'Customer updates',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && requestPermission()) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permission.granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title || 'Aumveda',
      body:
        notification.message ||
        notification.body ||
        'You have a new notification.',
      sound: 'default',
      data: { notificationId: String(notification.id) },
    },
    trigger:
      Platform.OS === 'android'
        ? { channelId: 'customer-updates' }
        : null,
  });
}

function NotificationSoundListener() {
  const { loading, isAuthenticated, token, user } = useAuth();

  useEffect(() => {
    if (
      loading ||
      !isAuthenticated ||
      !token ||
      Platform.OS === 'web'
    ) {
      return undefined;
    }

    let active = true;
    let hasBaseline = false;
    let latestNotificationId = null;
    let isChecking = false;
    let permissionRequestAttempted = false;

    const refreshLatestNotification = async () => {
      if (
        isChecking ||
        (AppState.currentState && AppState.currentState !== 'active')
      ) {
        return;
      }
      isChecking = true;

      try {
        const result = await getCustomerNotifications({ limit: 1 });
        if (!active) return;

        const latestNotification = result.items[0];
        const latestId =
          latestNotification?.id === null ||
          latestNotification?.id === undefined
            ? null
            : String(latestNotification.id);

        if (
          hasBaseline &&
          latestId &&
          latestId !== latestNotificationId
        ) {
          await playCustomerNotificationSound(
            latestNotification,
            () => {
              if (permissionRequestAttempted) return false;
              permissionRequestAttempted = true;
              return true;
            },
          );
        }

        latestNotificationId = latestId;
        hasBaseline = true;
      } catch (error) {
        console.error('Unable to check for new customer notifications:', error);
      } finally {
        isChecking = false;
      }
    };

    void refreshLatestNotification();
    const intervalId = setInterval(refreshLatestNotification, 30_000);
    const appStateSubscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') void refreshLatestNotification();
      },
    );

    return () => {
      active = false;
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, [isAuthenticated, loading, token, user?.id]);

  return null;
}

function AppNavigator() {
  const {
    loading,
    isAuthenticated,
  } = useAuth();

  const router = useRouter();
  const segments = useSegments();
  const params = useGlobalSearchParams();


  useEffect(() => {
    if (loading) {
      return;
    }

    const isInAuthGroup = segments[0] === '(auth)';

    // Logged-in users should not remain on login/ screens.
    if (isAuthenticated && isInAuthGroup) {
      router.replace(getPostLoginRoute(params.returnTo));
    }
  }, [loading, isAuthenticated, segments, router, params.returnTo]);


  // --------------------------------------------
  // WAIT FOR SESSION RESTORATION
  // --------------------------------------------

  if (loading) {
    return null;
  }

  return (
    <>
      <NotificationSoundListener />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppNavigator />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}