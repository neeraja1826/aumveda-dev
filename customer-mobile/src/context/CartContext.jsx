import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  getCart,
  saveCart,
  clearCartStorage,
  GUEST_CART_OWNER_KEY,
} from '../utils/storage';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const {
    isAuthenticated,
    user,
    loading: isAuthLoading,
  } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [loadedCartOwner, setLoadedCartOwner] = useState(null);

  const cartOwnerId = isAuthenticated
    ? user?.id ?? user?.email ?? null
    : GUEST_CART_OWNER_KEY;
  const cartOwnerKey = cartOwnerId == null
    ? null
    : String(cartOwnerId);

  // -----------------------------------------
  // LOAD CART
  // -----------------------------------------

  useEffect(() => {
    let mounted = true;

    if (isAuthLoading) {
      return () => {
        mounted = false;
      };
    }

    if (!cartOwnerKey) {
      console.error(
        'Cannot load saved cart: authenticated user has no ID or email.'
      );

      return () => {
        mounted = false;
      };
    }

    const loadStoredCart = async () => {
      try {
        const storedCart = await getCart(cartOwnerKey);
        let nextCart = Array.isArray(storedCart) ? storedCart : [];

        if (isAuthenticated && cartOwnerKey !== GUEST_CART_OWNER_KEY) {
          const guestCart = await getCart(GUEST_CART_OWNER_KEY);
          if (Array.isArray(guestCart) && guestCart.length > 0) {
            const mergedCart = new Map(
              nextCart.map((item) => [item.itemKey, item])
            );
            for (const item of guestCart) {
              const existing = mergedCart.get(item.itemKey);
              mergedCart.set(
                item.itemKey,
                existing
                  ? {
                      ...existing,
                      ...item,
                      quantity:
                        Number(existing.quantity || 0) +
                        Number(item.quantity || 0),
                    }
                  : item
              );
            }
            nextCart = [...mergedCart.values()];
            await saveCart(nextCart, cartOwnerKey);
            await clearCartStorage(GUEST_CART_OWNER_KEY);
          }
        }

        if (mounted) {
          setCartItems(nextCart);
          setLoadedCartOwner(cartOwnerKey);
        }
      } catch (error) {
        console.error(
          'Cart loading error:',
          error
        );
      } finally {
        if (mounted) {
          setIsCartLoaded(true);
        }
      }
    };

    loadStoredCart();

    return () => {
      mounted = false;
    };
  }, [cartOwnerKey, isAuthenticated, isAuthLoading]);

  // -----------------------------------------
  // SAVE CART
  // -----------------------------------------

  useEffect(() => {
    if (
      isAuthLoading ||
      !cartOwnerKey ||
      !isCartLoaded ||
      loadedCartOwner !== cartOwnerKey
    ) {
      return;
    }

    saveCart(cartItems, cartOwnerKey).catch((error) => {
      console.error(
        'Cart save error:',
        error
      );
    });
  }, [
    cartItems,
    cartOwnerKey,
    isAuthLoading,
    isAuthenticated,
    isCartLoaded,
    loadedCartOwner,
  ]);

  // -----------------------------------------
  // ADD TO CART
  // -----------------------------------------

  const addToCart = (
    product,
    quantity = 1,
    variant = null
  ) => {
    if (!product?.id) {
      console.warn(
        'Cannot add product without id'
      );
      return;
    }

    const variantId =
      variant?.id ??
      product?.variant?.id ??
      null;

    const itemKey =
      `${product.id}-${variantId ?? 'default'}`;

    setCartItems((currentItems) => {
      const existingIndex =
        currentItems.findIndex(
          (item) =>
            item.itemKey === itemKey
        );

      // ---------------------------------------
      // EXISTING PRODUCT
      // ---------------------------------------

      if (existingIndex !== -1) {
        const updatedItems = [
          ...currentItems,
        ];

        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],

          description:
            updatedItems[existingIndex].description ??
            product?.description ??
            product?.short_description ??
            null,

          quantity:
            Number(
              updatedItems[existingIndex]
                .quantity || 0
            ) +
            Number(quantity || 1),
        };

        return updatedItems;
      }

      // ---------------------------------------
      // PRICE
      // ---------------------------------------

      const price =
        variant?.price ??
        product?.price ??
        product?.variant?.price ??
        0;

      // ---------------------------------------
      // IMAGE
      // ---------------------------------------

      const image =
        product?.image ??
        product?.image_url ??
        product?.thumbnail ??
        product?.images?.[0] ??
        null;

      // ---------------------------------------
      // NEW CART ITEM
      // ---------------------------------------

      const newItem = {
        itemKey,

        productId: product.id,

        variantId,

        name:
          product?.name ??
          'Product',

        description:
          product?.description ??
          product?.short_description ??
          null,

        slug:
          product?.slug ??
          null,

        image,

        price:
          Number(price || 0),

        quantity:
          Number(quantity || 1),

        variantName:
          variant?.name ??
          variant?.title ??
          product?.variant?.name ??
          null,
      };

      return [
        ...currentItems,
        newItem,
      ];
    });
  };

  // -----------------------------------------
  // UPDATE QUANTITY
  // -----------------------------------------

  const updateQuantity = (
    itemKey,
    quantity
  ) => {
    const newQuantity =
      Number(quantity || 0);

    if (newQuantity <= 0) {
      removeFromCart(itemKey);
      return;
    }

    setCartItems(
      (currentItems) =>
        currentItems.map((item) =>
          item.itemKey === itemKey
            ? {
                ...item,
                quantity:
                  newQuantity,
              }
            : item
        )
    );
  };

  // -----------------------------------------
  // INCREASE QUANTITY
  // -----------------------------------------

  const increaseQuantity = (
    itemKey
  ) => {
    setCartItems(
      (currentItems) =>
        currentItems.map((item) =>
          item.itemKey === itemKey
            ? {
                ...item,
                quantity:
                  Number(
                    item.quantity || 0
                  ) + 1,
              }
            : item
        )
    );
  };

  // -----------------------------------------
  // DECREASE QUANTITY
  // -----------------------------------------

  const decreaseQuantity = (
    itemKey
  ) => {
    setCartItems(
      (currentItems) =>
        currentItems
          .map((item) =>
            item.itemKey === itemKey
              ? {
                  ...item,
                  quantity:
                    Number(
                      item.quantity || 0
                    ) - 1,
                }
              : item
          )
          .filter(
            (item) =>
              Number(
                item.quantity || 0
              ) > 0
          )
    );
  };

  // -----------------------------------------
  // REMOVE FROM CART
  // -----------------------------------------

  const removeFromCart = (
    itemKey
  ) => {
    setCartItems(
      (currentItems) =>
        currentItems.filter(
          (item) =>
            item.itemKey !== itemKey
        )
    );
  };

  // -----------------------------------------
  // CLEAR CART
  // -----------------------------------------

  const clearCart = async () => {
    setCartItems([]);

    if (!cartOwnerKey) {
      return;
    }

    try {
      await clearCartStorage(cartOwnerKey);
    } catch (error) {
      console.error(
        'Clear cart storage error:',
        error
      );
    }
  };

  // -----------------------------------------
  // CART COUNT
  // -----------------------------------------

  const cartReady =
    !isAuthLoading &&
    isCartLoaded &&
    loadedCartOwner === cartOwnerKey;

  const visibleCartItems = cartReady
    ? cartItems
    : [];

  const isEmpty =
    visibleCartItems.length === 0;

  // -----------------------------------------
  // CONTEXT VALUE
  // -----------------------------------------

  const value = {
    cartItems: visibleCartItems,
    cartCount: visibleCartItems.reduce(
      (total, item) =>
        total + Number(item?.quantity || 0),
      0
    ),
    subtotal: visibleCartItems.reduce(
      (total, item) =>
        total +
        Number(item?.price || 0) *
          Number(item?.quantity || 0),
      0
    ),
    isEmpty,
    isCartLoaded: cartReady,
    addToCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  };

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

// -----------------------------------------
// HOOK
// -----------------------------------------

export function useCart() {
  const context =
    useContext(CartContext);

  if (context === null) {
    throw new Error(
      'useCart must be used inside CartProvider'
    );
  }

  return context;
}