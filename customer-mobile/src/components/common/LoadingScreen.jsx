import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';

export default function LoadingScreen({
  text = 'Loading AUMVEDA...',
}) {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color={colors.primary}
      />

      <Text style={styles.text}>
        {text}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        colors.background,
    },

    text: {
      marginTop: 12,
      color:
        colors.textSecondary,
      fontSize: 13,
    },
  });