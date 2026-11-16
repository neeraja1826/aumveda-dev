import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../src/context/AuthContext';
import { getProfile, updateProfile } from '../src/services/profileService';
import { colors } from '../src/theme/colors';

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

function isValidPhone(value) {
  const cleaned = String(value || '').trim();
  return !cleaned || /^[0-9+\-\s()]{7,20}$/.test(cleaned);
}

function isValidDate(value) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12) return false;

  const leapYear =
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysPerMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= daysPerMonth[month - 1];
}

function getLocalDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPickerDate(value) {
  if (!isValidDate(value) || !value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatDateForDisplay(value) {
  if (!value) return '';
  return getPickerDate(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.full_name || user?.name || '',
    phone: user?.phone || '',
    dateOfBirth: '',
    gender: '',
    marketingOptIn: false,
  });
  const [profileLoading, setProfileLoading] = useState(Boolean(user?.id));
  const [profileLoadError, setProfileLoadError] = useState('');
  const [profileReload, setProfileReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [pendingDate, setPendingDate] = useState(new Date());

  useEffect(() => {
    if (!user?.id) return undefined;

    let active = true;

    Promise.resolve()
      .then(async () => {
        if (!active) return undefined;
        setProfileLoading(true);
        setProfileLoadError('');
        const profile = await getProfile();
        if (!active) return undefined;
        if (!profile) throw new Error('Your profile could not be loaded.');

        setForm({
          fullName:
            profile.full_name || profile.name || user.full_name || user.name || '',
          phone: profile.phone || '',
          dateOfBirth: profile.date_of_birth?.slice(0, 10) || '',
          gender: profile.gender || '',
          marketingOptIn: Boolean(profile.marketing_opt_in),
        });
      })
      .catch((error) => {
        if (active) {
          setProfileLoadError(
            error?.message || 'Unable to load your profile.'
          );
        }
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id, user?.full_name, user?.name, profileReload]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openDatePicker = () => {
    setPendingDate(getPickerDate(form.dateOfBirth));
    setDatePickerVisible(true);
  };

  const saveSelectedDate = (date) => {
    updateField('dateOfBirth', getLocalDateValue(date));
    setDatePickerVisible(false);
  };

  const handleSave = async () => {
    const fullName = form.fullName.trim();
    const phone = form.phone.trim();
    const dateOfBirth = form.dateOfBirth.trim();

    if (!fullName) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    if (!isValidPhone(phone)) {
      Alert.alert('Invalid phone number', 'Please enter a valid phone number.');
      return;
    }
    if (!isValidDate(dateOfBirth)) {
      Alert.alert(
        'Invalid date of birth',
        'Enter a valid date in YYYY-MM-DD format.'
      );
      return;
    }
    if (!token) {
      Alert.alert('Login required', 'Please sign in to update your profile.');
      return;
    }

    try {
      setSaving(true);
      const updated = await updateProfile(
        {
          full_name: fullName,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
          gender: form.gender || null,
          marketing_opt_in: form.marketingOptIn,
        },
        token
      );

      updateUser({
        ...user,
        ...(updated || {}),
        full_name: fullName,
        phone,
        date_of_birth: dateOfBirth,
        gender: form.gender,
        marketing_opt_in: form.marketingOptIn,
      });

      Alert.alert('Profile updated', 'Your profile has been saved.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
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

  const fieldsDisabled = profileLoading || Boolean(profileLoadError) || saving;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text style={styles.eyebrow}>PERSONAL DETAILS</Text>
            <Text style={styles.subtitle}>
              Keep your account information up to date.
            </Text>
          </View>

          {profileLoading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Loading your profile...</Text>
            </View>
          )}

          {profileLoadError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{profileLoadError}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setProfileReload((current) => current + 1)}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <TextInput
                  value={form.fullName}
                  onChangeText={(value) => updateField('fullName', value)}
                  autoCapitalize="words"
                  autoComplete="name"
                  editable={!fieldsDisabled}
                  style={styles.input}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.textLight}
                  accessibilityLabel="Full name"
                />
              </View>

              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrap, styles.readOnlyInputWrap]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <TextInput
                  value={user?.email || ''}
                  editable={false}
                  style={[styles.input, styles.readOnlyInput]}
                  placeholder="No email available"
                  placeholderTextColor={colors.textLight}
                  accessibilityLabel="Email address"
                />
              </View>

              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <TextInput
                  value={form.phone}
                  onChangeText={(value) => updateField('phone', value)}
                  autoComplete="tel"
                  keyboardType="phone-pad"
                  editable={!fieldsDisabled}
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.textLight}
                  accessibilityLabel="Phone number"
                />
              </View>

              <Text style={styles.label}>Date of Birth</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                {Platform.OS === 'web' ? (
                  <TextInput
                    value={form.dateOfBirth}
                    onChangeText={(value) => updateField('dateOfBirth', value)}
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                    editable={!fieldsDisabled}
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textLight}
                    accessibilityLabel="Date of birth, year month day"
                  />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Choose date of birth"
                    disabled={fieldsDisabled}
                    onPress={openDatePicker}
                    style={[
                      styles.datePickerTrigger,
                      fieldsDisabled && styles.disabledControl,
                    ]}
                  >
                    <Text
                      style={[
                        styles.datePickerText,
                        !form.dateOfBirth && styles.datePickerPlaceholder,
                      ]}
                    >
                      {form.dateOfBirth
                        ? formatDateForDisplay(form.dateOfBirth)
                        : 'Select date of birth'}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </Pressable>
                )}
              </View>

              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderOptions}>
                {GENDER_OPTIONS.map((option) => {
                  const selected = form.gender === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      disabled={fieldsDisabled}
                      onPress={() => updateField('gender', option.value)}
                      style={[
                        styles.genderOption,
                        selected && styles.genderOptionSelected,
                        fieldsDisabled && styles.disabledControl,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          selected && styles.genderOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: form.marketingOptIn }}
                disabled={fieldsDisabled}
                onPress={() =>
                  updateField('marketingOptIn', !form.marketingOptIn)
                }
                style={[
                  styles.marketingRow,
                  fieldsDisabled && styles.disabledControl,
                ]}
              >
                <Ionicons
                  name={
                    form.marketingOptIn
                      ? 'checkbox'
                      : 'square-outline'
                  }
                  size={22}
                  color={
                    form.marketingOptIn
                      ? colors.primary
                      : colors.textSecondary
                  }
                />
                <View style={styles.marketingText}>
                  <Text style={styles.marketingTitle}>Product Updates</Text>
                  <Text style={styles.marketingDescription}>
                    Receive product announcements, new arrivals and special offers.
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              disabled={saving}
              style={[styles.cancelButton, saving && styles.disabledControl]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleSave}
              disabled={fieldsDisabled}
              style={[styles.saveButton, fieldsDisabled && styles.disabledControl]}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="save-outline" size={17} color={colors.white} />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {Platform.OS === 'android' && datePickerVisible && (
        <DateTimePicker
          value={pendingDate}
          mode="date"
          display="calendar"
          presentation="dialog"
          accentColor={colors.primary}
          themeVariant="light"
          onValueChange={(_, date) => saveSelectedDate(date)}
          onDismiss={() => setDatePickerVisible(false)}
          positiveButton={{ label: 'Done' }}
          negativeButton={{ label: 'Cancel' }}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          transparent
          animationType="fade"
          visible={datePickerVisible}
          onRequestClose={() => setDatePickerVisible(false)}
        >
          <View style={styles.datePickerOverlay}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => setDatePickerVisible(false)}
              accessibilityLabel="Close date picker"
            />
            <View style={styles.datePickerSheet}>
              <View style={styles.datePickerHeader}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDatePickerVisible(false)}
                  hitSlop={8}
                >
                  <Text style={styles.datePickerCancel}>Cancel</Text>
                </Pressable>
                <Text style={styles.datePickerTitle}>Date of Birth</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => saveSelectedDate(pendingDate)}
                  hitSlop={8}
                >
                  <Text style={styles.datePickerDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={pendingDate}
                mode="date"
                display="inline"
                accentColor={colors.primary}
                themeVariant="light"
                onValueChange={(_, date) => setPendingDate(date)}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 32,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 32,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  intro: {
    marginBottom: 18,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  subtitle: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 13,
  },
  loadingRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  errorCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8C9C4',
    backgroundColor: '#FFF5F2',
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: {
    marginBottom: 8,
    marginTop: 16,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrap: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 14,
  },
  readOnlyInputWrap: {
    backgroundColor: colors.background,
  },
  readOnlyInput: {
    color: colors.textSecondary,
  },
  datePickerTrigger: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  datePickerText: {
    color: colors.text,
    fontSize: 14,
  },
  datePickerPlaceholder: {
    color: colors.textLight,
  },
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  datePickerSheet: {
    paddingBottom: 24,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  datePickerHeader: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  datePickerCancel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  datePickerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  datePickerDone: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderOption: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.white,
  },
  genderOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.sageLight,
  },
  genderOptionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  genderOptionTextSelected: {
    color: colors.primary,
  },
  marketingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  marketingText: {
    flex: 1,
  },
  marketingTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  marketingDescription: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    minHeight: 48,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  disabledControl: {
    opacity: 0.55,
  },
});
