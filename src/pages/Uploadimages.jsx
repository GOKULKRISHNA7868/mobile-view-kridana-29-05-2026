import React, { useState, useRef } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";

import {
  IoHeart,
  IoChatbubble,
  IoShareSocial,
  IoEllipsisHorizontal,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { getDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
export default function App() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [images, setImages] = useState([]);
  const [captions, setCaptions] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  // =========================================
  // FILE PICK
  // =========================================
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);

    setImages((prev) => {
      const existingKeys = new Set(
        prev.map((img) => img.file.name + img.file.size),
      );

      const currentImages = prev.filter((i) =>
        i.file.type.startsWith("image"),
      ).length;

      const currentVideos = prev.filter((i) =>
        i.file.type.startsWith("video"),
      ).length;

      let imageCount = currentImages;
      let videoCount = currentVideos;

      const newItems = [];

      for (const file of files) {
        const key = file.name + file.size;

        if (existingKeys.has(key)) continue;

        if (file.type.startsWith("image")) {
          if (imageCount >= 4) {
            alert("Maximum 4 images allowed");
            continue;
          }

          imageCount++;

          newItems.push({
            file,
            url: URL.createObjectURL(file),
            type: file.type,
          });
        } else if (file.type.startsWith("video")) {
          if (videoCount >= 1) {
            alert("Only one video allowed");
            continue;
          }

          videoCount++;

          newItems.push({
            file,
            url: URL.createObjectURL(file),
            type: file.type,
          });
        }
      }

      return [...prev, ...newItems];
    });

    e.target.value = null;
  };

  // =========================================
  // CLOUDINARY SINGLE UPLOAD
  // =========================================
  const uploadToCloudinary = async (file) => {
    const isVideo = file.type.startsWith("video");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "kirdana"); // same preset for all uploads

    const cloudUrl = isVideo
      ? "https://api.cloudinary.com/v1_1/dr0svrhu1/video/upload"
      : "https://api.cloudinary.com/v1_1/dr0svrhu1/image/upload";

    const res = await fetch(cloudUrl, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!data.secure_url) {
      throw new Error("Upload failed");
    }

    return data.secure_url;
  };

  // =========================================
  // FIND LOGIN COLLECTION
  // =========================================
  const getUserDocRef = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Please login first");

    const possibleRefs = [
      doc(db, "trainers", uid),
      doc(db, "institutes", uid),
      doc(db, "students", uid),
      doc(db, "trainerstudents", uid),
      doc(db, "users", uid),
    ];

    const validRefs = [];

    for (const ref of possibleRefs) {
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          validRefs.push(ref);
        }
      } catch (err) {}
    }

    if (validRefs.length === 0) {
      throw new Error("No profile found");
    }

    return validRefs;
  };
  // =========================================
  // FINAL SAVE
  // =========================================
  const handleFinalUpload = async () => {
    try {
      setLoading(true);

      const refs = await getUserDocRef();

      let imageData = [];
      let videoData = [];

      for (let item of images) {
        const cloudUrl = await uploadToCloudinary(item.file);

        const payload = {
          url: cloudUrl,
          about: captions[item.url] || "",
          createdAt: new Date(),
        };

        if (item.file.type.startsWith("video")) {
          videoData.push(payload);
        } else {
          imageData.push(payload);
        }
      }

      for (const refDoc of refs) {
        try {
          const updatePayload = {
            updatedAt: serverTimestamp(),
          };

          // keep old + add new
          if (imageData.length > 0) {
            updatePayload.trainingImages = arrayUnion(...imageData);
          }

          // keep old + add new reels
          if (videoData.length > 0) {
            updatePayload.reels = arrayUnion(...videoData);
          }

          await updateDoc(refDoc, updatePayload);
        } catch (err) {
          console.log(err);
        }
      }

      alert("Uploaded Successfully 🚀");

      setImages([]);
      setCaptions({});
      setCurrentIndex(0);
      setStep(1);
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };
  // =========================================
  // SCREEN 1
  // =========================================
  if (step === 1) {
    return (
      <div className="min-h-screen bg-[#FFF4ED] flex justify-center items-start px-4 pt-6">
        <div className="w-full max-w-md">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#FF6A00] font-semibold mb-6"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div
            onClick={() => fileInputRef.current.click()}
            className="w-full h-64 sm:h-72 border-2 border-dashed border-gray-500 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer bg-[#FFF4ED]"
          >
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#3d3733"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3"
            >
              <path d="M20 16.58A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 4 16.25" />
              <line x1="12" y1="12" x2="12" y2="20" />
              <polyline points="9 15 12 12 15 15" />
            </svg>

            <div className="text-center px-4">
              <h2 className="text-2xl font-bold text-[#3d3733]">
                Upload Your Images & Videos
              </h2>

              <p className="mt-2 text-gray-600">
                Showcase your training sessions, achievements, events, and
                memorable moments.
              </p>

              <p className="mt-3 text-sm text-orange-500 font-medium">
                Tap here to select files
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Up to 4 images and 1 video
              </p>
            </div>
          </div>

          <input
            type="file"
            multiple
            accept="image/*,video/*"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />
          {images.length > 0 &&
            !images.some((img) => img.type.startsWith("video")) &&
            images.filter((img) => img.type.startsWith("image")).length < 4 && (
              <div className="flex justify-end mt-3">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="border border-orange-500 text-orange-500 px-3 py-1 rounded text-sm"
                >
                  + Add More
                </button>
              </div>
            )}

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative">
                {img.type.startsWith("video") ? (
                  <video
                    src={img.url}
                    className="w-full h-28 object-cover rounded-lg"
                  />
                ) : (
                  <img
                    src={img.url}
                    className="w-full h-28 object-cover rounded-lg"
                  />
                )}

                <button
                  onClick={() =>
                    setImages(images.filter((_, index) => index !== i))
                  }
                  className="absolute top-1 right-1 bg-black text-white text-xs px-1 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              if (images.length === 0) {
                alert("Please upload at least one image or video");
                return;
              }
              setStep(2);
            }}
            className="w-full mt-10 bg-orange-500 text-black font-semibold py-3 rounded-lg text-lg"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // SCREEN 2
  // =========================================
  if (step === 2) {
    const current = images[currentIndex];

    return (
      <div className="min-h-screen bg-[#FFF4ED] flex justify-center items-start px-4 pt-6">
        <div className="w-full max-w-md">
          <button
            onClick={() => setStep(1)}
            className="mb-4 text-2xl text-[#3d3733]"
          >
            ←
          </button>

          {current.type.startsWith("video") ? (
            <video
              src={current.url}
              controls
              className="w-full h-72 object-cover rounded-2xl"
            />
          ) : (
            <img
              src={current.url}
              className="w-full h-72 object-cover rounded-2xl"
            />
          )}

          <p className="mt-3 text-sm font-medium text-[#3d3733]">
            Media {currentIndex + 1}
          </p>

          <textarea
            placeholder="Write Caption..."
            maxLength={150}
            value={captions[current.url] || ""}
            onChange={(e) =>
              setCaptions({
                ...captions,
                [current.url]: e.target.value,
              })
            }
            className="w-full mt-2 p-4 rounded-xl border border-orange-400 resize-none h-28"
          />

          <p className="text-xs text-gray-500 mt-1">
            {(captions[current.url] || "").length}/150 Characters
          </p>

          <button
            onClick={() => setStep(3)}
            className="w-full mt-6 bg-orange-500 text-black font-semibold py-3 rounded-lg text-lg"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // SCREEN 3
  // =========================================
  if (step === 3) {
    const current = images[currentIndex];

    return (
      <div className="min-h-screen bg-[#FFF4ED] flex justify-center items-start px-4 pt-6">
        <div className="w-full max-w-md">
          <button
            onClick={() => setStep(2)}
            className="mb-4 text-2xl text-[#3d3733]"
          >
            ←
          </button>

          <div className="relative">
            {current.type.startsWith("video") ? (
              <video
                src={current.url}
                controls
                className="w-full h-72 object-cover rounded-2xl"
              />
            ) : (
              <img
                src={current.url}
                className="w-full h-72 object-cover rounded-2xl"
              />
            )}

            <div className="absolute bottom-0 left-0 w-full bg-[#f4b183] px-3 py-2 flex justify-between items-center rounded-b-2xl">
              <p className="text-sm text-black truncate max-w-[60%]">
                {captions[current.url] || "Add caption..."}
              </p>

              <div className="flex items-center gap-4 text-lg">
                <IoHeart className="text-orange-500" />
                <IoChatbubble />
                <IoShareSocial />
                <IoEllipsisHorizontal />
              </div>
            </div>
          </div>

          <div className="mt-44 flex justify-end gap-4 pb-6">
            <button onClick={() => setStep(2)}>Cancel</button>

            <button
              onClick={handleFinalUpload}
              disabled={loading}
              className="bg-orange-500 text-black px-5 py-2 rounded-lg font-semibold"
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
