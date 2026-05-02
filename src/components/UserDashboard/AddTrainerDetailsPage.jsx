import React, { useState } from "react";
import {
  setDoc,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

import { db, secondaryAuth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

const DEFAULT_PASSWORD = "123456";

const AddTrainerDetailsPage = () => {
  const { user, institute } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    category: "",
    joinedDate: "",
    email: "",
    phone: "",
    certificates: "",
    monthlySalary: "",
    lpa: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || institute?.role !== "institute") {
      alert("Unauthorized access");
      return;
    }

    try {
      const trainerCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        DEFAULT_PASSWORD
      );

      const trainerUid = trainerCredential.user.uid;

      await setDoc(doc(db, "InstituteTrainers", trainerUid), {
        ...formData,
        trainerUid,
        instituteId: user.uid,
        role: "trainer",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "institutes", user.uid), {
        trainers: arrayUnion(trainerUid),
      });

      alert("Trainer added & login created (password: 123456)");

      setFormData({
        firstName: "",
        lastName: "",
        category: "",
        joinedDate: "",
        email: "",
        phone: "",
        certificates: "",
        monthlySalary: "",
        lpa: "",
      });
    } catch (error) {
      console.error("Trainer creation failed:", error);
      alert(error.message);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-[#4b301b]">
      <div className="w-full max-w-4xl bg-white text-black rounded-xl shadow-lg px-12 py-10 relative">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold">
            Add Trainer Details
          </h1>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="border px-3 py-2 rounded-md"
            />
            <input
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="border px-3 py-2 rounded-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              placeholder="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="border px-3 py-2 rounded-md"
            />
            <input
              type="date"
              value={formData.joinedDate}
              onChange={(e) =>
                setFormData({ ...formData, joinedDate: e.target.value })
              }
              className="border px-3 py-2 rounded-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="border px-3 py-2 rounded-md"
            />
            <input
              placeholder="Phone number"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="border px-3 py-2 rounded-md"
            />
          </div>

          {/* ✅ Salary Fields Added */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="number"
              placeholder="Monthly Salary"
              value={formData.monthlySalary}
              onChange={(e) =>
                setFormData({ ...formData, monthlySalary: e.target.value })
              }
              className="border px-3 py-2 rounded-md"
            />
            <input
              type="number"
              placeholder="LPA (Optional)"
              value={formData.lpa}
              onChange={(e) =>
                setFormData({ ...formData, lpa: e.target.value })
              }
              className="border px-3 py-2 rounded-md"
            />
          </div>

          <input
            placeholder="Certificates"
            value={formData.certificates}
            onChange={(e) =>
              setFormData({ ...formData, certificates: e.target.value })
            }
            className="border px-3 py-2 rounded-md w-full"
          />

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

export default AddTrainerDetailsPage;
