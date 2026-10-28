import React from 'react';

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';

export default function ShopByConcern({
  concerns = [],
  onViewAll,
  onPress,
}) {
  if (!concerns.length) {
    return null;
  }

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Shop by Concern
        </Text>

        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAll}>
            View all →
          </Text>
        </TouchableOpacity>
      </View>

      {/* CARDS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {concerns.map((concern) => (
          <TouchableOpacity
            key={concern.id}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => onPress?.(concern)}
          >

            {/* IMAGE */}
            <View style={styles.imageContainer}>
              {concern.image_url ? (
                <Image
                  source={{
                    uri: concern.image_url,
                  }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>
                    Image
                  </Text>
                </View>
              )}
            </View>

            {/* CONTENT */}
            <View style={styles.content}>

              <Text
                style={styles.cardTitle}
                numberOfLines={1}
              >
                {concern.title}
              </Text>

              <Text
                style={styles.description}
                numberOfLines={2}
              >
                {concern.description}
              </Text>

              <View style={styles.arrowButton}>
                <Text style={styles.arrow}>
                  →
                </Text>
              </View>

            </View>

          </TouchableOpacity>
        ))}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginHorizontal: 16,

    backgroundColor: '#EDF2DC',

    borderRadius: 22,

    paddingTop: 18,
    paddingBottom: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 16,

    marginBottom: 14,
  },

  title: {
    fontSize: 25,
    fontWeight: '600',
    color: colors.text,
  },

  viewAll: {
    fontSize: 14,
    color: colors.text,
  },

  scroll: {
    paddingLeft: 14,
    paddingRight: 8,
  },

  card: {
    width: 145,

    backgroundColor: '#FFFFFF',

    borderRadius: 14,

    overflow: 'hidden',

    marginRight: 10,

    borderWidth: 1,
    borderColor: '#E3E5D8',
  },

  imageContainer: {
    width: '100%',
    height: 92,

    backgroundColor: '#E9E9DE',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  placeholder: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#E6E8D8',
  },

  placeholderText: {
    color: '#9A9C8B',
    fontSize: 12,
  },

  content: {
    minHeight: 92,

    padding: 10,

    position: 'relative',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,

    marginBottom: 4,

    paddingRight: 20,
  },

  description: {
    fontSize: 12,
    lineHeight: 16,

    color: colors.textSecondary,

    paddingRight: 18,
  },

  arrowButton: {
    position: 'absolute',

    right: 8,
    bottom: 9,

    width: 28,
    height: 28,

    borderRadius: 14,

    borderWidth: 1,
    borderColor: '#D8D8CC',

    alignItems: 'center',
    justifyContent: 'center',
  },

  arrow: {
    fontSize: 17,
    color: colors.text,
  },
});