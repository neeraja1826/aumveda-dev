import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function WellnessBundles({
  bundles = [],
}) {
  const router = useRouter();

  // ============================================================
  // NO BUNDLES
  // ============================================================
  if (!bundles.length) {
    return null;
  }

  return (
    <View style={styles.section}>
      {/* SECTION HEADER - CENTERED LIKE NEW ARRIVALS */}
      <View style={styles.header}>
        {/* CENTER BOTANICAL MOTIF */}
        <View style={styles.motifRow}>
          <MaterialCommunityIcons
            name="leaf"
            size={14}
            color="#8C4E3A"
            style={styles.motifLeftLeaf}
          />
          <MaterialCommunityIcons
            name="leaf"
            size={14}
            color="#8C4E3A"
            style={styles.motifRightLeaf}
          />
        </View>

        {/* EYEBROW */}
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowLine} />
          <Text style={styles.eyebrowText}>CURATED RITUALS</Text>
          <View style={styles.eyebrowLine} />
        </View>

        {/* MAIN TITLE */}
        <Text style={styles.title}>Wellness Bundles</Text>
      </View>

      {/* =======================================================
          BUNDLES CAROUSEL
      ======================================================= */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {bundles.map((bundle) => (
          <BundleCard
            key={bundle.id}
            bundle={bundle}
            onPress={() => {
              if (bundle?.slug) {
                router.push(`/bundles/${bundle.slug}`);
              }
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================================
// BUNDLE CARD
// ============================================================

function BundleCard({
  bundle,
  onPress,
}) {
  const items = bundle.products || [];
  const imageUrl =
    bundle.image_url ||
    bundle.image ||
    bundle.imageUrl;

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
    >
      {/* IMAGE */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons
              name="leaf-outline"
              size={36}
              color="#123D2B"
            />
          </View>
        )}

        {/* DISCOUNT */}
        {bundle.discount_percentage != null && (
          <View style={styles.discount}>
            <Text style={styles.discountText}>
              Save {bundle.discount_percentage}%
            </Text>
          </View>
        )}
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <Text
          style={styles.name}
          numberOfLines={1}
        >
          {bundle.name}
        </Text>

        {bundle.description ? (
          <Text
            style={styles.description}
            numberOfLines={2}
          >
            {bundle.description}
          </Text>
        ) : null}

        {items.length > 0 && (
          <Text
            style={styles.products}
            numberOfLines={2}
          >
            {items
              .map((item) => item?.name)
              .filter(Boolean)
              .join(' + ')}
          </Text>
        )}

        <View style={styles.bottomRow}>
          <Text style={styles.explore}>
            Explore Ritual
          </Text>
          <Ionicons
            name="arrow-forward"
            size={15}
            color="#381F12"
          />
        </View>
      </View>
    </Pressable>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  /* HEADER - CENTERED LIKE NEW ARRIVALS */
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  motifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginBottom: 2,
  },

  motifLeftLeaf: {
    transform: [{ rotate: '-25deg' }],
  },

  motifRightLeaf: {
    transform: [{ rotate: '25deg' }, { scaleX: -1 }],
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },

  eyebrowLine: {
    width: 22,
    height: 1.2,
    backgroundColor: '#8C4E3A',
  },

  eyebrowText: {
    fontFamily: 'InterSemiBold',
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: '#8C4E3A',
    fontWeight: '700',
  },

  title: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 24,
    color: '#123D2B',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
  },

  scroll: {
    paddingHorizontal: 16,
    gap: 14,
  },

  card: {
    width: 285,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DFD3',
    elevation: 3,
  },

  imageContainer: {
    height: 165,
    backgroundColor: '#F5F1E8',
    position: 'relative',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  placeholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F1E8',
  },

  discount: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#D9A52E',
  },

  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  content: {
    padding: 16,
  },

  name: {
    fontSize: 19,
    fontWeight: '600',
    color: '#123D2B',
  },

  description: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 17,
    color: '#716F68',
  },

  products: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: '#123D2B',
    fontWeight: '600',
  },

  bottomRow: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  explore: {
    fontSize: 11,
    fontWeight: '700',
    color: '#123D2B',
  },
});