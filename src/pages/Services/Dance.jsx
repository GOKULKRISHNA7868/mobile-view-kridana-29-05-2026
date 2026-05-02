import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ArrowLeft,
  Music,
  Flame,
  Heart,
  Star,
  Zap,
  Activity,
  Users,
  Sparkles,
  Drum,
  Waves,
} from "lucide-react";

const Dance = () => {
  const navigate = useNavigate();

  const [selectedSubCategory, setSelectedSubCategory] = React.useState(null);
  const [showChoice, setShowChoice] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  /* Swipe Back */
  const touchStartX = React.useRef(0);
  const touchEndX = React.useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;

    const diff = touchEndX.current - touchStartX.current;

    if (touchStartX.current < 60 && diff > 90) {
      navigate(-1);
    }
  };

  const categories = [
    { name: "Bharatanatyam", icon: Sparkles },
    { name: "Kathak", icon: Sparkles },
    { name: "Kathakali", icon: Sparkles },
    { name: "Kuchipudi", icon: Sparkles },
    { name: "Odissi", icon: Sparkles },
    { name: "Mohiniyattam", icon: Sparkles },
    { name: "Manipuri", icon: Sparkles },
    { name: "Sattriya", icon: Sparkles },

    { name: "Chhau", icon: Drum },
    { name: "Yakshagana", icon: Drum },
    { name: "Lavani", icon: Drum },
    { name: "Ghoomar", icon: Users },
    { name: "Kalbelia", icon: Users },
    { name: "Garba", icon: Users },
    { name: "Dandiya Raas", icon: Users },
    { name: "Bhangra", icon: Users },
    { name: "Bihu", icon: Users },
    { name: "Dollu Kunitha", icon: Drum },
    { name: "Theyyam", icon: Flame },

    { name: "Ballet", icon: Star },
    { name: "Contemporary", icon: Heart },
    { name: "Jazz Dance", icon: Music },
    { name: "Tap Dance", icon: Music },
    { name: "Modern Dance", icon: Music },

    { name: "Hip Hop", icon: Zap },
    { name: "Breakdance", icon: Activity },
    { name: "Street Dance", icon: Activity },
    { name: "House Dance", icon: Activity },
    { name: "Locking", icon: Zap },
    { name: "Popping", icon: Zap },
    { name: "Krumping", icon: Flame },
    { name: "Waacking", icon: Zap },
    { name: "Voguing", icon: Sparkles },

    { name: "Salsa", icon: Flame },
    { name: "Bachata", icon: Heart },
    { name: "Merengue", icon: Flame },
    { name: "Cha-Cha", icon: Music },
    { name: "Rumba", icon: Heart },
    { name: "Samba", icon: Flame },
    { name: "Paso Doble", icon: Star },
    { name: "Jive", icon: Zap },
    { name: "Tango", icon: Heart },
    { name: "Waltz", icon: Waves },
    { name: "Foxtrot", icon: Music },
    { name: "Quickstep", icon: Zap },

    { name: "Flamenco", icon: Flame },
    { name: "Irish Stepdance", icon: Activity },
    { name: "Scottish Highland Dance", icon: Users },
    { name: "Morris Dance", icon: Users },
    { name: "Hula", icon: Waves },
    { name: "Maori Haka", icon: Drum },
    { name: "African Tribal Dance", icon: Drum },

    { name: "Zumba", icon: Activity },
    { name: "K-Pop Dance", icon: Star },
    { name: "Shuffle Dance", icon: Zap },
    { name: "Electro Dance", icon: Zap },
    { name: "Pole Dance", icon: Activity },

    { name: "Ballroom Dance", icon: Users },
    { name: "Line Dance", icon: Users },
    { name: "Square Dance", icon: Users },
    { name: "Folk Dance", icon: Users },
    { name: "Contra Dance", icon: Users },
  ];

  const filteredCategories = categories.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div
      className="bg-[#FFF9F5] min-h-screen px-4 py-5"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* TOP BAR */}
      <div className="flex items-center gap-3 mb-5">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Search */}
        <div className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 flex items-center">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search dance styles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full outline-none text-sm bg-transparent"
          />
        </div>

        {/* Profile */}
        <div className="w-10 h-10 rounded-full bg-[#FF6A00] text-white flex items-center justify-center font-bold">
          👤
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Explore Subcategories
      </h1>

      {/* Count */}
      <p className="text-sm text-gray-500 mb-5">
        {filteredCategories.length} Subcategories
      </p>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-8">
        {filteredCategories.map((item) => (
          <div
            key={item.name}
            onClick={() => {
              setSelectedSubCategory(item.name);
              setShowChoice(true);
            }}
            className="h-[120px] rounded-2xl bg-white shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 cursor-pointer hover:shadow-md transition active:scale-95"
          >
            <item.icon size={28} className="text-[#FF6A00]" />

            <p className="text-xs text-gray-700 text-center px-1 font-medium leading-tight">
              {item.name}
            </p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showChoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-200">
            <h2 className="text-lg font-bold mb-2">Dance</h2>

            <p className="text-gray-500 mb-5">What are you looking for?</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  navigate(
                    `/viewtrainers?category=Dance&subCategory=${encodeURIComponent(
                      selectedSubCategory,
                    )}`,
                  );
                }}
                className="bg-[#FF6A00] text-white py-3 rounded-xl font-semibold"
              >
                Find Trainers
              </button>

              <button
                onClick={() => {
                  navigate(
                    `/viewinstitutes?category=Dance&subCategory=${encodeURIComponent(
                      selectedSubCategory,
                    )}`,
                  );
                }}
                className="border border-[#FF6A00] text-[#FF6A00] py-3 rounded-xl font-semibold"
              >
                Find Institutes
              </button>
            </div>

            <button
              onClick={() => setShowChoice(false)}
              className="mt-4 text-sm text-gray-500 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dance;
