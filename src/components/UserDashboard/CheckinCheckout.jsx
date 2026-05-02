import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";

const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function TrainerAttendanceCheck() {
  const [loading, setLoading] = useState(false);
  const [instituteLoc, setInstituteLoc] = useState(null);
  const [message, setMessage] = useState("");
  const [attendance, setAttendance] = useState(null);
  const [history, setHistory] = useState([]);

  const trainerId = auth.currentUser?.uid;

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const month = today.slice(0, 7); // YYYY-MM
  const docId = `${trainerId}_${today}`;

  const getLocation = () =>
    new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        reject,
        { enableHighAccuracy: true },
      ),
    );

  /* ==============================
     🔑 GET INSTITUTE LOCATION BASED ON TRAINER
  ============================== */
  useEffect(() => {
    const fetchInstitute = async () => {
      try {
        const trainerSnap = await getDoc(
          doc(db, "InstituteTrainers", trainerId),
        );
        if (!trainerSnap.exists()) {
          setMessage("Trainer not found!");
          return;
        }

        const instituteId = trainerSnap.data().instituteId;
        const instituteSnap = await getDoc(doc(db, "institutes", instituteId));
        if (!instituteSnap.exists()) {
          setMessage("Institute not found!");
          return;
        }

        setInstituteLoc({
          lat: parseFloat(instituteSnap.data().latitude),
          lng: parseFloat(instituteSnap.data().longitude),
          instituteId: instituteSnap.id,
        });
      } catch (err) {
        console.error(err);
        setMessage("Error fetching institute location");
      }
    };

    if (trainerId) fetchInstitute();
  }, [trainerId]);

  /* ==============================
     📥 LOAD TODAY ATTENDANCE
  ============================== */
  useEffect(() => {
    if (!instituteLoc || !trainerId) return;

    const loadToday = async () => {
      const ref = doc(
        db,
        "institutes",
        instituteLoc.instituteId,
        "trainerAttendance",
        docId,
      );
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setAttendance({ id: snap.id, ...snap.data() });
      }
    };

    loadToday();
  }, [instituteLoc, trainerId]);

  /* ==============================
     📜 LOAD HISTORY
  ============================== */
  useEffect(() => {
    if (!instituteLoc || !trainerId) return;

    const loadHistory = async () => {
      const q = query(
        collection(
          db,
          "institutes",
          instituteLoc.instituteId,
          "trainerAttendance",
        ),
        where("trainerId", "==", trainerId),
        orderBy("date", "desc"),
      );

      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setHistory(list);
    };

    loadHistory();
  }, [instituteLoc, trainerId, message]);

  const handleCheckIn = async () => {
    if (!instituteLoc) return;
    setLoading(true);
    try {
      const loc = await getLocation();
      const distance = getDistanceInKm(
        loc.lat,
        loc.lng,
        instituteLoc.lat,
        instituteLoc.lng,
      );

      if (distance > 2) {
        alert(
          `You are too far away (${distance.toFixed(
            2,
          )} km). Go to institute to check in.`,
        );
        return;
      }

      await setDoc(
        doc(
          db,
          "institutes",
          instituteLoc.instituteId,
          "trainerAttendance",
          docId,
        ),
        {
          trainerId,
          instituteId: instituteLoc.instituteId,
          date: today,
          month,
          status: "on duty",
          checkInTime: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );

      setMessage("Check-in successful!");
    } catch (err) {
      console.error(err);
      setMessage("Check-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!instituteLoc) return;
    setLoading(true);
    try {
      const docRef = doc(
        db,
        "institutes",
        instituteLoc.instituteId,
        "trainerAttendance",
        docId,
      );
      const snap = await getDoc(docRef);

      if (!snap.exists() || !snap.data().checkInTime) {
        alert("You must check in first!");
        return;
      }

      const loc = await getLocation();
      const distance = getDistanceInKm(
        loc.lat,
        loc.lng,
        instituteLoc.lat,
        instituteLoc.lng,
      );

      if (distance > 2) {
        alert(
          `You are too far away (${distance.toFixed(
            2,
          )} km). Go to institute to check out.`,
        );
        return;
      }

      const checkInTime = snap.data().checkInTime.toDate();
      const now = new Date();
      const hoursWorked =
        (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      await updateDoc(docRef, {
        checkOutTime: serverTimestamp(),
        totalHours: Number(hoursWorked.toFixed(2)),
        status: "present",
      });

      setMessage("Check-out successful!");
    } catch (err) {
      console.error(err);
      setMessage("Check-out failed");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "--";
    return ts.toDate().toLocaleTimeString();
  };

  return (
    <div className="max-w-md mx-auto bg-white text-black p-6 rounded-xl shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Trainer Attendance
      </h2>

      {message && (
        <p className="mb-4 text-center font-medium text-orange-500">
          {message}
        </p>
      )}

      {/* ===== TODAY STATUS ===== */}
      {attendance && (
        <div className="bg-gray-100 p-3 rounded-lg mb-4 text-sm">
          <p>
            <b>Status:</b> {attendance.status}
          </p>
          <p>
            <b>Check-in:</b> {formatTime(attendance.checkInTime)}
          </p>
          <p>
            <b>Check-out:</b> {formatTime(attendance.checkOutTime)}
          </p>
          <p>
            <b>Total Hours:</b> {attendance.totalHours || 0}
          </p>
        </div>
      )}

      <button
        onClick={handleCheckIn}
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded mb-3 hover:bg-green-700 transition"
      >
        Check In
      </button>

      <button
        onClick={handleCheckOut}
        disabled={loading}
        className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
      >
        Check Out
      </button>

      {/* ===== HISTORY ===== */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Attendance History</h3>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {history.map((h) => (
            <div key={h.id} className="border p-2 rounded text-sm bg-gray-50">
              <p>
                <b>Date:</b> {h.date}
              </p>
              <p>
                <b>Check-in:</b> {formatTime(h.checkInTime)}
              </p>
              <p>
                <b>Check-out:</b> {formatTime(h.checkOutTime)}
              </p>
              <p>
                <b>Hours:</b> {h.totalHours || 0}
              </p>
              <p>
                <b>Status:</b> {h.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
