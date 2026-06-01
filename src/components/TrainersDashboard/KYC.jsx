import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const TrainerKYC = () => {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  const [form, setForm] = useState({
    accountName: "",
    accountEmail: "",
    businessName: "",
    businessType: "",
    profession: "",
    ifsc: "",
    accountNumber: "",
    confirmAccountNumber: "",
    beneficiaryName: "",

    // ✅ UPI FIELDS
    upiId: "",
    upiHolderName: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!uid) return;

      try {
        const trainerRef = doc(db, "trainers", uid);
        const trainerSnap = await getDoc(trainerRef);

        if (trainerSnap.exists()) {
          const trainer = trainerSnap.data();

          setForm((prev) => ({
            ...prev,
            accountName: trainer.accountName || trainer.firstName || "",
            accountEmail: trainer.email || "",
            businessName: trainer.organization || "",
            profession: trainer.designation || "",
            ifsc: trainer.ifscCode || "",
          }));
        }

        const kycRef = doc(db, "trainers", uid, "Kyc", "details");
        const kycSnap = await getDoc(kycRef);

        if (kycSnap.exists()) {
          setForm(kycSnap.data());
          setSubmitted(true);
        }
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    };

    fetchData();
  }, [uid]);

  const handleChange = (e) => {
    let { name, value } = e.target;

    const alphaFields = [
      "accountName",
      "businessName",
      "businessType",
      "profession",
      "beneficiaryName",
      "upiHolderName",
    ];

    if (alphaFields.includes(name)) {
      value = value.replace(/[^A-Za-z ]/g, "");
      value = value.replace(/\b\w/g, (c) => c.toUpperCase());
    }

    if (name === "accountNumber" || name === "confirmAccountNumber") {
      value = value.replace(/[^0-9]/g, "");
    }

    if (name === "accountEmail") {
      value = value.replace(/\s/g, "");
    }

    if (name === "ifsc") {
      value = value.toUpperCase();
    }

    if (name === "upiId") {
      value = value.replace(/\s/g, "").toLowerCase();
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    if (!uid) return;

    if (form.accountNumber !== form.confirmAccountNumber) {
      alert("Account numbers do not match");
      return;
    }

    try {
      const ref = doc(db, "trainers", uid, "Kyc", "details");

      await setDoc(ref, {
        ...form,
        updatedAt: new Date(),
      });

      setSubmitted(true);
      setEditing(false);

      alert("✅ KYC Saved Successfully");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving KYC");
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
          Trainer KYC Details
        </h2>

        {/* ✅ VIEW MODE */}
        {submitted && !editing ? (
          <>
            <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center mb-5">
              ✅ KYC Completed Successfully
            </div>

            {/* BANK DETAILS */}
            <h3 className="font-semibold text-lg mb-3">🏦 Bank KYC</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-6">
              {Object.entries(form).map(([key, value]) => {
                if (key === "upiId" || key === "upiHolderName") return null;

                let displayValue = value;

                if (value && value.seconds) {
                  displayValue = new Date(
                    value.seconds * 1000,
                  ).toLocaleString();
                }

                if (key === "accountNumber") {
                  displayValue = "****" + value?.slice(-4);
                }

                return (
                  <p key={key}>
                    <strong>{key.replace(/([A-Z])/g, " $1")}:</strong>{" "}
                    {String(displayValue)}
                  </p>
                );
              })}
            </div>

            {/* UPI DETAILS */}
            <h3 className="font-semibold text-lg mb-3">
              💳 UPI Transaction KYC
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p>
                <strong>UPI ID:</strong> {form.upiId || "-"}
              </p>
              <p>
                <strong>UPI Holder Name:</strong> {form.upiHolderName || "-"}
              </p>
            </div>

            <button
              onClick={() => setEditing(true)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
            >
              Edit Details
            </button>
          </>
        ) : (
          <>
            {/* FORM */}

            {/* BANK */}
            <h3 className="font-semibold text-lg mb-3">🏦 Bank Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Account Name"
                name="accountName"
                form={form}
                handleChange={handleChange}
              />
              <Input
                label="Email"
                name="accountEmail"
                form={form}
                handleChange={handleChange}
                type="email"
              />
              <Input
                label="Business Name"
                name="businessName"
                form={form}
                handleChange={handleChange}
              />
              <Input
                label="Business Type"
                name="businessType"
                form={form}
                handleChange={handleChange}
              />
              <Input
                label="Profession"
                name="profession"
                form={form}
                handleChange={handleChange}
              />
              <Input
                label="IFSC Code"
                name="ifsc"
                form={form}
                handleChange={handleChange}
              />
              <Input
                label="Account Number"
                name="accountNumber"
                form={form}
                handleChange={handleChange}
                inputMode="numeric"
              />
              <Input
                label="Confirm Account Number"
                name="confirmAccountNumber"
                form={form}
                handleChange={handleChange}
                inputMode="numeric"
              />
              <Input
                label="Beneficiary Name"
                name="beneficiaryName"
                form={form}
                handleChange={handleChange}
              />
            </div>

            {/* UPI */}
            <h3 className="font-semibold text-lg mt-6 mb-3">
              💳 UPI Transaction KYC
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="UPI ID"
                name="upiId"
                form={form}
                handleChange={handleChange}
              />
              <Input
                label="UPI Holder Name"
                name="upiHolderName"
                form={form}
                handleChange={handleChange}
              />
            </div>

            <button
              onClick={handleSubmit}
              className="mt-6 w-full bg-green-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold"
            >
              Submit KYC
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* ✅ Reusable Input Component */
const Input = ({
  label,
  name,
  form,
  handleChange,
  type = "text",
  inputMode,
}) => (
  <div>
    <label className="block mb-1 font-medium">{label}</label>
    <input
      type={type}
      name={name}
      value={form[name] || ""}
      onChange={handleChange}
      inputMode={inputMode}
      className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-400"
    />
  </div>
);

export default TrainerKYC;
