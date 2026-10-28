import React from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { colors } from '../../theme/colors';

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={
        disabled || loading
      }
      style={[
        styles.button,
        (disabled || loading) &&
          styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={colors.white}
        />
      ) : (
        <Text style={styles.text}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    button: {
      height: 48,
      borderRadius: 12,
      backgroundColor:
        colors.primary,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 20,
    },

    text: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '600',
    },

    disabled: {
      opacity: 0.5,
    },
  });