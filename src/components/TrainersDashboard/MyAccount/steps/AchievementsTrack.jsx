import React, { useEffect, useState } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";

const AchievementsTrack = ({ setStep }) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const [formData, setFormData] = useState({
    achievements: {
      district: { gold: "", silver: "", bronze: "" },
      state: { gold: "", silver: "", bronze: "" },
      national: { gold: "", silver: "", bronze: "" },
    },
    awardsImages: [],
    mediaMentions: [],
  });

  // ================= LOAD DATA =================
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "trainers", user.uid); // 🔥 dynamic
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setFormData({
            achievements: {
              district: {
                gold: data?.achievements?.district?.gold ?? "",
                silver: data?.achievements?.district?.silver ?? "",
                bronze: data?.achievements?.district?.bronze ?? "",
              },
              state: {
                gold: data?.achievements?.state?.gold ?? "",
                silver: data?.achievements?.state?.silver ?? "",
                bronze: data?.achievements?.state?.bronze ?? "",
              },
              national: {
                gold: data?.achievements?.national?.gold ?? "",
                silver: data?.achievements?.national?.silver ?? "",
                bronze: data?.achievements?.national?.bronze ?? "",
              },
            },
            awardsImages: data?.awardsImages ?? [],
            mediaMentions: data?.mediaMentions ?? [],
          });
        }
      } catch (error) {
        console.error("Error loading achievements:", error);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // ================= HANDLE INPUT =================
  const handleChange = (category, medal, value) => {
    setFormData((prev) => ({
      ...prev,
      achievements: {
        ...prev.achievements,
        [category]: {
          ...prev.achievements[category],
          [medal]: value,
        },
      },
    }));
  };

  // ================= CLOUDINARY UPLOAD =================
  const uploadToCloudinary = async (file, type) => {
    setUploading(true);
    setUploadMsg("");

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "kridana_upload");

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/daiyvial8/${type}/upload`,
        {
          method: "POST",
          body: data,
        },
      );

      const result = await res.json();

      if (!result.secure_url) {
        throw new Error(result.error?.message || "Cloudinary upload failed");
      }

      setUploadMsg("✅ Upload Successful!");
      return result.secure_url;
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      alert("Upload Failed: " + err.message);
      return "";
    } finally {
      setUploading(false);
      setTimeout(() => setUploadMsg(""), 3000);
    }
  };

  // ================= FILE UPLOAD =================
  const handleFileUpload = async (e, field, type) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (formData[field].length + files.length > 3) {
      alert("Maximum 3 images allowed.");
      return;
    }

    for (const file of files) {
      const url = await uploadToCloudinary(file, type);

      if (url) {
        setFormData((p) => ({
          ...p,
          [field]: [...(p[field] || []), url],
        }));
      }
    }

    e.target.value = "";
  };

  // ================= REMOVE IMAGE =================
  const removeImage = (type, index) => {
    const updated = [...formData[type]];
    updated.splice(index, 1);

    setFormData((prev) => ({
      ...prev,
      [type]: updated,
    }));
  };

  // ================= SAVE =================
  const handleSave = async () => {
    if (!user?.uid) {
      alert("User not logged in");
      return;
    }

    try {
      setSaving(true);

      const docRef = doc(db, "trainers", user.uid);

      await setDoc(
        docRef,
        {
          achievements: formData.achievements,
          awardsImages: formData.awardsImages,
          mediaMentions: formData.mediaMentions,
          updatedAt: serverTimestamp(),
        },
        { merge: true }, // ✅ safe
      );

      alert("Saved Successfully!");
    } catch (error) {
      console.error("Save Error:", error);
      alert("Error saving data");
    } finally {
      setSaving(false);
    }
  };

  // ================= CANCEL =================
  const handleCancel = () => {
    setFormData({
      achievements: {
        district: { gold: "", silver: "", bronze: "" },
        state: { gold: "", silver: "", bronze: "" },
        national: { gold: "", silver: "", bronze: "" },
      },
      awardsImages: [],
      mediaMentions: [],
    });
  };

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;

  return (
    <div className="w-full">
      <div
        onClick={() => setStep(2)}
        className="cursor-pointer text-orange-600 mb-4"
      >
        ← Back
      </div>

      <h2 className="text-orange-500 font-semibold text-xl mb-6">
        Achievements & Track Record
      </h2>

      {/* TABLE */}
      <div className="overflow-x-auto mb-8">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100 text-orange-500">
              <th className="p-3 border">Category</th>
              <th className="p-3 border">Gold</th>
              <th className="p-3 border">Silver</th>
              <th className="p-3 border">Bronze</th>
            </tr>
          </thead>

          <tbody>
            {["district", "state", "national"].map((level) => (
              <tr key={level} className="text-center">
                <td className="p-3 border capitalize font-medium">{level}</td>

                {["gold", "silver", "bronze"].map((medal) => (
                  <td key={medal} className="p-3 border">
                    <input
                      type="number"
                      min="0"
                      value={formData.achievements?.[level]?.[medal] ?? ""}
                      onChange={(e) =>
                        handleChange(level, medal, e.target.value)
                      }
                      className="w-full border border-gray-300 rounded px-2 py-1"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= AWARDS & MEDIA ================= */}
      {["awardsImages", "mediaMentions"].map((type) => (
        <div key={type} className="mb-8">
          <label className="font-medium block mb-2 capitalize">
            {type === "awardsImages"
              ? "Awards Images Upload"
              : "Media Mentions Upload"}
          </label>

          <div className="flex items-center border rounded px-4 py-2 min-h-14">
            <div className="flex gap-2 flex-wrap flex-1">
              {formData[type].map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img}
                    alt="upload"
                    className="h-10 w-10 object-cover rounded"
                  />
                  <button
                    onClick={() => removeImage(type, index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {formData[type].length < 3 && (
              <label className="cursor-pointer">
                <img src="/upload.png" alt="upload" className="w-6 h-6" />
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, type, "image")}
                />
              </label>
            )}
          </div>

          {formData[type].length > 0 && (
            <p className="text-green-600 text-sm mt-2">
              {formData[type].length} image
              {formData[type].length > 1 ? "s" : ""} uploaded
            </p>
          )}
        </div>
      ))}

      {/* ================= BUTTONS ================= */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-black"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="bg-orange-500 text-white px-6 py-2 rounded"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {uploadMsg && <p className="text-green-600 text-sm mt-4">{uploadMsg}</p>}
    </div>
  );
};

export default AchievementsTrack;
