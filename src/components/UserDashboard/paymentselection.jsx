import React, { useEffect, useState } from "react";

import { Info, CheckCircle, Lock, ChevronLeft } from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

import { db } from "../../firebase";

import { doc, getDoc } from "firebase/firestore";

import { getAuth } from "firebase/auth";

export default function PaymentSelection() {
  const navigate = useNavigate();

  const location = useLocation();

  const auth = getAuth();

  const currentUser = auth.currentUser;

  const { totalAmount, studentId, studentName, month, items, student } =
    location.state || {};

  const [selected, setSelected] = useState("upi");

  const [utr, setUtr] = useState("");

  const [loading, setLoading] = useState(false);

  const [upiLoading, setUpiLoading] = useState(true);

  const [upiData, setUpiData] = useState({
    upiId: "",
    upiName: "",
  });

  const API_URL = "https://kridana-razorpay-backend.onrender.com";

  // ✅ FETCH INSTITUTE UPI DETAILS BASED ON STUDENT LOGIN
  useEffect(() => {
    const fetchInstituteUPI = async () => {
      try {
        if (!currentUser?.uid) {
          setUpiLoading(false);
          return;
        }

        // 🔥 STUDENT DOCUMENT
        const studentRef = doc(db, "students", currentUser.uid);

        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
          setUpiLoading(false);
          return;
        }

        const studentData = studentSnap.data();

        const instituteId = studentData?.instituteId;

        if (!instituteId) {
          setUpiLoading(false);
          return;
        }

        // 🔥 FETCH INSTITUTE KYC
        const kycRef = doc(db, "institutes", instituteId, "Kyc", "details");

        const kycSnap = await getDoc(kycRef);

        if (kycSnap.exists()) {
          const kycData = kycSnap.data();

          setUpiData({
            upiId: kycData?.paymentSettings?.upiId || kycData?.upiId || "",

            upiName:
              kycData?.paymentSettings?.upiName || kycData?.upiName || "",
          });
        }
      } catch (err) {
        console.log(err);
      } finally {
        setUpiLoading(false);
      }
    };

    fetchInstituteUPI();
  }, [currentUser]);

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

  // ✅ SUCCESS NAVIGATION
  const goSuccess = async (paymentData) => {
    navigate("/Instfeepaymentsuccess", {
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

            paymentId: response.razorpay_payment_id,

            orderId: response.razorpay_order_id,

            signature: response.razorpay_signature,

            paymentMethod: "razorpay",

            status: "success",

            instituteUpiId: upiData?.upiId || "",

            instituteUpiName: upiData?.upiName || "",

            date: new Date().toLocaleDateString(),

            time: new Date().toLocaleTimeString(),
          };

          localStorage.setItem("paymentData", JSON.stringify(paymentData));

          navigate("/Instfeepaymentsuccess", {
            state: paymentData,
          });
        },

        theme: {
          color: "#f97316",
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

  // ✅ UTR SUBMIT
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

        instituteUpiId: upiData?.upiId || "",

        instituteUpiName: upiData?.upiName || "",

        date: new Date().toLocaleDateString(),

        time: new Date().toLocaleTimeString(),
      };

      localStorage.setItem("paymentData", JSON.stringify(paymentData));

      await goSuccess(paymentData);
    } catch (err) {
      console.log(err);

      alert("Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-orange-50 to-white px-3 py-4 sm:px-4 md:flex md:items-center md:justify-center md:py-10 overflow-x-hidden">
      <div className="w-full max-w-md md:max-w-2xl xl:max-w-3xl bg-[#FBF9F7] rounded-3xl shadow-lg border border-orange-100 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 md:px-8 md:py-7">
          {/* HEADER */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => navigate(-1)}
              className="bg-white border border-orange-100 shadow-sm rounded-xl p-2 active:scale-95 transition"
            >
              <ChevronLeft className="text-orange-500" size={20} />
            </button>

            <div className="min-w-0">
              <h1 className="font-semibold text-base sm:text-lg truncate">
                Fee Payment
              </h1>

              <p className="text-sm text-gray-500">₹{totalAmount}</p>
            </div>
          </div>

          {/* TITLE */}
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
              Choose Payment Method
            </h1>

            <div className="w-12 h-[3px] bg-orange-500 mx-auto my-3 rounded-full"></div>

            <p className="text-sm text-gray-500 px-2">
              Pay your pending sports fees securely.
            </p>
          </div>

          {/* ================= UPI ================= */}
          <div
            onClick={() => setSelected("upi")}
            className={`rounded-2xl p-4 sm:p-5 border shadow-sm transition-all duration-200 cursor-pointer ${
              selected === "upi"
                ? "border-orange-400 bg-[#fff7f2]"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex gap-3 sm:gap-4 items-start">
              {/* RADIO */}
              <div className="pt-1">
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 border-2 rounded-full flex items-center justify-center ${
                    selected === "upi" ? "border-orange-500" : "border-gray-300"
                  }`}
                >
                  {selected === "upi" && (
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-orange-500 rounded-full"></div>
                  )}
                </div>
              </div>

              {/* ICON */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/5/5e/UPI-Logo-vector.svg"
                  alt="UPI"
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                />
              </div>

              {/* CONTENT */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="font-semibold text-sm sm:text-[15px] text-gray-800">
                    Pay through UPI (via UTR)
                  </h2>

                  <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-[11px] sm:text-xs w-fit">
                    <CheckCircle size={13} />
                    No Transaction Fee
                  </div>
                </div>

                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                  Scan QR and submit UTR number.
                </p>

                {selected === "upi" && (
                  <div className="mt-4 bg-white border rounded-2xl p-4 flex flex-col items-center">
                    {upiLoading ? (
                      <div className="py-10 text-gray-500 text-sm">
                        Loading UPI Details...
                      </div>
                    ) : !upiData?.upiId ? (
                      <div className="py-10 text-red-500 text-sm text-center">
                        Institute UPI details not available
                      </div>
                    ) : (
                      <>
                        {/* QR */}
                        <div className="bg-white rounded-2xl border p-2 shadow-sm">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                              `upi://pay?pa=${upiData?.upiId}&pn=${upiData?.upiName}&am=${totalAmount}&cu=INR`,
                            )}`}
                            alt="QR"
                            className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
                          />
                        </div>

                        {/* UPI DETAILS */}
                        <div className="w-full mt-4 space-y-3">
                          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">UPI ID</p>

                            <p className="font-semibold text-sm break-all text-gray-800">
                              {upiData?.upiId}
                            </p>
                          </div>

                          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">
                              Receiver Name
                            </p>

                            <p className="font-semibold text-sm break-all text-gray-800">
                              {upiData?.upiName}
                            </p>
                          </div>
                        </div>

                        <p className="mt-4 font-semibold text-sm sm:text-base text-center">
                          Scan & Pay ₹{totalAmount}
                        </p>

                        <input
                          value={utr}
                          onChange={(e) =>
                            setUtr(
                              e.target.value
                                .replace(/[^a-zA-Z0-9]/g, "")
                                .toUpperCase(),
                            )
                          }
                          placeholder="Enter UTR Number"
                          className="mt-4 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400"
                        />

                        <button
                          onClick={handleUTRSubmit}
                          disabled={loading}
                          className="mt-4 w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] transition text-white py-3 rounded-xl font-semibold text-sm sm:text-base disabled:opacity-60"
                        >
                          {loading ? "Processing..." : "Submit UTR"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OR */}
          <div className="flex items-center justify-center my-6">
            <div className="flex-1 h-[1px] bg-gray-300"></div>

            <div className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full text-xs font-semibold text-gray-700 shadow-sm mx-3">
              OR
            </div>

            <div className="flex-1 h-[1px] bg-gray-300"></div>
          </div>

          {/* ================= RAZORPAY ================= */}
          <div
            onClick={() => setSelected("razorpay")}
            className={`rounded-2xl p-4 sm:p-5 border shadow-sm transition-all duration-200 cursor-pointer ${
              selected === "razorpay"
                ? "border-orange-400 bg-[#fff7f2]"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex gap-3 sm:gap-4 items-start">
              {/* RADIO */}
              <div className="pt-1">
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 border-2 rounded-full flex items-center justify-center ${
                    selected === "razorpay"
                      ? "border-orange-500"
                      : "border-gray-300"
                  }`}
                >
                  {selected === "razorpay" && (
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-orange-500 rounded-full"></div>
                  )}
                </div>
              </div>

              {/* ICON */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 p-2">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg"
                  alt="Razorpay"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* CONTENT */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h2 className="font-semibold text-sm sm:text-[15px] text-gray-800">
                    Pay using Razorpay
                  </h2>

                  <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-[11px] sm:text-xs w-fit">
                    <Info size={13} />
                    Transaction Fee Applicable
                  </div>
                </div>

                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                  Credit Card, Debit Card, UPI & Net Banking.
                </p>

                {selected === "razorpay" && (
                  <button
                    onClick={handleRazorpay}
                    disabled={loading}
                    className="mt-5 w-full sm:w-auto sm:min-w-[180px] bg-orange-500 hover:bg-orange-600 active:scale-[0.99] transition text-white py-3 px-6 rounded-xl font-semibold text-sm sm:text-base disabled:opacity-60"
                  >
                    {loading ? "Processing..." : `Pay ₹${totalAmount}`}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 bg-[#fff7f2] border border-orange-100 rounded-2xl py-4 px-4 sm:px-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Lock className="text-orange-500" size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Secure Payments
                </p>

                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
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
