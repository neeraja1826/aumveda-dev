import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  VideoView,
  useVideoPlayer,
} from 'expo-video';

const HeroSection = ({ hero }) => {
  const { width: screenWidth } = useWindowDimensions();

  const [isMuted, setIsMuted] = useState(true);

  /*
   * Keep the hero inside the screen with equal margins.
   * 320px device  -> ~296px hero
   * 360px device  -> ~336px hero
   * 390px device  -> ~366px hero
   * 430px device  -> ~406px hero
   */
  const horizontalMargin = Math.max(
    14,
    Math.min(20, screenWidth * 0.045)
  );

  const heroWidth =
    screenWidth - horizontalMargin * 2;

  /*
   * Responsive hero height.
   *
   * We don't want the hero to become extremely tall
   * on larger phones or too short on smaller phones.
   */
  const heroHeight = Math.max(
    220,
    Math.min(270, heroWidth * 0.64)
  );

  /*
   * Responsive horizontal content padding.
   */
  const contentPadding = Math.max(
    22,
    Math.min(30, heroWidth * 0.075)
  );

  /*
   * Responsive title sizes.
   *
   * The important part:
   * both titles are forced to ONE LINE.
   */
  const titleSize = Math.max(
    27,
    Math.min(35, heroWidth * 0.091)
  );

  const secondTitleSize = Math.max(
    23,
    Math.min(33, heroWidth * 0.082)
  );

  const player = useVideoPlayer(
    hero?.video_url || null,
    (player) => {
      player.loop = true;
      player.muted = true;
      player.play();
    }
  );

  const toggleSound = () => {
    if (!player) return;

    player.muted = !player.muted;
    setIsMuted(player.muted);
  };

  return (
    <View
      style={[
        styles.heroContainer,
        {
          width: heroWidth,
          height: heroHeight,
          marginHorizontal: horizontalMargin,
        },
      ]}
    >
      {/* =========================
          HERO VIDEO
      ========================= */}

      {hero?.video_url ? (
        <VideoView
          player={player}
          style={styles.heroVideo}
          contentFit="cover"
          nativeControls={false}
        />
      ) : null}


      {/* =========================
          OVERLAY
      ========================= */}

      <View style={styles.heroOverlay} />


      {/* =========================
          HERO CONTENT
      ========================= */}

      <View
        style={[
          styles.heroContent,
          {
            left: contentPadding,
            right: contentPadding,
            top: heroHeight * 0.17,
          },
        ]}
      >

        {/* EYEBROW */}

        <Text
          style={[
            styles.eyebrow,
            {
              fontSize: Math.max(
                8,
                Math.min(10, heroWidth * 0.026)
              ),
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {hero?.eyebrow ||
            'ANCIENT WISDOM FOR MODERN WELLNESS'}
        </Text>


        {/* =========================
            FIRST TITLE
        ========================= */}

        <Text
          style={[
            styles.titleLineOne,
            {
              fontSize: titleSize,
              lineHeight: titleSize * 1.03,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {hero?.title_line1 || 'Rooted in Nature'}
        </Text>


        {/* =========================
            SECOND TITLE
        ========================= */}

        <Text
          style={[
            styles.titleLineTwo,
            {
              fontSize: secondTitleSize,
              lineHeight: secondTitleSize * 1.05,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.68}
        >
          {hero?.title_line2 || 'Refined by Ayurveda'}
        </Text>


        {/* =========================
            DESCRIPTION
        ========================= */}

        <Text
          style={[
            styles.description,
            {
              fontSize: Math.max(
                11,
                Math.min(14, heroWidth * 0.036)
              ),
              lineHeight: Math.max(
                16,
                Math.min(20, heroWidth * 0.052)
              ),
              maxWidth: heroWidth * 0.82,
            },
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {hero?.description ||
            'Discover authentic Ayurvedic products for a healthier, more balanced life.'}
        </Text>


        {/* =========================
            EXPLORE BUTTON
        ========================= */}

        <TouchableOpacity
          style={[
            styles.exploreButton,
            {
              marginTop: heroHeight * 0.035,
              height: Math.max(
                35,
                Math.min(40, heroWidth * 0.12)
              ),
              width: Math.max(
                145,
                Math.min(170, heroWidth * 0.43)
              ),
            },
          ]}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.exploreText,
              {
                fontSize: Math.max(
                  13,
                  Math.min(16, heroWidth * 0.041)
                ),
              },
            ]}
          >
            Explore Products
          </Text>

          <Text
            style={[
              styles.arrow,
              {
                fontSize: Math.max(
                  25,
                  Math.min(33, heroWidth * 0.083)
                ),
              },
            ]}
          >
            →
          </Text>
        </TouchableOpacity>

      </View>


      {/* =========================
          SOUND BUTTON
      ========================= */}

      <TouchableOpacity
        style={[
          styles.soundButton,
          {
            right: Math.max(
              13,
              Math.min(18, heroWidth * 0.045)
            ),
            bottom: Math.max(
              14,
              Math.min(20, heroHeight * 0.075)
            ),
          },
        ]}
        onPress={toggleSound}
        activeOpacity={0.7}
      >
        <Ionicons
          name={
            isMuted
              ? 'volume-mute-outline'
              : 'volume-high-outline'
          }
          size={Math.max(
            22,
            Math.min(27, heroWidth * 0.07)
          )}
          color="#FFFFFF"
        />
      </TouchableOpacity>

    </View>
  );
};

export default HeroSection;


const styles = StyleSheet.create({

  /* =========================
     HERO
  ========================= */

  heroContainer: {
    position: 'relative',

    borderWidth: 0,

    borderRadius: 24,

    overflow: 'hidden',

    backgroundColor: '#062F24',

    marginBottom: 34,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.16,

    shadowRadius: 6,

    elevation: 4,
  },


  /* =========================
     VIDEO
  ========================= */

  heroVideo: {
    position: 'absolute',

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    width: '100%',
    height: '100%',
  },


  /* =========================
     OVERLAY
  ========================= */

  heroOverlay: {
    position: 'absolute',

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: 'rgba(3, 25, 18, 0.20)',
  },


  /* =========================
     CONTENT
  ========================= */

  heroContent: {
    position: 'absolute',

    zIndex: 2,
  },


  /* =========================
     EYEBROW
  ========================= */

  eyebrow: {
    color: '#46584D',

    letterSpacing: 2.4,

    marginBottom: 8,

    fontFamily: 'serif',

    fontWeight: '500',

    textTransform: 'uppercase',

    includeFontPadding: false,
  },


  /* =========================
     TITLE 1
  ========================= */

  titleLineOne: {
    color: '#000000',

    fontFamily: 'serif',

    fontWeight: '400',

    letterSpacing: -0.7,

    includeFontPadding: false,

    flexShrink: 1,
  },


  /* =========================
     TITLE 2
  ========================= */

  titleLineTwo: {
    color: '#174B35',

    fontFamily: 'serif',

    fontStyle: 'italic',

    fontWeight: '600',

    letterSpacing: -0.5,

    includeFontPadding: false,

    flexShrink: 1,
  },


  /* =========================
     DESCRIPTION
  ========================= */

  description: {
    marginTop: 10,

    color: '#5F5B50',

    fontFamily: 'serif',

    fontWeight: '400',

    includeFontPadding: false,
  },


  /* =========================
     EXPLORE BUTTON
  ========================= */

  exploreButton: {
    paddingHorizontal: 16,

    borderRadius: 25,

    backgroundColor: '#174B35',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    alignSelf: 'flex-start',
  },


  exploreText: {
    color: '#FFFFFF',

    fontFamily: 'serif',

    fontWeight: '600',

    letterSpacing: 0.1,

    includeFontPadding: false,
  },


  /* =========================
     ARROW
  ========================= */

  arrow: {
    color: '#FFFFFF',

    marginLeft: 7,

    marginTop: -4,

    lineHeight: 25,

    fontFamily: 'serif',
  },


  /* =========================
     SOUND BUTTON
  ========================= */

  soundButton: {
    position: 'absolute',

    width: 38,
    height: 38,

    borderRadius: 19,

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 10,
  },

});