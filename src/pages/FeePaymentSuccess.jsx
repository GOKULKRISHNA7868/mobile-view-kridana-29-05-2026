import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

const PaymentSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(true);

  if (!state) return <div className="p-10">No Data</div>;

  // 🔒 BLOCK BACK BUTTON
  useEffect(() => {
    const handleBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBack);

    return () => {
      window.removeEventListener("popstate", handleBack);
    };
  }, []);

  // 🔥 CLEAN DATA FUNCTION
  const cleanData = (obj) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v !== undefined),
    );
  };

  // 🔥 SAVE FUNCTION
  const handleSubmit = async () => {
    try {
      setSaving(true);

      const user = auth.currentUser;
      if (!user) {
        alert("User not logged in");
        return;
      }

      const studentId = state.studentId;

      const studentRef = doc(db, "trainerstudents", studentId);
      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) {
        alert("Student not found");
        return;
      }

      const studentData = studentSnap.data();
      const trainerId = studentData.trainerId || "";

      let trainerName = "";
      if (trainerId) {
        const trainerRef = doc(db, "trainers", trainerId);
        const trainerSnap = await getDoc(trainerRef);

        if (trainerSnap.exists()) {
          const tData = trainerSnap.data();
          trainerName = `${tData.firstName || ""} ${tData.lastName || ""}`;
        }
      }

      for (const item of state.items) {
        let data = {
          category: item.category || "",
          subCategory: item.subCategory || "",
          studentId,
          trainerId,
          trainerName,
          month: state.month || "",
          paidAmount: item.amount || 0,
          totalAmount: state.totalAmount || 0,
          feeWaived: false,
          waiveReason: "",
          paymentMethod: "online",
          transactionGroupId: state.razorpay_order_id || "",
          paidByUserId: user.uid,
          paidDate: new Date().toISOString().split("T")[0],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (state.razorpay_order_id) data.orderId = state.razorpay_order_id;
        if (state.razorpay_payment_id)
          data.paymentId = state.razorpay_payment_id;
        if (state.status) data.paymentStatus = state.status;

        const safeData = cleanData(data);

        // ✅ Save per student
        await setDoc(
          doc(
            db,
            "feepayments",
            studentId,
            "payments",
            `${state.month}_${item.category}_${item.subCategory}`,
          ),
          safeData,
        );

        // ✅ Global collection
        await addDoc(collection(db, "institutesFees"), safeData);
      }

      // 🚀 AFTER SAVE → NAVIGATE
      navigate("/user/dashboard");
    } catch (err) {
      console.error("❌ ERROR:", err);
      alert("Error saving payment");
    } finally {
      setSaving(false);
    }
  };

  // 🚀 AUTO RUN IMMEDIATELY
  useEffect(() => {
    handleSubmit();
  }, []);

  // 🔄 FULL SCREEN LOADER (NO GAP UI)
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-50">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>

      <p className="text-lg font-semibold">
        {saving ? "Processing Payment..." : "Redirecting..."}
      </p>

      <p className="text-sm opacity-70">Please wait, do not close or go back</p>
    </div>
  );
};

export default PaymentSuccess;
