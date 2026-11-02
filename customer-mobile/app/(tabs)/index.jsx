
import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ProductCard from '../../src/components/home/ProductCard';

import { getProducts } from '../../src/services/productService';

import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_500Medium_Italic,
} from '@expo-google-fonts/playfair-display';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

import {
  getHomeData,
} from '../../src/services/homeService';

import LoadingScreen from '../../src/components/common/LoadingScreen';
import HomeHeader, { getCategoryPastelTheme } from '../../src/components/home/HomeHeader';
import AvailableCoupons from '../../src/components/home/AvailableCoupons';
import DealsOfTheWeek from '../../src/components/home/DealsOfTheWeek';
import ExploreAyurveda from '../../src/components/home/ExploreAyurveda';
import FeaturedProducts from '../../src/components/home/FeaturedProducts';
import WellnessBundles from '../../src/components/home/WellnessBundles';
import BestsellersRail from '../../src/components/home/BestsellersRail';

import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';

export default function HomeScreen() {

  // ============================================================
  // AUTH
  // ============================================================

  const { token } = useAuth();


  // ============================================================
  // FONTS
  // ============================================================

  const [fontsLoaded] = useFonts({
    PlayfairRegular: PlayfairDisplay_400Regular,
    PlayfairMedium: PlayfairDisplay_500Medium,
    PlayfairSemiBold: PlayfairDisplay_600SemiBold,
    PlayfairItalic: PlayfairDisplay_500Medium_Italic,

    InterRegular: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
  });


  // ============================================================
  // HOME DATA
  // ============================================================

  const [data, setData] = useState({
    hero: null,
    categories: [],
    featuredProducts: [],
    bundles: [],
    decorations: [],
  });


  // ============================================================
  // CATEGORY FILTERING
  // ============================================================

  const [selectedCategory, setSelectedCategory] = useState('all');

  const [selectedCategoryName, setSelectedCategoryName] =
    useState('All');

  const [categoryProducts, setCategoryProducts] = useState([]);

  const [loadingCategoryProducts, setLoadingCategoryProducts] =
    useState(false);


  const activeHeaderTheme = useMemo(() => {
    return getCategoryPastelTheme(selectedCategoryName, 0);
  }, [selectedCategoryName]);

  const handleSelectCategory = (category) => {
    const categoryId = category?.id
      ? String(category.id)
      : 'all';

    setSelectedCategory(categoryId);

    setSelectedCategoryName(category?.name || 'All');

    if (categoryId === 'all') {
      setCategoryProducts([]);
      setLoadingCategoryProducts(false);
    } else {
      setLoadingCategoryProducts(true);
    }
  };


  // ============================================================
  // FETCH PRODUCTS FOR SELECTED CATEGORY
  // ============================================================

  useEffect(() => {
    if (selectedCategory === 'all') {
      return;
    }

    let isMounted = true;

    const fetchCategoryProducts = async () => {
      try {
        setLoadingCategoryProducts(true);

        const items = await getProducts({
          categoryId: selectedCategory,
          limit: 100,
        });

        if (!isMounted) return;

        setCategoryProducts(
          Array.isArray(items) ? items : []
        );

      } catch (error) {
        console.error(
          'Error fetching category products:',
          error
        );

        if (isMounted) {
          setCategoryProducts([]);
        }

      } finally {
        if (isMounted) {
          setLoadingCategoryProducts(false);
        }
      }
    };

    fetchCategoryProducts();

    return () => {
      isMounted = false;
    };

  }, [selectedCategory]);
  // ============================================================
  // LOADING
  // ============================================================

  const [loading, setLoading] = useState(true);


  // ============================================================
  // ERROR
  // ============================================================

  const [error, setError] = useState(null);


  // ============================================================
  // LOAD HOME DATA
  // ============================================================

  const loadHome = useCallback(async () => {
    try {
      setError(null);

      console.log('LOADING HOME DATA');

      console.log('HOME AUTH:', {
        loggedIn: Boolean(token),
        hasToken: Boolean(token),
      });

      const response = await getHomeData({
        token,
      });

      console.log(
        'HOME DATA:',
        JSON.stringify(response, null, 2)
      );

      console.log('HOME DATA COUNTS:', {
        categories: response.categories?.length,
        featuredProducts: response.featuredProducts?.length,
        bundles: response.bundles?.length,
        decorations: response.decorations?.length,
        heroAvailable: Boolean(response.hero),
      });

      setData(response);

    } catch (error) {
      console.error('Home API Error:', error);

      setError(
        error?.message || 'Unable to load home.'
      );

    } finally {
      setLoading(false);
    }

  }, [token]);


  // ============================================================
  // REFRESH HOME WHEN SCREEN GETS FOCUS
  // ============================================================

  useFocusEffect(
    useCallback(() => {
      loadHome();
    }, [loadHome])
  );


  // ============================================================
  // FONT LOADING
  // ============================================================

  console.log('HOME RENDER STATUS:', {
    fontsLoaded,
    loading,
    hasToken: Boolean(token),
    categories: data.categories.length,
    featuredProducts: data.featuredProducts.length,
    bundles: data.bundles.length,
    error,
  });


  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={{ padding: 20, color: '#333' }}>
            Loading fonts...
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  // ============================================================
  // INITIAL LOADING
  // ============================================================

  if (loading) {
    return (
      <SafeAreaView
        style={[
        styles.safeArea,
        { backgroundColor: activeHeaderTheme.statusBarColor },
      ]}
        edges={['top', 'bottom']}
      >
        <LoadingScreen />
      </SafeAreaView>
    );
  }


  // ============================================================
  // HOME UI
  // ============================================================

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: activeHeaderTheme.statusBarColor },
      ]}
      edges={['top', 'bottom']}
    >
      <View style={styles.container}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >

          {/* HEADER */}

          <HomeHeader
            categories={data.categories}
            selectedCategoryId={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />


          {/* ERROR */}

          {error ? (
            <View style={styles.error}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}


          {/* CATEGORY VIEW */}

          {selectedCategory !== 'all' ? (

            <View style={styles.categoryViewContainer}>

              {loadingCategoryProducts ? (

                <View style={styles.categoryLoadingWrap}>
                  <ActivityIndicator
                    size="large"
                    color="#123D2B"
                  />

                  <Text style={styles.categoryLoadingText}>
                    Loading {selectedCategoryName} products...
                  </Text>
                </View>

              ) : categoryProducts.length > 0 ? (

                <View style={styles.categoryGrid}>
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onPress={() => {
                        if (product?.slug) {
                          router.push(
                            `/products/${product.slug}`
                          );
                        }
                      }}
                    />
                  ))}
                </View>

              ) : (

                <View style={styles.categoryEmptyWrap}>
                  <Ionicons
                    name="leaf-outline"
                    size={42}
                    color="#716F68"
                  />

                  <Text style={styles.categoryEmptyTitle}>
                    No products found
                  </Text>

                  <Text style={styles.categoryEmptySub}>
                    We are currently restocking Ayurvedic{' '}
                    {selectedCategoryName} essentials.
                  </Text>

                  <Pressable
                    style={styles.categoryBackHomeBtn}
                    onPress={() =>
                      handleSelectCategory({
                        id: 'all',
                        name: 'All',
                      })
                    }
                  >
                    <Text style={styles.categoryBackHomeText}>
                      View All Products
                    </Text>
                  </Pressable>
                </View>

              )}

            </View>

          ) : (

            /* NORMAL HOME CONTENT */

            <>

              {/* DEALS OF THE WEEK */}

              <DealsOfTheWeek />


              {/* EXPLORE AYURVEDA */}

              <ExploreAyurveda
                categories={data.categories}
              />


              {/* BESTSELLERS */}

              <BestsellersRail
                products={data.featuredProducts}
              />


              


              {/* FEATURED PRODUCTS */}

              <FeaturedProducts
                products={data.featuredProducts}
                categories={data.categories}
                selectedFilter={selectedCategory}
                onFilterChange={setSelectedCategory}
              />


              {/* AVAILABLE COUPONS */}

              <AvailableCoupons />


              {/* WELLNESS BUNDLES */}

              <WellnessBundles
                bundles={data.bundles}
              />

            </>
          )}

        </ScrollView>

      </View>
    </SafeAreaView>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#EAF5EB',
  },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scroll: {
    paddingBottom: 20,
  },

  error: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F7E5E1',
  },

  errorText: {
    textAlign: 'center',
    color: '#914D43',
    fontSize: 12,
  },

  categoryViewContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  categoryLoadingWrap: {
    paddingVertical: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryLoadingText: {
    marginTop: 12,
    fontFamily: 'InterMedium',
    fontSize: 13,
    color: '#716F68',
  },

  categoryEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },

  categoryEmptyTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 18,
    color: '#123D2B',
    marginTop: 12,
    marginBottom: 4,
  },

  categoryEmptySub: {
    fontFamily: 'InterRegular',
    fontSize: 12.5,
    color: '#716F68',
    textAlign: 'center',
    marginBottom: 16,
  },

  categoryBackHomeBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: '#123D2B',
  },

  categoryBackHomeText: {
    fontFamily: 'InterSemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },

});
