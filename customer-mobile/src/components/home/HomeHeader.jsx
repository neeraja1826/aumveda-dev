import React, { useCallback, useEffect, useState, useMemo} from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getAddresses } from '../../services/addressService';
const LOCATION_STORAGE_KEY = '@aumveda_selected_location';
const DEFAULT_LOCATION = 'Hyderabad, Telangana';

// Doodle icon selector based on category name
function CategoryDoodleIcon({ name = '', isSelected = false, size = 26 }) {
  const normalized = name.toLowerCase().trim();
  const iconColor = isSelected ? '#123D2B' : '#716F68';

  if (!normalized || normalized === 'all') {
    return <MaterialCommunityIcons name="leaf" size={size} color={iconColor} />;
  }

  if (
    normalized.includes('health') ||
    normalized.includes('digest') ||
    normalized.includes('immunit') ||
    normalized.includes('ayurveda')
  ) {
    return (
      <MaterialCommunityIcons
        name="mortar-pestle-plus"
        size={size}
        color={iconColor}
      />
    );
  }

  if (
    normalized.includes('skin') ||
    normalized.includes('face') ||
    normalized.includes('glow')
  ) {
    return (
      <MaterialCommunityIcons
        name="face-woman-outline"
        size={size}
        color={iconColor}
      />
    );
  }

  if (normalized.includes('hair')) {
    return (
      <MaterialCommunityIcons
        name="spa-outline"
        size={size}
        color={iconColor}
      />
    );
  }

  if (
    normalized.includes('personal') ||
    normalized.includes('body') ||
    normalized.includes('care')
  ) {
    return (
      <MaterialCommunityIcons
        name="flower-tulip-outline"
        size={size}
        color={iconColor}
      />
    );
  }

  if (
    normalized.includes('tea') ||
    normalized.includes('wellness') ||
    normalized.includes('beverage')
  ) {
    return (
      <MaterialCommunityIcons
        name="tea-outline"
        size={size}
        color={iconColor}
      />
    );
  }

  if (
    normalized.includes('oil') ||
    normalized.includes('essential')
  ) {
    return (
      <MaterialCommunityIcons
        name="bottle-tonic-plus-outline"
        size={size}
        color={iconColor}
      />
    );
  }

  return (
    <MaterialCommunityIcons
      name="spa-outline"
      size={size}
      color={iconColor}
    />
  );
}

export default function HomeHeader({
  categories = [],
  selectedCategoryId = 'all',
  onSelectCategory,
}) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { cartCount } = useCart();
  const { token, isAuthenticated } = useAuth();
