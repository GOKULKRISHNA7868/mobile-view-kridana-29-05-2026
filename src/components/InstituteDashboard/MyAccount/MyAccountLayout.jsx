import React, { useState } from "react";
import MyAccountSidebar from "./MyAccountSidebar";

import BasicInformation from "./steps/BasicInformation";
import LocationAccessibility from "./steps/LocationAccessibility";
import AchievementsTrack from "./steps/AchievementsTrack";
import TrainingProgram from "./steps/TrainingProgram";
import PricingTransparency from "./steps/PricingTransparency";
import MediaGallery from "./steps/MediaGallery";
import FacilitiesInfrastructure from "./steps/FacilitiesInfrastructure";

const MyAccountLayout = () => {
  const [step, setStep] = useState(1);

  const renderStep = () => {
    switch (step) {
      case 1: return <BasicInformation />;
      case 2: return <LocationAccessibility setStep={setStep} />;
      case 3: return <AchievementsTrack setStep={setStep}/>;
      case 4: return <TrainingProgram setStep={setStep}/>;
      case 5: return <PricingTransparency setStep={setStep}/>;
      case 6: return <MediaGallery setStep={setStep}/>;
      case 7: return <FacilitiesInfrastructure setStep={setStep}/>;
      default: return null;
    }
  };

  return (
   <div className="min-h-screen bg-[#E7B89E] px-4 sm:px-6 lg:px-10 py-8">

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">
  My Account
</h1>

<p className="text-gray-800 mt-2 text-sm sm:text-base">
  Manage your profile, team, and customers
</p>
        </div>
        <div className="max-w-7xl mx-auto border-b border-black/20 mb-8"></div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <div className="
  w-full 
  lg:w-72 
  bg-white
  rounded-2xl 
  p-5 
  shadow-md
">
            <MyAccountSidebar step={step} setStep={setStep} />
          </div>

          {/* Step Content */}
          <div className="
  flex-1 
  bg-white 
  rounded-2xl 
  shadow-md 
  p-4 
  sm:p-6 
  lg:p-8
">

            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccountLayout;