import React, { useEffect, useState } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";

const BasicInformation = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    institutionName: "",
    establishedYear: "",
    type: "",
    logo: "",
    sports: "",
    headCoach: "",
    tagline: "",
    about: "",
  });

  const [errors, setErrors] = useState({});
  const [categoryData, setCategoryData] = useState([
    { category: "", subCategories: [], confirmed: false },
  ]);
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
  // ✅ LOAD EXISTING DATA
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        // 🔥 Dynamic instituteId
        const instituteId = user.uid;

        const docRef = doc(db, "institutes", instituteId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // 🔹 Basic form data
          setFormData({
            institutionName: data.instituteName || "",
            establishedYear: data.yearFounded || "",
            type: data.organizationType || "",
            logo: data.profileImageUrl || "",
            sports: "", // no longer used directly
            headCoach: data.founderName || "",
            tagline: data.designation || "",
            about: data.description || "",
          });

          // 🔥 Load categories (map → UI blocks)
          if (data.categories && typeof data.categories === "object") {
            const loaded = Object.entries(data.categories).map(
              ([cat, subs]) => ({
                category: cat,
                subCategories: Array.isArray(subs) ? subs : [],
              }),
            );

            setCategoryData(
              loaded.length ? loaded : [{ category: "", subCategories: [] }],
            );
          } else {
            setCategoryData([{ category: "", subCategories: [] }]);
          }
        } else {
          // No institute doc → keep empty
          setFormData({
            institutionName: "",
            establishedYear: "",
            type: "",
            logo: "",
            sports: "",
            headCoach: "",
            tagline: "",
            about: "",
          });

          setCategoryData([{ category: "", subCategories: [] }]);
        }
      } catch (error) {
        console.error("Error loading institute data:", error);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);
  // ✅ HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    // ✅ Only numbers for Established Year
    if (name === "establishedYear") {
      newValue = newValue.replace(/[^0-9]/g, "").slice(0, 4);
    }

    const capitalizeFields = [
      "institutionName",
      "type",
      "headCoach",
      "tagline",
    ];

    if (capitalizeFields.includes(name)) {
      // ✅ allow only letters
      if (["headCoach", "type", "institutionName"].includes(name)) {
        newValue = newValue.replace(/[^A-Za-z ]/g, "");
      }

      // ✅ Capitalize
      newValue = newValue.replace(/\b[a-z]/g, (char) => char.toUpperCase());
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };
  // ✅ VALIDATION
  const validate = () => {
    let newErrors = {};

    // Required fields list (removed sports)
    const requiredFields = [
      "institutionName",
      "establishedYear",
      "type",
      "logo",
      "headCoach",
      "tagline",
      "about",
    ];

    requiredFields.forEach((field) => {
      const value = formData[field];

      if (!value || String(value).trim() === "") {
        newErrors[field] = "This field is required";
      }
    });

    // 🔥 Validate categories instead of sports
    const hasValidCategory = categoryData.some(
      (block) => block.category && block.subCategories.length > 0,
    );

    if (!hasValidCategory) {
      newErrors.sports = "Select at least one category and one subcategory";
    }

    // Year validation
    const year = String(formData.establishedYear || "").trim();
    const currentYear = new Date().getFullYear();

    if (year) {
      if (!/^\d{4}$/.test(year)) {
        newErrors.establishedYear = "Enter valid 4 digit year";
      } else if (parseInt(year) > currentYear) {
        newErrors.establishedYear = "Year cannot be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleCategoryChange = (index, value) => {
    const updated = [...categoryData];
    updated[index] = { category: value, subCategories: [], confirmed: false };
    setCategoryData(updated);
  };

  const handleSubCategoryToggle = (index, sub) => {
    const updated = [...categoryData];
    const list = updated[index].subCategories;

    if (list.includes(sub)) {
      updated[index].subCategories = list.filter((s) => s !== sub);
    } else {
      updated[index].subCategories = [...list, sub];
    }

    setCategoryData(updated);
  };

  const addCategoryBlock = () => {
    setCategoryData((prev) => [
      ...prev,
      { category: "", subCategories: [], confirmed: false },
    ]);
  };

  const removeCategoryBlock = (index) => {
    const updated = categoryData.filter((_, i) => i !== index);
    setCategoryData(
      updated.length ? updated : [{ category: "", subCategories: [] }],
    );
  };
  // ✅ SAVE
  const handleSave = async () => {
    if (!user?.uid) {
      alert("User not logged in");
      return;
    }

    const isValid = validate();

    if (!isValid) {
      alert("Please fill all required details correctly.");
      return;
    }

    try {
      setSaving(true);

      // 🔥 Dynamic instituteId
      const instituteId = user.uid;
      const docRef = doc(db, "institutes", instituteId);

      // 🔥 Format categories for Firebase
      const formattedCategories = categoryData.reduce((acc, block) => {
        if (block.category && block.subCategories.length > 0) {
          acc[block.category] = block.subCategories;
        }
        return acc;
      }, {});

      await setDoc(
        docRef,
        {
          instituteName: formData.institutionName,
          yearFounded: formData.establishedYear,
          organizationType: formData.type,
          profileImageUrl: formData.logo,

          // ✅ NEW MULTI CATEGORY FORMAT
          categories: formattedCategories,

          founderName: formData.headCoach,
          designation: formData.tagline,
          description: formData.about,
          updatedAt: serverTimestamp(),
        },
        { merge: true }, // ✅ keeps existing fields safe
      );

      alert("Saved Successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving data");
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  const handleCancel = () => {
    setFormData({
      institutionName: "",
      establishedYear: "",
      type: "",
      logo: "",
      sports: "",
      headCoach: "",
      tagline: "",
      about: "",
    });

    setErrors({});
  };

  const inputClass = (field) =>
    `border ${
      errors[field] ? "border-red-500" : "border-gray-300"
    } rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500`;

  return (
    <div className="w-full">
      <h2 className="text-orange-500 font-semibold text-lg sm:text-xl mb-6">
        Basic Information
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Normal fields */}
        {[
          { label: "Institution / Academy Name", name: "institutionName" },
          { label: "Established Year", name: "establishedYear" },
          { label: "Type (Institution / Independent Trainer)", name: "type" },
          { label: "Logo / Cover / Banner Images", name: "logo" },
        ].map((field) => (
          <div className="flex flex-col" key={field.name}>
            <label className="text-sm font-medium mb-2">
              {field.label} <span className="text-red-500">*</span>
            </label>
            <input
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              className={inputClass(field.name)}
            />
            {errors[field.name] && (
              <span className="text-red-500 text-sm mt-1">
                {errors[field.name]}
              </span>
            )}
          </div>
        ))}

        {/* 🔥 Sports (offered) - Multi Category + Subcategory */}
        <div className="flex flex-col sm:col-span-2">
          <label className="text-sm font-medium mb-2">
            Sports (offered) <span className="text-red-500">*</span>
          </label>

          {categoryData.map((block, index) => (
            <div
              key={index}
              className="border border-gray-300 rounded-md p-3 mb-3"
            >
              {/* Category Select */}
              <div className="flex items-center gap-3 mb-3">
                <select
                  value={block.category}
                  onChange={(e) => handleCategoryChange(index, e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeCategoryBlock(index)}
                    className="text-red-500 font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sub Categories */}
              {block.category && !block.confirmed && (
                <>
                  {/* Sub Categories */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {subCategoryMap[block.category]?.map((sub) => (
                      <label
                        key={sub}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={block.subCategories.includes(sub)}
                          onChange={() => handleSubCategoryToggle(index, sub)}
                        />
                        {sub}
                      </label>
                    ))}
                  </div>

                  {/* OK Button */}
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      disabled={block.subCategories.length === 0}
                      onClick={() => {
                        const updated = [...categoryData];
                        updated[index].confirmed = true;
                        setCategoryData(updated);
                      }}
                      className={`px-4 py-1 rounded text-white text-sm ${
                        block.subCategories.length === 0
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-orange-500 hover:bg-orange-600"
                      }`}
                    >
                      OK
                    </button>
                  </div>
                </>
              )}
              {block.confirmed && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {block.subCategories.map((sub) => (
                    <span
                      key={sub}
                      className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-sm"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addCategoryBlock}
            className="text-orange-500 text-sm font-medium hover:underline w-fit"
          >
            + Add another category
          </button>

          {errors.sports && (
            <span className="text-red-500 text-sm mt-1">{errors.sports}</span>
          )}
        </div>

        {/* Head Coach */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">
            Head Coach Name <span className="text-red-500">*</span>
          </label>
          <input
            name="headCoach"
            value={formData.headCoach}
            onChange={handleChange}
            className={inputClass("headCoach")}
          />
          {errors.headCoach && (
            <span className="text-red-500 text-sm mt-1">
              {errors.headCoach}
            </span>
          )}
        </div>

        {/* Tagline */}
        <div className="flex flex-col sm:col-span-2">
          <label className="text-sm font-medium mb-2">
            Short Tag Line (1 line preferred){" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            name="tagline"
            value={formData.tagline}
            onChange={handleChange}
            className={inputClass("tagline")}
          />
          {errors.tagline && (
            <span className="text-red-500 text-sm mt-1">{errors.tagline}</span>
          )}
        </div>

        {/* About */}
        <div className="flex flex-col sm:col-span-2">
          <label className="text-sm font-medium mb-2">
            About Us (Detailed Description)
            <span className="text-red-500">*</span>
          </label>
          <textarea
            name="about"
            value={formData.about}
            onChange={handleChange}
            rows={5}
            className={inputClass("about")}
          />
          {errors.about && (
            <span className="text-red-500 text-sm mt-1">{errors.about}</span>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
        <button
          type="button"
          onClick={handleCancel}
          className="text-gray-600 hover:text-black transition"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default BasicInformation;
