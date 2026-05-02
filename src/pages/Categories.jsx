import React from "react";
import { useNavigate } from "react-router-dom";

const Categories = () => {
  const navigate = useNavigate();

  const categories = [
    {
      name: "Martial Arts",
      desc: "Build discipline, strength, and confidence through structured combat training programs.",
      image: "/images/karate.jpeg",
      route: "/services/martial-arts",
    },
    {
      name: "Team Ball Sports",
      desc: "Enhance teamwork, coordination, and competitive skills in dynamic team environments.",
      image: "/images/team-ball-sports.jpg",
      route: "/services/teamball",
    },
    {
      name: "Racket Sports",
      desc: "Improve agility, reflexes, and precision with professional racket sport coaching.",
      image: "/images/racket-sports.jpg",
      route: "/services/racketsports",
    },
    {
      name: "Fitness",
      desc: "Transform your health and stamina with personalized fitness and conditioning programs.",
      image: "/images/fitness.jpg",
      route: "/services/fitness",
    },
    {
      name: "Target & Precision Sports",
      desc: "Master focus and accuracy with expert training in precision-based disciplines.",
      image: "/images/archery.jpeg",
      route: "/services/target-precision-sports",
    },
    {
      name: "Equestrian Sports",
      desc: "Experience elite horse riding disciplines combining balance, control, and harmony.",
      image: "/images/equestrian-sports.jpg",
      route: "/services/equestrian-sports",
    },
    {
      name: "Adventure & Outdoor Sports",
      desc: "Challenge yourself with thrilling outdoor activities designed for endurance and excitement.",
      image: "/images/bungee-jumping.jpeg",
      route: "/services/adventure-outdoor-sports",
    },
    {
      name: "Ice Sports",
      desc: "Train in specialized ice-based disciplines that demand balance, speed, and control.",
      image: "/images/ice-sports.jpg",
      route: "/services/ice-sports",
    },
    {
  name: "Aquatic Sports",
  desc: "Develop strength, endurance, and technique through professional swimming and water-based sports training.",
  image: "/images/swimming.jpeg",
  route: "/services/aquatic",
},
    {
      name: "Wellness",
      desc: "Focus on mental and physical well-being through guided wellness and recovery programs.",
      image: "/images/traditional-therapies.jpeg",
      route: "/services/wellness",
    },
    {
      name: "Dance",
      desc: "Express creativity and rhythm through professional dance training across various styles.",
      image: "/images/dance.jpg",
      route: "/services/dance",
    },
  ];

  return (
    <div className="font-sans bg-gray-50 text-gray-800">
      <section className="max-w-7xl mx-auto px-6 py-12">
        
        {/* BACK → Go to Landing */}
        <button
          onClick={() => navigate("/")}
          className="text-orange-500 text-lg flex items-center gap-2 mb-6 font-medium"
        >
          ← Back to Home
        </button>

        {/* HEADER */}
        <h1 className="text-4xl font-extrabold mb-2">
          Explore Categories
        </h1>
        <p className="text-gray-600 mb-10">
          Discover professional training, coaching, and institutions across diverse sports and wellness categories.
        </p>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((item) => (
            <div
              key={item.name}
              onClick={() => {
                navigate(item.route);
                window.scrollTo(0, 0);
              }}
              className="bg-white rounded-2xl border border-orange-200 overflow-hidden cursor-pointer
                         transition-all duration-300
                         hover:-translate-y-1
                         hover:shadow-[0_10px_30px_rgba(249,115,22,0.35)]"
            >
              {/* IMAGE */}
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-52 object-cover"
              />

              {/* CONTENT */}
              <div className="p-5">
                <h3 className="text-orange-600 font-bold text-lg mb-2">
                  {item.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </section>
    </div>
  );
};

export default Categories;