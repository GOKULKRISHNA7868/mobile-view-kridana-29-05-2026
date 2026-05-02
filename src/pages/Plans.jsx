import React, { useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

import { ArrowLeft } from "lucide-react";
export default function Plans() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly");
  const [role, setRole] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const trainerSnap = await getDoc(doc(db, "trainers", user.uid));
      const instituteSnap = await getDoc(doc(db, "institutes", user.uid));

      if (trainerSnap.exists()) setRole("trainer");
      else if (instituteSnap.exists()) setRole("institute");
    };

    fetchRole();
  }, []);

  useEffect(() => {
    const authInstance = getAuth();

    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (!user) return;

      try {
        const trainerSnap = await getDoc(doc(db, "trainers", user.uid));
        const instituteSnap = await getDoc(doc(db, "institutes", user.uid));

        if (trainerSnap.exists()) setRole("trainer");
        else if (instituteSnap.exists()) setRole("institute");
      } catch (err) {
        console.error("Error fetching role:", err);
      }
    });

    return () => unsubscribe();
  }, []);
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };
  const startPaidSubscription = async (planType, amount) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      setLoadingPlan(planType);

      // ✅ LOAD RAZORPAY SDK FIRST
      const loaded = await loadRazorpay();

      if (!loaded) {
        alert("Razorpay SDK failed to load");
        setLoadingPlan(null);
        return;
      }

      // ✅ CREATE ORDER
      const res = await fetch("http://localhost:5000/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount) * 100,
        }),
      });

      const order = await res.json();

      console.log("ORDER:", order);

      // ❌ Safety check
      if (!order.id) {
        alert("Order creation failed");
        setLoadingPlan(null);
        return;
      }

      // ✅ RAZORPAY OPTIONS
      const options = {
        key: "rzp_live_SUjQtjkrUIwaHm", // (use test key for dev)
        amount: order.amount,
        currency: "INR",
        name: "Kridana",
        description: `${planType} Subscription`,
        order_id: order.id,

        handler: async function (response) {
          try {
            const verifyRes = await fetch(
              "http://localhost:5000/verify-payment",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              },
            );

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              // ✅ REMOVE firestore saving here
              // ✅ REMOVE alert
              // ✅ ONLY NAVIGATE

              navigate("/payment-success", {
                state: {
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  signature: response.razorpay_signature,
                  amount,
                  planType,
                },
              });
            } else {
              alert("❌ Payment verification failed");
            }
          } catch (err) {
            console.error(err);
            alert("Verification error");
          } finally {
            setLoadingPlan(null);
          }
        },

        prefill: {
          email: user.email,
        },

        theme: {
          color: "#84cc16",
        },
      };

      // ✅ OPEN CHECKOUT
      const rzp = new window.Razorpay(options);

      rzp.open();

      rzp.on("payment.failed", function (response) {
        console.log("❌ FAILED:", response.error);
        alert(response.error.description || "Payment Failed");
        setLoadingPlan(null);
      });
    } catch (err) {
      console.error(err);
      alert("Payment failed");
      setLoadingPlan(null);
    }
  };
  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16">
      <button
        onClick={() => navigate("/")}
        className="absolute left-2 top-5 flex items-center gap-2 
    text-white bg-[#FF6A00] px-3 py-1.5 rounded-md backdrop-blur-sm"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back</span>
      </button>
      <h1 className="text-3xl font-bold mb-2">Get Started</h1>
      <p className="text-gray-500 mb-6">
        Start for free, pick a plan later. Ready to be part of the future
      </p>

      <p className="text-lg font-semibold text-lime-500">
        Limited Offer (First 1000 Businesses Only)
      </p>

      {/* Toggle */}
      <div className="flex border rounded-full mb-10 overflow-hidden">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-6 py-2 ${
            billing === "monthly" ? "bg-orange-500 text-black" : "bg-white"
          }`}
        >
          Monthly Plan
        </button>
        <button
          onClick={() => setBilling("annual")}
          className={`px-6 py-2 ${
            billing === "annual" ? "bg-orange-500 text-black" : "bg-white"
          }`}
        >
          Annual Plan
        </button>
      </div>

      {/* Cards */}
      <div className="flex justify-center w-full px-6">
        {/* FREE */}

        {/* TRAINER */}
        {role === "trainer" && (
          <div className="bg-gray-900 text-white rounded-xl p-8 relative flex flex-col justify-between">
            <span className="absolute top-3 right-3 bg-lime-400 text-black text-xs px-2 py-1 rounded">
              50% OFF
            </span>

            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="text-white">
                ₹ {billing === "monthly" ? "199 / Month" : "2,388 / Year"}
              </span>

              <span className="line-through text-gray-400 text-sm">
                ₹ {billing === "monthly" ? "499/ Month" : "5,988 / Year"}
              </span>
            </h2>
            <p className="text-lime-400 font-semibold mb-4">Trainer’s Plan</p>

            <ul className="space-y-2 text-sm">
              <li>✔ 24×7 Advertising</li>
              <li>✔ Fee Collection & Alerts</li>
              <li>✔ Customer Attendance Tracking</li>
              <li>✔ Performance Tracking</li>
              <li>✔ Revenue Tracking</li>
            </ul>

            <button
              onClick={() =>
                startPaidSubscription(
                  "TRAINER",
                  billing === "monthly" ? "1.00" : "2388.00",
                )
              }
              disabled={loadingPlan === "TRAINER"}
              className={`mt-6 w-full py-2 rounded font-semibold flex items-center justify-center gap-2 ${
                loadingPlan === "TRAINER"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-lime-400 text-black"
              }`}
            >
              {loadingPlan === "TRAINER" ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                "Subscribe"
              )}
            </button>
          </div>
        )}

        {/* INSTITUTE */}
        {role === "institute" && (
          <div className="bg-gray-900 text-white rounded-xl p-8 relative flex flex-col justify-between">
            <span className="absolute top-3 right-3 bg-lime-400 text-black text-xs px-2 py-1 rounded">
              50% OFF
            </span>

            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="text-white">
                ₹ {billing === "monthly" ? "499" : "5,994 / Year"}
              </span>

              <span className="line-through text-gray-400 text-sm">
                ₹ {billing === "monthly" ? "999/-" : "11,988 / Year"}
              </span>
            </h2>
            <p className="text-lime-400 font-semibold mb-4">Institutes Plan</p>

            <ul className="space-y-2 text-sm">
              <li>✔ 24×7 Advertising (Enhanced)</li>
              <li>✔ Fee Collection & Alerts</li>
              <li>✔ Customer Attendance Tracking</li>
              <li>✔ Performance Tracking (Advanced)</li>
              <li>✔ Revenue Tracking (Advanced)</li>
              <li>✔ Salary Management</li>
              <li>✔ Staff Attendance</li>
              <li>✔ Bookings</li>
            </ul>

            <button
              onClick={() =>
                startPaidSubscription(
                  "INSTITUTE",
                  billing === "monthly" ? "499.00" : "5994.00",
                )
              }
              disabled={loadingPlan === "INSTITUTE"}
              className={`mt-6 w-full py-2 rounded font-semibold flex items-center justify-center gap-2 ${
                loadingPlan === "INSTITUTE"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-lime-400 text-black"
              }`}
            >
              {loadingPlan === "INSTITUTE" ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                "Subscribe"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
