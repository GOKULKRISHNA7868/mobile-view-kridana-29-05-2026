// src/pages/DemoClassManager.jsx
import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { text } from "framer-motion/client";
const inputStyle = {
  width: "100%",
  padding: "0.6rem",
  borderRadius: "5px",
  border: "1.5px solid #bdbdbd", // ✅ grey by default
  outline: "none",
  marginTop: "0.35rem", // ✅ gap between label & input

};
const inputFocusStyle = {
  border: "1.5px solid #000",
};


const DemoClassManager = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [day, setDay] = useState("");
  const [timing, setTiming] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  // ✅ required fields (description is optional)
  const isFormValid =
    day &&
    timing &&
    category &&
    date;

  const dayOptions = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const timingOptions = [
    "6:00 AM - 7:00 AM",
    "7:00 AM - 8:00 AM",
    "8:00 AM - 9:00 AM",
    "4:00 PM - 5:00 PM",
    "5:00 PM - 6:00 PM",
    "6:00 PM - 7:00 PM",
    "7:00 PM - 8:00 PM",
  ];

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        fetchHistory(u.uid);
      } else {
        navigate("/login");
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  const fetchHistory = (uid) => {
    const demoRef = collection(db, "demo", uid, "all_details");
    const q = query(demoRef, orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setHistory(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!day || !timing || !category || !date) {
      alert("Please fill all required fields!");
      return;
    }

    setLoading(true);
    try {
      const demoRef = collection(db, "demo", user.uid, "all_details");

      if (editId) {
        const docRef = doc(db, "demo", user.uid, "all_details", editId);
        await updateDoc(docRef, {
          day,
          timing,
          category,
          date,
          description,
          updatedAt: serverTimestamp(),
        });
        setEditId(null);
      } else {
        await addDoc(demoRef, {
          day,
          timing,
          category,
          date,
          description,
          createdAt: serverTimestamp(),
        });
      }

      setDay("");
      setTiming("");
      setCategory("");
      setDate("");
      setDescription("");
    } catch (err) {
      console.error("Error saving demo class:", err);
      alert("Failed to save demo class.");
    }
    setLoading(false);
  };

  const handleEdit = (item) => {
    setDay(item.day);
    setTiming(item.timing);
    setCategory(item.category);
    setDate(item.date);
    setDescription(item.description);
    setEditId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await deleteDoc(doc(db, "demo", user.uid, "all_details", id));
      } catch (err) {
        console.error("Error deleting demo class:", err);
        alert("Failed to delete demo class.");
      }
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F2F2F2",
        padding: "2rem",
        fontFamily: "Arial, sans-serif",
        color: "#000",
      }}
    >
      <h1 style={{ fontWeight: "bold", fontSize: "2.0rem", textAlign: "center", marginBottom: "2rem", color: "#df6a26" }}>
        Demo Class Manager
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#fff",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        {/* Day Dropdown */}
        <div style={{ marginBottom: "1rem" }}>
          <label>Day:<span style={{ color: "red" }}>*</span></label>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            onFocus={(e) => (e.target.style.border = inputFocusStyle.border)}
            onBlur={(e) => (e.target.style.border = inputStyle.border)}
            style={{
              ...inputStyle,
              color: day ? "#000" : "#9e9e9e", // ✅ gray → black
            }}
          >
            <option value="">Select Day</option>
            {dayOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

        </div>

        {/* Timing Dropdown */}
        <div style={{ marginBottom: "1rem" }}>
          <label>Timing:<span style={{ color: "red" }}>*</span></label>
          <select
            value={timing}
            onChange={(e) => setTiming(e.target.value)}
            onFocus={(e) => (e.target.style.border = inputFocusStyle.border)}
            onBlur={(e) => (e.target.style.border = inputStyle.border)}
            style={{
              ...inputStyle,
              color: timing ? "#000" : "#9e9e9e", // ✅ gray → black
            }}
          >

            <option value="">Select Timing</option>
            {timingOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Category:<span style={{ color: "red" }}>*</span></label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onFocus={(e) => (e.target.style.border = inputFocusStyle.border)}
            onBlur={(e) => (e.target.style.border = inputStyle.border)}
            style={inputStyle}
          />


        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Date:<span style={{ color: "red" }}>*</span></label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            onFocus={(e) => (e.target.style.border = inputFocusStyle.border)}
            onBlur={(e) => (e.target.style.border = inputStyle.border)}
            style={inputStyle}
          />



        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            rows={4}
            onFocus={(e) => (e.target.style.border = inputFocusStyle.border)}
            onBlur={(e) => (e.target.style.border = inputStyle.border)}
            style={inputStyle}
          />


        </div>

        <button
          type="submit"
          disabled={loading || !isFormValid}
          style={{
            width: "100%",
            padding: "0.75rem",
           backgroundColor: isFormValid ? "#df6a26" : "#f9c199",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: isFormValid ? "pointer" : "not-allowed",
            fontWeight: "bold",
          }}
        >

          {loading
            ? "Saving..."
            : editId
              ? "Update Demo Class"
              : "Save Demo Class"}
        </button>
      </form>

      {/* History */}
      <div
        style={{
          maxWidth: "800px",
          margin: "2rem auto 0",
          backgroundColor: "#fff",
          padding: "1.5rem",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
          Demo Classes History
        </h2>

        {history.length === 0 && (
          <p style={{ textAlign: "center" }}>No demo classes added yet.</p>
        )}

        {history.map((item) => (
          <div
            key={item.id}
            style={{
              borderBottom: "1px solid #ddd",
              padding: "0.75rem 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p>
                <strong>Day:</strong> {item.day} | <strong>Timing:</strong>{" "}
                {item.timing}
              </p>
              <p>
                <strong>Category:</strong> {item.category} |{" "}
                <strong>Date:</strong> {item.date}
              </p>
             {item.description && (
  <p>
    <strong>Description:</strong> {item.description}
  </p>
)}

            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => handleEdit(item)}
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "#ffca28",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                style={{
                  padding: "0.25rem 0.5rem",
                  backgroundColor: "#e53935",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DemoClassManager;