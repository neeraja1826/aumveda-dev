import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '../../src/services/api';
import { colors } from '../../src/theme/colors';


export default function CategoriesPage() {

  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);


  // ============================================================
  // LOAD CATEGORIES
  // ============================================================

  useEffect(() => {
    loadCategories();
  }, []);


  const loadCategories = async () => {

    try {

      setLoading(true);

      const response =
        await apiRequest('/home/categories');

      const data =
        response?.data ?? [];

      setCategories(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.log(
        'Categories page error:',
        error
      );

      setCategories([]);

    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // IMAGE
  // ============================================================

  const getCategoryImage = (category) => {

    return (
      category?.image_url ||
      category?.image ||
      category?.thumbnail_url ||
      category?.icon_url ||
      null
    );

  };


  // ============================================================
  // CATEGORY NAME
  // ============================================================

  const getCategoryName = (category) => {

    return (
      category?.name ||
      category?.category_name ||
      category?.title ||
      'Category'
    );

  };


  // ============================================================
  // OPEN CATEGORY
  // ============================================================

  const handleCategoryPress = (category) => {

    const categoryId =
      category?.id ??
      category?.category_id;

    if (!categoryId) {

      console.log(
        'Category ID missing:',
        category
      );

      return;

    }


    router.push({
      pathname: '/categories/[categoryId]',
      params: {
        categoryId: String(categoryId),
        categoryName: getCategoryName(category),
      },
    });

  };


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (
      <SafeAreaView
        style={styles.loadingContainer}
        edges={['top', 'bottom']}
      >

        <ActivityIndicator
          size="large"
          color="#174B35"
        />

        <Text style={styles.loadingText}>
          Loading categories...
        </Text>

      </SafeAreaView>
    );

  }


  // ============================================================
  // EMPTY
  // ============================================================

  if (!categories.length) {

    return (
      <SafeAreaView
        style={styles.container}
        edges={['top', 'bottom']}
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


          <Text style={styles.headerTitle}>
            Categories
          </Text>

          <View style={styles.headerSpacer} />

        </View>


        <View style={styles.emptyContainer}>

          <View style={styles.emptyIcon}>

            <Ionicons
              name="grid-outline"
              size={34}
              color="#174B35"
            />

          </View>


          <Text style={styles.emptyTitle}>
            No Categories Available
          </Text>


          <Text style={styles.emptyText}>
            Categories will appear here once they are available.
          </Text>

        </View>

      </SafeAreaView>
    );

  }


  // ============================================================
  // CATEGORY CARD
  // ============================================================

  const renderCategory = ({ item }) => {

    const imageUrl =
      getCategoryImage(item);

    const categoryName =
      getCategoryName(item);


    return (
      <Pressable
        style={styles.categoryCard}
        onPress={() =>
          handleCategoryPress(item)
        }
      >

        {/* IMAGE */}

        <View style={styles.imageContainer}>

          {imageUrl ? (

            <Image
              source={{
                uri: imageUrl,
              }}
              style={styles.categoryImage}
              resizeMode="cover"
            />

          ) : (

            <View style={styles.imagePlaceholder}>

              <Ionicons
                name="leaf-outline"
                size={38}
                color="#174B35"
              />

            </View>

          )}

        </View>


        {/* NAME */}

        <View style={styles.categoryInfo}>

          <Text
            style={styles.categoryName}
            numberOfLines={2}
          >
            {categoryName}
          </Text>


          <View style={styles.arrowCircle}>

            <Ionicons
              name="arrow-forward"
              size={16}
              color="#FFFFFF"
            />

          </View>

        </View>

      </Pressable>
    );

  };


  // ============================================================
  // PAGE
  // ============================================================

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'bottom']}
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

          <Text style={styles.headerTitle}>
            Explore AUMVEDA
          </Text>

          <Text style={styles.headerSubtitle}>
            Discover wellness by category
          </Text>

        </View>


        <View style={styles.headerSpacer} />

      </View>


      {/* ======================================================
          CATEGORIES
      ====================================================== */}

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item, index) =>
          String(
            item?.id ??
            item?.category_id ??
            index
          )
        }
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.columnWrapper}
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
    minHeight: 82,

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
    fontSize: 22,

    fontWeight: '700',

    color: '#1F2922',
  },


  headerSubtitle: {
    marginTop: 3,

    fontSize: 13,

    color: '#737A72',
  },


  headerSpacer: {
    width: 42,
  },


  // ==========================================================
  // LIST
  // ==========================================================

  list: {
    paddingHorizontal: 14,

    paddingTop: 18,

    paddingBottom: 35,
  },


  columnWrapper: {
    justifyContent: 'space-between',

    marginBottom: 16,
  },


  // ==========================================================
  // CATEGORY CARD
  // ==========================================================

  categoryCard: {
    width: '48.3%',

    backgroundColor: '#FFFFFF',

    borderRadius: 20,

    overflow: 'hidden',

    borderWidth: 1,

    borderColor: '#E9E2D7',
    height: 62, // Image height + Info height
  },


  // ==========================================================
  // IMAGE
  // ==========================================================

  imageContainer: {
    width: '100%',

    height: 165,

    backgroundColor: '#ECF0DE',

    alignItems: 'center',

    justifyContent: 'center',

    overflow: 'hidden',
  },


  categoryImage: {
    width: '100%',

    height: '100%',
  },


  imagePlaceholder: {
    flex: 1,

    width: '100%',

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#ECF0DE',
  },


  // ==========================================================
  // CATEGORY INFO
  // ==========================================================

  categoryInfo: {
    minHeight: 62,

    paddingHorizontal: 12,

    paddingVertical: 10,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },


  categoryName: {
    flex: 1,
    fontSize: 30,

    lineHeight: 20,

    fontWeight: '700',

    color: '#1F2922',
  },


  arrowCircle: {
    width: 32,

    height: 32,

    borderRadius: 16,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#174B35',
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