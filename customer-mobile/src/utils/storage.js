import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY =
  '@aumveda_cart';

export const GUEST_CART_OWNER_KEY = 'guest';

const getUserCartStorageKey = (userId) => {
  if (!userId) {
    throw new Error('A user ID is required to access a saved cart.');
  }

  return `${CART_STORAGE_KEY}:${encodeURIComponent(String(userId))}`;
};

const AUTH_TOKEN_KEY =
  '@aumveda_auth_token';

export async function saveCart(
  cart,
  userId
) {
  try {
    await AsyncStorage.setItem(
      getUserCartStorageKey(userId),
      JSON.stringify(cart)
    );
  } catch (error) {
    console.error(
      'Save cart error:',
      error
    );
  }
}

export async function getCart(userId) {
  try {
    const value =
      await AsyncStorage.getItem(
        getUserCartStorageKey(userId)
      );

    if (!value) {
      return [];
    }

    return JSON.parse(value);
  } catch (error) {
    console.error(
      'Get cart error:',
      error
    );

    return [];
  }
}

export async function clearCartStorage(userId) {
  try {
    await AsyncStorage.removeItem(
      getUserCartStorageKey(userId)
    );
  } catch (error) {
    console.error(
      'Clear cart error:',
      error
    );
  }
}

const GUEST_WISHLIST_KEY = '@aumveda_guest_wishlist';

export async function getGuestWishlist() {
  try {
    const value = await AsyncStorage.getItem(GUEST_WISHLIST_KEY);
    if (!value) return [];
    const wishlist = JSON.parse(value);
    return Array.isArray(wishlist) ? wishlist : [];
  } catch (error) {
    console.error('Guest wishlist loading error:', error);
    return [];
  }
}

export async function saveGuestWishlist(wishlist) {
  try {
    await AsyncStorage.setItem(
      GUEST_WISHLIST_KEY,
      JSON.stringify(wishlist)
    );
  } catch (error) {
    console.error('Guest wishlist save error:', error);
    throw error;
  }
}

export async function clearGuestWishlist() {
  try {
    await AsyncStorage.removeItem(GUEST_WISHLIST_KEY);
  } catch (error) {
    console.error('Guest wishlist clear error:', error);
    throw error;
  }
}

const AUTH_USER_KEY = '@aumveda_auth_user';

export async function saveAuthToken(
  token
) {
  await AsyncStorage.setItem(
    AUTH_TOKEN_KEY,
    token
  );
}

export async function getAuthToken() {
  return AsyncStorage.getItem(
    AUTH_TOKEN_KEY
  );
}

export async function removeAuthToken() {
  await AsyncStorage.removeItem(
    AUTH_TOKEN_KEY
  );
}

export async function saveAuthUser(user) {
  if (!user) return;
  try {
    await AsyncStorage.setItem(
      AUTH_USER_KEY,
      JSON.stringify(user)
    );
  } catch (error) {
    console.error('Save auth user error:', error);
  }
}

export async function getAuthUser() {
  try {
    const value = await AsyncStorage.getItem(AUTH_USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Get auth user error:', error);
    return null;
  }
}

export async function removeAuthUser() {
  try {
    await AsyncStorage.removeItem(AUTH_USER_KEY);
  } catch (error) {
    console.error('Remove auth user error:', error);
  }
}