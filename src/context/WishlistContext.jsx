import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

/* ================================================= */
/* LOAD INITIAL WISHLIST FROM localStorage */
/* ================================================= */
const getInitialWishlist = () => {
  try {
    const stored = localStorage.getItem("wishlistItems");
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error("Failed to load wishlist from localStorage", err);
    return [];
  }
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState(getInitialWishlist);

  /* ================================================= */
  /* SAVE TO localStorage */
  /* ================================================= */
  useEffect(() => {
    localStorage.setItem(
      "wishlistItems",
      JSON.stringify(wishlistItems)
    );
  }, [wishlistItems]);

  /* ================================================= */
  /* ✅ ADD TO WISHLIST (UPLOAD PRODUCT DETAILS FIX) */
  /* ================================================= */
  const addToWishlist = (product) => {
    if (!product?.id) return;

    setWishlistItems((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev;

      const normalized = {
        id: product.id,

        // ✅ NAME FIX
        name:
          product.productName ??
          product.name ??
          "Unnamed Product",

        // ✅ PRICE FIX
        price:
          Number(product.productPrice ??
          product.price ??
          0),

        // ✅ IMAGE FIX
        image:
          product.productImages?.[0] ??
          product.image ??
          product.images?.[0] ??
          "/placeholder-product.png",
      };

      return [...prev, normalized];
    });
  };

  /* ================================================= */
  /* REMOVE FROM WISHLIST */
  /* ================================================= */
  const removeFromWishlist = (id) => {
    setWishlistItems((prev) =>
      prev.filter((p) => p.id !== id)
    );
  };

  /* ================================================= */
  /* CLEAR WISHLIST */
  /* ================================================= */
  const clearWishlist = () => {
    setWishlistItems([]);
    localStorage.removeItem("wishlistItems");
  };

  /* ================================================= */
  /* CONTEXT VALUE */
  /* ================================================= */
  const value = useMemo(
    () => ({
      wishlistItems,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      wishlistCount: wishlistItems.length,
    }),
    [wishlistItems]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};