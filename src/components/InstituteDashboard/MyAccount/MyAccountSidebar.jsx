import React from "react";

const steps = [
  "Basic Information",
  "Location & Accessibility",
  "Achievements & Track Record",
  "Training Program Offered",
  "Pricing Transparency",
  "Media & Gallery",
  "Facilities & Infrastructure",
];

const MyAccountSidebar = ({ step, setStep }) => {
  return (
    <div className="relative w-full">

      {/* Vertical dashed line */}
      <div className="absolute left-[14px] top-3 bottom-3 border-l border-dashed border-gray-300"></div>

      <div className="flex flex-col space-y-7">
        {steps.map((item, index) => {
          const isActive = step === index + 1;

          return (
            <div
              key={index}
              onClick={() => setStep(index + 1)}
              className="flex items-center gap-4 cursor-pointer group relative"
            >
              <div
                className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all
                ${isActive
                    ? "bg-orange-500 text-white"
                    : "bg-orange-100 text-orange-600"
                  }`}
              >
                {index + 1 < 10 ? `0${index + 1}` : index + 1}
              </div>

              <span
                className={`text-sm transition-all
                ${isActive
                    ? "text-orange-600 font-semibold"
                    : "text-gray-700 group-hover:text-orange-500"
                  }`}
              >
                {item}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyAccountSidebar;