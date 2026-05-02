// src/components/InstituteDashboard/SellSportsMaterial.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const SellSportsMaterial = ({ setActiveMenu }) => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  /* ---------------- BUSINESS STATE ---------------- */
  const [businessDetails, setBusinessDetails] = useState({
    legalBusinessName: "",
    businessType: "",
    registeredBusinessAddress: "",
    emailBusiness: "",
    panCardNumber: "",
    gstin: "",
    gstinNumber: "",
    authorizedContactPersonName: "",
    mobileNumber: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBusinessDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (!isStep1Valid) {
      return; // ⛔ DO NOTHING
    }

    setStep(2);
  };

  /* ---------------- BANK STATE ---------------- */
  const [bankDetails, setBankDetails] = useState({
    accountHolder: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    chequeProof: "",
  });

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ---------------- AGREEMENTS ---------------- */
  const [agreeCommercial, setAgreeCommercial] = useState(false);
  const [agreeSeller, setAgreeSeller] = useState(false);

  /* ---------------- EDIT MODES ---------------- */
  const [editModeStep2, setEditModeStep2] = useState(true);
  const [editModeStep3, setEditModeStep3] = useState(false);

  /* ---------------- STEP-2 SAVE (FIREBASE) ---------------- */
const handleFinalSave = async () => {
  try {
    console.log("Saving to Firebase...");

    const docRef = await addDoc(collection(db, "sellerApplications"), {
      businessDetails: { ...businessDetails },
      bankDetails: { ...bankDetails },
      agreements: {
        agreeCommercial,
        agreeSeller,
      },
      createdAt: serverTimestamp(),
    });

    console.log("Saved ID:", docRef.id);

    alert("Saved successfully");

    navigate("/institutes/dashboard");

  } catch (err) {
    console.error("FIREBASE ERROR:", err);
    alert(err.message);
  }
};
  const isStep1Valid =
  businessDetails.legalBusinessName.trim() !== "" &&
  businessDetails.businessType.trim() !== "" &&
  businessDetails.registeredBusinessAddress.trim() !== "" &&
  businessDetails.emailBusiness.trim() !== "" &&
  businessDetails.panCardNumber.trim() !== "" &&
  businessDetails.authorizedContactPersonName.trim() !== "" &&
  businessDetails.mobileNumber.trim() !== "" &&
  (
    businessDetails.gstin.trim() === "" ||
    businessDetails.gstinNumber.trim() !== ""
  );

  const isStep2Valid =
  bankDetails.accountHolder.trim() !== "" &&
  bankDetails.bankName.trim() !== "" &&
  bankDetails.accountNumber.trim() !== "" &&
  bankDetails.ifscCode.trim() !== "" &&
  bankDetails.chequeProof.trim() !== "" &&
  agreeCommercial &&
  agreeSeller;

  return (
    <div className="p-8 bg-white rounded-2xl shadow-xl max-w-4xl mx-auto">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 p-2">
        <h1 className="text-2xl font-bold text-orange-500">
          {step === 1
            ? "Provide Your Business Details"
            : step === 2
              ? "Bank & Settlement Details (T+2 Settlement)"
              : "Full Business Details"}
        </h1>

        <button
          type="button"
          onClick={() => setActiveMenu("Upload Product Details")}
          className="border border-orange-400 bg-orange-400 text-black px-4 py-1 rounded-md text-sm"
        >
          Sell a Product
        </button>
      </div>

      {/* ================= STEP 1 ================= */}
      {step === 1 && (
        <form onSubmit={handleNext}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 font-semibold text-sm text-gray-500">
                Legal Business Name <span className="text-red-500">*</span>
              </label>

              <input
                required
                name="legalBusinessName"
                onChange={handleInputChange}
                value={businessDetails.legalBusinessName}
                className="w-full border border-gray-300 rounded h-9 px-3 text-black"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-sm text-gray-500">
                Business Type  <span className="text-red-500">*</span>
              </label>

              <input
                required
                name="businessType"
                onChange={handleInputChange}
                value={businessDetails.businessType}
                className="w-full border border-gray-300 rounded h-9 px-3 text-black"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 font-semibold text-sm text-gray-500">
              Registered Business Adress  <span className="text-red-500">*</span>
            </label>
            <input
              required
              name="registeredBusinessAddress"
              onChange={handleInputChange}
              value={businessDetails.registeredBusinessAddress}
              className="w-full border border-gray-300 rounded h-9 px-3 text-black"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 font-semibold text-sm text-gray-500">
                E-mail Id (Business)  <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="emailBusiness"
                onChange={handleInputChange}
                value={businessDetails.emailBusiness}
                className="w-full border border-gray-300 rounded h-9 px-3 text-black"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-sm text-gray-500">
                PAN card number  <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="panCardNumber"
                onChange={handleInputChange}
                value={businessDetails.panCardNumber}
                className="w-full border border-gray-300 rounded h-9 px-3 text-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 font-semibold text-sm text-gray-500">
                GSTIN 
              </label>
              <input
  name="gstin"
  onChange={handleInputChange}
  value={businessDetails.gstin}
  className="w-full border border-gray-300 rounded h-9 px-3 text-black"
/>

            </div>

            <div>
              <label className="block mb-2 font-semibold text-sm text-gray-500">
                GSTIN number (if yes)  
              </label>
              <input
                name="gstinNumber"
                onChange={handleInputChange}
                value={businessDetails.gstinNumber}
                className="w-full border border-gray-300 rounded h-9 px-3 text-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <div>
              <label className="block mb-2 font-semibold text-sm text-gray-500">
                Authorized Person Contact Name  <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="authorizedContactPersonName"
                onChange={handleInputChange}
                value={businessDetails.authorizedContactPersonName}
                className="w-full border border-gray-300 rounded h-9 px-3 text-black"
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-sm text-gray-500">
                Mobile Number  <span className="text-red-500">*</span>
              </label>
              <input
                required
                name="mobileNumber"
                onChange={handleInputChange}
                value={businessDetails.mobileNumber}
                className="w-full border border-gray-300 rounded h-9 px-3 text-black"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isStep1Valid}
              className={`px-10 py-2 rounded font-bold text-lg transition ${isStep1Valid
                  ? "bg-orange-500 text-white"
                  : "bg-orange-200 text-white cursor-not-allowed"
                }`}
            >
              Next
            </button>

          </div>
        </form>
      )}

      {/* ================= STEP 2 ================= */}
      {step === 2 && (
        <form onSubmit={(e) => {
  e.preventDefault();
  setStep(3);
}}>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              { label: "Bank account holder Name", name: "accountHolder" },
              { label: "Bank Name", name: "bankName" },
              { label: "Account Number", name: "accountNumber" },
              { label: "IFSC Code", name: "ifscCode" },
              { label: "UPI ID (Optional)", name: "upiId" },
              { label: "Cancelled Cheque Or Bank Proof", name: "chequeProof" },
            ].map((item) => (
              <div key={item.name}>
                <label className="block mb-2 font-semibold text-sm text-gray-500">
  {item.label}
  {item.name !== "upiId" && (
    <span className="text-red-500"> *</span>
  )}
</label>

                <input
                  
                  disabled={!editModeStep2}
                  name={item.name}
                  onChange={handleBankChange}
                  value={bankDetails[item.name]}
                  className="w-full border border-gray-300 rounded h-9 px-3 text-black"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-black text-[15px]">
              <input
                type="checkbox"
                checked={agreeCommercial}
                onChange={() => setAgreeCommercial(!agreeCommercial)}
              />
              I Agree Commercial Terms
            </label>

            <label className="flex items-center gap-2 text-black text-[15px]">
              <input
                type="checkbox"
                checked={agreeSeller}
                onChange={() => setAgreeSeller(!agreeSeller)}
              />
              I Agree Seller Consent & Agreement
            </label>
          </div>

          <div className="flex justify-center mt-6">
           <button
  type="submit"
  disabled={!isStep2Valid}
  className={`px-14 py-2 rounded-xl font-bold text-lg ${
    isStep2Valid
      ? "bg-orange-500 text-black"
      : "bg-orange-200 text-white cursor-not-allowed"
  }`}
>
  Save
</button>

          </div>
        </form>
      )}

      {/* ================= STEP 3 ================= */}
      {step === 3 && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl text-orange-500 font-bold">
              Provide Your Business Details
            </h2>

            <button
              onClick={() => setEditModeStep3(!editModeStep3)}
              className="bg-orange-500 text-black px-4 py-1 rounded"
            >
              {editModeStep3 ? "Save" : "Edit"}
            </button>
          </div>

          <div className="border p-4 bg-gray-50 mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.keys(businessDetails).map((key) => (
                <div key={key}>
                  <label className="block mb-2 font-semibold text-sm text-gray-500">
                    {key.replace(/([A-Z])/g, " $1")}  <span className="text-red-500">*</span>
                  </label>
                  <input
                    disabled={!editModeStep3}
                    name={key}
                    onChange={handleInputChange}
                    value={businessDetails[key]}
                   className="w-full border border-gray-300 rounded h-9 px-3 text-black"
                  />
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-xl text-orange-500 font-bold mb-2">
            Bank & Settlement Details (T+2 Settlement)
          </h2>

          <div className="border p-4 bg-gray-50">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.keys(bankDetails).map((key) => (
                <div key={key}>
                  <label className="block mb-2 font-semibold text-sm text-gray-500">
                    {key.replace(/([A-Z])/g, " $1")} 
                  </label>
                  <input
                    disabled={!editModeStep3}
                    name={key}
                    onChange={handleBankChange}
                    value={bankDetails[key]}
                    className="w-full border border-gray-300 rounded h-9 px-3 text-black"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center mt-6">
           <button
  type="button"
  onClick={handleFinalSave}
  className="px-14 py-2 rounded-xl font-bold text-lg bg-orange-500 text-black"
>
  Save
</button>

          </div>
        </div>
      )}
    </div>
  );
};

export default SellSportsMaterial;