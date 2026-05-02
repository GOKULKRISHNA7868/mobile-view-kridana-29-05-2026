import React, { useEffect, useState } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";

const PricingTransparency = ({ setStep }) => {
  const { user } = useAuth(); // logged in trainer

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [trainerId, setTrainerId] = useState(null); // dynamic doc id

  const [formData, setFormData] = useState({
    monthlyFees: "",
    registrationFees: "",
    uniformCost: "",
    paymentMethods: "",
    refundPolicy: "",
  });

  const [errors, setErrors] = useState({});

  /* ============================
     🔥 FIND TRAINER DOC DYNAMICALLY
  ============================ */
  useEffect(() => {
    if (!user?.uid) return;

    // trainerId = user.uid
    // because trainers collection doc id = auth uid
    setTrainerId(user.uid);
  }, [user]);

  /* ============================
     ✅ FETCH EXISTING DATA
  ============================ */
  useEffect(() => {
    const fetchData = async () => {
      if (!trainerId) return;

      try {
        const docRef = doc(db, "trainers", trainerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          if (data?.pricing) {
            setFormData({
              monthlyFees: data.pricing.monthlyFees ?? "",
              registrationFees: data.pricing.registrationFees ?? "",
              uniformCost: data.pricing.uniformCost ?? "",
              paymentMethods: data.pricing.paymentMethods ?? "",
              refundPolicy: data.pricing.refundPolicy ?? "",
            });
          }
        }
      } catch (error) {
        console.error("Error loading pricing:", error);
      }

      setLoading(false);
    };

    fetchData();
  }, [trainerId]);
  // Capitalize each word
  const capitalizeWords = (value) => {
    return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Allow only alphabets + space + slash
  const onlyAlphabetsWithSlash = (value) => {
    return value.replace(/[^A-Za-z\s/]/g, "");
  };

  /* ============================
     HANDLE CHANGE
  ============================ */
  const handleChange = (e) => {
    const { name, value } = e.target;

    let newValue = value;

    // ✅ Fee fields → numbers only
    if (
      name === "monthlyFees" ||
      name === "registrationFees" ||
      name === "uniformCost"
    ) {
      newValue = value.replace(/[^0-9]/g, "");
    }

    // ✅ Payment Methods → alphabets + slash + auto capitalize
    if (name === "paymentMethods") {
      newValue = onlyAlphabetsWithSlash(value);
      newValue = capitalizeWords(newValue);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };
  /* ============================
     VALIDATION
  ============================ */
  const validate = () => {
    let newErrors = {};

    Object.keys(formData).forEach((field) => {
      if (!formData[field] || String(formData[field]).trim() === "") {
        newErrors[field] = "This field is required";
      }
    });

    if (formData.monthlyFees && isNaN(formData.monthlyFees)) {
      newErrors.monthlyFees = "Must be a valid number";
    }

    if (formData.registrationFees && isNaN(formData.registrationFees)) {
      newErrors.registrationFees = "Must be a valid number";
    }

    if (formData.uniformCost && isNaN(formData.uniformCost)) {
      newErrors.uniformCost = "Must be a valid number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ============================
     ✅ SAVE DATA DYNAMICALLY
  ============================ */
  const handleSave = async () => {
    if (!trainerId) return;

    const isValid = validate();
    if (!isValid) {
      alert("Please fill all required fields correctly.");
      return;
    }

    try {
      setSaving(true);

      const docRef = doc(db, "trainers", trainerId);

      await setDoc(
        docRef,
        {
          pricing: {
            monthlyFees: Number(formData.monthlyFees),
            registrationFees: Number(formData.registrationFees),
            uniformCost: Number(formData.uniformCost),
            paymentMethods: formData.paymentMethods,
            refundPolicy: formData.refundPolicy,
          },
          pricingUpdatedAt: serverTimestamp(),
        },
        { merge: true }, // 🔥 does not overwrite other trainer data
      );

      alert("Saved Successfully!");
    } catch (error) {
      console.error("Error saving pricing:", error);
      alert("Error saving data");
    }

    setSaving(false);
  };

  /* ============================
     CANCEL
  ============================ */
  const handleCancel = () => {
    setFormData({
      monthlyFees: "",
      registrationFees: "",
      uniformCost: "",
      paymentMethods: "",
      refundPolicy: "",
    });

    setErrors({});
  };

  if (loading) {
    return <p className="text-gray-500 p-6">Loading...</p>;
  }

  const inputClass = (field) =>
    `border ${
      errors[field] ? "border-red-500" : "border-gray-300"
    } rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500`;

  /* ============================
     🔥 UI NOT TOUCHED
  ============================ */
  return (
    <div className="w-full">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6 sm:p-8">
        {/* Back */}
        <div
          onClick={() => setStep(4)}
          className="flex items-center gap-2 text-orange-500 font-medium mb-4 cursor-pointer hover:text-orange-600 transition"
        >
          ← Back
        </div>

        <div className="border-b border-gray-300 mb-6"></div>

        {/* Title */}
        <h2 className="text-orange-500 font-semibold text-lg sm:text-xl mb-6">
          Pricing Transparency
        </h2>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Fees */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">
              Monthly/Yearly Fees <span className="text-red-500">*</span>
            </label>
            <input
              name="monthlyFees"
              value={formData.monthlyFees}
              onChange={handleChange}
              className={inputClass("monthlyFees")}
            />
            {errors.monthlyFees && (
              <span className="text-red-500 text-sm mt-1">
                {errors.monthlyFees}
              </span>
            )}
          </div>

          {/* Registration Fees */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">
              Registration Fees <span className="text-red-500">*</span>
            </label>
            <input
              name="registrationFees"
              value={formData.registrationFees}
              onChange={handleChange}
              className={inputClass("registrationFees")}
            />
            {errors.registrationFees && (
              <span className="text-red-500 text-sm mt-1">
                {errors.registrationFees}
              </span>
            )}
          </div>

          {/* Uniform Cost */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">
              Uniform / Equipment Cost <span className="text-red-500">*</span>
            </label>
            <input
              name="uniformCost"
              value={formData.uniformCost}
              onChange={handleChange}
              className={inputClass("uniformCost")}
            />
            {errors.uniformCost && (
              <span className="text-red-500 text-sm mt-1">
                {errors.uniformCost}
              </span>
            )}
          </div>

          {/* Payment Methods */}
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-2">
              Payment Methods Accepted <span className="text-red-500">*</span>
            </label>
            <input
              name="paymentMethods"
              value={formData.paymentMethods}
              onChange={handleChange}
              className={inputClass("paymentMethods")}
            />
            {errors.paymentMethods && (
              <span className="text-red-500 text-sm mt-1">
                {errors.paymentMethods}
              </span>
            )}
          </div>

          {/* Refund Policy */}
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm font-medium mb-2">
              Refund Policy <span className="text-red-500">*</span>
            </label>
            <textarea
              name="refundPolicy"
              value={formData.refundPolicy}
              onChange={handleChange}
              rows={4}
              className={inputClass("refundPolicy")}
            />
            {errors.refundPolicy && (
              <span className="text-red-500 text-sm mt-1">
                {errors.refundPolicy}
              </span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={handleCancel}
            className="text-gray-600 hover:text-black transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md transition shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingTransparency;
