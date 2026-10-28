import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function DealsOfTheWeek() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Preserved exact aspect ratio of assets/Deals-of-the-week.png (761 x 328)
  const BANNER_ASPECT_RATIO = 761 / 328;
  // Expanded width to available screen space (10px margins on left and right)
  const bannerWidth = Math.min(width - 20, 640);
  // Proportionate height scaled up while strictly preserving original image proportions
  const bannerHeight = Math.round(bannerWidth / BANNER_ASPECT_RATIO);

  const handleOpenDeals = () => {
    router.push('/deals');
  };

  return (
    <View style={styles.outerContainer}>
      <Pressable
        onPress={handleOpenDeals}
        style={({ pressed }) => [
          styles.pressableContainer,
          { width: bannerWidth, height: bannerHeight },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Deals of the week. Tap to view all deals"
      >
        {/* DEALS OF THE WEEK TICKET IMAGE */}
        <Image
          source={require('../../../assets/Deals-of-the-week.png')}
          style={styles.bannerImage}
          resizeMode="contain"
        />

        {/* SHOP NOW BUTTON HOTSPOT OVERLAY */}
        <View
          style={styles.shopNowHotspot}
          pointerEvents="none"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },

  pressableContainer: {
    position: 'relative',
    backgroundColor: 'transparent',
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // Very light subtle shadow at the bottom only
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },

  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },

  /* Non-interactive overlay; taps are handled by the banner Pressable. */
  shopNowHotspot: {
    position: 'absolute',
    left: '12%',
    bottom: '10%',
    width: '35%',
    height: '26%',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },

});