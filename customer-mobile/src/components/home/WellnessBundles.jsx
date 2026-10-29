import React from 'react';

import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

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

      {/* =======================================================
          HEADING
      ======================================================= */}

      <Text style={styles.eyebrow}>
        WELLNESS BUNDLES
      </Text>


      <View style={styles.headingRow}>

        <Text style={styles.title}>
          Curated wellness
        </Text>

        <Text style={styles.italicTitle}>
          rituals.
        </Text>

      </View>


      {/* =======================================================
          BUNDLES
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

                router.push(
                  `/bundles/${bundle.slug}`
                );

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

  // Your API directly returns products[]
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

      {/* =====================================================
          IMAGE
      ===================================================== */}

      <View style={styles.imageContainer}>

        {imageUrl ? (

          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
            onLoad={() => {
              console.log(
                'BUNDLE IMAGE LOADED:',
                bundle.name
              );
            }}
            onError={(error) => {
              console.log(
                'BUNDLE IMAGE ERROR:',
                bundle.name,
                imageUrl,
                error.nativeEvent
              );
            }}
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


        {/* =================================================
            DISCOUNT
        ================================================= */}

        {bundle.discount_percentage != null && (

          <View style={styles.discount}>

            <Text style={styles.discountText}>
              Save {bundle.discount_percentage}%
            </Text>

          </View>

        )}

      </View>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <View style={styles.content}>

        {/* =================================================
            NAME
        ================================================= */}

        <Text
          style={styles.name}
          numberOfLines={1}
        >
          {bundle.name}
        </Text>


        {/* =================================================
            DESCRIPTION
        ================================================= */}

        {bundle.description ? (

          <Text
            style={styles.description}
            numberOfLines={2}
          >
            {bundle.description}
          </Text>

        ) : null}


        {/* =================================================
            PRODUCTS
        ================================================= */}

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


        {/* =================================================
            ACTION
        ================================================= */}

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

  // ==========================================================
  // SECTION
  // ==========================================================

  section: {
    marginTop: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: '#F5F1E8',
  },

  // ==========================================================
  // EYEBROW
  // ==========================================================

  eyebrow: {
    marginHorizontal: 24,
    fontSize: 9,
    letterSpacing: 1.8,
    color: '#D9A52E',
    fontWeight: '700',
  },

  // ==========================================================
  // HEADING
  // ==========================================================

  headingRow: {
    marginHorizontal: 24,
    marginTop: 5,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  title: {
    fontSize: 25,
    fontWeight: '600',
    color: '#123D2B',
  },

  italicTitle: {
    marginLeft: 6,
    fontSize: 25,
    color: '#123D2B',
    fontFamily: 'PlayfairItalic',
  },

  // ==========================================================
  // SCROLL
  // ==========================================================

  scroll: {
    paddingHorizontal: 24,
    gap: 14,
  },

  // ==========================================================
  // CARD
  // ==========================================================

  card: {
    width: 285,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DFD3',
    elevation: 3,
  },

  // ==========================================================
  // IMAGE
  // ==========================================================

  imageContainer: {
    height: 165,
    backgroundColor: '#F5F1E8',
    position: 'relative',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  // ==========================================================
  // IMAGE PLACEHOLDER
  // ==========================================================

  placeholder: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F1E8',
  },

  // ==========================================================
  // DISCOUNT
  // ==========================================================

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

  // ==========================================================
  // CONTENT
  // ==========================================================

  content: {
    padding: 16,
  },

  // ==========================================================
  // NAME
  // ==========================================================

  name: {
    fontSize: 19,
    fontWeight: '600',
    color: '#123D2B',
  },

  // ==========================================================
  // DESCRIPTION
  // ==========================================================

  description: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 17,
    color: '#716F68',
  },

  // ==========================================================
  // PRODUCTS
  // ==========================================================

  products: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: '#123D2B',
    fontWeight: '600',
  },

  // ==========================================================
  // BOTTOM ACTION
  // ==========================================================

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