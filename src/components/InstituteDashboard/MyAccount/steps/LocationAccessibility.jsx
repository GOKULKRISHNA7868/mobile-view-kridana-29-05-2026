import React, { useEffect, useState } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
const LocationAccessibility = ({ setStep }) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locLoading, setLocLoading] = useState(false); // 🔥 location loading

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationName, setLocationName] = useState("");
  // 🔥 ADD THESE STATES (already exist in previous logic version)

  const [formData, setFormData] = useState({
    fullAddress: "",
    landmark: "",
    distance: "",
    contactNumber: "",
    email: "",
    website: "",
  });

  const [errors, setErrors] = useState({});

  // ✅ LOAD EXISTING DATA
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const instituteId = user.uid;
        const docRef = doc(db, "institutes", instituteId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          const addressParts = [
            data.street,
            data.building,
            data.city,
            data.district,
            data.state,
            data.zipCode,
            data.country,
          ].filter(Boolean);

          setFormData({
            fullAddress: data.street || addressParts.join(", "),
            landmark: data.landmark || "",
            distance: "",
            contactNumber: data.phoneNumber || "",
            email: data.email || "",
            website: data.websiteLink || "",
          });

          // 🔥 load location fields
          setLatitude(data.latitude || "");
          setLongitude(data.longitude || "");
          setLocationName(data.locationName || "");
        } else {
          setFormData({
            fullAddress: "",
            landmark: "",
            distance: "",
            contactNumber: "",
            email: "",
            website: "",
          });
        }
      } catch (error) {
        console.error("Error loading institute data:", error);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // 🔥 GET CURRENT LOCATION
  const handleGetLocation = async () => {
    try {
      setLocLoading(true);

      let lat;
      let lon;

      // ✅ MOBILE APP (Capacitor Android/iOS)
      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.requestPermissions();

        if (
          permission.location !== "granted" &&
          permission.coarseLocation !== "granted"
        ) {
          alert("Location permission denied");
          setLocLoading(false);
          return;
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });

        lat = position.coords.latitude;
        lon = position.coords.longitude;
      }

      // ✅ DESKTOP / WEB
      else {
        if (!navigator.geolocation) {
          alert("Geolocation not supported");
          setLocLoading(false);
          return;
        }

        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });

        lat = position.coords.latitude;
        lon = position.coords.longitude;
      }

      // ✅ SET LOCATION
      setLatitude(String(lat));
      setLongitude(String(lon));

      // 🌍 Reverse Geocoding
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      );

      const data = await res.json();

      const address = data.display_name || "";

      setLocationName(address);

      setFormData((prev) => ({
        ...prev,
        fullAddress: address,
      }));

      setLocLoading(false);
    } catch (error) {
      console.error(error);
      alert("Unable to fetch location");
      setLocLoading(false);
    }
  };
  // ✅ HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // ✅ VALIDATION
  const validate = () => {
    let newErrors = {};

    const requiredFields = [
      "fullAddress",
      "landmark",
      "distance",
      "contactNumber",
      "email",
    ];

    requiredFields.forEach((field) => {
      const value = formData[field];

      if (!value || String(value).trim() === "") {
        newErrors[field] = "This field is required";
      }
    });

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Enter valid email address";
      }
    }

    if (formData.contactNumber) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.contactNumber)) {
        newErrors.contactNumber = "Enter valid 10 digit number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ SAVE
  const handleSave = async () => {
    if (!user?.uid) {
      alert("User not logged in");
      return;
    }

    const isValid = validate();
    if (!isValid) {
      alert("Please fill all required details correctly.");
      return;
    }

    try {
      setSaving(true);

      const instituteId = user.uid;
      const docRef = doc(db, "institutes", instituteId);

      await setDoc(
        docRef,
        {
          street: formData.fullAddress, // full address
          landmark: formData.landmark,
          phoneNumber: formData.contactNumber,
          email: formData.email,
          websiteLink: formData.website,

          // 🔥 NEW LOCATION FIELDS
          latitude: latitude || "",
          longitude: longitude || "",
          locationName: locationName || formData.fullAddress,

          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      alert("Saved Successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving data");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  const handleCancel = () => {
    setFormData({
      fullAddress: "",
      landmark: "",
      distance: "",
      contactNumber: "",
      email: "",
      website: "",
    });
    setErrors({});
  };

  const inputClass = (field) =>
    `border ${
      errors[field] ? "border-red-500" : "border-gray-300"
    } rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500`;

  return (
    <div className="w-full">
      {/* BACK */}
      <div
        onClick={() => setStep(1)}
        className="flex items-center gap-2 text-orange-600 font-medium mb-4 cursor-pointer"
      >
        ← Back
      </div>

      <div className="border-b border-gray-300 mb-6"></div>

      {/* TITLE */}
      <h2 className="text-orange-500 font-semibold text-lg sm:text-xl mb-3">
        Location & Accessibility
      </h2>

      {/* 🔥 LOCATION BUTTON (NEW, UI SAFE) */}
      <button
        type="button"
        onClick={handleGetLocation}
        disabled={locLoading}
        className="mb-5 text-sm bg-orange-100 text-orange-700 px-4 py-2 rounded-md hover:bg-orange-200 transition"
      >
        {locLoading ? "Fetching location..." : "📍 Use Current Location"}
      </button>

      {/* FORM UI (UNCHANGED) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Full Address */}
        <div className="flex flex-col sm:col-span-2">
          <label className="text-sm font-medium mb-2">
            Full Address <span className="text-red-500">*</span>
          </label>
          <textarea
            name="fullAddress"
            value={formData.fullAddress}
            onChange={handleChange}
            rows={4}
            className={`${inputClass("fullAddress")} resize-none`}
          />
          {errors.fullAddress && (
            <span className="text-red-500 text-sm mt-1">
              {errors.fullAddress}
            </span>
          )}
        </div>

        {[
          { label: "Land Mark", name: "landmark" },
          { label: "Distance From User (Auto)", name: "distance" },
          { label: "Contact Number", name: "contactNumber" },
          { label: "E-mail Address", name: "email" },
        ].map((field) => (
          <div className="flex flex-col" key={field.name}>
            <label className="text-sm font-medium mb-2">
              {field.label} <span className="text-red-500">*</span>
            </label>
            <input
              name={field.name}
              value={formData[field.name]}
              maxLength={field.name === "contactNumber" ? 10 : undefined}
              onChange={(e) => {
                let value = e.target.value;

                if (field.name === "contactNumber") {
                  value = value.replace(/\D/g, ""); // allow only numbers
                }

                setFormData((prev) => ({
                  ...prev,
                  [field.name]: value,
                }));

                setErrors((prev) => ({
                  ...prev,
                  [field.name]: "",
                }));
              }}
              className={inputClass(field.name)}
            />
            {errors[field.name] && (
              <span className="text-red-500 text-sm mt-1">
                {errors[field.name]}
              </span>
            )}
          </div>
        ))}
        {/* 🔥 Latitude & Longitude */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">Latitude</label>
          <input
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            placeholder="e.g. 17.48930115508228"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium mb-2">Longitude</label>
          <input
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            placeholder="e.g. 78.3985042909833"
          />
        </div>
        {/* Website */}
        <div className="flex flex-col sm:col-span-2">
          <label className="text-sm font-medium mb-2">
            Website / Social Media Links
          </label>
          <input
            name="website"
            value={formData.website}
            onChange={handleChange}
            className={inputClass("website")}
          />
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
        <button
          onClick={handleCancel}
          className="text-orange-600 font-medium hover:text-black transition"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default LocationAccessibility;
