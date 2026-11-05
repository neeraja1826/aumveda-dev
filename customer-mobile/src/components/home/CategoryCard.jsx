import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Helper to match category themes with refined icons (Skin Care, Immunity, Women Care, Wellness, Hair Care)
const getCategoryIcon = (name = '') => {
  const lower = name.toLowerCase();
  if (lower.includes('skin')) return 'leaf-outline';
  if (lower.includes('immunity') || lower.includes('health')) return 'shield-checkmark-outline';
  if (lower.includes('women')) return 'flower-outline';
  if (lower.includes('hair')) return 'water-outline';
  if (lower.includes('well') || lower.includes('tea')) return 'sparkles-outline';
  if (lower.includes('person')) return 'heart-outline';
  return 'leaf-outline';
};

const CategoryCard = ({ category }) => {
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);

  const handlePress = () => {
    const categoryId =
      category?.id ??
      category?.category_id;

    if (!categoryId) {
      return;
    }

    router.push({
      pathname: '/(tabs)/categories',
      params: {
        categoryId: String(categoryId),
        categoryName:
          category?.name ||
          category?.title ||
          '',
      },
    });
  };

  const hasImage = Boolean(category?.image_url) && !imageFailed;
  const categoryName = category?.name || category?.title || 'Category';
  const iconName = getCategoryIcon(categoryName);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={categoryName}
    >
      {/* GOLD-RIMMED CIRCULAR IMAGE STAGE */}
      <View style={styles.imageWrapper}>
        {hasImage ? (
          <Image
            source={{ uri: category.image_url }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.fallbackContainer}>
            <Ionicons name="leaf" size={28} color="#D9A52E" />
          </View>
        )}
      </View>

      {/* REFINED PILL BADGE WITH ICON & NAME (MATCHES REFERENCE MOCKUP) */}
      <View style={styles.pillBadge}>
        <Ionicons
          name={iconName}
          size={11.5}
          color="#8C5915"
          style={styles.pillIcon}
        />
        <Text
          style={styles.categoryName}
          numberOfLines={1}
        >
          {categoryName}
        </Text>
      </View>
    </Pressable>
  );
};

export default CategoryCard;

const styles = StyleSheet.create({
  card: {
    width: 80,
    alignItems: 'center',
    marginRight: 8, // Reduced gap as requested
  },

  cardPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },

  /* GOLD-BORDERED CIRCLE WITH LUXURY SHADOW */
  imageWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#CFA84D',
    backgroundColor: '#FFFDF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },

  image: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },

  fallbackContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#123D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* WHITE PILL BADGE BELOW CIRCLE */
  pillBadge: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE5D7',
    maxWidth: 86,
    shadowColor: '#2C1D08',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },

  pillIcon: {
    marginRight: 1,
  },

  categoryName: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#113B29',
    letterSpacing: 0.1,
  },
});
