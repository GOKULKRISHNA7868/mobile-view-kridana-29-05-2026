// src/pages/PaymentHistory.jsx
import React, { useEffect, useState } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

const PaymentHistory = () => {
  const { user } = useAuth();

  const [payments, setPayments] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPayments = async () => {
      try {
        // ✅ Fetch ALL payments from ALL users
        const snapshot = await getDocs(collectionGroup(db, "payments"));

        const allPayments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("🔥 ALL PAYMENTS:", allPayments);

        // ✅ Filter only this institute
        const institutePayments = allPayments.filter(
          (p) => p.instituteId === user.uid,
        );

        console.log("✅ FILTERED PAYMENTS:", institutePayments);

        setPayments(institutePayments);
        setFiltered(institutePayments);
      } catch (err) {
        console.error("❌ Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  // ✅ SEARCH + FILTER LOGIC
  useEffect(() => {
    let temp = [...payments];

    // 🔍 Search by student name
    if (search) {
      temp = temp.filter((p) =>
        p.studentName?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // 📅 Filter by month
    if (monthFilter) {
      temp = temp.filter((p) =>
        p.items?.some((item) => item.month === monthFilter),
      );
    }

    setFiltered(temp);
  }, [search, monthFilter, payments]);

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  if (filtered.length === 0) {
    return <div className="p-6 text-center">No payments found ❌</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-4 md:p-6 lg:p-8 w-full">
      <h1 className="text-2xl font-bold mb-4">Payment History</h1>

      {/* 🔍 SEARCH + FILTER */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-6 w-full">
        <input
          type="text"
          placeholder="Search by student name..."
          className="border p-2 rounded w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="month"
          className="border p-2 rounded w-full sm:w-auto"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        />
      </div>

      {/* 💳 PAYMENTS */}
      <div className="grid gap-5">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white p-5 rounded-xl shadow">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-green-600">
                  ₹{p.totalAmount}
                </h2>
                <p className="text-sm text-gray-500">
                  Paid on: {p.date} • {p.time}
                </p>
              </div>

              <p className="text-xs sm:text-sm font-medium text-green-600 capitalize">
                {p.status}
              </p>
            </div>

            <hr className="my-3" />

            {/* DETAILS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <p>
                <b>Student:</b> {p.studentName}
              </p>
              <p>
                <b>Order ID:</b> {p.orderId}
              </p>
              <p>
                <b>Payment ID:</b> {p.paymentId}
              </p>
            </div>

            <hr className="my-3" />

            {/* ITEMS */}
            <div>
              <h3 className="font-semibold mb-2">Items Paid:</h3>

              {p.items?.map((item, i) => {
                let paidMonth = "N/A";

                // ✅ Priority 1: item.month
                let rawMonth = item?.month;

                // ✅ Priority 2: fallback to p.month
                if (!rawMonth && p.month) {
                  rawMonth = p.month;
                }

                // ✅ Convert if exists
                if (rawMonth) {
                  try {
                    const [year, month] = rawMonth.split("-");

                    const monthName = new Date(
                      year,
                      parseInt(month) - 1,
                    ).toLocaleString("en-IN", { month: "long" });

                    paidMonth = `${monthName} ${year}`;
                  } catch {
                    paidMonth = rawMonth;
                  }
                }

                return (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2 text-xs sm:text-sm border-b py-2"
                  >
                    <div>
                      <p className="break-words">
                        {item.category} - {item.subCategory}
                      </p>

                      <p className="text-xs text-gray-500">
                        For Month: <b>{paidMonth}</b>
                      </p>
                    </div>

                    <span className="font-medium text-right sm:text-left">
                      ₹{item.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentHistory;