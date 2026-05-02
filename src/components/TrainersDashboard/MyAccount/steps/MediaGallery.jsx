import React, { useEffect, useState } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";

const MediaGallery = ({ setStep }) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState({});

  const [formData, setFormData] = useState({
    trainingImages: [],
    facilityImages: [],
    equipmentImages: [],
    uniformImages: [],
  });

  const [reels, setReels] = useState([]); // separate top-level reels array

  // ================= LOAD DATA =================
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;

      try {
        const docRef = doc(db, "trainers", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setFormData({
            trainingImages: data.mediaGallery?.trainingImages || [],
            facilityImages: data.mediaGallery?.facilityImages || [],
            equipmentImages: data.mediaGallery?.equipmentImages || [],
            uniformImages: data.mediaGallery?.uniformImages || [],
          });

          setReels(data.reels || []); // load existing top-level reels
        }
      } catch (error) {
        console.error("Error loading media gallery:", error);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // ================= CLOUDINARY UPLOAD =================
  const uploadToCloudinary = async (file, type, fieldName) => {
    setUploading(true);
    setUploadMsg((prev) => ({
  ...prev,
  [fieldName]: ""
}));

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

      setUploadMsg((prev) => ({
  ...prev,
  [fieldName]: "✅ Upload Successful!",
}));
      return result.secure_url;
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      alert("Upload Failed: " + err.message);
      return "";
    } finally {
      setUploading(false);
      setTimeout(() => {
  setUploadMsg((prev) => ({
    ...prev,
    [fieldName]: "",
  }));
}, 3000);
    }
  };

  // ================= FILE UPLOAD HANDLER =================
  const handleFileUpload = async (e, field, type = "image") => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    for (const file of files) {
      const url = await uploadToCloudinary(file, type, field);

      if (url) {
        if (type === "video") {
          setReels((prev) => [...prev, url]); // push video URLs to top-level reels array
        } else {
          setFormData((prev) => ({
            ...prev,
            [field]: [...(prev[field] || []), url],
          }));
        }
      }
    }

    e.target.value = ""; // reset input
  };

  // ================= SAVE =================
  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      setSaving(true);

      await setDoc(
        doc(db, "trainers", user.uid),
        {
          mediaGallery: formData,
          reels: reels, // save top-level reels
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      alert("Saved Successfully!");
    } catch (error) {
      console.error("Error saving media gallery:", error);
      alert("Error saving data");
    } finally {
      setSaving(false);
    }
  };

  // ================= CANCEL =================
  const handleCancel = () => {
    setFormData({
      trainingImages: [],
      facilityImages: [],
      equipmentImages: [],
      uniformImages: [],
    });
    setReels([]);
  };

  if (loading) {
    return <p className="text-gray-500 p-6">Loading...</p>;
  }

  return (
    <div className="w-full">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6 sm:p-8">
        {/* BACK */}
        <div
          onClick={() => setStep(5)}
          className="flex items-center gap-2 text-orange-500 font-medium mb-4 cursor-pointer hover:text-orange-600 transition"
        >
          ← Back
        </div>

        <div className="border-b border-gray-300 mb-6"></div>

        <h2 className="text-orange-500 font-semibold text-lg sm:text-xl mb-6">
          Media & Gallery
        </h2>

        {/* SINGLE COLUMN LAYOUT */}
        <div className="grid grid-cols-1 gap-6">
          {/* IMAGE FIELDS */}
          {[
            { label: "Training Images", name: "trainingImages" },
            { label: "Facility Images", name: "facilityImages" },
            { label: "Equipment Images", name: "equipmentImages" },
            { label: "Uniform Images", name: "uniformImages" },
          ].map((field) => (
            <div key={field.name} className="flex flex-col">
              <label className="text-sm font-medium mb-2">{field.label}</label>

             <label className="cursor-pointer">
  <input
    type="file"
    name={field.name}
    accept="image/*"
    multiple
    onChange={(e) => handleFileUpload(e, field.name, "image")}
    className="hidden"
  />

  <div className="border border-gray-300 rounded-md px-3 py-2 flex justify-between items-center hover:border-orange-500 transition">
    <span className="text-gray-500">
      {formData[field.name]?.length > 0
        ? `${formData[field.name].length} image(s) uploaded`
        : "Upload Images"}
    </span>
    <img src="/upload.png" alt="upload" className="w-5 h-5" />
  </div>
</label>

{uploadMsg[field.name] && (
  <p className="text-green-600 text-sm mt-1">
    {uploadMsg[field.name]}
  </p>
)}
            </div>
          ))}

          {/* VIDEO / REELS FIELD */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">Reels / Videos</label>

            <label className="cursor-pointer">
              <input
                type="file"
                name="reels"
                accept="video/*"
                multiple
                onChange={(e) => handleFileUpload(e, "reels", "video")}
                className="hidden"
              />

              <div className="border border-gray-300 rounded-md px-3 py-2 flex justify-between items-center hover:border-orange-500 transition">
                <span className="text-gray-500">
                  {reels?.length > 0
                    ? `${reels.length} video(s) uploaded`
                    : "Upload Videos"}
                </span>
                <img src="/upload.png" alt="upload" className="w-5 h-5" />
              </div>
            </label>
            {uploadMsg.reels && (
  <div className="mt-1">
    <p className="text-green-600 text-sm">{uploadMsg.reels}</p>
  </div>
)}
          </div>
        </div>

        {uploading && (
          <p className="text-sm text-orange-500 mt-3">Uploading...</p>
        )}

        {/* BUTTONS */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={handleCancel}
            className="text-orange-500 font-medium hover:text-orange-600 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition shadow-sm"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaGallery;
