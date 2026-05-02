import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import ShopHome from "./ShopHome";
import ProductsGridPage from "./ProductsGridPage";

const ShopPage = () => {
  const [view, setView] = useState("home"); // "home" | "grid"
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { cartCount, addToCart } = useCart();
  const navigate = useNavigate();

  const handleViewCart = () => navigate("/cart");

  const handleOpenGrid = () => setView("grid");
  const handleBackToHome = () => setView("home");

  // kept for future if you later use FullProductPage
  const handleOpenProduct = (product) => {
    setSelectedProduct(product);
    // setView("full");
  };

  if (view === "grid") {
    return (
      <ProductsGridPage
        onBack={handleBackToHome}
        onOpenFull={handleOpenProduct}
        onAddToCart={addToCart}
        cartCount={cartCount}
        onViewCart={handleViewCart}
      />
    );
  }

  // default: hero + categories + recommended
  return (
    <ShopHome
      onOpenGrid={handleOpenGrid}
      cartCount={cartCount}
      onViewCart={handleViewCart}
    />
  );
};

export default ShopPage;