import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { getProducts } from '../../src/services/productService';
import { getCategories } from '../../src/services/categoryService';
import ProductCard from '../../src/components/home/ProductCard';

const POPULAR_SEARCHES = [
  'Kumkumadi Face Serum',
  'Bhringraj Hair Oil',
  'Face Soap',
  'Immunity',
  'Detox Tea',
  'Hair Care',
];

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Product filters
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('category');

  const [draftCategoryId, setDraftCategoryId] = useState('');
  const [draftSubcategoryId, setDraftSubcategoryId] = useState('');
  const [draftMinPrice, setDraftMinPrice] = useState('');
  const [draftMaxPrice, setDraftMaxPrice] = useState('');
  const [draftMinRating, setDraftMinRating] = useState(0);
  const [draftInStockOnly, setDraftInStockOnly] = useState(false);
  const [draftSortBy, setDraftSortBy] = useState('relevance');

  const getCategoryId = (category) =>
    category?.id ?? category?.category_id;

  const getCategoryName = (category) =>
    category?.name ??
    category?.category_name ??
    category?.title ??
    'Category';

  const openFilters = (tab = 'category') => {
    setDraftCategoryId(categoryId);
    setDraftSubcategoryId(subcategoryId);
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
    setDraftMinRating(minRating);
    setDraftInStockOnly(inStockOnly);
    setDraftSortBy(sortBy);
    setActiveFilterTab(tab);
    setShowFilters(true);
  };

  const applyFilters = () => {
    setCategoryId(draftCategoryId);
    setSubcategoryId(draftSubcategoryId);
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

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    getCategories()
      .then((data) => {
        if (active) {
          setCategories(Array.isArray(data) ? data : []);
        }
      })
      .catch((categoryError) => {
        console.error('Search categories loading error:', categoryError);
        if (active) {
          setCategories([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const term = query.trim();

    if (!term) {
      return;
    }

    let cancelled = false;

    async function searchProducts() {
      setLoading(true);
      setError('');

      try {
        const data = await getProducts({
          search: term,
          categoryId: categoryId || undefined,
          subcategoryId: subcategoryId || undefined,
          limit: 30,
          offset: 0,
        });

        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          setError(
            'Unable to load products. Please check your connection and try again.'
          );
          console.error('Product search error:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = setTimeout(searchProducts, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [categoryId, query, retryCount, subcategoryId]);

  const handleSearch = (value = query) => {
    const term = value.trim();
    if (!term) return;

    Keyboard.dismiss();
    setQuery(term);
    setRecentSearches((previous) => [
      term,
      ...previous.filter(
        (item) => item.toLowerCase() !== term.toLowerCase()
      ),
    ].slice(0, 8));
  };

  const handleQueryChange = (value) => {
    setQuery(value);
    setProducts([]);
    setError('');
    setLoading(Boolean(value.trim()));
  };

  const openProduct = (item) => {
    if (!item.slug) {
      console.warn('This product has no slug:', item);
      return;
    }

    router.push(`/products/${item.slug}`);
  };

  const activeFiltersCount =
    (categoryId !== '' ? 1 : 0) +
    (minPrice !== '' ? 1 : 0) +
    (maxPrice !== '' ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (sortBy !== 'relevance' ? 1 : 0);

  const filteredProducts = products
    .filter((product) => {
      const price = Number(product.price || 0);

      if (minPrice !== '' && price < Number(minPrice)) {
        return false;
      }

      if (maxPrice !== '' && price > Number(maxPrice)) {
        return false;
      }

      if (minRating > 0 && Number(product.rating || 0) < minRating) {
        return false;
      }

      if (inStockOnly && !product.in_stock) {
        return false;
      }

      return true;
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

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onPress={() => openProduct(item)}
    />
  );

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      {/* LUXURY TOP HEADER BAR */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.btnPressed,
          ]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color="#123D2B" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.eyebrowTag}>✦ DISCOVER AYURVEDA</Text>
          <Text style={styles.heading}>Search Products</Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      {/* LUXURY SEARCH INPUT BOX */}
      <View style={styles.searchBoxWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#123D2B" />

          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={() => handleSearch()}
            placeholder="Search oils, serums, wellness..."
            placeholderTextColor="#8F877B"
            returnKeyType="search"
            style={styles.input}
            autoCorrect={false}
          />

          {query.length > 0 && (
            <Pressable
              onPress={() => {
                setQuery('');
                setProducts([]);
                setError('');
                setLoading(false);
              }}
              hitSlop={10}
              style={styles.clearInputBtn}
            >
              <Ionicons name="close-circle" size={19} color="#9E988E" />
            </Pressable>
          )}
        </View>
      </View>

      {/* WHEN NO SEARCH QUERY ACTIVE: RECENT & POPULAR SEARCH CHIPS */}
      {!query.trim() && (
        <ScrollView
          style={styles.preSearchScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* RECENT SEARCHES */}
          {recentSearches.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="time-outline" size={16} color="#8C5915" />
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                </View>
                <Pressable
                  onPress={() => setRecentSearches([])}
                  hitSlop={8}
                >
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              </View>

              <View style={styles.chipsRow}>
                {recentSearches.map((term) => (
                  <Pressable
                    key={term}
                    style={({ pressed }) => [
                      styles.recentChip,
                      pressed && styles.chipPressed,
                    ]}
                    onPress={() => handleSearch(term)}
                  >
                    <Ionicons name="time-outline" size={13} color="#7C5318" />
                    <Text style={styles.recentChipText}>{term}</Text>
                    <Ionicons name="arrow-up" size={11} color="#7C5318" style={styles.chipArrow} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* POPULAR AYURVEDIC SEARCHES */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="sparkles" size={15} color="#C58F1D" />
                <Text style={styles.sectionTitle}>Popular Searches</Text>
              </View>
            </View>

            <View style={styles.chipsRow}>
              {POPULAR_SEARCHES.map((term) => (
                <Pressable
                  key={term}
                  style={({ pressed }) => [
                    styles.popularChip,
                    pressed && styles.chipPressed,
                  ]}
                  onPress={() => handleSearch(term)}
                >
                  <Ionicons name="leaf-outline" size={12} color="#123D2B" />
                  <Text style={styles.popularChipText}>{term}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* BOTANICAL DISCOVERY STAGE */}
          <View style={styles.discoveryStage}>
            <LinearGradient
              colors={['#FAF5EA', '#F6EFE2', '#F1E6D3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={styles.discoverySurface}
            >
              <View style={styles.leafIconCircle}>
                <Ionicons name="leaf" size={28} color="#C59A45" />
              </View>
              <Text style={styles.discoveryTitle}>Find Your Wellness Ritual</Text>
              <Text style={styles.discoveryText}>
                Explore artisanal Ayurvedic remedies crafted with certified organic herbs and botanical oils.
              </Text>
            </LinearGradient>
          </View>
        </ScrollView>
      )}

      {/* ACTIVE SEARCH RESULTS */}
      {query.trim() ? (
        <View style={styles.resultsSection}>
          {/* TOOLBAR: FILTER + SORT + ITEM COUNT */}
          <View style={styles.filterToolbar}>
            <View style={styles.toolbarButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.filterButton,
                  activeFiltersCount > 0 && styles.filterButtonActive,
                  pressed && styles.btnPressed,
                ]}
                onPress={openFilters}
              >
                <Ionicons
                  name="options-outline"
                  size={16}
                  color={activeFiltersCount > 0 ? '#FFFFFF' : '#123D2B'}
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    activeFiltersCount > 0 && styles.filterButtonTextActive,
                  ]}
                >
                  Filters
                </Text>
                {activeFiltersCount > 0 && (
                  <View style={styles.activeFilterCountBadge}>
                    <Text style={styles.activeFilterCountText}>
                      {activeFiltersCount}
                    </Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.sortButton,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => openFilters('sort')}
              >
                <Ionicons
                  name="swap-vertical-outline"
                  size={15}
                  color="#123D2B"
                />
                <Text style={styles.sortButtonText}>
                  {sortBy === 'price_low'
                    ? 'Price: Low'
                    : sortBy === 'price_high'
                    ? 'Price: High'
                    : 'Sort By'}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.resultCountText}>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </Text>
          </View>

          {/* LOADER, ERROR, EMPTY, OR RESULTS GRID */}
          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#123D2B" />
              <Text style={styles.loaderText}>Searching formulations...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={42} color="#8F877B" />
              <Text style={styles.emptyTitle}>Could not load results</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => {
                  setLoading(true);
                  setRetryCount((count) => count + 1);
                }}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={34} color="#8C5915" />
              </View>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>
                We couldn&apos;t find anything matching &quot;{query}&quot;. Try exploring other herbs or categories.
              </Text>
              <Pressable
                style={styles.clearSearchBtn}
                onPress={() => setQuery('')}
              >
                <Text style={styles.clearSearchBtnText}>Clear Search</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item, index) =>
                String(item.id ?? item.slug ?? index)
              }
              renderItem={renderProduct}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.resultsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : null}

      {/* LUXURY FILTER & SORT MODAL */}
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
                      color={activeFilterTab === tab.value ? '#123D2B' : '#77776E'}
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
                      const id = getCategoryId(category);
                      if (id == null) return null;

                      const idString = String(id);
                      const isSelected = draftCategoryId === idString;
                      const subcategories = (
                        category?.subcategories || []
                      ).filter((subcategory) =>
                        getCategoryId(subcategory) != null
                      );

                      return (
                        <View key={idString}>
                          <Pressable
                            style={styles.filterChoice}
                            onPress={() => {
                              setDraftCategoryId(idString);
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

                          {isSelected && subcategories.map((subcategory) => {
                            const subcategoryId = String(
                              getCategoryId(subcategory)
                            );
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
                      Enter custom budget or select a range
                    </Text>

                    <View style={styles.priceInputRow}>
                      <View style={styles.priceInputWrap}>
                        <Text style={styles.currencyPrefix}>₹</Text>
                        <TextInput
                          style={styles.priceInput}
                          placeholder="Min"
                          placeholderTextColor="#99958A"
                          keyboardType="numeric"
                          value={draftMinPrice}
                          onChangeText={setDraftMinPrice}
                        />
                      </View>

                      <Text style={styles.priceSeparator}>to</Text>

                      <View style={styles.priceInputWrap}>
                        <Text style={styles.currencyPrefix}>₹</Text>
                        <TextInput
                          style={styles.priceInput}
                          placeholder="Max"
                          placeholderTextColor="#99958A"
                          keyboardType="numeric"
                          value={draftMaxPrice}
                          onChangeText={setDraftMaxPrice}
                        />
                      </View>
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
                          color="#123D2B"
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

                    {[4, 3, 2, 0].map((ratingVal) => (
                      <Pressable
                        key={ratingVal}
                        style={styles.filterChoice}
                        onPress={() => setDraftMinRating(ratingVal)}
                      >
                        <Text style={styles.filterChoiceText}>
                          {ratingVal === 0 ? 'All Ratings' : `${ratingVal}★ & above`}
                        </Text>

                        <Ionicons
                          name={
                            draftMinRating === ratingVal
                              ? 'radio-button-on'
                              : 'radio-button-off'
                          }
                          size={19}
                          color="#123D2B"
                        />
                      </Pressable>
                    ))}
                  </View>
                )}

                {activeFilterTab === 'availability' && (
                  <View>
                    <Text style={styles.filterSectionTitle}>Availability</Text>
                    <Text style={styles.filterHelperText}>
                      Filter by ready stock
                    </Text>

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
                        color="#123D2B"
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
                          color="#123D2B"
                        />
                      </Pressable>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>

            {/* MODAL FOOTER */}
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
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                </Text>
                <Text style={styles.footerSubtext}>
                  Matching current filters
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

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },

  /* TOP BAR */
  topBar: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE1D4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },

  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },

  eyebrowTag: {
    fontSize: 9,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#8C5915',
    letterSpacing: 1.2,
  },

  heading: {
    fontSize: 20,
    fontFamily: 'PlayfairSemiBold',
    fontWeight: '700',
    color: '#123D2B',
    letterSpacing: 0.1,
  },

  headerRightSpacer: {
    width: 38,
  },

  /* SEARCH INPUT BOX */
  searchBoxWrap: {
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
  },

  searchBox: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#E2D8C6',
    backgroundColor: '#FFFFFF',
    gap: 10,
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'InterRegular',
    color: '#1A2E22',
    paddingVertical: 10,
  },

  clearInputBtn: {
    padding: 4,
  },

  /* PRE-SEARCH SCROLL */
  preSearchScroll: {
    flex: 1,
  },

  sectionContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  sectionTitle: {
    fontSize: 14,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#123D2B',
    letterSpacing: 0.1,
  },

  clearText: {
    fontSize: 12,
    fontFamily: 'InterSemiBold',
    color: '#8C5915',
    fontWeight: '600',
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE1D2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  recentChipText: {
    fontSize: 12,
    fontFamily: 'InterRegular',
    color: '#382B22',
  },

  chipArrow: {
    transform: [{ rotate: '45deg' }],
  },

  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAF5EA',
    borderWidth: 1,
    borderColor: '#EADCBF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },

  popularChipText: {
    fontSize: 12,
    fontFamily: 'InterMedium',
    fontWeight: '600',
    color: '#123D2B',
  },

  chipPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },

  /* DISCOVERY STAGE */
  discoveryStage: {
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 20,
  },

  discoverySurface: {
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: '#E6D7BD',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#2C1D08',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  leafIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EADCBF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#C59A45',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },

  discoveryTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 18,
    fontWeight: '700',
    color: '#123D2B',
    marginBottom: 6,
    textAlign: 'center',
  },

  discoveryText: {
    fontFamily: 'InterRegular',
    fontSize: 12,
    lineHeight: 17,
    color: '#655E54',
    textAlign: 'center',
    maxWidth: 280,
  },

  /* RESULTS SECTION */
  resultsSection: {
    flex: 1,
    paddingHorizontal: 14,
  },

  filterToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 8,
  },

  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#DFD6C5',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  filterButtonActive: {
    backgroundColor: '#123D2B',
    borderColor: '#123D2B',
  },

  filterButtonText: {
    fontSize: 11.5,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#123D2B',
  },

  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  activeFilterCountBadge: {
    backgroundColor: '#C58F1D',
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },

  activeFilterCountText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },

  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#DFD6C5',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  sortButtonText: {
    fontSize: 11.5,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#123D2B',
  },

  resultCountText: {
    fontSize: 11.5,
    fontFamily: 'InterMedium',
    color: '#7C766D',
  },

  /* LOADER */
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    gap: 10,
  },

  loaderText: {
    fontFamily: 'InterMedium',
    fontSize: 13,
    color: '#655E54',
  },

  /* EMPTY STATES */
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 45,
  },

  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FAF5EA',
    borderWidth: 1,
    borderColor: '#EADCBF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 18,
    fontWeight: '700',
    color: '#123D2B',
    textAlign: 'center',
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    color: '#777166',
    maxWidth: 270,
  },

  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#123D2B',
  },

  retryText: {
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
    fontSize: 12,
    fontWeight: '700',
  },

  clearSearchBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#123D2B',
    backgroundColor: '#FFFFFF',
  },

  clearSearchBtnText: {
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
    fontSize: 12,
    fontWeight: '700',
  },

  /* GRID */
  resultsList: {
    paddingBottom: 24,
  },

  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  /* FILTER MODAL */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(18, 61, 43, 0.45)',
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
    backgroundColor: '#D6CDBF',
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
    backgroundColor: '#EFE8DE',
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
    paddingTop: 18,
  },

  filterSectionTitle: {
    fontSize: 15,
    fontFamily: 'InterSemiBold',
    fontWeight: '700',
    color: '#123D2B',
    marginBottom: 4,
  },

  filterHelperText: {
    fontSize: 11,
    fontFamily: 'InterRegular',
    color: '#89877F',
    marginBottom: 16,
  },

  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },

  priceInputWrap: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DFD6C5',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#FAF9F6',
  },

  currencyPrefix: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8C5915',
    marginRight: 4,
  },

  priceInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'InterRegular',
    color: '#123D2B',
  },

  priceSeparator: {
    color: '#77776E',
    fontSize: 12,
    fontFamily: 'InterMedium',
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

  modalFooter: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFE8DE',
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
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },

  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontFamily: 'InterSemiBold',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
