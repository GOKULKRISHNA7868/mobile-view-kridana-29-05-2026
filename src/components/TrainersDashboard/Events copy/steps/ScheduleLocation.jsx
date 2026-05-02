import React from "react";

// 🔥 Firestore + Auth
import { db } from "../../../../firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const ScheduleLocation = ({ formData, setFormData, step, setStep }) => {
  const inputStyle =
    "w-full border border-orange-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none";

  const auth = getAuth();

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value,
      },
    }));
  };

  const toggleMode = (mode) => {
    handleChange("eventMode", mode);
  };

  const handleSaveDraft = () => {
    console.log("Draft Saved:", formData);
    localStorage.setItem("eventDraft", JSON.stringify(formData));
    alert("Draft Saved Successfully!");
  };

  // ==========================
  // 🔥 Firestore Save Logic
  // ==========================
  const saveScheduleLocation = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        console.error("Institute not logged in ❌");
        return;
      }

      const instituteId = user.uid;

      const eventRef = doc(db, "events", instituteId);

      const scheduleLocationData = {
        startDate: formData?.schedule?.startDate || "",
        endDate: formData?.schedule?.endDate || "",
        startTime: formData?.schedule?.startTime || "",
        endTime: formData?.schedule?.endTime || "",
        registrationDeadline: formData?.schedule?.registrationDeadline || "",
        eventMode: formData?.schedule?.eventMode || "",
        venueName: formData?.schedule?.venueName || "",
        address: formData?.schedule?.address || "",
        createdAt: new Date(),
      };

      await setDoc(
        eventRef,
        {
          scheduleLocation: arrayUnion(scheduleLocationData),
        },
        { merge: true },
      );

      console.log("Schedule & Location saved successfully ✅");
    } catch (error) {
      console.error("Error saving Schedule & Location ❌", error);
    }
  };

  // ==========================
  // Next Step
  // ==========================
  const handleNext = async () => {
    await saveScheduleLocation(); // 🔥 save to firestore
    setStep(step + 1); // move to next step
  };

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-bold mb-8">
        Schedule & Location
      </h2>

      {/* MAIN GRID */}
      <div className="grid grid-cols-2 gap-6">
        {/* Start Date */}
        <div>
          <label className="block font-medium mb-2">Start Date *</label>
          <input
            type="date"
            className={inputStyle}
            value={formData?.schedule?.startDate || ""}
            onChange={(e) => handleChange("startDate", e.target.value)}
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block font-medium mb-2">End Date *</label>
          <input
            type="date"
            className={inputStyle}
            value={formData?.schedule?.endDate || ""}
            onChange={(e) => handleChange("endDate", e.target.value)}
          />
        </div>

        {/* Start Time */}
        <div>
          <label className="block font-medium mb-2">Start Time *</label>
          <input
            type="time"
            className={inputStyle}
            value={formData?.schedule?.startTime || ""}
            onChange={(e) => handleChange("startTime", e.target.value)}
          />
        </div>

        {/* End Time */}
        <div>
          <label className="block font-medium mb-2">End Time *</label>
          <input
            type="time"
            className={inputStyle}
            value={formData?.schedule?.endTime || ""}
            onChange={(e) => handleChange("endTime", e.target.value)}
          />
        </div>

        {/* Registration Deadline */}
        <div>
          <label className="block font-medium mb-2">
            Registration Deadline *
          </label>
          <input
            type="date"
            className={inputStyle}
            value={formData?.schedule?.registrationDeadline || ""}
            onChange={(e) =>
              handleChange("registrationDeadline", e.target.value)
            }
          />
        </div>

        {/* Event Mode */}
        <div>
          <label className="block font-medium mb-2">Event Mode *</label>

          <div className="flex border border-orange-300 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleMode("Online")}
              className={`flex-1 py-2 ${
                formData?.schedule?.eventMode === "Online"
                  ? "bg-orange-500 text-white"
                  : "bg-white text-orange-500"
              }`}
            >
              Online
            </button>
            <div className="w-[1px] bg-orange-300"></div>
            <button
              type="button"
              onClick={() => toggleMode("Offline")}
              className={`flex-1 py-2 ${
                formData?.schedule?.eventMode === "Offline"
                  ? "bg-orange-500 text-white"
                  : "bg-white text-orange-500"
              }`}
            >
              Offline
            </button>
          </div>
        </div>

        {/* Venue Name */}
        <div>
          <label className="block font-medium mb-2">Venue Name *</label>
          <input
            type="text"
            className={inputStyle}
            value={formData?.schedule?.venueName || ""}
            onChange={(e) => handleChange("venueName", e.target.value)}
          />
        </div>

        {/* Map */}
        <div className="row-span-3">
          <div className="border border-orange-300 rounded-lg overflow-hidden h-[230px]">
            <iframe
              width="100%"
              height="100%"
              src="https://maps.google.com/maps?q=Washington&t=&z=13&ie=UTF8&iwloc=&output=embed"
              title="map"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block font-medium mb-2">Address *</label>
          <input
            type="text"
            className={inputStyle}
            value={formData?.schedule?.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
          />
        </div>
      </div>

      {/* Hidden save trigger (UI untouched) */}
      <div className="hidden">
        <button onClick={saveScheduleLocation}>Save</button>
      </div>
    </div>
  );
};

export default ScheduleLocation;
