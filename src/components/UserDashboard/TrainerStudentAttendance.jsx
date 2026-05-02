import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const StudentAttendanceView = () => {
  const [user, setUser] = useState(null);
  const [trainerUID, setTrainerUID] = useState(null);
  const [joinedMonth, setJoinedMonth] = useState(null);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);

  /* ======================================
     🔐 AUTH
     ====================================== */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log("👤 Auth state:", u);
      setUser(u);
    });
    return () => unsub();
  }, []);

  /* ======================================
     🔍 FETCH STUDENT DOC
     ====================================== */
  useEffect(() => {
    if (!user) return;

    const fetchStudent = async () => {
      console.log("📘 Fetching trainerstudents doc:", user.uid);

      const snap = await getDoc(doc(db, "trainerstudents", user.uid));

      if (!snap.exists()) {
        console.error("❌ trainerstudents doc not found");
        setLoading(false);
        return;
      }

      const data = snap.data();
      console.log("✅ Student data:", data);

      setTrainerUID(data.trainerUID);

      // 🔥 IMPORTANT FIX
      const month = data.joinedDate.slice(0, 7);
      console.log("📅 Using joined month:", month);
      setJoinedMonth(month);
    };

    fetchStudent();
  }, [user]);

  /* ======================================
     📅 FETCH ATTENDANCE
     ====================================== */
  useEffect(() => {
    if (!trainerUID || !joinedMonth || !user) return;

    const fetchAttendance = async () => {
      setLoading(true);

      const docId = `${trainerUID}_${joinedMonth}`;
      console.log("📄 Fetching attendance doc:", docId);

      const snap = await getDoc(doc(db, "trainerstudentsattendance", docId));

      if (!snap.exists()) {
        console.error("❌ Attendance doc NOT FOUND");
        setRecords({});
        setLoading(false);
        return;
      }

      const data = snap.data();
      console.log("✅ Attendance data:", data);

      const studentRecords = data.records?.[user.uid];
      console.log("🎓 Student records:", studentRecords);

      setRecords(studentRecords || {});
      setLoading(false);
    };

    fetchAttendance();
  }, [trainerUID, joinedMonth, user]);

  /* ======================================
     📊 STATS
     ====================================== */
  const stats = useMemo(() => {
    let present = [];
    let absent = [];

    Object.entries(records).forEach(([date, status]) => {
      if (status === "present") present.push(date);
      if (status === "absent") absent.push(date);
    });

    const total = present.length + absent.length;
    const percentage = total
      ? ((present.length / total) * 100).toFixed(2)
      : "0.00";

    return { present, absent, total, percentage };
  }, [records]);

  if (loading) {
    return <div className="text-white p-6">Loading attendance...</div>;
  }

  return (
    <div className="bg-[#1b0f06] text-white p-6 rounded-lg max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-center">
        📅 My Attendance ({joinedMonth})
      </h2>

      {/* SUMMARY */}
      <div className="grid grid-cols-4 gap-4 text-center mb-6">
        <div className="bg-green-700 p-3 rounded-lg">
          <div className="text-2xl font-bold">{stats.present.length}</div>
          <div className="text-xs">Present</div>
        </div>

        <div className="bg-red-700 p-3 rounded-lg">
          <div className="text-2xl font-bold">{stats.absent.length}</div>
          <div className="text-xs">Absent</div>
        </div>

        <div className="bg-yellow-600 p-3 rounded-lg">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs">Total Days</div>
        </div>

        <div className="bg-blue-700 p-3 rounded-lg">
          <div className="text-2xl font-bold">{stats.percentage}%</div>
          <div className="text-xs">Percentage</div>
        </div>
      </div>

      {/* PRESENT */}
      <h3 className="text-green-400 font-semibold mb-2">✅ Present Dates</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {stats.present.map((d) => (
          <span
            key={d}
            className="bg-green-500 text-black px-3 py-1 rounded-full text-xs"
          >
            {d}
          </span>
        ))}
      </div>

      {/* ABSENT */}
      <h3 className="text-red-400 font-semibold mb-2">❌ Absent Dates</h3>
      <div className="flex flex-wrap gap-2">
        {stats.absent.map((d) => (
          <span
            key={d}
            className="bg-red-500 text-black px-3 py-1 rounded-full text-xs"
          >
            {d}
          </span>
        ))}
      </div>
    </div>
  );
};

export default StudentAttendanceView;
