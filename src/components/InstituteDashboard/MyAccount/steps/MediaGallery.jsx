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
  // Add this above the return statement (inside MediaGallery component)

  // ================= REELS UPLOAD =================
  const [reelsUploading, setReelsUploading] = useState(false);
  const [reelsUploadMsg, setReelsUploadMsg] = useState("");

  const handleReelsUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setReelsUploading(true);
    setReelsUploadMsg("");

    try {
      const uploadedUrls = [];

      for (const file of files) {
       const url = await uploadToCloudinary(file, "video", "reels");// 👈 video type
        if (url) uploadedUrls.push(url);
      }

      if (uploadedUrls.length > 0) {
        // Save to Firestore in "reels" array (outside mediaGallery)
        const docRef = doc(db, "institutes", user.uid);
        const docSnap = await getDoc(docRef);

        const existingReels =
          docSnap.exists() && Array.isArray(docSnap.data().reels)
            ? docSnap.data().reels
            : [];

        await setDoc(
          docRef,
          {
            reels: [...existingReels, ...uploadedUrls],
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        setReelsUploadMsg(
          `✅ Uploaded ${uploadedUrls.length} reel(s) successfully!`,
        );
      }
    } catch (err) {
      console.error("Reels Upload Error:", err);
      alert("Failed to upload reels: " + err.message);
    } finally {
      setReelsUploading(false);
      setTimeout(() => setReelsUploadMsg(""), 4000);
      e.target.value = ""; // reset input
    }
  };
  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;

      try {
        const docRef = doc(db, "institutes", user.uid); // 🔥 dynamic institute
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data()?.mediaGallery) {
          const mg = docSnap.data().mediaGallery;

          setFormData({
            trainingImages: mg.trainingImages || [],
            facilityImages: mg.facilityImages || [],
            equipmentImages: mg.equipmentImages || [],
            uniformImages: mg.uniformImages || [],
          });
        }
      } catch (error) {
        console.error("Error loading:", error);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  /* ================= CLOUDINARY UPLOAD ================= */
  const uploadToCloudinary = async (file, type, fieldName) => {
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

  /* ================= FILE CHANGE ================= */
  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    if (!files.length) return;

    const selectedFiles = Array.from(files);

    for (const file of selectedFiles) {
      const url = await uploadToCloudinary(file, "image", name);// 👈 image type

      if (url) {
        setFormData((prev) => ({
          ...prev,
          [name]: [...(prev[name] || []), url],
        }));
      }
    }
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      setSaving(true);

      await setDoc(
        doc(db, "institutes", user.uid), // 🔥 dynamic institute
        {
          mediaGallery: {
            trainingImages: formData.trainingImages,
            facilityImages: formData.facilityImages,
            equipmentImages: formData.equipmentImages,
            uniformImages: formData.uniformImages,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      alert("Saved Successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving data");
    }

    setSaving(false);
  };

  /* ================= CANCEL ================= */
  const handleCancel = () => {
    setFormData({
      trainingImages: [],
      facilityImages: [],
      equipmentImages: [],
      uniformImages: [],
    });
  };

  if (loading) {
    return <p className="text-gray-500 p-6">Loading...</p>;
  }

  /* ================= UI (UNCHANGED) ================= */
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
          {[
            { label: "Training Images", name: "trainingImages" },
            { label: "Facility Images", name: "facilityImages" },
            { label: "Equipment Images", name: "equipmentImages" },
            { label: "Uniform Images", name: "uniformImages" },
          ].map((field) => (
            <div key={field.name} className="flex flex-col">
              <label className="text-sm font-medium mb-2">{field.label}</label>
              {uploadMsg[field.name] && (
  <p className="text-green-600 text-sm mt-1">
    {uploadMsg[field.name]}
  </p>
)}

              <label className="cursor-pointer">
                <input
                  type="file"
                  name={field.name}
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
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
            </div>
          ))}
        </div>
        {/* ================= REELS UPLOAD UI ================= */}
 <div className="flex flex-col mt-6">
  <label className="text-sm font-medium mb-2">
    Upload Reels (Videos)
  </label>

  <label className="cursor-pointer">
    <input
      type="file"
      accept="video/*"
      multiple
      onChange={handleReelsUpload}
      className="hidden"
    />

    <div className="border border-gray-300 rounded-md px-3 py-2 flex justify-between items-center hover:border-orange-500 transition">
      <span className="text-gray-500">
        Upload Reels
      </span>
      <img src="/upload.png" alt="upload" className="w-5 h-5" />
    </div>
  </label>

  {uploadMsg.reels && (
    <p className="text-green-600 text-sm mt-1">
      {uploadMsg.reels}
    </p>
  )}
</div>
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
            disabled={saving || uploading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition shadow-sm"
          >
            {saving ? "Saving..." : uploading ? "Uploading..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaGallery;
