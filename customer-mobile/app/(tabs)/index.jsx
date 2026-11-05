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
import { Image } from 'expo-image';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ProductCard from '../../src/components/home/ProductCard';
import RecentlyViewed from '../../src/components/home/RecentlyViewed';
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
import { getBuyAgainProducts } from '../../src/services/orderService';

import LoadingScreen from '../../src/components/common/LoadingScreen';
import HomeHeader, { getCategoryPastelTheme } from '../../src/components/home/HomeHeader';
import DealsOfTheWeek from '../../src/components/home/DealsOfTheWeek';
import ExploreAyurveda from '../../src/components/home/ExploreAyurveda';
import FeaturedProducts from '../../src/components/home/FeaturedProducts';
import WellnessBundles from '../../src/components/home/WellnessBundles';
import BestsellersRail from '../../src/components/home/BestsellersRail';
import CouponsOffers from '../../src/components/home/CouponsOffers';
import CategoryCampaigns from '../../src/components/home/CategoryCampaigns';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/context/AuthContext';
import JustArrived from '../../src/components/home/JustArrived';

const PRODUCTS_PAGE_SIZE = 100;

const CATEGORY_BANNERS = {
  'skin care': {
    image: require('../../assets/skin-care.png'),
    accessibilityLabel: 'Nourish your skin naturally with Ayurvedic skin care essentials',
  },
  'hair care': {
    image: require('../../assets/Hair-care.png'),
    accessibilityLabel: 'Stronger, healthier and shinier hair with Ayurvedic hair care',
  },
  'health care': {
    image: require('../../assets/Immunity.png'),
    accessibilityLabel: 'Boost your immunity naturally with Ayurvedic formulations',
  },
  immunity: {
    image: require('../../assets/Immunity.png'),
    accessibilityLabel: 'Boost your immunity naturally with Ayurvedic formulations',
  },
  'women care': {
    image: require('../../assets/Women-care.png'),
    accessibilityLabel: 'Complete women care the Ayurvedic way',
  },
  'personal care': {
    image: require('../../assets/Personal-care.png'),
    accessibilityLabel: 'Ayurvedic personal care for your everyday essentials',
  },
  wellness: {
    image: require('../../assets/Wellness.png'),
    accessibilityLabel: 'Your daily wellness companion',
  },
  'wellness teas': {
    image: require('../../assets/Wellness.png'),
    accessibilityLabel: 'Your daily wellness companion',
  },
};

