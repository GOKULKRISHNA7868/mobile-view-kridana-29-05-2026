import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function CreateFamily() {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      const snapshot = await getDocs(collection(db, "trainerstudents"));
      setStudents(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchStudents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!email || !password || !fatherName || !motherName || !phone) {
      setMessage("Please fill all fields.");
      setLoading(false);
      return;
    }
    if (!selectedStudents.length) {
      setMessage("Select at least one student.");
      setLoading(false);
      return;
    }

    try {
      // 1️⃣ Create family account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;

      // 2️⃣ Create Firestore family document
      await setDoc(doc(db, "families", uid), {
        email,
        fatherName,
        motherName,
        phone,
        students: selectedStudents,
        role: "family",
        createdAt: serverTimestamp(),
      });

      setMessage("Family account created successfully!");
      setEmail("");
      setPassword("");
      setFatherName("");
      setMotherName("");
      setPhone("");
      setSelectedStudents([]);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Error creating family account.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-md mt-10">
      <h2 className="text-xl font-bold mb-4">Create Family Account</h2>

      {message && <div className="mb-4 text-red-500">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Father Name"
          className="w-full border p-2 rounded"
          value={fatherName}
          onChange={(e) => setFatherName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Mother Name"
          className="w-full border p-2 rounded"
          value={motherName}
          onChange={(e) => setMotherName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Phone"
          className="w-full border p-2 rounded"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <div>
          <label>Select Students</label>
          <select
            multiple
            className="w-full border p-2 rounded"
            value={selectedStudents}
            onChange={(e) =>
              setSelectedStudents(
                Array.from(e.target.selectedOptions, (option) => option.value),
              )
            }
          >
            {students.map((stu) => (
              <option key={stu.studentUid} value={stu.studentUid}>
                {stu.firstName} {stu.lastName}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Hold Ctrl (Windows) or Cmd (Mac) to select multiple.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Creating..." : "Create Family Account"}
        </button>
      </form>
    </div>
  );
}
