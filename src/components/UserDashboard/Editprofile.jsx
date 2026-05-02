// src/pages/InstituteProfileEditPage.jsx
import React, { useEffect, useState } from "react";
import { db, auth, storage } from "../../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion } from "framer-motion";

const CATEGORY_OPTIONS = {
  "Martial Arts": ["Karate", "Taekwondo", "Kung Fu", "Judo", "MMA"],
  Fitness: ["Gym", "Yoga", "Zumba", "CrossFit"],
  "Equestrian Sports": ["Horse Riding", "Dressage", "Show Jumping"],
  "Adventure & Outdoor Sports": ["Rock Climbing", "Trekking", "Camping"],
  "Team Ball Sports": ["Football", "Cricket", "Basketball", "Volleyball"],
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
  });

  const instituteId = auth.currentUser?.uid;

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
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 text-white"
    >
      {/* Heading */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-orange-400">
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
      <div>
        <h2 className="text-xl font-bold text-orange-300 mb-4">
          Categories & Subcategories
        </h2>

        {Object.entries(CATEGORY_OPTIONS).map(([cat, subs]) => (
          <div key={cat} className="mb-5">
            <p className="font-semibold text-orange-200">{cat}</p>
            <div className="flex flex-wrap gap-4 mt-2">
              {subs.map((s) => (
                <label
                  key={s}
                  className="flex items-center gap-2 text-sm bg-orange-900 px-3 py-1 rounded-lg"
                >
                  <input
                    type="checkbox"
                    className="accent-orange-500"
                    checked={form.categories?.[cat]?.includes(s) || false}
                    onChange={() => handleCategoryToggle(cat, s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
        ))}
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
    <label className="text-sm text-orange-200">{label}</label>
    <input
      {...props}
      className="bg-[#2f1d10] text-white border border-orange-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm text-orange-200">{label}</label>
    <textarea
      {...props}
      rows={4}
      className="bg-[#2f1d10] text-white border border-orange-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
    />
  </div>
);

export default InstituteProfileEditPage;
