import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  addCartItem,
  clearCart as clearRemoteCart,
  getCart as getRemoteCart,
  removeCartItem,
  updateCartItem,
} from '../services/cartService';
import {
  clearCartStorage,
  getCart as getStoredCart,
} from '../utils/storage';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

function getCartLines(items) {
  if (!Array.isArray(items)) {
    throw new Error('The saved cart was not in the expected format.');
  }

  return items.map((item) => {
    const variantId =
      item?.variantId ??
      item?.variant_id ??
      item?.variant?.id;
    const quantity = Number(item?.quantity);

    if (!variantId || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error(
        'A saved cart item is missing a valid product variant or quantity.'
      );
    }

    return {
      variantId: String(variantId),
      quantity,
    };
  });
}

function mergeCartLines(serverLines, storedLines) {
  const merged = new Map(
    serverLines.map((line) => [line.variantId, { ...line }])
  );

  for (const line of storedLines) {
    const existing = merged.get(line.variantId);
    merged.set(
      line.variantId,
      existing
        ? {
            ...existing,
            quantity: Math.max(existing.quantity, line.quantity),
          }
        : { ...line }
    );
  }

  return [...merged.values()];
}

function normalizeCartResponse(response) {
  if (!Array.isArray(response?.items)) {
    throw new Error('The server cart response was not in the expected format.');
  }

  return response.items.map((item) => {
    const product = item?.product ?? {};
    const variant = item?.variant ?? {};
    const productId = product.id ?? item?.productId ?? item?.product_id;
    const variantId =
      item?.variant_id ??
      item?.variantId ??
      variant.id;

    if (!item?.id || !productId || !variantId) {
      throw new Error('A server cart item is missing product information.');
    }

    return {
      ...item,
      id: String(item.id),
      itemKey: String(item.id),
      productId,
      variantId: String(variantId),
      name: product.name ?? item.name ?? 'Product',
      description:
        product.short_description ??
        product.description ??
        item.description ??
        null,
      slug: product.slug ?? item.slug ?? null,
      image:
        product.image ??
        product.image_url ??
        product.thumbnail ??
        item.image ??
        null,
      price: Number(variant.price ?? item.price ?? 0),
      quantity: Number(item.quantity),
      variantName: variant.name ?? item.variantName ?? null,
      variant: {
        ...variant,
        id: String(variantId),
        price: Number(variant.price ?? item.price ?? 0),
      },
    };
  });
}

async function replaceRemoteCart(token, lines) {
  await clearRemoteCart(token);
  let response = await getRemoteCart(token);

  for (const line of lines) {
    response = await addCartItem({
      token,
      variantId: line.variantId,
      quantity: line.quantity,
    });
  }

  if (!Array.isArray(response?.items)) {
    throw new Error('The server cart response was not in the expected format.');
  }

  return response;
}

async function migrateStoredCart(token, userId, serverCart) {
  if (!userId) return serverCart;

  const storedItems = await getStoredCart(userId);
  if (!storedItems.length) return serverCart;

  const previousLines = getCartLines(serverCart.items);
  const mergedLines = mergeCartLines(
    previousLines,
    getCartLines(storedItems)
  );

  try {
    const migratedCart = await replaceRemoteCart(token, mergedLines);
    await clearCartStorage(userId);
    return migratedCart;
  } catch (migrationError) {
    try {
      await replaceRemoteCart(token, previousLines);
    } catch (restoreError) {
      throw new Error(
        `${migrationError.message} The previous server cart could not be restored: ${restoreError.message}`,
        { cause: migrationError }
      );
    }

    throw migrationError;
  }
}

