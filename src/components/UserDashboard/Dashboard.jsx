/* FULL 400+ LINES DYNAMIC DASHBOARD CODE
   FIXES:
   - trainingMetrics undefined
   - physicalMetrics undefined
   - dynamic instituteId based on login
   - reloads empty if no data
   - no stale previous selection
   - UI unchanged
*/

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { CalendarDays, Activity, Clock } from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useSelectedStudent } from "../../context/SelectedStudentContext";
import { Tooltip } from "recharts";
/* ---------------- Donut Component ---------------- */
const Donut = ({ data, observations }) => {
  return (
    <PieChart width={180} height={180}>
      <Pie
        data={data}
        innerRadius={70}
        outerRadius={90}
        dataKey="value"
        nameKey="name"
        paddingAngle={2}
      >
        {data.map((entry, index) => (
          <Cell key={index} fill={entry.color} />
        ))}
      </Pie>

      <Tooltip content={<CustomTooltip observations={observations} />} />
    </PieChart>
  );
};

{
  /* 🔥 TOOLTIP */
}

/* ---------------- Dashboard ---------------- */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-white p-2 border rounded shadow text-sm">
        <p className="font-semibold capitalize">{data.name}</p>
        <p>
          {data.observation}/{data.fullValue}
        </p>
      </div>
    );
  }
  return null;
};

const CustomPhysicalTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const data = item.payload;

    return (
      <div className="bg-white p-2 border rounded shadow text-sm">
        <p className="font-semibold">{data.name.toUpperCase()}</p>
        <p>
          {data.observation}/{data.value}
        </p>
      </div>
    );
  }
  return null;
};
const Dashboard = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [trainingMetrics, setTrainingMetrics] = useState(null);
  const [physicalMetrics, setPhysicalMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [role, setRole] = useState("student");
  const { selectedStudentUid } = useSelectedStudent();
  const [trainingObservations, setTrainingObservations] = useState(null);
  console.log("Current Student:", selectedStudentUid);
  const [metricObservations, setMetricObservations] = useState(null);
  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setAttendanceData([]);
        setTrainingMetrics(null);
        setPhysicalMetrics(null);

        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        /* 🔹 Check if user is student */
        let targetStudentId = selectedStudentUid || user.uid;

        const studentRef = doc(db, "students", targetStudentId);
        const studentSnap = await getDoc(studentRef);

        let instituteId = null;

        if (studentSnap.exists()) {
          /* STUDENT / SIBLING LOGIN */
          setRole("student");

          const studentData = studentSnap.data();
          instituteId = studentData.instituteId;
        } else {
          /* FAMILY LOGIN */
          setRole("family");

          const familyRef = doc(db, "families", user.uid);
          const familySnap = await getDoc(familyRef);

          if (!familySnap.exists()) {
            setLoading(false);
            return;
          }

          const familyData = familySnap.data();
          const studentIds = familyData.students || [];

          if (studentIds.length === 0) {
            setLoading(false);
            return;
          }

          /* Load students list */
          const studentDocs = await Promise.all(
            studentIds.map((id) => getDoc(doc(db, "students", id))),
          );

          const studentList = studentDocs
            .filter((s) => s.exists())
            .map((s) => ({ id: s.id, ...s.data() }));

          setStudents(studentList);

          const selected = studentList.find((s) => s.id === selectedStudentUid);

          targetStudentId = selected?.id || studentList[0].id;
          instituteId = selected?.instituteId || studentList[0].instituteId;
        }

        if (!targetStudentId || !instituteId) {
          setLoading(false);
          return;
        }
        /* 🔹 Fetch Institute Events */
        const eventsQuery = query(
          collection(db, "events"),
          where("basicInfo.instituteId", "==", instituteId),
        );

        const eventsSnap = await getDocs(eventsQuery);

        console.log("TOTAL EVENTS:", eventsSnap.docs.length);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingEvents = eventsSnap.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((event) => {
            if (event.basicInfo?.instituteId !== instituteId) return false;

            const endDate = event.schedule?.endDate;
            if (!endDate) return false;

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            return end >= today;
          })
          .sort(
            (a, b) =>
              new Date(a.schedule?.startDate) - new Date(b.schedule?.startDate),
          );

        console.log("Filtered Events:", upcomingEvents);

        setEvents(upcomingEvents); /* 🔹 Query performance data */
        console.log("QUERY DEBUG:");
        console.log("Institute:", instituteId);
        console.log("Student:", selectedStudentUid || user.uid);
        const q = query(
          collection(db, `institutes/${instituteId}/performancestudents`),
          where("studentId", "==", targetStudentId),
        );

        const snap = await getDocs(q);

        if (snap.empty) {
          console.log("No data for this student ❌");

          setAttendanceData([]);
          setTrainingMetrics(null);
          setPhysicalMetrics(null);
          setLoading(false);
          return;
        }

        // ✅ Always pick latest record
        const latestDoc = snap.docs.sort(
          (a, b) => b.data().createdAt?.seconds - a.data().createdAt?.seconds,
        )[0];

        const docData = latestDoc.data();

        console.log("FOUND DATA ✅", docData);

        if (snap.empty) {
          console.log("No documents found ❌");
        } else {
          console.log("Documents exist ✅");
        }

        const attendanceResult = [];
        let training = null;
        let physical = null;
        let observations = null;

        if (docData.categories) {
          docData.categories.forEach((cat) => {
            (cat.subCategories || []).forEach((sub) => {
              if (sub.metrics && !training) {
                training = sub.metrics;
              }

              if (sub.metricObservations && !observations) {
                observations = sub.metricObservations;
              }

              if (sub.physicalFitness && !physical) {
                physical = sub.physicalFitness;
              }
            });
          });
        }
        console.log("TRAINING ✅", training);
        console.log("PHYSICAL ✅", physical);

        /* ✅ SET STATE */
        setAttendanceData(attendanceResult);
        setTrainingMetrics(training);
        setPhysicalMetrics(physical);
        setMetricObservations(observations);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard fetch error:", err);

        setAttendanceData([]);
        setTrainingMetrics(null);
        setPhysicalMetrics(null);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStudentUid]);

  /* ---------------- Helpers ---------------- */
  useEffect(() => {
    // 🔥 HARD RESET when student changes
    setAttendanceData([]);
    setTrainingMetrics(null);
    setPhysicalMetrics(null);
    setEvents([]);
  }, [selectedStudentUid]);
  const parseScore = (val) => {
    if (!val) return 0;
    if (typeof val === "string" && val.includes("/")) {
      return Number(val.split("/")[0]) || 0;
    }
    if (typeof val === "string" && val.includes("%")) {
      return Number(val.replace("%", "")) || 0;
    }
    return Number(val) || 0;
  };

  /* ---------------- UI ---------------- */
  console.log("STATE TRAINING:", trainingMetrics);
  console.log("STATE PHYSICAL:", physicalMetrics);
  return (
    <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Top Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-orange-400 rounded-lg p-5 flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-md">
            <CalendarDays className="text-orange-500" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Upcoming Events</h3>
            <p className="text-gray-500 text-sm">{events.length} Events</p>
          </div>
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Upcoming Events */}
        <div className="col-span-1">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 px-2 sm:px-0">
            Upcoming Events
          </h2>

          <div className="bg-white border border-orange-400 rounded-lg p-5 h-full">
            <div className="divide-y divide-gray-200">
              {events.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No upcoming events</p>
              ) : (
                events.slice(0, 5).map((event) => (
                  <div key={event.id} className="py-3">
                    <h4 className="font-semibold">
                      {event.basicInfo?.eventName}
                    </h4>

                    <p className="text-sm text-gray-500">
                      {event.schedule?.startDate} | {event.schedule?.startTime}
                    </p>

                    <p className="text-sm text-gray-500">
                      {event.schedule?.venueName}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Training Progress */}
        <div className="col-span-2">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 px-2 sm:px-0 ">
            Training Progress
          </h2>

          <div className="bg-white border border-orange-400 rounded-lg p-3 sm:p-5 h-full">
            <div className="flex flex-col lg:flex-row justify-around items-center gap-10">
              {/* Left Donut */}
              <div className="flex flex-col items-center">
                {trainingMetrics ? (
                  <Donut
                    data={[
                      {
                        name: "coach",
                        value:
                          (parseScore(metricObservations?.coach) /
                            parseScore(trainingMetrics?.coach || 10)) *
                          10,
                        fullValue: parseScore(trainingMetrics?.coach),
                        observation: parseScore(metricObservations?.coach),
                        color: "#f97316",
                      },
                      {
                        name: "skill",
                        value:
                          (parseScore(metricObservations?.skill) /
                            parseScore(trainingMetrics?.skill || 10)) *
                          10,
                        fullValue: parseScore(trainingMetrics?.skill),
                        observation: parseScore(metricObservations?.skill),
                        color: "#eab308",
                      },
                      {
                        name: "fitness",
                        value:
                          (parseScore(metricObservations?.fitness) /
                            parseScore(trainingMetrics?.fitness || 10)) *
                          10,
                        fullValue: parseScore(trainingMetrics?.fitness),
                        observation: parseScore(metricObservations?.fitness),
                        color: "#22c55e",
                      },
                      {
                        name: "discipline",
                        value:
                          (parseScore(metricObservations?.discipline) /
                            parseScore(trainingMetrics?.discipline || 10)) *
                          10,
                        fullValue: parseScore(trainingMetrics?.discipline),
                        observation: parseScore(metricObservations?.discipline),
                        color: "#6b7280",
                      },
                      {
                        name: "team",
                        value:
                          (parseScore(metricObservations?.team) /
                            parseScore(trainingMetrics?.team || 10)) *
                          10,
                        fullValue: parseScore(trainingMetrics?.team),
                        observation: parseScore(metricObservations?.team),
                        color: "#3b82f6",
                      },
                      {
                        name: "focus",
                        value:
                          (parseScore(metricObservations?.focus) /
                            parseScore(trainingMetrics?.focus || 10)) *
                          10,
                        fullValue: parseScore(trainingMetrics?.focus),
                        observation: parseScore(metricObservations?.focus),
                        color: "#ef4444",
                      },
                    ]}
                  />
                ) : (
                  <p className="text-gray-400 mt-6">No training data</p>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <p>
                    <span className="w-3 h-3 bg-orange-500 inline-block mr-2 rounded-full"></span>
                    Coach Rating
                  </p>
                  <p>
                    <span className="w-3 h-3 bg-yellow-400 inline-block mr-2 rounded-full"></span>
                    Skill Progress
                  </p>
                  <p>
                    <span className="w-3 h-3 bg-green-500 inline-block mr-2 rounded-full"></span>
                    Fitness
                  </p>
                  <p>
                    <span className="w-3 h-3 bg-gray-500 inline-block mr-2 rounded-full"></span>
                    Discipline
                  </p>
                  <p>
                    <span className="w-3 h-3 bg-blue-500 inline-block mr-2 rounded-full"></span>
                    Team Work
                  </p>
                  <p>
                    <span className="w-3 h-3 bg-red-500 inline-block mr-2 rounded-full"></span>
                    Effort
                  </p>
                </div>
              </div>

              {/* Right Donut */}
              <div className="flex flex-col items-center">
                {physicalMetrics ? (
                  <Donut
                    data={[
                      {
                        name: "speed",
                        value:
                          (parseScore(physicalMetrics?.speed?.observation) /
                            parseScore(physicalMetrics?.speed?.value || 10)) *
                          10,
                        observation: parseScore(
                          physicalMetrics?.speed?.observation,
                        ),
                        fullValue: parseScore(physicalMetrics?.speed?.value),
                        color: "#f97316",
                      },
                      {
                        name: "agility",
                        value:
                          (parseScore(physicalMetrics?.agility?.observation) /
                            parseScore(physicalMetrics?.agility?.value || 10)) *
                          10,
                        observation: parseScore(
                          physicalMetrics?.agility?.observation,
                        ),
                        fullValue: parseScore(physicalMetrics?.agility?.value),
                        color: "#eab308",
                      },
                      {
                        name: "stamina",
                        value:
                          (parseScore(physicalMetrics?.stamina?.observation) /
                            parseScore(physicalMetrics?.stamina?.value || 10)) *
                          10,
                        observation: parseScore(
                          physicalMetrics?.stamina?.observation,
                        ),
                        fullValue: parseScore(physicalMetrics?.stamina?.value),
                        color: "#22c55e",
                      },
                      {
                        name: "flexibility",
                        value:
                          (parseScore(
                            physicalMetrics?.flexibility?.observation,
                          ) /
                            parseScore(
                              physicalMetrics?.flexibility?.value || 10,
                            )) *
                          10,
                        observation: parseScore(
                          physicalMetrics?.flexibility?.observation,
                        ),
                        fullValue: parseScore(
                          physicalMetrics?.flexibility?.value,
                        ),
                        color: "#3b82f6",
                      },
                      {
                        name: "strength",
                        value:
                          (parseScore(physicalMetrics?.strength?.observation) /
                            parseScore(
                              physicalMetrics?.strength?.value || 10,
                            )) *
                          10,
                        observation: parseScore(
                          physicalMetrics?.strength?.observation,
                        ),
                        fullValue: parseScore(physicalMetrics?.strength?.value),
                        color: "#10b981",
                      },
                    ]}
                  />
                ) : (
                  <p className="text-gray-400 mt-6">No physical data</p>
                )}

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <p>
                    <span className="w-3 h-3 bg-orange-500 inline-block mr-2 rounded-full"></span>
                    Speed
                  </p>
                  <p>
                    <span className="w-3 h-3 bg-yellow-400 inline-block mr-2 rounded-full"></span>
                    Agility
                  </p>
                  <p>
                    <span className="w-3 h-3 bg-green-500 inline-block mr-2 rounded-full"></span>
                    Stamina
                  </p>
                  <p>
                    <span className="w-3 h-3 bg-blue-500 inline-block mr-2 rounded-full"></span>
                    Flexibility
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-6">
              <strong>Trainer Observation :</strong> Demonstrates consistent
              dedication, strong discipline, and steady improvement across all
              training sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold mb-6">Attendance Summary</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center text-gray-500">
              Loading attendance...
            </div>
          ) : attendanceData.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500">
              No attendance data available
            </div>
          ) : (
            attendanceData.map((item, index) => (
              <div
                key={index}
                className="bg-white border border-orange-400 rounded-lg p-5"
              >
                <h3 className="font-semibold text-lg mb-4">{item.title}</h3>

                <p className="mb-2">
                  Total Session{" "}
                  <span className="float-right">{item.total}</span>
                </p>
                <p className="mb-2">
                  Present <span className="float-right">{item.present}</span>
                </p>
                <p className="mb-2">
                  Absent{" "}
                  <span className="float-right">
                    {item.absent.toString().padStart(2, "0")}
                  </span>
                </p>

                <div className="border-t mt-4 pt-3">
                  <p className="text-sm mb-2">
                    Attendance Rate : {item.present}/{item.total}
                  </p>
                  <div className="w-full bg-gray-200 h-2 rounded-full">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{
                        width: `${item.total ? (item.present / item.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
