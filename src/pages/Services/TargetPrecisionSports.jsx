import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, ArrowLeft } from "lucide-react";
import {
  Target,
  Circle,
  Disc,
  Crosshair,
  Activity,
  Flag,
  Grid,
  HelpCircle,
} from "lucide-react";

const TargetPrecisionPage = () => {
  const navigate = useNavigate();
  const [selectedSubCategory, setSelectedSubCategory] = React.useState(null);
  const [showChoice, setShowChoice] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const category = "Precision Sports";

  const categories = [
    { name: "Archery", icon: Target },
    { name: "Golf", icon: Flag },
    { name: "Bowling", icon: Circle },
    { name: "Darts", icon: Crosshair },
    { name: "Snooker", icon: Circle },
    { name: "Pool", icon: Circle },
    { name: "Billiards", icon: Circle },
    { name: "Target Shooting", icon: Crosshair },
    { name: "Clay Pigeon Shooting", icon: Target },
    { name: "Air Rifle Shooting", icon: Crosshair },
    { name: "Air Pistol Shooting", icon: Crosshair },
    { name: "Croquet", icon: Grid },
    { name: "Petanque", icon: Circle },
    { name: "Bocce", icon: Circle },
    { name: "Lawn Bowls", icon: Circle },
    { name: "Carom Billiards", icon: Circle },
    { name: "Nine-Pin Bowling", icon: Circle },
    { name: "Disc Golf", icon: Disc },
    { name: "Kubb", icon: Grid },
    { name: "Pitch and Putt", icon: Flag },
    { name: "Shove Ha’penny", icon: Grid },
    { name: "Toad in the Hole", icon: HelpCircle },
    { name: "Bat and Trap", icon: Activity },
    { name: "Boccia", icon: Circle },
    { name: "Gateball", icon: Activity },
  ];

  const filteredCategories = categories.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* Swipe Back */
  useEffect(() => {
    let startX = 0;
    let endX = 0;

    const handleStart = (e) => {
      startX = e.changedTouches[0].screenX;
    };

    const handleEnd = (e) => {
      endX = e.changedTouches[0].screenX;

      if (endX - startX > 100) {
        navigate(-1);
      }
    };

    window.addEventListener("touchstart", handleStart);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [navigate]);

  return (
    <div className="bg-[#FFF9F5] min-h-screen px-4 py-6">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-2xl font-extrabold">Explore Subcategories</h1>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-grow flex items-center bg-white border border-gray-200 rounded-full px-4 py-2">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search disciplines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full outline-none bg-transparent text-sm"
          />
        </div>

        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="text-gray-600" size={20} />
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredCategories.map((item) => (
          <div
            key={item.name}
            onClick={() => {
              setSelectedSubCategory(item.name);
              setShowChoice(true);
            }}
            className="h-[120px] rounded-2xl bg-white shadow-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:shadow-lg transition active:scale-95"
          >
            <item.icon size={28} className="text-[#FF6A00]" />

            <p className="text-xs text-gray-700 text-center px-1 font-medium">
              {item.name}
            </p>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showChoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 text-center">
            <h2 className="text-xl font-bold mb-2">{category}</h2>
            <p className="text-gray-600 mb-6">What are you looking for?</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  navigate(
                    `/viewtrainers?category=Precision Sports&subCategory=${encodeURIComponent(
                      selectedSubCategory
                    )}`
                  );
                  setShowChoice(false);
                }}
                className="bg-orange-500 text-white py-3 rounded-xl font-semibold"
              >
                Trainers
              </button>

              <button
                onClick={() => {
                  navigate(
                    `/viewinstitutes?category=Precision Sports&subCategory=${encodeURIComponent(
                      selectedSubCategory
                    )}`
                  );
                  setShowChoice(false);
                }}
                className="border border-orange-500 text-orange-500 py-3 rounded-xl font-semibold"
              >
                Institutes
              </button>
            </div>

            <button
              onClick={() => setShowChoice(false)}
              className="mt-4 text-sm text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetPrecisionPage;