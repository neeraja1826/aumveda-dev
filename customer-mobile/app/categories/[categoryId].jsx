import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useEffect, useState } from 'react';

import { getProducts } from '../../src/services/productService';

import { useCart } from '../../src/context/CartContext';

import { useWishlist } from '../../src/context/WishlistContext';
import { colors } from '../../src/theme/colors';


export default function CategoryProductsPage() {

  const router = useRouter();
  const { width } = useWindowDimensions();
  const horizontalPadding = 14;
  const gap = 12;
  const cardWidth =
    (width - horizontalPadding * 2 - gap) / 2;
  const imageHeight = Math.max(
    125,
    Math.min(175, cardWidth * 0.9)
  );

  const {
    categoryId,
    categoryName,
  } = useLocalSearchParams();


  const {
    addToCart,
    cartItems,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();


  const {
    isWishlisted,
    toggleWishlist,
  } = useWishlist();


  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);


  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  useEffect(() => {

    if (!categoryId) {
      return;
    }

    loadProducts();

  }, [categoryId]);


  const loadProducts = async () => {

    try {

      setLoading(true);


      const data =
        await getProducts({
          categoryId: String(categoryId),
          limit: 50,
          offset: 0,
        });


      setProducts(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.log(
        'Category products error:',
        error
      );

      setProducts([]);

    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // IMAGE
  // ============================================================

  const getProductImage = (product) => {

    return (
      product?.image_url ||
      product?.image ||
      product?.thumbnail_url ||
      product?.images?.[0] ||
      null
    );

  };


  // ============================================================
  // CART QUANTITY
  // ============================================================

  const getCartItem = (product) => {

    if (!product?.id) {
      return null;
    }


    return (
      cartItems?.find(
        (item) =>
          String(item?.productId) ===
          String(product.id)
      ) || null
    );

  };


  const getQuantity = (product) => {

    const item =
      getCartItem(product);

    return item?.quantity || 0;

  };


  // ============================================================
  // ADD TO CART
  // ============================================================

  
const handleAddToCart = (product) => {
  if (!product) {
    return;
  }

  addToCart(
    product,
    1,
    product?.variant ?? null
  );
};


  // ============================================================
  // QUANTITY
  // ============================================================

  const handleIncrease = (product) => {

    const item =
      getCartItem(product);

    if (!item) {

      handleAddToCart(product);

      return;

    }


    increaseQuantity(
      item.itemKey
    );

  };


  const handleDecrease = (product) => {

    const item =
      getCartItem(product);

    if (!item) {
      return;
    }


    decreaseQuantity(
      item.itemKey
    );

  };


  // ============================================================
  // OPEN PRODUCT
  // ============================================================

  const handleProductPress = (product) => {

    if (!product?.slug) {
      return;
    }


    router.push(
      `/products/${product.slug}`
    );

  };


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (
      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>

          <ActivityIndicator
            size="large"
            color="#174B35"
          />

          <Text style={styles.loadingText}>
            Loading products...
          </Text>

        </View>
      </SafeAreaView>
    );

  }


  // ============================================================
  // PRODUCT CARD
  // ============================================================

  const renderProduct = ({ item }) => {

    const imageUrl =
      getProductImage(item);


    const quantity =
      getQuantity(item);


    const wished =
      isWishlisted(
        item?.id
      );


    const price =
      item?.price ??
      item?.selling_price ??
      0;


    const mrp =
      item?.mrp ??
      item?.original_price ??
      null;


    return (
      <View
        style={[
          styles.productCard,
          {
            width: cardWidth,
          },
        ]}
      >

        {/* ====================================================
            IMAGE
        ==================================================== */}

        <Pressable
          onPress={() =>
            handleProductPress(item)
          }
        >

          <View
            style={[
              styles.imageContainer,
              {
                height: imageHeight,
              },
            ]}
          >

            {imageUrl ? (

              <Image
                source={{
                  uri: imageUrl,
                }}
                style={styles.productImage}
                resizeMode="contain"
              />

            ) : (

              <View
                style={styles.imagePlaceholder}
              >

                <Text
                  style={styles.placeholderText}
                >
                  AUMVEDA
                </Text>

              </View>

            )}


            {/* WISHLIST */}

            <Pressable
              style={styles.wishlistButton}
              onPress={() =>
                toggleWishlist(item)
              }
              hitSlop={8}
            >

              <Ionicons
                name={
                  wished
                    ? 'heart'
                    : 'heart-outline'
                }
                size={21}
                color={
                  wished
                    ? '#A74B55'
                    : '#174B35'
                }
              />

            </Pressable>

          </View>

        </Pressable>


        {/* ====================================================
            PRODUCT INFO
        ==================================================== */}

        <Pressable
          onPress={() =>
            handleProductPress(item)
          }
        >

          <Text
            style={styles.productName}
            numberOfLines={2}
          >
            {item?.name || 'Product'}
          </Text>


          {/* PRICE */}

          <View style={styles.priceRow}>

            <Text style={styles.price}>
              ₹{price}
            </Text>


            {mrp &&
              Number(mrp) >
                Number(price) && (

                <Text style={styles.mrp}>
                  ₹{mrp}
                </Text>

              )}

          </View>

        </Pressable>


        {/* ====================================================
            CART
        ==================================================== */}

        {quantity > 0 ? (

          <View style={styles.quantityControl}>

            <Pressable
              style={styles.quantityButton}
              onPress={() =>
                handleDecrease(item)
              }
            >

              <Text
                style={styles.quantityButtonText}
              >
                −
              </Text>

            </Pressable>


            <Text style={styles.quantity}>
              {quantity}
            </Text>


            <Pressable
              style={styles.quantityButton}
              onPress={() =>
                handleIncrease(item)
              }
            >

              <Text
                style={styles.quantityButtonText}
              >
                +
              </Text>

            </Pressable>

          </View>

        ) : (

          <Pressable
            style={styles.addButton}
            onPress={() =>
              handleAddToCart(item)
            }
          >

            <Ionicons
              name="bag-add-outline"
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.addButtonText}>
              Add to Cart
            </Text>

          </Pressable>

        )}

      </View>
    );

  };


  // ============================================================
  // EMPTY
  // ============================================================

  if (!products.length) {

    return (
      <SafeAreaView
        style={styles.container}
        edges={['top']}
      >

        <View style={styles.header}>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >

            <Ionicons
              name="arrow-back"
              size={24}
              color="#1F2922"
            />

          </Pressable>


          <Text
            style={styles.headerTitle}
            numberOfLines={1}
          >
            {categoryName || 'Category'}
          </Text>

        </View>


        <View style={styles.emptyContainer}>

          <View style={styles.emptyIcon}>

            <Ionicons
              name="leaf-outline"
              size={36}
              color="#174B35"
            />

          </View>


          <Text style={styles.emptyTitle}>
            No Products Found
          </Text>


          <Text style={styles.emptyText}>
            There are no products available in this category yet.
          </Text>

        </View>

      </SafeAreaView>
    );

  }


  // ============================================================
  // PAGE
  // ============================================================

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top']}
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <View style={styles.header}>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={8}
        >

          <Ionicons
            name="arrow-back"
            size={24}
            color="#1F2922"
          />

        </Pressable>


        <View style={styles.headerText}>

          <Text
            style={styles.headerTitle}
            numberOfLines={1}
          >
            {categoryName || 'Products'}
          </Text>


          <Text style={styles.headerSubtitle}>
            {products.length}{' '}
            {products.length === 1
              ? 'Product'
              : 'Products'}
          </Text>

        </View>

      </View>


      {/* ======================================================
          PRODUCTS
      ====================================================== */}

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item, index) =>
          String(
            item?.id ??
            index
          )
        }
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.productList
        }
        columnWrapperStyle={
          styles.columnWrapper
        }
      />

    </SafeAreaView>
  );
}


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,

    backgroundColor: colors.background,
  },


  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    minHeight: 78,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 18,

    paddingVertical: 12,

    backgroundColor: colors.background,

    borderBottomWidth: 1,

    borderBottomColor: '#E8E1D5',
  },


  backButton: {
    width: 42,

    height: 42,

    borderRadius: 21,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E5DED2',
  },


  headerText: {
    flex: 1,

    marginLeft: 14,
  },


  headerTitle: {
    fontSize: 21,

    fontWeight: '700',

    color: '#1F2922',
  },


  headerSubtitle: {
    marginTop: 3,

    fontSize: 13,

    color: '#737A72',
  },


  // ==========================================================
  // PRODUCT LIST
  // ==========================================================

  productList: {
    paddingHorizontal: 14,

    paddingTop: 16,

    paddingBottom: 35,
  },


  columnWrapper: {
    justifyContent: 'space-between',

    marginBottom: 15,
  },


  // ==========================================================
  // PRODUCT CARD
  // ==========================================================

  productCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 18,

    padding: 9,

    borderWidth: 1,

    borderColor: '#EAE3D8',
  },


  // ==========================================================
  // IMAGE
  // ==========================================================

  imageContainer: {
    width: '100%',

    borderRadius: 14,

    backgroundColor: '#ECF0DE',

    alignItems: 'center',

    justifyContent: 'center',

    overflow: 'hidden',

    position: 'relative',
  },


  productImage: {
    width: '94%',

    height: '94%',
  },


  imagePlaceholder: {
    width: '100%',

    height: '100%',

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#E6E6D5',
  },


  placeholderText: {
    fontSize: 10,

    fontWeight: '700',

    letterSpacing: 1,

    color: '#174B35',
  },


  // ==========================================================
  // WISHLIST
  // ==========================================================

  wishlistButton: {
    position: 'absolute',

    top: 9,

    right: 9,

    width: 36,

    height: 36,

    borderRadius: 18,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E6E0D5',
  },


  // ==========================================================
  // PRODUCT NAME
  // ==========================================================

  productName: {
    marginTop: 11,

    minHeight: 40,

    fontSize: 14,

    lineHeight: 19,

    fontWeight: '600',

    color: '#1F2922',
  },


  // ==========================================================
  // PRICE
  // ==========================================================

  priceRow: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 5,

    gap: 7,
  },


  price: {
    fontSize: 16,

    fontWeight: '800',

    color: '#174B35',
  },


  mrp: {
    fontSize: 12,

    color: '#8A8D87',

    textDecorationLine: 'line-through',
  },


  // ==========================================================
  // ADD TO CART
  // ==========================================================

  addButton: {
    height: 42,

    marginTop: 11,

    borderRadius: 13,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 6,

    backgroundColor: '#174B35',
  },


  addButtonText: {
    fontSize: 13,

    fontWeight: '700',

    color: '#FFFFFF',
  },


  // ==========================================================
  // QUANTITY
  // ==========================================================

  quantityControl: {
    height: 42,

    marginTop: 11,

    borderRadius: 13,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    backgroundColor: '#ECF0DE',

    borderWidth: 1,

    borderColor: '#DCE4CF',
  },


  quantityButton: {
    width: 42,

    height: '100%',

    alignItems: 'center',

    justifyContent: 'center',
  },


  quantityButtonText: {
    fontSize: 22,

    fontWeight: '500',

    color: '#174B35',
  },


  quantity: {
    fontSize: 15,

    fontWeight: '800',

    color: '#1F2922',
  },


  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: colors.background,
  },


  loadingText: {
    marginTop: 10,

    fontSize: 14,

    color: '#737A72',
  },


  // ==========================================================
  // EMPTY
  // ==========================================================

  emptyContainer: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 30,
  },


  emptyIcon: {
    width: 76,

    height: 76,

    borderRadius: 38,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#ECF0DE',

    marginBottom: 18,
  },


  emptyTitle: {
    fontSize: 20,

    fontWeight: '700',

    color: '#1F2922',

    textAlign: 'center',
  },


  emptyText: {
    marginTop: 8,

    fontSize: 14,

    lineHeight: 21,

    color: '#737A72',

    textAlign: 'center',

  },

});