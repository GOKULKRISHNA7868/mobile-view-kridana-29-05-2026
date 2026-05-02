// src/components/InstituteDashboard/UploadProductDetails.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, storage } from "../../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "../../firebase";

/* ================================================= */
/* EMPTY PRODUCT TEMPLATE */
/* ================================================= */
const emptyProduct = {
  productName: "",
  brandName: "",
  productSize: "",
  productColors: "",
  productFor: "",
  stockAvailable: "",
  productCategory: "",
  productPrice: "",
  productImages: [], // ✅ array of image preview URLs
  productImageFiles: [],
  productDescription: "",
};

/* ================================================= */
/* IMAGE RULES */
/* ================================================= */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/tiff"];

const MIN_SIZE = 500;
const RECOMMENDED_SIZE = 1000;

const UploadProductDetails = () => {
  const [products, setProducts] = useState([{ ...emptyProduct }]);
  const [view, setView] = useState("form"); // form | list
  const [editIndex, setEditIndex] = useState(null);

  const navigate = useNavigate();

  /* ================================================= */
  /* ADD PRODUCT CARD */
  /* ================================================= */
  const handleAddCard = () => {
    if (view === "form") {
      // ✅ add another empty product card
      setProducts((prev) => [...prev, { ...emptyProduct }]);
    } else {
      // ✅ coming from list → fresh form
      setProducts([{ ...emptyProduct }]);
      setEditIndex(null);
      setView("form");
    }
  };

  /* ================================================= */
  /* REMOVE PRODUCT CARD */
  /* ================================================= */
  const handleRemoveCard = (index) => {
    const updated = products.filter((_, i) => i !== index);
    setProducts(updated);
  };

  /* ================================================= */
  /* HANDLE INPUT CHANGE */
  /* ================================================= */
  const handleChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...products];
    updated[index][name] = value;
    setProducts(updated);
  };

  /* ================================================= */
  /* IMAGE SELECT + VALIDATION + PREVIEW */
  /* ================================================= */
  const handleImageSelect = async (index, e) => {
    const files = Array.from(e.target.files);
    const imageUrls = [];

    for (let file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert("Allowed formats: JPEG, PNG, GIF, TIFF");
        return;
      }

      const img = new Image();
      const imgURL = URL.createObjectURL(file);

      await new Promise((resolve) => {
        img.onload = () => {
          const aspectRatio = img.width / img.height;

          // Allow square, portrait & landscape (controlled)
          if (aspectRatio < 0.4 || aspectRatio > 2.5) {
            alert(
              `Invalid image ratio (${aspectRatio.toFixed(
                2,
              )}). Please upload a standard product image.`,
            );
            URL.revokeObjectURL(imgURL);
            resolve(false);
            return;
          }

          // Ensure at least ONE side is >= MIN_SIZE
          if (img.width < MIN_SIZE && img.height < MIN_SIZE) {
            alert(`Minimum ${MIN_SIZE}px on at least one side`);
            URL.revokeObjectURL(imgURL);
            resolve(false);
            return;
          }

          imageUrls.push(imgURL); // ✅ preview only
          resolve(true);
        };
        img.src = imgURL;
      });
    }

    const updated = [...products];
    updated[index].productImages = imageUrls; // preview
    updated[index].productImageFiles = files; // 🔥 real files
    setProducts(updated);
  };

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(list);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  /* ================================================= */
  /* SAVE TO FIRESTORE */
  /* ================================================= */
  const handleSave = async (e) => {
    e.preventDefault();

    for (let i = 0; i < products.length; i++) {
      const p = products[i];

      if (
        !p.productName ||
        !p.brandName ||
        !p.productSize ||
        !p.productColors ||
        !p.productFor ||
        !p.productCategory ||
        !p.stockAvailable || // ✅ NEW
        !p.productPrice ||
        !p.productDescription ||
        p.productImages.length === 0
      ) {
        alert(`Please fill all fields for Product ${i + 1}`);
        return;
      }
    }

    try {
      const p = products[0]; // ✅ SAVE ONLY CURRENT FORM PRODUCT
      const user = auth.currentUser;

      await addDoc(collection(db, "products"), {
        instituteUID: user?.uid, // ✅ KEEP ONLY THIS ONE

        productName: p.productName,
        brandName: p.brandName,
        productSize: p.productSize,
        productColors: p.productColors,
        productFor: p.productFor,
        productCategory: p.productCategory.toLowerCase().replace(/\s+/g, "-"),
        productPrice: Number(p.productPrice),
        stockAvailable: Number(p.stockAvailable),
        productDescription: p.productDescription,
        productImages: p.productImages,

        createdAt: serverTimestamp(),
      });

      alert("Product saved successfully!");

      // 🔥 fetch fresh products from Firestore
      await fetchProducts();

      setView("list");
      setEditIndex(null);
    } catch (error) {
      console.error(error);
      alert("Failed to save products");
    }
  };

  /* ================================================= */
  /* EDIT PRODUCT */
  /* ================================================= */
  const handleEdit = (index) => {
    setEditIndex(index);
    setView("form");
  };

  /* ================================================= */
  /* LIST VIEW */
  /* ================================================= */
  if (view === "list") {
    return (
      <div className="w-full flex justify-center">
        <div className="p-8 bg-white rounded-2xl shadow-xl max-w-4xl w-full">
          <div className="flex justify-end mb-8 gap-3">
            <button
              onClick={() => {
                setProducts([{ ...emptyProduct }]); // 🔥 reset to fresh form
                setEditIndex(null);
                setView("form");
              }}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold"
            >
              + Add
            </button>
          </div>

          <h1 className="text-2xl font-bold mb-6">Your Products</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((p, i) => (
              <div
                key={i}
                className="border-2 border-orange-400 rounded-2xl p-4"
              >
                <div className="h-44 bg-gray-100 rounded-xl mb-4 overflow-hidden">
                  <img
                    src={p.productImages?.[0] || "/placeholder.jpg"}
                    alt={p.productName}
                    className="h-full w-full object-cover"
                  />
                </div>

                <h3 className="font-bold text-lg mb-2 text-orange-600">
                  {p.productName}
                </h3>

                <p className="text-xs text-gray-500">Price</p>
                <p className="font-bold text-black text-lg mb-2">
                  ₹ {p.productPrice}
                </p>

                <button
                  onClick={() => handleEdit(i)}
                  className="bg-orange-400 px-4 py-1 rounded-md text-sm font-semibold"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  const isFormValid = products.every(
    (p) =>
      p.productName &&
      p.brandName &&
      p.productSize &&
      p.productColors &&
      p.productFor &&
      p.productCategory &&
      p.stockAvailable &&
      p.productPrice &&
      p.productDescription &&
      p.productImages.length > 0,
  );

  /* ================================================= */
  /* FORM VIEW */
  /* ================================================= */
  return (
    <div className="p-8 bg-white rounded-2xl shadow-xl max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-orange-500">
          Add Product Details
        </h1>

        <div className="flex gap-3">
          <button
            onClick={handleAddCard}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold"
          >
            + Add
          </button>

          <button
            onClick={() => {
              fetchProducts();
              setView("list");
              setEditIndex(null);
            }}
            className="bg-orange-500 p-3 rounded-lg text-white font-bold"
          >
            ☰
          </button>
        </div>
      </div>

      {products.map((product, index) => {
        if (editIndex !== null && editIndex !== index) return null;

        return (
          <div
            key={index}
            className="bg-gray-50 border border-gray-300 p-5 mb-6 rounded-lg"
          >
            {products.length > 1 && (
              <button
                onClick={() => handleRemoveCard(index)}
                className="float-right text-red-600 font-bold"
              >
                ✖ Remove
              </button>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-black">
              {/* ALL INPUTS – SAME AS BEFORE */}
              {/* NO FIELD REMOVED */}
              {/* NO UI CHANGED */}

              {/* Product Name */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-gray-500">
                  Product Name <span className="text-red-500">*</span>
                </label>

                <input
                  name="productName"
                  value={product.productName}
                  onChange={(e) => handleChange(index, e)}
                  className="w-full border border-gray-300 rounded h-9 px-3
           focus:outline-none focus:ring-0 focus:border-black"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-gray-500">
                  Brand Name <span className="text-red-500">*</span>
                </label>

                <input
                  name="brandName"
                  value={product.brandName}
                  onChange={(e) => handleChange(index, e)}
                  className="w-full border border-gray-300 rounded h-9 px-3
           focus:outline-none focus:ring-0 focus:border-black"
                />
              </div>

              {/* Sizes */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-gray-500">
                  Product Size's
                  <span className="text-red-500">*</span>
                </label>

                <input
                  name="productSize"
                  value={product.productSize}
                  onChange={(e) => handleChange(index, e)}
                  className="w-full border border-gray-300 rounded h-9 px-3
           focus:outline-none focus:ring-0 focus:border-black"
                />
              </div>

              {/* Colors */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-gray-500">
                  Product color Options <span className="text-red-500">*</span>
                </label>

                <input
                  name="productColors"
                  value={product.productColors}
                  onChange={(e) => handleChange(index, e)}
                  className="w-full border border-gray-300 rounded h-9 px-3
           focus:outline-none focus:ring-0 focus:border-black"
                />
              </div>

              {/* For */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-gray-500">
                  Product For <span className="text-red-500">*</span>
                </label>

                <input
                  name="productFor"
                  value={product.productFor}
                  onChange={(e) => handleChange(index, e)}
                  className="w-full border border-gray-300 rounded h-9 px-3
           focus:outline-none focus:ring-0 focus:border-black"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-gray-500">
                  Product Price (₹) <span className="text-red-500">*</span>
                </label>

                <input
                  type="number"
                  name="productPrice"
                  value={product.productPrice}
                  onChange={(e) => handleChange(index, e)}
                  className="w-full border border-gray-300 rounded h-9 px-3
           focus:outline-none focus:ring-0 focus:border-black"
                />
              </div>

              {/* Category */}
              <div className="lg:col-span-2">
                <label className="block mb-2 font-semibold text-sm text-gray-500">
                  Categorey <span className="text-red-500">*</span>
                </label>
                <select
                  name="productCategory"
                  value={product.productCategory}
                  onChange={(e) => handleChange(index, e)}
                  className="w-full border border-gray-300 rounded h-9 px-3
           focus:outline-none focus:ring-0 focus:border-black"
                >
                  <option value="">Select Category</option>
                  <option value="karate wear">Karate Wear</option>
                  <option value="upper wear">Upper Wear</option>
                  <option value="bottom wear">Bottom Wear</option>
                  <option value="gym">Gym</option>
                  <option value="head wear">Head Wear</option>
                  <option value="sports equipment">Sports Equipment</option>
                </select>
              </div>
              {/* Stock Available */}
              <div>
                <label className="block mb-2 font-semibold text-sm text-gray-500">
                  Stock Avaliable <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stockAvailable"
                  value={product.stockAvailable}
                  onChange={(e) => handleChange(index, e)}
                  className="w-full border border-gray-300 rounded h-9 px-3
           focus:outline-none focus:ring-0 focus:border-black"
                />
              </div>

              {/* Images */}
              <div className="lg:col-span-2">
                <label className="block mb-2 font-semibold text-sm text-gray-500">
                  Upload Images of Product{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageSelect(index, e)}
                />
              </div>

              {/* Description */}
              <div className="lg:col-span-2">
                <label className="block mb-2 font-semibold text-sm text-gray-500">
                  Product Description <span className="text-red-500">*</span>
                </label>

                <textarea
                  rows={4}
                  name="productDescription"
                  value={product.productDescription}
                  onChange={(e) => handleChange(index, e)}
                  className="w-full border border-gray-300 rounded h-9 px-3
           focus:outline-none focus:ring-0 focus:border-black"
                />
              </div>
            </div>
          </div>
        );
      })}

      <div className="flex justify-center mt-4">
        <button
          onClick={handleSave}
          disabled={!isFormValid}
          className={`px-12 py-2 rounded-xl font-bold text-lg transition ${
            isFormValid
              ? "bg-orange-600 text-white cursor-pointer"
              : "bg-orange-200 text-white cursor-not-allowed"
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default UploadProductDetails;
