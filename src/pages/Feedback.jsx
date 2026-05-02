import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
const Feedback = () => {
  const [form, setForm] = useState({
    name: "",
    message: "",
  });
  const instituteId = localStorage.getItem("instituteId");
  const navigate = useNavigate(); // ✅ ADD EXACTLY HERE
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* ================= INPUT HANDLER ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Full name: allow only letters and spaces
    if (name === "name") {
      let filtered = value
        .replace(/[^A-Za-z.\s]/g, "") // ✅ allow dot
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize words

      setForm((prev) => ({ ...prev, name: filtered }));
      return;
    }

    // Phone: allow only digits and max 10
    if (name === "phone") {
      const filtered = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, phone: filtered }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!instituteId) {
      alert("Please open feedback from institute page");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "feedbacks"), {
        name: form.name,
        message: form.message,
        instituteId: instituteId, // ✅ FIXED
        createdAt: serverTimestamp(),
      });
      // ✅ SHOW SUCCESS MESSAGE
      alert("Feedback submitted successfully");

      // ✅ AUTO REDIRECT (NO BUTTON)

      setSuccess(true);

      setForm({
        name: "",
        message: "",
      });
    } catch (error) {
      console.error("REAL ERROR:", error);
      alert(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E7B89E] px-4 py-12">
      <div className="w-full max-w-4xl">
        {/* TITLE */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">
          We Value Your Feedback
        </h1>

        <p className="text-center text-gray-800 mb-8 text-sm md:text-base">
          Tell us about your experience so we can improve our services.
        </p>

        {/* FORM CARD */}
        <div className="bg-white rounded-xl p-6 md:p-10 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NAME + PHONE */}
            {/* FULL NAME */}
            <div>
              <label className="font-medium text-sm">Full Name*</label>

              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full mt-2 border border-orange-400 rounded-lg px-4 py-3 
    focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>

            {/* EXPERIENCE MESSAGE */}
            <div>
              <label className="font-medium text-sm">
                How would you describe your training experience at the
                institute?
              </label>

              <textarea
                rows="6"
                name="message"
                value={form.message}
                onChange={handleChange}
                className="w-full mt-2 border border-orange-400 rounded-lg px-4 py-3 resize-none
    focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>

            {/* BUTTON */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-lg shadow-md transition disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
