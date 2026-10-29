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

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={category?.name || category?.title || 'Category'}
    >
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

      <Text
        style={styles.categoryName}
        numberOfLines={2}
      >
        {category?.name ||
          category?.title ||
          'Category'}
      </Text>
    </Pressable>
  );
};

export default CategoryCard;

const styles = StyleSheet.create({
  card: {
    width: 84,
    alignItems: 'center',
    marginRight: 12,
  },

  cardPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.88,
  },

  imageWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#D9A52E',
    backgroundColor: '#FAF7F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 4,
  },

  image: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },

  fallbackContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#123D2B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryName: {
    marginTop: 8,
    width: 82,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'InterMedium',
    fontWeight: '600',
    color: '#123D2B',
    letterSpacing: 0.1,
  },
});