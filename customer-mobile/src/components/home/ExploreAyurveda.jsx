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
import { useRouter } from 'expo-router';
import CategoryCard from './CategoryCard';

const CARD_STEP = 96; // 84 card width + 12 marginRight

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
        duration: count * 3800,
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
    <View style={styles.container}>
      {/* SECTION HEADER */}
      <View style={styles.headerContainer}>
        {/* Eyebrow Label */}
        <View style={styles.eyebrowRow}>
          <Ionicons name="sparkles" size={11} color="#D9A52E" />
          <Text style={styles.eyebrowText}>HANDPICKED COLLECTIONS</Text>
        </View>

        {/* Heading & View All Button Row */}
        <View style={styles.headingRow}>
          <Text style={styles.title}>
            Explore <Text style={styles.titleGold}>AUMVEDA</Text>
          </Text>

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
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={11} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
      </View>

      {/* CONTINUOUS SMOOTH AUTO-SCROLL CAROUSEL */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 18,
    marginBottom: 14,
    position: 'relative',
  },

  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },

  eyebrowText: {
    fontSize: 10.5,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#D9A52E',
    letterSpacing: 1.2,
  },

  headingRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'PlayfairSemiBold',
    fontWeight: '700',
    color: '#123D2B',
    letterSpacing: 0.2,
  },

  titleGold: {
    color: '#D9A52E',
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DFD3',
    gap: 6,
  },

  viewAllPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },

  viewAllText: {
    fontSize: 12,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#123D2B',
    letterSpacing: 0.2,
  },

  arrowCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#123D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingLeft: 20,
    paddingRight: 8,
    paddingVertical: 4,
  },
});