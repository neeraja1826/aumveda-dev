import React, { useEffect } from 'react';
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

    const currentGroup = segments[0];
    const isInAuthGroup = currentGroup === '(auth)';

    console.log('ROUTER AUTH STATE:', {
      loading,
      isAuthenticated,
      currentGroup,
      segments,
    });

    // Logged-in users should not remain on login/ screens.
    if (isAuthenticated && isInAuthGroup) {
      router.replace(
        params.returnTo === '/checkout'
          ? '/checkout'
          : '/(tabs)'
      );
    }
  }, [loading, isAuthenticated, segments, router, params.returnTo]);


  // --------------------------------------------
  // WAIT FOR SESSION RESTORATION
  // --------------------------------------------

  if (loading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
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