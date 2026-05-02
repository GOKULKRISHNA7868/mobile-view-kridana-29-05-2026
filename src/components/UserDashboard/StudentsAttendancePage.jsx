import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { Pagination } from "./shared";

const today = new Date().toISOString().split("T")[0];

const StudentsAttendancePage = () => {
  const { user, institute } = useAuth();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState({});
  const [summary, setSummary] = useState({});
  const [selectedDate, setSelectedDate] = useState(today);

  // 🔒 Load institute students
  useEffect(() => {
    if (!user || institute?.role !== "institute") return;

    const q = query(
      collection(db, "students"),
      where("instituteId", "==", user.uid),
    );

    return onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    });
  }, [user, institute]);

  // 📅 Load attendance for selected date
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "attendance"),
      where("instituteId", "==", user.uid),
      where("date", "==", selectedDate),
    );

    return onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        map[d.data().studentId] = d.data().status === "present";
      });
      setAttendance(map);
    });
  }, [user, selectedDate]);

  // 📊 Load attendance summary (after joining date)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "attendance"),
      where("instituteId", "==", user.uid),
    );

    return onSnapshot(q, (snap) => {
      const stats = {};

      snap.docs.forEach((d) => {
        const { studentId, status, date } = d.data();
        if (!stats[studentId]) {
          stats[studentId] = { present: 0, total: 0 };
        }

        stats[studentId].total++;
        if (status === "present") stats[studentId].present++;
      });

      setSummary(stats);
    });
  }, [user]);

  // 🔍 Search filter
  const filteredStudents = useMemo(() => {
    return students.filter((s) =>
      `${s.firstName} ${s.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [students, search]);

  // 🔐 Date validation
  const canEditDate = (joinDate) => {
    if (selectedDate > today) return false;
    if (joinDate && selectedDate < joinDate) return false;
    return true;
  };

  // ✅ Save attendance
  const markAttendance = async (student, value) => {
    if (!canEditDate(student.joinedDate)) return;

    await setDoc(
      doc(db, "attendance", `${student.uid}_${selectedDate}`),
      {
        instituteId: user.uid,
        studentId: student.uid,
        date: selectedDate,
        month: selectedDate.slice(0, 7),
        status: value ? "present" : "absent",
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  };

  return (
    <div className="h-full bg-[#1b0f06] text-white p-6 rounded-lg">
      {/* 🔍 Search */}
      <div className="flex items-center mb-4">
        <div className="flex items-center bg-[#3b2615] border border-[#6b4a2d] rounded-full px-4 py-2 w-full max-w-md">
          🔍
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name..."
            className="bg-transparent outline-none text-sm w-full ml-2"
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-orange-500">
          Students Attendance
        </h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-orange-500 text-white px-4 py-2 rounded-full"
        />
      </div>

      {/* Table */}
      <div className="bg-[#f9c199] rounded-t-xl">
        <div className="grid grid-cols-4 px-4 py-3 font-semibold text-black">
          <div>Student Name</div>
          <div>Category</div>
          <div>Present</div>
          <div>Absent</div>
        </div>

        <div className="bg-white text-black">
          {filteredStudents.map((s) => {
            const stat = summary[s.uid] || { present: 0, total: 0 };
            const percentage =
              stat.total === 0
                ? 0
                : Math.round((stat.present / stat.total) * 100);

            return (
              <div
                key={s.uid}
                className="grid grid-cols-4 px-4 py-3 border-t items-center text-sm"
              >
                <div className="font-semibold">
                  {s.firstName} {s.lastName}
                  <div className="text-xs text-gray-500">
                    {stat.present}/{stat.total} • {percentage}%
                  </div>
                </div>

                <div>{s.category || "-"}</div>

                <button
                  disabled={!canEditDate(s.joinedDate)}
                  onClick={() => markAttendance(s, true)}
                  className={`px-4 py-1 rounded-full text-xs font-semibold ${
                    attendance[s.uid] === true
                      ? "bg-green-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Present
                </button>

                <button
                  disabled={!canEditDate(s.joinedDate)}
                  onClick={() => markAttendance(s, false)}
                  className={`px-4 py-1 rounded-full text-xs font-semibold ${
                    attendance[s.uid] === false
                      ? "bg-red-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Absent
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Pagination />
    </div>
  );
};

export default StudentsAttendancePage;
