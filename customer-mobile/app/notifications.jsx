import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useAuth } from '../src/context/AuthContext';
import {
  getCustomerNotifications,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
} from '../src/services/notificationService';
import { colors } from '../src/theme/colors';

const PAGE_SIZE = 20;

function formatNotificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatNotificationType(value) {
  return String(value || 'account update')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getNotificationDestination(notification) {
  if (notification.reference_type === 'order' && notification.reference_id) {
    return `/orders/${encodeURIComponent(notification.reference_id)}`;
  }

  if (notification.reference_type === 'return_request') {
    return '/orders';
  }

  return null;
}

function NotificationHeader({ onBack, unreadCount }) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeHeaderArea}>
      <LinearGradient
        colors={['#EBF5EA', '#DEEFE0', '#D3E7D5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            hitSlop={10}
            style={({ pressed }) => [
              styles.circleButton,
              pressed && styles.circleButtonPressed,
            ]}
          >
            <Ionicons name="arrow-back" size={18} color={colors.primary} />
          </Pressable>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerEyebrow}>YOUR AUMVEDA ACCOUNT</Text>
            <Text style={styles.pageTitle}>Notifications</Text>
          </View>

          <View
            style={styles.countBadge}
            accessible
            accessibilityLabel={`${unreadCount} unread notifications`}
          >
            <Ionicons
              name="notifications-outline"
              size={13}
              color={colors.primary}
            />
            {unreadCount > 0 && (
              <Text style={styles.countBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function mergeNotifications(previous, incoming) {
  const seen = new Set();
  return [...incoming, ...previous].filter((notification) => {
    const id = String(notification.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const userId = user?.id;
  const loadedRef = useRef(false);
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const selectedNotification = notifications.find(
    (notification) => String(notification.id) === selectedNotificationId,
  );

  const loadLatest = useCallback(
    async ({ signal, showSpinner = false } = {}) => {
      if (!userId) return;
      if (!loadedRef.current) setLoading(true);
      if (showSpinner) setRefreshing(true);

      try {
        const result = await getCustomerNotifications({
          limit: PAGE_SIZE,
          signal,
        });

        setNotifications((previous) =>
          mergeNotifications(previous, result.items),
        );
        setTotal(result.total);
        setUnreadCount(result.unreadCount);
        setError('');
        loadedRef.current = true;
      } catch (requestError) {
        if (requestError?.name !== 'AbortError') {
          console.error('Unable to load customer notifications:', requestError);
          setError(
            requestError?.message || 'Unable to load notifications right now.',
          );
          loadedRef.current = true;
        }
      } finally {
        setLoading(false);
        if (showSpinner) setRefreshing(false);
      }
    },
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated || !userId) return undefined;

      let active = true;
      const controller = new AbortController();
      const refresh = (showSpinner = false) => {
        if (active) {
          void loadLatest({
            signal: controller.signal,
            showSpinner,
          });
        }
      };
      const refreshOnAppActive = (state) => {
        if (state === 'active') refresh();
      };

      refresh();
      const intervalId = setInterval(refresh, 30_000);
      const appStateSubscription = AppState.addEventListener(
        'change',
        refreshOnAppActive,
      );

      return () => {
        active = false;
        controller.abort();
        clearInterval(intervalId);
        appStateSubscription.remove();
      };
    }, [isAuthenticated, loadLatest, userId])
  );

  async function loadMoreNotifications() {
    if (loadingMore || notifications.length >= total) return;

    setLoadingMore(true);
    try {
      const result = await getCustomerNotifications({
        limit: PAGE_SIZE,
        offset: notifications.length,
      });
      setNotifications((previous) => {
        const existingIds = new Set(
          previous.map((notification) => String(notification.id)),
        );
        return [
          ...previous,
          ...result.items.filter(
            (notification) => !existingIds.has(String(notification.id)),
          ),
        ];
      });
      setTotal(result.total);
      setUnreadCount(result.unreadCount);
      setError('');
    } catch (requestError) {
      console.error('Unable to load more notifications:', requestError);
      setError(
        requestError?.message || 'Unable to load more notifications right now.',
      );
    } finally {
      setLoadingMore(false);
    }
  }

  async function openNotification(notification) {
    setSelectedNotificationId(String(notification.id));
    if (notification.is_read) return;

    try {
      await markCustomerNotificationRead(notification.id);
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      );
      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (requestError) {
      console.error('Unable to mark notification as read:', requestError);
      Alert.alert(
        'Unable to update notification',
        requestError?.message || 'Please try again.',
      );
    }
  }

  async function markAllRead() {
    try {
      await markAllCustomerNotificationsRead();
      setNotifications((previous) =>
        previous.map((item) => ({ ...item, is_read: true })),
      );
      setUnreadCount(0);
      setError('');
    } catch (requestError) {
      console.error('Unable to mark all notifications as read:', requestError);
      Alert.alert(
        'Unable to update notifications',
        requestError?.message || 'Please try again.',
      );
    }
  }

  function openRelatedPage() {
    if (!selectedNotification) return;

    const destination = getNotificationDestination(selectedNotification);
    if (!destination) return;

    setSelectedNotificationId(null);
    router.push(destination);
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }

  if (authLoading) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <NotificationHeader onBack={handleBack} unreadCount={unreadCount} />
        <SafeAreaView edges={['bottom']} style={styles.contentSafeArea}>
          <View style={styles.center}>
            <View style={styles.stateCard}>
              <View style={styles.stateIconOuter}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
              <Text style={styles.stateText}>Loading your account...</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <StatusBar style="dark" />
        <NotificationHeader onBack={handleBack} unreadCount={0} />
        <SafeAreaView edges={['bottom']} style={styles.contentSafeArea}>
          <View style={styles.center}>
            <View style={styles.stateCard}>
              <View style={styles.stateIconOuter}>
                <View style={styles.stateIconInner}>
                  <Ionicons
                    name="notifications-outline"
                    size={29}
                    color={colors.primary}
                  />
                </View>
              </View>
              <Text style={styles.emptyTitle}>Sign In to View Notifications</Text>
              <Text style={styles.stateText}>
                Your order and account updates are securely linked to your
                Aumveda account.
              </Text>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/login',
                    params: { returnTo: '/notifications' },
                  })
                }
              >
                <Text style={styles.actionButtonText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <NotificationHeader
        onBack={handleBack}
        unreadCount={unreadCount}
      />

      <SafeAreaView edges={['bottom']} style={styles.contentSafeArea}>
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadLatest({ showSpinner: true })}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
         
  
        

          {error ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={colors.danger}
              />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => loadLatest({ showSpinner: true })}
                hitSlop={8}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionEyebrow}>YOUR INBOX</Text>
              <Text style={styles.sectionTitle}>Recent Updates</Text>
            </View>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>{total}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.stateText}>Loading notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.stateCard}>
              <View style={styles.stateIconOuter}>
                <View style={styles.stateIconInner}>
                  <Ionicons
                    name="notifications-outline"
                    size={29}
                    color={colors.primary}
                  />
                </View>
              </View>
              <Text style={styles.emptyTitle}>No Notifications Yet</Text>
              <Text style={styles.stateText}>
                We&apos;ll let you know when there is an update on your order or
                account.
              </Text>
            </View>
          ) : (
            <>
              {notifications.map((notification) => (
                <Pressable
                  key={notification.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${notification.title}. ${notification.message}${
                    notification.is_read ? '' : '. Unread'
                  }`}
                  onPress={() => openNotification(notification)}
                  style={({ pressed }) => [
                    styles.notificationCard,
                    !notification.is_read && styles.notificationUnread,
                    pressed && styles.notificationPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.notificationIcon,
                      !notification.is_read && styles.notificationIconUnread,
                    ]}
                  >
                    <Ionicons
                      name={
                        notification.is_read
                          ? 'checkmark-done-outline'
                          : 'notifications-outline'
                      }
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.notificationCopy}>
                    <View style={styles.notificationMeta}>
                      <Text style={styles.notificationType}>
                        {formatNotificationType(notification.notification_type)}
                      </Text>
                      {!notification.is_read && (
                        <Text style={styles.unreadLabel}>NEW</Text>
                      )}
                    </View>
                    <Text style={styles.notificationTitle}>
                      {notification.title || 'Notification'}
                    </Text>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {notification.message || ''}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatNotificationTime(notification.created_at)}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color="#A3A89F"
                    style={styles.notificationChevron}
                  />
                </Pressable>
              ))}

              {notifications.length < total && (
                <Pressable
                  accessibilityRole="button"
                  onPress={loadMoreNotifications}
                  disabled={loadingMore}
                  style={({ pressed }) => [
                    styles.loadMoreButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Text style={styles.loadMoreText}>
                        Load older notifications
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={15}
                        color={colors.primary}
                      />
                    </>
                  )}
                </Pressable>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        animationType="slide"
        transparent
        visible={Boolean(selectedNotification)}
        onRequestClose={() => setSelectedNotificationId(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close notification details"
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedNotificationId(null)}
          />
          <View style={styles.detailSheet}>
            <View style={styles.detailHandle} />
            <View style={styles.detailHeader}>
              <View style={styles.detailIconOuter}>
                <Ionicons
                  name="notifications-outline"
                  size={19}
                  color={colors.primary}
                />
              </View>
              <View style={styles.detailHeaderCopy}>
                <Text style={styles.detailEyebrow}>
                  {formatNotificationType(
                    selectedNotification?.notification_type,
                  )}
                </Text>
                <Text style={styles.detailStatus}>
                  {selectedNotification?.is_read ? 'Read update' : 'New update'}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setSelectedNotificationId(null)}
                hitSlop={10}
                style={styles.detailClose}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.detailTitle}>
              {selectedNotification?.title || 'Notification'}
            </Text>
            <Text style={styles.detailTime}>
              {formatNotificationTime(selectedNotification?.created_at)}
            </Text>
            <ScrollView style={styles.detailMessageScroll}>
              <Text style={styles.detailMessage}>
                {selectedNotification?.message || ''}
              </Text>
            </ScrollView>
            {selectedNotification &&
              getNotificationDestination(selectedNotification) && (
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={openRelatedPage}
                >
                  <Text style={styles.actionButtonText}>
                    {selectedNotification.reference_type === 'order'
                      ? 'View Order'
                      : 'View My Orders'}
                  </Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </Pressable>
              )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  safeHeaderArea: {
    backgroundColor: '#EBF5EA',
  },
  headerGradient: {
    width: '100%',
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderColor: '#CDE2CB',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    minHeight: 46,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  circleButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.85,
  },
  headerTitleGroup: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerEyebrow: {
    color: '#65776C',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 1,
  },
  pageTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  countBadge: {
    minWidth: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CDE2CB',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  countBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  contentSafeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  stateCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 12,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAE5DC',
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stateIconOuter: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    borderRadius: 32,
    backgroundColor: '#EAF5EA',
  },
  stateIconInner: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1.5,
  },
  emptyTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 5,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 20,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDE8D9',
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 2,
  },
  summaryIconOuter: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#EAF5EA',
  },
  summaryIconInner: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.white,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryMessage: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  markAllButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
    paddingVertical: 3,
  },
  markAllDisabled: {
    opacity: 0.6,
  },
  markAllText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  markAllTextDisabled: {
    color: colors.textLight,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8C9C0',
    backgroundColor: '#FFF8F5',
  },
  errorText: {
    flex: 1,
    color: '#974638',
    fontSize: 12,
    lineHeight: 17,
  },
  retryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 1,
  },
  sectionEyebrow: {
    color: '#8C806C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  sectionTitle: {
    marginTop: 3,
    color: colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  sectionCount: {
    minWidth: 29,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#E8F2E7',
  },
  sectionCountText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  notificationCard: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE5DC',
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.035,
    shadowRadius: 5,
    elevation: 1,
  },
  notificationUnread: {
    borderColor: '#CDE2CB',
    backgroundColor: '#FBFDF9',
  },
  notificationPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.995 }],
  },
  notificationIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F1F1EB',
  },
  notificationIconUnread: {
    backgroundColor: '#E8F2E7',
  },
  notificationCopy: {
    flex: 1,
    gap: 4,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 1,
  },
  notificationType: {
    color: '#718074',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  unreadLabel: {
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
    color: '#8B6415',
    backgroundColor: '#FFF5DF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  notificationTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  notificationMessage: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  notificationTime: {
    color: colors.textLight,
    fontSize: 10,
    marginTop: 2,
  },
  notificationChevron: {
    marginTop: 11,
  },
  loadMoreButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 2,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#DDE8D9',
    backgroundColor: colors.white,
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
  },
  detailSheet: {
    maxHeight: '82%',
    minHeight: 320,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
  },
  detailHandle: {
    width: 40,
    height: 4.5,
    alignSelf: 'center',
    marginBottom: 18,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailIconOuter: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#EAF5EA',
  },
  detailHeaderCopy: {
    flex: 1,
    gap: 3,
  },
  detailEyebrow: {
    color: '#65776C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  detailStatus: {
    color: colors.textLight,
    fontSize: 10,
  },
  detailClose: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#F4F3EF',
  },
  detailTitle: {
    marginTop: 19,
    color: colors.primary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  detailTime: {
    marginTop: 8,
    color: colors.textLight,
    fontSize: 11,
  },
  detailMessageScroll: {
    flexGrow: 0,
    maxHeight: 250,
    marginTop: 17,
    marginBottom: 14,
  },
  detailMessage: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});
