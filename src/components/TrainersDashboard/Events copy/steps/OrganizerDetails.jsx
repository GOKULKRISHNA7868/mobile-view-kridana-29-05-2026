import React, { useState, useEffect } from "react";
import { storage } from "../../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User } from "lucide-react";

// 🔥 Firestore + Auth
import { db } from "../../../../firebase";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const inputStyle =
  "w-full border border-orange-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-400 outline-none";

const OrganizerDetails = ({ formData, setFormData }) => {
  const [preview, setPreview] = useState(
    formData?.organizer?.organizerImage || null,
  );

  const auth = getAuth();

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      organizer: {
        ...prev.organizer,
        [field]: value,
      },
    }));
  };

  // ==========================
  // Upload Image
  // ==========================
  const uploadImage = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      console.log("Uploading file:", file.name);

      const storageRef = ref(storage, `organizers/${Date.now()}_${file.name}`);

      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      console.log("Download URL:", url);

      setPreview(url);
      handleChange("organizerImage", url);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Check console.");
    }
  };

  useEffect(() => {
    if (formData?.organizer?.organizerImage) {
      setPreview(formData.organizer.organizerImage);
    }
  }, [formData]);

  // ==========================
  // 🔥 Firestore Save Logic
  // ==========================
  const saveOrganizerDetails = async () => {
    try {
      const user = auth.currentUser;

      if (!user) {
        console.error("Institute not logged in ❌");
        return;
      }

      const instituteId = user.uid;

      const eventRef = doc(db, "events", instituteId);

      const organizerData = {
        organizerImage: formData?.organizer?.organizerImage || "",
        organizerName: formData?.organizer?.organizerName || "",
        volunteersName: formData?.organizer?.volunteersName || "",
        contactPerson: formData?.organizer?.contactPerson || "",
        phone: formData?.organizer?.phone || "",
        email: formData?.organizer?.email || "",
        emergencyContact: formData?.organizer?.emergencyContact || "",
        otherStaff: formData?.organizer?.otherStaff || "",
        createdAt: new Date(),
      };

      await setDoc(
        eventRef,
        {
          organizerDetails: arrayUnion(organizerData),
        },
        { merge: true },
      );

      console.log("Organizer Details saved successfully ✅");
    } catch (error) {
      console.error("Error saving Organizer Details ❌", error);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl md:text-2xl font-bold mb-6">Organizer Details</h2>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Image */}
        <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {preview ? (
              <img
                src={preview}
                alt="Organizer"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-gray-500" />
            )}
          </div>

          <label className="cursor-pointer border border-orange-500 px-4 py-2 rounded-lg text-orange-500 hover:bg-orange-50 flex items-center gap-2">
            <img
              src="/upload.png"
              alt="Upload"
              className="w-5 h-5 object-contain"
            />
            Upload Organizer Image
            <input type="file" className="hidden" onChange={uploadImage} />
          </label>
        </div>

        {/* Organizer Name */}
        <div>
          <label className="block font-medium mb-2">Organizer Name *</label>
          <input
            type="text"
            className={inputStyle}
            onChange={(e) => handleChange("organizerName", e.target.value)}
          />
        </div>

        {/* Volunteers Name */}
        <div>
          <label className="block font-medium mb-2">Volunteers Name *</label>
          <input
            type="text"
            className={inputStyle}
            onChange={(e) => handleChange("volunteersName", e.target.value)}
          />
        </div>

        {/* Contact Person */}
        <div>
          <label className="block font-medium mb-2">
            Contact Person Name *
          </label>
          <input
            type="text"
            className={inputStyle}
            onChange={(e) => handleChange("contactPerson", e.target.value)}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block font-medium mb-2">Phone Number *</label>
          <input
            type="tel"
            className={inputStyle}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block font-medium mb-2">Email ID *</label>
          <input
            type="email"
            className={inputStyle}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </div>

        {/* Emergency Contact */}
        <div>
          <label className="block font-medium mb-2">
            Emergency Contact Number *
          </label>
          <input
            type="tel"
            className={inputStyle}
            onChange={(e) => handleChange("emergencyContact", e.target.value)}
          />
        </div>

        {/* Other Staff */}
        <div>
          <label className="block font-medium mb-2">Other Staff *</label>
          <input
            type="text"
            className={inputStyle}
            onChange={(e) => handleChange("otherStaff", e.target.value)}
          />
        </div>
      </div>

      {/* Hidden save trigger (UI untouched) */}
      <div className="hidden">
        <button onClick={saveOrganizerDetails}>Save</button>
      </div>
    </div>
  );
};

export default OrganizerDetails;
