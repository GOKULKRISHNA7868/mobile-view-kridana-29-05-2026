import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { User, ImageUp } from "lucide-react";

const MyAccount = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    name: "",
    emailOrPhone: "",
    phone: "",
    bio: "",
    profileImage: "",
    media: [],
  });

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [showUploadTypeModal, setShowUploadTypeModal] = useState(false);
  const [selectedUploadType, setSelectedUploadType] = useState("");
  const [pendingFile, setPendingFile] = useState(null);

  /* ---------------- FETCH EXISTING USER DATA ---------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;

      const ref = doc(db, "users", user.uid); // Use logged-in user's document
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          name: data.name || "",
          emailOrPhone: data.emailOrPhone || "",
          phone: data.phone || "",
          bio: data.bio || "",
          profileImage: data.profileImage || "",
          media: data.media || [],
        });
      }
    };

    fetchProfile();
  }, [user]);

  /* ---------------- HANDLE INPUT ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // ✅ Full Name → only alphabets + capitalize
    if (name === "name") {
      newValue = value
        .replace(/[^A-Za-z ]/g, "")
        .replace(/\b[a-z]/g, (c) => c.toUpperCase());
    }

    // ✅ Phone → only numbers + max 10 digits
    if (name === "phone") {
      newValue = value.replace(/[^0-9]/g, "").slice(0, 10);
    }

    setProfile((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  /* ---------------- SAVE PROFILE ---------------- */
  const handleSave = async () => {
    if (profile.phone && profile.phone.length !== 10) {
      alert("Phone number must be 10 digits");
      return;
    }

    const ref = doc(db, "users", user.uid);

    await setDoc(
      ref,
      {
        name: profile.name,
        emailOrPhone: profile.emailOrPhone,
        phone: profile.phone,
        bio: profile.bio,
        profileImage: profile.profileImage,
        media: profile.media || [],
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    alert("Profile saved ✅");
  };
  /* ---------------- CLOUDINARY UPLOAD FUNCTION ---------------- */
  const uploadToCloudinary = async (file, type) => {
    setUploading(true);
    setUploadMsg("");

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "kridana_upload");

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/daiyvial8/${type}/upload`,
        { method: "POST", body: data },
      );

      const result = await res.json();
      if (!result.secure_url) throw new Error("Upload failed");

      setUploadMsg("✅ Upload Successful!");
      return result.secure_url;
    } catch (err) {
      alert("Upload Failed");
      return "";
    } finally {
      setUploading(false);
      setTimeout(() => setUploadMsg(""), 3000);
    }
  };

  /* ---------------- PROFILE IMAGE UPLOAD ---------------- */
  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.uid) return;

    const url = await uploadToCloudinary(file, "image");
    if (!url) return;

    setProfile((prev) => ({ ...prev, profileImage: url }));

    // Update Firestore
    await updateDoc(doc(db, "users", user.uid), {
      profileImage: url,
      updatedAt: serverTimestamp(),
    });
  };

  /* ---------------- MEDIA UPLOAD ---------------- */
  const handleUpload = async () => {
    if (!pendingFile || !selectedUploadType || !user?.uid) return;

    const url = await uploadToCloudinary(pendingFile, selectedUploadType);
    if (!url) return;

    const updatedMedia = [...(profile.media || []), url];
    setProfile((prev) => ({ ...prev, media: updatedMedia }));

    // Update Firestore
    await updateDoc(doc(db, "users", user.uid), {
      media: updatedMedia,
      updatedAt: serverTimestamp(),
    });

    // Reset
    setPendingFile(null);
    setSelectedUploadType("");
    setShowUploadTypeModal(false);
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-6 bg-white min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black">
            My Account
          </h1>
          <p className="text-orange-500 text-sm">Manage your profile details</p>
        </div>

        <div className="flex flex-col items-center">
          <label className="cursor-pointer">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-300">
              {profile.profileImage && (
                <img
                  src={profile.profileImage}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <input type="file" hidden onChange={handleProfileUpload} />
          </label>
          <span className="text-xs mt-1 text-gray-600">Change Profile</span>
          {profile.profileImage && (
            <button
              onClick={async () => {
                setProfile((prev) => ({ ...prev, profileImage: "" }));

                await updateDoc(doc(db, "users", user.uid), {
                  profileImage: "",
                  updatedAt: serverTimestamp(),
                });
              }}
              className="text-red-500 text-xs hover:underline"
            >
              Remove Profile
            </button>
          )}
        </div>
      </div>

      <div className="w-full h-[1px] bg-orange-500 mb-6"></div>

      {/* EDIT PROFILE */}
      <div className="flex items-center gap-2 mb-4">
        <User className="text-orange-500" size={20} />
        <h2 className="text-orange-500 font-semibold text-lg">Edit Profile</h2>
      </div>

      <div className="bg-white border rounded-lg p-4 sm:p-6 shadow-sm">
        <h2 className="text-orange-500 font-semibold mb-4 text-sm">
          Profile Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email / Phone
            </label>
            <input
              type="text"
              name="email"
              value={profile.emailOrPhone}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              maxLength={10}
              inputMode="numeric"
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 h-24 resize-none focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <button
            onClick={handleSave}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* MEDIA GALLERY */}
      <div className="bg-white border rounded-lg p-4 sm:p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-orange-500 font-semibold">Media Gallery</h2>

          <label className="bg-orange-500 text-white px-4 py-2 rounded flex items-center gap-2 cursor-pointer">
            <ImageUp size={18} /> Upload Media
            <input
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;
                setPendingFile(file);
                setShowUploadTypeModal(true);
              }}
            />
          </label>
        </div>

        <div className="flex gap-4 flex-wrap">
          {profile.media.map((img, i) => (
            <img
              key={i}
              src={img}
              className="w-full sm:w-56 h-40 sm:h-32 object-cover rounded-md"
            />
          ))}
        </div>
      </div>

      {/* UPLOAD MODAL */}
      {showUploadTypeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[90%] sm:w-[360px] rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-center mb-4">
              Select Media Type
            </h3>

            <div className="grid grid-cols-1 gap-3 mb-5">
              <button
                onClick={() => setSelectedUploadType("image")}
                className="py-2 rounded border bg-orange-500 text-white"
              >
                Image
              </button>
            </div>

            {uploading && (
              <p className="text-center text-sm text-orange-500 mb-3 animate-pulse">
                Uploading...
              </p>
            )}

            {uploadMsg && (
              <p className="text-center text-sm text-green-600 mb-3">
                {uploadMsg}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadTypeModal(false)}
                className="flex-1 border rounded py-2"
              >
                Cancel
              </button>

              <button
                onClick={handleUpload}
                className="flex-1 bg-orange-500 text-white rounded py-2"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAccount;
