import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

// Theme configuration for typography & buttons matching reference mockup:
// Card 0: Dark Plum Text & White Button (Nature Picks)
// Card 1: Espresso Text & Dark Espresso Button (Skin Care Naturally)
// Card 2: White Text & White Button (Hair Care Ritual)
const CAMPAIGN_THEMES = [
  // 0: Nature Picks
  {
    titleColor: '#281436',
    subColor: '#533C64',
    btnBg: '#FFFFFF',
    btnText: '#281436',
    borderColor: '#DED3F0',
    btnShadow: true,
  },
  // 1: Skin Care Naturally
  {
    titleColor: '#2C1B12',
    subColor: '#5A4134',
    btnBg: '#2E1B12',
    btnText: '#FFFFFF',
    borderColor: '#ECDEC8',
    btnShadow: false,
  },
  // 2: Hair Care Ritual (Full Width)
  {
    titleColor: '#FFFFFF',
    subColor: '#E2EBE5',
    btnBg: '#FFFFFF',
    btnText: '#123D2B',
    borderColor: '#193B27',
    btnShadow: true,
  },
];

const DEFAULT_SUBTITLES = [
  'Natural Ayurveda inspired by nature.',
  'Natural Ayurvedic care inspired by nature.',
  'Natural Ayurvedic care inspired by nature.',
];

export default function CategoryCampaigns({
  campaigns = [],
  onPressCampaign,
}) {
  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {campaigns.map((campaign, index) => {
          const category = Array.isArray(campaign.categories)
            ? campaign.categories[0]
            : campaign.categories;

          const title =
            campaign.title ||
            category?.name ||
            'Ayurvedic Care';

          const subtitle =
            campaign.subtitle ||
            campaign.description ||
            campaign.tagline ||
            DEFAULT_SUBTITLES[index % DEFAULT_SUBTITLES.length];

          // 2/1 Grid Pattern: 0 & 1 are half-width, 2 is full-width
          const isFullWidth = index % 3 === 2;
          const theme = CAMPAIGN_THEMES[index % CAMPAIGN_THEMES.length];

          // Support both string URLs and local asset numbers
          const rawImage =
            campaign.image_url ||
            campaign.image ||
            campaign.banner ||
            campaign.banner_url ||
            campaign.thumbnail;

          const imageSource =
            typeof rawImage === 'string' ? { uri: rawImage } : rawImage;

          return (
            <Pressable
              key={campaign.id || `${title}-${index}`}
              style={({ pressed }) => [
                styles.card,
                isFullWidth ? styles.fullWidthCard : styles.halfWidthCard,
                {
                  borderColor: theme.borderColor,
                },
                pressed && styles.cardPressed,
              ]}
              onPress={() => onPressCampaign?.(campaign)}
              accessibilityRole="button"
              accessibilityLabel={`${title}, ${subtitle}`}
            >
              {/* IMAGE FILLS ENTIRE CARD WITH EXPLICIT WIDTH & HEIGHT (NEVER BLANK OR REMOVED) */}
              {imageSource ? (
                <Image
                  source={imageSource}
                  style={styles.bannerImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={150}
                />
              ) : null}

              {/* TEXT CONTENT & SHOP NOW BUTTON OVERLAY */}
              <View
                style={[
                  styles.contentWrap,
                  isFullWidth
                    ? styles.contentWrapFull
                    : styles.contentWrapHalf,
                ]}
              >
                <View style={styles.textGroup}>
                  <Text
                    style={[
                      styles.title,
                      isFullWidth ? styles.titleFull : styles.titleHalf,
                      { color: theme.titleColor },
                    ]}
                    numberOfLines={2}
                  >
                    {title}
                  </Text>

                  <Text
                    style={[
                      styles.subtitle,
                      isFullWidth
                        ? styles.subtitleFull
                        : styles.subtitleHalf,
                      { color: theme.subColor },
                    ]}
                    numberOfLines={2}
                  >
                    {subtitle}
                  </Text>
                </View>

                {/* SHOP NOW PILL BUTTON */}
                <View
                  style={[
                    styles.shopBtn,
                    isFullWidth ? styles.shopBtnFull : styles.shopBtnHalf,
                    { backgroundColor: theme.btnBg },
                    theme.btnShadow && styles.btnWithShadow,
                  ]}
                >
                  <Text
                    style={[
                      styles.shopBtnText,
                      isFullWidth
                        ? styles.shopBtnTextFull
                        : styles.shopBtnTextHalf,
                      { color: theme.btnText },
                    ]}
                  >
                    Shop Now
                  </Text>
                  <Ionicons
                    name="arrow-up"
                    size={isFullWidth ? 11 : 10}
                    color={theme.btnText}
                    style={styles.arrowIcon}
                  />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 12,
  },

  /* 2/1 GRID: 2 SIDE-BY-SIDE ON TOP, 1 FULL-WIDTH BELOW */
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  /* BASE CARD WITH VISIBLE SHADOW & BORDER (NO SOLID COLOR) */
  card: {
    borderRadius: 18,
    borderWidth: 1.2,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FAF7F2',
    shadowColor: '#1A1815',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  halfWidthCard: {
    width: '48.2%',
    height: 168,
  },

  fullWidthCard: {
    width: '100%',
    height: 148,
  },

  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.94,
  },

  /* FULL-CARD IMAGE WITH EXPLICIT DIMENSIONS (CRITICAL FOR RENDERING) */
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',},

  /* TEXT OVERLAY & ACTION ON LEFT */
  contentWrap: {
    height: '100%',
    justifyContent: 'space-between',
    zIndex: 2,
  },

  contentWrapFull: {
    width: '58%',
    paddingLeft: 18,
    paddingRight: 6,
    paddingTop: 16,
    paddingBottom: 16,
  },

  contentWrapHalf: {
    width: '78%',
    paddingLeft: 13,
    paddingRight: 4,
    paddingTop: 14,
    paddingBottom: 13,
  },

  textGroup: {
    gap: 3,
  },

  title: {
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  titleFull: {
    fontSize: 22,
    lineHeight: 26,
  },

  titleHalf: {
    fontSize: 18,
    lineHeight: 22,
  },

  subtitle: {
    fontFamily: 'InterRegular',
    letterSpacing: -0.1,
  },

  subtitleFull: {
    fontSize: 11.5,
    lineHeight: 15.5,
    maxWidth: 185,
  },

  subtitleHalf: {
    fontSize: 10,
    lineHeight: 13.5,
    maxWidth: 130,
  },

  /* SHOP NOW PILL BUTTON */
  shopBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    borderRadius: 20,
  },

  btnWithShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  shopBtnFull: {
    paddingHorizontal: 13,
    paddingVertical: 6,
  },

  shopBtnHalf: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  shopBtnText: {
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  shopBtnTextFull: {
    fontSize: 11.5,
  },

  shopBtnTextHalf: {
    fontSize: 10,
  },

  arrowIcon: {
    transform: [{ rotate: '45deg' }],
    marginTop: -0.5,
  },
});
