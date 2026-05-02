import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowLeft } from "lucide-react";
import {
  Circle,
  Volleyball,
  Footprints,
  Trophy,
  Target,
  Users,
  Dribbble,
  Shield,
} from "lucide-react";

const TeamBallPage = () => {
  const navigate = useNavigate();
  const category = "Team Ball Sports";

  const [selectedSubCategory, setSelectedSubCategory] = React.useState(null);
  const [showChoice, setShowChoice] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const categories = [
    { name: "Football / Soccer", icon: Footprints },
    { name: "Basketball", icon: Dribbble },
    { name: "Handball", icon: Circle },
    { name: "Rugby", icon: Shield },
    { name: "Futsal", icon: Footprints },
    { name: "Field Hockey", icon: Target },
    { name: "Lacrosse", icon: Target },
    { name: "Gaelic Football", icon: Footprints },
    { name: "Volleyball", icon: Volleyball },
    { name: "Beach Volleyball", icon: Volleyball },
    { name: "Sepak Takraw", icon: Circle },
    { name: "Roundnet (Spikeball)", icon: Circle },
    { name: "Netball", icon: Circle },
    { name: "Cricket", icon: Trophy },
    { name: "Baseball", icon: Circle },
    { name: "Softball", icon: Circle },
    { name: "Wheelchair Rugby", icon: Shield },
    { name: "Dodgeball", icon: Circle },
    { name: "Korfball", icon: Users },
  ];

  const filteredCategories = categories.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* Swipe Back */
  useEffect(() => {
    let startX = 0;
    let endX = 0;

    const handleTouchStart = (e) => {
      startX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
      endX = e.changedTouches[0].screenX;

      if (endX - startX > 100) {
        navigate(-1);
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#FFF9F5] px-4 py-6">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-2xl font-bold">Explore Subcategories</h1>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center flex-grow bg-white border border-gray-200 rounded-full px-4 py-2">
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
          👤
        </div>
      </div>

      {/* COUNT */}
      <p className="text-sm text-gray-600 mb-4">
        {filteredCategories.length} Disciplines Available
      </p>

      {/* GRID */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
        {filteredCategories.map((item) => (
          <div
            key={item.name}
            onClick={() => {
              setSelectedSubCategory(item.name);
              setShowChoice(true);
            }}
            className="h-[120px] rounded-2xl bg-white shadow-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:shadow-lg transition active:scale-95"
          >
            <item.icon size={26} className="text-[#FF6A00]" />

            <p className="text-xs text-gray-700 text-center px-1 font-medium">
              {item.name}
            </p>
          </div>
        ))}
      </div>

      {/* POPUP */}
      {showChoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 text-center">
            <h2 className="text-xl font-bold mb-2">{category}</h2>

            <p className="text-gray-600 mb-6">What are you looking for?</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  navigate(
                    `/viewtrainers?category=${category}&subCategory=${encodeURIComponent(
                      selectedSubCategory
                    )}`
                  );
                  setShowChoice(false);
                }}
                className="bg-[#FF6A00] text-white py-3 rounded-xl font-semibold"
              >
                Find Trainers
              </button>

              <button
                onClick={() => {
                  navigate(
                    `/viewinstitutes?category=${category}&subCategory=${encodeURIComponent(
                      selectedSubCategory
                    )}`
                  );
                  setShowChoice(false);
                }}
                className="border border-[#FF6A00] text-[#FF6A00] py-3 rounded-xl font-semibold"
              >
                Find Institutes
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

export default TeamBallPage;