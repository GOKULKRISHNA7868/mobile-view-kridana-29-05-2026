import React, { useEffect, useState } from "react";

import {
  ArrowLeft,
  Camera,
  Trash2,
  UploadCloud,
  User,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";

import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EditProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const [role, setRole] = useState("");
  const [collectionName, setCollectionName] = useState("");

  const [uid, setUid] = useState("");

  const [activeTab, setActiveTab] = useState("profile");

  const [form, setForm] = useState({
    // COMMON
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneNumber: "",
    profileImageUrl: "",

    // STUDENT
    gender: "",
    age: "",
    address: "",
    branch: "",
    category: "",
    subCategory: "",
    belt: "",
    sessions: "",
    timings: "",
    joiningDate: "",
    monthlyFee: "",
    monthlyDate: "",
    registernumber: "",
    registerNumber: "",
    skillLevel: "",
    dateOfBirth: "",

    // TRAINER
    designation: "",
    organization: "",
    yearsExperience: "",
    experience: "",
    dob: "",

    // INSTITUTE
    instituteName: "",
    founderName: "",
    organizationType: "",
    city: "",
    district: "",
    state: "",
    country: "",
    landmark: "",
    zipCode: "",
    description: "",
    websiteLink: "",
    yearFounded: "",

    // MEDIA
    certifications: [],
    trainingImages: [],
    reels: [],
  });

  // =========================================================
  // HANDLE CHANGE
  // =========================================================
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // =========================================================
  // FETCH USER
  // =========================================================
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) return;

        setUid(currentUser.uid);

        const collections = [
          "students",
          "trainerstudents",
          "institutes",
          "trainers",
          "users",
        ];

        for (const col of collections) {
          const ref = doc(db, col, currentUser.uid);

          const snap = await getDoc(ref);

          if (snap.exists()) {
            const data = snap.data();

            setCollectionName(col);

            setRole(data.role || col);

            setForm((prev) => ({
              ...prev,
              ...data,
            }));

            break;
          }
        }
      } catch (err) {
        console.log(err);
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  // =========================================================
  // CLOUDINARY
  // =========================================================
  const uploadToCloudinary = async (file, type) => {
    setUploading(true);

    const data = new FormData();

    data.append("file", file);
    data.append("upload_preset", "kirdana"); // same preset for all uploads

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/dr0svrhu1/${type}/upload`,
        {
          method: "POST",
          body: data,
        },
      );

      const result = await res.json();

      if (!result.secure_url) {
        throw new Error("Upload Failed");
      }

      setUploadMsg("Upload Success");

      return result.secure_url;
    } catch (err) {
      alert(err.message);
      return "";
    } finally {
      setUploading(false);

      setTimeout(() => {
        setUploadMsg("");
      }, 2000);
    }
  };

  // =========================================================
  // PROFILE IMAGE
  // =========================================================
  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const url = await uploadToCloudinary(file, "image");

    if (url) {
      setForm((prev) => ({
        ...prev,
        profileImageUrl: url,
      }));
    }
  };

  // =========================================================
  // MULTIPLE FILES
  // =========================================================
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

  // =========================================================
  // REMOVE MEDIA
  // =========================================================
  const removeMedia = (field, url) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((item) => item !== url),
    }));
  };

  // =========================================================
  // ROLE CHECKS
  // =========================================================
  const isStudent =
    collectionName === "students" || collectionName === "trainerstudents";

  const isTrainer = collectionName === "trainers";

  const isInstitute = collectionName === "institutes";

  // =========================================================
  // SAVE
  // =========================================================
  const handleSave = async () => {
    try {
      setSaving(true);

      const ref = doc(db, collectionName, uid);

      let updateData = {};

      // =====================================================
      // STUDENTS -> ONLY PERSONAL DETAILS
      // =====================================================
      if (isStudent) {
        updateData = {
          firstName: form.firstName || "",
          lastName: form.lastName || "",
          email: form.email || "",
          phone: form.phone || "",
          gender: form.gender || "",
          address: form.address || "",
          dateOfBirth: form.dateOfBirth || "",
          profileImageUrl: form.profileImageUrl || "",
          updatedAt: new Date(),
        };
      }

      // =====================================================
      // TRAINERS / INSTITUTES / USERS -> FULL EDIT
      // =====================================================
      else {
        updateData = {
          ...form,
          updatedAt: new Date(),
        };
      }

      await updateDoc(ref, updateData);

      alert("Profile Updated Successfully");
    } catch (err) {
      console.log(err);
      alert("Failed To Update");
    }

    setSaving(false);
  };

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center">
        <p className="text-gray-500">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F3] pb-32">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="sticky top-0 z-40 bg-white border-b px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>

        <div>
          <h1 className="font-bold text-lg">Edit Profile</h1>

          <p className="text-xs text-gray-500 capitalize">{collectionName}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-5">
        {/* =====================================================
            PROFILE CARD
        ===================================================== */}
        <div className="bg-white rounded-3xl shadow-sm p-5 mb-5">
          <div className="flex flex-col items-center">
            {/* IMAGE */}
            <div className="relative">
              <img
                src={
                  form.profileImageUrl ||
                  "https://ui-avatars.com/api/?name=User"
                }
                alt="profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-[#FF6A00]"
              />

              <label className="absolute bottom-1 right-1 bg-[#FF6A00] text-white p-2 rounded-full cursor-pointer">
                <Camera size={18} />

                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                />
              </label>
            </div>

            <h2 className="mt-4 text-xl font-bold">
              {form.firstName || form.instituteName || form.name}{" "}
              {form.lastName}
            </h2>

            <p className="text-sm text-gray-500 capitalize">{role}</p>
          </div>
        </div>

        {/* =====================================================
            TABS
        ===================================================== */}
        <div className="bg-white rounded-2xl shadow-sm p-2 flex mb-5">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 rounded-xl font-semibold transition ${
              activeTab === "profile"
                ? "bg-[#FF6A00] text-white"
                : "text-gray-700"
            }`}
          >
            Profile
          </button>

          {!isStudent && (
            <button
              onClick={() => setActiveTab("media")}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${
                activeTab === "media"
                  ? "bg-[#FF6A00] text-white"
                  : "text-gray-700"
              }`}
            >
              Media
            </button>
          )}
        </div>

        {/* =====================================================
            PROFILE TAB
        ===================================================== */}
        {activeTab === "profile" && (
          <div className="space-y-5">
            {/* =================================================
                STUDENT
            ================================================= */}
            {isStudent && (
              <Section title="Personal Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    icon={<User size={16} />}
                    label="First Name"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                  />

                  <Input
                    icon={<User size={16} />}
                    label="Last Name"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                  />

                  <Input
                    icon={<Mail size={16} />}
                    label="Email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />

                  <Input
                    icon={<Phone size={16} />}
                    label="Phone Number"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                  />

                  <Input
                    icon={<Calendar size={16} />}
                    label="Date Of Birth"
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                  />

                  <Input
                    label="Gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                  />
                </div>

                <div className="mt-4">
                  <TextArea
                    label="Address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>

                {/* =============================================
                    READ ONLY DETAILS
                ============================================= */}
                <div className="mt-8">
                  <h3 className="font-bold text-lg mb-4">Sports Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadOnlyInput label="Category" value={form.category} />

                    <ReadOnlyInput
                      label="Sport"
                      value={form.subCategory || form.sports?.[0]?.subCategory}
                    />

                    <ReadOnlyInput label="Belt" value={form.belt} />

                    <ReadOnlyInput label="Session" value={form.sessions} />

                    <ReadOnlyInput
                      label="Timing"
                      value={form.timings || form.sports?.[0]?.timings}
                    />

                    <ReadOnlyInput
                      label="Skill Level"
                      value={form.skillLevel}
                    />

                    <ReadOnlyInput
                      label="Monthly Fee"
                      value={`₹${form.monthlyFee || 0}`}
                    />

                    <ReadOnlyInput
                      label="Monthly Date"
                      value={form.monthlyDate}
                    />

                    <ReadOnlyInput
                      label="Joining Date"
                      value={form.joiningDate}
                    />

                    <ReadOnlyInput
                      label="Register Number"
                      value={form.registernumber || form.registerNumber}
                    />

                    <ReadOnlyInput label="Branch" value={form.branch} />
                  </div>

                  <div className="mt-5 bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-700">
                    Sports information and fee details can only be updated by
                    institute or trainer.
                  </div>
                </div>
              </Section>
            )}

            {/* =================================================
                TRAINER
            ================================================= */}
            {isTrainer && (
              <Section title="Trainer Details">
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
                    label="Designation"
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                  />

                  <Input
                    label="Organization"
                    name="organization"
                    value={form.organization}
                    onChange={handleChange}
                  />

                  <Input
                    label="Experience"
                    name="experience"
                    value={form.experience}
                    onChange={handleChange}
                  />

                  <Input
                    label="Years Experience"
                    name="yearsExperience"
                    value={form.yearsExperience}
                    onChange={handleChange}
                  />

                  <Input
                    label="Category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  />

                  <Input
                    label="Sub Category"
                    name="subCategory"
                    value={form.subCategory}
                    onChange={handleChange}
                  />

                  <Input
                    label="DOB"
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                  />
                </div>
              </Section>
            )}

            {/* =================================================
                INSTITUTE
            ================================================= */}
            {isInstitute && (
              <Section title="Institute Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Institute Name"
                    name="instituteName"
                    value={form.instituteName}
                    onChange={handleChange}
                  />

                  <Input
                    label="Founder Name"
                    name="founderName"
                    value={form.founderName}
                    onChange={handleChange}
                  />

                  <Input
                    label="Organization Type"
                    name="organizationType"
                    value={form.organizationType}
                    onChange={handleChange}
                  />

                  <Input
                    label="Year Founded"
                    name="yearFounded"
                    value={form.yearFounded}
                    onChange={handleChange}
                  />

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
                    label="City"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                  />

                  <Input
                    label="District"
                    name="district"
                    value={form.district}
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
                    label="Landmark"
                    name="landmark"
                    value={form.landmark}
                    onChange={handleChange}
                  />

                  <Input
                    label="Zip Code"
                    name="zipCode"
                    value={form.zipCode}
                    onChange={handleChange}
                  />

                  <Input
                    label="Website"
                    name="websiteLink"
                    value={form.websiteLink}
                    onChange={handleChange}
                  />
                </div>

                <div className="mt-4">
                  <TextArea
                    label="Description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>
              </Section>
            )}

            {/* =================================================
                USERS
            ================================================= */}
            {!isStudent && !isTrainer && !isInstitute && (
              <Section title="User Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                  />

                  <Input
                    label="Email / Phone"
                    name="emailOrPhone"
                    value={form.emailOrPhone}
                    onChange={handleChange}
                  />
                </div>
              </Section>
            )}

            {/* SAVE BUTTON */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#FF6A00] hover:bg-[#e65f00] text-white font-bold py-4 rounded-2xl transition"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {/* =====================================================
            MEDIA TAB
        ===================================================== */}
        {!isStudent && activeTab === "media" && (
          <div className="space-y-5">
            <MediaSection
              title="Certifications"
              field="certifications"
              data={form.certifications}
              type="image"
              handleFileUpload={handleFileUpload}
              removeMedia={removeMedia}
            />

            <MediaSection
              title="Training Images"
              field="trainingImages"
              data={form.trainingImages}
              type="image"
              handleFileUpload={handleFileUpload}
              removeMedia={removeMedia}
            />

            <MediaSection
              title="Videos / Reels"
              field="reels"
              data={form.reels}
              type="video"
              handleFileUpload={handleFileUpload}
              removeMedia={removeMedia}
            />
          </div>
        )}

        {/* UPLOAD STATUS */}
        {uploading && (
          <div className="fixed bottom-24 right-4 bg-black text-white px-4 py-2 rounded-xl">
            Uploading...
          </div>
        )}

        {uploadMsg && (
          <div className="fixed bottom-24 right-4 bg-green-600 text-white px-4 py-2 rounded-xl">
            {uploadMsg}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SECTION
========================================================= */
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-5">
      <h2 className="font-bold text-lg mb-5">{title}</h2>

      {children}
    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */
function Input({ label, name, value, onChange, type = "text", icon }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        {icon}
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-[#FF6A00]"
      />
    </div>
  );
}

/* =========================================================
   TEXTAREA
========================================================= */
function TextArea({ label, name, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700 mb-2 block">
        {label}
      </label>

      <textarea
        rows={4}
        name={name}
        value={value || ""}
        onChange={onChange}
        className="w-full border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-[#FF6A00]"
      />
    </div>
  );
}

/* =========================================================
   READ ONLY INPUT
========================================================= */
function ReadOnlyInput({ label, value }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700 mb-2 block">
        {label}
      </label>

      <div className="w-full border border-gray-200 bg-gray-100 rounded-2xl px-4 py-3 text-gray-600 text-sm">
        {value || "-"}
      </div>
    </div>
  );
}

/* =========================================================
   MEDIA SECTION
========================================================= */
function MediaSection({
  title,
  field,
  data,
  type,
  handleFileUpload,
  removeMedia,
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">{title}</h2>

        <label className="flex items-center gap-2 bg-[#FF6A00] text-white px-4 py-2 rounded-xl cursor-pointer">
          <UploadCloud size={16} />
          Upload
          <input
            type="file"
            className="hidden"
            multiple
            accept={type === "video" ? "video/*" : "image/*"}
            onChange={(e) => handleFileUpload(e, field, type)}
          />
        </label>
      </div>

      {data?.length === 0 ? (
        <div className="text-sm text-gray-400">No Files Uploaded</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data?.map((url, index) => (
            <div key={index} className="relative">
              {type === "video" ? (
                <video
                  src={typeof url === "string" ? url : url.url}
                  controls
                  className="w-full h-40 object-cover rounded-2xl"
                />
              ) : (
                <img
                  src={typeof url === "string" ? url : url.url}
                  alt=""
                  className="w-full h-40 object-cover rounded-2xl"
                />
              )}

              <button
                onClick={() => removeMedia(field, url)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
