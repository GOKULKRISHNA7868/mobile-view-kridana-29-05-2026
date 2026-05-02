import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Signin() {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get("role") || "user";

  const [darkMode, setDarkMode] = useState(false);
  const [formData, setFormData] = useState({
    emailPhone: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.emailPhone,
        formData.password
      );

      const user = userCredential.user;

      // 🔍 Check role from Firestore
      const userDocRef =
        role === "institute"
          ? doc(db, "institutes", user.uid)
          : role === "trainer"
          ? doc(db, "trainers", user.uid) // ✅ trainers collection
          : doc(db, "users", user.uid);

      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        alert("Account record not found.");
        return;
      }

      const userData = userSnap.data();

      if (userData.role !== role) {
        alert("Role mismatch. Please login using correct role.");
        return;
      }

      // ✅ ROLE BASED REDIRECT
      if (role === "institute") {
        navigate(`/institutes/${user.uid}`, { replace: true });
      } else if (role === "trainer") {
        // Navigate trainers to dashboard like institute
        navigate(`/trainers/${user.uid}`, { replace: true });
      } else {
        navigate("/Landing", { replace: true });
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300
      ${darkMode ? "bg-gray-900" : "bg-white"}`}
    >
      {/* Dark Mode Toggle */}
      <div className="absolute top-6 right-6">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 rounded-md text-sm font-medium border
          border-orange-400 text-orange-500 hover:bg-orange-500 hover:text-white transition"
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`w-full max-w-md rounded-xl shadow-lg p-8
        ${darkMode ? "bg-gray-800" : "bg-white"}`}
      >
        <h2 className="text-3xl font-bold mb-6 text-orange-500">
          {role === "institute"
            ? "Institute Sign In"
            : role === "trainer"
            ? "Trainer Sign In"
            : "Welcome Back to Kridana"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email / Phone */}
          <div>
            <label className="block mb-1 text-orange-500">
              E-mail / Phone Number*
            </label>
            <input
              type="text"
              name="emailPhone"
              placeholder="Enter Email or Phone"
              value={formData.emailPhone}
              onChange={handleChange}
              required
              className={`w-full rounded-md p-3 outline-none transition
              ${
                darkMode
                  ? "bg-gray-700 text-white border border-gray-600"
                  : "bg-white border border-orange-200"
              }`}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 text-orange-500">Password*</label>
            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange}
              required
              className={`w-full rounded-md p-3 outline-none transition
              ${
                darkMode
                  ? "bg-gray-700 text-white border border-gray-600"
                  : "bg-white border border-orange-200"
              }`}
            />
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <span
              onClick={() => navigate("/forgot-password")}
              className="text-sm text-blue-600 cursor-pointer hover:underline"
            >
              Forgot password?
            </span>
          </div>

          {/* Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="w-full bg-orange-500 text-white p-3 rounded-md font-semibold
            hover:bg-orange-600 transition"
          >
            Sign In
          </motion.button>
        </form>

        {/* Footer */}
        <p
          className={`mt-6 text-center ${
            darkMode ? "text-gray-300" : "text-gray-700"
          }`}
        >
          Don’t have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate(`/signup?role=${role}`)}
          >
            Sign Up
          </span>
        </p>
      </motion.div>
    </div>
  );
}
