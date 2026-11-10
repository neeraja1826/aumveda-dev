import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

import { getHomeData } from '../../services/homeService';

// Average aspect ratio for the banner series (~2.33)
const BANNER_ASPECT_RATIO = 2.33;

// Slide interval: 3.8 seconds
const AUTO_PLAY_INTERVAL = 3800;

export default function DealsOfTheWeek() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  const scrollRef = useRef(null);
  const currentIndexRef = useRef(0);

  const [activeDot, setActiveDot] = useState(0);
  const [banners, setBanners] = useState([]);

  const isInteractingRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const resetTimerRef = useRef(null);

  const bannerWidth = Math.min(windowWidth - 28, 600);

  const bannerHeight = Math.round(
    bannerWidth / BANNER_ASPECT_RATIO
  );

  /* ============================================================
     LOAD APP PROMOTIONAL BANNERS
     ============================================================ */

  useEffect(() => {
    let mounted = true;

    const loadBanners = async () => {
      try {
        const homeData = await getHomeData();

        if (!mounted) {
          return;
        }

        const apiBanners = Array.isArray(
          homeData?.banners
        )
          ? homeData.banners
          : [];

        // Only use banners that have a valid image URL.
        const validBanners = apiBanners.filter(
          (banner) =>
            banner &&
            typeof banner.image_url === 'string' &&
            banner.image_url.trim().length > 0
        );

        setBanners(validBanners);

        // Reset carousel position when fresh banner
        // data is loaded.
        currentIndexRef.current = 0;
        setActiveDot(0);

        // Make sure the carousel starts from the
        // first slide after API data loads.
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({
            x: 0,
            animated: false,
          });
        });
      } catch (error) {
        console.error(
          'Failed to load app banners:',
          error?.message || error
        );

        if (mounted) {
          setBanners([]);
        }
      }
    };

    loadBanners();

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     SLIDES
     
     Adds one clone at the end so the carousel can move
     continuously from the last banner back to the first.
     ============================================================ */

  const slides =
    banners.length > 0
      ? [
          ...banners,
          {
            ...banners[0],
            id: `${banners[0].id}-clone-end`,
          },
        ]
      : [];

  /* ============================================================
     NEXT SLIDE
     ============================================================ */

  const slideNext = useCallback(() => {
    if (
      isInteractingRef.current ||
      !scrollRef.current ||
      banners.length === 0
    ) {
      return;
    }

    const current = currentIndexRef.current;
    const next = current + 1;

    currentIndexRef.current = next;

    scrollRef.current.scrollTo({
      x: next * windowWidth,
      animated: true,
    });

    // Update active dot immediately.
    setActiveDot(next % banners.length);

    /*
      If we have moved to the trailing clone,
      silently reset the carousel to the first
      real banner after the animation finishes.
    */
    if (next >= slides.length - 1) {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }

      resetTimerRef.current = setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: 0,
          animated: false,
        });

        currentIndexRef.current = 0;
        setActiveDot(0);
      }, 420);
    }
  }, [
    windowWidth,
    banners.length,
    slides.length,
  ]);

  /* ============================================================
     AUTO PLAY
     ============================================================ */

  useEffect(() => {
    if (banners.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      slideNext();
    }, AUTO_PLAY_INTERVAL);

    return () => {
      clearInterval(interval);

      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }

      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, [slideNext, banners.length]);

  /* ============================================================
     USER STARTS DRAGGING
     ============================================================ */

  const handleScrollBeginDrag = () => {
    isInteractingRef.current = true;

    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  /* ============================================================
     USER FINISHES SWIPING
     ============================================================ */

  const handleMomentumScrollEnd = (event) => {
    if (banners.length === 0) {
      return;
    }

    const offsetX =
      event.nativeEvent.contentOffset.x;

    const index = Math.round(
      offsetX / windowWidth
    );

    if (index >= slides.length - 1) {
      // Arrived at trailing clone.

      currentIndexRef.current = 0;

      scrollRef.current?.scrollTo({
        x: 0,
        animated: false,
      });

      setActiveDot(0);
    } else {
      currentIndexRef.current = index;

      setActiveDot(
        index % banners.length
      );
    }

    /*
      Resume auto sliding after 1.5 seconds.
    */
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }

    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 1500);
  };

  /* ============================================================
     PAGINATION DOT PRESS
     ============================================================ */

  const handleDotPress = useCallback(
    (dotIndex) => {
      if (banners.length === 0) {
        return;
      }

      currentIndexRef.current = dotIndex;

      setActiveDot(dotIndex);

      scrollRef.current?.scrollTo({
        x: dotIndex * windowWidth,
        animated: true,
      });

      isInteractingRef.current = true;

      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }

      resumeTimerRef.current = setTimeout(() => {
        isInteractingRef.current = false;
      }, 2500);
    },
    [windowWidth, banners.length]
  );

  /* ============================================================
     OPEN DEALS
     ============================================================ */

  const handleOpenDeals = () => {
    router.push('/deals');
  };

  /* ============================================================
     NO BANNERS
     ============================================================ */

  // Do not render the carousel until the API
  // returns at least one valid banner.
  if (banners.length === 0) {
    return null;
  }

  /* ============================================================
     UI
     ============================================================ */

  return (
    <View style={styles.outerContainer}>
      {/* ======================================================
          SLIDING BANNER CAROUSEL
      ====================================================== */}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {slides.map((item) => (
          <View
            key={item.id}
            style={[
              styles.slideContainer,
              {
                width: windowWidth,
              },
            ]}
          >
            <Pressable
              onPress={handleOpenDeals}
              style={({ pressed }) => [
                styles.card,
                {
                  width: bannerWidth,
                  height: bannerHeight,
                },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                item.alt_text ||
                item.title ||
                'App banner. Tap to view deals'
              }
            >
              <Image
                source={{
                  uri: item.image_url,
                }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* ======================================================
          PAGINATION DOTS
      ====================================================== */}

      <View
        style={styles.paginationRow}
        pointerEvents="box-none"
      >
        {banners.map((banner, index) => {
          const isActive =
            index === activeDot;

          return (
            <Pressable
              key={banner.id}
              onPress={() =>
                handleDotPress(index)
              }
              style={({ pressed }) => [
                styles.dotTouchArea,
                pressed &&
                  styles.dotPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${
                index + 1
              }`}
            >
              <View
                style={[
                  styles.dot,
                  isActive
                    ? styles.dotActive
                    : styles.dotInactive,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ==============================================================
   STYLES
================================================================ */

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },

  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#123D2B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },

  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },

  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 4,
  },

  dotTouchArea: {
    paddingVertical: 6,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dotPressed: {
    opacity: 0.6,
  },

  dot: {
    height: 5,
    borderRadius: 3,
  },

  dotActive: {
    width: 20,
    backgroundColor: '#123D2B',
  },

  dotInactive: {
    width: 6,
    backgroundColor: '#CAD5C8',
  },
});