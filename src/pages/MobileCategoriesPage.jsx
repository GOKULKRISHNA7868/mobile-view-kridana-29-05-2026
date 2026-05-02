import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Swords,
  Music,
  Mountain,
  Flower2,
  Trophy,
  Bike,
  Snowflake,
  Dribbble,
  Target,
  Dumbbell,
  Activity,
} from "lucide-react";

const categories = [
  { name: "Martial Arts", icon: Swords, path: "martial-arts" },
  { name: "Dance", icon: Music, path: "dance" },
  {
    name: "Adventure & Outdoor",
    icon: Mountain,
    path: "adventure-outdoor-sports",
  },
  { name: "Equestrian Sports", icon: Activity, path: "equestrian-sports" },
  { name: "Wellness", icon: Flower2, path: "wellness" },
  { name: "Team Ball Sports", icon: Trophy, path: "teamball" },

  { name: "Ice Sports", icon: Snowflake, path: "ice-sports" },
  { name: "Racket Sports", icon: Dribbble, path: "racketsports" },
  { name: "Target & Precision", icon: Target, path: "target-precision-sports" },
  { name: "Fitness", icon: Dumbbell, path: "fitness" },
  { name: "AquaticSports", icon: Activity, path: "aquatic" },
];

const CategoriesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-orange-500 p-4">
      {/* HEADER */}
      <div className="flex items-center mb-4">
        <ArrowLeft
          className="text-black cursor-pointer"
          onClick={() => navigate(-1)}
        />
        <h1 className="ml-3 text-lg font-bold text-black">
          Choose Your Area of Interest
        </h1>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-3 overflow-y-auto">
        {categories.map((cat, index) => {
          const Icon = cat.icon;

          return (
            <div
              key={index}
              onClick={() => navigate(`/services/${cat.path}`)}
              className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition"
            >
              <Icon className="text-gray-700 mb-2" size={28} />
              <p className="text-xs text-center font-medium text-gray-800">
                {cat.name}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesPage;
