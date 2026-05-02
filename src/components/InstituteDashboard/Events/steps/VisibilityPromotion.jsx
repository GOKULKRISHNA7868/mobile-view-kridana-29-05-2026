import React, { useRef, useState } from "react";

const VisibilityPromotion = ({ formData, setFormData }) => {
  const fileInputRef = useRef(null);
  const [showMessage, setShowMessage] = useState(false);

  const publish = formData?.promotion?.publish || false;
  const banners = formData?.promotion?.bannerurl || [];

  /* ================= Cloudinary Upload ================= */
  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "kridana_upload");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/daiyvial8/image/upload",
        {
          method: "POST",
          body: data,
        },
      );

      const result = await res.json();

      if (!result.secure_url) {
        throw new Error(result.error?.message || "Cloudinary upload failed");
      }

      return result.secure_url;
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      alert("Upload Failed: " + err.message);
      return "";
    }
  };

  /* ================= Upload Banners ================= */
  const uploadBanners = async (e) => {
    const files = Array.from(e.target.files);

    if (!files.length) return;

    if (banners.length + files.length > 3) {
      alert("Maximum 3 banners allowed");
      return;
    }

    const urls = [];

    for (const file of files) {
      const url = await uploadToCloudinary(file);
      if (url) urls.push(url);
    }

    setFormData((prev) => ({
      ...prev,
      promotion: {
        ...(prev.promotion || {}),
        bannerurl: [...banners, ...urls],
        publish: publish ?? false,
      },
    }));
  };

  /* ================= Remove Banner ================= */
  const removeBanner = (index) => {
    const updated = banners.filter((_, i) => i !== index);

    setFormData((prev) => ({
      ...prev,
      promotion: {
        ...(prev.promotion || {}),
        bannerurl: updated,
        publish: publish ?? false,
      },
    }));
  };

  /* ================= Toggle Publish ================= */
  const togglePublish = (value) => {
    setFormData((prev) => ({
      ...prev,
      promotion: {
        ...(prev.promotion || {}),
        publish: value,
        bannerurl: banners,
      },
    }));
  };

  return (
    <div className="w-full px-4 lg:px-6 pt-6 pb-12">
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-8">
        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold mb-8">
          Visibility Promotion
        </h2>

        {/* Publish Toggle */}
        <div className="mb-12">
          <p className="font-semibold mb-6">Publish Event*</p>

          <div className="space-y-5">
            {/* Enable */}
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-700">Enable</span>

              <input
                type="checkbox"
                checked={publish === true}
                onChange={() => togglePublish(true)}
              />
            </div>

            {/* Disable */}
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-700">Disable</span>

              <input
                type="checkbox"
                checked={publish === false}
                onChange={() => togglePublish(false)}
              />
            </div>
          </div>
        </div>

        {/* Upload Banner */}
        <div className="mb-6">
          <label className="block font-semibold mb-4">
            Upload the banners*
          </label>

          <div
            onClick={() => {
              setShowMessage(true);
              fileInputRef.current.click();
            }}
            className="w-full border border-orange-300 rounded-lg px-4 py-3 flex justify-between cursor-pointer hover:bg-orange-50"
          >
            <span className="text-gray-500">
              {banners.length
                ? `${banners.length} banner(s) uploaded`
                : "Upload banners"}
            </span>

            <img src="/upload.png" alt="Upload" className="w-5 h-5" />
          </div>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={uploadBanners}
            className="hidden"
          />
          {showMessage && (
            <p className="text-red-500 text-sm mt-2">
              Banner measurements should be Width - 1440px & Height - 500px
            </p>
          )}
        </div>

        {/* Note */}
        <p className="text-sm mt-6">
          <span className="text-red-500 font-semibold">NOTE :</span>
          When publish is enabled, banners will be shown as promotional ads.
        </p>

        {/* Banner Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-10">
          {banners.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt="banner"
                className="w-full h-32 object-cover rounded-lg shadow"
              />

              <button
                onClick={() => removeBanner(i)}
                className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VisibilityPromotion;
