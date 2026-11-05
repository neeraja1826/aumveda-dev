import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import CategoryCard from './CategoryCard';

const CARD_STEP = 88; // 80 card width + 8 marginRight (reduced gaps)

export default function ExploreAyurveda({
  categories = [],
}) {
  const scrollRef = useRef(null);
  const router = useRouter();
  const [animation] = useState(() => new Animated.Value(0));
  const autoScrollLoopRef = useRef(null);
  const isDragging = useRef(false);

  const count = categories.length;
  const loopWidth = count * CARD_STEP;

  // --------------------------------------------------
  // START AUTO SCROLL (Smooth continuous linear motion)
  // --------------------------------------------------
  const startAutoScroll = useCallback(() => {
    if (isDragging.current || count === 0) {
      return;
    }

    if (autoScrollLoopRef.current) {
      autoScrollLoopRef.current.stop();
    }

    autoScrollLoopRef.current = Animated.loop(
      Animated.timing(animation, {
        toValue: loopWidth,
        duration: count * 3600,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
      {
        resetBeforeIteration: true,
      }
    );

    autoScrollLoopRef.current.start();
  }, [animation, count, loopWidth]);

  // --------------------------------------------------
  // STOP AUTO SCROLL
  // --------------------------------------------------
  const stopAutoScroll = useCallback(() => {
    if (autoScrollLoopRef.current) {
      autoScrollLoopRef.current.stop();
      autoScrollLoopRef.current = null;
    }
  }, []);

  // --------------------------------------------------
  // SYNC ANIMATION WITH SCROLLVIEW
  // --------------------------------------------------
  useEffect(() => {
    if (count === 0) return;

    animation.setValue(0);

    const listenerId = animation.addListener(({ value }) => {
      if (!isDragging.current) {
        scrollRef.current?.scrollTo({
          x: value,
          animated: false,
        });
      }
    });

    startAutoScroll();

    return () => {
      stopAutoScroll();
      animation.removeListener(listenerId);
    };
  }, [animation, count, loopWidth, startAutoScroll, stopAutoScroll]);

  // --------------------------------------------------
  // MANUAL DRAG START
  // --------------------------------------------------
  const handleScrollBeginDrag = () => {
    isDragging.current = true;
    stopAutoScroll();
  };

  // --------------------------------------------------
  // MANUAL DRAG END
  // --------------------------------------------------
  const handleScrollEndDrag = () => {
    isDragging.current = false;
    setTimeout(() => {
      if (!isDragging.current) {
        startAutoScroll();
      }
    }, 800);
  };

  // --------------------------------------------------
  // MANUAL MOMENTUM END
  // --------------------------------------------------
  const handleMomentumScrollEnd = (event) => {
    const currentX = event.nativeEvent.contentOffset.x;

    if (currentX >= loopWidth) {
      const resetX = currentX - loopWidth;
      animation.setValue(resetX);
      scrollRef.current?.scrollTo({
        x: resetX,
        animated: false,
      });
    }

    isDragging.current = false;

    setTimeout(() => {
      if (!isDragging.current) {
        startAutoScroll();
      }
    }, 800);
  };

  // Early return after all hooks are declared
  if (count === 0) {
    return null;
  }

  // Duplicate categories for seamless looping
  const loopCategories = [
    ...categories,
    ...categories,
  ];

  return (
    <View style={styles.outerContainer}>
      <LinearGradient
        colors={['#FAF5EA', '#F6EFE2', '#F1E6D3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.gradientSurface}
      >
        {/* TOP-RIGHT BOTANICAL LEAF ACCENT (MATCHES REFERENCE MOCKUP) */}
        <View style={styles.topRightLeaves} pointerEvents="none">
          <Ionicons
            name="leaf-outline"
            size={48}
            color="rgba(70, 105, 70, 0.22)"
            style={{ transform: [{ rotate: '35deg' }] }}
          />
          <Ionicons
            name="leaf-outline"
            size={36}
            color="rgba(85, 125, 85, 0.18)"
            style={{
              transform: [{ rotate: '70deg' }, { translateX: -8 }, { translateY: -12 }],
            }}
          />
        </View>

        {/* BOTTOM-RIGHT DEEP GREEN ORNAMENTAL WAVE WITH GOLD TRIM */}
        <View style={styles.bottomRightSwoop} pointerEvents="none" />

        {/* SECTION HEADER */}
        <View style={styles.headerContainer}>
          {/* Eyebrow Label: Gold-bordered Pill */}
          <View style={styles.eyebrowBadge}>
            <Ionicons name="sparkles" size={8} color="#C59A45" />
            <Text style={styles.eyebrowText}>HANDPICKED COLLECTIONS</Text>
          </View>

          {/* Title with Gold Underline & Green View All Pill */}
          <View style={styles.headingRow}>
            <View style={styles.titleColumn}>
              <Text style={styles.title}>
                Explore <Text style={styles.titleGold}>Wellness</Text>
              </Text>
              {/* Signature Gold Underline Accent below 'Explore' */}
              <View style={styles.goldUnderline} />
            </View>

            {/* FOREST GREEN PILL WITH GOLD BORDER */}
            <Pressable
              style={({ pressed }) => [
                styles.viewAllButton,
                pressed && styles.viewAllPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/categories',
                  params: {
                    categoryId: 'all',
                    categoryName: 'All Products',
                  },
                })
              }
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="View all categories"
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* CONTINUOUS SMOOTH AUTO-SCROLL CAROUSEL WITH REDUCED GAPS */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          scrollEnabled={true}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          scrollEventThrottle={16}
        >
          {loopCategories.map((category, index) => (
            <CategoryCard
              key={`${category.id ?? index}-${index}`}
              category={category}
            />
          ))}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    marginTop: 10,
    marginBottom: 14,
  },

  /* LUXURY SILK & GOLD GRADIENT SURFACE */
  gradientSurface: {
    width: '100%',
    paddingTop: 16,
    paddingBottom: 16,
    borderWidth: 1.2,
    borderColor: '#F1F1F1',
    shadowColor: '#CFC7BB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },

  /* TOP-RIGHT BOTANICAL LEAF ACCENT */
  topRightLeaves: {
    position: 'absolute',
    top: -4,
    right: 16,
    flexDirection: 'row',
    zIndex: 0,
  },

  /* BOTTOM-RIGHT DEEP GREEN ORNAMENTAL WAVE WITH GOLD TRIM */
  bottomRightSwoop: {
    position: 'absolute',
    right: -45,
    bottom: -60,
    width: 250,
    height: 96,
    borderRadius: 70,
    backgroundColor: '#113B29',
    borderTopWidth: 2,
    borderColor: '#C59128',
    transform: [{ rotate: '-18deg' }],
    zIndex: 0,
  },

  /* SECTION HEADER */
  headerContainer: {
    paddingHorizontal: 14,
    marginBottom: 14,
    zIndex: 1,
  },

  /* EYEBROW PILL BADGE */
  eyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(197, 154, 69, 0.10)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C59A45',
    alignSelf: 'flex-start',
    marginBottom: 2,
    marginTop: -8,
  },

  eyebrowText: {
    fontSize: 7,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#7C5318',
    letterSpacing: 1.3,
  },

  headingRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  titleColumn: {
    alignItems: 'flex-start',
  },

  title: {
    fontSize: 27,
    lineHeight: 33,
    fontFamily: 'PlayfairSemiBold',
    fontWeight: '700',
    color: '#113B29',
    letterSpacing: 0.1,
  },

  titleGold: {
    color: '#C58F1D',
  },

  /* SIGNATURE GOLD UNDERLINE BELOW 'Explore' */
  goldUnderline: {
    width: 44,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#C58F1D',
    marginTop: 4,
  },

  /* DEEP FOREST GREEN VIEW ALL PILL WITH GOLD BORDER */
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: '#113B29',
    borderWidth: 1.5,
    borderColor: '#FFB005',
    gap: 5,
    shadowColor: '#113B29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    marginTop: -32,
  },

  viewAllPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },

  viewAllText: {
    fontSize: 12,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* HORIZONTAL AUTO-SCROLL CAROUSEL WITH REDUCED GAPS */
  scroll: {
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 2,
    zIndex: 1,
  },
});
