// StudentSelfPerformance.jsx
// Full responsive student self-dashboard
// TailwindCSS + Firebase Firestore
// Shows only logged-in student's data
// Month filter with 'Not Available' state
// Dynamic institute detection (NO hardcoded institute ID)

import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function StudentSelfPerformance() {
  const [user, setUser] = useState(null);
  const [month, setMonth] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notAvailable, setNotAvailable] = useState(false);
  const [instituteId, setInstituteId] = useState(null);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);

        // 🔹 Fetch student's institute dynamically
        const studentRef = doc(db, "students", u.uid);
        const snap = await getDoc(studentRef);

        if (snap.exists()) {
          const sData = snap.data();
          setInstituteId(sData.instituteId); // ✅ dynamic institute
        }
      }
    });

    return () => unsub();
  }, []);

  /* ---------------- FETCH PERFORMANCE ---------------- */
  const fetchData = async (selectedMonth) => {
    if (!user || !selectedMonth || !instituteId) return;

    setLoading(true);
    setNotAvailable(false);
    setData(null);

    try {
      const ref = collection(
        db,
        "institutes",
        instituteId,
        "performancestudents",
      );

      const q = query(
        ref,
        where("studentId", "==", user.uid),
        where("month", "==", selectedMonth),
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setNotAvailable(true);
      } else {
        const docData = snap.docs[0].data();
        setData(docData);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setNotAvailable(true);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (month && instituteId) fetchData(month);
  }, [month, instituteId]);

  /* ---------------- CHART DATA ---------------- */

  const chartLeft = data
    ? {
        labels: ["Coach", "Skill", "Fitness", "Discipline", "Team", "Effort"],
        datasets: [
          {
            data: [
              parseInt(data.metrics.coach),
              parseInt(data.metrics.skill),
              parseInt(data.metrics.fitness),
              parseInt(data.metrics.discipline),
              parseInt(data.metrics.team),
              parseInt(data.metrics.effort || "5"),
            ],
            backgroundColor: [
              "#f97316", // coach - orange
              "#facc15", // skill - yellow
              "#22c55e", // fitness - green
              "#6b7280", // discipline - gray
              "#3b82f6", // team - blue
              "#ef4444", // effort - red
            ],
            borderWidth: 0,
            cutout: "70%",
          },
        ],
      }
    : null;

  const chartRight = data
    ? {
        labels: ["Speed", "Agility", "Stamina", "Flexibility", "Focus"],
        datasets: [
          {
            data: [
              parseInt(data.physicalFitness?.speed?.value || "0"),
              parseInt(data.physicalFitness?.agility?.value || "0"),
              parseInt(data.physicalFitness?.stamina?.value || "0"),
              parseInt(data.physicalFitness?.flexibility?.value || "0"),
              parseInt(data.metrics.focus || "0"),
            ],
            backgroundColor: [
              "#f97316", // speed - orange
              "#facc15", // agility - yellow
              "#22c55e", // stamina - green
              "#3b82f6", // flexibility - blue
              "#a855f7", // focus - purple
            ],
            borderWidth: 0,
            cutout: "70%",
          },
        ],
      }
    : null;

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto border-4 border-orange-500 rounded-xl p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">Student Performance</h1>
            {data && (
              <>
                <p className="mt-2">
                  <b>Category:</b> {data.category}
                </p>
                <p>
                  <b>Sub Category:</b> {data.subCategory}
                </p>
              </>
            )}
          </div>

          <select
            className="bg-orange-500 text-white px-5 py-2 rounded-lg font-semibold"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">Select the Month</option>

            <option value="2026-01">January 2026</option>
            <option value="2026-02">February 2026</option>
            <option value="2026-03">March 2026</option>
            <option value="2026-04">April 2026</option>
            <option value="2026-05">May 2026</option>
            <option value="2026-06">June 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-10">October 2026</option>
            <option value="2026-11">November 2026</option>
            <option value="2026-12">December 2026</option>
          </select>
        </div>

        {/* Body */}
        {!month && (
          <div className="text-center py-24 text-gray-400 font-semibold">
            Select a month to view your performance report
          </div>
        )}

        {loading && (
          <div className="text-center py-24 font-semibold">Loading...</div>
        )}

        {notAvailable && (
          <div className="text-center py-24 text-red-500 font-bold text-lg">
            Performance report not available for selected month
          </div>
        )}

        {data && (
          <>
            {/* Info */}
            <div className="mt-6 space-y-2">
              <p>
                <b>Attendance:</b> {data.attendance}
              </p>
              <p>
                <b>Present:</b> {data.attendanceStats.present} /{" "}
                {data.attendanceStats.total}
              </p>
            </div>

            {/* Metrics Box */}
            <div className="border-4 border-orange-500 rounded-xl p-4 mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>Fitness: {data.metrics.fitness} ⭐</div>
              <div>Skill: {data.metrics.skill} ⭐</div>
              <div>Coach: {data.metrics.coach} ⭐</div>
              <div>Discipline: {data.metrics.discipline} ⭐</div>
              <div>Focus: {data.metrics.focus} ⭐</div>
              <div>Team: {data.metrics.team} ⭐</div>
            </div>

            {/* Charts */}
            <div className="border-4 border-orange-500 rounded-xl p-6 mt-6 grid md:grid-cols-2 gap-10">
              <div className="flex flex-col items-center">
                <Doughnut data={chartLeft} />
                <div className="grid grid-cols-2 gap-3 text-xs mt-4">
                  <span>🟠 Coach</span>
                  <span>🟡 Skill</span>
                  <span>🟢 Fitness</span>
                  <span>⚫ Discipline</span>
                  <span>🔵 Team</span>
                  <span>🔴 Effort</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <Doughnut data={chartRight} />
                <div className="grid grid-cols-2 gap-3 text-xs mt-4">
                  <span>🟠 Speed</span>
                  <span>🟡 Agility</span>
                  <span>🟢 Stamina</span>
                  <span>🔵 Flexibility</span>
                  <span>🟣 Focus</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
