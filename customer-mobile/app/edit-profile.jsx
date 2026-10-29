import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../src/context/AuthContext';
import { updateProfile } from '../src/services/profileService';
import { colors } from '../src/theme/colors';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const [name, setName] = useState(
    user?.full_name || user?.name || ''
  );
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    if (!token) {
      Alert.alert('Login required', 'Please sign in to update your profile.');
      return;
    }

    try {
      setSaving(true);
      const updated = await updateProfile(
        { full_name: name.trim(), phone: phone.trim() || null },
        token
      );
      updateUser(updated || { full_name: name.trim(), phone: phone.trim() });
      router.back();
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert(
        'Unable to update profile',
        error?.message || 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          style={styles.input}
          placeholder="Your name"
        />
        <Text style={styles.label}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
          placeholder="Phone number"
        />
        <Pressable
          style={styles.button}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Save Changes</Text>
          )}
        </Pressable>
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
  form: { padding: 20 },
  label: { color: colors.text, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    backgroundColor: colors.white,
  },
  button: {
    minHeight: 50,
    marginTop: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  buttonText: { color: colors.white, fontWeight: '700' },
});
