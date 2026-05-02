// src/pages/InstituteProfileEditPage.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";

const CATEGORY_OPTIONS = {
  "Martial Arts": [
    "Karate",
    "Taekwondo",
    "Boxing",
    "Wrestling",
    "Fencing",
    "Kendo",
  ],
  Fitness: [
    "Strength / Muscular Fitness",
    "Muscular Endurance",
    "Flexibility Fitness",
    "Balance & Stability",
    "Skill / Performance Fitness",
  ],
  "Equestrian Sports": [
    "Dressage",
    "Show Jumping",
    "Eventing",
    "Cross Country",
    "Endurance Riding",
    "Polo",
    "Horse Racing",
    "Para-Equestrian",
  ],
  "Adventure & Outdoor Sports": [
    "Rock Climbing",
    "Trekking",
    "Camping",
    "Kayaking",
    "Paragliding",
    "Surfing",
    "Mountain Biking",
    "Ziplining",
  ],
  "Team Ball Sports": [
    "Football",
    "Hockey",
    "Basketball",
    "Handball",
    "Rugby",
    "American Football",
    "Water Polo",
    "Lacrosse",
  ],
  "Racket Sports": [
    "Tennis",
    "Badminton",
    "Pickleball",
    "Soft Tennis",
    "Padel Tennis",
    "Speedminton",
  ],
  "Target Precision Sports": [
    "Archery",
    "Shooting",
    "Darts",
    "Bowling",
    "Golf",
    "Billiards",
    "Bocce",
    "Lawn Bowls",
  ],
  "Ice Sports": [
    "Ice Skating",
    "Figure Skating",
    "Ice Hockey",
    "Speed Skating",
    "Short Track Skating",
    "Ice Dancing",
    "Curling",
    "Synchronized Skating",
  ],
  Dance: [
    "Classical Dance",
    "Contemporary Dance",
    "Hip-Hop Dance",
    "Folk Dance",
    "Western Dance",
    "Latin Dance",
    "Fitness Dance",
    "Creative & Kids Dance",
  ],
  Wellness: [
    "Physical Wellness",
    "Mental Wellness",
    "Social Wellness",
    "Emotional Wellness",
    "Spiritual Wellness",
    "Lifestyle Wellness",
  ],
  "Play School": [
    "Pre-Nursery",
    "Nursery",
    "LKG",
    "UKG",
    "Day Care",
    "Activity Based Learning",
  ],
};

const InstituteProfileEditPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    instituteName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    websiteLink: "",
    yearFounded: "",
    certification: "",
    description: "",
    aboutUs: "",
    facilities: "",
    achievements: "",
    openTime: "",
    closeTime: "",
    studentsCount: "",
    trainersCount: "",
    profit: "",
    categories: {},
    images: [],
    videos: [],
    reels: [],
  });

  const instituteId = auth.currentUser?.uid;
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!instituteId) return;
      const snap = await getDoc(doc(db, "institutes", instituteId));
      if (snap.exists()) {
        setForm((prev) => ({ ...prev, ...snap.data() }));
      }
      setLoading(false);
    };
    fetchData();
  }, [instituteId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleCategoryToggle = (cat, sub) => {
    setForm((p) => ({
      ...p,
      categories: {
        ...p.categories,
        [cat]: p.categories?.[cat]?.includes(sub)
          ? p.categories[cat].filter((s) => s !== sub)
          : [...(p.categories?.[cat] || []), sub],
      },
    }));
  };

  /* ✅ Upload file to Cloudinary using your API */
  /* ✅ Upload file to Cloudinary (Same as Trainer Working Code) */
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

  const handleFileUpload = async (e, field, type) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      const url = await uploadToCloudinary(file, type);

      if (url) {
        setForm((p) => ({
          ...p,
          [field]: [...(p[field] || []), url],
        }));
      }
    }
  };

  /* 🔹 Delete already uploaded media */
  const handleDeleteMedia = async (field, url) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    // Remove from UI + Firebase Data
    setForm((p) => ({
      ...p,
      [field]: p[field]?.filter((u) => u !== url) || [],
    }));

    alert("Deleted Successfully ✅");

    // ⚠️ Cloudinary real delete not possible here
  };
  const confirmAndDeleteMedia = async (field, index) => {
    const ok = window.confirm("Are you sure you want to delete this file?");
    if (!ok) return;

    const updatedList = form[field].filter((_, i) => i !== index);

    setForm((p) => ({
      ...p,
      [field]: updatedList,
    }));

    await updateDoc(doc(db, "institutes", instituteId), {
      [field]: updatedList,
      updatedAt: serverTimestamp(),
    });

    alert("Deleted Successfully ✅");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "institutes", instituteId), {
        ...form,
        updatedAt: serverTimestamp(),
      });
      alert("Profile updated successfully");
    } catch {
      alert("Error saving profile");
    }
    setSaving(false);
  };

  if (loading) return <div className="text-white text-lg p-10">Loading...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 text-[#5D3A09]"
    >
      {/* Heading */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-[#F97316]">
        Edit Institute Profile
      </h1>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Institute Name"
          name="instituteName"
          value={form.instituteName}
          onChange={handleChange}
        />
        <Input
          label="Website"
          name="websiteLink"
          value={form.websiteLink}
          onChange={handleChange}
        />
        <Input
          label="Year Founded"
          name="yearFounded"
          value={form.yearFounded}
          onChange={handleChange}
        />
        <Input
          label="Certification"
          name="certification"
          value={form.certification}
          onChange={handleChange}
        />
        <Input
          label="Address"
          name="address"
          value={form.address}
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
          label="Zip Code"
          name="zipCode"
          value={form.zipCode}
          onChange={handleChange}
        />
        <Input
          label="Open Time"
          type="time"
          name="openTime"
          value={form.openTime}
          onChange={handleChange}
        />
        <Input
          label="Close Time"
          type="time"
          name="closeTime"
          value={form.closeTime}
          onChange={handleChange}
        />
        <Input
          label="Students Count"
          name="studentsCount"
          value={form.studentsCount}
          onChange={handleChange}
        />
        <Input
          label="Trainers Count"
          name="trainersCount"
          value={form.trainersCount}
          onChange={handleChange}
        />
        <Input
          label="Profit"
          name="profit"
          value={form.profit}
          onChange={handleChange}
        />
      </div>

      {/* Textareas */}
      <Textarea
        label="Institute Description"
        name="description"
        value={form.description}
        onChange={handleChange}
      />
      <Textarea
        label="About Us"
        name="aboutUs"
        value={form.aboutUs}
        onChange={handleChange}
      />
      <Textarea
        label="Facilities"
        name="facilities"
        value={form.facilities}
        onChange={handleChange}
      />
      <Textarea
        label="Achievements"
        name="achievements"
        value={form.achievements}
        onChange={handleChange}
      />

      {/* Categories */}
      {/* ✅ CATEGORY DROPDOWN SECTION (same as Trainer UI) */}
<section className="bg-gray-100 p-6 rounded-2xl border border-gray-300 space-y-6">
  <h2 className="font-bold text-orange-500 text-lg">
    Select Categories & Sub Categories
  </h2>

  {/* Category Dropdown */}
  <select
    onChange={(e) => {
      const cat = e.target.value;
      if (!cat) return;

      setForm((prev) => ({
        ...prev,
        categories: {
          ...prev.categories,
          [cat]: [],
        },
      }));
    }}
    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2"
  >
    <option value="">-- Select Category --</option>
    {Object.keys(CATEGORY_OPTIONS).map((cat) => (
      <option key={cat} value={cat}>
        {cat}
      </option>
    ))}
  </select>

  {/* Selected Categories */}
  {Object.keys(form.categories || {}).map((cat) => (
    <div key={cat} className="bg-white p-4 rounded-xl border space-y-3">
      <h3 className="font-bold text-orange-600">{cat}</h3>

      {/* Subcategory dropdown */}
      <select
        onChange={(e) => {
          const sub = e.target.value;
          if (!sub) return;

          setForm((prev) => ({
            ...prev,
            categories: {
              ...prev.categories,
              [cat]: prev.categories[cat]?.includes(sub)
                ? prev.categories[cat]
                : [...(prev.categories[cat] || []), sub],
            },
          }));
        }}
        className="w-full border px-3 py-2 rounded-lg"
      >
        <option value="">-- Select Sub Category --</option>
        {CATEGORY_OPTIONS[cat].map((sub) => (
          <option key={sub} value={sub}>
            {sub}
          </option>
        ))}
      </select>

      {/* Pills */}
      <div className="flex flex-wrap gap-2 mt-3">
        {(form.categories[cat] || []).map((sub) => (
          <span
            key={sub}
            className="px-3 py-1 bg-orange-200 rounded-full text-sm flex items-center gap-2"
          >
            {sub}
            <button
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  categories: {
                    ...prev.categories,
                    [cat]: prev.categories[cat].filter((s) => s !== sub),
                  },
                }))
              }
              className="text-red-600 font-bold"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  ))}
</section>


      {/* Media Uploads */}
      <div>
        <h2 className="text-xl font-bold text-orange-500 mb-4">Manage Media</h2>

        {/* ✅ Upload Status */}
        {uploading && (
          <p className="text-orange-600 font-semibold mb-3">
            Uploading to Cloudinary... ⏳
          </p>
        )}

        {uploadMsg && (
          <p className="text-green-600 font-semibold mb-3">{uploadMsg}</p>
        )}

        {/* Images */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Images</label>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "images", "image")}
          />

          <div className="flex flex-wrap gap-2 mt-2">
            {form.images?.map((url, idx) => (
              <div key={idx} className="relative">
                <img
                  src={url}
                  alt="image"
                  className="w-24 h-24 object-cover rounded-md border"
                />

                <button
                  onClick={() => confirmAndDeleteMedia("images", idx)}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Videos */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Videos</label>

          <input
            type="file"
            multiple
            accept="video/*"
            onChange={(e) => handleFileUpload(e, "videos", "video")}
          />

          <div className="flex flex-wrap gap-2 mt-2">
            {form.videos?.map((url, idx) => (
              <div key={idx} className="relative">
                <video
                  src={url}
                  className="w-32 h-32 rounded-md border"
                  controls
                />

                <button
                  onClick={() => handleDeleteMedia("videos", url)}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Reels */}
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Reels</label>

          <input
            type="file"
            multiple
            accept="video/*"
            onChange={(e) => handleFileUpload(e, "reels", "video")}
          />

          <div className="flex flex-wrap gap-2 mt-2">
            {form.reels?.map((url, idx) => (
              <div key={idx} className="relative">
                <video
                  src={url}
                  className="w-32 h-32 rounded-md border"
                  controls
                />

                <button
                  onClick={() => handleDeleteMedia("reels", url)}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 font-semibold shadow-lg"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
};

const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-1">
    <label className="text-md  text-black">{label}</label>
    <input
      {...props}
      className="bg-gray-100 text-[#5D3A09] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="flex flex-col gap-1">
    <label className="text-md  text-black">{label}</label>
    <textarea
      {...props}
      rows={4}
      className="bg-gray-100 text-[#5D3A09] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
    />
  </div>
);

export default InstituteProfileEditPage;
