import React, { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
const PerformanceDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const passedBranch = location.state?.branch || "";
  const [stats, setStats] = useState({
    total: 0,
    newStudents: 0,
    paid: 0,
    pending: 0,
    dropped: 0,
  });

  // ================= FETCH =================
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        const studentSnap = await getDocs(
          query(
            collection(db, "students"),
            where("instituteId", "==", user.uid),
          ),
        );

        const studentsData = studentSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setStudents(studentsData);

        const feeSnap = await getDocs(
          query(
            collection(db, "studentFees"),
            where("instituteId", "==", user.uid),
          ),
        );

        const feesData = feeSnap.docs.map((d) => d.data());
        setFees(feesData);

        // ===== STATS =====
        const total = studentsData.length;

        const newStudents = studentsData.filter((s) => {
          const join = new Date(s.joiningDate);
          const now = new Date();
          return (now - join) / (1000 * 60 * 60 * 24) <= 30;
        }).length;

        const paid = feesData.filter(
          (f) => f.paidAmount >= f.totalAmount,
        ).length;
        const pending = feesData.filter(
          (f) => f.paidAmount < f.totalAmount,
        ).length;

        setStats({ total, newStudents, paid, pending, dropped: 0 });

        const uniqueBranches = [
          ...new Set(studentsData.map((s) => s.branch || "Unknown")),
        ];

        setBranches(uniqueBranches);
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // ================= DONUT CALC =================
  const totalData = stats.total || 1;

  const green = (stats.newStudents / totalData) * 100;
  const purple = (stats.paid / totalData) * 100;
  const black = (stats.pending / totalData) * 100;
  const orange = (stats.total / totalData) * 100;

  const donutStyle = {
    background: `conic-gradient(
      #22c55e 0% ${green}%,
      #9333ea ${green}% ${green + purple}%,
      #000000 ${green + purple}% ${green + purple + black}%,
      #ea580c ${green + purple + black}% 100%
    )`,
  };

  return (
    <div className="min-h-screen bg-[#FFF4ED] px-4 py-5 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"></div>
      </div>

      {/* TITLE */}
      <h1 className="text-2xl font-bold text-black">Performance Dashboard</h1>

      {/* ================= OVERVIEW ================= */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 items-center">
        {/* LOADING DONUT */}
        {loading ? (
          <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse"></div>
        ) : (
          <div className="relative w-24 h-24">
            <div
              style={donutStyle}
              className="w-full h-full rounded-full"
            ></div>

            {/* CENTER CUT */}
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center text-xs font-semibold">
              {stats.total}
            </div>
          </div>
        )}

        {/* LEGEND */}
        <div className="grid grid-cols-2 gap-2 text-xs flex-1">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-3 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </>
          ) : (
            <>
              <Legend
                color="bg-green-500"
                label={`New: ${stats.newStudents}`}
              />
              <Legend color="bg-purple-600" label={`Paid: ${stats.paid}`} />
              <Legend color="bg-black" label={`Pending: ${stats.pending}`} />
              <Legend color="bg-orange-600" label={`Total: ${stats.total}`} />
            </>
          )}
        </div>
      </div>

      {/* ================= BRANCH ATTENDANCE ================= */}
      <div>
        <h2 className="font-bold text-lg mb-3">Branch Wise Attendance</h2>

        <div className="grid grid-cols-2 gap-3">
          {loading
            ? Array(4)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-white h-32 rounded-2xl animate-pulse"
                  ></div>
                ))
            : branches.map((branch, i) => {
                const count = students.filter(
                  (s) => (s.branch || "Unknown") === branch,
                ).length;

                return (
                  <div
                    key={i}
                    onClick={() =>
                      navigate("/StudentsAttendancePage", { state: { branch } })
                    }
                    className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer active:scale-95 transition"
                  >
                    <div className="h-24 bg-gray-100"></div>

                    <div className="p-3">
                      <div className="font-semibold text-gray-800">
                        {branch}
                      </div>
                      <div className="text-xs text-gray-500">
                        Students: {count}
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* ================= BRANCH PAYMENTS ================= */}
      <div>
        <h2 className="font-bold text-lg mb-3">Branch Wise Payments</h2>

        <div className="grid grid-cols-2 gap-3">
          {loading
            ? Array(4)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-white h-40 rounded-2xl animate-pulse"
                  ></div>
                ))
            : branches.map((branch, i) => {
                const branchStudents = students.filter(
                  (s) => (s.branch || "Unknown") === branch,
                );

                let total = 0;
                let paid = 0;

                branchStudents.forEach((s) => {
                  const fee = fees.find((f) => f.studentId === s.id);
                  if (fee) {
                    total += fee.totalAmount || 0;
                    paid += fee.paidAmount || 0;
                  }
                });

                const pending = total - paid;

                return (
                  <div
                    key={i}
                    onClick={() => navigate(`/pending-fees/${branch}`)}
                    className="bg-white rounded-2xl shadow-sm p-4 space-y-3 cursor-pointer active:scale-95 transition"
                  >
                    <div className="font-semibold text-gray-800">{branch}</div>

                    <div className="space-y-1 text-sm">
                      <Row label="Total" value={total} />
                      <Row label="Paid" value={paid} color="text-green-600" />
                      <Row
                        label="Pending"
                        value={pending}
                        color="text-red-500"
                      />
                    </div>

                    <div className="border-t pt-3 flex justify-between items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          pending > 0 ? "bg-orange-500" : "bg-green-500"
                        }`}
                      ></div>

                      <button className="bg-[#FF6A00] text-white text-xs px-3 py-1 rounded-lg font-semibold">
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};

// ================= SMALL COMPONENTS =================
const Legend = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 ${color}`}></div>
    <span>{label}</span>
  </div>
);

const Row = ({ label, value, color }) => (
  <div className="flex justify-between">
    <span className="text-gray-500">{label}</span>
    <span className={`font-semibold ${color || ""}`}>₹{value}</span>
  </div>
);

export default PerformanceDashboard;
