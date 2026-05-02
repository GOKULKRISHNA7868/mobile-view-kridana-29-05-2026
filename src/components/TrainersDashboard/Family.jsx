import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { createUserWithEmailAndPassword } from "firebase/auth";

import { useAuth } from "../../context/AuthContext";

const CreateFamilyPage = () => {
  const { user } = useAuth();
  const instituteId = user?.uid;

  const [students, setStudents] = useState([]);
  const [families, setFamilies] = useState([]);

  const [selectedStudents, setSelectedStudents] = useState([]);

  const [formData, setFormData] = useState({
    email: "",
    fatherName: "",
    motherName: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);

  // =========================
  // FETCH STUDENTS
  // =========================
  const fetchStudents = async () => {
    const q = query(
      collection(db, "trainerstudents"),
      where("trainerId", "==", instituteId),
    );

    const snap = await getDocs(q);

    const list = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        docId: doc.id, // firestore doc id
        studentUid: data.studentUid, // actual student id
        firstName: data.firstName,
        lastName: data.lastName,
        subCategory: data.subCategory,
        familyId: data.familyId || null,
      };
    });

    setStudents(list);
  };

  // =========================
  // FETCH FAMILIES
  // =========================
  const fetchFamilies = async () => {
    const q = query(
      collection(db, "families"),
      where("trainerId", "==", instituteId),
    );

    const snap = await getDocs(q);

    const list = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setFamilies(list);
  };

  useEffect(() => {
    fetchStudents();
    fetchFamilies();
  }, []);

  // =========================
  // SELECT STUDENTS
  // =========================
  const toggleStudent = (uid) => {
    if (selectedStudents.includes(uid)) {
      setSelectedStudents(selectedStudents.filter((s) => s !== uid));
    } else {
      setSelectedStudents([...selectedStudents, uid]);
    }
  };

  // =========================
  // CREATE FAMILY
  // =========================
  const handleSubmit = async () => {
    if (!formData.email || selectedStudents.length === 0) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const q = query(
        collection(db, "families"),
        where("email", "==", formData.email),
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        alert("Family already exists with this email");
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        "123456",
      );

      const familyUID = userCredential.user.uid;

      await setDoc(doc(db, "families", familyUID), {
        email: formData.email,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        phone: formData.phone,
        role: "family",
        trainerId: instituteId,
        students: selectedStudents,
        createdAt: serverTimestamp(),
      });

      // LINK STUDENTS
      for (let student of students) {
        const studentRef = doc(db, "trainerstudents", student.docId);

        if (selectedStudents.includes(student.studentUid)) {
          await updateDoc(studentRef, {
            familyId: familyUID,
          });
        }
      }

      alert("Family login created successfully");

      resetForm();
      fetchFamilies();
      fetchStudents();
    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        alert("This email already has a login account");
      } else {
        alert("Error creating family");
      }
    }

    setLoading(false);
  };

  // =========================
  // EDIT FAMILY
  // =========================
  const handleEdit = (family) => {
    setEditingFamily(family);

    setFormData({
      email: family.email,
      fatherName: family.fatherName,
      motherName: family.motherName,
      phone: family.phone,
    });

    setSelectedStudents(family.students || []);
  };

  // =========================
  // UPDATE FAMILY
  // =========================
  const handleUpdate = async () => {
    try {
      setLoading(true);

      await updateDoc(doc(db, "families", editingFamily.id), {
        fatherName: formData.fatherName,
        motherName: formData.motherName,
        phone: formData.phone,
        students: selectedStudents,
      });

      // UPDATE STUDENT LINKS
      for (let student of students) {
        const studentRef = doc(db, "trainerstudents", student.docId);

        if (selectedStudents.includes(student.studentUid)) {
          await updateDoc(studentRef, {
            familyId: editingFamily.id,
          });
        } else {
          if (student.familyId === editingFamily.id) {
            await updateDoc(studentRef, {
              familyId: null,
            });
          }
        }
      }

      alert("Family updated successfully");

      resetForm();
      setEditingFamily(null);
      fetchFamilies();
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Error updating family");
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      fatherName: "",
      motherName: "",
      phone: "",
    });
    setSelectedStudents([]);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {editingFamily ? "Edit Family" : "Create Family Login"}
      </h1>

      {/* FORM */}
      <div className="grid grid-cols-2 gap-4 mb-6 bg-white p-6 rounded-xl shadow">
        <input
          placeholder="Parent Email"
          value={formData.email}
          disabled={editingFamily}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="border p-3 rounded"
        />

        <input
          placeholder="Father Name"
          value={formData.fatherName}
          onChange={(e) => {
            let value = e.target.value.replace(/[^A-Za-z\s]/g, "");
            if (value.length > 0) {
              value = value.charAt(0).toUpperCase() + value.slice(1);
            }
            setFormData({ ...formData, fatherName: value });
          }}
          className="border p-3 rounded"
        />

        <input
          placeholder="Mother Name"
          value={formData.motherName}
          onChange={(e) => {
            let value = e.target.value.replace(/[^A-Za-z\s]/g, "");
            if (value.length > 0) {
              value = value.charAt(0).toUpperCase() + value.slice(1);
            }
            setFormData({ ...formData, motherName: value });
          }}
          className="border p-3 rounded"
        />

        <input
          placeholder="Phone"
          maxLength={10}
          value={formData.phone}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 10);
            setFormData({ ...formData, phone: value });
          }}
          className="border p-3 rounded"
        />
      </div>

      {/* STUDENTS */}
      <h2 className="text-lg font-semibold mb-4">Select Students</h2>

      <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto border p-4 rounded">
        {students.map((student) => (
          <label
            key={student.docId}
            className="flex items-center gap-3 border p-3 rounded cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={selectedStudents.includes(student.studentUid)}
              onChange={() => toggleStudent(student.studentUid)}
            />

            <div>
              <p className="font-medium">
                {student.firstName} {student.lastName}
              </p>
              <p className="text-sm text-gray-500">{student.subCategory}</p>
            </div>
          </label>
        ))}
      </div>

      {/* BUTTON */}
      <button
        onClick={editingFamily ? handleUpdate : handleSubmit}
        disabled={loading}
        className="mt-6 bg-orange-500 text-white px-6 py-3 rounded hover:bg-orange-600"
      >
        {loading
          ? "Processing..."
          : editingFamily
            ? "Update Family"
            : "Create Family Login"}
      </button>

      {/* FAMILY LIST */}
      <h2 className="text-xl font-bold mt-10 mb-4">Created Families</h2>

      <div className="space-y-4">
        {families.map((fam) => (
          <div
            key={fam.id}
            className="border p-4 rounded-xl bg-white shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{fam.email}</p>
              <p className="text-sm text-gray-500">
                {fam.fatherName} / {fam.motherName}
              </p>
              <p className="text-sm">Students: {fam.students?.length || 0}</p>
            </div>

            <button
              onClick={() => handleEdit(fam)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreateFamilyPage;
