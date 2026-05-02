import React, { useState } from "react";
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const AddSportsFacilitiesPage = () => {
  const { user, institute } = useAuth();
  const [step, setStep] = useState(1);
  const storage = getStorage();

  const [formData, setFormData] = useState({
    // Step 1
    instituteName: "",
    contactNumber: "",
    email: "",
    operatingHours: "",
    location: "",

    // Step 2
    sportsProviding: "",
    amenities: "",
    capacityPlayers: "",
    pricePerHour: "",
    advanceAmount: "",
    aboutVenue: "",
    courtImages: [],

    // Step 3
    month: "March, 2026",
    startTime: "",
    endTime: "",
    selectedDates: [],

    // Step 4
    cancellationPolicy: "",
  });

  const inputStyle =
    "w-full border-2 border-orange-400 rounded-lg px-4 py-3 bg-white " +
    "focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition";

  const toggleDate = (day) => {
    if (formData.selectedDates.includes(day)) {
      setFormData({
        ...formData,
        selectedDates: formData.selectedDates.filter((d) => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        selectedDates: [...formData.selectedDates, day],
      });
    }
  };
  const uploadMultipleToCloudinary = async (files) => {
    const urls = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "kridana_upload");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/daiyvial8/image/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();

      if (data.secure_url) {
        urls.push(data.secure_url);
      }
    }

    return urls;
  };
  const handleFinalSubmit = async () => {
    if (!user || institute?.role !== "institute") {
      alert("Unauthorized");
      return;
    }

    try {
      const instituteId = user.uid;
      const facilityId = Date.now().toString();

      const facilityRef = doc(
        db,
        "institutes",
        instituteId,
        "sportsfacilities",
        facilityId,
      );

      // ✅ CLOUDINARY UPLOAD (REPLACED)
      let imageUrls = [];

      if (formData.courtImages.length > 0) {
        imageUrls = await uploadMultipleToCloudinary(formData.courtImages);
      }

      // ✅ SAVE DATA
      const dataToSave = {
        instituteId,
        facilityId,

        basicDetails: {
          instituteName: formData.instituteName || "",
          contactNumber: formData.contactNumber || "",
          email: formData.email || "",
          operatingHours: formData.operatingHours || "",
          location: formData.location || "",
        },

        facilityDetails: {
          sportsProviding: formData.sportsProviding || "",
          amenities: formData.amenities
            ? formData.amenities.split(",").map((a) => a.trim())
            : [],
          capacityPlayers: Number(formData.capacityPlayers) || 0,
          pricePerHour: Number(formData.pricePerHour) || 0,
          advanceAmount: Number(formData.advanceAmount) || 0,
          aboutVenue: formData.aboutVenue || "",
          courtImages: imageUrls, // ✅ FROM CLOUDINARY
        },

        availability: {
          month: formData.month,
          startTime: formData.startTime,
          endTime: formData.endTime,
          selectedDates: formData.selectedDates || [],
        },

        policies: {
          cancellationPolicy: formData.cancellationPolicy || "",
        },

        createdAt: serverTimestamp(),
      };

      await setDoc(facilityRef, dataToSave);

      alert("Facility Added Successfully ✅");

      setStep(1);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };
  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-12 py-10">
      {/* HEADER */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-orange-600">
          Add Sports Facilities
        </h1>
        <p className="text-gray-600 mt-2">
          Configure courts, capacity, and availability for seamless bookings
        </p>
      </div>

      {/* ================= STEP 1 ================= */}
      {step === 1 && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: "Institute Name", key: "instituteName" },
              { label: "Contact Number", key: "contactNumber" },
              { label: "Email", key: "email" },
              { label: "Operating Hours", key: "operatingHours" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block font-semibold mb-2">
                  {field.label}
                </label>
                <input
                  className={inputStyle}
                  value={formData[field.key]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [field.key]: e.target.value,
                    })
                  }
                />
              </div>
            ))}
          </div>

          {/* Location + Fetch Button */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="md:col-span-2">
              <label className="block font-semibold mb-2">Location</label>
              <input
                className={inputStyle}
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) {
                  alert("Geolocation not supported");
                  return;
                }

                navigator.geolocation.getCurrentPosition((position) => {
                  const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
                  setFormData((prev) => ({ ...prev, location: coords }));
                });
              }}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Fetch Location
            </button>
          </div>

          <div className="flex gap-4 pt-6">
            <button className="px-8 py-2 border-2 border-orange-500 rounded-md">
              Cancel
            </button>

            <button
              onClick={() => setStep(2)}
              className="px-10 py-2 bg-orange-500 text-white rounded-md"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2 ================= */}
      {step === 2 && (
        <div className="space-y-8">
          <h2 className="text-xl font-bold">Court & Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sports Providing */}
            <div>
              <label className="block font-semibold mb-2">
                Sports Providing
              </label>
              <input
                className={inputStyle}
                value={formData.sportsProviding}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sportsProviding: e.target.value,
                  })
                }
              />
            </div>

            {/* Amenities */}
            <div>
              <label className="block font-semibold mb-2">Amenities</label>
              <input
                className={inputStyle}
                value={formData.amenities}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amenities: e.target.value,
                  })
                }
              />
            </div>

            {/* Capacity Players */}
            <div>
              <label className="block font-semibold mb-2">
                Capacity Players
              </label>
              <input
                className={inputStyle}
                value={formData.capacityPlayers}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacityPlayers: e.target.value,
                  })
                }
              />
            </div>

            {/* Price Per Hour */}
            <div>
              <label className="block font-semibold mb-2">Price Per Hour</label>
              <input
                className={inputStyle}
                value={formData.pricePerHour}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pricePerHour: e.target.value,
                  })
                }
              />
            </div>

            {/* Advance Amount */}
            <div>
              <label className="block font-semibold mb-2">Advance Amount</label>
              <input
                className={inputStyle}
                value={formData.advanceAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    advanceAmount: e.target.value,
                  })
                }
              />
            </div>

            {/* Upload Court Images (NOW SAME ROW AS ADVANCE) */}
            <div>
              <label className="block font-semibold mb-2">
                Upload Court Images
              </label>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    courtImages: Array.from(e.target.files),
                  })
                }
                className={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">About Venue</label>
            <textarea
              rows="4"
              className={inputStyle}
              value={formData.aboutVenue}
              onChange={(e) =>
                setFormData({ ...formData, aboutVenue: e.target.value })
              }
            />
          </div>

          <div className="flex gap-4 pt-6">
            <button
              onClick={() => setStep(1)}
              className="px-8 py-2 border-2 border-orange-500 rounded-md"
            >
              Back
            </button>

            <button
              onClick={() => setStep(3)}
              className="px-10 py-2 bg-orange-500 text-white rounded-md"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3 ================= */}
      {step === 3 && (
        <div className="space-y-8">
          <div className="bg-gray-100 rounded-xl p-6 md:p-8">
            <h2 className="text-lg font-bold mb-6">Date & Time</h2>

            {/* Top Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <select className={inputStyle}>
                <option>March, 2026</option>
              </select>

              <select
                className={inputStyle}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
              >
                <option value="">Start Time</option>
                <option>06:00 AM</option>
                <option>07:00 AM</option>
              </select>

              <select
                className={inputStyle}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
              >
                <option value="">End Time</option>
                <option>08:00 PM</option>
                <option>09:00 PM</option>
              </select>
            </div>

            {/* Calendar + Selected */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendar */}
              <div className="bg-white p-4 rounded-lg">
                <div className="grid grid-cols-7 gap-2 text-center text-sm">
                  {[...Array(31)].map((_, i) => {
                    const day = i + 1;
                    const selected = formData.selectedDates.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDate(day)}
                        className={`py-2 rounded-md ${
                          selected
                            ? "bg-orange-500 text-white"
                            : "hover:bg-gray-200"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Dates */}
              <div className="border-2 border-orange-400 rounded-lg p-6 min-h-[220px]">
                <p className="font-semibold mb-4">Selected Dates</p>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.selectedDates.map((date) => {
                    const fullDate = new Date(2026, 2, date);
                    const dayName = fullDate.toLocaleDateString("en-US", {
                      weekday: "short",
                    });
                    const formattedDate = fullDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={date}
                        className="bg-orange-200 rounded-md py-2 text-center text-xs font-medium"
                      >
                        <div>{dayName}</div>
                        <div>{formattedDate}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              onClick={() => setStep(2)}
              className="px-8 py-2 border-2 border-orange-500 rounded-md"
            >
              Back
            </button>

            <button
              onClick={() => setStep(4)}
              className="px-10 py-2 bg-orange-500 text-white rounded-md"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4 ================= */}
      {step === 4 && (
        <div className="space-y-8">
          <div className="bg-white rounded-xl p-6 md:p-8">
            <h2 className="text-lg font-bold mb-6 underline">
              Cancellation Policy
            </h2>

            <textarea
              rows="8"
              className="w-full border-2 border-orange-400 rounded-lg px-4 py-4 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition resize-none"
              value={formData.cancellationPolicy}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cancellationPolicy: e.target.value,
                })
              }
            />
          </div>

          <div className="flex gap-4 pt-6">
            <button
              onClick={() => setStep(3)}
              className="px-8 py-2 border-2 border-orange-500 rounded-md"
            >
              Cancel
            </button>

            <button
              onClick={handleFinalSubmit}
              className="px-10 py-2 bg-orange-500 text-white rounded-md"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSportsFacilitiesPage;
