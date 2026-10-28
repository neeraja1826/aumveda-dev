import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../src/theme/colors';

export default function CallbackScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <Text>Callback route matched successfully</Text>
    </View>
  );
}