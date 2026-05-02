import React, { useEffect, useState } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";

const TrainingProgram = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    programName: "",
    ageGroup: "",
    skillLevel: "",
    batchTimings: "",
    duration: "",
    fees: "",
    seatsAvailable: "",
    trialSessions: "",
  });

  const [errors, setErrors] = useState({});

  // ================= LOAD DATA DYNAMICALLY =================
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "myactivity", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() || {};

          setFormData({
            programName: data.programName ?? "",
            ageGroup: data.ageGroup ?? "",
            skillLevel: data.skillLevel ?? "",
            batchTimings: data.batchTimings ?? "",
            duration: data.duration ?? "",
            fees: data.fees !== undefined ? String(data.fees) : "",
            seatsAvailable:
              data.seatsAvailable !== undefined
                ? String(data.seatsAvailable)
                : "",
            trialSessions: data.trialSessions ?? "",
          });
        }
      } catch (error) {
        console.error("❌ Error loading training program:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // ================= VALIDATION =================
  const validate = () => {
    let newErrors = {};

    Object.keys(formData).forEach((field) => {
      if (!formData[field] || String(formData[field]).trim() === "") {
        newErrors[field] = "This field is required";
      }
    });

    if (formData.fees && isNaN(formData.fees)) {
      newErrors.fees = "Fees must be a valid number";
    }

    if (formData.seatsAvailable && isNaN(formData.seatsAvailable)) {
      newErrors.seatsAvailable = "Seats must be a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= SAVE TO FIREBASE =================
  const handleSave = async () => {
    if (!user?.uid) {
      alert("User not logged in");
      return;
    }

    if (!validate()) {
      alert("Please fill all required details correctly.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        programName: formData.programName,
        ageGroup: formData.ageGroup,
        skillLevel: formData.skillLevel,
        batchTimings: formData.batchTimings,
        duration: formData.duration,
        fees: Number(formData.fees),
        seatsAvailable: Number(formData.seatsAvailable),
        trialSessions: formData.trialSessions,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "myactivity", user.uid), payload, {
        merge: true,
      });

      alert("✅ Training Program Saved Successfully!");
    } catch (error) {
      console.error("❌ Error saving training program:", error);
      alert("Error saving data");
    } finally {
      setSaving(false);
    }
  };

  // ================= CANCEL =================
  const handleCancel = () => {
    setFormData({
      programName: "",
      ageGroup: "",
      skillLevel: "",
      batchTimings: "",
      duration: "",
      fees: "",
      seatsAvailable: "",
      trialSessions: "",
    });

    setErrors({});
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  const inputClass = (field) =>
    `border ${
      errors[field] ? "border-red-500" : "border-gray-300"
    } rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500`;

  return (
    <div className="w-full">
      <h2 className="text-orange-500 font-semibold text-lg sm:text-xl mb-6">
        Training Programs Offered
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Program Name */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">
            Program Name <span className="text-red-500">*</span>
          </label>
          <input
            name="programName"
            value={formData.programName}
            onChange={handleChange}
            className={inputClass("programName")}
          />
          {errors.programName && (
            <span className="text-red-500 text-sm mt-1">
              {errors.programName}
            </span>
          )}
        </div>

        {/* Age Group */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">
            Age Group <span className="text-red-500">*</span>
          </label>
          <select
            name="ageGroup"
            value={formData.ageGroup}
            onChange={handleChange}
            className={inputClass("ageGroup")}
          >
            <option value="">Select Age Group</option>
            <option>01 – 10 years Kids</option>
            <option>11 – 20 years Teenage</option>
            <option>21 – 45 years Adults</option>
            <option>45 – 60 years Middle Age</option>
            <option>61 – 100 years Senior Citizens</option>
          </select>
          {errors.ageGroup && (
            <span className="text-red-500 text-sm mt-1">{errors.ageGroup}</span>
          )}
        </div>

        {/* Skill Level */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">
            Skill Level <span className="text-red-500">*</span>
          </label>
          <select
            name="skillLevel"
            value={formData.skillLevel}
            onChange={handleChange}
            className={inputClass("skillLevel")}
          >
            <option value="">Select Skill Level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          {errors.skillLevel && (
            <span className="text-red-500 text-sm mt-1">
              {errors.skillLevel}
            </span>
          )}
        </div>

        {/* Batch Timings */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">
            Batch Timings <span className="text-red-500">*</span>
          </label>
          <input
            name="batchTimings"
            value={formData.batchTimings}
            onChange={handleChange}
            className={inputClass("batchTimings")}
          />
          {errors.batchTimings && (
            <span className="text-red-500 text-sm mt-1">
              {errors.batchTimings}
            </span>
          )}
        </div>

        {/* Duration */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">
            Duration <span className="text-red-500">*</span>
          </label>
          <input
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className={inputClass("duration")}
          />
          {errors.duration && (
            <span className="text-red-500 text-sm mt-1">{errors.duration}</span>
          )}
        </div>

        {/* Fees */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">
            Fees <span className="text-red-500">*</span>
          </label>
          <input
            name="fees"
            value={formData.fees}
            onChange={handleChange}
            className={inputClass("fees")}
          />
          {errors.fees && (
            <span className="text-red-500 text-sm mt-1">{errors.fees}</span>
          )}
        </div>

        {/* Seats */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">
            Seats Available <span className="text-red-500">*</span>
          </label>
          <input
            name="seatsAvailable"
            value={formData.seatsAvailable}
            onChange={handleChange}
            className={inputClass("seatsAvailable")}
          />
          {errors.seatsAvailable && (
            <span className="text-red-500 text-sm mt-1">
              {errors.seatsAvailable}
            </span>
          )}
        </div>

        {/* Trial */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">
            Trial Sessions Available <span className="text-red-500">*</span>
          </label>
          <input
            name="trialSessions"
            value={formData.trialSessions}
            onChange={handleChange}
            className={inputClass("trialSessions")}
          />
          {errors.trialSessions && (
            <span className="text-red-500 text-sm mt-1">
              {errors.trialSessions}
            </span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
        <button
          type="button"
          onClick={handleCancel}
          className="text-gray-600 hover:text-black transition"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default TrainingProgram;
