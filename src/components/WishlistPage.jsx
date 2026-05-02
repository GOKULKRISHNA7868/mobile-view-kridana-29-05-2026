import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

/* 🔥 FIREBASE */
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
/* 🔥 END */

const IMAGE_MAP = {
  201: "/kumite kit.jpg",
  202: "/Adidas karate.jpg",
  203: "/Aarwaza karate.jpg",
};

const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [firebaseImages, setFirebaseImages] = useState({});

  /* 🔥 FETCH FIREBASE IMAGES */
  useEffect(() => {
    const fetchProductImages = async () => {
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const map = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.productImages && data.productImages.length > 0) {
            map[doc.id] = data.productImages[0];
          }
        });

        setFirebaseImages(map);
      } catch (err) {
        console.error("Wishlist image fetch error:", err);
      }
    };

    fetchProductImages();
  }, []);

  /* ---------------- NAVIGATION ---------------- */
  const goBack = () => navigate(-1);
  const goToCart = () => navigate("/cart");

  const handleAddToCart = (item) => {
    addToCart(item);
    goToCart();
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ================= HEADER ROW ================= */}
        <div className="flex items-center justify-between mb-6">
          {/* BACK */}
          <button
            onClick={goBack}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            ← Back
          </button>

          {/* ICONS */}
          <div className="flex gap-4">
            {/* WISHLIST ICON */}
            <div className="relative">
              <button
                onClick={() => navigate("/wishlist")}
                className="w-12 h-12 bg-orange-50 border border-orange-300 rounded-full 
                           text-orange-500 text-xl font-bold"
              >
                ♥
              </button>

              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs 
                                 rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {wishlistItems.length}
                </span>
              )}
            </div>

            {/* CART ICON */}
            <div className="relative">
              <button
                onClick={goToCart}
                className="w-12 h-12 bg-orange-50 border border-orange-300 rounded-full 
                           text-orange-500 text-xl"
              >
                🛒
              </button>
            </div>
          </div>
        </div>

        {/* ================= TITLE ================= */}
        <h1 className="text-3xl font-bold text-gray-900 mb-10">
          Wishlist ({wishlistItems.length})
        </h1>

        {/* ================= EMPTY STATE ================= */}
        {wishlistItems.length === 0 ? (
          <div className="text-center py-24">
            <div className="mx-auto w-24 h-24 bg-orange-50 rounded-full 
                            flex items-center justify-center mb-6 text-orange-400 text-4xl">
              ♥
            </div>
            <p className="text-lg text-gray-500 mb-6">
              Your wishlist is empty.
            </p>
            <button
              onClick={goBack}
              className="px-8 py-3 rounded-full bg-orange-500 text-white 
                         font-semibold hover:bg-orange-600"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          /* ================= WISHLIST GRID ================= */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-xl 
                           shadow-sm overflow-hidden flex flex-col"
              >
                {/* IMAGE */}
                <div className="h-36 bg-gray-100">
                  <img
                    src={
                      item.image ||
                      firebaseImages[item.id] ||
                      IMAGE_MAP[item.id] ||
                      "/placeholder.jpg"
                    }
                    alt={item.name || "Product"}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* CONTENT */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                    {item.name}
                  </h3>

                  <p className="text-base font-bold text-orange-500">
                    ₹ {item.price?.toLocaleString("en-IN")}
                  </p>

                  <div className="mt-auto flex flex-col gap-2 pt-4">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="py-2 bg-orange-500 text-white rounded-lg 
                                 text-sm font-semibold hover:bg-orange-600"
                    >
                      Add to Cart
                    </button>

                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="py-2 border border-gray-300 rounded-lg 
                                 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= CONTINUE SHOPPING ================= */}
        {wishlistItems.length > 0 && (
          <div className="mt-14 text-center">
            <button
              onClick={goBack}
              className="px-8 py-3 rounded-full bg-gray-100 
                         text-gray-700 font-semibold hover:bg-gray-200"
            >
              ← Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
