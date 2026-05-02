import React, { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const TrainerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    newStudents: 0,
    paid: 0,
    pending: 0,
  });
  const Row = ({ label, value, color }) => (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${color || ""}`}>₹{value}</span>
    </div>
  );
  // ================= FETCH =================
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        // ===== TRAINER STUDENTS =====
        const studentSnap = await getDocs(
          query(
            collection(db, "trainerstudents"),
            where("trainerId", "==", user.uid),
          ),
        );

        const studentsData = studentSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setStudents(studentsData);

        // ===== FEES (FROM INSTITUTE) =====
        const feeSnap = await getDocs(
          query(
            collection(db, "institutesFees"),
            where("trainerId", "==", user.uid),
          ),
        );

        const feesData = feeSnap.docs.map((d) => d.data());
        setFees(feesData);

        // ================= TOTAL (ALL STUDENTS FEES) =================
        let totalAmount = 0;

        studentsData.forEach((s) => {
          if (Array.isArray(s.sports)) {
            s.sports.forEach((sp) => {
              totalAmount += Number(sp.fee || 0);
            });
          } else if (s.monthlyFee) {
            totalAmount += Number(s.monthlyFee || 0);
          }
        });

        // ================= PAID =================
        let paidAmount = 0;

        feesData.forEach((f) => {
          paidAmount += Number(f.paidAmount || 0);
        });

        // ================= PENDING =================
        const pendingAmount = totalAmount - paidAmount;

        // ================= OTHER STATS =================
        const totalStudents = studentsData.length;

        const newStudents = studentsData.filter((s) => {
          const join = new Date(s.joiningDate);
          const now = new Date();
          return (now - join) / (1000 * 60 * 60 * 24) <= 30;
        }).length;

        // ✅ FINAL SET
        setStats({
          total: totalStudents,
          newStudents,
          paid: paidAmount,
          pending: pendingAmount,
          totalAmount, // optional if you want to show separately
        });
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);
  // ================= PIE / DONUT =================
  const totalData = stats.total || 1;

  const green = (stats.newStudents / totalData) * 100;
  const purple = (stats.paid / totalData) * 100;
  const black = (stats.pending / totalData) * 100;

  const donutStyle = {
    background: `conic-gradient(
      #22c55e 0% ${green}%,
      #9333ea ${green}% ${green + purple}%,
      #000000 ${green + purple}% 100%
    )`,
  };

  return (
    <div className="min-h-screen bg-[#FFF4ED] px-4 py-5 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={user?.photoURL || ""}
            alt=""
            className="w-10 h-10 rounded-full bg-gray-300"
          />
          <span className="font-semibold text-gray-800">Hi Trainer 👋</span>
        </div>

        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Settings size={18} />
        </div>
      </div>

      {/* TITLE */}
      <h1 className="text-2xl font-bold text-black">Trainer Dashboard</h1>

      {/* ================= OVERVIEW ================= */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 items-center">
        {loading ? (
          <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse"></div>
        ) : (
          <div className="relative w-24 h-24">
            <div
              style={donutStyle}
              className="w-full h-full rounded-full"
            ></div>

            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center text-xs font-semibold">
              {stats.total}
            </div>
          </div>
        )}

        {/* LEGEND */}
        <div className="grid grid-cols-2 gap-2 text-xs flex-1">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-3 bg-gray-200 animate-pulse"></div>
              ))}
            </>
          ) : (
            <>
              <Legend
                label={`New: ${stats.newStudents}`}
                color="bg-green-500"
              />
              <Legend label={`Paid: ${stats.paid}`} color="bg-purple-600" />
              <Legend label={`Pending: ${stats.pending}`} color="bg-black" />
            </>
          )}
        </div>
      </div>

      {/* ================= STUDENT LIST ================= */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg">My Students</h2>

          {students.length > 4 && (
            <button
              onClick={() => navigate("/TrainerStudentsPage")}
              className="text-[#FF6A00] text-sm font-semibold"
            >
              View More →
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(loading ? Array(4).fill(0) : students.slice(0, 4)).map((s, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-3">
              {loading ? (
                <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <>
                  <img
                    src={s.profileImageUrl}
                    className="w-12 h-12 rounded-full mb-2"
                    alt=""
                  />
                  <div className="font-semibold text-sm">
                    {s.firstName} {s.lastName}
                  </div>
                  <div className="text-xs text-gray-500">{s.sessions}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ================= PAYMENTS ================= */}
      <div>
        <h2 className="font-bold text-lg mb-3">Payments</h2>

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
            : fees.map((f, i) => {
                const total = f.totalAmount || 0;
                const paid = f.paidAmount || 0;
                const pending = total - paid;

                return (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-sm p-4 space-y-3 active:scale-95 transition"
                  >
                    {/* HEADER */}
                    <div className="font-semibold text-gray-800 text-sm">
                      {f.category || "General"}
                    </div>

                    {/* DATA */}
                    <div className="space-y-1 text-sm">
                      <Row label="Total" value={stats.totalAmount} />
                      <Row
                        label="Paid"
                        value={stats.paid}
                        color="text-green-600"
                      />
                      <Row
                        label="Pending"
                        value={stats.pending}
                        color="text-red-500"
                      />
                    </div>

                    {/* FOOTER */}
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

// SMALL COMPONENT
const Legend = ({ label, color }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 ${color}`}></div>
    <span>{label}</span>
  </div>
);

export default TrainerDashboard;
