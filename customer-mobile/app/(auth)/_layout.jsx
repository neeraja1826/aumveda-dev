import React, { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';

export default function AuthLayout() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (router.canGoBack()) {
            return false;
          }

          router.replace('/(tabs)');
          return true;
        },
      );

      return () => subscription.remove();
    }, [router]),
  );

  return <Stack screenOptions={{ headerShown: false }} />;
}