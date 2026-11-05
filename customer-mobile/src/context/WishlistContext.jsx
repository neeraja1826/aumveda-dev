import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../services/wishlistService';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

function normalizeProduct(productOrId, productData) {
  if (productOrId && typeof productOrId === 'object') {
    if (!productOrId.id) return null;
    return {
      ...productOrId,
      image:
        productOrId.image ??
        productOrId.image_url ??
        productOrId.thumbnail ??
        productOrId.images?.[0] ??
        productOrId.product_images?.find((image) => image?.is_primary)?.image_url ??
        productOrId.product_images?.[0]?.image_url ??
        null,
      price: Number(
        productOrId.price ??
        productOrId.variant?.price ??
        0
      ),
    };
  }

  if (!productOrId) return null;
  return { ...(productData || {}), id: productOrId };
}

export function WishlistProvider({ children }) {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = useCallback(async () => {
    if (authLoading) return;

    if (!isAuthenticated || !token) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const products = await getWishlist(token);
      setWishlist(Array.isArray(products) ? products : []);
    } catch (error) {
      console.error('WISHLIST: Failed to load:', error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, token]);

  useEffect(() => {
    // The async loader owns loading/data state updates after its storage/API calls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWishlist();
  }, [loadWishlist]);

  const isWishlisted = useCallback(
    (productId) => Boolean(
      productId && wishlist.some((product) => product?.id === productId)
    ),
    [wishlist]
  );

  const addProduct = useCallback(async (productOrId, productData) => {
    if (!isAuthenticated || !token) {
      return {
        success: false,
        requiresLogin: true,
      };
    }

    const product = normalizeProduct(productOrId, productData);

    if (!product) {
      return {
        success: false,
        error: new Error('A product ID is required.'),
      };
    }

    try {
      await addToWishlist(product.id, token);
      setWishlist((current) =>
        current.some((item) => item?.id === product.id)
          ? current
          : [...current, product]
      );
      return { success: true, wishlisted: true };
    } catch (error) {
      console.error('WISHLIST: Add failed:', error);
      return { success: false, error };
    }
  }, [isAuthenticated, token]);

  const removeProduct = useCallback(async (productId) => {
    if (!isAuthenticated || !token) {
      return {
        success: false,
        requiresLogin: true,
      };
    }

    if (!productId) {
      return {
        success: false,
        error: new Error('A product ID is required.'),
      };
    }

    try {
      await removeFromWishlist(productId, token);
      setWishlist((current) =>
        current.filter((product) => product?.id !== productId)
      );
      return { success: true };
    } catch (error) {
      console.error('WISHLIST: Remove failed:', error);
      return { success: false, error };
    }
  }, [isAuthenticated, token]);

  const toggleWishlist = useCallback(async (productOrId, productData) => {
    const product = normalizeProduct(productOrId, productData);
    if (!product) {
      return { success: false, error: new Error('A product ID is required.') };
    }

    const currentlyWishlisted = wishlist.some(
      (item) => item?.id === product.id
    );
    if (currentlyWishlisted) {
      const result = await removeProduct(product.id);
      return result.success
        ? { ...result, wishlisted: false }
        : result;
    }

    return addProduct(product);
  }, [addProduct, removeProduct, wishlist]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        isWishlisted,
        addProduct,
        removeProduct,
        toggleWishlist,
        loadWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used inside WishlistProvider');
  }
  return context;
}
