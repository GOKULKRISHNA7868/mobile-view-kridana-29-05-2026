import React from "react";

const steps = [
  "Basic Information",
  "Schedule & Location",
  "Organizer Details",
  "Participant Configuration",
  "Pricing & Payments",
  "Operations Management",
  "Visibility & Promotion",
  "Event Analytics",
];

const EventsSidebar = ({ step, setStep }) => {
  return (
    <div className="relative w-full">

      {/* Vertical dashed line (centered to circles) */}
      <div className="absolute left-[14px] top-3 bottom-3 border-l border-dashed border-gray-300"></div>

      <div className="flex flex-col space-y-6 sm:space-y-7 md:space-y-8">
        {steps.map((item, index) => {
          const isActive = step === index + 1;

          return (
            <div
              key={index}
              onClick={() => setStep(index + 1)}
              className="flex items-center gap-4 cursor-pointer group relative"
            >
              {/* Circle Number */}
              <div
                className={`
                  relative z-10
                  w-7 h-7 sm:w-8 sm:h-8
                  flex items-center justify-center
                  rounded-full text-xs sm:text-sm font-semibold
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-orange-100 text-orange-600"
                  }
                `}
              >
                {index + 1 < 10 ? `0${index + 1}` : index + 1}
              </div>

              {/* Step Text */}
              <span
                className={`
                  text-sm sm:text-base
                  transition-all duration-200
                  ${
                    isActive
                      ? "text-orange-600 font-semibold"
                      : "text-gray-700 group-hover:text-orange-500"
                  }
                `}
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

export default EventsSidebar;