export function CartProvider({ children }) {
  const {
    isAuthenticated,
    user,
    token,
    loading: isAuthLoading,
  } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [cartError, setCartError] = useState('');
  const cartItemsRef = useRef([]);
  const mutationQueueRef = useRef(Promise.resolve());
  const loadRequestRef = useRef(0);
  const localCartOwnerId = user?.id ?? user?.email ?? null;

  const updateCartItems = useCallback((items) => {
    cartItemsRef.current = items;
    setCartItems(items);
  }, []);

  const reloadCart = useCallback(async () => {
    if (isAuthLoading) return;

    const requestId = ++loadRequestRef.current;
    const isCurrentRequest = () =>
      requestId === loadRequestRef.current;

    setIsCartLoaded(false);
    setCartError('');
    updateCartItems([]);

    try {
      if (!isAuthenticated || !token) {
        if (isCurrentRequest()) setIsCartLoaded(true);
        return;
      }

      let response = await getRemoteCart(token);
      if (!Array.isArray(response?.items)) {
        throw new Error('The server cart response was not in the expected format.');
      }

      response = await migrateStoredCart(
        token,
        localCartOwnerId,
        response
      );
      if (isCurrentRequest()) {
        updateCartItems(normalizeCartResponse(response));
      }
    } catch (error) {
      console.error('Cart loading error:', error);
      if (isCurrentRequest()) {
        setCartError(error?.message || 'Unable to load your cart.');
      }
    } finally {
      if (isCurrentRequest()) setIsCartLoaded(true);
    }
  }, [
    isAuthLoading,
    isAuthenticated,
    token,
    localCartOwnerId,
    updateCartItems,
  ]);

  useEffect(() => {
    // The async loader owns cart state updates after its API calls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reloadCart();
  }, [reloadCart]);

  const runCartMutation = useCallback(
    (operation) => {
      const queuedMutation = mutationQueueRef.current.then(async () => {
        if (!isAuthenticated || !token) return false;

        setCartError('');
        const response = await operation();
        updateCartItems(normalizeCartResponse(response));
        return true;
      });

      mutationQueueRef.current = queuedMutation.catch(() => undefined);

      return queuedMutation.catch((error) => {
        console.error('Cart update failed:', error);
        setCartError(error?.message || 'Unable to update your cart.');
        return false;
      });
    },
    [isAuthenticated, token, updateCartItems]
  );

  const addToCart = useCallback(
    (product, quantity = 1, variant = null) =>
      runCartMutation(() => {
        const variantId =
          variant?.id ??
          product?.variant?.id ??
          product?.variant_id;

        if (!product?.id || !variantId) {
          throw new Error('Product and variant information are required.');
        }

        const itemQuantity = Number(quantity);
        if (!Number.isInteger(itemQuantity) || itemQuantity < 1) {
          throw new Error('Select a valid product quantity.');
        }

        return addCartItem({
          token,
          variantId,
          quantity: itemQuantity,
        });
      }),
    [runCartMutation, token]
  );

  const removeFromCart = useCallback(
    (itemKey) =>
      runCartMutation(() => {
        const item = cartItemsRef.current.find(
          (cartItem) => cartItem.itemKey === String(itemKey)
        );
        if (!item) {
          return { items: cartItemsRef.current };
        }

        return removeCartItem(token, item.id);
      }),
    [runCartMutation, token]
  );

  const updateQuantity = useCallback(
    (itemKey, quantity) => {
      const newQuantity = Number(quantity);
      if (newQuantity <= 0) return removeFromCart(itemKey);

      return runCartMutation(() => {
        if (!Number.isInteger(newQuantity)) {
          throw new Error('Select a valid product quantity.');
        }

        const item = cartItemsRef.current.find(
          (cartItem) => cartItem.itemKey === String(itemKey)
        );
        if (!item) {
          return { items: cartItemsRef.current };
        }

        return updateCartItem(token, item.id, newQuantity);
      });
    },
    [removeFromCart, runCartMutation, token]
  );

  const increaseQuantity = useCallback(
    (itemKey) =>
      runCartMutation(() => {
        const item = cartItemsRef.current.find(
          (cartItem) => cartItem.itemKey === String(itemKey)
        );
        if (!item) {
          return { items: cartItemsRef.current };
        }

        return updateCartItem(
          token,
          item.id,
          Number(item.quantity) + 1
        );
      }),
    [runCartMutation, token]
  );

  const decreaseQuantity = useCallback(
    (itemKey) =>
      runCartMutation(() => {
        const item = cartItemsRef.current.find(
          (cartItem) => cartItem.itemKey === String(itemKey)
        );
        if (!item) {
          return { items: cartItemsRef.current };
        }

        if (Number(item.quantity) <= 1) {
          return removeCartItem(token, item.id);
        }

        return updateCartItem(
          token,
          item.id,
          Number(item.quantity) - 1
        );
      }),
    [runCartMutation, token]
  );

  const clearCart = useCallback(
    () =>
      runCartMutation(async () => {
        const response = await clearRemoteCart(token);
        if (localCartOwnerId) {
          await clearCartStorage(localCartOwnerId);
        }
        return response;
      }),
    [runCartMutation, token, localCartOwnerId]
  );

  const value = {
    cartItems,
    cartCount: cartItems.reduce(
      (total, item) => total + Number(item?.quantity || 0),
      0
    ),
    subtotal: cartItems.reduce(
      (total, item) =>
        total +
        Number(item?.price || 0) * Number(item?.quantity || 0),
      0
    ),
    isEmpty: cartItems.length === 0,
    isCartLoaded,
    cartError,
    reloadCart,
    addToCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (context === null) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
}
