import React, { useEffect, useState } from "react";
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
import { ChevronDown } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
const AnalyticsPage = () => {
  const user = auth.currentUser;

  const [reels, setReels] = useState([]);
  const [filterMonths, setFilterMonths] = useState(1);
  const [graphData, setGraphData] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [topReels, setTopReels] = useState([]);
  const [activeTab, setActiveTab] = useState("views");
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState(null);
  const [endMonth, setEndMonth] = useState(null);
  const [employeeStats, setEmployeeStats] = useState({
    joined: 0,
    left: 0,
  });

  const [customerStats, setCustomerStats] = useState({
    joined: 0,
    left: 0,
  });
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
    now.setMonth(now.getMonth() - filterMonths);
    return Timestamp.fromDate(now);
  };

  /* ================= FETCH TOP REELS (DYNAMIC LOGIN BASED) ================= */
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

        const tasks = [];
        const data = ownerDoc.data();
        const ownerId = ownerDoc.id;

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
        setTopReels(reelStats);

        if (reelStats.length === 0) return;

        if (activeTab === "views") reelStats.sort((a, b) => b.views - a.views);
        if (activeTab === "likes") reelStats.sort((a, b) => b.likes - a.likes);
        if (activeTab === "comments")
          reelStats.sort((a, b) => b.comments - a.comments);
        if (activeTab === "dislikes")
          reelStats.sort((a, b) => b.dislikes - a.dislikes);

        setTopReels(reelStats);
      } catch (err) {
        console.error("Dynamic reel analytics error:", err);
      }
    };

    fetchTopReels();
  }, [user, activeTab]);

  /* ================= WORKFORCE (STATIC SAFE) ================= */
  useEffect(() => {
    if (!user) return;

    const fetchWorkforce = async () => {
      const trainersSnap = await getDocs(
        query(
          collection(db, "InstituteTrainers"),
          where("instituteId", "==", user.uid),
        ),
      );

      const studentsSnap = await getDocs(
        query(collection(db, "students"), where("instituteId", "==", user.uid)),
      );

      setEmployeeStats({
        joined: trainersSnap.size || 0,
        left: 0,
      });

      setCustomerStats({
        joined: studentsSnap.size || 0,
        left: 0,
      });
    };

    fetchWorkforce();
  }, [user]);

  const handlePlayReel = (videoUrl) => {
    if (!videoUrl) return;
    setActiveVideoUrl(videoUrl);
    setShowVideoPopup(true);
  };

  /* ================= ===== REAL GRAPH DATA BASED ON STUDENTS FEES & SALARIES ===== ================= */
  const [loadingGraph, setLoadingGraph] = useState(false);

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

        /* ===== FETCH ALL DATA ONLY ONCE ===== */

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

        const incomeMap = {};
        const salaryMap = {};

        /* ===== PROCESS STUDENT FEES ===== */

        studentSnap.forEach((doc) => {
          const d = doc.data();

          if (selectedYear && d.year && Number(d.year) !== Number(selectedYear))
            return;

          const m = d.month;

          incomeMap[m] = (incomeMap[m] || 0) + Number(d.paidAmount || 0);
        });

        /* ===== PROCESS SALARIES ===== */

        salarySnap.forEach((doc) => {
          const d = doc.data();

          if (selectedYear && d.year && Number(d.year) !== Number(selectedYear))
            return;

          const m = d.month;

          salaryMap[m] = (salaryMap[m] || 0) + Number(d.paidAmount || 0);
        });

        const data = [];

        for (let m = start; m <= end; m++) {
          const monthStr = m.toString().padStart(2, "0");

          const revenue = incomeMap[monthStr] || 0;
          const salary = salaryMap[monthStr] || 0;

          data.push({
            month: months[m - 1],
            revenue,
            salary,
            profit: revenue - salary,
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
  const downloadPDFReport = async () => {
    try {
      const reportHTML = `
      <div style="width:794px;padding:30px;font-family:Arial">
        
        <div style="display:flex;justify-content:space-between;margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:10px">
            <img src="/logo.png" style="width:50px;height:50px"/>
            <div>
              <h2>Institute Analytics Report</h2>
              <p>Year: ${selectedYear} | Months: ${startMonth || "Jan"} - ${
        endMonth || "Dec"
      }</p>
            </div>
          </div>

          <p>Generated: ${new Date().toLocaleDateString()}</p>
        </div>

        <div style="display:flex;gap:20px;margin-bottom:30px">
          <div style="border:1px solid #ddd;padding:10px;width:30%">
            <p>Total Revenue</p>
            <h3>₹ ${totalRevenue}</h3>
          </div>

          <div style="border:1px solid #ddd;padding:10px;width:30%">
            <p>Highest Month</p>
            <h3>${highestMonth?.month} - ₹${highestMonth?.revenue}</h3>
          </div>

          <div style="border:1px solid #ddd;padding:10px;width:30%">
            <p>Lowest Month</p>
            <h3>${lowestMonth?.month} - ₹${lowestMonth?.revenue}</h3>
          </div>
        </div>

<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:20px">

<thead>
<tr style="background:#f2f2f2">
<th style="border:1px solid #ccc;padding:8px;width:25%;text-align:center">Month</th>
<th style="border:1px solid #ccc;padding:8px;width:25%;text-align:center">Revenue</th>
<th style="border:1px solid #ccc;padding:8px;width:25%;text-align:center">Salary</th>
<th style="border:1px solid #ccc;padding:8px;width:25%;text-align:center">Profit</th>
</tr>
</thead>

<tbody>
${graphData
  .map(
    (r) => `
<tr>
<td style="border:1px solid #ccc;padding:8px;text-align:center">${r.month}</td>
<td style="border:1px solid #ccc;padding:8px;text-align:center">₹ ${r.revenue.toLocaleString()}</td>
<td style="border:1px solid #ccc;padding:8px;text-align:center">₹ ${r.salary.toLocaleString()}</td>
<td style="border:1px solid #ccc;padding:8px;text-align:center">₹ ${r.profit.toLocaleString()}</td>
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
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, 190, imgHeight);

      const blob = pdf.output("bloburl");
      window.open(blob);

      document.body.removeChild(container);
    } catch (err) {
      console.error("PDF generation error:", err);
    }
  };
  /* ================= PAYROLL CALCULATIONS ================= */
  const highestMonth = graphData.reduce(
    (max, item) => (item.revenue > max.revenue ? item : max),
    graphData[0] || { revenue: 0 },
  );

  const lowestMonth = graphData.reduce(
    (min, item) => (item.revenue < min.revenue ? item : min),
    graphData[0] || { revenue: 0 },
  );

  const totalRevenue = graphData.reduce((sum, item) => sum + item.revenue, 0);

  /* ================= RENDER ================= */

  return (
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Growth & Performance Overview</h1>

        {/* FILTERS + DOWNLOAD */}
        <div className="flex flex-wrap items-center gap-4">
          {/* YEAR */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border px-4 py-2 rounded-lg"
          >
            {[2023, 2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* FROM MONTH */}
          <select
            value={startMonth || ""}
            onChange={(e) => setStartMonth(e.target.value)}
            className="border px-4 py-2 rounded-lg"
          >
            <option value="">From Month</option>
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>

          {/* TO MONTH */}
          <select
            value={endMonth || ""}
            onChange={(e) => setEndMonth(e.target.value)}
            className="border px-4 py-2 rounded-lg"
          >
            <option value="">To Month</option>
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>

          {/* DOWNLOAD BUTTON */}
          <button
            onClick={downloadPDFReport}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-semibold"
          >
            Download Report
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="border p-4 rounded-lg bg-orange-50">
          <p>Profile Views</p>
          <p className="text-xl font-bold text-orange-600">
            {topReels.reduce((s, r) => s + Number(r.profileViews || 0), 0)}
          </p>
        </div>
        <div className="border p-4 rounded-lg bg-orange-50">
          <p>Video Views</p>
          <p className="text-xl font-bold text-orange-600">
            {topReels.reduce((s, r) => s + r.views, 0)}
          </p>
        </div>
        <div className="border p-4 rounded-lg bg-orange-50">
          <p>likes</p>
          <p className="text-xl font-bold text-red-500">
            {topReels.reduce((s, r) => s + r.likes, 0)}
          </p>
        </div>
        <div className="border p-4 rounded-lg bg-orange-50">
          <p>Dislikes</p>
          <p className="text-xl font-bold text-orange-600">
            {topReels.reduce((s, r) => s + r.dislikes, 0)}
          </p>
        </div>
      </div>

      {/* TOP CONTENT INSIGHTS */}
      <div className="bg-gray-50 border rounded-2xl p-4 sm:p-6 shadow-sm">
        {/* HEADER */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-5">
          Top Content Insights
        </h2>

        {/* TABS */}
        <div className="overflow-x-auto scrollbar-hide mb-5">
          <div className="flex gap-4 min-w-max border-b pb-2">
            {["views", "likes", "dislikes", "comments"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-1 whitespace-nowrap capitalize text-sm sm:text-base ${
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

        {/* TABLE CONTAINER */}
        <div className="bg-white rounded-xl border overflow-hidden">
          {/* HEADER */}
          <div className="grid grid-cols-6 bg-black text-orange-500 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-3">
            <div>Video</div>
            <div className="col-span-2">Title</div>
            <div className="text-center">Views</div>
            <div className="text-center">Likes</div>
            <div className="text-center">Comments</div>
          </div>

          {/* SCROLLABLE BODY */}
          <div className="max-h-[420px] overflow-y-auto divide-y">
            {topReels.map((reel, i) => (
              <div
                key={i}
                className="grid grid-cols-6 items-center px-3 sm:px-4 py-3 text-xs sm:text-sm hover:bg-gray-50 transition"
              >
                {/* VIDEO */}
                <div>
                  <button
                    onClick={() => handlePlayReel(reel.videoUrl)}
                    className="bg-gray-200 hover:bg-gray-300 rounded-lg px-2 py-1 text-[11px] sm:text-xs font-semibold"
                  >
                    ▶ Play
                  </button>
                </div>

                {/* TITLE */}
                <div className="col-span-2 pr-2">
                  <p className="line-clamp-2 font-medium text-gray-800">
                    {reel.title}
                  </p>
                </div>

                {/* STATS */}
                <div className="text-center font-medium">{reel.views}</div>
                <div className="text-center font-medium">{reel.likes}</div>
                <div className="text-center font-medium">{reel.comments}</div>
              </div>
            ))}
          </div>
        </div>

        {/* VIDEO POPUP */}
        {showVideoPopup && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-black rounded-2xl p-3 w-full max-w-lg relative">
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

      {loadingGraph && (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          <p className="mt-3 text-gray-500">Loading revenue analytics...</p>
        </div>
      )}

      {/* GRAPHS */}
      <h2 className="text-xl font-semibold mt-5 mb-4">Revenue Reports</h2>
      <div className="bg-white shadow rounded-lg p-5 mt-10">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={graphData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#f97316" />
            <Bar dataKey="salary" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-4">Payroll Overview</h2>

      <div className="grid md:grid-cols-3 gap-6">
        {/* LEFT SIDE GRAPH */}
        <div className="md:col-span-2 bg-white shadow rounded-lg p-5">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={graphData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" />
              <Line type="monotone" dataKey="salary" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* RIGHT SIDE CARDS */}
        <div className="flex flex-col gap-5">
          {/* Highest Paying */}
          <div className="bg-white border border-orange-200 shadow rounded-lg p-5">
            <p className="text-green-600 font-semibold text-sm">
              Highest Paying
            </p>
            <h3 className="text-2xl font-bold">
              ₹ {highestMonth?.revenue?.toLocaleString()}
            </h3>
            <p className="text-gray-600">{highestMonth?.month}</p>
          </div>

          {/* Lowest Paying */}
          <div className="bg-white border border-orange-200 shadow rounded-lg p-5">
            <p className="text-red-500 font-semibold text-sm">Lowest Paying</p>
            <h3 className="text-2xl font-bold">
              ₹ {lowestMonth?.revenue?.toLocaleString()}
            </h3>
            <p className="text-gray-600">{lowestMonth?.month}</p>
          </div>

          {/* Total Paying */}
          <div className="bg-white border border-orange-200 shadow rounded-lg p-5">
            <p className="text-gray-600 font-semibold text-sm">Total Paying</p>
            <h3 className="text-2xl font-bold">
              ₹ {totalRevenue.toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* WORKFORCE */}
      <div className="bg-gray-50 border rounded-xl p-6 mt-10 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Workforce & Clients Metrics</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border p-6 rounded-xl bg-white">
            <h3 className="text-xl font-semibold">Employees</h3>
            <p>Joined: {employeeStats.joined}</p>
          </div>

          <div className="border p-6 rounded-xl bg-white">
            <h3 className="text-xl font-semibold">Customers</h3>
            <p>Joined: {customerStats.joined}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
