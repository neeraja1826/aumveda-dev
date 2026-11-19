import React, { useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  getChatbotCategories,
  getChatbotFAQs,
  searchChatbotFAQs,
} from '../../services/chatbotService';

import { colors } from '../../theme/colors';

const FAQChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [faqs, setFaqs] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedFAQ, setSelectedFAQ] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingFAQs, setLoadingFAQs] = useState(false);
  const [searching, setSearching] = useState(false);

  const [error, setError] = useState('');

  const floatAnimation = useRef(new Animated.Value(0)).current;

  // ------------------------------------------------------------
  // INITIAL FLOAT ANIMATION
  // Runs only when the component first appears.
  // ------------------------------------------------------------

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: -7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      {
        iterations: 3,
      }
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [floatAnimation]);

  // ------------------------------------------------------------
  // LOAD CATEGORIES
  // ------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (categories.length > 0) {
      return;
    }

    loadCategories();
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      setError('');

      const response = await getChatbotCategories();

      const data = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      setCategories(data);
    } catch (error) {
      console.error('FAQ categories error:', error);
      setError('Unable to load FAQs. Please try again.');
    } finally {
      setLoadingCategories(false);
    }
  };

  // ------------------------------------------------------------
  // LOAD FAQS
  // ------------------------------------------------------------

  const loadFAQs = async (categoryId = null) => {
    try {
      setLoadingFAQs(true);
      setError('');

      const response = await getChatbotFAQs(categoryId);

      const data = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      setFaqs(data);
    } catch (error) {
      console.error('FAQ loading error:', error);
      setFaqs([]);
      setError('Unable to load FAQs. Please try again.');
    } finally {
      setLoadingFAQs(false);
    }
  };

  // ------------------------------------------------------------
  // SEARCH
  // ------------------------------------------------------------

  const handleSearch = async (value) => {
    setSearchQuery(value);

    const query = value.trim();

    if (!query) {
      if (selectedCategory?.id) {
        await loadFAQs(selectedCategory.id);
      } else {
        await loadFAQs();
      }

      return;
    }

    try {
      setSearching(true);
      setError('');

      const response = await searchChatbotFAQs(query);

      const data = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];

      setFaqs(data);
    } catch (error) {
      console.error('FAQ search error:', error);
      setFaqs([]);
      setError('Unable to search FAQs.');
    } finally {
      setSearching(false);
    }
  };

  // ------------------------------------------------------------
  // OPEN / CLOSE
  // ------------------------------------------------------------

  const openChatbot = () => {
    Keyboard.dismiss();
    setIsOpen(true);
  };

  const closeChatbot = () => {
    Keyboard.dismiss();

    setIsOpen(false);

    setSelectedCategory(null);
    setSelectedFAQ(null);
    setSearchQuery('');
    setFaqs([]);
    setError('');
  };

  // ------------------------------------------------------------
  // CATEGORY
  // ------------------------------------------------------------

  const handleCategoryPress = async (category) => {
    Keyboard.dismiss();

    setSelectedCategory(category);
    setSelectedFAQ(null);
    setSearchQuery('');

    await loadFAQs(category?.id);
  };

  // ------------------------------------------------------------
  // BACK
  // ------------------------------------------------------------

  const handleBack = () => {
    Keyboard.dismiss();

    if (selectedFAQ) {
      setSelectedFAQ(null);
      return;
    }

    setSelectedCategory(null);
    setSearchQuery('');
    setFaqs([]);
    setError('');
  };

  // ------------------------------------------------------------
  // VIEW ALL
  // ------------------------------------------------------------

  const handleViewAll = async () => {
    Keyboard.dismiss();

    setSelectedCategory(null);
    setSelectedFAQ(null);
    setSearchQuery('');

    await loadFAQs();
  };

  // ------------------------------------------------------------
  // CATEGORY CARD
  // ------------------------------------------------------------

  const renderCategory = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(item)}
      >
        <View style={styles.categoryIcon}>
          <Ionicons
            name="help-circle-outline"
            size={20}
            color={colors.primary}
          />
        </View>

        <View style={styles.categoryContent}>
          <Text
            style={styles.categoryName}
            numberOfLines={1}
          >
            {item?.name || 'Category'}
          </Text>

          {item?.description ? (
            <Text
              style={styles.categoryDescription}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          ) : null}
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color="#8A938C"
        />
      </TouchableOpacity>
    );
  };

  // ------------------------------------------------------------
  // FAQ CARD
  // ------------------------------------------------------------

  const renderFAQ = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.faqCard}
        onPress={() => setSelectedFAQ(item)}
      >
        <View style={styles.faqIcon}>
          <Ionicons
            name="help-outline"
            size={17}
            color={colors.primary}
          />
        </View>

        <Text style={styles.faqQuestion}>
          {item?.question || 'Question'}
        </Text>

        <Ionicons
          name="chevron-forward"
          size={17}
          color="#8A938C"
        />
      </TouchableOpacity>
    );
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------

  return (
    <>
      {/* ========================================================
          FLOATING BUTTON
      ======================================================== */}

      <Animated.View
        style={[
          styles.floatingButtonContainer,
          {
            transform: [
              {
                translateY: floatAnimation,
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.floatingButton}
          onPress={openChatbot}
          accessibilityHint="Opens help topics and frequently asked questions"
          accessibilityRole="button"
          accessibilityLabel="Open frequently asked questions"
        >
          <Ionicons
            name="chatbubbles-outline"
            size={25}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </Animated.View>

      {/* ========================================================
          FAQ MODAL
      ======================================================== */}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={closeChatbot}
      >
        <View style={styles.modalRoot}>

          {/* Background overlay */}
          <Pressable
            style={styles.overlay}
            onPress={closeChatbot}
          />

          {/* FAQ PANEL */}
          <View style={styles.chatbotPanel}>
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>

            {/* ==================================================
                HEADER
            ================================================== */}

            <View style={styles.header}>

              <View style={styles.headerLeft}>

                {(selectedCategory || selectedFAQ) ? (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBack}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={20}
                      color="#26352D"
                    />
                  </TouchableOpacity>
                ) : null}

                <View style={styles.headerIcon}>
                  <Ionicons
                    name="chatbubbles"
                    size={19}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerEyebrow}>
                    AUMVEDA CARE
                  </Text>

                  <Text style={styles.headerTitle}>
                    Aumveda Help
                  </Text>

                  <View style={styles.headerStatus}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.headerSubtitle}>
                      Wellness help and FAQs
                    </Text>
                  </View>
                </View>

              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeChatbot}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color="#26352D"
                />
              </TouchableOpacity>

            </View>

            {/* ==================================================
                SEARCH
            ================================================== */}

            {!selectedFAQ ? (
              <View style={styles.searchBox}>

                <Ionicons
                  name="search-outline"
                  size={18}
                  color="#7C877F"
                />

                <TextInput
                  value={searchQuery}
                  onChangeText={handleSearch}
                  placeholder="Search your question..."
                  placeholderTextColor="#8A938C"
                  style={styles.searchInput}
                  returnKeyType="search"
                />

                {searching ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                  />
                ) : searchQuery ? (
                  <TouchableOpacity
                    onPress={() => handleSearch('')}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color="#8A938C"
                    />
                  </TouchableOpacity>
                ) : null}

              </View>
            ) : null}

            {/* ==================================================
                CONTENT
            ================================================== */}

            <View style={styles.content}>

              {/* Loading */}
              {loadingCategories || loadingFAQs ? (
                <View style={styles.centerState}>

                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                  />

                  <Text style={styles.stateText}>
                    Loading FAQs...
                  </Text>

                </View>
              ) : error ? (
                /* Error */
                <View style={styles.centerState}>

                  <View style={styles.stateIcon}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={28}
                      color={colors.primary}
                    />
                  </View>

                  <Text style={styles.stateTitle}>
                    Something went wrong
                  </Text>

                  <Text style={styles.stateText}>
                    {error}
                  </Text>

                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadCategories}
                  >
                    <Text style={styles.retryText}>
                      Try Again
                    </Text>
                  </TouchableOpacity>

                </View>
              ) : selectedFAQ ? (
                /* =================================================
                   ANSWER
                ================================================== */

                <View style={styles.answerContainer}>

                  <View style={styles.questionBox}>
                    <Text style={styles.questionLabel}>
                      QUESTION
                    </Text>

                    <Text style={styles.questionText}>
                      {selectedFAQ?.question}
                    </Text>
                  </View>

                  <View style={styles.answerBox}>

                    <View style={styles.answerHeader}>

                      <View style={styles.answerIcon}>
                        <Ionicons
                          name="information-circle-outline"
                          size={19}
                          color={colors.primary}
                        />
                      </View>

                      <Text style={styles.answerTitle}>
                        Answer
                      </Text>

                    </View>

                    <Text style={styles.answerText}>
                      {selectedFAQ?.answer}
                    </Text>

                  </View>

                </View>
              ) : selectedCategory || searchQuery ? (
                /* =================================================
                   FAQ LIST
                ================================================== */

                <View style={styles.listContainer}>

                  {selectedCategory && !searchQuery ? (
                    <View style={styles.sectionHeader}>

                      <Text style={styles.sectionTitle}>
                        {selectedCategory?.name}
                      </Text>

                      <Text style={styles.sectionSubtitle}>
                        Select a question below
                      </Text>

                    </View>
                  ) : null}

                  {faqs.length > 0 ? (
                    <FlatList
                      data={faqs}
                      keyExtractor={(item, index) =>
                        String(item?.id || index)
                      }
                      renderItem={renderFAQ}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={
                        styles.listContent
                      }
                    />
                  ) : (
                    <View style={styles.centerState}>

                      <View style={styles.stateIcon}>
                        <Ionicons
                          name="search-outline"
                          size={27}
                          color={colors.primary}
                        />
                      </View>

                      <Text style={styles.stateTitle}>
                        No FAQs found
                      </Text>

                      <Text style={styles.stateText}>
                        Try another search.
                      </Text>

                    </View>
                  )}

                </View>
              ) : (
                /* =================================================
                   CATEGORIES
                ================================================== */

                <View style={styles.listContainer}>

                  <View style={styles.sectionHeader}>

                    <Text style={styles.sectionTitle}>
                      How can we help?
                    </Text>

                    <Text style={styles.sectionSubtitle}>
                      Choose a category to find your answer
                    </Text>

                  </View>

                  {categories.length > 0 ? (
                    <FlatList
                      data={categories}
                      keyExtractor={(item, index) =>
                        String(item?.id || index)
                      }
                      renderItem={renderCategory}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={
                        styles.listContent
                      }
                      ListFooterComponent={
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={styles.viewAllButton}
                          onPress={handleViewAll}
                        >
                          <Ionicons
                            name="apps-outline"
                            size={18}
                            color={colors.primary}
                          />

                          <Text style={styles.viewAllText}>
                            View All FAQs
                          </Text>
                        </TouchableOpacity>
                      }
                    />
                  ) : (
                    <View style={styles.centerState}>

                      <View style={styles.stateIcon}>
                        <Ionicons
                          name="help-circle-outline"
                          size={28}
                          color={colors.primary}
                        />
                      </View>

                      <Text style={styles.stateTitle}>
                        No FAQ categories
                      </Text>

                      <Text style={styles.stateText}>
                        FAQ categories will appear here.
                      </Text>

                    </View>
                  )}

                </View>
              )}

            </View>

          </View>
        </View>
      </Modal>
    </>
  );
};