const [selectedLocation, setSelectedLocation] = useState(
  DEFAULT_LOCATION
);
  const [locationText, setLocationText] = useState(DEFAULT_LOCATION);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadSelectedLocation = async () => {
        try {
          const savedLocation = await AsyncStorage.getItem(
            LOCATION_STORAGE_KEY
          );

          if (isActive && savedLocation) {
            setLocationText(savedLocation);
          }
        } catch (error) {
          console.error(
            'Failed to load selected location:',
            error
          );
        }
      };

      loadSelectedLocation();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const isSmallDevice = width < 370;

  const loadSavedAddresses = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setSavedAddresses([]);
      return;
    }

    try {
      setLoadingAddresses(true);

      const response = await getAddresses(token);

      const addresses = Array.isArray(response)
        ? response
        : response?.addresses ?? [];

      setSavedAddresses(addresses);
    } catch (error) {
      console.error('Failed to load saved addresses:', error);
      setSavedAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (showLocationModal && isAuthenticated) {
      void Promise.resolve().then(loadSavedAddresses);
    }
  }, [showLocationModal, isAuthenticated, loadSavedAddresses]);

  // --------------------------------------------------------------------------
  // LOAD SAVED LOCATION OR USER DEFAULT ADDRESS
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const initLocation = async () => {
      try {
        const storedLoc = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);

        if (storedLoc && isMounted) {
          setLocationText(storedLoc);
        }

        if (token) {
          const addresses = await getAddresses(token);

          if (
            isMounted &&
            Array.isArray(addresses) &&
            addresses.length > 0
          ) {
            setSavedAddresses(addresses);

            if (!storedLoc) {
              const defaultAddr =
                addresses.find((a) => a.is_default) || addresses[0];

              const cityState = [
                defaultAddr.city,
                defaultAddr.state,
              ]
                .filter(Boolean)
                .join(', ');

              if (cityState) {
                setLocationText(cityState);
                await AsyncStorage.setItem(
                  LOCATION_STORAGE_KEY,
                  cityState
                );
              }
            }
          }
        }
      } catch (err) {
        console.log(
          'Error initializing location in HomeHeader:',
          err
        );
      }
    };

    initLocation();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // --------------------------------------------------------------------------
  // SELECT A SAVED ADDRESS
  // --------------------------------------------------------------------------
  const handleSelectAddress = async (address) => {
    const formatted = [
      address.city,
      address.state,
    ]
      .filter(Boolean)
      .join(', ');

    const chosen =
      formatted ||
      address.address_line1 ||
      DEFAULT_LOCATION;

    setLocationText(chosen);

    try {
      await AsyncStorage.setItem(
        LOCATION_STORAGE_KEY,
        chosen
      );
    } catch (_) {}

    setShowLocationModal(false);
  };

  // --------------------------------------------------------------------------
  // DETECT CURRENT LOCATION
  // --------------------------------------------------------------------------
  const handleSetCurrentLocation = async () => {
    try {
      setDetectingLocation(true);

      // Request permission only when the user taps the location option.
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Allow location access to detect your current delivery location.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            ...(!canAskAgain
              ? [
                  {
                    text: 'Open Settings',
                    onPress: () => Linking.openSettings(),
                  },
                ]
              : []),
          ]
        );

        return;
      }

      // Check whether the device's location service is enabled.
      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        Alert.alert(
          'Location Is Turned Off',
          'Please enable your device location to detect your delivery address.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );

        return;
      }

      // Get the device's current coordinates.
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Convert the coordinates into a readable address.
      const places = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      const place = places?.[0];
      console.log('GPS coordinates:', position.coords);
      console.log('Reverse geocoded address:', place);

      if (!place) {
        Alert.alert(
          'Address Not Found',
          'Could not find an address for your current coordinates.'
        );
        return;
      }

      const detectedLocation = [
        place.district || place.subregion || place.city,
        place.region,
      ]
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(', ');

      if (!detectedLocation) {
        Alert.alert(
          'Address Not Found',
          'Could not determine your city and state.'
        );
        return;
      }

      console.log('Detected location:', detectedLocation);

      setLocationText(detectedLocation);

      await AsyncStorage.setItem(
        LOCATION_STORAGE_KEY,
        detectedLocation
      );

      setShowLocationModal(false);
    } catch (error) {
      console.error(
        'GPS location detection failed:',
        error
      );

      Alert.alert(
        'Unable to Detect Location',
        'Could not detect your location. Check that device location is enabled, then try again or choose a saved address.'
      );
    } finally {
      setDetectingLocation(false);
    }
  };

  // --------------------------------------------------------------------------
  // CATEGORIES LIST PREPARATION
  // --------------------------------------------------------------------------
  const categoryItems = useMemo(() => {
    const allPill = {
      id: 'all',
      name: 'All',
    };

    if (!Array.isArray(categories) || categories.length === 0) {
      return [
        allPill,
        { id: 'health-care', name: 'Health Care' },
        { id: 'skin-care', name: 'Skin Care' },
        { id: 'hair-care', name: 'Hair Care' },
        { id: 'personal-care', name: 'Personal Care' },
        { id: 'wellness-teas', name: 'Wellness Teas' },
        { id: 'essential-oils', name: 'Essential Oils' },
      ];
    }

    const unique = [allPill];

    categories.forEach((cat) => {
      if (
        cat?.name &&
        !unique.some(
          (u) =>
            u.name?.toLowerCase() ===
            cat.name?.toLowerCase()
        )
      ) {
        unique.push({
          id: String(cat.id || cat.slug || cat.name),
          name: cat.name,
          slug: cat.slug,
        });
      }
    });

    return unique;
  }, [categories]);

  // --------------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------------
  return (
    <LinearGradient
      colors={['#E5F2E4', '#D9EAD7', '#CDE2CB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradientContainer}
    >
      <StatusBar style="dark" />

      {/* TOP BAR: LOGO & LOCATION + WISHLIST & CART */}
      <View style={styles.topRow}>
        {/* LEFT COLUMN: LOGO AND LOCATION */}
        <View style={styles.leftCol}>
          <Pressable
            onPress={() => router.push('/')}
            style={({ pressed }) => [
              styles.brandLogoRow,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Aumveda Home"
          >
            <Image
              source={require('../../../assets/app-icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Pressable>

          {/* LOCATION SELECTOR */}
          <Pressable
            onPress={() => setShowLocationModal(true)}
            style={({ pressed }) => [
              styles.locationRow,
              pressed && styles.locationPressed,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Location: ${locationText}. Tap to change`}
          >
            <Ionicons
              name="location-sharp"
              size={16}
              color="#123D2B"
              style={styles.locationPin}
            />

            <Text
              style={styles.locationText}
              numberOfLines={1}
            >
              {locationText}
            </Text>

            <Ionicons
              name="chevron-down"
              size={13}
              color="#123D2B"
            />
          </Pressable>
        </View>

        {/* RIGHT COLUMN: WISHLIST AND CART */}
        <View style={styles.actionButtonsRow}>
          <Pressable
            onPress={() => router.push('/wishlist')}
            style={({ pressed }) => [
              styles.circleButton,
              pressed && styles.circleButtonPressed,
            ]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Wishlist"
          >
            <Ionicons
              name="heart-outline"
              size={21}
              color="#123D2B"
            />
          </Pressable>

          <Pressable
            onPress={() => router.push('/cart')}
            style={({ pressed }) => [
              styles.circleButton,
              pressed && styles.circleButtonPressed,
            ]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Cart with ${cartCount} items`}
          >
            <Ionicons
              name="cart-outline"
              size={22}
              color="#123D2B"
            />

            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount > 99 ? '99+' : cartCount || 0}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* SEARCH ROW */}
      <View style={styles.searchRow}>
        <Pressable
          onPress={() => router.push('/search')}
          style={({ pressed }) => [
            styles.searchBar,
            pressed && styles.searchBarPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Search Ayurvedic products"
        >
          <Ionicons
            name="search-outline"
            size={19}
            color="#123D2B"
          />

          <Text
            style={styles.searchPlaceholder}
            numberOfLines={1}
          >
            Search for Ayurvedic products...
          </Text>
        </Pressable>

        {/* HERBAL TEAS PROMO */}
        {!isSmallDevice && (
          <Pressable
            onPress={() => {
              if (onSelectCategory) {
                const teaCat = categories.find((c) =>
                  c?.name?.toLowerCase().includes('tea')
                );

                if (teaCat) {
                  onSelectCategory(teaCat);
                  return;
                }
              }

              router.push({
                pathname: '/(tabs)/categories',
                params: {
                  categoryName: 'Wellness Teas',
                },
              });
            }}
            style={({ pressed }) => [
              styles.miniPromoChip,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Aumveda Herbal Teas"
          >
            <View style={styles.miniPromoTextCol}>
              <Text style={styles.miniPromoEyebrow}>
                AUMVEDA
              </Text>

              <Text style={styles.miniPromoTitle}>
                Herbal{'\n'}Teas
              </Text>
            </View>

            <View style={styles.miniPromoImageWrap}>
              <Image
                source={require('../../../assets/herbal-tea-cup.jpg')}
                style={styles.miniPromoThumb}
                resizeMode="cover"
              />

              <Ionicons
                name="chevron-forward"
                size={11}
                color="#123D2B"
                style={styles.miniPromoArrow}
              />
            </View>
          </Pressable>
        )}
      </View>

      {/* CATEGORIES */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {categoryItems.map((cat) => {
          const isSelected =
            String(cat.id) === String(selectedCategoryId);

          const isAll = cat.id === 'all';

          return (
            <Pressable
              key={cat.id}
              onPress={() => {
                if (onSelectCategory) {
                  onSelectCategory(cat);
                } else if (!isAll) {
                  router.push({
                    pathname: '/(tabs)/categories',
                    params: {
                      categoryId: String(cat.id),
                      categoryName: cat.name,
                    },
                  });
                }
              }}
              style={({ pressed }) => [
                styles.categoryCard,
                isSelected && styles.categoryCardSelected,
                pressed && styles.categoryCardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Category ${cat.name}`}
            >
              <View style={styles.doodleWrap}>
                <CategoryDoodleIcon
                  name={cat.name}
                  isSelected={isSelected}
                  size={isAll ? 26 : 24}
                />
              </View>

              <Text
                style={[
                  styles.categoryName,
                  isSelected && styles.categoryNameSelected,
                ]}
                numberOfLines={2}
              >
                {cat.name}
              </Text>

              {isSelected ? (
                <View style={styles.activeUnderline} />
              ) : (
                <View
                  style={styles.inactiveUnderlinePlaceholder}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* LOCATION SELECTION MODAL */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowLocationModal(false)}
          />

          <View style={styles.modalContent}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons
                  name="location"
                  size={20}
                  color="#123D2B"
                />

                <Text style={styles.modalTitle}>
                  Select Delivery Location
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowLocationModal(false)}
                hitSlop={10}
                style={styles.modalCloseBtn}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* SAVED ADDRESSES */}
            {isAuthenticated && (
              <View style={styles.savedAddressesSection}>
                <Text style={styles.savedAddressesTitle}>
                  Saved Addresses
                </Text>

                {loadingAddresses ? (
                  <ActivityIndicator color="#123D2B" />
                ) : savedAddresses.length > 0 ? (
                  savedAddresses.map((address) => (
                    <TouchableOpacity
                      key={address.id}
                      style={styles.savedAddressItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        const formattedLocation = [
                          address.city,
                          address.state,
                          address.postal_code,
                        ]
                          .filter(Boolean)
                          .join(', ');

                        setLocationText(
                          formattedLocation ||
                            address.address_line1 ||
                            DEFAULT_LOCATION
                        );

                        setShowLocationModal(false);
                      }}
                    >
                      <Ionicons
                        name="location-outline"
                        size={19}
                        color="#123D2B"
                      />

                      <View style={styles.savedAddressText}>
                        <Text style={styles.savedAddressName}>
                          {address.recipient_name ||
                            address.label ||
                            'Saved Address'}
                          {address.is_default ? ' · Default' : ''}
                        </Text>

                        <Text
                          style={styles.savedAddressDescription}
                          numberOfLines={2}
                        >
                          {[
                            address.address_line1,
                            address.address_line2,
                            address.city,
                            address.state,
                            address.postal_code,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color="#888"
                      />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noSavedAddresses}>
                    No saved addresses yet.
                  </Text>
                )}
              </View>
            )}

            {/* CURRENT LOCATION OPTION */}
            <TouchableOpacity
              style={[
                styles.addressOptionItem,
                detectingLocation && { opacity: 0.7 },
              ]}
              onPress={handleSetCurrentLocation}
              activeOpacity={0.7}
              disabled={detectingLocation}
            >
              <View style={styles.optionIconCircle}>
                {detectingLocation ? (
                  <ActivityIndicator
                    size="small"
                    color="#123D2B"
                  />
                ) : (
                  <Ionicons
                    name="navigate"
                    size={17}
                    color="#123D2B"
                  />
                )}
              </View>

              <View style={styles.optionTextCol}>
                <Text style={styles.optionLabel}>
                  {detectingLocation
                    ? 'Detecting location...'
                    : 'Use my current location'}
                </Text>

                <Text
                  style={styles.optionSub}
                  numberOfLines={1}
                >
                  {detectingLocation
                    ? 'Please wait'
                    : locationText !== DEFAULT_LOCATION
                      ? locationText
                      : 'Detect your current delivery location'}
                </Text>
              </View>

              {!detectingLocation &&
                locationText !== DEFAULT_LOCATION && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#123D2B"
                  />
                )}
            </TouchableOpacity>

            {/* ADD OR MANAGE ADDRESSES */}
            <TouchableOpacity
              style={styles.addAddressBtn}
              onPress={() => {
                setShowLocationModal(false);

                router.push(
                  isAuthenticated
                    ? '/address'
                    : '/(auth)/login'
                );
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="add-circle-outline"
                size={19}
                color="#123D2B"
              />

              <Text style={styles.addAddressText}>
                {isAuthenticated
                  ? 'Add or Manage Addresses'
                  : 'Sign In to View Saved Addresses'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// --------------------------------------------------------------------------
// STYLES
// --------------------------------------------------------------------------
const styles = StyleSheet.create({
  gradientContainer: {
    width: '100%',
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 0.2,
    borderColor: '#276345',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  /* TOP ROW */
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  leftCol: {
    flex: 1,
    marginRight: 12,
  },

  brandLogoRow: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },

  logoImage: {
    width: 58,
    height: 48,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingVertical: 2,
  },

  locationPressed: {
    opacity: 0.65,
  },

  locationPin: {
    marginRight: 4,
  },

  locationText: {
    fontFamily: 'InterSemiBold',
    fontSize: 13,
    color: '#123D2B',
    marginRight: 4,
    maxWidth: 200,
  },

  /* RIGHT ACTION BUTTONS */
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },

  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5F4E7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },

  circleButtonPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: '#F5F5F0',
  },

  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#173F1D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  cartBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },

  pressed: {
    opacity: 0.75,
  },

  /* SEARCH ROW */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },

  searchBar: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 9,
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },

  searchBarPressed: {
    backgroundColor: '#FAF9F4',
  },

  searchPlaceholder: {
    flex: 1,
    fontFamily: 'InterRegular',
    fontSize: 12.5,
    color: '#716F68',
  },

  miniPromoChip: {
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#399E5B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 6,
    gap: 6,
  },

  miniPromoTextCol: {
    justifyContent: 'center',
  },

  miniPromoEyebrow: {
    fontFamily: 'InterSemiBold',
    fontSize: 6.8,
    letterSpacing: 0.8,
    color: '#D9A52E',
    fontWeight: '800',
  },

  miniPromoTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 10.5,
    lineHeight: 12,
    color: '#123D2B',
    fontWeight: '700',
  },

  miniPromoImageWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  miniPromoThumb: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  miniPromoArrow: {
    marginLeft: -1,
  },

  /* CATEGORIES */
  categoriesScroll: {
    paddingHorizontal: 14,
    gap: 8,
    alignItems: 'center',
  },

  categoryCard: {
    minWidth: 64,
    maxWidth: 82,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: 'transparent',
  },

  categoryCardSelected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#399E5B',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },

  categoryCardPressed: {
    transform: [{ scale: 0.95 }],
  },

  doodleWrap: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  categoryName: {
    fontFamily: 'InterMedium',
    fontSize: 11,
    lineHeight: 13,
    color: '#716F68',
    textAlign: 'center',
    fontWeight: '500',
  },

  categoryNameSelected: {
    fontFamily: 'InterSemiBold',
    color: '#123D2B',
    fontWeight: '700',
  },

  activeUnderline: {
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#123D2B',
    marginTop: 6,
  },

  inactiveUnderlinePlaceholder: {
    width: 30,
    height: 3,
    marginTop: 6,
    backgroundColor: 'transparent',
  },

  /* LOCATION MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },

  modalBackdrop: {
    flex: 1,
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '75%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },

  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  modalTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 16,
    color: '#123D2B',
    fontWeight: '700',
  },

  modalCloseBtn: {
    padding: 4,
  },

  savedAddressesSection: {
    marginBottom: 16,
  },

  savedAddressesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },

  savedAddressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  savedAddressText: {
    flex: 1,
  },

  savedAddressName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
    marginBottom: 3,
  },

  savedAddressDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: '#666',
  },

  noSavedAddresses: {
    fontSize: 12,
    color: '#777',
    paddingVertical: 8,
  },

  addressOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAF7',
    marginBottom: 10,
    gap: 12,
  },

  optionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F2E7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionTextCol: {
    flex: 1,
  },

  optionLabel: {
    fontFamily: 'InterSemiBold',
    fontSize: 13,
    color: '#123D2B',
    fontWeight: '600',
  },

  optionSub: {
    fontFamily: 'InterRegular',
    fontSize: 11.5,
    color: '#716F68',
    marginTop: 1,
  },

  savedSection: {
    marginTop: 10,
    marginBottom: 8,
  },

  savedSectionTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 10.5,
    letterSpacing: 1.2,
    color: '#716F68',
    marginBottom: 8,
  },

  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E8F2E7',
    marginTop: 8,
  },

  addAddressText: {
    fontFamily: 'InterSemiBold',
    fontSize: 13,
    color: '#123D2B',
    fontWeight: '600',
  },
});