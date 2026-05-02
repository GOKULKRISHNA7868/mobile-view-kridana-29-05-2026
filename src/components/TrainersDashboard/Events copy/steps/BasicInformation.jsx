import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { storage } from "../../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// 🔥 Firestore + Auth
import { db } from "../../../../firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const BasicInformation = ({ formData, setFormData }) => {
  const [preview, setPreview] = useState(formData?.basicInfo?.banner || null);
  const eventTypeRef = useRef(null);
  const categoryRef = useRef(null);

  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const inputStyle =
    "w-full border border-orange-400 rounded-md px-4 py-2 bg-white outline-none";

  const auth = getAuth();

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        [field]: value,
      },
    }));
  };

  // ==========================
  // Banner Upload
  // ==========================
  const uploadBanner = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const storageRef = ref(
        storage,
        `eventBanners/${Date.now()}_${file.name}`,
      );

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setPreview(url);
      handleChange("banner", url);
    } catch (err) {
      console.error("Banner upload failed ❌", err);
    }
  };

  // ==========================
  // Firestore Save Logic
  // ==========================
  const saveBasicInformation = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        console.error("Institute not logged in ❌");
        return;
      }

      const instituteId = user.uid;

      const eventRef = doc(db, "events", instituteId);

      const basicInfoData = {
        eventName: formData?.basicInfo?.eventName || "",
        eventType: formData?.basicInfo?.eventType || "",
        category: formData?.basicInfo?.category || "",
        banner: formData?.basicInfo?.banner || "",
        description: formData?.basicInfo?.description || "",
        createdAt: new Date(),
      };

      await setDoc(
        eventRef,
        {
          basicInformation: arrayUnion(basicInfoData),
        },
        { merge: true },
      );

      console.log("Basic Information saved successfully ✅");
    } catch (error) {
      console.error("Error saving basic information ❌", error);
    }
  };
  useEffect(() => {
    const handleClickOutside = (e) => {

      if (eventTypeRef.current && !eventTypeRef.current.contains(e.target)) {
        setShowEventTypeDropdown(false);
      }

      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
      }

    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Basic Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Event Name*</label>
          <input
            type="text"
            className={inputStyle}
            value={formData?.basicInfo?.eventName || ""}
            onChange={(e) => handleChange("eventName", e.target.value)}
          />
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Event Type*</label>
          <div ref={eventTypeRef} className="relative">
            <button
              type="button"
              onClick={() => setShowEventTypeDropdown(!showEventTypeDropdown)}
              className={`${inputStyle} flex items-center justify-between text-left`}
            >
              <span>
                {formData?.basicInfo?.eventType || "Event Types"}
              </span>

              <ChevronDown
                size={18}
                className={`ml-2 transition-transform ${showEventTypeDropdown ? "rotate-180" : ""
                  }`}
              />
            </button>

            {showEventTypeDropdown && (
              <div className="absolute z-50 mt-1 w-full left-0 bg-white border rounded-lg shadow-md max-h-48 overflow-y-auto">

                {["Tournament", "Training Camp", "Workshop", "Trial Session", "Fitness Event", "Other"].map((type) => (
                  <div
                    key={type}
                    onClick={() => {
                      handleChange("eventType", type);
                      setShowEventTypeDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  >
                    {type}
                  </div>
                ))}

              </div>
            )}
          </div>
        </div>

        {/* Sports Categories */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Sports Categories*
          </label>
          <div ref={categoryRef} className="relative">
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className={`${inputStyle} flex items-center justify-between text-left`}
            >
              <span>
                {formData?.basicInfo?.category || "Select Categories"}
              </span>

              <ChevronDown
                size={18}
                className={`ml-2 transition-transform ${showCategoryDropdown ? "rotate-180" : ""
                  }`}
              />
            </button>

            {showCategoryDropdown && (
              <div className="absolute z-50 mt-1 w-full left-0 bg-white border rounded-lg shadow-md max-h-48 overflow-y-auto">

                {[
                  "Martial Arts",
                  "Team Ball Sports",
                  "Racket Sports",
                  "Fitness",
                  "Target & Precision Sports",
                  "Equestrian Sports",
                  "Adventure & Outdoor Sports",
                  "Ice Sports",
                  "Wellness",
                  "Dance"
                ].map((cat) => (
                  <div
                    key={cat}
                    onClick={() => {
                      handleChange("category", cat);
                      setShowCategoryDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  >
                    {cat}
                  </div>
                ))}

              </div>
            )}
          </div>
        </div>

        {/* Banner Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Event Banner & Images
          </label>

          <div className="border border-orange-400 rounded-md h-10 flex items-center justify-between px-3 bg-white">
            {preview ? (
              <img src={preview} alt="Banner" className="h-6 rounded" />
            ) : (
              <span className="text-gray-400 text-sm">Upload Banner</span>
            )}

            <label className="cursor-pointer text-orange-500 text-sm">
              <img
                src="/upload.png"
                alt="Upload"
                className="w-5 h-5 object-contain"
              />
              <input type="file" className="hidden" onChange={uploadBanner} />
            </label>
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">
            Add Description
          </label>

          <textarea
            rows="5"
            className={inputStyle}
            value={formData?.basicInfo?.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>
      </div>

      {/* SAVE BUTTON (logic hook, UI untouched if you already have Next/Save) */}
      {/* You can call this from parent instead */}
      <div className="hidden">
        <button onClick={saveBasicInformation}>Save</button>
      </div>
    </div>
  );
};

export default BasicInformation;