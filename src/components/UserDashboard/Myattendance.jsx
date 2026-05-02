import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function AttendancePage() {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState(""); // student or trainer
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState({});
  const [instituteId, setInstituteId] = useState("");

  // Get logged-in user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);

        // Detect role and institute
        const instSnap = await getDocs(collection(db, "institutes"));
        let found = false;
        for (const inst of instSnap.docs) {
          const data = inst.data();
          if (data.students?.includes(user.uid)) {
            setRole("student");
            setInstituteId(inst.id);
            found = true;
            break;
          }
          if (data.trainers?.includes(user.uid)) {
            setRole("trainer");
            setInstituteId(inst.id);
            found = true;
            break;
          }
        }

        if (!found) {
          setRole("unknown");
          setInstituteId("");
        }
      }
    });

    return () => unsub();
  }, []);

  // Fetch attendance
  useEffect(() => {
    if (!userId || !instituteId || role === "unknown") return;

    const fetchAttendance = async () => {
      setLoading(true);
      let allRecords = [];

      if (role === "student") {
        // 🔹 Load student's timetable mapping
        const ttSnap = await getDocs(
          query(collection(db, "institutes", instituteId, "timetable")),
        );

        // classes where student is mapped
        const mappedCategories = [];
        ttSnap.forEach((d) => {
          const slot = d.data();
          if (slot.students?.includes(userId)) {
            mappedCategories.push(slot.category);
          }
        });

        // 🔹 Load attendance only for mapped timetable categories
        if (mappedCategories.length > 0) {
          const attSnap = await getDocs(
            query(
              collection(db, "institutes", instituteId, "attendance"),
              where("studentId", "==", userId),
            ),
          );

          attSnap.forEach((doc) => {
            const data = doc.data();
            if (mappedCategories.includes(data.category)) {
              allRecords.push(data);
            }
          });
        }
      } else if (role === "trainer") {
        // trainer attendance
        const attSnap = await getDocs(
          query(
            collection(db, "institutes", instituteId, "trainerAttendance"),
            where("trainerId", "==", userId),
          ),
        );
        attSnap.forEach((doc) => allRecords.push(doc.data()));
      }

      // Group by category
      const grouped = {};
      allRecords.forEach((rec) => {
        if (!grouped[rec.category]) grouped[rec.category] = [];
        grouped[rec.category].push(rec);
      });

      setAttendanceData(grouped);
      setLoading(false);
    };

    fetchAttendance();
  }, [userId, role, instituteId]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {role === "trainer" ? "My Trainer Attendance" : "My Attendance"}
      </h2>

      {loading && (
        <p className="text-gray-600 dark:text-gray-300">
          Loading attendance...
        </p>
      )}

      {!loading && Object.keys(attendanceData).length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">
          No attendance records found.
        </p>
      )}

      {!loading &&
        Object.entries(attendanceData).map(([category, records]) => {
          const total = records.length;
          const present = records.filter(
            (r) => r.status === "present" || r.status === "Present",
          ).length;
          const absent = total - present;
          const percent = total === 0 ? 0 : Math.round((present / total) * 100);

          return (
            <div
              key={category}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {category}
              </h3>

              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Total
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {total}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900 p-3 rounded text-center">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Present
                  </p>
                  <p className="text-xl font-bold text-green-800 dark:text-green-200">
                    {present}
                  </p>
                </div>
                <div className="bg-red-100 dark:bg-red-900 p-3 rounded text-center">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Absent
                  </p>
                  <p className="text-xl font-bold text-red-800 dark:text-red-200">
                    {absent}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded text-center">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Attendance %
                  </p>
                  <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                    {percent}%
                  </p>
                </div>
              </div>

              {/* Toggle Details */}
              <button
                onClick={() =>
                  setShowDetails((p) => ({ ...p, [category]: !p[category] }))
                }
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showDetails[category]
                  ? "Hide Details"
                  : "View Attendance Dates"}
              </button>

              {/* Detailed Dates */}
              {showDetails[category] && (
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded">
                    <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">
                      Present Dates
                    </h4>
                    {records
                      .filter(
                        (r) => r.status === "present" || r.status === "Present",
                      )
                      .map((r, i) => (
                        <p
                          key={i}
                          className="text-sm text-green-800 dark:text-green-200"
                        >
                          ✓ {r.date} {r.time ? `— ${r.time}` : ""}
                        </p>
                      ))}
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded">
                    <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">
                      Absent Dates
                    </h4>
                    {records
                      .filter(
                        (r) => r.status === "absent" || r.status === "Absent",
                      )
                      .map((r, i) => (
                        <p
                          key={i}
                          className="text-sm text-red-800 dark:text-red-200"
                        >
                          ✗ {r.date} {r.time ? `— ${r.time}` : ""}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
