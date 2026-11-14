import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../src/services/addressService';
import { getCurrentLocation } from '../../src/services/locationService';
import { useAuth } from '../../src/context/AuthContext';

import { colors } from '../../src/theme/colors';

export default function AddressRoute() {
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams();

  const returnToCheckout =
    params?.returnToCheckout === 'true';

  const editAddressId =
    params?.addressId || null;

  // -----------------------------------------
  // STATE
  // -----------------------------------------

  const [addresses, setAddresses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [editingId, setEditingId] =
    useState(editAddressId);

  const [showForm, setShowForm] =
    useState(Boolean(editAddressId));

  // -----------------------------------------
  // FORM
  // -----------------------------------------

  const [label, setLabel] =
    useState('');

  const [labelType, setLabelType] =
    useState('');

  const [recipientName, setRecipientName] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [addressLine1, setAddressLine1] =
    useState('');

  const [addressLine2, setAddressLine2] =
    useState('');

  const [city, setCity] =
    useState('');

  const [state, setState] =
    useState('');

  const [postalCode, setPostalCode] =
    useState('');

  const [country, setCountry] =
    useState('India');

  const [detectingLocation, setDetectingLocation] =
    useState(false);

  const [detectedLocation, setDetectedLocation] =
    useState('');

  // -----------------------------------------
  // LOAD ADDRESSES
  // -----------------------------------------

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAddresses(token);
      setAddresses(data || []);
    } catch (error) {
      console.error('Load addresses error:', error);

      Alert.alert(
        'Unable to load addresses',
        error?.message || 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // -----------------------------------------
  // POPULATE FORM
  // -----------------------------------------

  const populateForm = (address) => {
    const savedLabel = String(address?.label || '').trim();
    const standardLabel = ['Home', 'Office'].find(
      (option) => option.toLowerCase() === savedLabel.toLowerCase()
    );
    setLabelType(standardLabel || 'Other');
    setLabel(standardLabel || savedLabel);

    setRecipientName(
      address?.recipient_name || ''
    );

    setPhone(
      address?.phone || ''
    );

    setAddressLine1(
      address?.address_line1 || ''
    );

    setAddressLine2(
      address?.address_line2 || ''
    );

    setCity(
      address?.city || ''
    );

    setState(
      address?.state || ''
    );

    setPostalCode(
      address?.postal_code || ''
    );
    setCountry(address?.country || 'India');
  };

  // -----------------------------------------
  // CLEAR FORM
  // -----------------------------------------

  const clearForm = () => {
    setLabel('');
    setLabelType('');
    setRecipientName('');
    setPhone('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('India');
    setEditingId(null);
    setDetectedLocation('');
  };

  useEffect(() => {
    if (!showForm || Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        setShowForm(false);
        clearForm();
        return true;
      }
    );

    return () => subscription.remove();
  }, [showForm]);

  // -----------------------------------------
  // OPEN ADD FORM
  // -----------------------------------------

  const handleAddNew = () => {
    clearForm();
    setShowForm(true);
  };

  // -----------------------------------------
  // OPEN EDIT FORM
  // -----------------------------------------

  const handleEdit = (address) => {
    setEditingId(address.id);
    populateForm(address);
    setShowForm(true);
  };

  // -----------------------------------------
  // VALIDATE
  // -----------------------------------------

  const validateForm = () => {
    if (!labelType || !label.trim()) {
      Alert.alert(
        'Missing address label',
        labelType === 'Other'
          ? 'Please enter a label for this address.'
          : 'Please select an address label.'
      );
      return false;
    }

    if (!recipientName.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter the recipient name.'
      );
      return false;
    }

    const cleanPhone =
      phone.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      Alert.alert(
        'Invalid phone number',
        'Please enter a valid 10-digit phone number.'
      );
      return false;
    }

    if (!addressLine1.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your address.'
      );
      return false;
    }

    if (!city.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your city.'
      );
      return false;
    }

    if (!state.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your state.'
      );
      return false;
    }

    const cleanPostalCode =
      postalCode.replace(/\D/g, '');

    if (cleanPostalCode.length !== 6) {
      Alert.alert(
        'Invalid pincode',
        'Please enter a valid 6-digit pincode.'
      );
      return false;
    }

    return true;
  };

  const handleDetectCurrentLocation = async () => {
    if (detectingLocation) return;

    try {
      setDetectingLocation(true);
      setDetectedLocation('');
      const location = await getCurrentLocation();
      const locationPostalCode = String(
        location.postalCode || ''
      ).replace(/\D/g, '');

      if (location.addressLine1) {
        setAddressLine1(location.addressLine1);
      }
      if (location.addressLine2) {
        setAddressLine2(location.addressLine2);
      }
      if (location.city) setCity(location.city);
      if (location.state) setState(location.state);
      if (location.country) setCountry(location.country);
      if (locationPostalCode.length === 6) {
        setPostalCode(locationPostalCode);
      }
      setDetectedLocation(location.address);
    } catch (error) {
      console.error(
        'Current location detection failed:',
        error
      );
      Alert.alert(
        'Unable to Detect Location',
        error?.message ||
          'Could not detect your location. Please try again.'
      );
    } finally {
      setDetectingLocation(false);
    }
  };

  // -----------------------------------------
  // SAVE ADDRESS
  // -----------------------------------------

  // -----------------------------------------
