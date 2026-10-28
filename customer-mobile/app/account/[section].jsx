import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../src/theme/colors';

const SECTION_CONTENT = {
  settings: {
    title: 'Settings',
    description: 'Manage your Aumveda account preferences.',
    options: [
      { label: 'Notifications', route: '/account/notifications' },
      { label: 'Language', route: '/account/language' },
    ],
  },
  notifications: {
    title: 'Notifications',
    description:
      'Push notification preferences are not available yet. Important order updates will still be shown in your account.',
    options: [],
  },
  language: {
    title: 'Language',
    description: 'English is currently the only language available.',
    options: [],
  },
};

export default function AccountSectionScreen() {
  const router = useRouter();
  const { section } = useLocalSearchParams();
  const content = SECTION_CONTENT[section];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{content?.title || 'Account'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          {content?.description || 'This account section is unavailable.'}
        </Text>
        {content?.options.map((option) => (
          <Pressable
            key={option.route}
            style={styles.option}
            onPress={() => router.push(option.route)}
          >
            <Text style={styles.optionLabel}>{option.label}</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  headerSpacer: { width: 24 },
  content: { padding: 20 },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 20,
  },
  option: {
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  optionLabel: { color: colors.text, fontWeight: '600' },
});
