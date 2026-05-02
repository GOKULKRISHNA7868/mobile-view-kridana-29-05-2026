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
  const [geoLoading, setGeoLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullAddress: "",
    landmark: "",
    distance: "",
    phoneNumber: "",
    email: "",
    website: "",
    latitude: "",
    longitude: "",
  });

  const [errors, setErrors] = useState({});

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "trainers", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setFormData({
            fullAddress:
              data?.locationAccessibility?.fullAddress ||
              data?.locationName ||
              "",
            landmark: data?.locationAccessibility?.landmark || "",
            distance: data?.locationAccessibility?.distance || "",
            phoneNumber: data?.phoneNumber || "",
            email: data?.email || "",
            website: data?.locationAccessibility?.website || "",
            latitude: data?.latitude || "",
            longitude: data?.longitude || "",
          });
        }
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  /* ================= INPUT CHANGE ================= */
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

  /* ================= LOCATION (WEB + APP) ================= */
  const fetchCurrentLocation = async () => {
    try {
      setGeoLoading(true);

      let lat, lng;

      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.requestPermissions();

        if (permission.location !== "granted") {
          alert("Location permission denied");
          setGeoLoading(false);
          return;
        }

        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
        });

        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } else {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
          });
        });

        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }

      const latStr = lat.toString();
      const lngStr = lng.toString();

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latStr}&lon=${lngStr}`,
      );

      const data = await res.json();

      const address = data?.display_name || "";

      setFormData((prev) => ({
        ...prev,
        latitude: latStr,
        longitude: lngStr,
        fullAddress: address,
      }));
    } catch (error) {
      console.error(error);
      alert("Unable to fetch location");
    } finally {
      setGeoLoading(false);
    }
  };

  /* ================= VALIDATION ================= */
  const validate = () => {
    let newErrors = {};

    ["fullAddress", "landmark", "distance", "phoneNumber", "email"].forEach(
      (field) => {
        if (!formData[field]?.trim()) {
          newErrors[field] = "Required";
        }
      },
    );

    if (formData.phoneNumber && !/^[0-9]{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Enter valid 10 digit number";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!user?.uid) return;

    if (!validate()) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);

      await setDoc(
        doc(db, "trainers", user.uid),
        {
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          latitude: formData.latitude,
          longitude: formData.longitude,
          locationName: formData.fullAddress,

          locationAccessibility: {
            fullAddress: formData.fullAddress,
            landmark: formData.landmark,
            distance: formData.distance,
            website: formData.website,
          },

          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      alert("Saved Successfully!");
    } catch (error) {
      console.error(error);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  const inputClass = (field) =>
    `border ${
      errors[field] ? "border-red-500" : "border-gray-300"
    } rounded-md px-3 py-2`;

  return (
    <div className="w-full">
      <div
        onClick={() => setStep(1)}
        className="cursor-pointer text-orange-600 mb-4"
      >
        ← Back
      </div>

      <h2 className="text-orange-500 font-semibold text-xl mb-6">
        Location & Accessibility
      </h2>

      <button
        onClick={fetchCurrentLocation}
        className="mb-5 text-orange-600 font-medium"
      >
        {geoLoading ? "Fetching location..." : "Use Current Location"}
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <textarea
          rows={4}
          name="fullAddress"
          value={formData.fullAddress}
          onChange={handleChange}
          className={`${inputClass("fullAddress")} sm:col-span-2`}
        />

        <input
          name="landmark"
          value={formData.landmark}
          onChange={handleChange}
          placeholder="Landmark"
          className={inputClass("landmark")}
        />

        <input
          name="distance"
          value={formData.distance}
          onChange={handleChange}
          placeholder="Distance"
          className={inputClass("distance")}
        />

        <input
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="Phone Number"
          className={inputClass("phoneNumber")}
        />

        <input
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className={inputClass("email")}
        />

        <input
          name="latitude"
          value={formData.latitude}
          onChange={handleChange}
          placeholder="Latitude"
          className={inputClass("latitude")}
        />

        <input
          name="longitude"
          value={formData.longitude}
          onChange={handleChange}
          placeholder="Longitude"
          className={inputClass("longitude")}
        />

        <input
          name="website"
          value={formData.website}
          onChange={handleChange}
          placeholder="Website"
          className={`${inputClass("website")} sm:col-span-2`}
        />
      </div>

      <div className="flex gap-4 mt-8 justify-end">
        <button className="text-orange-600">Cancel</button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 text-white px-6 py-2 rounded-md"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default LocationAccessibility;
