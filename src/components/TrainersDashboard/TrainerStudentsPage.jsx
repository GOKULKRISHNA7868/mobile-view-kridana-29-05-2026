import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TrainerStudentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const months = [
    { label: "Jan", value: "01" },
    { label: "Feb", value: "02" },
    { label: "Mar", value: "03" },
    { label: "Apr", value: "04" },
    { label: "May", value: "05" },
    { label: "Jun", value: "06" },
    { label: "Jul", value: "07" },
    { label: "Aug", value: "08" },
    { label: "Sep", value: "09" },
    { label: "Oct", value: "10" },
    { label: "Nov", value: "11" },
    { label: "Dec", value: "12" },
  ];
  // ================= FETCH =================
  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      setLoading(true);

      const snap = await getDocs(
        query(
          collection(db, "trainerstudents"),
          where("trainerId", "==", user.uid),
        ),
      );

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setStudents(data);
      setFiltered(data);
      setLoading(false);
    };

    fetch();
  }, [user]);

  // ================= FILTER =================
  useEffect(() => {
    let temp = [...students];

    // SEARCH
    if (search) {
      temp = temp.filter((s) =>
        `${s.firstName} ${s.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      );
    }

    // MONTH YEAR FILTER
    if (month && year) {
      const selected = new Date(`${year}-${month}-01`);

      temp = temp.filter((s) => {
        if (!s.joiningDate) return true;
        return new Date(s.joiningDate) <= selected;
      });
    }

    setFiltered(temp);
  }, [search, month, year, students]);

  return (
    <div className="min-h-screen bg-[#FFF4ED] p-4">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-4">
        <ArrowLeft onClick={() => navigate(-1)} className="cursor-pointer" />
        <h1 className="font-bold text-lg">My Students</h1>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex gap-2 mb-4">
        <div className="flex items-center flex-1 bg-white px-3 py-2 rounded-full shadow-sm">
          <Search size={16} />
          <input
            placeholder="Search student..."
            className="ml-2 w-full outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={() => setShowFilter(true)}
          className="p-2 bg-white rounded-full shadow-sm"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {loading ? (
          Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-white h-20 rounded-xl animate-pulse"
              ></div>
            ))
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            No students found
          </div>
        ) : (
          filtered.map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3"
            >
              <img
                src={s.profileImageUrl}
                className="w-12 h-12 rounded-full"
                alt=""
              />

              <div className="flex-1">
                <div className="font-semibold text-sm">
                  {s.firstName} {s.lastName}
                </div>

                <div className="text-xs text-gray-500">
                  {s.sessions} • {s.category}
                </div>

                <div className="text-xs text-gray-400">
                  Joined: {s.joiningDate}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FILTER MODAL */}
      {/* FILTER MODAL */}
      {showFilter && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-4">
            {/* HEADER WITH CLOSE */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[#FF6A00]">Filter</h2>

              <button
                onClick={() => setShowFilter(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:scale-95"
              >
                ✕
              </button>
            </div>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full border p-2 rounded mb-3"
            >
              <option value="">Year</option>
              <option>2026</option>
              <option>2025</option>
            </select>

            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            >
              <option value="">Month</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <div className="flex justify-between">
              <button
                onClick={() => {
                  setMonth("");
                  setYear("");
                }}
              >
                Reset
              </button>

              <button
                onClick={() => setShowFilter(false)}
                className="bg-[#FF6A00] text-white px-4 py-2 rounded"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerStudentsPage;
