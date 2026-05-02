import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

const FeePaymentSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(true);
  const [saved, setSaved] = useState(false);

  if (!state) {
    return <div className="p-8">No Data Found</div>;
  }

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

  // 🔥 AUTO SAVE FUNCTION
  const handleSubmit = async () => {
    try {
      setSaving(true);

      const loginUid = auth.currentUser?.uid;

      if (!loginUid) {
        alert("User not logged in");
        return;
      }

      // ✅ 1. Fetch student data
      const studentRef = doc(db, "students", loginUid);
      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) {
        alert("Student data not found ❌");
        return;
      }

      const studentData = studentSnap.data();
      const instituteId = studentData.instituteId || "";

      // ✅ 2. Save institute payment history
      const instituteRef = collection(
        db,
        "instituepaymenthistory",
        loginUid,
        "payments",
      );

      await addDoc(instituteRef, {
        studentName: state.studentName || "",
        studentId: loginUid,
        instituteId: instituteId,
        month: state.month || "",
        totalAmount: state.totalAmount || 0,
        paymentId: state.paymentId || "",
        orderId: state.orderId || "",
        status: state.status || "paid",
        items: state.items || [],
        date: state.date || "",
        time: state.time || "",
        createdAt: serverTimestamp(),
      });

      // ✅ 3. Save individual fees
      for (const item of state.items) {
        await addDoc(collection(db, "studentFees"), {
          category: item.category || "",
          subCategory: item.subCategory || "",
          createdAt: serverTimestamp(),
          feeWaived: false,
          instituteId: instituteId,
          month: state.month || "",
          paidAmount: item.amount || 0,
          paidDate: state.date || "",
          studentId: loginUid,
          totalAmount: item.amount || 0,
          waiveReason: "",
        });
      }

      // ✅ SUCCESS
      setSaved(true);
    } catch (err) {
      console.error("❌ SAVE ERROR:", err);
      alert("Failed to save payment");
    } finally {
      setSaving(false);
    }
  };

  // 🚀 AUTO TRIGGER
  useEffect(() => {
    handleSubmit();
  }, []);

  // 🚀 AUTO REDIRECT AFTER SUCCESS (optional)
  useEffect(() => {
    if (saved) {
      setTimeout(() => {
        navigate("/user/dashboard");
      }, 2000);
    }
  }, [saved, navigate]);

  // 🔄 LOADING SCREEN
  if (saving) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-50">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-semibold">Please wait...</p>
        <p className="text-sm opacity-70">
          Saving your payment, do not close or go back
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-lg">
        {/* HEADER */}
        <h1 className="text-2xl font-bold text-green-600 mb-4 text-center">
          {saved ? "Payment Saved Successfully 🎉" : "Processing Payment..."}
        </h1>

        <div className="space-y-2 text-sm">
          <p>
            <b>Student:</b> {state.studentName}
          </p>
          <p>
            <b>Month:</b> {state.month}
          </p>
          <p>
            <b>Status:</b> {state.status}
          </p>

          <p className="text-lg font-semibold mt-3">
            Total Amount: ₹{state.totalAmount}
          </p>

          <hr className="my-3" />

          <p>
            <b>Payment ID:</b> {state.paymentId}
          </p>
          <p>
            <b>Order ID:</b> {state.orderId}
          </p>

          <p>
            <b>Date:</b> {state.date}
          </p>
          <p>
            <b>Time:</b> {state.time}
          </p>

          <hr className="my-3" />

          <h3 className="font-semibold">Items Paid:</h3>

          {state.items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <p>
                {item.category} - {item.subCategory}
              </p>
              <p>₹{item.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeePaymentSuccess;
