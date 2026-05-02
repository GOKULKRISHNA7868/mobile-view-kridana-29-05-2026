// src/components/AddAddressPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const AddAddressPage = () => {
  const { cartItems, total } = useCart();
  const navigate = useNavigate();
  const grandTotal = total;

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zip: ""
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBackToCart = () => navigate("/cart");

  const handleContinueToPayment = async () => {
    if (!formData.fullName || !formData.address || !formData.city || !formData.state) {
      alert("Please fill in all required fields (Name, Address, City, State)");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Please login to continue");
      return;
    }

    try {
      const orderData = {
        userId: user.uid,
        email: formData.email || user.email,

        address: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          apartment: formData.apartment,
          city: formData.city,
          state: formData.state,
          zip: formData.zip
        },

        // ✅ FIXED SIZE LOGIC
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,

          // 🔥 IMPORTANT FIX HERE
          size:
            item.selectedSize ||
            item.size ||
            item.options?.size ||
            "N/A",

          imageUrl: item.imageUrl || ""
        })),

        totalAmount: grandTotal,
        status: "pending",
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);

      navigate("/Payment", {
        state: {
          orderId: docRef.id,
          order: orderData
        }
      });

    } catch (error) {
      console.error("Error saving order:", error);
      alert("Failed to save order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-7xl bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            Delivery Address
          </h1>
          <span className="text-xs text-gray-500">
            Step 1 of 2 · Address & Order Summary
          </span>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">

            {/* ADDRESS FORM */}
            <section className="flex-[0.6] text-[13px] border border-gray-200 rounded-lg p-4">
              <p className="text-orange-500 font-semibold mb-1">Contact</p>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter E-mail"
                className="w-full h-9 border border-gray-300 rounded px-3 text-xs mb-3"
              />

              <p className="text-orange-500 font-semibold mb-2">
                Shipping Address
              </p>

              <div className="flex gap-3 mb-3">
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Full Name *"
                  className="flex-1 h-9 border border-gray-300 rounded px-3 text-xs"
                />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  className="flex-1 h-9 border border-gray-300 rounded px-3 text-xs"
                />
              </div>

              <input
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter Address *"
                className="w-full h-9 border border-gray-300 rounded px-3 text-xs mb-2.5"
              />

              <input
                name="apartment"
                value={formData.apartment}
                onChange={handleInputChange}
                placeholder="Apartment, Building, Landmark"
                className="w-full h-9 border border-gray-300 rounded px-3 text-xs mb-2.5"
              />

              <div className="flex gap-3 mb-4">
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City *"
                  className="flex-1 h-9 border border-gray-300 rounded px-3 text-xs"
                />
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State *"
                  className="flex-1 h-9 border border-gray-300 rounded px-3 text-xs"
                />
                <input
                  name="zip"
                  value={formData.zip}
                  onChange={handleInputChange}
                  placeholder="ZIP Code"
                  className="flex-1 h-9 border border-gray-300 rounded px-3 text-xs"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleBackToCart}
                  className="w-36 h-9 border border-gray-300 text-xs font-semibold rounded text-gray-700 hover:bg-gray-100"
                >
                  ← Back to Cart
                </button>

                <button
                  onClick={handleContinueToPayment}
                  className="flex-1 h-9 bg-orange-500 text-white text-xs font-semibold rounded hover:bg-orange-600"
                >
                  Continue to Payment
                </button>
              </div>
            </section>

            {/* ORDER SUMMARY */}
            <aside className="flex-[0.4] text-[12px] border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-orange-500 font-semibold mb-2.5">
                Order Summary
              </h3>

              {cartItems.map((item) => (
                <div className="flex items-center gap-3 mb-2" key={item.id}>
                  <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                    <img
                      src={item.imageUrl || "/placeholder.jpg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-[11px] font-semibold truncate">
                      {item.name}
                    </p>

                    {item.selectedSize && (
                      <p className="text-[11px] text-gray-500">
                        Size: {item.selectedSize}
                      </p>
                    )}

                    <p className="text-[11px] text-gray-500">
                      Qty {item.qty} · ₹ {item.price}
                    </p>
                  </div>
                </div>
              ))}

              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>₹ {grandTotal}</span>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAddressPage;
