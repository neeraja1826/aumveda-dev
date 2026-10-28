import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../src/services/addressService';
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
    setLabel(
      address?.label || ''
    );

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
  };

  // -----------------------------------------
  // CLEAR FORM
  // -----------------------------------------

  const clearForm = () => {
    setLabel('');
    setRecipientName('');
    setPhone('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setState('');
    setPostalCode('');
    setEditingId(null);
  };

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
      country: 'India',
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
        style={styles.container}
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
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              setShowForm(false);
              clearForm();
            }}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={colors.text}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            {editingId
              ? 'Edit Address'
              : 'Add Address'}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.formContent
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              Delivery Details
            </Text>

            <Text style={styles.formSubtitle}>
              Enter the address where you want
              your order delivered.
            </Text>

            <Text style={styles.label}>
              Address Label
            </Text>

            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Home / Office"
              placeholderTextColor={
                colors.textSecondary
              }
              style={styles.input}
            />

            <Text style={styles.label}>
              Recipient Name
            </Text>

            <TextInput
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Full name"
              placeholderTextColor={
                colors.textSecondary
              }
              style={styles.input}
            />

            <Text style={styles.label}>
              Phone Number
            </Text>

            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile number"
              placeholderTextColor={
                colors.textSecondary
              }
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
            />

            <Text style={styles.label}>
              Address Line 1
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

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>
                  City
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
                  State
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
              Pincode
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

            <Pressable
              style={[
                styles.saveButton,
                saving &&
                  styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={saving}
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
      style={styles.container}
      edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          My Addresses
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.listContent
        }
      >
        <View style={styles.pageIntro}>
          <Text style={styles.pageTitle}>
            Delivery Addresses
          </Text>

          <Text style={styles.pageSubtitle}>
            Manage your saved delivery addresses.
          </Text>
        </View>

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

                  <Text
                    style={
                      styles.phoneText
                    }
                  >
                    {address.phone}
                  </Text>

                  <View
                    style={
                      styles.addressActions
                    }
                  >
                    {!isDefault && (
                      <Pressable
                        style={
                          styles.actionButton
                        }
                        onPress={() =>
                          handleSetDefault(
                            address.id
                          )
                        }
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={17}
                          color={
                            colors.primary
                          }
                        />

                        <Text
                          style={
                            styles.actionText
                          }
                        >
                          Set Default
                        </Text>
                      </Pressable>
                    )}

                    <Pressable
                      style={
                        styles.actionButton
                      }
                      onPress={() =>
                        handleEdit(address)
                      }
                    >
                      <Ionicons
                        name="create-outline"
                        size={17}
                        color={
                          colors.text
                        }
                      />

                      <Text
                        style={
                          styles.actionTextDark
                        }
                      >
                        Edit
                      </Text>
                    </Pressable>

                    <Pressable
                      style={
                        styles.actionButton
                      }
                      onPress={() =>
                        handleDelete(
                          address
                        )
                      }
                      disabled={
                        deletingId ===
                        address.id
                      }
                    >
                      {deletingId ===
                      address.id ? (
                        <ActivityIndicator
                          size="small"
                          color={
                            colors.textSecondary
                          }
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="trash-outline"
                            size={17}
                            color="#B54A4A"
                          />

                          <Text
                            style={
                              styles.deleteText
                            }
                          >
                            Delete
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}

            <Pressable
              style={styles.addNewButton}
              onPress={handleAddNew}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={colors.primary}
              />

              <Text
                style={
                  styles.addNewButtonText
                }
              >
                Add New Address
              </Text>
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

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },

  headerTitle: {
    fontSize: 20,
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
    marginBottom: 18,
  },

  pageTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: colors.text,
  },

  pageSubtitle: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  selectHint: {
    marginBottom: 12,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },

  addressCard: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  defaultCard: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },

  addressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  addressIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },

  addressHeading: {
    flex: 1,
    marginLeft: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },

  addressLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },

  defaultBadge: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.cream,
  },

  defaultBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: colors.primary,
  },

  recipientName: {
    marginTop: 15,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },

  addressText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  phoneText: {
    marginTop: 7,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },

  addressActions: {
    marginTop: 15,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  actionButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.background,
  },

  actionText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },

  actionTextDark: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },

  deleteText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B54A4A',
  },

  addNewButton: {
    height: 52,
    marginTop: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  addNewButtonText: {
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
    paddingBottom: 100,
  },

  formCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  formTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
  },

  formSubtitle: {
    marginTop: 5,
    marginBottom: 20,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  label: {
    marginBottom: 7,
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },

  input: {
    minHeight: 46,
    marginBottom: 12,
    paddingHorizontal: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
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

  saveButton: {
    height: 50,
    marginTop: 8,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
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