// src/pages/ViewInstitutes.jsx
import React, { useEffect, useState, useMemo } from "react";
import { db, auth } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Filter } from "lucide-react";
import { ArrowLeft } from "lucide-react";

export default function ViewInstitutes() {
  const navigate = useNavigate();
  const location = useLocation();

  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const searchParams = new URLSearchParams(location.search);
  const defaultCategory = searchParams.get("category") || "";
  const defaultSubCategory = searchParams.get("subCategory") || "";
  const isSubCategoryFromURL = Boolean(defaultSubCategory);
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState(defaultCategory);
  const [subCategory, setSubCategory] = useState(defaultSubCategory);
  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);

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
  useEffect(() => {
    const fetchInstitutes = async () => {
      try {
        const snap = await getDocs(collection(db, "institutes"));
        setInstitutes(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            profileImageUrl: d.data().profileImageUrl || "",
            images: d.data().images || [],
            videos: d.data().videos || [],
            reels: d.data().reels || [],
          })),
        );
      } catch (error) {
        console.error("Error fetching institutes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstitutes();
  }, []);

  const filteredInstitutes = useMemo(() => {
    return (
      institutes
        .filter((i) => {
          if (category && !i.categories?.[category]) return false;
          if (subCategory && !i.categories?.[category]?.includes(subCategory))
            return false;
          if (
            city &&
            i.city?.trim().toLowerCase() !== city.trim().toLowerCase()
          )
            return false;
          if (minRating && (i.rating || 0) < Number(minRating)) return false;
          return true;
        })
        // ✅ ADD THIS SORT
        .sort((a, b) => {
          const nameA = (a.instituteName || "").toLowerCase();
          const nameB = (b.instituteName || "").toLowerCase();

          return nameA.localeCompare(nameB);
        })
    );
  }, [institutes, category, subCategory, city, minRating]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl">
        Loading Institutes...
      </div>
    );

  return (
    <div className="min-h-screen bg-white px-6 md:px-16 py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex  left-0 items-center gap-2 text-[#FF6A00] font-semibold mb-6"
      >
        <ArrowLeft size={18} />
        Back
      </button>
      <h1 className="text-4xl font-bold text-[#ff7a00] mb-8">Institutes</h1>
      <div className="md:hidden flex justify-between items-center px-4 py-3 border-b bg-white sticky top-0 z-40">
        <h1 className="text-lg font-bold text-[#ff7a00]">
          {category || "Institutes"}
        </h1>

        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-2 border px-3 py-1.5 rounded-md text-sm"
        >
          <Filter size={16} />
          Filters
        </button>
      </div>
      {/* FILTERS */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-[repeat(4,minmax(180px,1fr))] gap-4 mb-8">
        {/* Category */}
        {/* CATEGORY CUSTOM DROPDOWN */}
        <div className="relative">
          <label className="block text-sm font-semibold mb-1">
            Select Category*
          </label>

          <div
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className={`w-full flex items-center justify-between bg-white 
border ${showCategoryDropdown ? "border-orange-500" : "border-gray-300"} 
rounded-md px-3 h-[45px] cursor-pointer`}
          >
            <span className={category ? "text-black" : "text-gray-400"}>
              {category || "Select Category"}
            </span>
            <ChevronDown size={18} />
          </div>

          {showCategoryDropdown && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-md shadow max-h-[200px] overflow-y-auto">
              {categories.map((cat) => (
                <div
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setSubCategory("");
                    setShowCategoryDropdown(false);
                  }}
                  className="px-4 py-3 text-sm hover:bg-blue-600 hover:text-white active:bg-orange-500 active:text-white cursor-pointer"
                >
                  {cat}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* SubCategory */}
        {/* SUBCATEGORY CUSTOM DROPDOWN */}
        <div className="relative">
          <label className="block text-sm font-semibold mb-1">
            Select Sub Category*
          </label>

          <div
            onClick={() =>
              category && setShowSubCategoryDropdown(!showSubCategoryDropdown)
            }
            className={`w-full flex items-center justify-between bg-white 
    border border-orange-500 rounded-md px-3 h-[45px] 
    ${!category && "cursor-not-allowed opacity-50"}`}
          >
            <span className={subCategory ? "text-black" : "text-gray-400"}>
              {subCategory || "Select Sub Category"}
            </span>
            <ChevronDown size={18} />
          </div>

          {showSubCategoryDropdown && category && (
            <div className="fixed left-4 right-4 top-[140px] z-[999] bg-white border rounded-md shadow max-h-[250px] overflow-y-auto">
              {(subCategoryMap[category] || []).map((sub) => (
                <div
                  key={sub}
                  onClick={() => {
                    setSubCategory(sub);
                    setShowSubCategoryDropdown(false);
                  }}
                  className="px-4 py-2 hover:bg-blue-600 cursor-pointer"
                >
                  {sub}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* City */}
        <div>
          <label className="block text-sm font-semibold mb-1">City</label>
          <select
            className="w-full bg-white border border-gray-300 rounded-md px-3 h-[42px]
            focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">All Cities</option>
            {[
              ...new Map(
                institutes
                  .filter((i) => i.city)
                  .map((i) => {
                    const trimmed = i.city.trim();
                    return [trimmed.toLowerCase(), trimmed];
                  }),
              ).values(),
            ]
              .sort((a, b) => a.localeCompare(b))
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>
        </div>

        {/* Min Rating */}
        <div>
          <label className="block text-sm font-semibold mb-1">
            Minimum Rating
          </label>
          <select
            className="w-full bg-white border border-gray-300 rounded-md px-3 h-[42px]
            focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
          >
            <option value="">Any Rating</option>
            <option value="3">3★+</option>
            <option value="4">4★+</option>
          </select>
        </div>
      </div>

      {/* LIST */}
      {filteredInstitutes.length === 0 ? (
        <div className="text-center mt-12">
          <img
            src="/institue.png"
            alt="No trainers"
            className="mx-auto w-32 mb-4 opacity-80"
          />
          <h1 className="text-2xl font-bold mb-2">
            We're curating the best institutes for you
          </h1>
          <p className="text-gray-500 text-xl">
            Our team is reviewing and adding top-notch institutes to ensure you
            get the best options. Please check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2 md:mt-4">
          {/* LIST */}
          {filteredInstitutes.length === 0 ? (
            <div className="text-center mt-12">
              <img
                src="/institue.png"
                alt="No trainers"
                className="mx-auto w-32 mb-4 opacity-80"
              />
              <h1 className="text-2xl font-bold mb-2">
                We're curating the best institutes for you
              </h1>
              <p className="text-gray-500 text-xl">
                Our team is reviewing and adding top-notch institutes.
              </p>
            </div>
          ) : (
            <>
              {/* ================= MOBILE VIEW ================= */}
              <div className="md:hidden flex flex-col gap-4 mt-6">
                {filteredInstitutes.map((inst) => (
                  <div
                    key={inst.id}
                    className="bg-[#FFF7F2] rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    {/* TOP ROW */}
                    <div className="flex gap-4 items-center">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-white border">
                        {inst.profileImageUrl ? (
                          <img
                            src={inst.profileImageUrl}
                            alt={inst.instituteName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>

                      {/* TEXT */}
                      <div className="flex-1">
                        <h2 className="font-bold text-base text-gray-900">
                          {inst.instituteName}
                        </h2>

                        <p className="text-sm text-gray-500">
                          {Object.keys(inst.categories || {})[0] || "Institute"}
                        </p>

                        <p className="text-xs text-gray-400">
                          {inst.city}, {inst.state} ({inst.students || 0}{" "}
                          Students)
                        </p>
                      </div>
                    </div>

                    {/* BUTTONS */}
                    <div className="flex gap-3 mt-4">
                      <button className="bg-[#FF6A00] text-white rounded-md py-2 px-4 font-bold flex-1 active:scale-95 transition">
                        Message
                      </button>

                      <button
                        onClick={() => navigate(`/institutes/${inst.id}`)}
                        className="border-2 border-[#FF6A00] text-[#FF6A00] rounded-md py-2 px-4 font-bold flex-1 bg-white active:scale-95 transition"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ================= DESKTOP VIEW ================= */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-[repeat(4,minmax(180px,1fr))] gap-4 mb-8">
                {filteredInstitutes.map((inst) => (
                  <div
                    key={inst.id}
                    onClick={() => navigate(`/institutes/${inst.id}`)}
                    className="bg-white rounded-[18px] shadow-lg border cursor-pointer hover:scale-[1.02] transition-transform flex flex-col justify-between h-[320px]"
                  >
                    <div className="h-[160px] rounded-t-[18px] overflow-hidden flex items-center justify-center bg-white">
                      {inst.profileImageUrl ? (
                        <img
                          src={inst.profileImageUrl}
                          alt={inst.instituteName}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-white" />
                      )}
                    </div>

                    <div className="p-4 text-center flex flex-col justify-between h-full">
                      <h2 className="text-lg font-bold line-clamp-1">
                        {inst.instituteName}
                      </h2>

                      <p className="text-gray-500 text-sm">
                        {inst.city}, {inst.state}
                      </p>

                      <p className="font-semibold text-sm flex justify-center gap-1">
                        {inst.rating ? (
                          <>
                            <span className="text-yellow-500">⭐</span>
                            {inst.rating.toFixed(1)}
                          </>
                        ) : (
                          <span className="text-gray-400">No ratings</span>
                        )}
                      </p>

                      <button className="mt-3 w-full bg-[#ff7a00] text-white py-2 rounded-lg text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}{" "}
        </div>
      )}
      {/* ✅ FILTER POPUP - ALWAYS AVAILABLE */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex items-end">
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowFilters(false)}
          />

          {/* BOTTOM SHEET */}
          <div className="relative bg-white w-full rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto animate-slideUp">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white">
              <h2 className="text-lg font-bold">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 text-sm"
              >
                Close
              </button>
            </div>

            {/* FILTERS */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold">Category</label>
                <select
                  className="w-full border rounded-md p-2 mt-1"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubCategory("");
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Sub Category</label>
                <select
                  className="w-full border rounded-md p-2 mt-1"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  disabled={!category}
                >
                  <option value="">All Subcategories</option>
                  {(subCategoryMap[category] || []).map((sub) => (
                    <option key={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">City</label>
                <select
                  className="w-full border rounded-md p-2 mt-1"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="">All Cities</option>
                  {[
                    ...new Set(institutes.map((i) => i.city).filter(Boolean)),
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Minimum Rating</label>
                <select
                  className="w-full border rounded-md p-2 mt-1"
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                >
                  <option value="">Any Rating</option>
                  <option value="3">3★+</option>
                  <option value="4">4★+</option>
                </select>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setCategory("");
                    setSubCategory("");
                    setCity("");
                    setMinRating("");
                  }}
                  className="flex-1 border rounded-md py-2"
                >
                  Reset
                </button>

                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 bg-[#FF6A00] text-white py-2 rounded-md font-bold"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
