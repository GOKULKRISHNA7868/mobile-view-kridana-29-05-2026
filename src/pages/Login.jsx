import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const role = new URLSearchParams(location.search).get("role") || "user";

  const [formData, setFormData] = useState({
    emailPhone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setFormData((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        formData.emailPhone.trim(),
        formData.password,
      );

      const user = cred.user;

      const trainerSnap = await getDoc(doc(db, "trainers", user.uid));
      const instituteSnap = await getDoc(doc(db, "institutes", user.uid));
      const familySnap = await getDoc(doc(db, "families", user.uid));

      let actualRole = null;

      if (trainerSnap.exists()) actualRole = "trainer";
      if (instituteSnap.exists()) actualRole = "institute";
      if (familySnap.exists()) actualRole = "family";
      if (!actualRole && role === "user") actualRole = "user";

      if (role !== "user" && actualRole !== role && actualRole !== "family") {
        alert(`Role mismatch. Registered as ${actualRole}`);
        setLoading(false);
        return;
      }

      if (actualRole !== "user" && actualRole !== "family") {
        const planSnap = await getDoc(doc(db, "plans", user.uid));

        if (!planSnap.exists()) {
          navigate("/plans");
          return;
        }

        const plan = planSnap.data();
        const now = Date.now();

        if (
          plan.currentPlan?.endDate?.toMillis() < now ||
          plan.currentPlan?.status === "expired"
        ) {
          navigate("/plans?expired=true");
          return;
        }
      }

      if (actualRole === "family") {
        navigate("/");
        return;
      }

      const studentSnap = await getDoc(doc(db, "students", user.uid));

      if (studentSnap.exists() && studentSnap.data().defaultPassword) {
        navigate("/reset-password");
        return;
      }

      if (actualRole === "trainer") navigate("/trainers/dashboard");
      else if (actualRole === "institute") navigate("/institutes/dashboard");
      else navigate("/");
    } catch (err) {
      console.error(err);

      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        alert("Wrong password. Please try again.");
      } else if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-email"
      ) {
        alert("No account found with this email.");
      } else {
        alert("Login failed: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt("Enter your registered email:");

    if (!email) return alert("Email is required!");

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Reset link sent to your email!");
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        alert("No account found.");
      } else {
        alert(error.message);
      }
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-6
      bg-gradient-to-b from-[#401F00] via-[#FF7A00] to-[#401F00]"
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 flex items-center gap-2
        text-white bg-black/30 px-3 py-2 rounded-lg backdrop-blur-md"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl
        p-5 sm:p-8"
      >
        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#2D1400]">
          Welcome Back
        </h2>

        <p className="text-center text-gray-500 mt-2 text-sm sm:text-base">
          Login to continue to your Kridana account
        </p>

        {/* Toggle */}
        <div className="flex mt-6 rounded-xl overflow-hidden border">
          <button className="flex-1 py-3 bg-[#FF6A00] text-white font-semibold text-sm">
            Password Login
          </button>

          <button className="flex-1 py-3 bg-white text-[#2D1400] border-l text-sm">
            OTP Login
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Email */}
          <div>
            <label className="text-[#FF6A00] font-medium text-sm">
              Email / Phone Number
            </label>

            <input
              type="text"
              name="emailPhone"
              required
              value={formData.emailPhone}
              onChange={handleChange}
              placeholder="Enter email"
              className="w-full mt-1 p-3 rounded-xl border
              focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-[#FF6A00] font-medium text-sm">
              Password
            </label>

            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="w-full p-3 pr-12 rounded-xl border
                focus:outline-none focus:ring-2 focus:ring-[#FF6A00]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="text-right mt-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-[#FF6A00] font-medium"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF6A00] text-white py-3 rounded-xl
            font-bold flex justify-center items-center gap-2
            disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-[#2D1400]">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-[#FF6A00] font-bold cursor-pointer"
          >
            Sign Up
          </span>
        </p>
      </motion.div>
    </div>
  );
}
