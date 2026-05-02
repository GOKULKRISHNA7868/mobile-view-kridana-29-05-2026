import React, { useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Career() {
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ================= JOB INFO ================= */
  const job = {
    title: "Senior Python Developer",
    experience: "3+ Years",
    description:
      "We are looking for a Senior Python Developer with 3+ years of experience. Strong Python knowledge is required.",
    image: "https://picsum.photos/800/600?python",
  };

  /* ================= FORM STATE ================= */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [yearsOfExp, setYearsOfExp] = useState("");
  const [keySkills, setKeySkills] = useState("");
  const [profileLink, setProfileLink] = useState("");

  /* ================= SUBMIT HANDLER ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !contactNo || !yearsOfExp || !keySkills) {
      alert("Please fill all required fields");
      return;
    }
    if (contactNo.length !== 10) {
      alert("Contact number must be exactly 10 digits");
      return;
    }
    setLoading(true);

    try {
      await addDoc(collection(db, "career_applications"), {
        name,
        email,
        contactNo,
        yearsOfExperience: yearsOfExp,
        keySkills,
        profileLink,
        role: job.title,
        status: "applied",
        createdAt: serverTimestamp(),
      });

      alert("Application submitted successfully!");

      // Reset form
      setName("");
      setEmail("");
      setContactNo("");
      setYearsOfExp("");
      setKeySkills("");
      setProfileLink("");
      setShowApplyForm(false);
    } catch (error) {
      console.error("Career submit error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#F7F1EC] text-gray-900">
      {/* ================= HERO ================= */}
      <section className="relative min-h-[60vh] md:min-h-screen flex items-center">
        <video
          className="absolute inset-0 w-full h-full object-cover md:object-cover object-contain"
          autoPlay
          loop
          muted
          playsInline
        >
          <source
            src="https://res.cloudinary.com/dhpgznidl/video/upload/v1752660725/8201837-uhd_3840_2160_25fps_rgd2so.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 px-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Careers at KDASTSHO
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white">
            We are hiring experienced Python developers
          </p>
        </div>
      </section>

      {/* ================= JOB CARD ================= */}
      <section className="max-w-5xl mx-autopy-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-orange-500">
          Open Position
        </h2>

        <div className="flex justify-center">
          <div className="relative rounded-2xl overflow-hidden shadow-xl max-w-md w-full sm:max-w-lg md:max-w-md">
            <img
              src={job.image}
              alt={job.title}
              className="w-full h-48 sm:h-56 md:h-64 object-cover"
            />

            <div className="absolute inset-0 bg-black/60 p-6 flex flex-col justify-end">
              <h3 className="text-2xl text-white font-semibold">{job.title}</h3>
              <p className="text-gray-200 text-sm mt-1">
                Experience: {job.experience}
              </p>
              <p className="text-gray-200 text-sm mt-2">{job.description}</p>

              <button
                onClick={() => setShowApplyForm(true)}
                className="mt-4 bg-[#fb923c] hover:bg-[#ea580c] text-white px-5 sm:px-6 py-2 rounded-full flex items-center gap-2 w-fit text-sm sm:text-base"
              >
                Apply <FaArrowRight />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= APPLY FORM ================= */}
      {showApplyForm && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
            <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-orange-500">
              Apply for {job.title}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="text"
                placeholder="Full Name *"
                value={name}
                onChange={(e) => {
                  let value = e.target.value
                    .replace(/[^A-Za-z.\s]/g, "") // allow letters + dot + space
                    .replace(/\s+/g, " ") // remove extra spaces
                    .replace(/\.(?=\S)/g, ". ") // add space after dot if missing
                    .toLowerCase()
                    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize

                  setName(value);
                }}
                className="w-full border rounded-lg px-4 py-2"
              />
              <input
                type="email"
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
              />

              <input
                type="tel"
                placeholder="Contact Number *"
                value={contactNo}
                maxLength={10}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, ""); // ✅ only numbers
                  value = value.slice(0, 10); // ✅ max 10 digits

                  setContactNo(value);
                }}
                className="w-full border rounded-lg px-4 py-2"
              />

              <input
                type="number"
                placeholder="Years of Experience *"
                value={yearsOfExp}
                onChange={(e) => setYearsOfExp(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
              />

              <textarea
                placeholder="Key Skills (Python, Django, APIs, etc.) *"
                value={keySkills}
                onChange={(e) => setKeySkills(e.target.value)}
                rows={3}
                className="w-full border rounded-lg px-4 py-2"
              />

              <input
                type="url"
                placeholder="LinkedIn / GitHub Profile (optional)"
                value={profileLink}
                onChange={(e) => setProfileLink(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
              />

              <div className="flex justify-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-2 rounded-full text-white ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#fb923c] hover:bg-[#ea580c]"
                  }`}
                >
                  {loading ? "Submitting..." : "Submit Application"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowApplyForm(false)}
                  className="border px-8 py-2 rounded-full"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
