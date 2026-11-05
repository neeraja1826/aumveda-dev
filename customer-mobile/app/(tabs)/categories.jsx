
import React, { useEffect, useState, useMemo } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { getProducts } from '../../src/services/productService';
import { getCategories } from '../../src/services/categoryService';
import HomeHeader, { getCategoryPastelTheme } from '../../src/components/home/HomeHeader';
import ProductCard from '../../src/components/home/ProductCard';
import { colors } from '../../src/theme/colors';

export default function CategoriesScreen() {
  const router = useRouter();

  const {
    categoryId: routeCategoryId,
    categoryName: routeCategoryName,
  } = useLocalSearchParams();

  const paramCategoryId = Array.isArray(routeCategoryId)
    ? routeCategoryId[0]
    : routeCategoryId;

  const paramCategoryName = Array.isArray(routeCategoryName)
    ? routeCategoryName[0]
    : routeCategoryName;

  const initialCategoryId =
    paramCategoryId && paramCategoryId !== 'all'
      ? String(paramCategoryId)
      : '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedCategoryId, setSelectedCategoryId] =
    useState(initialCategoryId);

  const [selectedCategoryName, setSelectedCategoryName] =
    useState(paramCategoryName || 'All Products');

  const activeTheme = useMemo(
    () => getCategoryPastelTheme(selectedCategoryName, 0),
    [selectedCategoryName]
  );

  const [selectedSubcategoryId, setSelectedSubcategoryId] =
    useState('');

  const [selectedSubcategoryName, setSelectedSubcategoryName] =
    useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('category');

  const [draftCategoryId, setDraftCategoryId] = useState(initialCategoryId);
  const [draftSubcategoryId, setDraftSubcategoryId] = useState('');
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftMinRating, setDraftMinRating] = useState(0);
  const [draftInStockOnly, setDraftInStockOnly] = useState(false);
  const [draftSortBy, setDraftSortBy] = useState('relevance');

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');

  // Sync the selected filter when navigation supplies a category.
  const [prevParamCategoryId, setPrevParamCategoryId] =
    useState(paramCategoryId);
  if (prevParamCategoryId !== paramCategoryId) {
    setPrevParamCategoryId(paramCategoryId);
    const nextId =
      paramCategoryId && paramCategoryId !== 'all'
        ? String(paramCategoryId)
        : '';
    setSelectedCategoryId(nextId);
    setSelectedCategoryName(
      nextId ? paramCategoryName || 'Products' : 'All Products'
    );
    setSelectedSubcategoryId('');
    setSelectedSubcategoryName('');
    setDraftCategoryId(nextId);
    setDraftSubcategoryId('');
  }

  // Load categories for the filter row.
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();

        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.log('Categories loading error:', err);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  // Load all products, or products from the selected category.
  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        setError('');

        const data = await getProducts({
          categoryId: selectedCategoryId || undefined,
          subcategoryId: selectedSubcategoryId || undefined,
          limit: 50,
          offset: 0,
        });

        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.log('Products loading error:', err);

        if (!cancelled) {
          setProducts([]);
          setError('Unable to load products. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId, selectedSubcategoryId]);

  const getCategoryId = (category) =>
    category?.id ?? category?.category_id;

  const getCategoryName = (category) =>
    category?.name ??
    category?.category_name ??
    category?.title ??
    'Category';

  const selectCategory = (category) => {
    const id = getCategoryId(category);
    const nextId = id == null || String(id) === 'all' ? '' : String(id);

    setSelectedCategoryId(nextId);
    setSelectedCategoryName(
      nextId ? getCategoryName(category) : 'All Products'
    );
    setSelectedSubcategoryId('');
    setSelectedSubcategoryName('');
  };

  const selectedParentCategory = categories.find(
    (category) =>
      String(getCategoryId(category)) === String(selectedCategoryId)
  );
  const subcategories = (selectedParentCategory?.subcategories || [])
    .filter((category) => getCategoryId(category) != null)
    .slice(0, 5);

  const filteredProducts = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesSearch =
          !term ||
          [
            product.name,
            product.slug,
            product.description,
            product.short_description,
          ].some((value) =>
            String(value ?? '').toLowerCase().includes(term)
          );
        const price = Number(product.price || 0);

        return (
          matchesSearch &&
          (minPrice === '' || price >= Number(minPrice)) &&
          (maxPrice === '' || price <= Number(maxPrice)) &&
          (minRating === 0 ||
            Number(product.rating || 0) >= minRating) &&
          (!inStockOnly || product.in_stock)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') {
          return Number(a.price || 0) - Number(b.price || 0);
        }

        if (sortBy === 'price_high') {
          return Number(b.price || 0) - Number(a.price || 0);
        }

        return 0;
      });
  }, [
    inStockOnly,
    maxPrice,
    minPrice,
    minRating,
    products,
    searchQuery,
    sortBy,
  ]);

  const openFilters = (tab = 'category') => {
    setDraftCategoryId(selectedCategoryId);
    setDraftSubcategoryId(selectedSubcategoryId);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDraftMinRating(minRating);
    setDraftInStockOnly(inStockOnly);
    setDraftSortBy(sortBy);
    setActiveFilterTab(tab);
    setShowFilters(true);
  };

  const applyFilters = () => {
    const parent = categories.find(
      (category) =>
        String(getCategoryId(category)) === String(draftCategoryId)
    );
    const subcategory = parent?.subcategories?.find(
      (category) =>
        String(getCategoryId(category)) === String(draftSubcategoryId)
    );

    setSelectedCategoryId(draftCategoryId);
    setSelectedCategoryName(
      parent ? getCategoryName(parent) : 'All Products'
    );
    setSelectedSubcategoryId(draftSubcategoryId);
    setSelectedSubcategoryName(
      subcategory ? getCategoryName(subcategory) : ''
    );
    setMinPrice(draftMinPrice);
    setMaxPrice(draftMaxPrice);
    setMinRating(draftMinRating);
    setInStockOnly(draftInStockOnly);
    setSortBy(draftSortBy);
    setShowFilters(false);
  };

  const clearDraftFilters = () => {
    setDraftCategoryId('');
    setDraftSubcategoryId('');
    setDraftMinPrice('');
    setDraftMaxPrice('');
    setDraftMinRating(0);
    setDraftInStockOnly(false);
    setDraftSortBy('relevance');
  };

  const renderListHeader = () => (
    <>
      <View style={styles.resultsHeader}>
        <View style={styles.resultsLeft}>
          <Ionicons name="leaf" size={13} color="#C89B48" />
          <Text style={styles.resultsTitle}>
            {selectedSubcategoryName || selectedCategoryName || 'All Products'}
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {loadingProducts
              ? 'Loading...'
              : `${filteredProducts.length} Products`}
          </Text>
        </View>
      </View>
    </>
  );

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onPress={() => {
        if (item?.slug) {
          router.push(`/products/${item.slug}`);
        }
      }}
    />
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        selectedCategoryId && {
          backgroundColor: activeTheme.statusBarColor,
        },
      ]}
      edges={['top']}
    >
      <HomeHeader
        categories={categories}
        selectedCategoryId={selectedCategoryId || 'all'}
        onSelectCategory={selectCategory}
      />

      <View style={styles.topControls}>

        {selectedCategoryId && subcategories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subcategoryFilters}
          >
            <Pressable
              style={[
                styles.subcategoryChip,
                !selectedSubcategoryId && styles.subcategoryChipSelected,
              ]}
              onPress={() => {
                setSelectedSubcategoryId('');
                setSelectedSubcategoryName('');
              }}
            >
              <Text
                style={[
                  styles.subcategoryChipText,
                  !selectedSubcategoryId &&
                    styles.subcategoryChipTextSelected,
                ]}
              >
                All
              </Text>
            </Pressable>

            {subcategories.map((subcategory) => {
              const id = String(getCategoryId(subcategory));
              const isSelected = selectedSubcategoryId === id;

              return (
                <Pressable
                  key={id}
                  style={[
                    styles.subcategoryChip,
                    isSelected && styles.subcategoryChipSelected,
                  ]}
                  onPress={() => {
                    setSelectedSubcategoryId(id);
                    setSelectedSubcategoryName(getCategoryName(subcategory));
                  }}
                >
                  <Text
                    style={[
                      styles.subcategoryChipText,
                      isSelected && styles.subcategoryChipTextSelected,
                    ]}
                  >
                    {getCategoryName(subcategory)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      <FlatList
        key="products-grid"
        data={filteredProducts}
        ListHeaderComponent={renderListHeader}
        renderItem={renderProduct}
        keyExtractor={(item, index) =>
          String(item?.id ?? item?.slug ?? index)
        }
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          loadingProducts ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />
              <Text style={styles.stateText}>
                Loading products...
              </Text>
            </View>
          ) : (
            <View style={styles.stateContainer}>
              <Ionicons
                name={error ? 'alert-circle-outline' : 'leaf-outline'}
                size={38}
                color={colors.primary}
              />

              <Text style={styles.emptyTitle}>
                {error ? 'Something went wrong' : 'No products found'}
              </Text>

              <Text style={styles.stateText}>
                {error ||
                  (searchQuery.trim()
                    ? 'Try another search or adjust your filters.'
                    : 'There are no products available in this category yet.')}
              </Text>

              {error ? (
                <Pressable
                  style={styles.retryButton}
                  onPress={() => {
                    setSelectedCategoryId((current) => current);
                    setError('');
                    setLoadingProducts(true);
                    // Trigger a fresh load by changing the filter.
                    setSelectedCategoryId((current) => current);
                  }}
                >
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
      />

      <View style={styles.bottomFilterBar}>
        <Pressable
          style={styles.bottomFilterButton}
          onPress={() => openFilters('category')}
        >
          <Ionicons name="options-outline" size={18} color="#26352D" />
          <Text style={styles.bottomFilterButtonText}>FILTER</Text>
        </Pressable>

        <View style={styles.bottomBarDivider} />

        <Pressable
          style={styles.bottomFilterButton}
          onPress={() => openFilters('sort')}
        >
          <Ionicons
            name="swap-vertical-outline"
            size={18}
            color="#26352D"
          />
          <Text style={styles.bottomFilterButtonText}>SORT BY</Text>
        </Pressable>
      </View>

      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close filters"
            style={styles.modalBackdrop}
            onPress={() => setShowFilters(false)}
          />

          <View style={styles.filterModal}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Filters &amp; Sorting</Text>
              <Pressable onPress={clearDraftFilters} hitSlop={8}>
                <Text style={styles.clearFiltersText}>CLEAR ALL</Text>
              </Pressable>
            </View>

            <View style={styles.modalDivider} />

            <View style={styles.filterContent}>
              <View style={styles.filterSidebar}>
                {[
                  { label: 'Category', value: 'category', icon: 'apps-outline' },
                  { label: 'Price', value: 'price', icon: 'cash-outline' },
                  { label: 'Rating', value: 'rating', icon: 'star-outline' },
                  { label: 'Stock', value: 'availability', icon: 'cube-outline' },
                  { label: 'Sort By', value: 'sort', icon: 'swap-vertical-outline' },
                ].map((tab) => (
                  <Pressable
                    key={tab.value}
                    style={[
                      styles.filterTab,
                      activeFilterTab === tab.value && styles.activeFilterTab,
                    ]}
                    onPress={() => setActiveFilterTab(tab.value)}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={15}
                      color={
                        activeFilterTab === tab.value
                          ? '#123D2B'
                          : '#77776E'
                      }
                    />
                    <Text
                      style={[
                        styles.filterTabText,
                        activeFilterTab === tab.value &&
                          styles.activeFilterTabText,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <ScrollView
                style={styles.filterOptions}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {activeFilterTab === 'category' && (
                  <View>
                    <Text style={styles.filterSectionTitle}>Main Category</Text>

                    <Pressable
                      style={styles.filterChoice}
                      onPress={() => {
                        setDraftCategoryId('');
                        setDraftSubcategoryId('');
                      }}
                    >
                      <Text style={styles.filterChoiceText}>All Products</Text>
                      <Ionicons
                        name={
                          !draftCategoryId
                            ? 'radio-button-on'
                            : 'radio-button-off'
                        }
                        size={19}
                        color="#123D2B"
                      />
                    </Pressable>

                    {categories.map((category) => {
                      const categoryId = getCategoryId(category);
                      if (categoryId == null) return null;

                      const categoryIdString = String(categoryId);
                      const isSelected =
                        draftCategoryId === categoryIdString;
                      const categorySubcategories = (
                        category?.subcategories || []
                      ).filter((subcategory) => getCategoryId(subcategory) != null);

                      return (
                        <View key={categoryIdString}>
                          <Pressable
                            style={styles.filterChoice}
                            onPress={() => {
                              setDraftCategoryId(categoryIdString);
                              setDraftSubcategoryId('');
                            }}
                          >
                            <Text style={styles.filterChoiceText}>
                              {getCategoryName(category)}
                            </Text>
                            <Ionicons
                              name={
                                isSelected
                                  ? 'radio-button-on'
                                  : 'radio-button-off'
                              }
                              size={19}
                              color="#123D2B"
                            />
                          </Pressable>
                          {isSelected && categorySubcategories.map((subcategory) => {
                            const subcategoryId = String(getCategoryId(subcategory));
                            const isSubcategorySelected =
                              draftSubcategoryId === subcategoryId;

                            return (
                              <Pressable
                                key={subcategoryId}
                                style={[
                                  styles.filterChoice,
                                  styles.subcategoryChoice,
                                ]}
                                onPress={() =>
                                  setDraftSubcategoryId(subcategoryId)
                                }
                              >
                                <Text style={styles.filterChoiceText}>
                                  {getCategoryName(subcategory)}
                                </Text>
                                <Ionicons
                                  name={
                                    isSubcategorySelected
                                      ? 'radio-button-on'
                                      : 'radio-button-off'
                                  }
                                  size={19}
                                  color="#123D2B"
                                />
                              </Pressable>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                )}

                {activeFilterTab === 'price' && (
                  <View>
                    <Text style={styles.filterSectionTitle}>Price Range</Text>
                    <Text style={styles.filterHelperText}>
                      Enter your preferred budget
                    </Text>

                    <View style={styles.priceInputRow}>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Min ₹"
                        placeholderTextColor="#99958A"
                        keyboardType="numeric"
                        value={draftMinPrice}
                        onChangeText={setDraftMinPrice}
                      />
                      <Text style={styles.priceSeparator}>to</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Max ₹"
                        placeholderTextColor="#99958A"
                        keyboardType="numeric"
                        value={draftMaxPrice}
                        onChangeText={setDraftMaxPrice}
                      />
                    </View>

                    {[
                      { label: 'Under ₹500', min: '', max: '500' },
                      { label: '₹500 – ₹1,000', min: '500', max: '1000' },
                      { label: '₹1,000 – ₹2,000', min: '1000', max: '2000' },
                      { label: 'Above ₹2,000', min: '2000', max: '' },
                    ].map((range) => (
                      <Pressable
                        key={range.label}
                        style={styles.filterChoice}
                        onPress={() => {
                          setDraftMinPrice(range.min);
                          setDraftMaxPrice(range.max);
                        }}
                      >
                        <Text style={styles.filterChoiceText}>
                          {range.label}
                        </Text>
                        <Ionicons
                          name={
                            draftMinPrice === range.min &&
                            draftMaxPrice === range.max
                              ? 'radio-button-on'
                              : 'radio-button-off'
                          }
                          size={19}
                          color="#355641"
                        />
                      </Pressable>
                    ))}
                  </View>
                )}

                {activeFilterTab === 'rating' && (
                  <View>
                    <Text style={styles.filterSectionTitle}>
                      Customer Rating
                    </Text>
                    <Text style={styles.filterHelperText}>
                      Show products with this rating or higher
                    </Text>
                    {[4, 3, 2, 0].map((rating) => (
                      <Pressable
                        key={rating}
                        style={styles.filterChoice}
                        onPress={() => setDraftMinRating(rating)}
                      >
                        <Text style={styles.filterChoiceText}>
                          {rating === 0 ? 'All Ratings' : `${rating}★ & above`}
                        </Text>
                        <Ionicons
                          name={
                            draftMinRating === rating
                              ? 'radio-button-on'
                              : 'radio-button-off'
                          }
                          size={19}
                          color="#355641"
                        />
                      </Pressable>
                    ))}
                  </View>
                )}

                {activeFilterTab === 'availability' && (
                  <View>
                    <Text style={styles.filterSectionTitle}>Availability</Text>
                    <Pressable
                      style={styles.filterChoice}
                      onPress={() =>
                        setDraftInStockOnly((previous) => !previous)
                      }
                    >
                      <Text style={styles.filterChoiceText}>
                        In Stock Only
                      </Text>
                      <Ionicons
                        name={
                          draftInStockOnly ? 'checkbox' : 'square-outline'
                        }
                        size={21}
                        color="#355641"
                      />
                    </Pressable>
                  </View>
                )}

                {activeFilterTab === 'sort' && (
                  <View>
                    <Text style={styles.filterSectionTitle}>
                      Sort Products By
                    </Text>
                    {[
                      { label: 'Recommended', value: 'relevance' },
                      { label: 'Price: Low to High', value: 'price_low' },
                      { label: 'Price: High to Low', value: 'price_high' },
                    ].map((option) => (
                      <Pressable
                        key={option.value}
                        style={styles.filterChoice}
                        onPress={() => setDraftSortBy(option.value)}
                      >
                        <Text style={styles.filterChoiceText}>
                          {option.label}
                        </Text>
                        <Ionicons
                          name={
                            draftSortBy === option.value
                              ? 'radio-button-on'
                              : 'radio-button-off'
                          }
                          size={19}
                          color="#355641"
                        />
                      </Pressable>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close filters"
                style={({ pressed }) => [
                  styles.closeFiltersButton,
                  pressed && styles.footerButtonPressed,
                ]}
                onPress={() => setShowFilters(false)}
              >
                <Ionicons name="close" size={17} color="#26352D" />
                <Text style={styles.closeFiltersText}>CLOSE</Text>
              </Pressable>
              <View style={styles.footerInfo}>
                <Text style={styles.footerCount}>
                  {filteredProducts.length} products
                </Text>
                <Text style={styles.footerSubtext}>
                  Available with current filters
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.applyButton,
                  pressed && styles.footerButtonPressed,
                ]}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>APPLY FILTERS</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },

  listContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },

  topControls: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  searchBox: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E3DDD1',
    backgroundColor: '#FFFFFF',
    gap: 9,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    fontSize: 14,
    color: '#26352D',
  },

  subcategoryFilters: {
    paddingTop: 12,
    gap: 8,
  },

  subcategoryChip: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCD8CC',
    backgroundColor: '#FFFFFF',
  },

  subcategoryChipSelected: {
    borderColor: '#355641',
    backgroundColor: '#355641',
  },

  subcategoryChipText: {
    color: '#355641',
    fontSize: 12,
    fontWeight: '600',
  },

  subcategoryChipTextSelected: {
    color: '#FFFFFF',
  },

  bottomFilterBar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E4DC',
    paddingHorizontal: 12,
    paddingBottom: 4,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },

  bottomFilterButton: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  bottomFilterButtonText: {
    color: '#26352D',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  bottomBarDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E3DDD1',
  },

  headerWrapper: {
    paddingTop: 10,
  },

  heroBanner: {
    backgroundColor: '#F1EFEA',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E6E1D6',
    marginBottom: 14,
  },

  heroEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },

  heroEyebrow: {
    fontSize: 10,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#A87E34',
  },

  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'PlayfairSemiBold',
    fontWeight: '700',
    color: '#112D20',
    letterSpacing: 0.2,
  },

  heroSubtitle: {
    marginTop: 5,
    fontSize: 12.5,
    lineHeight: 18,
    fontFamily: 'InterRegular',
    color: '#68736B',
  },

  resultsHeader: {
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  resultsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 10,
  },

  resultsTitle: {
    fontSize: 16,
    fontFamily: 'PlayfairSemiBold',
    fontWeight: '700',
    color: '#142C1E',
  },

  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 63, 42, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(15, 63, 42, 0.12)',
  },

  countText: {
    fontSize: 11,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#0F3F2A',
  },

  productRow: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  stateContainer: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },

  stateText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'InterRegular',
    textAlign: 'center',
    color: '#727B75',
  },

  emptyTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairSemiBold',
    fontWeight: '700',
    color: '#163826',
  },

  retryButton: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: '#0F3F2A',
  },

  retryText: {
    fontSize: 13,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#FFFFFF',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.38)',
    position: 'relative',
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },

  filterModal: {
    height: '82%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    zIndex: 1,
  },

  modalHandle: {
    width: 44,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#D6D1C7',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },

  modalHeading: {
    fontSize: 18,
    fontFamily: 'PlayfairSemiBold',
    fontWeight: '700',
    color: '#123D2B',
  },

  clearFiltersText: {
    color: '#8C5915',
    fontSize: 11.5,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  modalDivider: {
    height: 1,
    backgroundColor: '#EEEAE2',
  },

  filterContent: {
    flex: 1,
    flexDirection: 'row',
  },

  filterSidebar: {
    width: '35%',
    backgroundColor: '#F7F4EC',
    borderRightWidth: 1,
    borderRightColor: '#EFE8DE',
  },

  filterTab: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },

  activeFilterTab: {
    backgroundColor: '#FFFFFF',
    borderLeftColor: '#123D2B',
  },

  filterTabText: {
    fontSize: 12.5,
    fontFamily: 'InterRegular',
    color: '#77776E',
  },

  activeFilterTabText: {
    fontFamily: 'InterSemiBold',
    color: '#123D2B',
    fontWeight: '700',
  },

  filterOptions: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  filterSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#26352D',
    marginBottom: 6,
  },

  filterHelperText: {
    fontSize: 11,
    color: '#89877F',
    marginBottom: 18,
  },

  filterChoice: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F2EDE4',
  },

  subcategoryChoice: {
    paddingLeft: 14,
  },

  filterChoiceText: {
    fontSize: 12.5,
    fontFamily: 'InterRegular',
    color: '#382F26',
  },

  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },

  priceInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#E3DDD1',
    borderRadius: 9,
    paddingHorizontal: 9,
    fontSize: 12,
    color: '#26352D',
    backgroundColor: '#FAF9F6',
  },

  priceSeparator: {
    color: '#77776E',
    fontSize: 12,
  },

  modalFooter: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEAE2',
    backgroundColor: '#FFFFFF',
  },

  closeFiltersButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F3F1EC',
  },

  closeFiltersText: {
    color: '#26352D',
    fontSize: 10,
    fontWeight: '700',
  },

  footerButtonPressed: {
    opacity: 0.8,
  },

  footerInfo: {
    flex: 1,
  },

  footerCount: {
    fontSize: 14,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#123D2B',
  },

  footerSubtext: {
    fontSize: 10.5,
    fontFamily: 'InterRegular',
    color: '#89877F',
    marginTop: 2,
  },

  applyButton: {
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#123D2B',
  },

  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: 'InterSemiBold',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
