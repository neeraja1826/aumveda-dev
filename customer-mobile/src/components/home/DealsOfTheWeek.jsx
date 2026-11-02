import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

// Average aspect ratio for the banner series (~2.33)
const BANNER_ASPECT_RATIO = 2.33;
// Slide interval: 3.8 seconds
const AUTO_PLAY_INTERVAL = 3800;

const BANNERS = [
  {
    id: 'deals-of-the-week',
    source: require('../../../assets/Deals-of-the-week.png'),
    title: 'Deals of the Week',
    accessibilityLabel: 'Deals of the week. Tap to view all deals',
  },
  {
    id: 'diwali-offer',
    source: require('../../../assets/diwali-offer.png'),
    title: 'Diwali Special Offers',
    accessibilityLabel: 'Diwali special offers on Ayurvedic essentials. Tap to view deals',
  },
  {
    id: 'first-order-discount',
    source: require('../../../assets/first-order-discount.png'),
    title: 'First Order Discount',
    accessibilityLabel: 'Get extra 10 percent off on your first order. Tap to view deals',
  },
  {
    id: 'free-gift',
    source: require('../../../assets/free-gift.png'),
    title: 'Free Gift on Orders',
    accessibilityLabel: 'Free gift on select orders. Tap to view deals',
  },
];

// Slides list with trailing clone: [Banner 0, Banner 1, Banner 2, Banner 3, Banner 0 Clone]
// Starts naturally at Slide 0. All 4 original banners are guaranteed to be fully visible in sequence.
// Forward slide from Banner 3 into Banner 0 Clone enables continuous right-sliding with zero leftward rewind.
const SLIDES = [
  ...BANNERS,
  {
    ...BANNERS[0],
    id: `${BANNERS[0].id}-clone-end`,
  },
];

export default function DealsOfTheWeek() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  const scrollRef = useRef(null);
  const currentIndexRef = useRef(0);
  const [activeDot, setActiveDot] = useState(0);

  const isInteractingRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const resetTimerRef = useRef(null);

  const bannerWidth = Math.min(windowWidth - 28, 600);
  const bannerHeight = Math.round(bannerWidth / BANNER_ASPECT_RATIO);

  const handleOpenDeals = () => {
    router.push('/deals');
  };

  // Continuous forward slide to the right
  const slideNext = useCallback(() => {
    if (isInteractingRef.current || !scrollRef.current) {
      return;
    }

    const current = currentIndexRef.current;
    const next = current + 1;
    currentIndexRef.current = next;

    scrollRef.current.scrollTo({
      x: next * windowWidth,
      animated: true,
    });

    // Update active dot immediately (0, 1, 2, 3)
    setActiveDot(next % BANNERS.length);

    // If we just slid into the trailing clone (index 4),
    // wait for the smooth forward slide animation to complete (~400ms),
    // then silently reset back to index 0 without any animation.
    if (next >= SLIDES.length - 1) {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      resetTimerRef.current = setTimeout(() => {
        scrollRef.current?.scrollTo({
          x: 0,
          animated: false,
        });
        currentIndexRef.current = 0;
      }, 420);
    }
  }, [windowWidth]);

  // Auto-play interval
  useEffect(() => {
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
  }, [slideNext]);

  // Pause auto-sliding while user is dragging manually
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

  const handleMomentumScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / windowWidth);

    if (index >= SLIDES.length - 1) {
      // Arrived at trailing clone: seamlessly snap to index 0
      currentIndexRef.current = 0;
      scrollRef.current?.scrollTo({
        x: 0,
        animated: false,
      });
      setActiveDot(0);
    } else {
      currentIndexRef.current = index;
      setActiveDot(index % BANNERS.length);
    }

    // Resume auto-sliding after 1.5s
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 1500);
  };

  // User taps a pagination dot
  const handleDotPress = useCallback(
    (dotIndex) => {
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
    [windowWidth]
  );

  return (
    <View style={styles.outerContainer}>
      {/* SLIDING BANNER CAROUSEL (FORWARD-ONLY INFINITE LOOP) */}
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
        {SLIDES.map((item) => (
          <View
            key={item.id}
            style={[styles.slideContainer, { width: windowWidth }]}
          >
            <Pressable
              onPress={handleOpenDeals}
              style={({ pressed }) => [
                styles.card,
                { width: bannerWidth, height: bannerHeight },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={item.accessibilityLabel}
            >
              <Image
                source={item.source}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* PAGINATION DOTS */}
      <View style={styles.paginationRow} pointerEvents="box-none">
        {BANNERS.map((banner, index) => {
          const isActive = index === activeDot;
          return (
            <Pressable
              key={banner.id}
              onPress={() => handleDotPress(index)}
              style={({ pressed }) => [
                styles.dotTouchArea,
                pressed && styles.dotPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Go to slide ${index + 1}`}
            >
              <View
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

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
    shadowOffset: { width: 0, height: 2 },
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
