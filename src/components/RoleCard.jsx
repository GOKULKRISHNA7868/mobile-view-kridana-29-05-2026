// src/components/RoleCard.js
import React from "react";

export default function RoleCard({ title, points, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-gray-900 hover:bg-orange-500 
                 transition-all duration-300 transform hover:scale-105 
                 text-white p-6 rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <ul className="list-disc list-inside space-y-2 pl-5">
        {points.map((point, idx) => (
          <li key={idx} className="text-sm md:text-base text-justify leading-relaxed">{point}</li>
        ))}
      </ul>
    </div>
  );
}