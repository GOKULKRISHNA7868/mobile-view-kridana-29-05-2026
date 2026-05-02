import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User } from "lucide-react";
import { ChevronDown } from "lucide-react";

import { ArrowLeft } from "lucide-react";
export default function TrainerSignup() {
  const navigate = useNavigate();
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

  // ✅ ADD THIS (Storage instance)
  const storage = getStorage();

  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);

  const profileInputRef = useRef(null);
  const certificateInputRef = useRef(null);

  // ✅ Loading state (if not already there)
  const [loading, setLoading] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [certifications, setCertifications] = useState([]);
  const [profileFile, setProfileFile] = useState(null);
  const categoryRef = useRef(null);
  const [showCategory, setShowCategory] = useState(false);
  const subCategoryRef = useRef(null);
  const [showSubCategory, setShowSubCategory] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    organization: "",
    designation: "",
    dob: "",
    category: "",
    subCategory: "",
    experience: "",
    city: "",
    state: "",
    trainerName: "",
    trainerType: "",
    locationName: "",
    latitude: "",
    longitude: "",
    yearsExperience: "",
    phoneNumber: "",
    email: "",
    instituteName: "",
    password: "",
    confirmPassword: "",
  });
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedValue = value;

    // Alphabets only
    if (name === "firstName" || name === "lastName" || name === "accountName") {
      updatedValue = value.replace(/[^A-Za-z ]/g, "");

      // ✅ Capitalize
      updatedValue = updatedValue.replace(/\b[a-z]/g, (char) =>
        char.toUpperCase(),
      );
    }

    // Organization & designation (allow letters + space + dot)

    if (name === "organization" || name === "designation") {
      updatedValue = value.replace(/[^A-Za-z ]/g, "");

      // ✅ Capitalize
      updatedValue = updatedValue.replace(/\b[a-z]/g, (char) =>
        char.toUpperCase(),
      );
    }
    if (name === "city" || name === "state") {
      updatedValue = value.replace(/[^A-Za-z ]/g, "");

      // ✅ Capitalize
      updatedValue = updatedValue.replace(/\b[a-z]/g, (char) =>
        char.toUpperCase(),
      );
    }

    // Experience → numbers only
    if (name === "experience" || name === "yearsExperience") {
      updatedValue = value.replace(/\D/g, "");
    }

    // Phone → only 10 digits
    if (name === "phoneNumber") {
      updatedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    // Account Number → only numbers
    if (name === "accountNumber") {
      updatedValue = value.replace(/\D/g, "");
    }

    // IFSC → uppercase, max 11
    if (name === "ifscCode") {
      updatedValue = value.toUpperCase().slice(0, 11);
    }

    // Bank name → alphabets only
    if (name === "bankName") {
      updatedValue = value.replace(/[^A-Za-z ]/g, "");
    }

    // PF Details → numbers only
    if (name === "pfDetails") {
      updatedValue = value.replace(/\D/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };
  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;

    setFormData((prev) => ({
      ...prev,
      category: selectedCategory,
      subCategory: "",
    }));

    setAvailableSubCategories(subCategoryMap[selectedCategory] || []);
  };

  const handleProfileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileFile(file); // store file
      setProfilePreview(URL.createObjectURL(file)); // preview
    }
  };

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
      setErrors((prev) => ({
        ...prev,
        profileImage: "Image upload failed. Try again.",
      }));
      return "";
    }
  };

  const handleCertificateUpload = (e) => {
    const newFiles = Array.from(e.target.files);

    setCertifications((prev) => {
      const combined = [...prev, ...newFiles];

      if (combined.length > 3) {
        setErrors((prev) => ({
          ...prev,
          certifications: "Maximum 3 certifications allowed",
        }));
        return prev;
        return prev;
      }

      return combined;
    });

    e.target.value = null; // allow re-select same file
  };

  const validateStep = () => {
    let newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim())
        newErrors.firstName = "First name is required";

      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required";

      if (!formData.organization.trim())
        newErrors.organization = "Organization is required";

      if (!formData.designation.trim())
        newErrors.designation = "Designation is required";

      if (!formData.dob) {
        newErrors.dob = "Date of birth is required";
      } else {
        const selectedDate = new Date(formData.dob);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
          newErrors.dob = "Future date not allowed";
        }
      }

      if (!formData.category) newErrors.category = "Please select category";

      if (!formData.subCategory)
        newErrors.subCategory = "Please select sub category";

      if (!formData.experience.trim())
        newErrors.experience = "Experience is required";

      if (!profileFile) newErrors.profileImage = "Profile image is required";

      if (certifications.length === 0)
        newErrors.certifications = "Upload at least one certification";
    }

    if (step === 2) {
      if (!formData.phoneNumber)
        newErrors.phoneNumber = "Phone number is required";
      else if (formData.phoneNumber.length !== 10)
        newErrors.phoneNumber = "Enter valid 10 digit number";

      if (!formData.email) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = "Enter valid email address";

      if (!formData.password) newErrors.password = "Password is required";
      else if (
        !/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(formData.password)
      ) {
        newErrors.password =
          "Password must be 8+ characters, include 1 uppercase, 1 lowercase, and 1 number";
      }
      if (!formData.city.trim()) newErrors.city = "City is required";

      if (!formData.state.trim()) newErrors.state = "State is required";

      if (!formData.confirmPassword)
        newErrors.confirmPassword = "Confirm your password";
      else if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    if (step === 1 && !agreed) {
      setErrors((prev) => ({
        ...prev,
        submit: "Please agree to Terms & Policies",
      }));
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) navigate("/");
    else setStep(step - 1);
  };
  const handleSubmit = async () => {
    if (loading) return;
    if (!validateStep()) return;

    if (!agreed) {
      setErrors((prev) => ({
        ...prev,
        submit: "Please agree to Terms & Policies",
      }));
      return;
    }

    if (!profileFile) {
      setErrors((prev) => ({
        ...prev,
        profileImage: "Profile image is required",
      }));
      return;
    }

    setLoading(true); // ✅ START LOADING

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      // ✅ Upload profile image
      const profileImageUrl = await uploadProfileToCloudinary(profileFile);

      if (!profileImageUrl) {
        throw new Error("Profile image upload failed");
      }

      // ✅ Upload certifications
      const certificationUrls = [];
      for (let file of certifications) {
        const url = await uploadProfileToCloudinary(file);
        if (url) certificationUrls.push(url);
      }

      const { instituteName, ...safeFormData } = formData;

      await setDoc(doc(db, "trainers", userCred.user.uid), {
        role: "trainer",
        status: "pending",

        profileImageUrl,
        certifications: certificationUrls,

        ...safeFormData,

        instituteName: formData.organization,

        agreements: {
          termsAndConditions: true,
          privacyPolicy: true,
          paymentPolicy: true,
          agreedAt: serverTimestamp(),
        },

        createdAt: serverTimestamp(),
      });

      alert("Trainer registered successfully!");
      navigate("/login?role=trainer");
    } catch (err) {
      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please login.");
        navigate("/login?role=trainer");
      } else if (err.code === "auth/invalid-email") {
        alert("Invalid email address.");
      } else if (err.code === "auth/weak-password") {
        alert("Password should be stronger.");
      } else {
        setErrors((prev) => ({
          ...prev,
          submit: err.message || "Something went wrong",
        }));
      }
    } finally {
      setLoading(false); // ✅ STOP LOADING
    }
  };

  const inputClass =
    "h-11 px-3 border border-orange-400 rounded-md bg-white focus:bg-white outline-none focus:border-2 focus:border-orange-500";

  // ⬇️ return ( … UI continues here )

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategory(false);
      }
      if (
        subCategoryRef.current &&
        !subCategoryRef.current.contains(e.target)
      ) {
        setShowSubCategory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen flex justify-center bg-white py-10">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 rounded-md mt-4 mb-10">
        {/* HEADER WITH PROFILE + CONTENT BESIDE */}
        {/* HEADER */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#FF6A00] font-semibold mb-6"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          {/* LEFT : Upload Profile */}
          {/* LEFT : Upload Profile */}
          <div className="flex flex-col items-center mt-6">
            <div
              onClick={() => profileInputRef.current.click()}
              className="w-24 h-24 rounded-full bg-orange-200 flex items-center justify-center cursor-pointer overflow-hidden"
            >
              {profilePreview ? (
                <img
                  src={profilePreview}
                  alt="profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-orange-600" />
              )}
            </div>

            {/* TEXT BELOW CIRCLE */}
            <span className="text-sm text-orange-500 font-medium mt-2">
              Upload Profile
            </span>

            <input
              type="file"
              ref={profileInputRef}
              className="hidden"
              onChange={handleProfileUpload}
            />
            {errors.profileImage && (
              <p className="text-red-500 text-xs mt-2 text-center">
                {errors.profileImage}
              </p>
            )}
          </div>

          {/* CENTER : Title + Step + Bars */}
          <div className="flex-1 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-orange-500 ">
              Trainer’s Registration
            </h2>

            <p className="text-md text-center mt-6">Step {step} to 2</p>

            {/* PROGRESS BARS */}
            <div className="flex gap-3 sm:gap-4 mt-4 w-full max-w-[580px] px-2 sm:px-0">
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

          {/* RIGHT : empty spacer (keeps center aligned) */}
          <div className="mt-8" />
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-2">
            {[
              ["First Name*", "firstName"],
              ["Last Name*", "lastName"],
            ].map(([label, name]) => (
              <div key={name} className="flex flex-col gap-3 mb-1">
                <label className="text-sm font-semibold mb-0">{label}</label>

                <input
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  className={`${inputClass} ${
                    errors[name] ? "border-red-500" : ""
                  }`}
                />

                {errors[name] && (
                  <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
                )}
              </div>
            ))}

            <div className="col-span-2 flex flex-col">
              <label className="text-sm font-semibold mb-2">
                Add Association / Organization Name*
              </label>
              <input
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                className={`${inputClass} ${errors.organization ? "border-red-500" : ""}`}
              />
              {errors.organization && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.organization}
                </p>
              )}
            </div>

            {[
              ["Designation*", "designation"],
              ["Date Of Birth*", "dob", "date"],
            ].map(([label, name, type = "text"]) => (
              <div key={name} className="flex flex-col">
                <label className="text-sm font-semibold mb-2">{label}</label>

                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  max={
                    name === "dob"
                      ? new Date().toISOString().split("T")[0]
                      : undefined
                  }
                  className={`${inputClass} ${
                    errors[name] ? "border-red-500" : ""
                  }`}
                />

                {errors[name] && (
                  <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
                )}
              </div>
            ))}

            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2">
                Select Category*
              </label>

              <div ref={categoryRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategory(!showCategory)}
                  className={`${inputClass} w-full flex justify-between items-center`}
                >
                  <span>{formData.category || "Select Category"}</span>
                  <ChevronDown
                    size={18}
                    className={`transition-transform ${showCategory ? "rotate-180" : ""}`}
                  />
                </button>

                {showCategory && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-48 overflow-y-auto">
                    {categories.map((cat) => (
                      <div
                        key={cat}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            category: cat,
                            subCategory: "",
                          }));
                          setAvailableSubCategories(subCategoryMap[cat] || []);
                          setShowCategory(false);
                        }}
                        className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category}</p>
              )}
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2">
                Select Sub – Category*
              </label>

              <div ref={subCategoryRef} className="relative">
                <button
                  type="button"
                  disabled={!formData.category}
                  onClick={() => setShowSubCategory(!showSubCategory)}
                  className={`${inputClass} w-full flex justify-between items-center ${
                    !formData.category ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <span>
                    {formData.subCategory ||
                      (formData.category
                        ? "Select Sub Category"
                        : "Select Category First")}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`transition-transform ${showSubCategory ? "rotate-180" : ""}`}
                  />
                </button>

                {showSubCategory && formData.category && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-48 overflow-y-auto">
                    {availableSubCategories.map((sub) => (
                      <div
                        key={sub}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            subCategory: sub,
                          }));
                          setShowSubCategory(false);
                        }}
                        className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                      >
                        {sub}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errors.subCategory && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.subCategory}
                </p>
              )}
            </div>

            {/* Experience */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2">Experience*</label>
              <input
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className={`${inputClass} ${errors.experience ? "border-red-500" : ""}`}
              />
              {errors.experience && (
                <p className="text-red-500 text-xs mt-1">{errors.experience}</p>
              )}
            </div>

            {/* Upload Certification – SAME ROW */}
            <div className="flex flex-col relative">
              <label className="text-sm font-semibold mb-2">
                Upload Certification* / License Number
              </label>

              <input
                readOnly
                value={
                  certifications.length
                    ? `${certifications.length} file(s) selected`
                    : ""
                }
                placeholder="Upload certification or licence images"
                className={`${inputClass} pr-12`}
              />

              <button
                type="button"
                onClick={() => certificateInputRef.current.click()}
                className="absolute right-3 top-[34px]"
              >
                <img
                  src="/upload.png"
                  alt="upload"
                  className="w-6 h-6 cursor-pointer"
                />
              </button>

              <input
                type="file"
                ref={certificateInputRef}
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleCertificateUpload}
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload certification or licence images (1–3 only)
              </p>
              {errors.certifications && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.certifications}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8">
            {/* Phone Number */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2">
                Add Phone Number*
              </label>
              <input
                name="phoneNumber"
                value={formData.phoneNumber}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={handleChange}
                maxLength={10}
                className={`${inputClass} ${
                  errors.phoneNumber ? "border-red-500" : ""
                }`}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* City */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2">City*</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`${inputClass} ${errors.city ? "border-red-500" : ""}`}
              />
              {errors.city && (
                <p className="text-red-500 text-xs mt-1">{errors.city}</p>
              )}
            </div>

            {/* State */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2">State*</label>
              <input
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`${inputClass} ${errors.state ? "border-red-500" : ""}`}
              />
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">{errors.state}</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2">
                Add E – Mail Id*
              </label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                className={inputClass}
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
                onChange={handleChange}
                className={inputClass}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2">
                Re – Enter Password*
              </label>
              <input
                type="password"
                name="confirmPassword"
                onChange={handleChange}
                className={inputClass}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Login link */}
            <div className="col-span-2 text-sm mt-2">
              Already Have an Account ?{" "}
              <span
                className="text-orange-500 cursor-pointer font-medium"
                onClick={() => navigate("/login")}
              >
                Login
              </span>
            </div>
          </div>
        )}

        <div className="h-24"></div>
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

        {/* BUTTONS */}
        {/* SUBMIT ERROR MESSAGE */}
        {errors.submit && (
          <p className="text-red-500 text-sm text-right mb-3">
            {errors.submit}
          </p>
        )}
        <div className="flex justify-end gap-6 mt-4">
          <button onClick={handleBack} className="text-orange-500 font-medium">
            Back
          </button>

          {step < 2 && (
            <button
              onClick={handleNext}
              className="bg-orange-500 px-8 py-2 rounded-md font-semibold"
            >
              Next
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!agreed || loading}
              className={`bg-orange-500 text-white px-8 py-2 rounded-md font-semibold
    ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-orange-600"}
  `}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
