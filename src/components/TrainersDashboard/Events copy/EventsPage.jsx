import React, { useState, useEffect } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebase";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "../../../context/AuthContext";

import EventsSidebar from "./EventsSidebar";
import BasicInformation from "./steps/BasicInformation";
import ScheduleLocation from "./steps/ScheduleLocation";
import OrganizerDetails from "./steps/OrganizerDetails";
import ParticipantConfiguration from "./steps/ParticipantConfiguration";
import PricingPayments from "./steps/PricingPayments";
import OperationsManagement from "./steps/OperationsManagement";
import VisibilityPromotion from "./steps/VisibilityPromotion";
import EventAnalytics from "./steps/EventAnalytics";

const EventsPage = () => {
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [eventId, setEventId] = useState("");
  const [formData, setFormData] = useState({
    participants: { customers: [] },
    banners: [],
  });

  useEffect(() => {
    setEventId(uuidv4());
  }, []);

  // ✅ SAVE DRAFT
  const saveDraft = async () => {
    if (!eventId || !user?.uid) return;

    try {
      await setDoc(
        doc(db, "events", eventId),
        {
          ...formData,
          instituteId: user.uid,
          eventId: eventId,
          status: "draft",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      alert("Draft Saved Successfully");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Error saving draft");
    }
  };

  // ✅ NEXT BUTTON
  const next = async () => {
    if (!eventId || !user?.uid) return;

    try {
      await setDoc(
        doc(db, "events", eventId),
        {
          ...formData,
          instituteId: user.uid,
          eventId: eventId,
          status: "in-progress",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      if (step < 8) {
        setStep((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error saving step:", error);
      alert("Error saving step");
    }
  };

  const back = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  // ✅ STEP RENDER
  const renderStep = () => {
    switch (step) {
      case 1:
        return <BasicInformation formData={formData} setFormData={setFormData} />;
      case 2:
        return <ScheduleLocation formData={formData} setFormData={setFormData} />;
      case 3:
        return <OrganizerDetails formData={formData} setFormData={setFormData} />;
      case 4:
        return <ParticipantConfiguration formData={formData} setFormData={setFormData} />;
      case 5:
        return <PricingPayments formData={formData} setFormData={setFormData} />;
      case 6:
        return <OperationsManagement formData={formData} setFormData={setFormData} />;
      case 7:
        return <VisibilityPromotion formData={formData} setFormData={setFormData} />;
      case 8:
        return <EventAnalytics formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#E7B89E] px-4 sm:px-6 lg:px-10 py-8">

      {/* ================= TOP HEADING ================= */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">
          Organize a New Event
        </h1>
        <p className="text-gray-800 mt-2 text-sm sm:text-base">
          From registration to check-in – manage everything in one place.
        </p>
      </div>
      {/* Thin Divider Line */}
<div className="max-w-7xl mx-auto border-b border-black/20 mb-8"></div>


      {/* ================= MAIN LAYOUT ================= */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">

        {/* ================= Sidebar ================= */}
        <div className="
          w-full 
          lg:w-72 
          bg-white
          rounded-2xl 
          p-5 
          shadow-md
        ">
          <EventsSidebar step={step} setStep={setStep} />
        </div>

        {/* ================= Main Content ================= */}
        <div className="
          flex-1 
          bg-white 
          rounded-2xl 
          shadow-md 
          p-4 
          sm:p-6 
          lg:p-8
        ">

          {/* Back Button */}
          {step > 1 && (
            <button
              onClick={back}
              className="text-orange-600 font-medium mb-6"
            >
              ← Back
            </button>
          )}

          {/* Step Content */}
          {renderStep()}

         {/* Bottom Buttons */}
{![ 8].includes(step) && (
  <div className="flex flex-col sm:flex-row justify-end gap-4 mt-10">
              <button
                onClick={saveDraft}
                className="
                  border border-orange-500 
                  text-orange-600 
                  px-6 py-2 
                  rounded-lg 
                  hover:bg-orange-50 
                  transition
                "
              >
                Save Draft
              </button>

              <button
                onClick={next}
                className="
                  bg-orange-500 
                  text-white 
                  px-8 py-2 
                  rounded-lg 
                  hover:bg-orange-600 
                  transition
                "
              >
                Next
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EventsPage;