// SAVE ADDRESS
// -----------------------------------------

// -----------------------------------------
// SAVE ADDRESS
// -----------------------------------------


const handleSave = async () => {
  if (saving) return;
  if (!validateForm()) return;

  try {
    setSaving(true);

    if (!token) {
      Alert.alert(
        'Login required',
        'Please login before adding an address.'
      );
      return;
    }

    const payload = {
      label: label.trim() || null,
      recipient_name: recipientName.trim(),
      phone: phone.replace(/\D/g, ''),
      address_line1: addressLine1.trim(),
      address_line2: addressLine2.trim() || null,
      city: city.trim(),
      state: state.trim(),
      postal_code: postalCode.replace(/\D/g, ''),
      country: country.trim() || 'India',
    };

    const savedAddress = editingId
      ? await updateAddress(token, editingId, payload)
      : await createAddress(token, payload);

    if (!savedAddress) {
      throw new Error('Address could not be saved.');
    }

    const refreshedAddresses = await getAddresses(token);

    // Support common API response formats.
    const addressList = Array.isArray(refreshedAddresses)
      ? refreshedAddresses
      : Array.isArray(refreshedAddresses?.addresses)
        ? refreshedAddresses.addresses
        : Array.isArray(refreshedAddresses?.data)
          ? refreshedAddresses.data
          : Array.isArray(refreshedAddresses?.data?.addresses)
            ? refreshedAddresses.data.addresses
            : Array.isArray(refreshedAddresses?.data?.data)
              ? refreshedAddresses.data.data
              : [];

    setAddresses(addressList);

    if (returnToCheckout) {
      const savedId =
        savedAddress?.id ??
        savedAddress?.data?.id ??
        savedAddress?.address?.id ??
        savedAddress?.data?.address?.id ??
        editingId;

      const addressToReturn =
        addressList.find(
          (item) => savedId && String(item.id) === String(savedId)
        ) ||
        addressList.find(
          (item) =>
            String(item?.phone || '').replace(/\D/g, '') ===
              payload.phone &&
            String(item?.address_line1 || '').trim() ===
              payload.address_line1
        );

      if (!addressToReturn?.id) {
        throw new Error(
          'Address saved, but it could not be identified in your address list. Please open the address list and select it.'
        );
      }

      router.replace({
        pathname: '/checkout',
        params: {
          addressId: String(addressToReturn.id),
          ...(params?.buyNow
            ? { buyNow: String(params.buyNow) }
            : {}),
          ...(params?.productId
            ? { productId: String(params.productId) }
            : {}),
          ...(params?.productSlug
            ? { productSlug: String(params.productSlug) }
            : {}),
          ...(params?.variantId
            ? { variantId: String(params.variantId) }
            : {}),
          ...(params?.quantity
            ? { quantity: String(params.quantity) }
            : {}),
        },
      });

      return;
    }

    setShowForm(false);
    clearForm();

    Alert.alert(
      editingId ? 'Address updated' : 'Address added',
      editingId
        ? 'Your address has been updated successfully.'
        : 'Your address has been added successfully.'
    );
  } catch (error) {
    console.error('Save address error:', error);

    Alert.alert(
      'Unable to save address',
      error?.message ||
        'Something went wrong while saving the address.'
    );
  } finally {
    setSaving(false);
  }
};

  // -----------------------------------------
  // DELETE
  // -----------------------------------------

  const handleDelete = (address) => {
    Alert.alert(
      'Delete address',
      'Are you sure you want to delete this address?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(address.id);

              if (!token) {
                return;
              }

              await deleteAddress(
                token,
                address.id
              );

              await loadAddresses();
            } catch (error) {
              console.error(
                'Delete address error:',
                error
              );

              Alert.alert(
                'Unable to delete',
                error?.message ||
                  'Could not delete this address.'
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (addressId) => {
    if (!token || !addressId) {
      Alert.alert(
        'Unable to set default',
        'Please login and try again.'
      );
      return;
    }

    try {
      await setDefaultAddress(token, addressId);

      const response = await getAddresses(token);
      const refreshedAddresses = Array.isArray(response)
        ? response
        : Array.isArray(response?.addresses)
          ? response.addresses
          : Array.isArray(response?.data?.addresses)
            ? response.data.addresses
            : Array.isArray(response?.data)
              ? response.data
              : [];

      setAddresses(refreshedAddresses);

      Alert.alert(
        'Success',
        'Default address updated successfully.'
      );
    } catch (error) {
      console.error('Set default address error:', error);

      Alert.alert(
        'Error',
        error?.message ||
          'Unable to update the default address. Please try again.'
      );
    }
  };

  // -----------------------------------------
  // SELECT ADDRESS FOR CHECKOUT
  // -----------------------------------------
// -----------------------------------------
// SELECT ADDRESS FOR CHECKOUT
// -----------------------------------------


const LOCATION_STORAGE_KEY = '@aumveda_selected_location';

const handleSelectAddress = async (address) => {
  if (!address?.id) {
    Alert.alert(
      'Unable to select address',
      'This address has no valid ID.'
    );
    return;
  }

  // CASE 1: Address selection from checkout
  if (returnToCheckout) {
    router.replace({
      pathname: '/checkout',
      params: {
        ...params,
        addressId: String(address.id),
      },
    });
    return;
  }

  // CASE 2: Address selection from the header
  const selectedLocation = [
    address.city,
    address.state,
  ]
    .filter(Boolean)
    .join(', ');

  try {
    await AsyncStorage.setItem(
      LOCATION_STORAGE_KEY,
      selectedLocation ||
        address.address_line1 ||
        'Delivery location'
    );

    router.back();
  } catch (error) {
    console.error('Address selection error:', error);

    Alert.alert(
      'Unable to select address',
      'Please try again.'
    );
  }
};


  // -----------------------------------------
  // LOADING
  // -----------------------------------------

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
        edges={['top', 'bottom']}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Loading addresses...
        </Text>
      </SafeAreaView>
    );
  }

  // -----------------------------------------
  // FORM
  // -----------------------------------------

  if (showForm) {
    return (
      <SafeAreaView
        style={styles.formScreen}
        edges={['top', 'bottom']}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
        <LinearGradient
          colors={['#E5F2E4', '#D9EAD7', '#CDE2CB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.formHeaderGradient}
        >
          <View style={styles.formHeader}>
            <Pressable
              style={styles.formBackButton}
              onPress={() => {
                setShowForm(false);
                clearForm();
              }}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={colors.primary}
              />
            </Pressable>

            <View style={styles.formHeaderTitleWrap}>
              <Text style={styles.headerEyebrow}>DELIVERY DETAILS</Text>
              <Text style={styles.headerTitle}>
                {editingId ? 'Edit Address' : 'Add Address'}
              </Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.formContent
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.label}>
              Address Line 1 *
            </Text>

            <TextInput
              value={addressLine1}
              onChangeText={setAddressLine1}
              placeholder="House / Flat / Street / Area"
              placeholderTextColor={
                colors.textSecondary
              }
              style={[
                styles.input,
                styles.multilineInput,
              ]}
              multiline
            />

            <Text style={styles.label}>
              Address Line 2
            </Text>

            <TextInput
              value={addressLine2}
              onChangeText={setAddressLine2}
              placeholder="Landmark / Apartment / Optional"
              placeholderTextColor={
                colors.textSecondary
              }
              style={[
                styles.input,
                styles.multilineSmall,
              ]}
              multiline
            />

            <Text style={styles.label}>
              Phone Number *
            </Text>

            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
            />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>
                  City *
                </Text>

                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor={
                    colors.textSecondary
                  }
                  style={styles.input}
                />
              </View>

              <View style={styles.half}>
                <Text style={styles.label}>
                  State *
                </Text>

                <TextInput
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  placeholderTextColor={
                    colors.textSecondary
                  }
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.label}>
              Postal Code *
            </Text>

            <TextInput
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="6-digit pincode"
              placeholderTextColor={
                colors.textSecondary
              }
              keyboardType="number-pad"
              maxLength={6}
              style={styles.input}
            />

            <Text style={styles.label}>
              Country *
            </Text>

            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder="Country"
              placeholderTextColor={colors.textSecondary}
              autoComplete="country-name"
              style={styles.input}
            />

            <Text style={styles.label}>
              Recipient Name *
            </Text>

            <TextInput
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Full name"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
            />

            <Text style={styles.label}>
              SAVE THIS ADDRESS AS *
            </Text>

            <View style={styles.labelChips}>
              {['Home', 'Office', 'Other'].map((option) => {
                const isSelected = labelType === option;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      setLabelType(option);
                      if (option !== 'Other') {
                        setLabel(option);
                      } else if (labelType !== 'Other') {
                        setLabel('');
                      }
                    }}
                    style={[
                      styles.labelChip,
                      isSelected && styles.selectedLabelChip,
                    ]}
                  >
                    {option !== 'Other' ? (
                      <Ionicons
                        name={option === 'Home' ? 'home-outline' : 'business-outline'}
                        size={16}
                        color={isSelected ? colors.white : colors.primary}
                      />
                    ) : null}
                    <Text
                      style={[
                        styles.labelChipText,
                        isSelected && styles.selectedLabelChipText,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {labelType === 'Other' ? (
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="Enter address label"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                returnKeyType="done"
                accessibilityLabel="Custom address label"
              />
            ) : null}

            <Pressable
              style={[
                styles.currentLocationButton,
                (saving || detectingLocation) &&
                  styles.disabledButton,
              ]}
              onPress={handleDetectCurrentLocation}
              disabled={saving || detectingLocation}
            >
              {detectingLocation ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                />
              ) : (
                <Ionicons
                  name="navigate-outline"
                  size={17}
                  color={colors.primary}
                />
              )}
              <Text style={styles.currentLocationButtonText}>
                {detectingLocation
                  ? 'Detecting current location...'
                  : 'Use Current Location'}
              </Text>
            </Pressable>

            {detectedLocation ? (
              <Text
                style={styles.detectedLocationText}
                accessibilityRole="text"
              >
                Location detected: {detectedLocation}
              </Text>
            ) : null}

            <View style={styles.privacyNote}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.privacyNoteText}>
                Your address is saved securely and only used for delivery.
              </Text>
            </View>

            <Pressable
              style={[
                styles.saveButton,
                saving &&
                  styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={saving || detectingLocation}
            >
              {saving ? (
                <ActivityIndicator
                  size="small"
                  color={colors.white}
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={19}
                    color={colors.white}
                  />

                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    {editingId
                      ? 'Update Address'
                      : 'Save Address'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // -----------------------------------------
  // ADDRESS LIST
  // -----------------------------------------

  return (
    <SafeAreaView
      style={styles.addressListScreen}
      edges={['top', 'bottom']}
    >
      <LinearGradient
        colors={['#E5F2E4', '#D9EAD7', '#CDE2CB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.listHeaderGradient}
      >
        <View style={styles.listHeader}>
          <Pressable
            style={styles.listBackButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={colors.primary}
            />
          </Pressable>

          <View style={styles.listHeaderTitleWrap}>
            <Text style={styles.listHeaderEyebrow}>DELIVERY DETAILS</Text>
            <Text style={styles.listHeaderTitle}>My Addresses</Text>
          </View>

          {addresses.length > 0 ? (
            <View style={styles.addressCountBadge}>
              <Ionicons name="location" size={13} color={colors.primary} />
              <Text style={styles.addressCountText}>{addresses.length}</Text>
            </View>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.addressListBody}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.listContent
        }
      >
        {addresses.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="location-outline"
                size={34}
                color={colors.primary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              No address saved
            </Text>

            <Text style={styles.emptyText}>
              Add a delivery address to make
              checkout faster and easier.
            </Text>

            <Pressable
              style={styles.addButton}
              onPress={handleAddNew}
            >
              <Ionicons
                name="add"
                size={19}
                color={colors.white}
              />

              <Text style={styles.addButtonText}>
                Add Address
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {returnToCheckout && (
              <Text style={styles.selectHint}>
                Select an address to continue
                with checkout.
              </Text>
            )}

            {addresses.map((address) => {
              const isDefault =
                Boolean(
                  address?.is_default
                );

              return (
                <Pressable
                  key={address.id}
                  style={[
                    styles.addressCard,
                    isDefault &&
                      styles.defaultCard,
                  ]}
                  onPress={() =>
                    handleSelectAddress(
                      address
                    )
                  }
                >
                  <View
                    style={
                      styles.addressTopRow
                    }
                  >
                    <View
                      style={
                        styles.addressIcon
                      }
                    >
                      <Ionicons
                        name={
                          address?.label
                            ?.toLowerCase()
                            .includes(
                              'office'
                            )
                            ? 'business-outline'
                            : 'home-outline'
                        }
                        size={19}
                        color={
                          colors.primary
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.addressHeading
                      }
                    >
                      <Text
                        style={
                          styles.addressLabel
                        }
                      >
                        {address?.label ||
                          'Address'}
                      </Text>

                      {isDefault && (
                        <View
                          style={
                            styles.defaultBadge
                          }
                        >
                          <Text
                            style={
                              styles.defaultBadgeText
                            }
                          >
                            DEFAULT
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardTopActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${address?.label || 'address'}`}
                        style={styles.cardTopActionButton}
                        onPress={(event) => {
                          event.stopPropagation();
                          handleEdit(address);
                        }}
                      >
                        <Ionicons
                          name="create-outline"
                          size={17}
                          color={colors.primary}
                        />
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${address?.label || 'address'}`}
                        style={[styles.cardTopActionButton, styles.cardTopDeleteButton]}
                        onPress={(event) => {
                          event.stopPropagation();
                          handleDelete(address);
                        }}
                        disabled={deletingId === address.id}
                      >
                        {deletingId === address.id ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.textSecondary}
                          />
                        ) : (
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#B54A4A"
                          />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.recipientName
                    }
                  >
                    {address.recipient_name}
                  </Text>

                  <Text
                    style={
                      styles.addressText
                    }
                  >
                    {address.address_line1}
                  </Text>

                  {address.address_line2 ? (
                    <Text
                      style={
                        styles.addressText
                      }
                    >
                      {address.address_line2}
                    </Text>
                  ) : null}

                  <Text
                    style={
                      styles.addressText
                    }
                  >
                    {address.city},{' '}
                    {address.state} -{' '}
                    {address.postal_code}
                  </Text>

                  <View style={styles.phoneRow}>
                    <Ionicons
                      name="call-outline"
                      size={13}
                      color={colors.primary}
                    />
                    <Text style={styles.phoneText}>{address.phone}</Text>
                  </View>

                  {!isDefault && (
                    <View style={styles.addressActions}>
                      <Pressable
                        style={styles.actionButton}
                        onPress={(event) => {
                          event.stopPropagation();
                          handleSetDefault(address.id);
                        }}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={17}
                          color={colors.primary}
                        />
                        <Text style={styles.actionText}>Set Default</Text>
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })}

            <Pressable
              style={styles.addNewButton}
              onPress={handleAddNew}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F3F7F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addNewButtonInner}
              >
                <View style={styles.addNewIcon}>
                  <Ionicons
                    name="add"
                    size={19}
                    color={colors.white}
                  />
                </View>
                <Text style={styles.addNewButtonText}>
                  Add New Address
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={colors.primary}
                />
              </LinearGradient>
            </Pressable>
          </>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================================
// STYLES
// =========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  formScreen: {
    flex: 1,
    backgroundColor: '#E5F2E4',
  },

  addressListScreen: {
    flex: 1,
    backgroundColor: '#E5F2E4',
  },

  addressListBody: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.textSecondary,
  },

  header: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  listHeaderGradient: {
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderWidth: 1,
    borderColor: '#CDE2CB',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  listHeader: {
    minHeight: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  listBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 4,
    elevation: 2,
  },

  listHeaderTitleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },

  listHeaderEyebrow: {
    marginBottom: 1,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.3,
    color: '#65776C',
  },

  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },

  addressCountBadge: {
    minWidth: 40,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },

  addressCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },

  formHeader: {
    minHeight: 72,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  formHeaderGradient: {
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderWidth: 1,
    borderColor: '#CDE2CB',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },

  formBackButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E8E4DA',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 2,
  },

  formHeaderTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },

  headerEyebrow: {
    marginBottom: 2,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: colors.textSecondary,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },

  headerSpacer: {
    width: 40,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },

  pageIntro: {
    marginBottom: 20,
    paddingHorizontal: 2,
  },

  pageIntroHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  pageIntroIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6EFE3',
  },

  pageTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.text,
  },

  pageSubtitle: {
    marginTop: 7,
    marginLeft: 43,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  selectHint: {
    marginBottom: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EAF2E8',
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },

  addressCard: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E9E7DF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.055,
    shadowRadius: 11,
    elevation: 2,
  },

  defaultCard: {
    borderColor: '#BFD6C0',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    backgroundColor: '#FEFFFD',
  },

  addressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginLeft: 8,
  },

  cardTopActionButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5EE',
    borderWidth: 1,
    borderColor: '#E4ECE1',
  },

  cardTopDeleteButton: {
    backgroundColor: '#FFF5F3',
    borderColor: '#F2E2DE',
  },

  addressIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF2E8',
    borderWidth: 1,
    borderColor: '#DCE9DA',
  },

  addressHeading: {
    flex: 1,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },

  addressLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },

  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#EAF3E7',
  },

  defaultBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.primary,
  },

  recipientName: {
    marginTop: 11,
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },

  addressText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: '#626B62',
  },

  phoneRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: '#F3F6F1',
  },

  phoneText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#455548',
  },

  addressActions: {
    marginTop: 11,
    paddingTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: '#EEECE6',
  },

  actionButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F5EE',
    borderWidth: 1,
    borderColor: '#E4ECE1',
  },

  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },

  addNewButton: {
    minHeight: 60,
    marginTop: 3,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9E5D6',
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 1,
  },

  addNewButtonInner: {
    minHeight: 60,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  addNewIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },

  addNewButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  emptyCard: {
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },

  emptyTitle: {
    marginTop: 17,
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
  },

  emptyText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.textSecondary,
  },

  addButton: {
    height: 46,
    marginTop: 20,
    paddingHorizontal: 22,
    borderRadius: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.primary,
  },

  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },

  formContent: {
    padding: 16,
    paddingBottom: 36,
  },

  formCard: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E9E5DC',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },

  label: {
    marginBottom: 7,
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },

  labelChips: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  labelChip: {
    minHeight: 46,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E7E4DA',
    backgroundColor: '#FBFAF7',
  },

  selectedLabelChip: {
    borderColor: '#1C563C',
    backgroundColor: '#1C563C',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2,
  },

  labelChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },

  selectedLabelChipText: {
    color: colors.white,
  },

  input: {
    minHeight: 50,
    marginBottom: 14,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FBFAF7',
    color: colors.text,
    fontSize: 13,
  },

  multilineInput: {
    minHeight: 76,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  multilineSmall: {
    minHeight: 62,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  row: {
    flexDirection: 'row',
    gap: 10,
  },

  half: {
    flex: 1,
  },

  currentLocationButton: {
    minHeight: 42,
    marginTop: 4,
    marginBottom: 7,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE7D8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F2F7EF',
  },

  currentLocationButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  detectedLocationText: {
    marginBottom: 9,
    fontSize: 11,
    lineHeight: 16,
    color: '#53675A',
  },

  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
    marginBottom: 10,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#F1F6EF',
  },

  privacyNoteText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: '#53675A',
  },

  saveButton: {
    height: 54,
    marginTop: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#123D2B',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },

  disabledButton: {
    opacity: 0.65,
  },

  saveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },

  bottomSpace: {
    height: 40,
  },
});