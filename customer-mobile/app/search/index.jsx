
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getProducts } from '../../src/services/productService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';

// Replace this import with your existing API configuration if available.


export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!submittedQuery.trim()) {
      setProducts([]);
      setLoading(false);
      setError('');
      return;
    }

    let cancelled = false;

    async function searchProducts() {
      setLoading(true);
      setError('');

      try {
        const data = await getProducts({
          search: submittedQuery.trim(),
          limit: 30,
          offset: 0,
        });
        console.log(
  'SEARCH PRODUCT DATA:',
  JSON.stringify(data?.[0], null, 2)
);

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

    searchProducts();

    return () => {
      cancelled = true;
    };
  }, [submittedQuery]);

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

    setSubmittedQuery(term);
  };

  const openProduct = (item) => {
    if (!item.slug) {
      console.warn('This product has no slug:', item);
      return;
    }

   router.push(`/products/${item.slug}`);
  };

  
const renderProduct = ({ item }) => (
  <Pressable
    style={styles.productCard}
    onPress={() => openProduct(item)}
  >
    {item.image ? (
      <Image
        source={{ uri: item.image }}
        style={styles.productImage}
        resizeMode="cover"
      />
    ) : (
      <View style={[styles.productImage, styles.imagePlaceholder]}>
        <Ionicons name="leaf-outline" size={30} color="#788675" />
      </View>
    )}

    <View style={styles.productInfo}>
      <Text style={styles.productName} numberOfLines={2}>
        {item.name || item.title || 'Wellness Product'}
      </Text>

      {item.description ? (
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {item.price != null && (
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.price}</Text>

          {item.compare_at_price != null &&
            item.compare_at_price > item.price && (
              <Text style={styles.originalPrice}>
                ₹{item.compare_at_price}
              </Text>
            )}
        </View>
      )}

      {item.rating != null && (
        <Text style={styles.rating}>
          ★ {item.rating}
          {item.review_count != null
            ? ` (${item.review_count} reviews)`
            : ''}
        </Text>
      )}

      <Text style={styles.viewProduct}>View product →</Text>
    </View>
  </Pressable>
);


  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={23} color="#26352D" />
        </Pressable>

        <Text style={styles.heading}>Search Products</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={21} color="#526354" />

        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearch()}
          placeholder="Search oils, skincare, wellness..."
          placeholderTextColor="#89877F"
          returnKeyType="search"
          style={styles.input}
          autoCorrect={false}
        />

        {query.length > 0 && (
          <Pressable
            onPress={() => {
              setQuery('');
              setSubmittedQuery('');
              setProducts([]);
              setError('');
            }}
            hitSlop={10}
          >
            <Ionicons name="close-circle" size={20} color="#89877F" />
          </Pressable>
        )}

        <Pressable onPress={() => handleSearch()} hitSlop={8}>
          <Text style={styles.searchAction}>Search</Text>
        </Pressable>
      </View>

      {!submittedQuery && recentSearches.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent searches</Text>
            <Pressable onPress={() => setRecentSearches([])}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>

          {recentSearches.map((term) => (
            <Pressable
              key={term}
              style={styles.recentItem}
              onPress={() => handleSearch(term)}
            >
              <Ionicons name="time-outline" size={19} color="#89877F" />
              <Text style={styles.recentText}>{term}</Text>
              <Ionicons name="arrow-up-outline" size={17} color="#89877F" />
            </Pressable>
          ))}
        </View>
      )}

      {submittedQuery ? (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>
            Results for {submittedQuery}
          </Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#355641"
              style={styles.loader}
            />
          ) : error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Couldnt load results</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => handleSearch(submittedQuery)}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={38} color="#9B9A8D" />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>
                Try another product name or search term.
              </Text>
            </View>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item, index) =>
                String(item.id ?? item.slug ?? index)
              }
              renderItem={renderProduct}
              contentContainerStyle={styles.resultsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      ) : (
        <View style={styles.hint}>
          <Ionicons name="leaf-outline" size={30} color="#789078" />
          <Text style={styles.hintTitle}>Find your wellness essentials</Text>
          <Text style={styles.hintText}>
            Search for Ayurvedic oils, skincare, hair care and more.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 7,
    marginRight: 10,
  },
  heading: {
    fontSize: 19,
    fontWeight: '700',
    color: '#26352D',
  },
  searchBox: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E3DDD1',
    backgroundColor: '#FFFFFF',
    gap: 9,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    fontSize: 14,
    color: '#26352D',
  },
  searchAction: {
    color: '#355641',
    fontSize: 13,
    fontWeight: '700',
  },
  recentSection: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#26352D',
  },
  clearText: {
    fontSize: 13,
    color: '#8A6B3E',
  },
  recentItem: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E7E1D6',
  },
  recentText: {
    flex: 1,
    color: '#494A42',
    fontSize: 14,
  },
  resultsSection: {
    flex: 1,
    marginTop: 22,
    paddingHorizontal: 16,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#26352D',
    marginBottom: 14,
  },
  resultsList: {
    paddingBottom: 24,
  },
  productCard: {
    flexDirection: 'row',
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EAE4D9',
  },
  productImage: {
    width: 94,
    height: 104,
    borderRadius: 11,
    backgroundColor: '#F0EEE5',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#26352D',
  },
  price: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#8A6B3E',
  },
  viewProduct: {
    marginTop: 7,
    fontSize: 12,
    color: '#657565',
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '700',
    color: '#26352D',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: '#77776E',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#355641',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  hint: {
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingTop: 65,
  },
  hintTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: '700',
    color: '#26352D',
  },
  hintText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: '#77776E',
  },
  
priceRow: {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 6,
},

productDescription: {
  marginTop: 5,
  fontSize: 12,
  lineHeight: 17,
  color: '#77776E',
},

originalPrice: {
  fontSize: 12,
  color: '#89877F',
  textDecorationLine: 'line-through',
},

rating: {
  marginTop: 5,
  fontSize: 12,
  color: '#8A6B3E',
  fontWeight: '600',
},

});
