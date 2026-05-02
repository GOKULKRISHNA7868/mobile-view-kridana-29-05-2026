import React, { useEffect, useState } from "react";
import { db } from "../../firebase"; // adjust path
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
  });

  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH KYC
  useEffect(() => {
    const fetchKYC = async () => {
      if (!uid) return;

      try {
        const ref = doc(db, "institutes", uid, "Kyc", "details");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setForm(snap.data());
          setSubmitted(true);
        }
      } catch (err) {
        console.error(err);
      }

      setLoading(false); // ✅ always stop loading
    };

    fetchKYC();
  }, [uid]);

  // 🔥 HANDLE INPUT
  const handleChange = (e) => {
    let { name, value } = e.target;

    // ✅ Allow only alphabets & auto capitalize first letter
    const alphaFields = [
      "accountName",
      "businessName",
      "businessType",
      "profession",
      "beneficiaryName",
    ];

    if (alphaFields.includes(name)) {
      value = value.replace(/[^A-Za-z ]/g, ""); // allow only letters + space

      // Auto capitalize first letter of each word
      value = value.replace(/\b\w/g, (char) => char.toUpperCase());
    }

    // ✅ Allow only numbers for account numbers
    if (name === "accountNumber" || name === "confirmAccountNumber") {
      value = value.replace(/[^0-9]/g, "");
    }

    setForm({ ...form, [name]: value });
  };

  // 🔥 SUBMIT
  const handleSubmit = async () => {
    if (!uid) return;

    if (form.accountNumber !== form.confirmAccountNumber) {
      alert("Account numbers do not match");
      return;
    }

    try {
      const ref = doc(db, "institutes", uid, "Kyc", "details");

      await setDoc(ref, {
        ...form,
        updatedAt: new Date(),
      });

      setSubmitted(true);
      setEditing(false);

      alert("✅ KYC Completed Successfully");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving KYC");
    }
  };

  // 🔥 LOADING
  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center mb-6">
          Complete KYC Details
        </h2>

        {/* ✅ SUCCESS VIEW */}
        {submitted && !editing ? (
          <>
            <div className="bg-green-100 text-green-700 p-4 rounded-lg text-center mb-6">
              ✅ KYC Completed Successfully
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {Object.entries(form).map(([key, value]) => {
                let displayValue = value;

                // ✅ FIX TIMESTAMP ERROR
                if (value && value.seconds) {
                  displayValue = new Date(
                    value.seconds * 1000,
                  ).toLocaleString();
                }

                return (
                  <p key={key} className="break-all">
                    <strong>
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                      :
                    </strong>{" "}
                    {String(displayValue)}
                  </p>
                );
              })}
            </div>

            <button
              onClick={() => setEditing(true)}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
            >
              Edit Details
            </button>
          </>
        ) : (
          <>
            {/* ✅ FORM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Account Name:</label>
                <input
                  type="text"
                  name="accountName"
                  value={form.accountName}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Account Email:</label>
                <input
                  type="email"
                  name="accountEmail"
                  value={form.accountEmail}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Business Name:</label>
                <input
                  type="text"
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Business Type:</label>
                <input
                  type="text"
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Profession:</label>
                <input
                  type="text"
                  name="profession"
                  value={form.profession}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">IFSC Code:</label>
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
                  className="input"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Account Number:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Re-enter Account Number:
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="confirmAccountNumber"
                  value={form.confirmAccountNumber}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Beneficiary Name:
                </label>
                <input
                  type="text"
                  name="beneficiaryName"
                  value={form.beneficiaryName}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="mt-8 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
            >
              Submit KYC
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RazorpayKYC;