export default function HomeScreen() {

  // ============================================================
  // AUTH
  // ============================================================

  const {
    token,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();


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
  // BUY AGAIN
  // ============================================================

  const [buyAgainProducts, setBuyAgainProducts] = useState([]);
  const [buyAgainLoading, setBuyAgainLoading] = useState(false);


  // ============================================================
  // CATEGORY FILTERING
  // ============================================================

  const [selectedCategory, setSelectedCategory] = useState('all');

  const [selectedCategoryName, setSelectedCategoryName] =
    useState('All');

  const [categoryProducts, setCategoryProducts] = useState([]);

  const [loadingCategoryProducts, setLoadingCategoryProducts] =
    useState(false);

  const [allProducts, setAllProducts] = useState([]);
  const [loadingAllProducts, setLoadingAllProducts] = useState(false);
  const [allProductsError, setAllProductsError] = useState(null);


  const activeHeaderTheme = useMemo(() => {
    return getCategoryPastelTheme(selectedCategoryName, 0);
  }, [selectedCategoryName]);

  const selectedCategoryBanner =
    CATEGORY_BANNERS[selectedCategoryName.trim().toLowerCase()];

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


      console.log('HOME AUTH:', {
        loggedIn: Boolean(token),
        hasToken: Boolean(token),
      });

      const response = await getHomeData({
        token,
      });

      console.log(
  'JUST ARRIVED PRODUCTS:',
  response.newArrivals
);

   

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
  // LOAD BUY AGAIN PRODUCTS
  // ============================================================

  const loadBuyAgain = useCallback(async () => {
    if (!token) {
      setBuyAgainProducts([]);
      setBuyAgainLoading(false);
      return;
    }

    try {
      setBuyAgainLoading(true);

      const products = await getBuyAgainProducts(token);

      setBuyAgainProducts(
        Array.isArray(products) ? products : []
      );

    } catch (error) {
      console.error('Buy Again API Error:', error);
      setBuyAgainProducts([]);
    } finally {
      setBuyAgainLoading(false);
    }
  }, [token]);

  const loadAllProducts = useCallback(async () => {
    try {
      setLoadingAllProducts(true);
      setAllProductsError(null);

      const products = [];
      let offset = 0;
      let page;

      do {
        page = await getProducts({
          limit: PRODUCTS_PAGE_SIZE,
          offset,
        });
        products.push(...page);
        offset += page.length;
      } while (page.length === PRODUCTS_PAGE_SIZE);

      setAllProducts(products);
    } catch (error) {
      console.error('All Products API Error:', error);
      setAllProducts([]);
      setAllProductsError(error?.message || 'Unable to load products.');
    } finally {
      setLoadingAllProducts(false);
    }
  }, []);


  // ============================================================
  // REFRESH HOME WHEN SCREEN GETS FOCUS
  // ============================================================

  useFocusEffect(
    useCallback(() => {
      loadHome();
      loadBuyAgain();
      loadAllProducts();
    }, [loadHome, loadBuyAgain, loadAllProducts])
  );


  // ============================================================
  // FONT LOADING
  // ============================================================

  

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

              {selectedCategoryBanner ? (
                <View style={styles.categoryBannerWrap}>
                  <Image
                    source={selectedCategoryBanner.image}
                    style={styles.categoryBanner}
                    contentFit="cover"
                    transition={200}
                    accessibilityLabel={selectedCategoryBanner.accessibilityLabel}
                  />
                </View>
              ) : null}

              {loadingCategoryProducts ? (

                <View style={styles.categoryLoadingWrap}>
                  <ActivityIndicator
                    size="large"
                    color={activeHeaderTheme.accent}
                  />

                  <Text style={[styles.categoryLoadingText, { color: activeHeaderTheme.accent }]}>
                    Loading {selectedCategoryName} products...
                  </Text>
                </View>

              ) : categoryProducts.length > 0 ? (

                <View style={styles.categoryGrid}>
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      theme={activeHeaderTheme}
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
                    color={activeHeaderTheme.accent}
                  />

                  <Text style={[styles.categoryEmptyTitle, { color: activeHeaderTheme.accent }]}>
                    No products found
                  </Text>

                  <Text style={styles.categoryEmptySub}>
                    We are currently restocking Ayurvedic{' '}
                    {selectedCategoryName} essentials.
                  </Text>

                  <Pressable
                    style={[styles.categoryBackHomeBtn, { backgroundColor: activeHeaderTheme.accent }]}
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
              {!authLoading && isAuthenticated && (
                <RecentlyViewed products={data.featuredProducts || []} />
              )}



 {/* AVAILABLE COUPONS (CHIPS) */}
              <CouponsOffers coupons={data.coupons || []} />


              {/* FEATURED PRODUCTS */}



         <JustArrived products={data.newArrivals || []} />

              <CategoryCampaigns
                campaigns={data.categoryCampaigns || []}
                onPressCampaign={(campaign) => {
                  const category = Array.isArray(campaign.categories)
                    ? campaign.categories[0]
                    : campaign.categories;
                  const categoryId =
                    category?.id ?? campaign.category_id;

                  if (!categoryId) return;

                  router.navigate({
                    pathname: '/(tabs)/categories',
                    params: {
                      categoryId: String(categoryId),
                      categoryName:
                        category?.name || campaign.title || 'Products',
                    },
                  });
                }}
              />

              <View style={styles.allProductsSection}>
                <View style={styles.allProductsDivider}>
                  <Text style={styles.allProductsHeading}> </Text>
                </View>

                {loadingAllProducts ? (
                  <ActivityIndicator
                    style={styles.allProductsLoading}
                    color={activeHeaderTheme.accent}
                  />
                ) : allProductsError ? (
                  <Text style={styles.allProductsError}>
                    {allProductsError}
                  </Text>
                ) : allProducts.length > 0 ? (
                  <View style={styles.allProductsGrid}>
                    {allProducts.map((product) => (
                      <ProductCard
                        key={product.id || product.slug}
                        product={product}
                        onPress={() => {
                          if (product?.slug) {
                            router.push(`/products/${product.slug}`);
                          }
                        }}
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.allProductsEmpty}>
                    No products available.
                  </Text>
                )}
              </View>

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
    backgroundColor: '#CEA04B',
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

  categoryBannerWrap: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FCE9E8',
  },

  categoryBanner: {
    width: '100%',
    aspectRatio: 3,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  allProductsSection: {
    marginBottom: 8,
  },

  allProductsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 18,
  },

  allProductsDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D8D2C7',
  },

  allProductsHeading: {
    fontFamily: 'InterSemiBold',
    fontSize: 12,
    letterSpacing: 1.2,
    color: '#123D2B',
  },

  allProductsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  allProductsLoading: {
    marginVertical: 28,
  },

  allProductsError: {
    marginHorizontal: 16,
    marginVertical: 20,
    textAlign: 'center',
    color: '#914D43',
    fontSize: 12,
  },

  allProductsEmpty: {
    marginHorizontal: 16,
    marginVertical: 20,
    textAlign: 'center',
    color: '#716F68',
    fontSize: 12,
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
