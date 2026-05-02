import React, { useRef } from "react";
import { storage } from "../../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const VisibilityPromotion = ({ formData, setFormData }) => {
  const fileInputRef = useRef(null);

  const publish = formData?.promotion?.publish || false;
  const banners = formData?.promotion?.banners || [];

  /* ================= Upload Banners ================= */
  const uploadBanners = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const existingCount = banners.length;

    if (existingCount + files.length > 3) {
      alert("You can upload maximum 3 banners only.");
      return;
    }

    const urls = [];

    for (let file of files) {
      const storageRef = ref(
        storage,
        `eventBanners/${Date.now()}_${file.name}`,
      );

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      urls.push(url);
    }

    setFormData((prev) => ({
      ...prev,
      promotion: {
        ...(prev.promotion || {}),
        banners: [...banners, ...urls],
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
        banners: updated,
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
        banners: banners,
      },
    }));
  };

  return (
    <div className="w-full px-4 sm:px-4 md:px-4 lg:px-6 pt-6 pb-12">
      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-8">
        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold mb-8">
          Visibility Promotion
        </h2>

        {/* ================= Publish Section ================= */}
        <div className="mb-12">
          <p className="font-semibold text-sm sm:text-base mb-6">
            Publish Event*
          </p>

          <div className="space-y-5">
            {/* Enable */}
            <div className="flex items-center justify-between sm:justify-start gap-6">
              <span className="text-sm text-gray-700">Enable</span>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={publish === true}
                  onChange={() => togglePublish(true)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-orange-500 transition-all"></div>
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transform peer-checked:translate-x-5 transition-all"></div>
              </label>
            </div>

            {/* Disable */}
            <div className="flex items-center justify-between sm:justify-start gap-6">
              <span className="text-sm text-gray-700">Disable</span>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={publish === false}
                  onChange={() => togglePublish(false)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-gray-400 transition-all"></div>
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transform peer-checked:translate-x-5 transition-all"></div>
              </label>
            </div>
          </div>
        </div>

        {/* ================= Upload Section ================= */}
        <div className="mb-6">
          <label className="block font-semibold mb-4 text-sm sm:text-base">
            Upload the banners*
          </label>

          <div
            onClick={() => fileInputRef.current.click()}
            className="w-full border border-orange-300 rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-orange-50 transition"
          >
            <span className="text-gray-500 text-sm sm:text-base truncate">
              {banners.length
                ? `${banners.length} banner(s) uploaded`
                : "Upload banners"}
            </span>

            <img
              src="/upload.png"
              alt="Upload"
              className="w-5 h-5 object-contain"
            />
          </div>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={uploadBanners}
            className="hidden"
          />
        </div>

        {/* NOTE */}
        <p className="text-sm leading-6 mt-6">
          <span className="text-red-500 font-semibold">NOTE :</span> When the
          Publish option is enabled, the institute and trainers will be
          displayed on separate screens as promotional advertisements within the
          platform.
        </p>

        {/* ================= Banner Preview ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-10">
          {banners.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt="banner"
                className="w-full h-32 sm:h-28 object-cover rounded-lg shadow"
              />

              <button
                type="button"
                onClick={() => removeBanner(i)}
                className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
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
