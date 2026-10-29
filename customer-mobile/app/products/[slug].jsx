import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  
  useWindowDimensions,
} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import {
  getProductBySlug,
} from '../../src/services/productService';
import {
  getProductReviews,
  submitProductReview,
} from '../../src/services/reviewService';

import { useAuth } from '../../src/context/AuthContext';
import {
  useCart,
} from '../../src/context/CartContext';
import { useWishlist } from '../../src/context/WishlistContext';

import ProductCard from '../../src/components/home/ProductCard';

export default function ProductDetailsScreen() {

  // ==========================================================
  // ROUTER
  // ==========================================================

  const {
    slug,
  } = useLocalSearchParams();

  const productSlug = slug ? String(slug) : '';
  const router =
    useRouter();

  const { width } = useWindowDimensions();
  const imageHeight = Math.min(width * 0.95, 460);
const [reviews, setReviews] = useState([]);
const [reviewsLoading, setReviewsLoading] = useState(false);
const { token, isAuthenticated } = useAuth();

const [reviewRating, setReviewRating] = useState(5);
const [reviewTitle, setReviewTitle] = useState('');
const [reviewText, setReviewText] = useState('');
const [reviewSubmitting, setReviewSubmitting] = useState(false);
const [reviewMessage, setReviewMessage] = useState('');
const [reviewError, setReviewError] = useState('');
  // ==========================================================
  // CART
  // ==========================================================

  const {
    cartItems,
    cartCount,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = useCart();

  const {
    isWishlisted,
    toggleWishlist,
  } = useWishlist();

  // ==========================================================
  // PRODUCT STATE
  // ==========================================================

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // ==========================================================
  // RETRY HANDLER
  // ==========================================================

  const handleRetry = () => {
    if (!productSlug) return;
    setRetryCount((count) => count + 1);
  };
const handleSubmitReview = async () => {
  if (!isAuthenticated || !token) {
    router.push('/login');
    return;
  }

  if (!reviewTitle.trim() && !reviewText.trim()) {
    setReviewError('Please enter a title or written feedback.');
    setReviewMessage('');
    return;
  }

  if (!product?.id) {
    setReviewError('Product information is unavailable.');
    return;
  }

  try {
    setReviewSubmitting(true);
    setReviewError('');
    setReviewMessage('');

    const result = await submitProductReview({
      productId: product.id,
      rating: reviewRating,
      title: reviewTitle,
      reviewText,
      token,
    });

    setReviewMessage(
      result.message || 'Your review was submitted for approval.'
    );

    setReviewTitle('');
    setReviewText('');
    setReviewRating(5);
  } catch (error) {
    setReviewError(
      error.message || 'Unable to submit your review.'
    );
  } finally {
    setReviewSubmitting(false);
  }
};
  // ==========================================================
  // LOAD WHEN PRODUCT / AUTH CHANGES
  // ==========================================================
useEffect(() => {
  if (!product?.id) return;

  let active = true;

  setReviewsLoading(true);

  getProductReviews(product.id)
    .then((data) => {
      if (active) setReviews(data);
    })
    .catch((err) => {
      console.warn('Product reviews:', err.message);
      if (active) setReviews([]);
    })
    .finally(() => {
      if (active) setReviewsLoading(false);
    });

  return () => {
    active = false;
  };
}, [product?.id]);
  useEffect(() => {
    let active = true;

    if (!slug) {
      return () => {
        active = false;
      };
    }

    Promise.resolve()
      .then(() => {
        if (!active) return null;

        setLoading(true);
        setError(null);
        return getProductBySlug(String(slug));
      })
      .then((data) => {
        if (!active) return;

        if (!data) {
          setProduct(null);
          setError('Product not found.');
          return;
        }

        setProduct(data);
      })
      .catch((err) => {
        if (!active) return;

        setProduct(null);
        setError(err?.message || 'Unable to load product.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, retryCount]);

  // ==========================================================
  // PRODUCT DATA
  // ==========================================================

  const variantId =
    product?.variant?.id ??
    null;

  const cartItem =
    cartItems.find(
      (item) =>
        item.productId ===
          product?.id &&
        item.variantId ===
          variantId
    );

  const isInCart =
    !!cartItem;

  const cartQuantity =
    Number(
      cartItem?.quantity || 0
    );

  const image =
    product?.image ||
    product?.image_url ||
    product?.thumbnail ||
    null;

  const price =
    Number(
      product?.variant?.price ??
        product?.price ??
        0
    );

  const comparePrice =
    Number(
      product?.variant
        ?.compare_at_price ??
        product?.compare_at_price ??
        0
    );

 const reviewCount = reviews.length;

const rating = reviewCount > 0
  ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount
  : 0;

  const stock =
    Number(
      product?.variant
        ?.stock_quantity
    ) || 0;

  const variantName =
    product?.variant?.name ||
    '';

  const relatedProducts =
    product?.related_products ||
    [];

  const discount =
    comparePrice > price
      ? Math.round(
          ((comparePrice -
            price) /
            comparePrice) *
            100
        )
      : 0;

  const savingsAmount = comparePrice > price ? comparePrice - price : 0;

  const handleWishlistToggle = async () => {
    if (!product?.id) {
      return;
    }
    await toggleWishlist(product);
  };

  // ==========================================================
  // ADD TO CART
  // ==========================================================

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    addToCart(
      product,
      1,
      product.variant ?? null
    );
  };

  // ==========================================================
  // BUY NOW
  // ==========================================================

  const handleBuyNow = () => {
    if (!product) {
      return;
    }

    router.push({
      pathname: '/checkout',
      params: {
        buyNow: 'true',
        productId: String(product.id),
        productSlug: String(product.slug || slug),
        variantId: product.variant?.id
          ? String(product.variant.id)
          : '',
        quantity: '1',
      },
    });
  };

  // ==========================================================
  // INCREASE
  // ==========================================================

  const handleIncrease = () => {
    if (!cartItem) {
      return;
    }

    if (
      stock > 0 &&
      cartQuantity >= stock
    ) {
      return;
    }

    increaseQuantity(
      cartItem.itemKey
    );
  };

  // ==========================================================
  // DECREASE
  // ==========================================================

  const handleDecrease = () => {
    if (!cartItem) {
      return;
    }

    if (
      cartQuantity <= 1
    ) {
      removeFromCart(
        cartItem.itemKey
      );
      return;
    }

    decreaseQuantity(
      cartItem.itemKey
    );
  };

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (slug && loading) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'bottom']}
      >
        <View style={styles.center}>
          <View style={styles.loadingEmblem}>
            <ActivityIndicator
              size="large"
              color="#D9A52E"
            />
          </View>
          <Text style={styles.loadingBrand}>AUMVEDA</Text>
          <Text style={styles.loadingText}>
            Preparing botanical details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // ERROR STATE
  // ==========================================================

  if (
    !slug ||
    error ||
    !product
  ) {
    return (
      <SafeAreaView
        style={styles.screen}
        edges={['top', 'bottom']}
      >
        <View style={styles.center}>
          <View style={styles.errorIconWrap}>
            <Ionicons
              name="leaf-outline"
              size={42}
              color="#D9A52E"
            />
          </View>

          <Text style={styles.errorTitle}>
            Product Unavailable
          </Text>

          <Text style={styles.errorText}>
            {error ||
              (!slug
                ? 'Product slug is missing.'
                : 'We could not load this Ayurvedic formulation.')}
          </Text>

          {slug && (
            <Pressable
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Text style={styles.retryText}>
                Retry Formulation
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'bottom']}
    >
      {/* =====================================================
          PREMIUM HEADER
      ===================================================== */}
      <View style={styles.header}>
        {/* BACK BUTTON */}
        <Pressable
          style={styles.headerButton}
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color="#143828"
          />
        </Pressable>

        {/* TITLE / BRAND EMBLEM */}
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerEyebrow}>AUMVEDA BOTANICALS</Text>
          <Text
            style={styles.headerTitle}
            numberOfLines={1}
          >
            Pure Ayurveda
          </Text>
        </View>

        {/* RIGHT ACTIONS */}
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.push('/search')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Search products"
          >
            <Ionicons
              name="search-outline"
              size={19}
              color="#143828"
            />
          </Pressable>

          <Pressable
            style={styles.headerButton}
            onPress={() => router.push('/wishlist')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="View Wishlist"
          >
            <Ionicons
              name={isWishlisted(product?.id) ? 'heart' : 'heart-outline'}
              size={19}
              color={isWishlisted(product?.id) ? '#C2410C' : '#143828'}
            />
          </Pressable>

          <Pressable
            style={styles.headerButton}
            onPress={() => router.push('/cart')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Cart with ${cartCount} items`}
          >
            <Ionicons
              name="cart-outline"
              size={19}
              color="#143828"
            />
            {cartCount > 0 && (
              <View style={styles.headerCartBadge}>
                <Text style={styles.headerCartBadgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* =====================================================
          SCROLL CONTENT
      ===================================================== */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ===================================================
            HERO PRODUCT IMAGE STAGE
        =================================================== */}
        <View
          style={[
            styles.imageStage,
            {
              height: imageHeight,
            },
          ]}
        >
          {/* Subtle gold concentric halo behind bottle */}
          <View style={styles.imageHaloOuter}>
            <View style={styles.imageHaloInner} />
          </View>

          {image ? (
            <Image
  source={{ uri: image }}
  style={styles.productImage}
  contentFit="contain"
  cachePolicy="memory-disk"
  transition={0}
/>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="leaf-outline"
                size={64}
                color="#D9A52E"
              />
              <Text style={styles.placeholderText}>
                Authentic Formulation
              </Text>
            </View>
          )}

          {/* DISCOUNT BADGE */}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountSparkle}>✦</Text>
              <Text style={styles.discountText}>
                {discount}% OFF
              </Text>
            </View>
          )}

          {/* FLOATING WISHLIST BUTTON */}
          <Pressable
            style={styles.favoriteButton}
            onPress={handleWishlistToggle}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Toggle wishlist"
          >
            <Ionicons
              name={
                isWishlisted(product?.id)
                  ? 'heart'
                  : 'heart-outline'
              }
              size={21}
              color={
                isWishlisted(product?.id)
                  ? '#C2410C'
                  : '#123D2B'
              }
            />
          </Pressable>

          {/* AUTHENTICITY PILL AT BOTTOM OF IMAGE */}
          <View style={styles.authenticityPill}>
            <Ionicons
              name="shield-checkmark"
              size={13}
              color="#D9A52E"
            />
            <Text style={styles.authenticityPillText}>
              100% Certified Ayurvedic Formulation
            </Text>
          </View>
        </View>

        {/* ===================================================
            PRODUCT INFORMATION CONTAINER
        =================================================== */}
        <View style={styles.infoCard}>
          {/* CATEGORY & RATING ROW */}
          <View style={styles.eyebrowRow}>
            <Text style={styles.categoryLabel}>
              ✦ AYURVEDA WELLNESS ✦
            </Text>

            <View style={styles.ratingBox}>
              <Ionicons
                name="star"
                size={12}
                color="#D9A52E"
              />
              <Text style={styles.ratingValue}>
                {rating.toFixed(1)}
              </Text>
              <Text style={styles.reviewCount}>
                ({reviewCount})
              </Text>
            </View>
          </View>

          {/* PRODUCT NAME */}
          <Text style={styles.productName}>
            {product.name}
          </Text>

          {/* PRICE ROW */}
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.priceCurrency}>₹</Text>
              <Text style={styles.priceValue}>
                {price.toLocaleString('en-IN')}
              </Text>

              {comparePrice > price && (
                <Text style={styles.comparePrice}>
                  ₹{comparePrice.toLocaleString('en-IN')}
                </Text>
              )}

              {savingsAmount > 0 && (
                <View style={styles.savingsPill}>
                  <Text style={styles.savingsPillText}>
                    Save ₹{savingsAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.taxInclusiveText}>
              Inclusive of all taxes • Free express shipping
            </Text>
          </View>

          {/* VARIANT / SIZE */}
          {variantName ? (
            <View style={styles.variantContainer}>
              <Text style={styles.variantLabel}>Select Size / Variant</Text>
              <View style={styles.variantBadge}>
                <Ionicons
                  name="leaf"
                  size={13}
                  color="#D9A52E"
                />
                <Text style={styles.variantText}>
                  {variantName}
                </Text>
              </View>
            </View>
          ) : null}

          {/* 3-PILLAR BOTANICAL TRUST ROW */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <View style={styles.trustIconCircle}>
                <Ionicons
                  name="leaf-outline"
                  size={16}
                  color="#123D2B"
                />
              </View>
              <Text style={styles.trustTitle}>Pure Herbs</Text>
              <Text style={styles.trustSubtitle}>Zero Additives</Text>
            </View>

            <View style={styles.trustDivider} />

            <View style={styles.trustItem}>
              <View style={styles.trustIconCircle}>
                <Ionicons
                  name="flask-outline"
                  size={16}
                  color="#143828"
                />
              </View>
              <Text style={styles.trustTitle}>Vedic Recipe</Text>
              <Text style={styles.trustSubtitle}>Lab Tested</Text>
            </View>

            <View style={styles.trustDivider} />

            <View style={styles.trustItem}>
              <View style={styles.trustIconCircle}>
                <Ionicons
                  name="cube-outline"
                  size={16}
                  color="#143828"
                />
              </View>
              <Text style={styles.trustTitle}>Free Express</Text>
              <Text style={styles.trustSubtitle}>Fast Dispatch</Text>
            </View>
          </View>

          {/* DESCRIPTION SECTION */}
          {product.description ? (
            <View style={styles.descriptionSection}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleDot} />
                <Text style={styles.sectionTitle}>
                  About This Formulation
                </Text>
              </View>

              <Text style={styles.description}>
                {product.description}
              </Text>
            </View>
          ) : null}

          {/* STOCK STATUS */}
          <View style={styles.stockRow}>
            <View
              style={[
                styles.stockDot,
                { backgroundColor: stock > 0 ? '#10B981' : '#EF4444' },
              ]}
            />
            <Text
              style={
                stock > 0
                  ? styles.inStock
                  : styles.outOfStock
              }
            >
              {stock > 0
                ? `${stock} units available — in stock`
                : 'Temporarily out of stock'}
            </Text>
          </View>

          {/* QUANTITY CONTROLS (IF ALREADY IN CART) */}
          {isInCart && (
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>
                Quantity in Your Cart
              </Text>

              <View style={styles.quantityControl}>
                <Pressable
                  style={styles.quantityButton}
                  onPress={handleDecrease}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease quantity"
                >
                  <Ionicons
                    name="remove"
                    size={17}
                    color="#143828"
                  />
                </Pressable>

                <Text style={styles.quantityValue}>
                  {cartQuantity}
                </Text>

                <Pressable
                  style={styles.quantityButton}
                  onPress={handleIncrease}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel="Increase quantity"
                >
                  <Ionicons
                    name="add"
                    size={17}
                    color="#143828"
                  />
                </Pressable>
              </View>
            </View>
          )}

          {/* ACTION BUTTONS (ADD TO CART + BUY NOW) */}
          <View style={styles.actionRow}>
            {!isInCart ? (
              <Pressable
                style={[
                  styles.addButton,
                  stock <= 0 && styles.disabledButton,
                ]}
                onPress={handleAddToCart}
                disabled={stock <= 0}
              >
                <Ionicons
                  name="bag-add-outline"
                  size={18}
                  color="#D4AF37"
                />
                <Text style={styles.addButtonText}>
                  Add to Cart
                </Text>
              </Pressable>
            ) : (
              <View style={styles.addedButton}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#10B981"
                />
                <Text style={styles.addedButtonText}>
                  Added ({cartQuantity})
                </Text>
              </View>
            )}

            <Pressable
              style={[
                styles.buyButtonWrap,
                stock <= 0 && styles.disabledButton,
              ]}
              onPress={handleBuyNow}
              disabled={stock <= 0}
            >
              <LinearGradient
                colors={['#F7DF9B', '#D9A52E', '#B8821F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buyButtonGradient}
              >
                <Text style={styles.buyButtonText}>
                  Buy Now
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#123D2B"
                />
              </LinearGradient>
            </Pressable>
          </View>

          {/* CART STATUS BADGE */}
          {isInCart && (
            <View style={styles.cartStatus}>
              <Ionicons
                name="checkmark-circle"
                size={15}
                color="#10B981"
              />
              <Text style={styles.cartStatusText}>
                {cartQuantity} {cartQuantity === 1 ? 'item' : 'items'} currently in your cart
              </Text>
            </View>
          )}
        </View>

        {/* ===================================================
            CUSTOMER REVIEWS
        =================================================== */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <View>
              <Text style={styles.reviewsEyebrow}>
                CUSTOMER EXPERIENCES
              </Text>
              <Text style={styles.reviewsTitle}>
                Reviews &amp; Ratings
              </Text>
            </View>

            <View style={styles.reviewsSummary}>
              <Ionicons name="star" size={16} color="#D9A52E" />
              <Text style={styles.reviewsAverage}>
                {rating.toFixed(1)}
              </Text>
              <Text style={styles.reviewsTotal}>
                ({reviewCount})
              </Text>
            </View>
          </View>

          {/* SUBMIT A REVIEW */}
          <View style={styles.reviewForm}>
            <Text style={styles.reviewFormTitle}>
              Share Your Experience
            </Text>
            <Text style={styles.reviewFormHint}>
              Tell us about your experience with this product.
            </Text>

            <Text style={styles.reviewFieldLabel}>Your Rating</Text>
            <View style={styles.reviewStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setReviewRating(star)}
                  disabled={reviewSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
                  style={styles.reviewStarButton}
                >
                  <Ionicons
                    name={star <= reviewRating ? 'star' : 'star-outline'}
                    size={30}
                    color="#D9A52E"
                  />
                </Pressable>
              ))}
            </View>

            <Text style={styles.reviewFieldLabel}>
              Review Title (Optional)
            </Text>
            <TextInput
              value={reviewTitle}
              onChangeText={setReviewTitle}
              placeholder="Summarize your experience"
              placeholderTextColor="#96938B"
              maxLength={150}
              editable={!reviewSubmitting}
              style={styles.reviewInput}
            />

            <Text style={styles.reviewFieldLabel}>
              Your Feedback (Optional)
            </Text>
            <TextInput
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="What did you like about this product?"
              placeholderTextColor="#96938B"
              maxLength={3000}
              multiline
              textAlignVertical="top"
              editable={!reviewSubmitting}
              style={[styles.reviewInput, styles.reviewTextArea]}
            />

            {!!reviewError && (
              <Text style={styles.reviewError}>{reviewError}</Text>
            )}

            {!!reviewMessage && (
              <Text style={styles.reviewSuccess}>{reviewMessage}</Text>
            )}

            <Pressable
              style={[
                styles.reviewSubmitButton,
                reviewSubmitting && styles.reviewSubmitDisabled,
              ]}
              onPress={handleSubmitReview}
              disabled={reviewSubmitting}
              accessibilityRole="button"
            >
              {reviewSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.reviewSubmitText}>
                  Submit Review
                </Text>
              )}
            </Pressable>

            <Text style={styles.reviewApprovalNote}>
              Reviews are published after approval. You must have purchased this product to review it.
            </Text>
          </View>

          {/* APPROVED REVIEWS */}
          <View style={styles.reviewList}>
            <Text style={styles.reviewListTitle}>
              Customer Feedback
            </Text>

            {reviewsLoading ? (
              <ActivityIndicator color="#123D2B" />
            ) : reviewCount === 0 ? (
              <Text style={styles.reviewEmpty}>
                No approved reviews yet. Be the first to share your experience.
              </Text>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewCardTop}>
                    <View style={styles.reviewRatingStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={
                            star <= Number(review.rating)
                              ? 'star'
                              : 'star-outline'
                          }
                          size={14}
                          color="#D9A52E"
                        />
                      ))}
                    </View>

                    {review.created_at ? (
                      <Text style={styles.reviewDate}>
                        {new Date(review.created_at).toLocaleDateString(
                          'en-IN'
                        )}
                      </Text>
                    ) : null}
                  </View>

                  {review.title ? (
                    <Text style={styles.reviewCardTitle}>
                      {review.title}
                    </Text>
                  ) : null}

                  {review.review_text ? (
                    <Text style={styles.reviewCardText}>
                      {review.review_text}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>

        {/* ===================================================
            RELATED PRODUCTS ("COMPLETE YOUR RITUAL")
        =================================================== */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Text style={styles.relatedEyebrow}>
                ✦ COMPLETE YOUR RITUAL ✦
              </Text>
              <Text style={styles.relatedTitle}>
                Related Formulations
              </Text>
            </View>

            <View style={styles.relatedGrid}>
              {relatedProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onPress={() =>
                    router.push({
                      pathname: '/products/[slug]',
                      params: {
                        slug: item.slug,
                      },
                    })
                  }
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#F8F6F0',
  },

  loadingEmblem: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E1D3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1A3324',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  loadingBrand: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 16,
    letterSpacing: 3,
    color: '#123D2B',
  },

  loadingText: {
    marginTop: 8,
    fontFamily: 'InterRegular',
    fontSize: 13,
    color: '#716F68',
  },

  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F2EDE2',
    borderWidth: 1,
    borderColor: '#DECFA9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  errorTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 20,
    color: '#123D2B',
  },

  errorText: {
    marginTop: 8,
    fontFamily: 'InterRegular',
    fontSize: 13,
    textAlign: 'center',
    color: '#716F68',
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 22,
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: 24,
    backgroundColor: '#123D2B',
  },

  retryText: {
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
    fontSize: 13,
  },

  // --------------------------------------------------------
  // HEADER
  // --------------------------------------------------------
  header: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F6F0',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE5D8',
  },

  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2D5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A3324',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },

  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  headerEyebrow: {
    fontFamily: 'InterSemiBold',
    fontSize: 8.5,
    letterSpacing: 2,
    color: '#D9A52E',
  },

  headerTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 14,
    color: '#123D2B',
    marginTop: 1,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  headerCartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9A52E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  headerCartBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
    fontSize: 9,
  },

  // --------------------------------------------------------
  // SCROLL CONTENT
  // --------------------------------------------------------
  scrollContent: {
    paddingBottom: 40,
  },

  // --------------------------------------------------------
  // HERO IMAGE STAGE
  // --------------------------------------------------------
  imageStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EFE6',
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE5D8',
  },

  imageHaloOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imageHaloInner: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
  },

  productImage: {
    width: '84%',
    height: '84%',
  },

  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  placeholderText: {
    marginTop: 10,
    fontFamily: 'InterMedium',
    fontSize: 12,
    color: '#7C8A81',
  },

  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#123D2B',
    borderWidth: 1,
    borderColor: '#D9A52E',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  discountSparkle: {
    color: '#D9A52E',
    fontSize: 10,
  },

  discountText: {
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
    fontSize: 11,
    letterSpacing: 0.4,
  },

  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2D5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A3324',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  authenticityPill: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: '#E6DEC9',
  },

  authenticityPillText: {
    fontFamily: 'InterSemiBold',
    fontSize: 10,
    color: '#123D2B',
    letterSpacing: 0.2,
  },

  // --------------------------------------------------------
  // INFO CARD
  // --------------------------------------------------------
  infoCard: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
    backgroundColor: '#F8F6F0',
  },

  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  categoryLabel: {
    fontFamily: 'InterSemiBold',
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: '#D9A52E',
  },

  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#123D2B',
  },

  ratingValue: {
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
    fontSize: 11,
  },

  reviewCount: {
    color: '#D9A52E',
    fontFamily: 'InterRegular',
    fontSize: 10,
  },

  productName: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 26,
    lineHeight: 33,
    color: '#123D2B',
    marginTop: 4,
  },

  // --------------------------------------------------------
  // PRICE CONTAINER
  // --------------------------------------------------------
  priceContainer: {
    marginTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE5D8',
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  priceCurrency: {
    fontFamily: 'InterSemiBold',
    fontSize: 19,
    color: '#123D2B',
    marginRight: 2,
  },

  priceValue: {
    fontFamily: 'InterSemiBold',
    fontSize: 27,
    color: '#123D2B',
  },

  comparePrice: {
    marginLeft: 10,
    fontFamily: 'InterRegular',
    fontSize: 15,
    textDecorationLine: 'line-through',
    color: '#716F68',
  },

  savingsPill: {
    marginLeft: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E9F5EE',
    borderWidth: 1,
    borderColor: '#C3E5D0',
  },

  savingsPillText: {
    fontFamily: 'InterSemiBold',
    fontSize: 10.5,
    color: '#0E7345',
  },

  taxInclusiveText: {
    marginTop: 5,
    fontFamily: 'InterRegular',
    fontSize: 11,
    color: '#76857C',
  },

  // --------------------------------------------------------
  // VARIANT / SIZE
  // --------------------------------------------------------
  variantContainer: {
    marginTop: 16,
  },

  variantLabel: {
    fontFamily: 'InterSemiBold',
    fontSize: 12.5,
    color: '#123D2B',
    marginBottom: 8,
  },

  variantBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D9A52E',
    shadowColor: '#1A3324',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  variantText: {
    fontFamily: 'InterSemiBold',
    fontSize: 12,
    color: '#123D2B',
  },

  // --------------------------------------------------------
  // 3-PILLAR BOTANICAL TRUST ROW
  // --------------------------------------------------------
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE5D8',
    shadowColor: '#1A3324',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  trustItem: {
    flex: 1,
    alignItems: 'center',
  },

  trustIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3EFE6',
    borderWidth: 1,
    borderColor: '#E2D8C3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  trustTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 11,
    color: '#123D2B',
  },

  trustSubtitle: {
    fontFamily: 'InterRegular',
    fontSize: 9.5,
    color: '#716F68',
    marginTop: 1,
  },

  trustDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#ECE5D8',
  },

  // --------------------------------------------------------
  // DESCRIPTION SECTION
  // --------------------------------------------------------
  descriptionSection: {
    marginTop: 22,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE5D8',
    shadowColor: '#1A3324',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  sectionTitleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D9A52E',
  },

  sectionTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 17,
    color: '#123D2B',
  },

  description: {
    fontFamily: 'InterRegular',
    fontSize: 13,
    lineHeight: 22,
    color: '#716F68',
  },

  // --------------------------------------------------------
  // STOCK ROW
  // --------------------------------------------------------
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },

  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  inStock: {
    fontFamily: 'InterSemiBold',
    fontSize: 12,
    color: '#0E7345',
  },

  outOfStock: {
    fontFamily: 'InterSemiBold',
    fontSize: 12,
    color: '#B54A4A',
  },

  // --------------------------------------------------------
  // QUANTITY SECTION
  // --------------------------------------------------------
  quantitySection: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE5D8',
  },

  quantityLabel: {
    fontFamily: 'InterSemiBold',
    fontSize: 13,
    color: '#123D2B',
  },

  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F3EFE6',
    borderWidth: 1,
    borderColor: '#E2D8C3',
    overflow: 'hidden',
  },

  quantityButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityValue: {
    minWidth: 32,
    textAlign: 'center',
    fontFamily: 'InterSemiBold',
    fontSize: 14,
    color: '#123D2B',
  },

  // --------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
  },

  addButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#123D2B',
    borderWidth: 1,
    borderColor: '#194E38',
    shadowColor: '#123D2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontFamily: 'InterSemiBold',
    fontSize: 13.5,
  },

  addedButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },

  addedButtonText: {
    fontFamily: 'InterSemiBold',
    fontSize: 13.5,
    color: '#123D2B',
  },

  buyButtonWrap: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#D9A52E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  buyButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },

  buyButtonText: {
    color: '#123D2B',
    fontFamily: 'InterSemiBold',
    fontSize: 14,
    letterSpacing: 0.3,
  },

  disabledButton: {
    opacity: 0.45,
  },

  cartStatus: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  cartStatusText: {
    fontFamily: 'InterMedium',
    fontSize: 11.5,
    color: '#0E7345',
  },

  reviewsSection: {
    marginHorizontal: 16,
    marginTop: 26,
    marginBottom: 12,
  },

  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  reviewsEyebrow: {
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#8A7956',
  },

  reviewsTitle: {
    fontFamily: 'PlayfairSemiBold',
    fontSize: 22,
    color: '#123D2B',
    marginTop: 4,
  },

  reviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  reviewsAverage: {
    fontFamily: 'InterSemiBold',
    fontSize: 17,
    color: '#123D2B',
  },

  reviewsTotal: {
    fontFamily: 'InterRegular',
    fontSize: 12,
    color: '#716F68',
  },

  reviewForm: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2D5',
    marginBottom: 22,
  },

  reviewFormTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 16,
    color: '#123D2B',
  },

  reviewFormHint: {
    fontFamily: 'InterRegular',
    fontSize: 12,
    lineHeight: 18,
    color: '#716F68',
    marginTop: 5,
    marginBottom: 16,
  },

  reviewFieldLabel: {
    fontFamily: 'InterSemiBold',
    fontSize: 12,
    color: '#123D2B',
    marginBottom: 8,
    marginTop: 10,
  },

  reviewStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  reviewStarButton: {
    padding: 2,
  },

  reviewInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#E8E2D5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: 'InterRegular',
    fontSize: 13,
    color: '#123D2B',
    backgroundColor: '#FDFCF9',
  },

  reviewTextArea: {
    minHeight: 105,
  },

  reviewError: {
    color: '#B42318',
    fontFamily: 'InterRegular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },

  reviewSuccess: {
    color: '#176B43',
    fontFamily: 'InterRegular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },

  reviewSubmitButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#123D2B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  reviewSubmitDisabled: {
    opacity: 0.65,
  },

  reviewSubmitText: {
    fontFamily: 'InterSemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },

  reviewApprovalNote: {
    fontFamily: 'InterRegular',
    fontSize: 11,
    lineHeight: 17,
    color: '#716F68',
    marginTop: 10,
  },

  reviewList: {
    gap: 12,
  },

  reviewListTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 15,
    color: '#123D2B',
    marginBottom: 2,
  },

  reviewEmpty: {
    fontFamily: 'InterRegular',
    fontSize: 13,
    lineHeight: 20,
    color: '#716F68',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F0EDE5',
  },

  reviewCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E2D5',
  },

  reviewCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  reviewRatingStars: {
    flexDirection: 'row',
    gap: 2,
  },

  reviewDate: {
    fontFamily: 'InterRegular',
    fontSize: 10,
    color: '#716F68',
  },

  reviewCardTitle: {
    fontFamily: 'InterSemiBold',
    fontSize: 14,
    color: '#123D2B',
    marginTop: 10,
  },

  reviewCardText: {
    fontFamily: 'InterRegular',
    fontSize: 13,
    lineHeight: 20,
    color: '#56574F',
    marginTop: 6,
  },

  // --------------------------------------------------------
  // RELATED PRODUCTS
  // --------------------------------------------------------
  relatedSection: {
    marginTop: 34,
    paddingHorizontal: 16,
  },

  relatedHeader: {
    marginBottom: 16,
  },

  relatedEyebrow: {
    fontFamily: 'InterSemiBold',
    fontSize: 9,
    letterSpacing: 2,
    color: '#D9A52E',
  },

  relatedTitle: {
    marginTop: 4,
    fontFamily: 'PlayfairSemiBold',
    fontSize: 22,
    color: '#123D2B',
  },

  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
