import React from "react";

const PricingPayments = ({ formData, setFormData }) => {
  const inputStyle =
    "w-full border border-orange-300 rounded-lg px-4 py-2 text-base focus:ring-2 focus:ring-orange-400 outline-none";

  const handleChange = (value) => {
    setFormData((prev) => {
      const existingPricing = prev.pricing || [];

      // check if registrationFee already exists
      const index = existingPricing.findIndex(
        (item) => item.type === "registrationFee",
      );

      let updatedPricing = [...existingPricing];

      if (index !== -1) {
        // update existing value
        updatedPricing[index] = {
          ...updatedPricing[index],
          amount: value,
        };
      } else {
        // add new entry
        updatedPricing.push({
          type: "registrationFee",
          amount: value,
        });
      }

      return {
        ...prev,
        pricing: updatedPricing,
      };
    });
  };

  const getRegistrationFee = () => {
    if (!formData?.pricing) return "";
    const feeObj = formData.pricing.find(
      (item) => item.type === "registrationFee",
    );
    return feeObj ? feeObj.amount : "";
  };

  return (
    <div className="w-full px-2 pt-2 pb-32">
      {/* Title */}
      <h2 className="text-2xl font-bold mb-8">Pricing & Payments</h2>

      {/* Registration Fee */}
     <div className="w-full sm:w-[70%] md:w-[50%] lg:w-[40%] mb-28">
        <label className="block text-lg font-semibold mb-3">
          Registration Fees*
        </label>

<input
  type="text"
  inputMode="numeric"
  maxLength={6}
  className={inputStyle}
  value={getRegistrationFee()}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    handleChange(value);
  }}
/>
      </div>
    </div>
  );
};

export default PricingPayments;
