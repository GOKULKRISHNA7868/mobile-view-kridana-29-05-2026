import React, { useState } from "react";

import { CheckCircle, Info, Lock, ChevronLeft } from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { db } from "../../firebase";

export default function TrainerPaymentSelection() {
  const navigate = useNavigate();

  const location = useLocation();

  const {
    totalAmount,
    studentId,
    studentName,
    month,
    items,
    student,
    instituteId,
  } = location.state || {};

  const [selected, setSelected] = useState("upi");

  const [utr, setUtr] = useState("");

  const [loading, setLoading] = useState(false);

  const API_URL = "https://kridana-razorpay-backend.onrender.com";

  // ✅ LOAD RAZORPAY
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);

      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  // ✅ SAVE PAYMENT

  // ✅ SUCCESS
  const goSuccess = (paymentData) => {
    navigate("/feepaymentsuccess", {
      state: paymentData,
    });
  };

  // ✅ RAZORPAY
  const handleRazorpay = async () => {
    try {
      setLoading(true);

      const isLoaded = await loadRazorpayScript();

      if (!isLoaded) {
        alert("Razorpay SDK failed");
        return;
      }

      const res = await fetch(`${API_URL}/create-order`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          amount: totalAmount * 100,
        }),
      });

      const order = await res.json();

      const options = {
        key: "rzp_live_SUjQtjkrUIwaHm",

        amount: order.amount,

        currency: "INR",

        name: "Kridana Sports",

        description: `Fee Payment - ${month}`,

        order_id: order.id,

        prefill: {
          name: studentName,
          email: student?.email || "",
          contact: student?.phone || "",
        },

        handler: async function (response) {
          await fetch(`${API_URL}/verify-payment`, {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify(response),
          });

          const paymentData = {
            studentId,
            studentName,
            month,
            items,
            totalAmount,

            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,

            paymentMethod: "razorpay",

            status: "success",

            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
          };

          navigate("/feepaymentsuccess", {
            state: paymentData,
          });
        },

        theme: {
          color: "#2563eb",
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.open();
    } catch (err) {
      console.log(err);

      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPI
  const handleUTRSubmit = async () => {
    if (!utr) {
      alert("Enter UTR Number");
      return;
    }

    try {
      setLoading(true);

      const paymentData = {
        studentId,
        studentName,
        month,
        items,
        totalAmount,

        utrNumber: utr,

        paymentMethod: "upi",

        status: "success",

        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      };

      navigate("/feepaymentsuccess", {
        state: paymentData,
      });
    } catch (err) {
      console.log(err);
      alert("Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-start md:items-center bg-gradient-to-br from-orange-50 to-white py-4 md:py-10 px-2">
      <div className="w-full max-w-[95%] sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl bg-[#FBF9F7] px-3 md:px-6 py-4 md:py-6 rounded-2xl shadow-md">
        <div className="w-full mx-auto relative px-2 md:px-4">
          {/* HEADER */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-white border border-orange-100 shadow-sm rounded-xl p-2.5"
            >
              <ChevronLeft className="text-orange-500" size={20} />
            </button>

            <div>
              <h1 className="font-semibold text-lg">Fee Payment</h1>

              <p className="text-sm text-gray-500">₹{totalAmount}</p>
            </div>
          </div>

          {/* TITLE */}
          <h1 className="text-center text-2xl md:text-3xl font-semibold text-gray-800">
            Choose Payment Method
          </h1>

          <div className="w-10 h-[3px] bg-orange-500 mx-auto my-2 rounded"></div>

          <p className="text-center text-gray-500 mb-6 text-sm">
            Pay your pending sports fees securely.
          </p>

          {/* UPI */}
          <div
            onClick={() => setSelected("upi")}
            className={`rounded-2xl p-5 shadow-sm border transition ${
              selected === "upi"
                ? "border-orange-400 bg-[#fff7f2]"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex gap-4 items-start">
              <div className="mt-2">
                <div
                  className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
                    selected === "upi" ? "border-orange-500" : "border-gray-300"
                  }`}
                >
                  {selected === "upi" && (
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center gap-2">
                  <h2 className="font-semibold text-[15px] text-gray-800">
                    Pay through UPI
                  </h2>

                  <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs whitespace-nowrap">
                    <CheckCircle size={14} />
                    No Transaction Fee
                  </div>
                </div>

                {selected === "upi" && (
                  <div className="mt-5 bg-white border rounded-2xl p-4 flex flex-col items-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                        `upi://pay?pa=9113831872@okbizaxis&pn=Kridana&am=${totalAmount}&cu=INR`,
                      )}`}
                      className="w-52 h-52"
                    />

                    <p className="mt-3 font-semibold">
                      Scan & Pay ₹{totalAmount}
                    </p>

                    <input
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="Enter UTR Number"
                      className="mt-4 w-full border rounded-xl px-4 py-3 outline-none"
                    />

                    <button
                      onClick={handleUTRSubmit}
                      disabled={loading}
                      className="mt-4 w-full bg-orange-500 text-white py-3 rounded-xl font-semibold"
                    >
                      {loading ? "Processing..." : "Submit UTR"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OR */}
          <div className="flex items-center justify-center my-6">
            <div className="flex-1 h-[1px] bg-gray-300"></div>

            <div className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full text-sm font-semibold text-gray-700 shadow-sm mx-3">
              OR
            </div>

            <div className="flex-1 h-[1px] bg-gray-300"></div>
          </div>

          {/* RAZORPAY */}
          <div
            onClick={() => setSelected("razorpay")}
            className={`rounded-2xl p-5 shadow-sm transition border ${
              selected === "razorpay"
                ? "border-orange-400 bg-[#fff7f2]"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex gap-4 items-start">
              <div className="mt-2">
                <div
                  className={`w-6 h-6 border-2 rounded-full flex items-center justify-center ${
                    selected === "razorpay"
                      ? "border-orange-500"
                      : "border-gray-300"
                  }`}
                >
                  {selected === "razorpay" && (
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center gap-2">
                  <h2 className="font-semibold text-[15px] text-gray-800">
                    Pay using Razorpay
                  </h2>

                  <div className="flex items-center gap-2 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs whitespace-nowrap">
                    <Info size={14} />
                    Transaction Fee Applicable
                  </div>
                </div>

                {selected === "razorpay" && (
                  <button
                    onClick={handleRazorpay}
                    disabled={loading}
                    className="mt-5 w-full bg-orange-500 text-white py-3 rounded-xl font-semibold"
                  >
                    {loading ? "Processing..." : `Pay ₹${totalAmount}`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 bg-[#fff7f2] border rounded-2xl py-4 px-5">
            <div className="flex items-center gap-3">
              <Lock className="text-orange-500" />

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Secure Payments
                </p>

                <p className="text-xs text-gray-500">
                  Your payment is encrypted & safe
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
