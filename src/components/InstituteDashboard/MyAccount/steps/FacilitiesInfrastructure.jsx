import React, { useState, useEffect } from "react";
import { db } from "../../../../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../../../context/AuthContext"; // ✅ added

const FacilitiesInfrastructure = ({ setStep }) => {
  const { user } = useAuth(); // ✅ dynamic user

  const [facility, setFacility] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ================= LOAD DATA =================
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;

      try {
        // 🔥 dynamic institute doc
        const docRef = doc(db, "institutes", user.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          setFacility(snap.data()?.facilitiesInfrastructure ?? "");
        }
      } catch (error) {
        console.error("🔥 Load Error:", error);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // ================= SAVE =================
  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      setSaving(true);

      const docRef = doc(db, "institutes", user.uid); // 🔥 dynamic path

      await setDoc(
        docRef,
        {
          facilitiesInfrastructure: facility,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      alert("Saved Successfully ✅");
    } catch (error) {
      console.error("🔥 Save Error:", error);
      alert("Save Failed ❌");
    }

    setSaving(false);
  };

  // ================= CANCEL =================
  const handleCancel = () => {
    setFacility("");
  };

  if (loading) {
    return <p className="text-gray-500 p-6">Loading...</p>;
  }

  /* ================= UI (UNCHANGED) ================= */
  return (
    <div className="w-full">
      {/* BACK */}
      <div
        onClick={() => setStep(1)}
        className="flex items-center gap-2 text-orange-600 font-medium mb-4 cursor-pointer"
      >
        ← Back
      </div>
      <div className="border-b border-gray-300 mb-6"></div>
      <h2 className="text-xl font-semibold text-orange-600 mb-2">
        Facilities & Infrastructure
      </h2>

      <textarea
        placeholder="Add Facilities & Infrastructure Details"
        value={facility}
        onChange={(e) => {
          setFacility(e.target.value);
        }}
        className="w-full h-40 p-3 border border-gray-300 rounded-md
                   focus:outline-none focus:ring-1 focus:ring-orange-500
                   focus:border-orange-500 resize-none"
      />

      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
        <button
          type="button"
          onClick={handleCancel}
          className="text-orange-600 font-medium hover:text-orange-700 transition"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition shadow-sm"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default FacilitiesInfrastructure;
