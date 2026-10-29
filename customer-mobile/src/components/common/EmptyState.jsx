import React from 'react';

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';

export default function EmptyState({
  title = 'Nothing here yet',
  message,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title}
      </Text>

      {message ? (
        <Text style={styles.message}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      padding: 30,
      alignItems: 'center',
    },

    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },

    message: {
      marginTop: 6,
      fontSize: 13,
      color:
        colors.textSecondary,
      textAlign: 'center',
    },
  });