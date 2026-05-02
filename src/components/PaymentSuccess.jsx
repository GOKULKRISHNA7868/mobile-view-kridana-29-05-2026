import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

export default function SubscriptionSuccessPage() {
  const { search, state } = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(search);

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* ===============================
     Read Payment Data
     =============================== */
  useEffect(() => {
    const obj = {};

    for (let [key, value] of params.entries()) {
      obj[key] = value;
    }

    if (state) {
      obj.razorpay_payment_id = state.paymentId;
      obj.razorpay_order_id = state.orderId;
      obj.razorpay_signature = state.signature;
      obj.amount = state.amount;
      obj.planType = state.planType;
      obj.order_status = "Success";
    }

    console.log("✅ FINAL DATA:", obj); // debug

    setData(obj);
    setLoading(false);
  }, [search, state]);
  /* ===============================
     AUTO SUBMIT AFTER LOAD
     =============================== */
  useEffect(() => {
    if (!loading && data.order_status === "Success") {
      submitSubscription();
    }
  }, [loading, data]);

  /* ===============================
     SUBMIT FUNCTION
     =============================== */
  const submitSubscription = async () => {
    if (submitting) return;
    if (
      !data.razorpay_payment_id ||
      !data.razorpay_order_id ||
      !data.planType
    ) {
      console.log("⛔ Waiting for complete data...", data);
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      alert("❌ Login required");
      return;
    }

    setSubmitting(true);

    try {
      const trainerSnap = await getDoc(doc(db, "trainers", user.uid));
      const instituteSnap = await getDoc(doc(db, "institutes", user.uid));

      let role = "user";
      if (trainerSnap.exists()) role = "trainer";
      if (instituteSnap.exists()) role = "institute";

      const startDate = Timestamp.now();

      const durationDays = 30;
      const endDate = Timestamp.fromDate(
        new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      );

      await setDoc(doc(db, "plans", user.uid), {
        role,
        freeTrialUsed: true,

        currentPlan: {
          planType: data.planType || "PAID",
          startDate,
          endDate,
          status: "active",
          payment: {
            payment_id: data.razorpay_payment_id || "",
            order_id: data.razorpay_order_id || "",
            signature: data.razorpay_signature || "",
            amount: data.amount || "",
            status: data.order_status || "Success",
            method: "online",
            currency: "INR",
            email: auth.currentUser.email || "",
          },
        },

        history: [
          {
            planType: data.planType || "PAID",
            startDate,
            endDate,
            payment: {
              payment_id: data.razorpay_payment_id || "",
              order_id: data.razorpay_order_id || "",
              amount: data.amount || "",
              status: data.order_status || "Success",
            },
          },
        ],

        createdAt: serverTimestamp(),
      });

      /* ✅ Redirect */
      if (role === "trainer") {
        navigate("/trainers/dashboard", { replace: true });
      } else if (role === "institute") {
        navigate("/institutes/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error saving subscription");
      setSubmitting(false);
    }
  };

  /* ===============================
     FULL SCREEN LOADER UI
     =============================== */
  if (loading || submitting) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-semibold text-gray-700">
          Activating your subscription...
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Please wait, do not close this page
        </p>
      </div>
    );
  }

  /* (Optional fallback UI – rarely seen) */

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: "auto" }}>
      <h1>✅ Payment Successful</h1>

      {/* ================= Payment Details ================= */}
      <h3 style={{ marginTop: 20 }}>Payment Details</h3>

      <p>
        <b>Payment ID:</b> {data.razorpay_payment_id || "-"}
      </p>

      <p>
        <b>Order ID:</b> {data.razorpay_order_id || "-"}
      </p>

      <p>
        <b>Signature:</b> {data.razorpay_signature || "-"}
      </p>

      <p>
        <b>Amount:</b> ₹{data.amount}
      </p>

      <p>
        <b>Status:</b> {data.order_status}
      </p>

      <p>
        <b>Payment Mode:</b> {data.payment_mode || "Online"}
      </p>

      <p>
        <b>Email:</b> {data.billing_email || auth.currentUser?.email}
      </p>

      <hr style={{ margin: "20px 0" }} />

      {/* ================= Subscription Details ================= */}
      <h3>Subscription Details</h3>

      <p>
        <b>Plan:</b> {data.planType || "PAID"}
      </p>

      <p>
        <b>Start Date:</b> {new Date().toLocaleString()}
      </p>

      <p>
        <b>End Date:</b>{" "}
        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleString()}
      </p>

      {/* ================= SUBMIT BUTTON ================= */}
      <button
        onClick={submitSubscription}
        disabled={submitting}
        style={{
          marginTop: 30,
          padding: "14px",
          background: "#22c55e",
          color: "#000",
          borderRadius: 6,
          fontWeight: "bold",
          width: "100%",
          cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        {submitting
          ? "Saving Subscription..."
          : "✅ Submit & Activate Subscription"}
      </button>
    </div>
  );
}
