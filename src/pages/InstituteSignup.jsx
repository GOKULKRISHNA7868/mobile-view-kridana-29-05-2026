// src/pages/InstituteSignup.js

import { useNavigate } from "react-router-dom";
import { Trash2, Edit2, Building2, ChevronDown } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import React, { useState, useRef } from "react";
import { ArrowLeft } from "lucide-react";

export default function InstituteSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1, 2, or 3
  const role = "institute";
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showFetchScreen, setShowFetchScreen] = useState(false);
  const [showCategory, setShowCategory] = useState(false);
  const [showSubCategory, setShowSubCategory] = useState(false);
  const certificateInputRef = useRef(null);
  const aadhaarInputRef = useRef(null);

  const inputClass =
    "h-12 px-4 border border-orange-300 rounded-xl bg-white outline-none focus:border-2 focus:border-orange-500 focus:ring-0 transition-all";

  // ✅ Agreement state (NEW)
  // ✅ Loading state (NEW)
  const [loading, setLoading] = useState(false);

  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    // Step 1
    instituteName: "",
    organizationType: "",
    founderName: "",
    designation: "",
    certifications: [],
    category: "",
    subCategory: "",
    yearFounded: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Step 2
    zipCode: "",
    city: "",
    state: "",
    building: "",
    street: "",
    landmark: "",
    district: "",
    country: "",
    latitude: "",
    longitude: "",
    locationFetched: false,
  });

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

  const subCategoryMap = {
    "Martial Arts": [
      "Karate",
      "Kung Fu",
      "Krav Maga",
      "Muay Thai",
      "Taekwondo",
      "Judo",
      "Brazilian Jiu-Jitsu",
      "Aikido",
      "Jeet Kune Do",
      "Capoeira",
      "Sambo",
      "Silat",
      "Kalaripayattu",
      "Hapkido",
      "Wing Chun",
      "Shaolin",
      "Ninjutsu",
      "Kickboxing",
      "Boxing",
      "Wrestling",
      "Shorinji Kempo",
      "Kyokushin",
      "Goju-ryu",
      "Shotokan",
      "Wushu",
      "Savate",
      "Lethwei",
      "Bajiquan",
      "Hung Gar",
      "Praying Mantis Kung Fu",
    ],
    "Team Ball Sports": [
      "Football / Soccer",
      "Basketball",
      "Handball",
      "Rugby",
      "Futsal",
      "Field Hockey",
      "Lacrosse",
      "Gaelic Football",
      "Volleyball",
      "Beach Volleyball",
      "Sepak Takraw",
      "Roundnet (Spikeball)",
      "Netball",
      "Cricket",
      "Baseball",
      "Softball",
      "Wheelchair Rugby",
      "Dodgeball",
      "Korfball",
    ],
    "Racket Sports": [
      "Tennis",
      "Table Tennis",
      "Badminton",
      "Squash",
      "Racquetball",
      "Padel",
      "Pickleball",
      "Platform Tennis",
      "Real Tennis",
      "Soft Tennis",
      "Frontenis",
      "Speedminton (Crossminton)",
      "Paddle Tennis (POP Tennis)",
      "Speed-ball",
      "Chaza",
      "Totem Tennis (Swingball)",
      "Matkot",
      "Jombola",
    ],
    Fitness: [
      "Gym Workout",
      "Weight Training",
      "Bodybuilding",
      "Powerlifting",
      "CrossFit",
      "Calisthenics",
      "Circuit Training",
      "HIIT",
      "Functional Training",
      "Core Training",
      "Mobility Training",
      "Stretching",
      "Resistance Band Training",
      "Kettlebell Training",
      "Boot Camp Training",
      "Spinning",
      "Step Fitness",
      "Pilates",
      "Yoga",
    ],
    "Target & Precision Sports": [
      "Archery",
      "Golf",
      "Bowling",
      "Darts",
      "Snooker",
      "Pool",
      "Billiards",
      "Target Shooting",
      "Clay Pigeon Shooting",
      "Air Rifle Shooting",
      "Air Pistol Shooting",
      "Croquet",
      "Petanque",
      "Bocce",
      "Lawn Bowls",
      "Carom Billiards",
      "Nine-Pin Bowling",
      "Disc Golf",
      "Kubb",
      "Pitch and Putt",
      "Shove Ha’penny",
      "Toad in the Hole",
      "Bat and Trap",
      "Boccia",
      "Gateball",
    ],
    "Equestrian Sports": [
      "Horse Racing",
      "Barrel Racing",
      "Rodeo",
      "Mounted Archery",
      "Tent Pegging",
    ],
    "Adventure & Outdoor Sports": [
      "Rock Climbing",
      "Mountaineering",
      "Trekking",
      "Hiking",
      "Mountain Biking",
      "Sandboarding",
      "Orienteering",
      "Obstacle Course Racing",
      "Skydiving",
      "Paragliding",
      "Hang Gliding",
      "Parachuting",
      "Hot-air Ballooning",
      "Skiing",
      "Snowboarding",
      "Ice Climbing",
      "Heli-skiing",
      "Bungee Jumping",
      "BASE Jumping",
      "Canyoning",
      "Kite Buggy",
      "Zorbing",
      "Zip Lining",
    ],
    "Aquatic Sports": [
      "Swimming",
      "Water Polo",
      "Surfing",
      "Scuba Diving",
      "Snorkeling",
      "Freediving",
      "Kayaking",
      "Canoeing",
      "Rowing",
      "Sailing",
      "Windsurfing",
      "Kite Surfing",
      "Jet Skiing",
      "Wakeboarding",
      "Water Skiing",
      "Stand-up Paddleboarding",
      "Whitewater Rafting",
      "Dragon Boat Racing",
      "Artistic Swimming",
      "Open Water Swimming",
    ],
    "Ice Sports": [
      "Ice Skating",
      "Figure Skating",
      "Ice Hockey",
      "Speed Skating",
      "Ice Dance",
      "Synchronized Skating",
      "Curling",
      "Broomball",
      "Bobsleigh",
      "Skiboarding",
      "Ice Dragon Boat Racing",
      "Ice Cross Downhill",
    ],
    Wellness: [
      "Yoga & Meditation",
      "Spa & Relaxation",
      "Mental Wellness",
      "Fitness",
      "Nutrition",
      "Traditional & Alternative Therapies",
      "Rehabilitation",
      "Lifestyle Coaching",
    ],
    Dance: [
      "Bharatanatyam",
      "Kathak",
      "Kathakali",
      "Kuchipudi",
      "Odissi",
      "Mohiniyattam",
      "Manipuri",
      "Sattriya",
      "Chhau",
      "Yakshagana",
      "Lavani",
      "Ghoomar",
      "Kalbelia",
      "Garba",
      "Dandiya Raas",
      "Bhangra",
      "Bihu",
      "Dollu Kunitha",
      "Theyyam",
      "Ballet",
      "Contemporary",
      "Hip Hop",
      "Breakdance",
      "Jazz Dance",
      "Tap Dance",
      "Modern Dance",
      "Street Dance",
      "House Dance",
      "Locking",
      "Popping",
      "Krumping",
      "Waacking",
      "Voguing",
      "Salsa",
      "Bachata",
      "Merengue",
      "Cha-Cha",
      "Rumba",
      "Samba",
      "Paso Doble",
      "Jive",
      "Tango",
      "Waltz",
      "Foxtrot",
      "Quickstep",
      "Flamenco",
      "Irish Stepdance",
      "Scottish Highland Dance",
      "Morris Dance",
      "Hula",
      "Maori Haka",
      "African Tribal Dance",
      "Zumba",
      "K-Pop Dance",
      "Shuffle Dance",
      "Electro Dance",
      "Pole Dance",
      "Ballroom Dance",
      "Line Dance",
      "Square Dance",
      "Folk Dance",
      "Contra Dance",
    ],
  };
  const handleCertificateChange = (e) => {
    const newFiles = Array.from(e.target.files);

    setFormData((prev) => {
      const combined = [...prev.certifications, ...newFiles];

      if (combined.length > 3) {
        alert("Maximum 3 certifications allowed");
        return prev;
      }

      return {
        ...prev,
        certifications: combined,
      };
    });

    e.target.value = null; // allow re-select same file
  };

  const handleAadhaarChange = (e) => {
    const newFiles = Array.from(e.target.files);

    setFormData((prev) => {
      const combined = [...prev.aadhaarFiles, ...newFiles];

      if (combined.length > 2) {
        alert("You can upload only up to 2 Aadhaar images");
        return prev; // ❌ don't update
      }

      return {
        ...prev,
        aadhaarFiles: combined, // ✅ append properly
      };
    });

    e.target.value = null;
  };

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;

    setFormData((prev) => ({
      ...prev,
      category: selectedCategory,
      subCategory: "", // reset when category changes
    }));
  };
  const handleSubCategoryChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      subCategory: e.target.value,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ✅ Only letters & space
    if (
      name === "founderName" ||
      name === "instituteName" ||
      name === "designation" ||
      name === "district" ||
      name === "state" ||
      name === "country" ||
      name === "city" ||
      name === "street"
    ) {
      let updatedValue = value.replace(/[^A-Za-z\s]/g, "");

      // ✅ Capitalize each word
      updatedValue = updatedValue.replace(/\b[a-z]/g, (char) =>
        char.toUpperCase(),
      );

      setFormData((prev) => ({
        ...prev,
        [name]: updatedValue,
      }));

      return;
    }

    // ✅ Phone - Only numbers (max 10)
    if (name === "phoneNumber") {
      const onlyNumbers = value.replace(/[^0-9]/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        phoneNumber: onlyNumbers,
      }));
      return;
    }

    // ✅ Year Founded - Only 4 digits
    if (name === "yearFounded") {
      const onlyYear = value.replace(/[^0-9]/g, "").slice(0, 4);
      setFormData((prev) => ({
        ...prev,
        yearFounded: onlyYear,
      }));
      return;
    }

    // Default
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      locationFetched: false,
    }));
  };
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target.result);
      };
      reader.readAsDataURL(file);
      setProfileImageFile(file);
    }
  };

  // Validation for each step
  const validateStep = () => {
    let newErrors = {};

    if (step === 1) {
      if (!profileImageFile) {
        alert("Please upload Institute logo");
        return false;
      }
      if (!formData.instituteName)
        newErrors.instituteName = "Institute name is required";

      if (!formData.founderName)
        newErrors.founderName = "Founder name is required";

      if (!formData.designation)
        newErrors.designation = "Designation is required";

      if (!formData.yearFounded)
        newErrors.yearFounded = "Year founded is required";

      if (!formData.category) newErrors.category = "Category is required";

      if (!formData.subCategory)
        newErrors.subCategory = "Sub category is required";

      if (!formData.phoneNumber)
        newErrors.phoneNumber = "Phone number is required";

      if (!formData.email) newErrors.email = "Email is required";
      // Password required
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else {
        // Minimum 8 characters
        if (formData.password.length < 8) {
          newErrors.password = "Password must be at least 8 characters";
        } else {
          // Strong password check
          const strongPasswordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

          if (!strongPasswordRegex.test(formData.password)) {
            newErrors.password =
              "Must include uppercase, lowercase, number & special character";
          }
        }
      }

      // Confirm password
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Confirm password is required";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      if (!formData.certifications.length)
        newErrors.certifications = "Upload at least one certification";
    }

    if (step === 2) {
      // ✅ If location is fetched → allow save
      if (formData.locationFetched) return true;

      // ❌ Otherwise validate manual entry
      if (!formData.building) newErrors.building = "Building is required";
      if (!formData.street) newErrors.street = "Street is required";
      if (!formData.city) newErrors.city = "City is required";
      if (!formData.district) newErrors.district = "District is required";
      if (!formData.state) newErrors.state = "State is required";
      if (!formData.country) newErrors.country = "Country is required";
      if (!formData.zipCode) newErrors.zipCode = "Zip code is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    // require agreement before leaving step 1
    if (step === 1 && !agreed) {
      alert("Please agree to policies to continue");
      return;
    }

    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };
  // ✅ Upload Profile Image to Cloudinary
  const uploadProfileToCloudinary = async (file) => {
    const formData = new FormData();

    formData.append("file", file);

    // ✅ Your Unsigned Preset
    formData.append("upload_preset", "kridana_upload");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/daiyvial8/image/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();

      if (!data.secure_url) {
        throw new Error("Cloudinary upload failed");
      }

      return data.secure_url;
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      alert("Image upload failed!");
      return "";
    }
  };
  const uploadCertificatesToCloudinary = async (files) => {
    const urls = [];

    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", "kridana_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/daiyvial8/image/upload",
        {
          method: "POST",
          body: fd,
        },
      );

      const data = await res.json();
      urls.push(data.secure_url);
    }

    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    if (!agreed) {
      alert("Please agree to Kridhana policies to continue");
      return;
    }

    // ✅ Start loading
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      const uid = userCredential.user.uid;

      let profileImageUrl = "";

      if (profileImageFile) {
        profileImageUrl = await uploadProfileToCloudinary(profileImageFile);
      }
      let certificateUrls = [];

      if (formData.certifications?.length) {
        certificateUrls = await uploadCertificatesToCloudinary(
          formData.certifications,
        );
      }

      await setDoc(doc(db, "institutes", uid), {
        role: "institute",
        status: "pending",

        // Step 1
        instituteName: formData.instituteName,
        organizationType: formData.organizationType,
        founderName: formData.founderName,
        designation: formData.designation,
        yearFounded: formData.yearFounded,
        category: formData.category,
        subCategory: formData.subCategory,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        certifications: certificateUrls,

        // Step 2
        building: formData.building,
        street: formData.street,
        landmark: formData.landmark || "",
        city: formData.city,
        district: formData.district,
        state: formData.state,
        country: formData.country,
        zipCode: formData.zipCode,

        // Step 3
        bankDetails: formData.bankDetails || "",
        upiDetails: formData.upiDetails || "",

        // Profile Image
        profileImageUrl,

        // Agreements
        agreements: {
          termsAndConditions: true,
          privacyPolicy: true,
          paymentPolicy: true,
          merchantPolicy: true,
          agreedAt: serverTimestamp(),
        },

        createdAt: serverTimestamp(),
      });

      alert("Institute registered successfully!");
      navigate("/login?role=institute");
    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please login instead.");
        navigate("/login?role=institute");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email address.");
      } else if (error.code === "auth/weak-password") {
        alert("Password should be at least 6 characters.");
      } else {
        alert("Something went wrong: " + error.message);
      }
    } finally {
      // ✅ Stop loading (always)
      setLoading(false);
    }
  };

  // Progress bar width
  const progressPercentage = (step / 2) * 100;

  const handleFetchLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setFetchingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          );

          const data = await response.json();
          const address = data.address || {};

          setFormData((prev) => ({
            ...prev,
            building: address.house_number || "",
            street: address.road || "",
            landmark: address.suburb || "",

            city: address.village || address.town || address.city || "",
            district: address.state_district || "",
            state: address.state || "",
            country: address.country || "",
            zipCode: address.postcode || "",

            latitude: latitude.toString(),
            longitude: longitude.toString(),

            locationFetched: true,
          }));

          // ❌ DO NOT move step automatically
          // setStep(3)  ← removed
        } catch {
          alert("Failed to fetch location");
        }

        setFetchingLocation(false);
      },
      () => {
        alert("Permission denied");
        setFetchingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      },
    );
  };

  return (
    <div className="min-h-screen flex justify-center bg-white py-10">
      <div className="w-full max-w-6xl px-4 sm:px-6 md:px-8 lg:px-0 rounded-md mt-4 mb-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#FF6A00] font-semibold mb-6"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        {/* Header */}
        {/* HEADER WITH PROFILE + TITLE + PROGRESS */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          {/* LEFT : Upload Logo Circle */}
          <div className="flex flex-col items-center mt-6">
            <div
              onClick={() => document.getElementById("logoUpload").click()}
              className="w-24 h-24 rounded-full bg-orange-200 flex items-center justify-center cursor-pointer overflow-hidden"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-10 h-10 text-orange-600" />
              )}
            </div>

            <span className="text-sm text-orange-500 font-medium mt-2">
              Upload Logo
            </span>

            <input
              id="logoUpload"
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="hidden"
            />
          </div>

          {/* CENTER : Title + Step + Bars */}
          <div className="flex-1 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-orange-500">
              Institute’s Registration
            </h2>

            <p className="text-md mt-6">Step {step} to 2</p>

            <div className="flex gap-4 mt-4 w-full max-w-[580px]">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-3 flex-1 rounded-full ${
                    step >= s ? "bg-orange-500" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <div />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-fade-in space-y-6">
              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 md:gap-x-12 gap-y-6 mb-2">
                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    Institute Name*
                  </label>
                  <input
                    type="text"
                    name="instituteName"
                    value={formData.instituteName}
                    onChange={handleChange}
                    className={inputClass}
                  />
                  {errors.instituteName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.instituteName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    Founder Name*
                  </label>
                  <input
                    type="text"
                    name="founderName"
                    value={formData.founderName}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                  {errors.founderName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.founderName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    Designation*
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                  {errors.designation && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.designation}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    Year Founded*
                  </label>

                  <input
                    type="text"
                    name="yearFounded"
                    placeholder="Enter 4-digit year"
                    maxLength={4}
                    value={formData.yearFounded}
                    onChange={handleChange}
                    className={inputClass}
                  />

                  {errors.yearFounded && (
                    <p className="text-red-500 text-xs mt-2">
                      {errors.yearFounded}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2 flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    Certifications & Licence*
                  </label>

                  <div className="relative w-full">
                    <input
                      readOnly
                      value={
                        formData.certifications.length
                          ? `${formData.certifications.length} file(s) selected`
                          : ""
                      }
                      placeholder="Upload certification or licence images"
                      className={`${inputClass} w-full pr-12`}
                    />

                    {/* icon INSIDE box */}
                    <button
                      type="button"
                      onClick={() => certificateInputRef.current.click()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-transparent"
                    >
                      <img src="/upload.png" alt="upload" className="w-5 h-5" />
                    </button>

                    <input
                      id="certUpload"
                      type="file"
                      ref={certificateInputRef}
                      multiple
                      accept="image/*"
                      onChange={handleCertificateChange}
                      className="hidden"
                    />
                    {errors.certifications && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.certifications}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    Upload certification or licence images (1–3 only)
                  </p>
                </div>

                {/* Category + Sub Category – SAME ROW */}
                <div className="flex flex-col relative">
                  <label className="text-sm font-semibold mb-2">
                    Category*
                  </label>

                  <div
                    onClick={() => setShowCategory(!showCategory)}
                    className={`h-12 px-4 flex items-center justify-between rounded-xl border cursor-pointer bg-white
    ${showCategory ? "border-2 border-orange-500" : "border-orange-300"}
  `}
                  >
                    <span
                      className={
                        formData.category ? "text-black" : "text-gray-400"
                      }
                    >
                      {formData.category || "Select Category"}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${showCategory ? "rotate-180" : ""}`}
                    />
                  </div>

                  {showCategory && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg max-h-60 overflow-y-auto z-50 border border-gray-200">
                      {categories.map((cat) => (
                        <div
                          key={cat}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              category: cat,
                              subCategory: "",
                            }));
                            setShowCategory(false);
                          }}
                          className="px-4 py-3 hover:bg-blue-100 cursor-pointer"
                        >
                          {cat}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* ✅ ERROR OUTSIDE relative */}
                  {errors.category && (
                    <p className="text-red-500 text-xs mt-2">
                      {errors.category}
                    </p>
                  )}
                </div>
                <div className="flex flex-col relative">
                  <label className="text-sm font-semibold mb-2">
                    Sub Category*
                  </label>

                  <div
                    onClick={() => {
                      if (formData.category) {
                        setShowSubCategory(!showSubCategory);
                      }
                    }}
                    className={`h-12 px-4 flex items-center justify-between rounded-xl border cursor-pointer bg-white
      ${showSubCategory ? "border-2 border-orange-500" : "border-orange-300"}
      ${!formData.category ? "opacity-50 cursor-not-allowed" : ""}
    `}
                  >
                    <span
                      className={
                        formData.subCategory ? "text-black" : "text-gray-400"
                      }
                    >
                      {formData.subCategory || "Select Sub Category"}
                    </span>

                    <ChevronDown
                      size={18}
                      className={`transition-transform ${showSubCategory ? "rotate-180" : ""}`}
                    />
                  </div>

                  {showSubCategory && formData.category && (
                    <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg max-h-60 overflow-y-auto z-50 border border-gray-200">
                      {subCategoryMap[formData.category]?.map((sub) => (
                        <div
                          key={sub}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              subCategory: sub,
                            }));
                            setShowSubCategory(false);
                          }}
                          className="px-4 py-3 hover:bg-blue-100 cursor-pointer"
                        >
                          {sub}
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.subCategory && (
                    <p className="text-red-500 text-xs mt-2">
                      {errors.subCategory}
                    </p>
                  )}
                </div>
                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    Phone Number*
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>
                {/* Password */}
                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    Create Password*
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    Re-Enter Password*
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 2 FETCH PAGE (FULL PAGE NOT MODAL) ===== */}
          {step === 2 && showFetchScreen && (
            <div className="animate-fade-in space-y-8">
              {/* Inputs layout EXACT like your image */}
              <div className="space-y-6">
                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    Location Name*
                  </label>
                  <input
                    type="text"
                    value={`${formData.building} ${formData.street} ${formData.city}`}
                    readOnly
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold mb-2">
                      Latitude*
                    </label>
                    <input
                      type="text"
                      value={formData.latitude || ""}
                      readOnly
                      className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold mb-2">
                      Longitude*
                    </label>
                    <input
                      type="text"
                      value={formData.longitude || ""}
                      readOnly
                      className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-8">
                <button
                  type="button"
                  onClick={() => setShowFetchScreen(false)}
                  className="text-orange-500 font-semibold text-lg"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleFetchLocation}
                  className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600"
                >
                  {fetchingLocation ? "Fetching..." : "Fetch Location"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && !showFetchScreen && (
            <div className="animate-fade-in space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Add Address</h3>

                <button
                  type="button"
                  onClick={() => setShowFetchScreen(true)}
                  className="bg-orange-500 text-orange px-4 py-2 rounded-lg text-sm hover:bg-orange-600"
                >
                  {fetchingLocation ? "Fetching..." : "Fetch Current Location"}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    Building / Flat / Door Number *
                  </label>
                  <input
                    type="text"
                    name="building"
                    value={formData.building}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                  {errors.building && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.building}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    Street / Area / Locality *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                  {errors.street && (
                    <p className="text-red-500 text-xs mt-1">{errors.street}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    Landmark (optional)
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    City / Town *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    District *
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                  {errors.district && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.district}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                  {errors.country && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.country}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold mb-2">
                    PIN / ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className={`${inputClass} ${errors.instituteName ? "border-red-500" : ""}`}
                  />
                  {errors.zipCode && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.zipCode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ✅ AGREEMENT SECTION */}
          <div className="flex items-start gap-2 text-sm text-gray-700 mt-4">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1"
            />
            <p>
              I agree to the{" "}
              <span
                onClick={() => navigate("/terms")}
                className="text-blue-600 underline cursor-pointer"
              >
                Terms & Conditions
              </span>
              ,{" "}
              <span
                onClick={() => navigate("/privacy")}
                className="text-blue-600 underline cursor-pointer"
              >
                Privacy Policy
              </span>
              ,{" "}
              <span
                onClick={() => navigate("/paymentpolicy")}
                className="text-blue-600 underline cursor-pointer"
              >
                Payment & Merchant Policy
              </span>
              .
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-end gap-6 mt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="text-orange-500 font-medium"
              >
                Back
              </button>
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="bg-orange-500 text-white px-8 py-2 rounded-md font-semibold hover:bg-orange-600"
              >
                Next
              </button>
            )}

            {step === 2 && (
              <button
                type="submit"
                disabled={!agreed || loading || !formData.locationFetched}
                className="bg-orange-500 text-white px-8 py-2 rounded-md font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Animation */}
      <style>
        {" "}
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}
      </style>
    </div>
  );
}
