import React, { useState } from "react";
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

import { db, secondaryAuth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_PASSWORD = "123456";

const AddStudentDetailsPage = () => {
  const { user, institute } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    category: "",
    joinedDate: "",
    email: "",
    phone: "",
    studentFee: "", // ✅ NEW FIELD
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || institute?.role !== "institute") {
      alert("Unauthorized");
      return;
    }

    try {
      // 1️⃣ Create student AUTH account
      const studentCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        DEFAULT_PASSWORD
      );

      const studentUid = studentCredential.user.uid;

      // 2️⃣ Create Firestore document USING UID
      await setDoc(doc(db, "students", studentUid), {
        ...formData,
        uid: studentUid,
        role: "student",
        instituteId: user.uid,
        createdAt: serverTimestamp(),
      });

      // 3️⃣ Store STUDENT UID inside institute
      await updateDoc(doc(db, "institutes", user.uid), {
        students: arrayUnion(studentUid),
      });

      alert("Student created successfully (Password: 123456)");

      setFormData({
        firstName: "",
        lastName: "",
        category: "",
        joinedDate: "",
        email: "",
        phone: "",
        studentFee: "", // ✅ reset
      });
    } catch (error) {
      console.error("Student creation failed:", error);
      alert(error.message);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-[#4b301b]">
      <div className="w-full max-w-4xl bg-white text-black rounded-xl shadow-lg px-12 py-10 relative">
        <button
          type="button"
          className="absolute top-5 right-6 text-2xl text-gray-500 hover:text-gray-700"
        ></button>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold">
            Add Student Details
          </h1>
          <button className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            <span>➕</span>
            <span>Add</span>
          </button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                First Name
              </label>
              <input
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Last Name
              </label>
              <input
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
          </div>

          {/* Category & Joined Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Category
              </label>
              <input
                placeholder="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Joined Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.joinedDate}
                  onChange={(e) =>
                    setFormData({ ...formData, joinedDate: e.target.value })
                  }
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500 text-lg">
                  📅
                </span>
              </div>
            </div>
          </div>

          {/* Student Fee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Student Fee
              </label>
              <input
                type="number"
                placeholder="Student Fee"
                value={formData.studentFee}
                onChange={(e) =>
                  setFormData({ ...formData, studentFee: e.target.value })
                }
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">E-mail</label>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Phone number
              </label>
              <input
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              className="bg-orange-500 text-white px-16 py-3 rounded-md text-lg font-extrabold"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStudentDetailsPage;
