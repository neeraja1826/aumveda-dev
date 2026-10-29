import React from 'react';

import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';

export default function AppTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
}) {
  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label}
        </Text>
      ) : null}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={
          colors.textLight
        }
        secureTextEntry={
          secureTextEntry
        }
        keyboardType={keyboardType}
        autoCapitalize={
          autoCapitalize
        }
        style={styles.input}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },

    label: {
      marginBottom: 7,
      color: colors.text,
      fontSize: 13,
      fontWeight: '500',
    },

    input: {
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      backgroundColor:
        colors.surface,
      color: colors.text,
      fontSize: 14,
    },
  });