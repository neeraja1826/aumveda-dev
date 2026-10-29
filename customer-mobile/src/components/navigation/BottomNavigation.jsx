import React from 'react';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  usePathname,
  useRouter,
} from 'expo-router';

import { colors } from '../../theme/colors';

const items = [
  {
    label: 'Home',
    icon: 'home-outline',
    activeIcon: 'home',
    route: '/(tabs)',
  },
  {
    label: 'Categories',
    icon: 'grid-outline',
    activeIcon: 'grid',
    route: '/(tabs)/categories',
  },
  {
    label: 'Cart',
    icon: 'cart-outline',
    activeIcon: 'cart',
    route: '/(tabs)/cart',
  },
  {
    label: 'Profile',
    icon: 'person-outline',
    activeIcon: 'person',
    route: '/(tabs)/profile',
  },
];

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const active =
          pathname === item.route ||
          (
            item.route === '/(tabs)' &&
            pathname === '/'
          );

        return (
          <Pressable
            key={item.label}
            style={styles.item}
            onPress={() =>
              router.push(item.route)
            }
          >
            <Ionicons
              name={
                active
                  ? item.activeIcon
                  : item.icon
              }
              size={21}
              color={
                active
                  ? colors.primary
                  : colors.textLight
              }
            />

            <Text
              style={[
                styles.label,
                active &&
                  styles.activeLabel,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      height: 72,
      borderTopWidth: 1,
      borderTopColor:
        colors.border,
      backgroundColor:
        colors.surface,
      flexDirection: 'row',
      justifyContent:
        'space-around',
      alignItems: 'center',
    },

    item: {
      alignItems: 'center',
      justifyContent:
        'center',
      minWidth: 60,
    },

    label: {
      marginTop: 4,
      fontSize: 9,
      color:
        colors.textLight,
    },

    activeLabel: {
      color: colors.primary,
      fontWeight: '600',
    },
  });