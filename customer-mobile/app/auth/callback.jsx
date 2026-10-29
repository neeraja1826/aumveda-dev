import React from 'react';
import { Text, View } from 'react-native';
import { colors } from '../../src/theme/colors';

export default function GoogleAuthCallbackRoute() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <Text>Completing Google sign-in...</Text>
    </View>
  );
}
