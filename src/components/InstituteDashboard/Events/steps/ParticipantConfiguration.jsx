import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";

// 🔥 Firestore save
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { ChevronDown } from "lucide-react";
const ParticipantConfiguration = ({ formData, setFormData }) => {
  const { user } = useAuth();
  const auth = getAuth();

  const [students, setStudents] = useState([]);
  const [otherCustomers, setOtherCustomers] = useState([
    { name: "", phone: "" },
  ]);
  const categoryRef = useRef(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const categories = [
    "Martial Arts",
    "Team Ball Sports",
    "Racket Sports",
    "Fitness",
    "Target & Precision Sports",
    "Equestrian Sports",
    "Adventure & Outdoor Sports",
    "Ice Sports",
    "Aquatic Sports",
    "Wellness",
    "Dance",
  ];
  const inputStyle =
    "w-full border border-orange-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none";

  const ageGroups = [
    "3 – 5 years",
    "6 – 8 years",
    "9 – 12 years",
    "13 – 15 years",
    "16 – 18 years",
    "18+ years",
  ];
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const uploadToCloudinary = async (file) => {
    setUploading(true);
    setUploadMsg("Uploading...");

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "kridana_upload");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/daiyvial8/auto/upload",
        {
          method: "POST",
          body: data,
        },
      );

      const result = await res.json();

      if (!result.secure_url) {
        throw new Error(result.error?.message || "Upload failed");
      }

      setUploadMsg("Upload successful ✅");
      return result.secure_url;
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      setUploadMsg("Upload failed ❌");
      return "";
    } finally {
      setUploading(false);
    }
  };
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      participants: {
        ...(prev.participants || {}),
        [field]: value,
      },
    }));
  };

  // =========================
  // Fetch institute students
  // =========================
  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.uid) return;

      const q = query(
        collection(db, "students"),
        where("instituteId", "==", user.uid),
      );

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setStudents(list);
    };

    fetchStudents();
  }, [user]);

  // =========================
  // Save other institute customers to formData
  // =========================
  useEffect(() => {
    handleChange("otherInstituteCustomers", otherCustomers);
  }, [otherCustomers]);

  // =========================
  // 🔥 Firestore Save Logic
  // =========================
  const saveParticipantConfiguration = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.error("Institute not logged in ❌");
        return;
      }

      const instituteId = currentUser.uid;

      const eventRef = doc(db, "events", instituteId);

      const participantData = {
        ageGroup: formData?.participants?.ageGroup || [],
        eligibility: formData?.participants?.eligibility || "",
        skillLevel: formData?.participants?.skillLevel || "",
        maxParticipants: formData?.participants?.maxParticipants || "",
        requiredDocument: formData?.participants?.requiredDocument || "",
        selectedInstituteCustomers:
          formData?.participants?.selectedCustomers || [],
        otherInstituteCustomers:
          formData?.participants?.otherInstituteCustomers || [],
        createdAt: new Date(),
      };

      await setDoc(
        eventRef,
        {
          participantConfiguration: arrayUnion(participantData),
        },
        { merge: true },
      );

      console.log("Participant Configuration saved ✅");
    } catch (error) {
      console.error("Error saving Participant Configuration ❌", error);
    }
  };
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className="w-full space-y-6">
      {/* ================= MAIN CARD ================= */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
        <h2 className="text-xl font-bold">Participant Configuration</h2>

        {/* Age Groups */}
        <div>
          <label className="block font-medium mb-3">
            Participant Age Group*
          </label>

          <div className="flex flex-wrap gap-3">
            <div className="flex flex-wrap gap-3">
              {ageGroups.map((age, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    const current = formData?.participants?.ageGroup || [];

                    if (current.includes(age)) {
                      handleChange(
                        "ageGroup",
                        current.filter((a) => a !== age),
                      );
                    } else {
                      handleChange("ageGroup", [...current, age]);
                    }
                  }}
                  className={`px-4 py-2 rounded-md border text-sm transition
        ${
          formData?.participants?.ageGroup?.includes(age)
            ? "bg-orange-500 text-white border-orange-500"
            : "border-orange-400 text-gray-700 hover:bg-orange-50"
        }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Eligibility + Skill */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-2">
              Eligibility Criteria*
            </label>
            <input
              type="text"
              className={inputStyle}
              value={formData?.participants?.eligibility || ""}
              onChange={(e) => handleChange("eligibility", e.target.value)}
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Skill Level*</label>
            <select
              className={inputStyle}
              value={formData?.participants?.skillLevel || ""}
              onChange={(e) => handleChange("skillLevel", e.target.value)}
            >
              <option value="">Select Skill Level</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Documents + Max Participants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-2">
              Upload Required Documents*
            </label>
            {formData?.participants?.requiredDocument && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Uploaded Document:</p>

                {/* IMAGE PREVIEW */}
                {formData.participants.requiredDocument.match(
                  /\.(jpeg|jpg|png)$/i,
                ) ? (
                  <img
                    src={formData.participants.requiredDocument}
                    alt="Uploaded"
                    className="w-32 h-32 object-contain border rounded-md"
                  />
                ) : (
                  /* FILE PREVIEW */
                  <a
                    href={formData.participants.requiredDocument}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                  >
                    View Uploaded File
                  </a>
                )}
              </div>
            )}
            <div className="border border-orange-300 rounded-lg p-2 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">
                  {uploading ? "Uploading..." : "Upload Documents"}
                </span>

                <input
                  type="file"
                  id="docs"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const url = await uploadToCloudinary(file);

                    if (url) {
                      handleChange("requiredDocument", url);
                    }
                  }}
                />

                <label
                  htmlFor="docs"
                  className="cursor-pointer text-orange-500"
                >
                  <img src="/upload.png" alt="Upload" className="w-5 h-5" />
                </label>
              </div>

              {/* 🔥 Upload Status */}
              {uploadMsg && (
                <p className="text-xs text-gray-600">{uploadMsg}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium mb-2">
              Maximum Participants*
            </label>
            <input
              type="number"
              placeholder="eg: 30"
              className={inputStyle}
              value={formData?.participants?.maxParticipants || ""}
              onChange={(e) => handleChange("maxParticipants", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ================= INSTITUTE CUSTOMERS ================= */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
        <h3 className="text-lg font-semibold leading-8 pr-4">
          Choose Customers From Your Institute
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-2">Select Customer’s*</label>

            {/* 🔥 MULTI SELECT */}
            <select
              multiple
              className={inputStyle}
              value={formData?.participants?.selectedCustomers || []}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value,
                );
                handleChange("selectedCustomers", selected);
              }}
            >
              {[...students]
                .sort((a, b) =>
                  `${a.firstName} ${a.lastName}`.localeCompare(
                    `${b.firstName} ${b.lastName}`,
                  ),
                )
                .map((student) => (
                  <option
                    key={student.id}
                    value={`${student.firstName} ${student.lastName}`}
                  >
                    {student.firstName} {student.lastName}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-2">Add Category*</label>

            <div ref={categoryRef} className="relative">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className={`${inputStyle} flex items-center justify-between text-left`}
              >
                <span>
                  {formData?.participants?.category
                    ? formData.participants.category
                    : "Select Category"}
                </span>

                <ChevronDown
                  size={18}
                  className={`ml-2 transition-transform ${
                    showCategoryDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showCategoryDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-md max-h-48 overflow-y-auto">
                  {categories.map((cat) => (
                    <div
                      key={cat}
                      onClick={() => {
                        handleChange("category", cat);
                        setShowCategoryDropdown(false);
                      }}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= OTHER INSTITUTE CUSTOMERS ================= */}
      <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
       <div className="flex justify-between items-start md:items-center gap-3">
          <h3 className="text-lg font-semibold">
            Choose Customers From Other Institutes
          </h3>

          <button
            type="button"
            onClick={() =>
              setOtherCustomers([...otherCustomers, { name: "", phone: "" }])
            }
           className="bg-orange-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-orange-600 transition shrink-0 self-start mt-1 md:mt-0"
          >
            + Add
          </button>
        </div>

        {otherCustomers.map((customer, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"
          >
            <div>
              <label className="block font-medium mb-2">
                Add Customer Name*
              </label>
              <input
                type="text"
                className={inputStyle}
                value={customer.name}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^A-Za-z ]/g, "");

                  // ✅ Capitalize each word
                  value = value.replace(/\b[a-z]/g, (char) =>
                    char.toUpperCase(),
                  );

                  const updated = [...otherCustomers];
                  updated[index].name = value;

                  setOtherCustomers(updated);
                }}
              />
            </div>

            <div>
              <label className="block font-medium mb-2">
                Add Contact Number*
              </label>
              <input
                type="tel"
                maxLength={10}
                className={inputStyle}
                value={customer.phone}
                onChange={(e) => {
                  const updated = [...otherCustomers];
                  updated[index].phone = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 10);
                  setOtherCustomers(updated);
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 🔥 Hidden save trigger (UI untouched) */}
      <div className="hidden">
        <button onClick={saveParticipantConfiguration}>Save</button>
      </div>
    </div>
  );
};

export default ParticipantConfiguration;
