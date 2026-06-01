import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { auth, db } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useSelectedStudent } from "../../context/SelectedStudentContext";
import { useNavigate } from "react-router-dom";
const PaymentOverview = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showReminder, setShowReminder] = useState(false);
  const [generatedMonths, setGeneratedMonths] = useState([]);
  const { selectedStudentUid } = useSelectedStudent();
  const [user, setUser] = useState(null);
  const activeStudentId = selectedStudentUid || user?.uid;
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [feeHistory, setFeeHistory] = useState([]);
  const navigate = useNavigate();

  const filteredHistory = feeHistory.filter(
    (f) =>
      (!selectedCategory || f.category === selectedCategory) &&
      (!selectedSubCategory || f.subCategory === selectedSubCategory),
  );

  const totalPaid = filteredHistory.reduce(
    (sum, f) => sum + Number(f.paidAmount || 0),
    0,
  );

  const [processing, setProcessing] = useState(false);
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://kridana-razorpay-backend.onrender.com";
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setLoading(false);
        return;
      }
      setUser(u);
    });

    return () => unsub();
  }, []);
  useEffect(() => {
    if (!activeStudentId) return;

    const fetchStudentData = async () => {
      setLoading(true);

      try {
        // =========================
        // Fetch student profile
        // =========================
        const studentRef = doc(db, "students", activeStudentId);
        const snap = await getDoc(studentRef);

        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        const studentData = snap.data();
        setStudent(studentData);

        // =========================
        // Fetch payment history
        // =========================
        const feesRef = collection(db, "studentFees");

        const q = query(feesRef, where("studentId", "==", activeStudentId));

        const feesSnap = await getDocs(q);

        console.log(
          "Fetched Fees:",
          feesSnap.docs.map((d) => d.data()),
        );

        const history = [];
        let paidSum = 0;

        feesSnap.forEach((doc) => {
          const data = doc.data();

          history.push(data);
          paidSum += Number(data.paidAmount || 0);
        });

        setFeeHistory(history);

        // =========================
        // Generate months
        // =========================
        // =========================
        // Generate months
        // =========================
        if (studentData.createdAt) {
          const startDate = studentData.createdAt.toDate();
          const today = new Date();

          const monthsArray = [];

          let tempDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            1,
          );

          while (
            tempDate.getFullYear() < today.getFullYear() ||
            (tempDate.getFullYear() === today.getFullYear() &&
              tempDate.getMonth() <= today.getMonth()) // ✅ include current month
          ) {
            const monthName = tempDate.toLocaleString("default", {
              month: "long",
            });

            const year = tempDate.getFullYear();
            const monthKey = `${year}-${String(
              tempDate.getMonth() + 1,
            ).padStart(2, "0")}`;

            const isPaid = history.some(
              (item) =>
                item.month ===
                `${year}-${String(tempDate.getMonth() + 1).padStart(2, "0")}`,
            );

            monthsArray.push({
              month: monthName,
              year,
              key: monthKey,
              paid: isPaid,
            });

            tempDate.setMonth(tempDate.getMonth() + 1);
          }

          setGeneratedMonths(monthsArray);
        }

        // =========================
        // Reminder logic
        // =========================
        if (studentData.monthlyDate) {
          const today = new Date().getDate();
          const dueDay = Number(studentData.monthlyDate);

          if (today >= dueDay - 5 && today < dueDay) {
            setShowReminder(true);
          } else {
            setShowReminder(false);
          }
        }
      } catch (err) {
        console.error("Error fetching payment:", err);
      }

      setLoading(false);
    };

    fetchStudentData();
  }, [activeStudentId, selectedCategory, selectedSubCategory]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!student) return <div className="p-8">No Data Found</div>;

  let monthlyFee = 0;

  if (selectedSubCategory) {
    const sport = student.sports.find(
      (s) => s.subCategory === selectedSubCategory,
    );

    monthlyFee = Number(sport?.fee || 0);
  } else {
    monthlyFee = (student.sports || []).reduce(
      (sum, s) => sum + Number(s.fee || 0),
      0,
    );
  }
  let expectedTotalFee = 0;

  generatedMonths.forEach((m) => {
    student.sports.forEach((sport) => {
      const record = feeHistory.find(
        (f) =>
          f.month?.trim() === m.key?.trim() &&
          f.category?.trim().toLowerCase() ===
            sport.category?.trim().toLowerCase() &&
          f.subCategory?.trim().toLowerCase() ===
            sport.subCategory?.trim().toLowerCase(),
      );
      // If record exists AND paidAmount = 0 AND reason exists → skip fee
      if (record && Number(record.paidAmount) === 0 && record.reason) {
        return;
      }

      expectedTotalFee += Number(sport.fee || 0);
    });
  });
  let pendingFee = 0;

  generatedMonths.forEach((m) => {
    student.sports.forEach((sport) => {
      const record = feeHistory.find(
        (f) =>
          f.month === m.key &&
          f.category === sport.category &&
          f.subCategory === sport.subCategory,
      );

      // If record exists (even if amount is 0) → treat as handled
      if (record) return;

      // No record → unpaid
      pendingFee += Number(sport.fee || 0);
    });
  });

  const categories = [
    ...new Set((student?.sports || []).map((s) => s.category)),
  ];

  const subCategories = [
    ...new Set(
      (student?.sports || [])
        .filter((s) => !selectedCategory || s.category === selectedCategory)
        .map((s) => s.subCategory),
    ),
  ];

  return (
    <div className="bg-white flex flex-col h-full max-h-full overflow-hidden px-3 sm:px-5 md:px-8 py-4 md:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
          Payment Overview
        </h1>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedSubCategory("");
          }}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select
          value={selectedSubCategory}
          onChange={(e) => setSelectedSubCategory(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All SubCategories</option>
          {subCategories.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 h-full min-h-0 overflow-hidden">
          <div className="bg-white border border-orange-400 rounded-lg w-full flex flex-col h-full min-h-0 overflow-hidden">
            {/* Top Section */}
            <div className="p-5 border-b border-orange-300">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">
                    Customer 01 : {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {(student.sports || []).map((sport, i) => (
                      <span key={i}>
                        {sport.category} - {sport.subCategory}
                        {i !== student.sports.length - 1 && ", "}
                      </span>
                    ))}
                  </p>
                </div>
                <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-600">Due Amount</p>
                <p className="text-red-500 font-semibold text-lg">
                  ₹{monthlyFee}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  To be paid :Every Month {student.monthlyDate}th
                </p>
              </div>
            </div>

            {/* Payment History */}
            {/* Payment History */}
            <div className="flex-1 min-h-0 overflow-y-auto p-5 border-b border-orange-300">
              <h4 className="font-semibold mb-3 sticky top-0 bg-white z-10 pb-2">
                Payment History
              </h4>

              {generatedMonths.length === 0 && (
                <p className="text-xs text-gray-400">No payments found</p>
              )}

              {generatedMonths.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row justify-between text-sm mb-3 gap-2"
                >
                  <div>
                    <p className="font-medium">
                      {item.month} {item.year}
                    </p>
                    <p className="text-gray-500 text-xs">
                      Due Date: {item.month} {student.monthlyDate}
                    </p>
                  </div>

                  {(() => {
                    const records = student.sports.map((sport) => {
                      const record = feeHistory.find(
                        (f) =>
                          f.month === item.key &&
                          f.category === sport.category &&
                          f.subCategory === sport.subCategory,
                      );

                      return {
                        category: sport.category,
                        subCategory: sport.subCategory,
                        amount: Number(sport.fee || 0), // ✅ attach fee HERE
                        paidAmount: record?.paidAmount || 0,
                        paid: record && Number(record.paidAmount) > 0,
                      };
                    });

                    const hasPending = records.some(
                      (r) => !r.paid || r.paidAmount === 0,
                    );

                    // 🔥 PAY NOW HANDLER
                    const handlePayNow = () => {
                      const unpaidRecords = student.sports
                        .map((sport) => {
                          const record = feeHistory.find(
                            (f) =>
                              f.month === item.key &&
                              f.category === sport.category &&
                              f.subCategory === sport.subCategory,
                          );

                          if (record && Number(record.paidAmount) > 0)
                            return null;

                          return {
                            category: sport.category,
                            subCategory: sport.subCategory,
                            amount: Number(sport.fee || 0),
                          };
                        })
                        .filter(Boolean);

                      const totalAmount = unpaidRecords.reduce(
                        (sum, r) => sum + r.amount,
                        0,
                      );

                      navigate("/PaymentSelection", {
                        state: {
                          paymentType: "multiple",

                          studentId: activeStudentId,

                          studentName: `${student.firstName} ${student.lastName}`,

                          month: item.key,

                          items: unpaidRecords,

                          totalAmount,

                          student,
                        },
                      });
                    };

                    return (
                      <div className="text-left sm:text-right">
                        {records.map((r, i) => {
                          const handleSinglePayment = () => {
                            navigate("/PaymentSelection", {
                              state: {
                                paymentType: "single",

                                studentId: activeStudentId,

                                studentName: `${student.firstName} ${student.lastName}`,

                                month: item.key,

                                items: [
                                  {
                                    category: r.category,
                                    subCategory: r.subCategory,
                                    amount: r.amount,
                                  },
                                ],

                                totalAmount: r.amount,

                                student,
                              },
                            });
                          };

                          return (
                            <div key={i} className="mb-3 border-b pb-2">
                              <p className="text-xs font-medium">
                                {r.category} - {r.subCategory}
                              </p>

                              {r.paid ? (
                                <p className="text-green-600 text-xs">
                                  Paid ₹{r.paidAmount}
                                </p>
                              ) : (
                                <>
                                  <p className="text-red-600 text-xs mb-1">
                                    Unpaid ₹{r.amount}
                                  </p>

                                  <button
                                    onClick={handleSinglePayment}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs w-full sm:w-auto hover:bg-blue-700"
                                  >
                                    Pay Now
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>

            {/* Bottom Summary */}
            <div className="p-5 text-sm font-medium">
              <div className="flex justify-between mb-2">
                <p>Total Fees</p>
                <p>₹{expectedTotalFee}</p>
              </div>

              <div className="flex justify-between mb-2">
                <p>Fees Paid</p>
                <p className="text-green-600">₹{totalPaid}</p>
              </div>

              <div className="flex justify-between">
                <p>Pending Fees</p>
                <p className="text-red-600">₹{pendingFee}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🔴 Reminder Popup */}
        {showReminder && (
          <div className="fixed top-5 right-5 z-50 animate-bounce">
            <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg">
              <p className="font-semibold">Payment Reminder 🔔</p>
              <p className="text-sm mt-1">
                Your fee is due on {student.monthlyDate}
              </p>
            </div>
          </div>
        )}
        {processing && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white px-6 py-5 rounded-xl shadow-lg flex flex-col items-center gap-3">
              {/* Spinner */}
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>

              {/* Text */}
              <p className="text-sm font-semibold text-gray-700">
                Processing Payment...
              </p>

              <p className="text-xs text-gray-400">
                Please don’t close this page
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentOverview;
