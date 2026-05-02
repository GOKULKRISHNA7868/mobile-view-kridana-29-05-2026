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
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [graphData, setGraphData] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [topReels, setTopReels] = useState([]);
  const [activeTab, setActiveTab] = useState("views");
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [employeeStats, setEmployeeStats] = useState({
    joined: 0,
    left: 0,
  });

  const [customerStats, setCustomerStats] = useState({
    joined: 0,
    left: 0,
  });
  const downloadPDFReport = async () => {
    const container = document.createElement("div");

    container.style.width = "794px";
    container.style.padding = "40px";
    container.style.margin = "0 auto";
    container.style.background = "white";
    container.style.fontFamily = "Arial";

    container.innerHTML = `
  
 <h1 style="text-align:center;margin-bottom:15px">
Trainer Revenue Report
</h1>

  <p>
  Year: ${selectedYear} <br/>
 Months: ${new Date(0, startMonth).toLocaleString("default", {
   month: "short",
 })}
-
${new Date(0, endMonth).toLocaleString("default", { month: "short" })}
  </p>

<h3 style="text-align:center;margin-bottom:25px">
Total Revenue: ₹${totalRevenue.toLocaleString()}
</h3>

 <table style="width:80%;margin:0 auto;border-collapse:collapse;font-size:14px">

  <thead>
  <tr>
<tr style="background:#f3f3f3">
<th style="border:1px solid #ddd;padding:10px;text-align:center">Month</th>
<th style="border:1px solid #ddd;padding:10px;text-align:center">Revenue</th>
  </tr>
  </thead>

  <tbody>

  ${graphData
    .map(
      (r) => `
      <tr>
<td style="border:1px solid #ddd;padding:10px;text-align:center">${r.month}</td>
<td style="border:1px solid #ddd;padding:10px;text-align:center">₹ ${r.revenue}</td>
      </tr>
      `,
    )
    .join("")}

  </tbody>
  </table>
  `;

    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2 });

    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(img, "PNG", 10, 10, imgWidth, imgHeight);

    pdf.save(`Trainer_Revenue_${selectedYear}.pdf`);

    document.body.removeChild(container);
  };
  /* ================= FETCH TOP REELS (DYNAMIC LOGIN BASED) ================= */
  useEffect(() => {
    if (!user) return;

    const fetchTopReels = async () => {
      try {
        let ownerType = null;
        let ownerDoc = null;

        // Detect institute login
        const instituteDoc = await getDoc(doc(db, "institutes", user.uid));
        if (instituteDoc.exists()) {
          ownerType = "institute";
          ownerDoc = instituteDoc;
        }

        // Detect trainer login
        if (!ownerType) {
          const trainerDoc = await getDoc(doc(db, "trainers", user.uid));
          if (trainerDoc.exists()) {
            ownerType = "trainer";
            ownerDoc = trainerDoc;
          }
        }

        if (!ownerType || !ownerDoc) {
          // fallback static
          return;
        }

        const tasks = [];
        const data = ownerDoc.data();
        const ownerId = ownerDoc.id;

        console.log("🔥 REELS ARRAY:", data.reels); // DEBUG

        if (Array.isArray(data.reels)) {
          for (let idx = 0; idx < data.reels.length; idx++) {
            const reelId = `${ownerType}_${ownerId}_${idx}`;
            const videoUrl = data.reels[idx]; // ✅ THIS IS CLOUDINARY URL

            console.log("🎯 MAPPING:", reelId, videoUrl); // DEBUG

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
                ), // ✅ REAL PROFILE VIEWS
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
                  profileViews: profileSnap.size || 0, // ✅ REAL DATA
                }),
              ),
            );
          }
        }

        const reelStats = await Promise.all(tasks);
        setTopReels(reelStats);

        /* ================= VIDEO API ================= */

        if (reelStats.length === 0) return; // fallback to static UI

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
  const handlePlayReel = (videoUrl) => {
    setActiveVideoUrl(videoUrl);
    setShowVideoPopup(true);
  };
  /* ================= WORKFORCE (STATIC SAFE) ================= */
  /* ================= WORKFORCE (STATIC SAFE) ================= */
  useEffect(() => {
    if (!user) return;

    const fetchWorkforce = async () => {
      const studentsSnap = await getDocs(
        query(
          collection(db, "trainerstudents"),
          where("trainerId", "==", user.uid),
        ),
      );

      setCustomerStats({
        joined: studentsSnap.size || 0,
        left: 0,
      });
    };

    fetchWorkforce();
  }, [user]);
  /* ================= GRAPH REVENUE FROM FIRESTORE ================= */
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  useEffect(() => {
    if (!user || startMonth === "" || endMonth === "") return;

    const fetchGraphData = async () => {
      try {
        setLoadingRevenue(true);

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

        const revenueMap = {};

        for (let i = 0; i < 12; i++) {
          revenueMap[i] = 0;
        }

        const feesSnap = await getDocs(
          query(
            collection(db, "institutesFees"),
            where("trainerId", "==", user.uid),
            where("year", "==", String(selectedYear)), // 🔥 FIX
          ),
        );

        feesSnap.forEach((doc) => {
          const data = doc.data();

          const monthIndex = parseInt(data.month) - 1;

          if (monthIndex >= startMonth && monthIndex <= endMonth) {
            revenueMap[monthIndex] += Number(data.paidAmount || 0);
          }
        });

        const graph = [];

        for (let m = Number(startMonth); m <= Number(endMonth); m++) {
          graph.push({
            month: months[m],
            revenue: revenueMap[m] || 0,
          });
        }

        setGraphData(graph);
      } catch (err) {
        console.error("Revenue fetch error:", err);
      } finally {
        setLoadingRevenue(false);
      }
    };

    fetchGraphData();
  }, [user, selectedYear, startMonth, endMonth]);
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
  const Card = ({ title, value }) => (
    <div className="border p-4 rounded-xl bg-orange-50">
      <p className="text-xs sm:text-sm text-gray-600">{title}</p>
      <p className="text-lg sm:text-2xl font-bold text-orange-600 mt-1">
        {value}
      </p>
    </div>
  );

  const MiniCard = ({ title, value, sub, green, red }) => (
    <div className="bg-white border border-orange-200 shadow rounded-xl p-4">
      <p
        className={`text-sm font-semibold ${
          green ? "text-green-600" : red ? "text-red-500" : "text-gray-600"
        }`}
      >
        {title}
      </p>
      <h3 className="text-xl font-bold mt-1">{value}</h3>
      {sub && <p className="text-sm text-gray-500">{sub}</p>}
    </div>
  );
  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">
          Growth & Performance Overview
        </h1>

        {/* FILTERS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full xl:w-auto">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border px-3 py-2 rounded-lg text-sm w-full"
          >
            {[2026, 2025, 2024, 2023].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            className="border px-3 py-2 rounded-lg text-sm w-full"
          >
            <option value="">From</option>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("default", { month: "short" })}
              </option>
            ))}
          </select>

          <select
            value={endMonth}
            onChange={(e) => setEndMonth(e.target.value)}
            className="border px-3 py-2 rounded-lg text-sm w-full"
          >
            <option value="">To</option>
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleString("default", { month: "short" })}
              </option>
            ))}
          </select>

          <button
            onClick={downloadPDFReport}
            className="bg-orange-500 text-white rounded-lg px-4 py-2 text-sm font-medium w-full"
          >
            Report
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card
          title="Profile Views"
          value={topReels.reduce((s, r) => s + Number(r.profileViews || 0), 0)}
        />
        <Card
          title="Video Views"
          value={topReels.reduce((s, r) => s + r.views, 0)}
        />
        <Card title="Likes" value={topReels.reduce((s, r) => s + r.likes, 0)} />
        <Card
          title="Dislikes"
          value={topReels.reduce((s, r) => s + r.dislikes, 0)}
        />
      </div>

      {/* TOP CONTENT */}
      <div className="bg-gray-50 border rounded-xl p-3 sm:p-5 shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">
          Top Content Insights
        </h2>

        {/* TABS */}
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-6 border-b pb-3 mb-4">
          {["views", "likes", "dislikes", "comments"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm pb-2 capitalize ${
                activeTab === tab
                  ? "text-orange-600 border-b-2 border-orange-600 font-semibold"
                  : "text-gray-600"
              }`}
            >
              Most {tab}
            </button>
          ))}
        </div>

        {/* MOBILE CARDS */}
        <div className="grid grid-cols-6 gap-2 bg-black text-orange-500 text-[11px] font-semibold rounded-t-xl px-3 py-3">
          <div>Video</div>
          <div className="col-span-2">Title</div>
          <div className="text-center">Views</div>
          <div className="text-center">Likes</div>
          <div className="text-center">Dislikes</div>
        </div>

        {/* ROWS */}
        <div className="bg-white rounded-b-xl border border-t-0 overflow-hidden">
          {topReels.slice(0, 5).map((reel, i) => (
            <div
              key={i}
              className="grid grid-cols-6 gap-2 items-center px-3 py-3 border-t first:border-t-0"
            >
              {/* VIDEO */}
              <button
                onClick={() => handlePlayReel(reel.videoUrl)}
                className="w-14 h-10 rounded-md bg-gray-200 text-[10px] font-semibold flex items-center justify-center"
              >
                ▶ Play
              </button>

              {/* TITLE */}
              <div className="col-span-2 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {reel.title}
                </p>

                <p className="text-[10px] text-gray-500 mt-1">
                  💬 {reel.comments} •
                </p>
              </div>

              {/* VIEWS */}
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800">
                  {reel.views}
                </p>
                <p className="text-[10px] text-gray-500">Views</p>
              </div>

              {/* LIKES */}
              <div className="text-center">
                <p className="text-sm font-semibold text-orange-600">
                  {reel.likes}
                </p>
                <p className="text-[10px] text-gray-500">Likes</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-orange-600">
                  {reel.dislikes}
                </p>
                <p className="text-[10px] text-gray-500">Dislikes</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block">
        <div className="grid grid-cols-6 font-semibold text-orange-600 mb-3 text-sm">
          <div>Videos</div>
          <div>Title</div>
          <div>Views</div>
          <div>Likes</div>
          <div>Dislikes</div>
          <div>Comments</div>
        </div>

        {topReels.slice(0, 5).map((reel, i) => (
          <div
            key={i}
            className="grid grid-cols-6 items-center py-4 border-t text-sm"
          >
            <button
              onClick={() => handlePlayReel(reel.videoUrl)}
              className="w-20 h-14 bg-gray-300 rounded-md text-xs font-semibold"
            >
              ▶ Play
            </button>

            <div>{reel.title}</div>
            <div>{reel.views}</div>
            <div>{reel.likes}</div>
            <div>{reel.dislikes}</div>
            <div>{reel.comments}</div>
          </div>
        ))}
      </div>

      {/* REVENUE GRAPH */}
      <h2 className="text-lg sm:text-xl font-semibold mt-8 mb-3">
        Revenue Reports
      </h2>

      <div className="bg-white shadow rounded-xl p-3 sm:p-5">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={graphData}>
            <XAxis dataKey="month" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PAYROLL */}
      <h2 className="text-lg sm:text-xl font-semibold mt-8 mb-3">
        Payroll Overview
      </h2>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white shadow rounded-xl p-3 sm:p-5">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={graphData}>
              <XAxis dataKey="month" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid sm:grid-cols-3 lg:grid-cols-1 gap-4">
          <MiniCard
            title="Highest Paying"
            value={`₹ ${highestMonth?.revenue || 0}`}
            sub={highestMonth?.month}
            green
          />
          <MiniCard
            title="Lowest Paying"
            value={`₹ ${lowestMonth?.revenue || 0}`}
            sub={lowestMonth?.month}
            red
          />
          <MiniCard title="Total Paying" value={`₹ ${totalRevenue || 0}`} />
        </div>
      </div>

      {/* CUSTOMERS */}
      <div className="bg-gray-50 border rounded-xl p-4 sm:p-6 mt-8 shadow-sm">
        <h2 className="text-lg sm:text-2xl font-bold mb-4">
          Workforce & Clients Metrics
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-5">
            <h3 className="text-lg font-semibold">Customers</h3>
            <p className="mt-2 text-gray-600">Joined: {customerStats.joined}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
