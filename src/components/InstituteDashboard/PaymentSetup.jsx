import React from "react";
import axios from "axios";

const StudentPay = () => {
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    const res = await loadRazorpay();

    if (!res) {
      alert("Razorpay SDK failed to load");
      return;
    }

    try {
      // 1️⃣ Create order
      const { data: order } = await axios.post(
        "http://localhost:5000/create-order",
        {
          amount: 500,
        },
      );

      // 2️⃣ Open Razorpay
      const options = {
        key: "rzp_test_STYwsNh7yCS06Z",
        amount: order.amount,
        currency: "INR",
        name: "Kridana",
        description: "Student Fee Payment",
        order_id: order.id,

        handler: async function (response) {
          alert("✅ Payment Successful");

          await axios.post("http://localhost:5000/transfer-manual", {
            payment_id: response.razorpay_payment_id,
            amount: 500,
          });

          alert("✅ Money transferred to institute");
        },

        prefill: {
          name: "Student",
          email: "student@test.com",
        },

        theme: {
          color: "#f97316",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    }
  };

  return (
    <div className="flex justify-center mt-20">
      <button
        onClick={handlePayment}
        className="bg-orange-500 text-white px-6 py-3 rounded-xl"
      >
        Pay ₹500
      </button>
    </div>
  );
};

export default StudentPay;
