import React, { useEffect, useState } from "react";
import { ArrowLeft, Camera, Trash2, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

export default function EditProfile() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const [role, setRole] = useState(null);
  const [uid, setUid] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dob: "",
    city: "",
    state: "",
    country: "",
    instituteName: "",
    profileImageUrl: "",
    media: [],
  });

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
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
        throw new Error(result.error?.message || "Upload failed");
      }

      setUploadMsg("Upload Success");
      return result.secure_url;
    } catch (err) {
      console.error(err);
      alert("Upload Failed: " + err.message);
      return "";
    } finally {
      setUploading(false);
      setTimeout(() => setUploadMsg(""), 2000);
    }
  };

  const handleFileUpload = async (e, field, type) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      const url = await uploadToCloudinary(file, type);

      if (url) {
        setForm((prev) => ({
          ...prev,
          [field]: [...(prev[field] || []), url],
        }));
      }
    }
  };

  const removeMediaItem = (field, url) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((item) => item !== url),
    }));
  };

  // ================= FETCH USER / ROLE =================
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      setUid(user.uid);

      const paths = ["users", "trainers", "institutes"];

      for (let path of paths) {
        const ref = doc(db, path, user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

          setRole(data.role || path.slice(0, -1));

          setForm((prev) => ({
            ...prev,
            ...data,
          }));

          break;
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // ================= SAVE PROFILE =================
  const handleSave = async () => {
    if (!uid) return;

    setSaving(true);

    try {
      const collectionName =
        role === "trainer"
          ? "trainers"
          : role === "institute"
            ? "institutes"
            : "users";

      const ref = doc(db, collectionName, uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        await updateDoc(ref, {
          ...form,
          updatedAt: new Date(),
        });
      } else {
        await setDoc(ref, {
          ...form,
          role,
          createdAt: new Date(),
        });
      }

      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error updating profile");
    }

    setSaving(false);
  };

  // ================= PROFILE IMAGE UPDATE =================
  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = await uploadToCloudinary(file, "image");

    if (url) {
      setForm((p) => ({ ...p, profileImageUrl: url }));
    }
  };

  const removeProfileImage = () => {
    setForm((p) => ({ ...p, profileImageUrl: "" }));
  };

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5]">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F5] flex items-center justify-center px-4 md:px-8 py-10">
      <div className="w-full max-w-xl">
        {/* BACK */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[#FF6A00] font-semibold mb-6"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* PROFILE IMAGE */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img
              src={form.profileImageUrl || "https://via.placeholder.com/100"}
              className="w-28 h-28 rounded-full object-cover border-2 border-[#FF6A00]"
              alt="profile"
            />

            {/* upload */}
            <label className="absolute bottom-1 right-1 bg-white p-1 rounded-full shadow cursor-pointer">
              <Camera size={16} className="text-[#FF6A00]" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileImageChange}
              />
            </label>
          </div>

          <p className="text-gray-400 mt-2 text-sm">
            Upload your profile photo
          </p>

          {form.profileImageUrl && (
            <button
              onClick={removeProfileImage}
              className="text-red-500 text-sm flex items-center gap-1 mt-2"
            >
              <Trash2 size={14} />
              Remove
            </button>
          )}
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-300 mb-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-1/2 py-3 font-bold ${
              activeTab === "profile"
                ? "text-[#FF6A00] border-b-2 border-[#FF6A00]"
                : "text-black"
            }`}
          >
            Edit Profile
          </button>

          <button
            onClick={() => setActiveTab("media")}
            className={`w-1/2 py-3 font-bold ${
              activeTab === "media"
                ? "text-[#FF6A00] border-b-2 border-[#FF6A00]"
                : "text-black"
            }`}
          >
            Pictures / Videos
          </button>
        </div>

        {/* PROFILE FORM */}
        {activeTab === "profile" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
              />
              <Input
                label="Last Name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
              />
            </div>

            <Input
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
            <Input
              label="Phone Number"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
            />
            <Input
              label="DOB"
              name="dob"
              value={form.dob}
              onChange={handleChange}
            />
            <Input
              label="City"
              name="city"
              value={form.city}
              onChange={handleChange}
            />
            <Input
              label="State"
              name="state"
              value={form.state}
              onChange={handleChange}
            />
            <Input
              label="Country"
              name="country"
              value={form.country}
              onChange={handleChange}
            />
            <Input
              label="Institute Name"
              name="instituteName"
              value={form.instituteName}
              onChange={handleChange}
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#FF6A00] text-white font-bold py-3 rounded-md"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          /* MEDIA */
          <div className="space-y-5">
            {/* IMAGES */}
            <div className="bg-white border p-4 rounded-lg">
              <p className="font-semibold mb-2">Images</p>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "media", "image")}
              />

              <div className="grid grid-cols-3 gap-2 mt-3">
                {form.media?.map((url, i) => (
                  <div key={i} className="relative">
                    <img
                      src={url}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      onClick={() => removeMediaItem("media", url)}
                      className="absolute top-1 right-1 text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* VIDEOS */}
            <div className="bg-white border p-4 rounded-lg">
              <p className="font-semibold mb-2">Videos</p>

              <input
                type="file"
                multiple
                accept="video/*"
                onChange={(e) => handleFileUpload(e, "media", "video")}
              />
            </div>
          </div>
        )}

        {uploading && (
          <p className="text-center text-orange-500 mt-4">Uploading...</p>
        )}

        {uploadMsg && (
          <p className="text-center text-green-500 mt-2">{uploadMsg}</p>
        )}
      </div>
    </div>
  );
}

/* INPUT COMPONENT */
function Input({ label, name, value, onChange }) {
  return (
    <div>
      <label className="text-[#FF6A00] text-sm font-medium">{label}</label>
      <input
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full mt-1 border border-gray-300 rounded-md p-3"
      />
    </div>
  );
}
