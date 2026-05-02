import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
} from "react";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const CartContext = createContext();

/* ================================================= */
/* LOAD INITIAL STATE FROM localStorage */
/* ================================================= */
const getInitialCart = () => {
  try {
    const storedCart = localStorage.getItem("cartItems");
    return storedCart ? JSON.parse(storedCart) : [];
  } catch (e) {
    console.error("Failed to load cart from localStorage", e);
    return [];
  }
};

/* ================================================= */
/* CART REDUCER */
/* ================================================= */
const cartReducer = (state, action) => {
  switch (action.type) {
    case "SET_CART":
      return action.payload;

    case "ADD_ITEM": {
      const { id, selectedSize } = action.payload;
      const key = `${id}-${selectedSize}`;

      const existing = state.find(
        (item) => `${item.id}-${item.selectedSize}` === key
      );

      if (existing) {
        return state.map((item) =>
          `${item.id}-${item.selectedSize}` === key
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [...state, { ...action.payload, qty: 1 }];
    }

    case "UPDATE_QTY": {
      const { id, selectedSize, qty } = action.payload;
      const key = `${id}-${selectedSize}`;

      if (qty <= 0) {
        return state.filter(
          (item) => `${item.id}-${item.selectedSize}` !== key
        );
      }

      return state.map((item) =>
        `${item.id}-${item.selectedSize}` === key
          ? { ...item, qty }
          : item
      );
    }

    case "REMOVE_ITEM": {
      const { id, selectedSize } = action.payload;
      const key = `${id}-${selectedSize}`;

      return state.filter(
        (item) => `${item.id}-${item.selectedSize}` !== key
      );
    }

    case "CLEAR_CART":
      return [];

    default:
      return state;
  }
};

/* ================================================= */
/* CART PROVIDER */
/* ================================================= */
export const CartProvider = ({ children }) => {
  const [cartItems, dispatch] = useReducer(
    cartReducer,
    [],
    getInitialCart
  );

  /* ================================================= */
  /* LOAD CART FROM FIREBASE ON LOGIN */
  /* ================================================= */
  useEffect(() => {
    const loadCartFromFirebase = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const cartRef = collection(db, "users", user.uid, "cart");
        const snapshot = await getDocs(cartRef);

        const items = snapshot.docs.map((doc) => doc.data());
        dispatch({ type: "SET_CART", payload: items });
      } catch (error) {
        console.error("Failed to load cart from Firebase", error);
      }
    };

    loadCartFromFirebase();
  }, []);

  /* ================================================= */
  /* SAVE CART TO FIREBASE + localStorage */
  /* ================================================= */
  useEffect(() => {
    const saveCart = async () => {
      localStorage.setItem("cartItems", JSON.stringify(cartItems));

      const user = auth.currentUser;
      if (!user) return;

      try {
        const cartRef = collection(db, "users", user.uid, "cart");

        // Clear old cart
        const existing = await getDocs(cartRef);
        await Promise.all(existing.docs.map((d) => deleteDoc(d.ref)));

        // Save new cart
        await Promise.all(
          cartItems.map((item) =>
            setDoc(
              doc(
                db,
                "users",
                user.uid,
                "cart",
                `${item.id}-${item.selectedSize}`
              ),
              item
            )
          )
        );
      } catch (error) {
        console.error("Failed to save cart to Firebase", error);
      }
    };

    saveCart();
  }, [cartItems]);

  /* ================================================= */
  /* ACTIONS (🔥 SIZE GUARANTEED) */
  /* ================================================= */
  const addToCart = (product, selectedSize) => {
    if (!product?.id) return;

    const size =
      selectedSize ||
      product.selectedSize ||
      product.size ||
      "N/A";

    const normalized = {
      id: product.id,
      name: product.productName || product.name || "",
      price: product.productPrice ?? product.price ?? 0,
      image: product.productImages?.[0] || product.image || "",
      selectedSize: size,
    };

    dispatch({ type: "ADD_ITEM", payload: normalized });
  };

  const updateQty = (id, qty, selectedSize) => {
    dispatch({
      type: "UPDATE_QTY",
      payload: { id, qty, selectedSize },
    });
  };

  const removeItem = (id, selectedSize) => {
    dispatch({
      type: "REMOVE_ITEM",
      payload: { id, selectedSize },
    });
  };

  const clearCart = async () => {
    dispatch({ type: "CLEAR_CART" });
    localStorage.removeItem("cartItems");

    const user = auth.currentUser;
    if (!user) return;

    const cartRef = collection(db, "users", user.uid, "cart");
    const snapshot = await getDocs(cartRef);
    await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
  };

  /* ================================================= */
  /* DERIVED VALUES */
  /* ================================================= */
  const cartCount = cartItems.reduce(
    (sum, item) => sum + (item.qty || 0),
    0
  );

  const total = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.qty || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        cartCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/* ================================================= */
/* HOOK */
/* ================================================= */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
