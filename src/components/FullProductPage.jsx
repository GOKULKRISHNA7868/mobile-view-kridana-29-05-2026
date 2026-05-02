import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";

/* ===================== FORMAT HELPERS (UI ONLY) ===================== */
const extractAboutItems = (description = "") => {
  return description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.includes("–"))
    .slice(0, 6);
};

const extractIncludes = (description = "") => {
  return description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes("–"))
    .map((line) => {
      const [key, value] = line.split("–");
      return {
        key: key.trim(),
        value: value.trim(),
      };
    });
};

const FullProductPage = ({
  onBack,
  product,
  onAddToCart,
  cartCount = 0,
  onViewCart,
}) => {
  const navigate = useNavigate();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();

  const [selectedSize, setSelectedSize] = useState(null);
  const [showSizeError, setShowSizeError] = useState(false);

  if (!product) return null;

  /* ===================== DATA FROM FIREBASE ===================== */
  const price = product.productPrice;

  const sizes = product.productSize
    ? product.productSize.split(",").map((s) => s.trim())
    : [];

  const aboutItems = extractAboutItems(product.productDescription);
  const includes = extractIncludes(product.productDescription);

  const isWishlisted = wishlistItems.some(
    (item) => item.id === product.id
  );

  /* ===================== VALIDATION ===================== */
 const validateSize = () => {
  if (!selectedSize) {
    alert("Please select a size before adding the product to cart.");
    return false;
  }
  return true;
};


  /* ===================== HANDLERS ===================== */
  const handleAddCart = () => {
    if (!validateSize()) return;
    onAddToCart({ ...product, selectedSize });
  };

  const handleBuyNow = () => {
    if (!validateSize()) return;
    onAddToCart({ ...product, selectedSize });
    navigate("/addresspage");
  };

  const toggleWishlist = () => {
    isWishlisted
      ? removeFromWishlist(product.id)
      : addToWishlist(product);
  };

  /* ===================== UI ===================== */
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ===================== LEFT SIDE ===================== */}
      <aside className="w-1/2 bg-white border-r relative flex flex-col">
        {/* BACK */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 text-orange-600 font-semibold"
        >
          ← Back
        </button>

        {/* WISHLIST ICON */}
        <button
          onClick={toggleWishlist}
          className={`absolute top-4 right-4 w-12 h-12 rounded-full text-xl shadow
            ${
              isWishlisted
                ? "bg-orange-500 text-white"
                : "bg-white text-orange-500 border"
            }`}
        >
          ♥
        </button>

        {/* IMAGE */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-[90%] h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">
            <span className="text-gray-400">
              Image (Firebase Storage next)
            </span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="p-4 flex gap-4 border-t">
          <button
            onClick={handleAddCart}
            className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold"
          >
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold"
          >
            Buy Now
          </button>
        </div>
      </aside>

      {/* ===================== RIGHT SIDE ===================== */}
      <main className="w-1/2 p-8 overflow-y-auto">
      {/* TOP RIGHT ICONS */}
<div className="sticky top-6 flex justify-end gap-4 mb-4 z-20">

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
      onClick={onViewCart}
      className="w-12 h-12 bg-orange-50 border border-orange-300 rounded-full 
                 text-orange-500 text-xl"
    >
      🛒
    </button>

    {cartCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs 
                       rounded-full w-5 h-5 flex items-center justify-center font-bold">
        {cartCount}
      </span>
    )}
  </div>
</div>

        {/* PRODUCT TITLE */}
        <h1 className="text-2xl font-bold mb-2">
          {product.productName}
        </h1>

        {/* PRICE */}
        <p className="text-xl font-bold text-orange-600 mb-6">
          ₹ {price}
        </p>

        {/* SIZE SELECTION */}
        {sizes.length > 0 && (
          <section className="mb-6">
            <h3 className="font-semibold mb-2">Select Size</h3>
            <div className="flex gap-2 flex-wrap">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 border rounded
                    ${
                      selectedSize === size
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-300"
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {showSizeError && (
              <p className="text-red-500 text-sm mt-2">
                Please select a size
              </p>
            )}
          </section>
        )}

{/* ===================== INCLUDES ===================== */}
<section className="mb-6 bg-white rounded-lg border">
  <h3 className="font-semibold px-4 py-3 border-b">
    Includes
  </h3>
  <table className="w-full text-sm">
    <tbody>
      <tr className="border-b">
        <td className="px-4 py-2 font-medium">Product Name</td>
        <td className="px-4 py-2">{product.productName}</td>
      </tr>

      <tr className="border-b">
        <td className="px-4 py-2 font-medium">Brand</td>
        <td className="px-4 py-2">{product.brandName}</td>
      </tr>

      <tr className="border-b">
        <td className="px-4 py-2 font-medium">Category</td>
        <td className="px-4 py-2">{product.productCategory}</td>
      </tr>

      <tr className="border-b">
        <td className="px-4 py-2 font-medium">Colors</td>
        <td className="px-4 py-2">{product.productColors}</td>
      </tr>

      <tr className="border-b">
        <td className="px-4 py-2 font-medium">For</td>
        <td className="px-4 py-2">{product.productFor}</td>
      </tr>

      <tr className="border-b">
        <td className="px-4 py-2 font-medium">Available Sizes</td>
        <td className="px-4 py-2">{product.productSize}</td>
      </tr>

      <tr>
        <td className="px-4 py-2 font-medium">Price</td>
        <td className="px-4 py-2 font-semibold">
          ₹ {product.productPrice}
        </td>
      </tr>
    </tbody>
  </table>
</section>

{/* ===================== ABOUT THIS ITEM ===================== */}
<section className="bg-white rounded-lg border p-4">
  <h3 className="font-semibold mb-3">
    About this item
  </h3>
  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
    {product.productDescription
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, i) => (
        <li key={i}>{line}</li>
      ))}
  </ul>
</section>


        
      </main>
    </div>
  );
};

export default FullProductPage;
