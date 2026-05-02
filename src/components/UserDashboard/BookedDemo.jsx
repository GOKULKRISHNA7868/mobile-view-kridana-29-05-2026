import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function MyBookedDemos() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [booked, setBooked] = useState([]);
  const [available, setAvailable] = useState([]);
  const [showBooking, setShowBooking] = useState(false);

  /* 🔐 Auth */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) navigate("/login");
      else setUser(u);
    });
    return () => unsub();
  }, [navigate]);

  /* 📦 Fetch booked demos (user only) */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "BOOKEDDEMOCLASSES"),
      where("bookedByUID", "==", user.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      setBooked(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user]);

  /* 📋 Fetch available demos */
  const fetchAvailable = async () => {
    const snap = await getDocs(collection(db, "demo"));
    let demos = [];

    for (const institute of snap.docs) {
      const itemsSnap = await getDocs(
        collection(db, "demo", institute.id, "items"),
      );

      itemsSnap.forEach((d) => {
        demos.push({
          id: d.id,
          instituteId: institute.id,
          ...d.data(),
        });
      });
    }

    setAvailable(demos);
    setShowBooking(true);
  };

  /* 📌 Book demo */
  const bookDemo = async (demo) => {
    const already = booked.find(
      (b) =>
        b.demoDetails.date === demo.date &&
        b.demoDetails.timing === demo.timing,
    );

    if (already) {
      alert("You already booked this demo");
      return;
    }
    await addDoc(collection(db, "BOOKEDDEMOCLASSES"), {
      bookedByUID: user.uid, // ✅ MUST match query
      name: user.displayName || "User",
      email: user.email,
      phone: "",
      address: "",
      instituteId: demo.instituteId,
      demoClassId: demo.id,
      demoDetails: demo,
      status: "pending",
      bookedAt: new Date(),
    });

    setShowBooking(false);
  };

  /* ❌ Cancel demo */
  const cancelDemo = async (id) => {
    if (window.confirm("Cancel this demo booking?")) {
      await deleteDoc(doc(db, "BOOKEDDEMOCLASSES", id));
    }
  };

  return (
    <div className="min-h-screen p-6 bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-6 text-gray-900">
      <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6 text-gray-900">
        <h1 className="text-3xl font-bold mb-6">🎯 My Demo Classes</h1>

        {/* 📦 If booked */}
        {booked.length > 0 && (
          <div className="grid gap-4 mb-8">
            {booked.map((b) => (
              <div
                key={b.id}
                className="border rounded-xl p-5 bg-white shadow grid md:grid-cols-3 gap-4"
              >
                <div>
                  <h3 className="font-bold">{b.demoDetails.category}</h3>
                  <p>{b.demoDetails.description}</p>
                </div>

                <div className="text-sm">
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

                <div className="flex flex-col justify-between">
                  <span
                    className={`text-center py-1 rounded-full font-semibold ${
                      b.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : b.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {b.status}
                  </span>

                  <button
                    onClick={() => cancelDemo(b.id)}
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
                  >
                    Cancel Demo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ❌ No booked */}
        {booked.length === 0 && !showBooking && (
          <div className="text-center">
            <p className="text-lg mb-4">No demo classes booked</p>
            <button
              onClick={fetchAvailable}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold"
            >
              ➕ Book Demo Class
            </button>
          </div>
        )}

        {/* 📋 Available demos */}
        {showBooking && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Available Demo Classes</h2>

            <div className="grid md:grid-cols-2 gap-4">
              {available.map((d) => (
                <div
                  key={d.id}
                  className="border rounded-xl p-5 bg-white shadow"
                >
                  <h3 className="font-bold text-lg">{d.category}</h3>
                  <p className="text-sm mb-2">{d.description}</p>

                  <p>
                    <strong>Day:</strong> {d.day}
                  </p>
                  <p>
                    <strong>Date:</strong> {d.date}
                  </p>
                  <p>
                    <strong>Time:</strong> {d.timing}
                  </p>

                  <button
                    onClick={() => bookDemo(d)}
                    className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
                  >
                    Book Demo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
