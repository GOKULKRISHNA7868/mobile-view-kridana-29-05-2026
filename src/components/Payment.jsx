// src/pages/TestPayment.jsx
import React, { useState } from "react";
import axios from "axios";

export default function TestPayment() {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const order_id = `test_${Date.now()}`;
      const customer = {
        name: "Test User",
        email: "test@example.com",
        phone: "9999999999",
      };

      console.log("Initiating payment with order ID:", order_id);

      // Call your deployed backend initiate route
      const response = await axios.post(
        "https://backendpayments.onrender.com/ccavenue/initiate",
        {
          amount: 1, // ₹1
          order_id,
          customer,
        },
      );

      console.log("Backend response:", response.data);

      const { url, encRequest, access_code } = response.data;

      if (!url || !encRequest || !access_code) {
        console.error("Missing required data from backend:", response.data);
        alert("Payment initiation failed: Missing data from backend");
        return;
      }

      // Create a form to auto-submit to CCAvenue
      const form = document.createElement("form");
      form.method = "POST";
      form.action = url;

      const encField = document.createElement("input");
      encField.type = "hidden";
      encField.name = "encRequest";
      encField.value = encRequest;
      form.appendChild(encField);

      const accessField = document.createElement("input");
      accessField.type = "hidden";
      accessField.name = "access_code";
      accessField.value = access_code;
      form.appendChild(accessField);

      document.body.appendChild(form);

      console.log("Submitting payment form to CCAvenue...");
      form.submit();
    } catch (err) {
      console.error("Payment initiation failed:", err);
      alert("Payment initiation failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center mt-20">
      <h1 className="text-2xl font-bold mb-4">Test Payment (₹1)</h1>
      <button
        onClick={handlePayment}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        disabled={loading}
      >
        {loading ? "Processing..." : "Pay ₹1"}
      </button>
    </div>
  );
}
