import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  Building2,
  CreditCard,
  Mail,
  User,
  Briefcase,
  Landmark,
  Smartphone,
  CheckCircle2,
  Pencil,
} from "lucide-react";

const inputClass =
  "w-full h-12 px-4 border border-gray-300 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-sm bg-white";

const RazorpayKYC = () => {
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

    // ✅ NEW UPI SECTION
    upiId: "",
    upiName: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showChargesModal, setShowChargesModal] = useState(false);
  /* =====================================================
     FETCH KYC
  ===================================================== */
  useEffect(() => {
    const fetchKYC = async () => {
      if (!uid) return;

      try {
        const ref = doc(db, "institutes", uid, "Kyc", "details");

        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

          setForm({
            accountName: data.accountName || "",
            accountEmail: data.accountEmail || "",
            businessName: data.businessName || "",
            businessType: data.businessType || "",
            profession: data.profession || "",
            ifsc: data.ifsc || "",
            accountNumber: data.accountNumber || "",
            confirmAccountNumber: data.confirmAccountNumber || "",
            beneficiaryName: data.beneficiaryName || "",

            // ✅ UPI
            upiId: data.upiId || "",
            upiName: data.upiName || "",
          });

          setSubmitted(true);
        }
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    };

    fetchKYC();
  }, [uid]);

  /* =====================================================
     HANDLE INPUT
  ===================================================== */
  const handleChange = (e) => {
    let { name, value } = e.target;

    // ✅ ALPHABET FIELDS
    const alphaFields = [
      "accountName",
      "businessName",
      "businessType",
      "profession",
      "beneficiaryName",
      "upiName",
    ];

    if (alphaFields.includes(name)) {
      value = value.replace(/[^A-Za-z ]/g, "");

      value = value.replace(/\b\w/g, (char) => char.toUpperCase());
    }

    // ✅ ACCOUNT NUMBER
    if (name === "accountNumber" || name === "confirmAccountNumber") {
      value = value.replace(/[^0-9]/g, "");
    }

    // ✅ UPI ID
    if (name === "upiId") {
      value = value.replace(/[^A-Za-z0-9@._-]/g, "").toLowerCase();
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =====================================================
     VALIDATION
  ===================================================== */
  const validate = () => {
    if (!form.accountName.trim()) {
      alert("Account Name required");
      return false;
    }

    if (!form.accountEmail.trim()) {
      alert("Account Email required");
      return false;
    }

    if (!form.businessName.trim()) {
      alert("Business Name required");
      return false;
    }

    if (!form.ifsc.trim()) {
      alert("IFSC required");
      return false;
    }

    if (!form.accountNumber.trim()) {
      alert("Account Number required");
      return false;
    }

    if (form.accountNumber !== form.confirmAccountNumber) {
      alert("Account numbers do not match");
      return false;
    }

    // ✅ UPI VALIDATION
    if (!form.upiId.trim()) {
      alert("UPI ID required");
      return false;
    }

    return true;
  };

  /* =====================================================
     SUBMIT
  ===================================================== */
  const handleSubmit = async () => {
    if (!uid) return;

    if (!validate()) return;

    try {
      setSaving(true);

      const ref = doc(db, "institutes", uid, "Kyc", "details");

      await setDoc(
        ref,
        {
          ...form,

          // ✅ PAYMENT SETTINGS
          paymentSettings: {
            upiId: form.upiId,
            upiName: form.upiName,
          },

          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setSubmitted(true);
      setEditing(false);

      alert("✅ KYC Completed Successfully");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving KYC");
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Loading KYC Details...</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-5 sm:px-8 py-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center">
              Razorpay KYC Details
            </h2>

            <p className="text-orange-100 text-center mt-2 text-sm sm:text-base">
              Complete your bank & UPI details for receiving payments
            </p>
          </div>

          <div className="p-4 sm:p-8">
            {/* =====================================================
               SUCCESS VIEW
            ===================================================== */}
            {submitted && !editing ? (
              <>
                <div className="bg-green-100 border border-green-300 text-green-700 rounded-2xl p-4 flex items-center gap-3 mb-8">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0" />

                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">
                      KYC Completed Successfully
                    </h3>

                    <p className="text-sm mt-1">
                      Students payments will be credited to your bank/UPI.
                    </p>
                  </div>
                </div>

                {/* DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      label: "Account Name",
                      value: form.accountName,
                    },
                    {
                      label: "Account Email",
                      value: form.accountEmail,
                    },
                    {
                      label: "Business Name",
                      value: form.businessName,
                    },
                    {
                      label: "Business Type",
                      value: form.businessType,
                    },
                    {
                      label: "Profession",
                      value: form.profession,
                    },
                    {
                      label: "IFSC Code",
                      value: form.ifsc,
                    },
                    {
                      label: "Account Number",
                      value: form.accountNumber,
                    },
                    {
                      label: "Beneficiary Name",
                      value: form.beneficiaryName,
                    },
                    {
                      label: "UPI ID",
                      value: form.upiId,
                    },
                    {
                      label: "UPI Name",
                      value: form.upiName,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-gray-50 border rounded-2xl p-4"
                    >
                      <p className="text-xs text-gray-500 mb-1">{item.label}</p>

                      <p className="font-semibold break-all text-sm sm:text-base">
                        {item.value || "-"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* EDIT BUTTON */}
                <button
                  onClick={() => setEditing(true)}
                  className="mt-8 w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 transition text-white font-semibold flex items-center justify-center gap-2"
                >
                  <Pencil size={18} />
                  Edit Details
                </button>
              </>
            ) : (
              <>
                {/* =====================================================
                   BANK DETAILS
                ===================================================== */}
                <div className="mb-8">
                  <h3 className="text-lg sm:text-xl font-bold mb-5 flex items-center gap-2">
                    <Landmark className="text-orange-500" />
                    Bank Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ACCOUNT NAME */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Account Name
                      </label>

                      <div className="relative">
                        <User
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="text"
                          name="accountName"
                          value={form.accountName}
                          onChange={handleChange}
                          className={`${inputClass} pl-10`}
                          placeholder="Enter account holder name"
                        />
                      </div>
                    </div>

                    {/* EMAIL */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Account Email
                      </label>

                      <div className="relative">
                        <Mail
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="email"
                          name="accountEmail"
                          value={form.accountEmail}
                          onChange={handleChange}
                          className={`${inputClass} pl-10`}
                          placeholder="Enter email"
                        />
                      </div>
                    </div>

                    {/* BUSINESS NAME */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Business Name
                      </label>

                      <div className="relative">
                        <Building2
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="text"
                          name="businessName"
                          value={form.businessName}
                          onChange={handleChange}
                          className={`${inputClass} pl-10`}
                          placeholder="Enter business name"
                        />
                      </div>
                    </div>

                    {/* BUSINESS TYPE */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Business Type
                      </label>

                      <div className="relative">
                        <Briefcase
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="text"
                          name="businessType"
                          value={form.businessType}
                          onChange={handleChange}
                          className={`${inputClass} pl-10`}
                          placeholder="Enter business type"
                        />
                      </div>
                    </div>

                    {/* PROFESSION */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Profession
                      </label>

                      <input
                        type="text"
                        name="profession"
                        value={form.profession}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Enter profession"
                      />
                    </div>

                    {/* IFSC */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        IFSC Code
                      </label>

                      <input
                        type="text"
                        name="ifsc"
                        value={form.ifsc}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            ifsc: e.target.value.toUpperCase(),
                          })
                        }
                        className={inputClass}
                        placeholder="Enter IFSC"
                      />
                    </div>

                    {/* ACCOUNT NUMBER */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Account Number
                      </label>

                      <div className="relative">
                        <CreditCard
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="text"
                          inputMode="numeric"
                          name="accountNumber"
                          value={form.accountNumber}
                          onChange={handleChange}
                          className={`${inputClass} pl-10`}
                          placeholder="Enter account number"
                        />
                      </div>
                    </div>

                    {/* CONFIRM ACCOUNT NUMBER */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        Re-enter Account Number
                      </label>

                      <div className="relative">
                        <CreditCard
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="text"
                          inputMode="numeric"
                          name="confirmAccountNumber"
                          value={form.confirmAccountNumber}
                          onChange={handleChange}
                          className={`${inputClass} pl-10`}
                          placeholder="Re-enter account number"
                        />
                      </div>
                    </div>

                    {/* BENEFICIARY NAME */}
                    <div className="md:col-span-2">
                      <label className="block mb-2 text-sm font-medium">
                        Beneficiary Name
                      </label>

                      <input
                        type="text"
                        name="beneficiaryName"
                        value={form.beneficiaryName}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Enter beneficiary name"
                      />
                    </div>
                  </div>
                </div>

                {/* =====================================================
                   UPI SECTION
                ===================================================== */}
                <div className="border-t pt-8">
                  <h3 className="text-lg sm:text-xl font-bold mb-5 flex items-center gap-2">
                    <Smartphone className="text-green-600" />
                    UPI Payment Details
                  </h3>

                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                    <p className="text-sm text-green-700 leading-relaxed">
                      Students payments paid through UPI will be transferred to
                      this UPI ID.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* UPI ID */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        UPI ID
                      </label>

                      <div className="relative">
                        <Smartphone
                          size={18}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          type="text"
                          name="upiId"
                          value={form.upiId}
                          onChange={handleChange}
                          className={`${inputClass} pl-10`}
                          placeholder="example@paytm"
                        />
                      </div>
                    </div>

                    {/* UPI NAME */}
                    <div>
                      <label className="block mb-2 text-sm font-medium">
                        UPI Name
                      </label>

                      <input
                        type="text"
                        name="upiName"
                        value={form.upiName}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Enter UPI holder name"
                      />
                    </div>
                  </div>
                </div>
                {/* IMPORTANT NOTE */}
                <div className="mt-8 bg-red-50 border border-red-300 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-red-600 text-xl">⚠️</div>

                    <div className="flex-1">
                      <h4 className="font-bold text-red-700 text-sm sm:text-base">
                        Important Payment Charges Information
                      </h4>

                      <p className="text-red-600 text-sm mt-1">
                        Please read the payment settlement and transaction
                        charge details before submitting your KYC.
                      </p>

                      <button
                        type="button"
                        onClick={() => setShowChargesModal(true)}
                        className="mt-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition"
                      >
                        View Charges & Terms
                      </button>
                    </div>
                  </div>
                </div>
                {/* SUBMIT BUTTON */}
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className={`mt-10 w-full h-12 rounded-2xl text-white font-semibold transition
                  ${
                    saving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {saving ? "Saving..." : "Submit KYC"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {/* PAYMENT CHARGES MODAL */}
      {showChargesModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">Payment Charges Information</h3>

              <button
                onClick={() => setShowChargesModal(false)}
                className="text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[70vh] p-5 space-y-5 text-sm">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-bold text-green-700 mb-2">
                  1. Pay Using Your Business UPI QR Code
                </h4>

                <p className="font-semibold text-green-600 mb-2">
                  Zero Transaction Fees
                </p>

                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>Add your business UPI ID during KYC.</li>
                  <li>
                    Your business QR code will be generated automatically.
                  </li>
                  <li>Students can scan and pay directly.</li>
                  <li>No platform transaction fees are charged.</li>
                  <li>
                    Payments are credited directly to your linked bank account.
                  </li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <h4 className="font-bold text-orange-700 mb-3">
                  2. Razorpay Payment Gateway Charges
                </h4>

                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">Domestic Payments</p>

                    <ul className="list-disc pl-5 text-gray-700">
                      <li>2% Transaction Fee</li>
                      <li>18% GST on Transaction Fee</li>
                      <li>Effective Charge: 2.36%</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">
                      International Cards, AMEX, EMI & Corporate Cards
                    </p>

                    <ul className="list-disc pl-5 text-gray-700">
                      <li>3% Transaction Fee</li>
                      <li>18% GST on Transaction Fee</li>
                      <li>Effective Charge: 3.54%</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-bold text-blue-700 mb-2">Example</h4>

                <p>
                  For a payment of <strong>₹100</strong>:
                </p>

                <ul className="list-disc pl-5 mt-2">
                  <li>Razorpay Fee: ₹2.36</li>
                  <li>Amount Settled: ₹97.64</li>
                </ul>
              </div>

              <div className="bg-gray-50 border rounded-xl p-4">
                <h4 className="font-bold mb-2">Additional Information</h4>

                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  <li>No setup fees.</li>
                  <li>No annual maintenance charges.</li>
                  <li>
                    Charges apply only to successful Razorpay transactions.
                  </li>
                  <li>
                    GST is calculated only on the transaction fee, not on the
                    total payment amount.
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 bg-gray-50">
              <button
                onClick={() => setShowChargesModal(false)}
                className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RazorpayKYC;
