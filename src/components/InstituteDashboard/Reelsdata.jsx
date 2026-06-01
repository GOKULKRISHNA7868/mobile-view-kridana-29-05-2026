import React, { useEffect, useState, useMemo } from "react";
import { db, auth } from "../../firebase";

import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  getDoc,
  doc,
} from "firebase/firestore";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const AnalyticsPage = () => {
  const user = auth.currentUser;

  const [graphData, setGraphData] = useState([]);
  const [topReels, setTopReels] = useState([]);
  const [activeTab, setActiveTab] = useState("views");

  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");

  const [loadingGraph, setLoadingGraph] = useState(false);

  const [employeeStats, setEmployeeStats] = useState({
    joined: 0,
    left: 0,
  });

  const [customerStats, setCustomerStats] = useState({
    joined: 0,
    left: 0,
  });

  const isMobile = window.innerWidth < 768;

  const monthsList = [
    { name: "Jan", value: "01" },
    { name: "Feb", value: "02" },
    { name: "Mar", value: "03" },
    { name: "Apr", value: "04" },
    { name: "May", value: "05" },
    { name: "Jun", value: "06" },
    { name: "Jul", value: "07" },
    { name: "Aug", value: "08" },
    { name: "Sep", value: "09" },
    { name: "Oct", value: "10" },
    { name: "Nov", value: "11" },
    { name: "Dec", value: "12" },
  ];

  /* ================= MONTH FILTER ================= */

  const getDateLimit = () => {
    const now = new Date();

    now.setMonth(now.getMonth() - 1);

    return Timestamp.fromDate(now);
  };

  /* ================= FETCH TOP REELS ================= */

  useEffect(() => {
    if (!user) return;

    const fetchTopReels = async () => {
      try {
        let ownerType = null;
        let ownerDoc = null;

        const instituteDoc = await getDoc(doc(db, "institutes", user.uid));

        if (instituteDoc.exists()) {
          ownerType = "institute";
          ownerDoc = instituteDoc;
        }

        if (!ownerType) {
          const trainerDoc = await getDoc(doc(db, "trainers", user.uid));

          if (trainerDoc.exists()) {
            ownerType = "trainer";
            ownerDoc = trainerDoc;
          }
        }

        if (!ownerType || !ownerDoc) return;

        const data = ownerDoc.data();

        const ownerId = ownerDoc.id;

        const tasks = [];

        if (Array.isArray(data.reels)) {
          for (let idx = 0; idx < data.reels.length; idx++) {
            const reelId = `${ownerType}_${ownerId}_${idx}`;

            const videoUrl = data.reels[idx];

            tasks.push(
              Promise.all([
                getDocs(
                  query(
                    collection(db, "reelViews"),
                    where("reelId", "==", reelId),
                  ),
                ),

                getDocs(
                  query(
                    collection(db, "reelLikes"),
                    where("reelId", "==", reelId),
                  ),
                ),

                getDocs(
                  query(
                    collection(db, "reelDislikes"),
                    where("reelId", "==", reelId),
                  ),
                ),

                getDocs(collection(db, "reelComments", reelId, "comments")),

                getDocs(
                  query(
                    collection(db, "profileViews"),
                    where("ownerId", "==", ownerId),
                  ),
                ),
              ]).then(
                ([
                  viewsSnap,
                  likesSnap,
                  dislikeSnap,
                  commentsSnap,
                  profileSnap,
                ]) => ({
                  reelId,
                  title: data.instituteName || data.trainerName || "Reel",

                  videoUrl,

                  views: viewsSnap.size || 0,
                  likes: likesSnap.size || 0,
                  dislikes: dislikeSnap.size || 0,
                  comments: commentsSnap.size || 0,
                  profileViews: profileSnap.size || 0,
                }),
              ),
            );
          }
        }

        const reelStats = await Promise.all(tasks);

        if (activeTab === "views") {
          reelStats.sort((a, b) => b.views - a.views);
        }

        if (activeTab === "likes") {
          reelStats.sort((a, b) => b.likes - a.likes);
        }

        if (activeTab === "comments") {
          reelStats.sort((a, b) => b.comments - a.comments);
        }

        if (activeTab === "dislikes") {
          reelStats.sort((a, b) => b.dislikes - a.dislikes);
        }

        setTopReels(reelStats);
      } catch (err) {
        console.error("Dynamic reel analytics error:", err);
      }
    };

    fetchTopReels();
  }, [user, activeTab]);

  /* ================= WORKFORCE ================= */

  useEffect(() => {
    if (!user) return;

    const fetchWorkforce = async () => {
      try {
        const trainersSnap = await getDocs(
          query(
            collection(db, "InstituteTrainers"),
            where("instituteId", "==", user.uid),
          ),
        );

        const studentsSnap = await getDocs(
          query(
            collection(db, "students"),
            where("instituteId", "==", user.uid),
          ),
        );

        const start = startMonth ? parseInt(startMonth) : 1;

        const end = endMonth ? parseInt(endMonth) : 12;

        let joinedEmployees = 0;

        trainersSnap.forEach((docSnap) => {
          const d = docSnap.data();

          let joinDate = null;

          if (d.joiningDate) {
            joinDate = new Date(d.joiningDate);
          } else if (d.createdAt?.toDate) {
            joinDate = d.createdAt.toDate();
          }

          if (!joinDate || isNaN(joinDate)) return;

          const year = joinDate.getFullYear();

          const month = joinDate.getMonth() + 1;

          const validYear = Number(year) === Number(selectedYear);

          const validMonth = month >= start && month <= end;

          if (validYear && validMonth) {
            joinedEmployees++;
          }
        });

        let joinedCustomers = 0;

        studentsSnap.forEach((docSnap) => {
          const d = docSnap.data();

          let joinDate = null;

          if (d.joiningDate) {
            joinDate = new Date(d.joiningDate);
          } else if (d.createdAt?.toDate) {
            joinDate = d.createdAt.toDate();
          }

          if (!joinDate || isNaN(joinDate)) return;

          const year = joinDate.getFullYear();

          const month = joinDate.getMonth() + 1;

          const validYear = Number(year) === Number(selectedYear);

          const validMonth = month >= start && month <= end;

          if (validYear && validMonth) {
            joinedCustomers++;
          }
        });

        setEmployeeStats({
          joined: joinedEmployees,
          left: 0,
        });

        setCustomerStats({
          joined: joinedCustomers,
          left: 0,
        });
      } catch (err) {
        console.error("Workforce filter error:", err);
      }
    };

    fetchWorkforce();
  }, [user, selectedYear, startMonth, endMonth]);

  /* ================= PLAY VIDEO ================= */

  const handlePlayReel = (videoUrl) => {
    if (!videoUrl) return;

    setActiveVideoUrl(videoUrl);

    setShowVideoPopup(true);
  };

  /* ================= FETCH GRAPH DATA ================= */

  useEffect(() => {
    if (!user) return;

    const fetchGraphData = async () => {
      setLoadingGraph(true);

      try {
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];

        const start = startMonth ? parseInt(startMonth) : 1;

        const end = endMonth ? parseInt(endMonth) : 12;

        /* ===== FETCH ===== */

        const studentSnap = await getDocs(
          query(
            collection(db, "studentFees"),
            where("instituteId", "==", user.uid),
          ),
        );

        const salarySnap = await getDocs(
          query(
            collection(db, "instituteSalaries"),
            where("instituteId", "==", user.uid),
          ),
        );

        const expenseSnap = await getDocs(
          query(
            collection(db, "instituteExpenses"),
            where("instituteId", "==", user.uid),
          ),
        );

        const revenueMap = {};

        const salaryMap = {};

        const expenseMap = {};

        /* ================= REVENUE ================= */

        studentSnap.forEach((docSnap) => {
          const d = docSnap.data();

          let month = "";

          let year = "";

          if (typeof d.month === "string" && d.month.includes("-")) {
            const parts = d.month.split("-");

            year = parts[0];

            month = parts[1];
          } else {
            month = d.month?.toString().padStart(2, "0");

            year = d.year?.toString();
          }

          if (selectedYear && year && Number(year) !== Number(selectedYear)) {
            return;
          }

          if (!month) return;

          revenueMap[month] =
            (revenueMap[month] || 0) + Number(d.paidAmount || 0);
        });

        /* ================= SALARY ================= */

        salarySnap.forEach((docSnap) => {
          const d = docSnap.data();

          let month = "";

          let year = "";

          if (typeof d.month === "string" && d.month.includes("-")) {
            const parts = d.month.split("-");

            year = parts[0];

            month = parts[1];
          } else {
            month = d.month?.toString().padStart(2, "0");

            year = d.year?.toString();
          }

          if (selectedYear && year && Number(year) !== Number(selectedYear)) {
            return;
          }

          if (!month) return;

          salaryMap[month] =
            (salaryMap[month] || 0) + Number(d.paidAmount || 0);
        });

        /* ================= EXPENSES ================= */

        expenseSnap.forEach((docSnap) => {
          const d = docSnap.data();

          let month = "";

          let year = "";

          if (typeof d.month === "string" && d.month.includes("-")) {
            const parts = d.month.split("-");

            year = parts[0];

            month = parts[1];
          } else {
            month = d.month?.toString().padStart(2, "0");

            year = d.year?.toString();
          }

          if (selectedYear && year && Number(year) !== Number(selectedYear)) {
            return;
          }

          if (!month) return;

          expenseMap[month] = (expenseMap[month] || 0) + Number(d.amount || 0);
        });

        /* ================= FINAL ================= */

        const data = [];

        for (let m = start; m <= end; m++) {
          const monthStr = m.toString().padStart(2, "0");

          const revenue = revenueMap[monthStr] || 0;

          const salary = salaryMap[monthStr] || 0;

          const expense = expenseMap[monthStr] || 0;

          const totalExpenses = salary + expense;

          data.push({
            month: months[m - 1],

            revenue,

            salary,

            expense,

            totalExpenses,

            profit: revenue - totalExpenses,
          });
        }

        setGraphData(data);
      } catch (err) {
        console.error("Graph error:", err);
      }

      setLoadingGraph(false);
    };

    fetchGraphData();
  }, [user, selectedYear, startMonth, endMonth]);

  /* ================= CALCULATIONS ================= */

  const totalRevenue = useMemo(() => {
    return graphData.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  }, [graphData]);

  const totalSalary = useMemo(() => {
    return graphData.reduce((sum, item) => sum + Number(item.salary || 0), 0);
  }, [graphData]);

  const totalExpense = useMemo(() => {
    return graphData.reduce((sum, item) => sum + Number(item.expense || 0), 0);
  }, [graphData]);

  const totalExpenses = useMemo(() => {
    return graphData.reduce(
      (sum, item) => sum + Number(item.totalExpenses || 0),
      0,
    );
  }, [graphData]);

  const totalProfit = useMemo(() => {
    return totalRevenue - totalExpenses;
  }, [totalRevenue, totalExpenses]);

  const highestMonth = graphData.reduce(
    (max, item) => (item.revenue > max.revenue ? item : max),

    graphData[0] || { revenue: 0 },
  );

  const lowestMonth = graphData.reduce(
    (min, item) => (item.revenue < min.revenue ? item : min),

    graphData[0] || { revenue: 0 },
  );

  /* ================= PDF ================= */

  const downloadPDFReport = async () => {
    try {
      const reportHTML = `
      <div style="width:794px;padding:30px;font-family:Arial">

      <div style="display:flex;justify-content:space-between;margin-bottom:20px">

      <div style="display:flex;align-items:center;gap:10px">

      <img src="/logo.png" style="width:50px;height:50px"/>

      <div>
      <h2>Institute Analytics Report</h2>

      <p>
      Year: ${selectedYear}
      </p>

      </div>

      </div>

      <p>
      Generated: ${new Date().toLocaleDateString()}
      </p>

      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:25px">

      <div style="border:1px solid #ddd;padding:15px;border-radius:10px">
      <p>Total Revenue</p>
      <h2>₹ ${totalRevenue.toLocaleString()}</h2>
      </div>

      <div style="border:1px solid #ddd;padding:15px;border-radius:10px">
      <p>Total Salary</p>
      <h2>₹ ${totalSalary.toLocaleString()}</h2>
      </div>

      <div style="border:1px solid #ddd;padding:15px;border-radius:10px">
      <p>Total Expenses</p>
      <h2>₹ ${totalExpense.toLocaleString()}</h2>
      </div>

      <div style="border:1px solid #ddd;padding:15px;border-radius:10px">
      <p>Total Profit</p>
      <h2>₹ ${totalProfit.toLocaleString()}</h2>
      </div>

      </div>

      <table style="width:100%;border-collapse:collapse;font-size:14px">

      <thead>

      <tr style="background:#f2f2f2">

      <th style="border:1px solid #ccc;padding:8px">
      Month
      </th>

      <th style="border:1px solid #ccc;padding:8px">
      Revenue
      </th>

      <th style="border:1px solid #ccc;padding:8px">
      Salary
      </th>

      <th style="border:1px solid #ccc;padding:8px">
      Expenses
      </th>

      <th style="border:1px solid #ccc;padding:8px">
      Total
      </th>

      <th style="border:1px solid #ccc;padding:8px">
      Profit
      </th>

      </tr>

      </thead>

      <tbody>

      ${graphData
        .map(
          (r) => `
      <tr>

      <td style="border:1px solid #ccc;padding:8px;text-align:center">
      ${r.month}
      </td>

      <td style="border:1px solid #ccc;padding:8px;text-align:center">
      ₹ ${r.revenue.toLocaleString()}
      </td>

      <td style="border:1px solid #ccc;padding:8px;text-align:center">
      ₹ ${r.salary.toLocaleString()}
      </td>

      <td style="border:1px solid #ccc;padding:8px;text-align:center">
      ₹ ${r.expense.toLocaleString()}
      </td>

      <td style="border:1px solid #ccc;padding:8px;text-align:center">
      ₹ ${r.totalExpenses.toLocaleString()}
      </td>

      <td style="border:1px solid #ccc;padding:8px;text-align:center">
      ₹ ${r.profit.toLocaleString()}
      </td>

      </tr>
      `,
        )
        .join("")}

      </tbody>

      </table>

      </div>
      `;

      const container = document.createElement("div");

      container.innerHTML = reportHTML;

      container.style.position = "fixed";

      container.style.left = "-9999px";

      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 190;

      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);

      pdf.save(`Analytics_Report_${selectedYear}.pdf`);

      document.body.removeChild(container);
    } catch (err) {
      console.error("PDF generation error:", err);
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen pb-24 bg-gray-50 p-3 sm:p-4 md:p-6 overflow-x-hidden">
      {/* HEADER */}

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Growth & Performance Overview
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Track revenue, salary, expenses, profit and workforce
          </p>
        </div>

        {/* FILTERS */}

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full xl:w-auto">
          {/* YEAR */}

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border bg-white px-4 py-3 rounded-xl shadow-sm text-sm w-full sm:w-auto"
          >
            {[2023, 2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* START MONTH */}

          <select
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="border bg-white px-4 py-3 rounded-xl shadow-sm text-sm w-full sm:w-auto"
          >
            <option value="">From Month</option>

            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>

          {/* END MONTH */}

          <select
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            className="border bg-white px-4 py-3 rounded-xl shadow-sm text-sm w-full sm:w-auto"
          >
            <option value="">To Month</option>

            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>

          {/* DOWNLOAD */}

          <button
            onClick={downloadPDFReport}
            className="bg-orange-500 hover:bg-orange-600 transition text-white px-5 py-3 rounded-xl font-semibold shadow-sm w-full sm:w-auto"
          >
            Download Report
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-5 mb-8">
        {/* TOTAL REVENUE */}

        <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Total Revenue</p>

          <p className="text-lg sm:text-2xl font-bold text-green-600 mt-2 break-words">
            ₹ {totalRevenue.toLocaleString()}
          </p>
        </div>

        {/* SALARY */}

        <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Salary</p>

          <p className="text-lg sm:text-2xl font-bold text-blue-600 mt-2 break-words">
            ₹ {totalSalary.toLocaleString()}
          </p>
        </div>

        {/* EXPENSES */}

        <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Expenses</p>

          <p className="text-lg sm:text-2xl font-bold text-red-500 mt-2 break-words">
            ₹ {totalExpense.toLocaleString()}
          </p>
        </div>

        {/* TOTAL EXPENSES */}

        <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Total Outflow</p>

          <p className="text-lg sm:text-2xl font-bold text-orange-600 mt-2 break-words">
            ₹ {totalExpenses.toLocaleString()}
          </p>
        </div>

        {/* PROFIT */}

        <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Profit</p>

          <p className="text-lg sm:text-2xl font-bold text-emerald-600 mt-2 break-words">
            ₹ {totalProfit.toLocaleString()}
          </p>
        </div>

        {/* VIDEO VIEWS */}

        <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Video Views</p>

          <p className="text-lg sm:text-2xl font-bold text-orange-600 mt-2">
            {topReels.reduce((s, r) => s + Number(r.views || 0), 0)}
          </p>
        </div>
      </div>

      {/* TOP CONTENT */}

      <div className="bg-white border rounded-3xl p-3 sm:p-6 shadow-sm overflow-hidden">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5">
          Top Content Insights
        </h2>

        {/* TABS */}

        <div className="overflow-x-auto scrollbar-hide mb-5">
          <div className="flex gap-3 min-w-max border-b pb-2">
            {["views", "likes", "dislikes", "comments"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-2 whitespace-nowrap capitalize text-xs sm:text-sm md:text-base transition ${
                  activeTab === tab
                    ? "text-orange-600 border-b-2 border-orange-600 font-semibold"
                    : "text-gray-500 hover:text-orange-500"
                }`}
              >
                {`Most ${tab}`}
              </button>
            ))}
          </div>
        </div>

        {/* TABLE */}

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="hidden md:grid grid-cols-6 bg-black text-orange-500 text-sm font-semibold px-4 py-4">
            <div className="col-span-2">Title</div>

            <div className="text-center">Views</div>

            <div className="text-center">Likes</div>

            <div className="text-center">Comments</div>
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y">
            {topReels.map((reel, i) => (
              <div
                key={i}
                className="flex md:grid md:grid-cols-6 flex-col md:flex-row gap-3 md:gap-0 px-4 py-4 text-sm hover:bg-gray-50 transition border-b"
              >
                <div>
                  <button
                    onClick={() => handlePlayReel(reel.videoUrl)}
                    className="bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    ▶ Play
                  </button>
                </div>

                <div className="col-span-2 pr-2">
                  <p className="line-clamp-2 font-medium text-gray-800">
                    {reel.title}
                  </p>
                </div>

                <div className="md:text-center font-medium">
                  <span className="md:hidden text-gray-500 mr-2">Views:</span>

                  {reel.views}
                </div>

                <div className="md:text-center font-medium">
                  <span className="md:hidden text-gray-500 mr-2">Likes:</span>

                  {reel.likes}
                </div>

                <div className="md:text-center font-medium">
                  <span className="md:hidden text-gray-500 mr-2">
                    Comments:
                  </span>

                  {reel.comments}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIDEO POPUP */}

        {showVideoPopup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-black rounded-3xl p-2 sm:p-3 w-full max-w-2xl relative">
              <button
                onClick={() => {
                  setShowVideoPopup(false);

                  setActiveVideoUrl(null);
                }}
                className="absolute top-2 right-3 text-white text-xl"
              >
                ✕
              </button>

              <video
                src={activeVideoUrl}
                controls
                autoPlay
                playsInline
                className="w-full rounded-xl"
              />
            </div>
          </div>
        )}
      </div>

      {/* LOADER */}

      {loadingGraph && (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>

          <p className="mt-3 text-gray-500">Loading analytics...</p>
        </div>
      )}

      {/* BAR CHART */}

      <h2 className="text-xl font-semibold mt-8 mb-4">Revenue Reports</h2>

      <div className="bg-white shadow-sm border rounded-3xl p-3 sm:p-5 overflow-hidden">
        <ResponsiveContainer
          width="100%"
          height={window.innerWidth < 640 ? 260 : 340}
        >
          <BarChart data={graphData}>
            <XAxis dataKey="month" />

            <YAxis />

            <Tooltip />

            <Bar dataKey="revenue" fill="#22c55e" />

            <Bar dataKey="salary" fill="#3b82f6" />

            <Bar dataKey="expense" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* LINE CHART */}

      <h2 className="text-xl font-semibold mt-10 mb-4">Payroll Overview</h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* LEFT GRAPH */}

        <div className="xl:col-span-2 bg-white shadow-sm border rounded-3xl p-3 sm:p-5 overflow-hidden">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={graphData}>
              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={isMobile ? 2 : 3}
              />

              <Line type="monotone" dataKey="salary" stroke="#3b82f6" />

              <Line type="monotone" dataKey="expense" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* RIGHT CARDS */}

        <div className="flex flex-col gap-5">
          {/* HIGHEST */}

          <div className="bg-white border border-orange-100 shadow-sm rounded-3xl p-5">
            <p className="text-green-600 font-semibold text-sm">
              Highest Revenue
            </p>

            <h3 className="text-2xl font-bold break-words">
              ₹ {highestMonth?.revenue?.toLocaleString()}
            </h3>

            <p className="text-gray-600">{highestMonth?.month}</p>
          </div>

          {/* LOWEST */}

          <div className="bg-white border border-orange-100 shadow-sm rounded-3xl p-5">
            <p className="text-red-500 font-semibold text-sm">Lowest Revenue</p>

            <h3 className="text-2xl font-bold break-words">
              ₹ {lowestMonth?.revenue?.toLocaleString()}
            </h3>

            <p className="text-gray-600">{lowestMonth?.month}</p>
          </div>

          {/* TOTAL */}

          <div className="bg-white border border-orange-100 shadow-sm rounded-3xl p-5">
            <p className="text-gray-600 font-semibold text-sm">
              Total Collected Fees
            </p>

            <h3 className="text-2xl font-bold break-words">
              ₹ {totalRevenue.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* WORKFORCE */}

      <div className="bg-white border rounded-3xl p-4 sm:p-6 mt-5 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Workforce & Clients Metrics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-orange-100 p-5 rounded-3xl bg-orange-50">
            <h3 className="text-xl font-semibold">Employees</h3>

            <p className="mt-2">Joined: {employeeStats.joined}</p>
          </div>

          <div className="border border-orange-100 p-5 rounded-2xl bg-orange-50">
            <h3 className="text-xl font-semibold">Customers</h3>

            <p className="mt-2">Joined: {customerStats.joined}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
