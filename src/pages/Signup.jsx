// src/pages/Signup.js
import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get("role") || "user"; // default user

  const [formData, setFormData] = useState({
    name: "",
    emailPhone: "",
    password: "",
    rePassword: "",
  });

  // ✅ NEW STATE (does not affect existing logic)
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // ✅ Name → only alphabets + capitalize
    if (name === "name") {
      newValue = value
        .replace(/[^A-Za-z ]/g, "") // only letters
        .replace(/\b[a-z]/g, (c) => c.toUpperCase()); // capitalize
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Agreement check
    if (!agreed) {
      alert("Please agree to the Terms & Policies to continue");
      return;
    }

    if (formData.password !== formData.rePassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      // 🔹 USER signup only
      if (role === "user") {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.emailPhone,
          formData.password,
        );

        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          name: formData.name,
          emailOrPhone: formData.emailPhone,
          role: "user",
          createdAt: serverTimestamp(),

          // ✅ AGREEMENT STORED SAFELY
          agreements: {
            termsAndConditions: true,
            privacyPolicy: true,
            paymentPolicy: true,
            merchantPolicy: true,
            agreedAt: serverTimestamp(),
          },
        });

        console.log("User registered successfully");
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-orange-500">
          {role === "institute"
            ? "Register Your Institute"
            : "Join Kridana Sports"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-orange-500">
              {role === "institute" ? "Institute Name*" : "Name*"}
            </label>
            <input
              type="text"
              name="name"
              placeholder={
                role === "institute" ? "Enter Institute Name" : "Enter Name"
              }
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-orange-200 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block mb-1 text-orange-500">
              E-mail/Phone Number*
            </label>
            <input
              type="text"
              name="emailPhone"
              placeholder="Enter Mail/Phone"
              value={formData.emailPhone}
              onChange={handleChange}
              required
              className="w-full border border-orange-200 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block mb-1 text-orange-500">Password*</label>
            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-orange-200 rounded-md p-2"
            />
          </div>

          <div>
            <label className="block mb-1 text-orange-500">Re-Password*</label>
            <input
              type="password"
              name="rePassword"
              placeholder="Re-enter Password"
              value={formData.rePassword}
              onChange={handleChange}
              required
              className="w-full border border-orange-200 rounded-md p-2"
            />
          </div>

          {/* ✅ AGREEMENT SECTION */}
          <div className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <p>
              I agree to the{" "}
              <Link to="/terms" className="text-blue-600 underline">
                Terms & Conditions
              </Link>
              ,{" "}
              <Link to="/privacy" className="text-blue-600 underline">
                Privacy Policy
              </Link>
              ,{" "}
              <Link to="/paymentpolicy" className="text-blue-600 underline">
                Payment & Merchant Policy
              </Link>
              .
            </p>
          </div>

          <button
            type="submit"
            disabled={!agreed}
            className={`mt-4 w-full p-3 rounded-md font-semibold transition-colors ${
              agreed
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Sign Up
          </button>
        </form>

        <p className="mt-4 text-gray-700">
          Already have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer"
            onClick={() => navigate("/")}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}
