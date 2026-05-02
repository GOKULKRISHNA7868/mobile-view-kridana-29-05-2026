import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function InstituteBookedDemos() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState({
    day: "all",
    status: "all",
    time: "all",
  });

  /* 🔐 Auth */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) navigate("/login");
      else setUser(u);
    });
    return () => unsub();
  }, [navigate]);

  /* 📥 Fetch institute bookings */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "BOOKEDDEMOCLASSES"),
      where("instituteId", "==", user.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user]);

  /* 🔄 Update status */
  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "BOOKEDDEMOCLASSES", id), { status });
  };

  /* 🎛 Filters */
  const filtered = bookings.filter((b) => {
    const dayOk = filters.day === "all" || b.demoDetails.day === filters.day;

    const statusOk = filters.status === "all" || b.status === filters.status;

    const t = b.demoDetails.timing.toLowerCase();
    const timeOk =
      filters.time === "all" ||
      (filters.time === "morning" && t.includes("am")) ||
      (filters.time === "evening" && t.includes("pm"));

    return dayOk && statusOk && timeOk;
  });

  return (
    /* 🌈 Any background supported */
    <div className="min-h-screen p-6 bg-[#F2F2F2]">

      {/* 🔲 High-contrast container */}
      <div className="max-w-7xl mx-auto bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 text-gray-900">
        <h1 className="text-3xl text-orange-500 font-bold mb-6">📋 Booked Demo Classes</h1>

        {/* 🎛 Filters */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: "Day",
              key: "day",
              values: [
                "all",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ],
            },
            {
              label: "Status",
              key: "status",
              values: ["all", "pending", "approved", "rejected"],
            },
            {
              label: "Time",
              key: "time",
              values: ["all", "morning", "evening"],
            },
          ].map((f) => (
            <select
              key={f.key}
              className="p-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
              onChange={(e) =>
                setFilters({ ...filters, [f.key]: e.target.value })
              }
            >
              {f.values.map((v) => (
                <option key={v} value={v}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </option>
              ))}
            </select>
          ))}
        </div>

        {/* 📦 Booking Cards */}
        <div className="grid gap-5">
          {filtered.length === 0 && (
            <p className="text-gray-600 text-center">No bookings found</p>
          )}

          {filtered.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-gray-200 shadow-md p-5 grid md:grid-cols-3 gap-4"
            >
              {/* 👤 User */}
              <div>
                <h3 className="font-bold text-lg">{b.name}</h3>
                <p className="text-sm">{b.email}</p>
                <p className="text-sm">{b.phone}</p>
                <p className="text-xs text-gray-600">{b.address}</p>
              </div>

              {/* 📅 Demo */}
              <div className="text-sm">
                <p>
                  <strong>Category:</strong> {b.demoDetails.category}
                </p>
                <p>
                  <strong>Day:</strong> {b.demoDetails.day}
                </p>
                <p>
                  <strong>Date:</strong> {b.demoDetails.date}
                </p>
                <p>
                  <strong>Time:</strong> {b.demoDetails.timing}
                </p>
              </div>

              {/* ✅ Status + Actions */}
              <div className="flex flex-col justify-center gap-3">
                <span
                  className={`text-center font-semibold py-1 rounded-full ${
                    b.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : b.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {b.status || "pending"}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(b.id, "approved")}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, "rejected")}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}