export default FAQChatbot;

const styles = StyleSheet.create({

  // ============================================================
  // FLOATING BUTTON
  // ============================================================

  floatingButtonContainer: {
    position: 'absolute',
    right: 18,
    bottom: 82,
    zIndex: 9999,
    elevation: 20,
  },

  floatingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.gold,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.26,
    shadowRadius: 10,

    elevation: 10,
  },

  // ============================================================
  // MODAL
  // ============================================================

  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13, 31, 21, 0.42)',
  },

  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 9,
    paddingBottom: 4,
    backgroundColor: colors.primary,
  },

  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
  },

  chatbotPanel: {
    position: 'absolute',

    left: 12,
    right: 12,
    bottom: 24,
    height: '78%',
    maxHeight: 620,

    borderRadius: 26,
    overflow: 'hidden',

    backgroundColor: '#FBFAF7',

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.24,
    shadowRadius: 22,

    elevation: 22,
  },

  // ============================================================
  // HEADER
  // ============================================================

  header: {
    minHeight: 88,

    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: colors.primary,
  },

  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 3,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#F5F1E8',

    marginRight: 10,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerEyebrow: {
    marginBottom: 2,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#D9A52E',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    backgroundColor: '#9AD2A8',
  },

  headerSubtitle: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.78)',
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(255, 255, 255, 0.13)',
  },

  // ============================================================
  // SEARCH
  // ============================================================

  searchBox: {
    height: 48,

    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,

    paddingHorizontal: 12,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#E5E9E2',
    borderRadius: 15,

    backgroundColor: '#FFFFFF',
  },

  searchInput: {
    flex: 1,

    marginLeft: 8,
    marginRight: 8,

    paddingVertical: 0,

    fontSize: 12.5,
    color: '#26352D',
  },

  // ============================================================
  // CONTENT
  // ============================================================

  content: {
    flex: 1,
    backgroundColor: '#FBFAF7',
  },

  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  sectionHeader: {
    paddingTop: 16,
    paddingBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#26352D',
  },

  sectionSubtitle: {
    marginTop: 5,

    fontSize: 12,
    color: '#7A857D',
  },

  listContent: {
    paddingBottom: 16,
  },

  // ============================================================
  // CATEGORY
  // ============================================================

  categoryCard: {
    minHeight: 72,

    marginBottom: 10,
    paddingHorizontal: 13,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#E8ECE5',
    borderRadius: 17,

    backgroundColor: '#FFFFFF',
    shadowColor: '#173F2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 1,
  },

  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,

    backgroundColor: '#F3F4E7',
  },

  categoryContent: {
    flex: 1,
  },

  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#26352D',
  },

  categoryDescription: {
    marginTop: 3,

    fontSize: 11,
    color: '#7A857D',
  },

  // ============================================================
  // FAQ
  // ============================================================

  faqCard: {
    minHeight: 68,

    marginBottom: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#E8ECE5',
    borderRadius: 16,

    backgroundColor: '#FFFFFF',
    shadowColor: '#173F2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 1,
  },

  faqIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,

    backgroundColor: '#F3F4E7',
  },

  faqQuestion: {
    flex: 1,

    marginRight: 7,

    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',

    color: '#26352D',
  },

  // ============================================================
  // VIEW ALL
  // ============================================================

  viewAllButton: {
    height: 46,

    marginTop: 2,
    marginBottom: 15,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 13,

    backgroundColor: '#FFFFFF',
  },

  viewAllText: {
    marginLeft: 7,

    fontSize: 12.5,
    fontWeight: '600',

    color: colors.primary,
  },

  // ============================================================
  // ANSWER
  // ============================================================

  answerContainer: {
    flex: 1,
    padding: 14,
  },

  questionBox: {
    padding: 14,

    marginBottom: 12,

    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,

    backgroundColor: '#EAF3E8',
  },

  questionLabel: {
    marginBottom: 6,

    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,

    color: colors.primary,
  },

  questionText: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '700',

    color: '#26352D',
  },

  answerBox: {
    padding: 15,

    borderWidth: 1,
    borderColor: '#E8ECE5',
    borderRadius: 16,

    backgroundColor: '#FFFFFF',
    shadowColor: '#173F2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },

  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 12,
  },

  answerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 9,

    backgroundColor: '#EAF3E8',
  },

  answerTitle: {
    fontSize: 14,
    fontWeight: '700',

    color: '#26352D',
  },

  answerText: {
    fontSize: 12.5,
    lineHeight: 20,

    color: '#66736B',
  },

  // ============================================================
  // STATES
  // ============================================================

  centerState: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 30,
  },

  stateIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#EAF3E8',
  },

  stateTitle: {
    marginTop: 12,

    fontSize: 14,
    fontWeight: '700',

    color: '#26352D',
  },

  stateText: {
    marginTop: 6,

    fontSize: 11.5,
    lineHeight: 17,

    textAlign: 'center',

    color: '#7A857D',
  },

  retryButton: {
    marginTop: 14,

    paddingHorizontal: 18,
    paddingVertical: 9,

    borderRadius: 10,

    backgroundColor: '#123D2B',
  },

  retryText: {
    fontSize: 11.5,
    fontWeight: '700',

    color: '#FFFFFF',
  },
});