// src/pages/PaymentHistory.jsx
import React, { useEffect, useState } from "react";
import {
  collectionGroup,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
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
        setLoading(true);
        console.log("USER UID:", user?.uid);
        // ✅ Query only this trainer's payments
        const snapshot = await getDocs(collectionGroup(db, "payments"));

        let trainerPayments = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          .filter((p) => p.trainerId === user.uid);

        console.log("✅ TRAINER PAYMENTS:", trainerPayments);

        // ✅ Attach student names
        const enrichedPayments = await Promise.all(
          trainerPayments.map(async (p) => {
            try {
              const studentRef = doc(db, "trainerstudents", p.studentId);
              const studentSnap = await getDoc(studentRef);

              let studentName = "Unknown";

              if (studentSnap.exists()) {
                const data = studentSnap.data();
                studentName = `${data.firstName || ""} ${data.lastName || ""}`;
              }

              return {
                ...p,
                studentName,
              };
            } catch (err) {
              return {
                ...p,
                studentName: "Unknown",
              };
            }
          }),
        );

        setPayments(enrichedPayments);
        setFiltered(enrichedPayments);
      } catch (err) {
        alert("Index not created yet. Please wait...");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  // ✅ SEARCH + FILTER
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
      temp = temp.filter((p) => p.month === monthFilter);
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
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Trainer Payment History</h1>

      {/* 🔍 SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by student name..."
          className="border p-2 rounded w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="month"
          className="border p-2 rounded"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        />
      </div>

      {/* 💳 PAYMENTS */}
      <div className="grid gap-5">
        {filtered.map((p) => {
          // ✅ Format month
          let paidMonth = "N/A";

          if (p.month) {
            try {
              const [year, month] = p.month.split("-");
              const monthName = new Date(
                year,
                parseInt(month) - 1,
              ).toLocaleString("en-IN", { month: "long" });

              paidMonth = `${monthName} ${year}`;
            } catch {
              paidMonth = p.month;
            }
          }

          return (
            <div key={p.id} className="bg-white p-5 rounded-xl shadow">
              {/* HEADER */}
              <div className="flex justify-between flex-wrap">
                <div>
                  <h2 className="text-lg font-semibold text-green-600">
                    ₹{p.paidAmount}
                  </h2>
                  <p className="text-sm text-gray-500">Paid on: {p.paidDate}</p>
                </div>

                <p className="text-sm font-medium text-green-600">Paid</p>
              </div>

              <hr className="my-3" />

              {/* DETAILS */}
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <p>
                  <b>Student:</b> {p.studentName}
                </p>

                <p>
                  <b>Student ID:</b> {p.studentId}
                </p>

                <p>
                  <b>Trainer ID:</b> {p.trainerId}
                </p>

                <p>
                  <b>Category:</b> {p.category}
                </p>

                <p>
                  <b>Sub Category:</b> {p.subCategory}
                </p>

                <p>
                  <b>Month:</b> {paidMonth}
                </p>
              </div>

              <hr className="my-3" />

              {/* EXTRA */}
              <div className="text-sm">
                <p>
                  <b>Total Amount:</b> ₹{p.totalAmount}
                </p>

                <p>
                  <b>Fee Waived:</b> {p.feeWaived ? "Yes" : "No"}
                </p>

                {p.feeWaived && (
                  <p>
                    <b>Reason:</b> {p.waiveReason || "-"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentHistory;
