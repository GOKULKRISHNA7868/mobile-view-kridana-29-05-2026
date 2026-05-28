import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

import { ArrowLeft, Eye, EyeOff, Loader2, X } from "lucide-react";

/*
=========================================================
IMPORTANT
=========================================================

1. ADD YOUR POPUP IMAGE IN:
   /src/assets/kridana-popup.png

2. IMPORT IS ALREADY ADDED BELOW

3. PLAN CHECK COMPLETELY REMOVED

4. ALL ROUTING PRESERVED

=========================================================
*/

export default function Login() {
  const navigate = useNavigate();

  const location = useLocation();
  const popupImage = "/Kridana pop Up.png";
  const role = new URLSearchParams(location.search).get("role") || "user";

  const [formData, setFormData] = useState({
    emailPhone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  const [redirectPath, setRedirectPath] = useState("/");

  const handleChange = (e) =>
    setFormData((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));

  /*
  =========================================================
  LOGIN
  =========================================================
  */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);

      const cred = await signInWithEmailAndPassword(
        auth,
        formData.emailPhone.trim(),
        formData.password,
      );

      const user = cred.user;

      /*
      =========================================================
      ROLE CHECK
      =========================================================
      */

      const trainerSnap = await getDoc(doc(db, "trainers", user.uid));

      const instituteSnap = await getDoc(doc(db, "institutes", user.uid));

      const familySnap = await getDoc(doc(db, "families", user.uid));

      let actualRole = null;

      if (trainerSnap.exists()) actualRole = "trainer";

      if (instituteSnap.exists()) actualRole = "institute";

      if (familySnap.exists()) actualRole = "family";

      if (!actualRole && role === "user") {
        actualRole = "user";
      }

      /*
      =========================================================
      ROLE MISMATCH
      =========================================================
      */

      if (role !== "user" && actualRole !== role && actualRole !== "family") {
        alert(`Role mismatch. Registered as ${actualRole}`);

        setLoading(false);

        return;
      }

      /*
      =========================================================
      FAMILY
      =========================================================
      */

      if (actualRole === "family") {
        setRedirectPath("/");

        setShowWelcomePopup(true);

        return;
      }

      /*
      =========================================================
      RESET PASSWORD
      =========================================================
      */

      const studentSnap = await getDoc(doc(db, "students", user.uid));

      if (studentSnap.exists() && studentSnap.data().defaultPassword) {
        navigate("/reset-password");

        return;
      }

      /*
      =========================================================
      ROUTING
      =========================================================
      */

      if (actualRole === "trainer") {
        setRedirectPath("/trainers/dashboard");
      } else if (actualRole === "institute") {
        setRedirectPath("/institutes/dashboard");
      } else {
        setRedirectPath("/");
      }

      /*
      =========================================================
      SHOW POPUP
      =========================================================
      */

      setShowWelcomePopup(true);
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

  /*
  =========================================================
  FORGOT PASSWORD
  =========================================================
  */

  const handleForgotPassword = async () => {
    const email = prompt("Enter your registered email:");

    if (!email) {
      return alert("Email is required!");
    }

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

  /*
  =========================================================
  AUTO REDIRECT AFTER POPUP
  =========================================================
  */

  useEffect(() => {
    if (!showWelcomePopup) return;

    const timer = setTimeout(() => {
      navigate(redirectPath, { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [showWelcomePopup, navigate, redirectPath]);

  return (
    <>
      {/* MAIN PAGE */}
      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
          px-4
          py-6
          bg-gradient-to-b
          from-[#401F00]
          via-[#FF7A00]
          to-[#401F00]
          overflow-hidden
          relative
        "
      >
        {/* BACK BUTTON */}
        <button
          onClick={() => {
            if (role === "trainer") {
              navigate("/trainers/dashboard", { replace: true });
            } else if (role === "institute") {
              navigate("/institutes/dashboard", { replace: true });
            } else {
              navigate("/", { replace: true });
            }
          }}
          className="
            fixed
            top-4
            left-4
            z-40
            flex
            items-center
            gap-2
            text-white
            bg-black/30
            px-3
            py-2
            rounded-xl
            backdrop-blur-md
            active:scale-95
            transition
          "
        >
          <ArrowLeft size={18} />

          <span className="text-sm">Back</span>
        </button>

        {/* LOGIN CARD */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="
            w-full
            max-w-md
            bg-white
            rounded-[30px]
            shadow-2xl
            p-5
            sm:p-8
          "
        >
          {/* HEADING */}
          <h2
            className="
              text-2xl
              sm:text-3xl
              font-bold
              text-center
              text-[#2D1400]
            "
          >
            Welcome Back
          </h2>

          <p
            className="
              text-center
              text-gray-500
              mt-2
              text-sm
              sm:text-base
            "
          >
            Login to continue to your Kridana account
          </p>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {/* EMAIL */}
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
                className="
                  w-full
                  mt-1
                  p-3
                  rounded-2xl
                  border
                  border-gray-300
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#FF6A00]
                "
              />
            </div>

            {/* PASSWORD */}
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
                  className="
                    w-full
                    p-3
                    pr-12
                    rounded-2xl
                    border
                    border-gray-300
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#FF6A00]
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                  "
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* FORGOT PASSWORD */}
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

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                bg-[#FF6A00]
                text-white
                py-3
                rounded-2xl
                font-bold
                flex
                justify-center
                items-center
                gap-2
                disabled:opacity-70
                active:scale-[0.98]
                transition
              "
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

          {/* FOOTER */}
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

      {/* ===================================================== */}
      {/* WELCOME POPUP */}
      {/* ===================================================== */}

      <AnimatePresence>
        {showWelcomePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed
              inset-0
              z-[999]
              flex
              items-center
              justify-center
              bg-black/50
              backdrop-blur-sm
              px-3
              sm:px-4
            "
          >
            {/* POPUP BOX */}
            <motion.div
              initial={{ scale: 0.85, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="
                relative
                w-full
                max-w-[420px]
                rounded-[35px]
                overflow-hidden
                bg-white
                shadow-[0_20px_60px_rgba(0,0,0,0.35)]
              "
            >
              {/* CLOSE BUTTON */}
              <button
                onClick={() => {
                  setShowWelcomePopup(false);

                  navigate(redirectPath, { replace: true });
                }}
                className="
                  absolute
                  top-4
                  right-4
                  z-20
                  h-10
                  w-10
                  rounded-full
                  bg-white/90
                  flex
                  items-center
                  justify-center
                  shadow-md
                  active:scale-95
                  transition
                "
              >
                <X size={22} className="text-black" />
              </button>

              {/* IMAGE */}
              <img
                src={popupImage}
                alt="Welcome to Kridana"
                className="
                  w-full
                  h-auto
                  object-cover
                  select-none
                  pointer-events-none
                "
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
