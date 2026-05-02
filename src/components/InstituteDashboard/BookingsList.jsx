// ================= FILE: src/components/InstituteDashboard/BookingDetails.jsx =================
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase"; // ✅ adjusted path
import { useAuth } from "../../context/AuthContext"; // ✅ adjusted path
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { SlidersHorizontal, Calendar } from "lucide-react";

// ================= CSV EXPORT =================
const exportCSV = (rows) => {
  const headers = [
    "Name",
    "BookingId",
    "Date",
    "Time",
    "Court",
    "Phone",
    "Payment",
  ];

  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.name,
        r.id,
        r.date,
        r.time,
        r.court || "-",
        r.phone,
        r.payment,
      ]
        .map((x) => `"${(x ?? "").toString().replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookings_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function BookingDetails() {
  const { user } = useAuth();
  const trainerId = user?.uid;

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [month, setMonth] = useState("");

  // ================= FETCH =================
  const fetchBookings = async () => {
    if (!trainerId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "bookings"),
        where("trainerId", "==", trainerId),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBookings(list);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [trainerId]);

  // ================= FILTER =================
  const filtered = useMemo(() => {
    let data = [...bookings];

    if (search) {
      data = data.filter((b) =>
        b.id.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (from) data = data.filter((b) => b.date >= from);
    if (to) data = data.filter((b) => b.date <= to);

    if (month) {
      data = data.filter((b) => b.date?.startsWith(month));
    }

    return data;
  }, [bookings, search, from, to, month]);

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-orange-500">
              Booking Details
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">
              Configure courts, capacity, and availability for seamless bookings
            </p>
          </div>

          <button className="bg-orange-500 text-white px-5 py-2 rounded-md w-full md:w-auto">
            Add Facilities
          </button>
        </div>

        {/* Controls */}
        <div className="bg-white mt-6 rounded-xl shadow p-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Today Bookings</h2>
              <input
                placeholder="Search with booking I'd"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-orange-300 rounded-md px-3 py-1 text-sm"
              />
            </div>

<div className="flex flex-wrap items-center gap-3">

  {/* FROM */}
  <input
    type="month"
    value={from}
    onChange={(e) => setFrom(e.target.value)}
    className="border border-orange-400 rounded-lg px-4 py-2 text-sm outline-none"
    placeholder="Enter month From"
  />

  {/* TO */}
  <span className="text-sm">To</span>

  <input
    type="month"
    value={to}
    onChange={(e) => setTo(e.target.value)}
    className="border border-orange-400 rounded-lg px-4 py-2 text-sm outline-none"
    placeholder="Enter month to"
  />

  {/* EXPORT BUTTON */}
  <button
    onClick={() => exportCSV(filtered)}
    className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600"
  >
    Export
  </button>

  {/* MONTH SELECT (Styled) */}
  <div className="flex items-center border border-orange-400 rounded-lg px-4 py-2 gap-2">
    <input
      type="month"
      value={month}
      onChange={(e) => setMonth(e.target.value)}
      className="outline-none text-sm bg-transparent"
    />
  </div>

  {/* FILTER ICON */}
  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100">
    <SlidersHorizontal size={20} />
  </button>

</div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-orange-500 text-white text-sm">
                  <th className="p-3">Name</th>
                  <th className="p-3">Booking Id</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Court Number</th>
                  <th className="p-3">Contact Number</th>
                  <th className="p-3">Payment Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-10 text-center">
  <div className="flex flex-col items-center justify-center gap-4">
    
    {/* IMAGE */}
    <img
      src="/bookings.png"
      alt="no bookings"
      className="w-40 sm:w-52 md:w-64 object-contain"
    />

    {/* TEXT */}
    <p className="text-gray-500 text-lg sm:text-xl font-medium">
      No Active Bookings Found
    </p>
    
  </div>
</td>
                  </tr>
                ) : (
                  filtered.map((b) => (
                    <tr key={b.id} className="border-b text-sm">
                      <td className="p-3">{b.name}</td>
                      <td className="p-3">{b.id}</td>
                      <td className="p-3">{b.date}</td>
                      <td className="p-3">{b.time}</td>
                      <td className="p-3">{b.court || "-"}</td>
                      <td className="p-3">{b.phone}</td>
                      <td className="p-3">{b.payment}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}