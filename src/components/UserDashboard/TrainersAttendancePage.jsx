import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { Pagination } from "./shared";

const today = new Date().toISOString().split("T")[0];

const TrainersAttendancePage = () => {
  const { user, institute } = useAuth();

  const [trainers, setTrainers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);

  /* 🔒 Load institute trainers */
  useEffect(() => {
    if (!user || institute?.role !== "institute") return;

    const q = query(
      collection(db, "InstituteTrainers"),
      where("instituteId", "==", user.uid),
    );

    return onSnapshot(q, (snap) => {
      setTrainers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    });
  }, [user, institute]);

  /* 📅 Load attendance for selected date */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "trainerAttendance"),
      where("instituteId", "==", user.uid),
      where("date", "==", selectedDate),
    );

    return onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        map[d.data().trainerId] = d.data().status === "present";
      });
      setAttendance(map);
    });
  }, [user, selectedDate]);

  /* 🔍 Search */
  const filteredRows = useMemo(() => {
    return trainers.filter((t) =>
      `${t.firstName} ${t.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [trainers, search]);

  /* 🔐 Date validation */
  const canEditDate = (joinedDate) => {
    if (selectedDate > today) return false; // ❌ future
    if (joinedDate && selectedDate < joinedDate) return false; // ❌ before joining
    return true; // ✅ joining date INCLUDED
  };

  /* ✅ Save attendance */
  const markAttendance = async (trainer, value) => {
    if (!canEditDate(trainer.joinedDate)) return;

    await setDoc(
      doc(db, "trainerAttendance", `${trainer.uid}_${selectedDate}`),
      {
        trainerId: trainer.uid,
        instituteId: user.uid,
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center bg-[#3b2615] border border-[#6b4a2d] rounded-full px-4 py-2 w-full max-w-md">
          <span className="mr-2 text-lg text-gray-300">🔍</span>
          <input
            type="text"
            placeholder="Search trainers attendance by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm w-full placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-orange-500">
          Trainer’s Attendance
        </h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold"
        />
      </div>

      {/* Table */}
      <div className="bg-[#f9c199] rounded-t-xl overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-4 py-3 text-black font-semibold text-lg">
          <div>Trainers Name</div>
          <div>Category</div>
          <div>Present</div>
          <div>Absent</div>
        </div>

        <div className="bg-white text-black">
          {filteredRows.map((trainer) => {
            const isPresent = attendance[trainer.uid] === true;
            const isAbsent = attendance[trainer.uid] === false;
            const disabled = !canEditDate(trainer.joinedDate);

            return (
              <div
                key={trainer.uid}
                className="grid grid-cols-4 gap-4 px-4 py-3 border-t border-gray-200 text-sm items-center"
              >
                <div className="font-semibold">
                  {trainer.firstName} {trainer.lastName}
                </div>

                <div>{trainer.category || "-"}</div>

                <div>
                  <button
                    onClick={() => {
                      if (!canEditDate(trainer.joinedDate)) {
                        if (selectedDate > today) {
                          alert("Cannot mark attendance for future dates");
                        } else if (selectedDate < trainer.joinedDate) {
                          alert(
                            `Cannot mark attendance before trainer's joining date (${trainer.joinedDate})`,
                          );
                        }
                        return;
                      }
                      markAttendance(trainer, true);
                    }}
                    className={
                      "px-3 py-1 rounded-full text-xs font-semibold cursor-pointer " +
                      (attendance[trainer.uid] === true
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-700")
                    }
                  >
                    Present
                  </button>
                </div>

                <div>
                  <button
                    onClick={() => {
                      if (!canEditDate(trainer.joinedDate)) {
                        if (selectedDate > today) {
                          alert("Cannot mark attendance for future dates");
                        } else if (selectedDate < trainer.joinedDate) {
                          alert(
                            `Cannot mark attendance before trainer's joining date (${trainer.joinedDate})`,
                          );
                        }
                        return;
                      }
                      markAttendance(trainer, false);
                    }}
                    className={
                      "px-3 py-1 rounded-full text-xs font-semibold cursor-pointer " +
                      (attendance[trainer.uid] === false
                        ? "bg-red-500 text-white"
                        : "bg-gray-200 text-gray-700")
                    }
                  >
                    Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Pagination />
    </div>
  );
};

export default TrainersAttendancePage;
