import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
const PaymentsSubscriptionPage = () => {
  const { user } = useAuth();

  const [showPlans, setShowPlans] = useState(false);
  const [billingType, setBillingType] = useState("month");

  const [currentPlan, setCurrentPlan] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [status, setStatus] = useState("");
  const [freeTrialUsed, setFreeTrialUsed] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [planData, setPlanData] = useState(null);
  const navigate = useNavigate();
  /* =============================
     🔹 FETCH SUBSCRIPTION DATA
  ============================= */

  useEffect(() => {
    if (!user?.uid) return;

    const fetchPlan = async () => {
      try {
        const planRef = doc(db, "plans", user.uid);
        const snap = await getDoc(planRef);

        if (snap.exists()) {
          const data = snap.data();
          const cp = data?.currentPlan || {};

          setCurrentPlan(cp?.planType || null);
          setStartDate(cp?.startDate?.toDate?.() || null);
          setEndDate(cp?.endDate?.toDate?.() || null);
          setStatus(data?.status || "");
          setFreeTrialUsed(!!data?.freeTrialUsed);
          setPlanData(data);
        }
      } catch (err) {
        console.error("🔥 Fetch Plan Error:", err);
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchPlan();
  }, [user]);

  const formatDate = (date) => {
    if (!date) return "--";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getProgressPercent = () => {
    if (!startDate || !endDate) return 0;

    const now = new Date().getTime();
    const start = startDate.getTime();
    const end = endDate.getTime();

    if (now <= start) return 0;
    if (now >= end) return 100;

    return ((now - start) / (end - start)) * 100;
  };
  const isPlanActive = () => {
    if (!planData?.currentPlan?.endDate) return false;

    const expiry = planData.currentPlan.endDate.toDate().getTime();
    const now = new Date().getTime();

    return now < expiry;
  };
  /* =============================
     🔹 HANDLE PAYMENT (TEMP SAVE)
  ============================= */

  const handlePayment = async (planName, price) => {
    try {
      await setDoc(doc(db, "subscriptions", user.uid), {
        plan: planName,
        billing: billingType,
        amount: price,
        createdAt: serverTimestamp(),
      });

      alert("Subscription saved in backend!");
    } catch (error) {
      console.error(error);
    }
  };
  console.log("Status:", planData?.status);
  console.log("Now:", new Date());
  console.log("Expiry:", planData?.currentPlan?.endDate?.toDate());
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6">
        Choose Your Plan & Pay
      </h1>

      {/* =============================
         🔶 TRIAL PERIOD CARD
      ============================= */}

      <div className="bg-[#FF6A00] rounded-2xl p-6 sm:p-8 text-white relative mb-10 shadow-md">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#ffffff] p-3 rounded-lg">
              <img
                src="/calendar.png"
                alt="calendar"
                className="w-5 h-5 object-contain"
              />
            </div>

            <h2 className="text-2xl font-semibold tracking-wide">
              Trail Period
            </h2>
          </div>

          <div className="bg-white text-black px-6 py-3 rounded-xl shadow-sm text-center">
            <p className="font-semibold">Active Trial :</p>
            <p className="text-sm">
              {endDate
                ? `${Math.max(
                    0,
                    Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)),
                  )} Days Remaining`
                : "--"}
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6">
          <div className="min-w-[110px]">
            <p className="font-semibold text-white">Trail Started</p>
            <p className="text-xs text-white/80">{formatDate(startDate)}</p>
          </div>

          <div className="flex-1 relative h-[8px] bg-[#8E8E8E] rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-white rounded-full"
              style={{ width: `${getProgressPercent()}%` }}
            />
          </div>

          <div className="min-w-[90px] text-right">
            <p className="font-semibold text-white">Trail End</p>
            <p className="text-xs text-white/80">{formatDate(endDate)}</p>
          </div>
        </div>
      </div>

      {/* =============================
         🔶 ACTIVE SUBSCRIPTION INFO
      ============================= */}

      {currentPlan && (
        <div className="bg-white border border-orange-400 rounded-2xl p-6 mb-10 shadow-md">
          <h2 className="text-2xl font-semibold mb-4">
            Active Subscription Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[16px]">
            <div>
              <p>
                <strong>Plan Type:</strong> {currentPlan}
              </p>
              <p>
                <strong>Status:</strong> {status}
              </p>
              <p>
                <strong>Start Date:</strong> {formatDate(startDate)}
              </p>
              <p>
                <strong>End Date:</strong> {formatDate(endDate)}
              </p>
              <p>
                <strong>Free Trial Used:</strong> {freeTrialUsed ? "Yes" : "No"}
              </p>
            </div>

            {planData?.currentPlan?.payment && (
              <div>
                <p>
                  <strong>Amount:</strong> ₹{" "}
                  {planData.currentPlan.payment.amount}
                </p>
                <p>
                  <strong>Order ID:</strong>{" "}
                  {planData.currentPlan.payment.order_id}
                </p>
                <p>
                  <strong>Payment Mode:</strong>{" "}
                  {planData.currentPlan.payment.payment_mode}
                </p>
                <p>
                  <strong>Tracking ID:</strong>{" "}
                  {planData.currentPlan.payment.tracking_id}
                </p>
                <p>
                  <strong>Bank Ref No:</strong>{" "}
                  {planData.currentPlan.payment.bank_ref_no}
                </p>
                <p>
                  <strong>Payment Status:</strong>{" "}
                  {planData.currentPlan.payment.status}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =============================
         🔶 SUBSCRIPTION HISTORY
      ============================= */}

      {planData?.history?.length > 0 && (
        <div className="bg-white border border-gray-300 rounded-2xl p-6 mb-10 shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Subscription History</h2>

          {planData.history.map((item, index) => (
            <div
              key={index}
              className="border-b border-gray-200 py-4 text-[15px]"
            >
              <p>
                <strong>Plan:</strong> {item.planType}
              </p>
              <p>
                <strong>Start:</strong> {formatDate(item.startDate?.toDate?.())}
              </p>
              <p>
                <strong>End:</strong> {formatDate(item.endDate?.toDate?.())}
              </p>
              <p>
                <strong>Amount:</strong> ₹ {item.payment?.amount}
              </p>
              <p>
                <strong>Payment Mode:</strong> {item.payment?.payment_mode}
              </p>
              <p>
                <strong>Status:</strong> {item.payment?.status}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* =============================
         🔶 CHOOSE PROFILE
      ============================= */}

      <h2 className="text-2xl font-semibold mb-6">Choose Profile</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
        <div className="border border-orange-400 rounded-xl p-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Trainer's Plan</h3>
            <p className="text-orange-600 font-bold mt-2">₹ 199/month</p>
            <p className="text-orange-600 font-bold mt-2">₹ 2,388/year</p>
          </div>
          <button
            onClick={() => {
              if (isPlanActive()) {
                alert(
                  `Your ${currentPlan} plan is active until ${formatDate(
                    planData?.currentPlan?.endDate?.toDate(),
                  )}`,
                );
                return;
              }

              navigate("/plans");
            }}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg"
          >
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentsSubscriptionPage;
