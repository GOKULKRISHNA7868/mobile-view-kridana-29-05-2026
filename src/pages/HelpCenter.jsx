import React, { useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
const HelpCenter = () => {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();
  const ticketId = "TKT - 2026 - 01234";
  const [formData, setFormData] = useState({
    fullName: "",
    contactNumber: "",
    email: "",
    issue: "",
    file: null,
  });
  const [complaints, setComplaints] = useState([]);
  const fetchComplaints = async () => {
    const q = query(collection(db, "helpcenter"), where("uid", "==", user.uid));

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setComplaints(data);
  };
  const generateTicketId = async () => {
    const snapshot = await getDocs(collection(db, "helpcenter"));
    const count = snapshot.size + 1;

    const ticketNumber = String(count).padStart(5, "0");

    return `TKT-${ticketNumber}`;
  };
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      file: e.target.files[0],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const ticketId = await generateTicketId();

      await addDoc(collection(db, "helpcenter"), {
        ticketId: ticketId,
        uid: user.uid,

        fullName: formData.fullName,
        contactNumber: formData.contactNumber,
        email: formData.email,
        issue: formData.issue,

        fileName: formData.file ? formData.file.name : "",

        status: "Pending",

        reportedOn: serverTimestamp(),
        resolvedOn: null,
      });

      setShowSuccess(true);
    } catch (error) {
      console.error("Error submitting complaint:", error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#E3B499] flex justify-center items-start md:items-center py-10 md:py-16 px-4">
      <div className="w-full max-w-6xl">
        {/* Heading */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#FF6A00] font-semibold mb-6"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2">
          How Can We Help You Today?
        </h1>

        <p className="text-center text-gray-700 mb-10">
          Find answers, guides, and support to solve your questions quickly.
        </p>

        {/* Form Container */}
        <div className="bg-white p-5 sm:p-6 md:p-10 rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            {/* Row 1 */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="font-medium">Full Name*</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => {
                    let value = e.target.value
                      .replace(/[^A-Za-z.\s]/g, "") // allow only letters
                      .toLowerCase()
                      .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize each word

                    setFormData({ ...formData, fullName: value });
                  }}
                  className="w-full mt-2 p-3 border border-orange-400 rounded-md outline-none"
                />
              </div>

              <div>
                <label className="font-medium">Contact Number*</label>
                <input
                  type="tel"
                  name="contactNumber"
                  required
                  value={formData.contactNumber}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setFormData({ ...formData, contactNumber: value });
                  }}
                  className="w-full mt-2 p-3 border border-orange-400 rounded-md outline-none"
                />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="font-medium">Email Address*</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full mt-2 p-3 border border-orange-400 rounded-md outline-none"
                />
              </div>

              <div>
                <label className="font-medium">
                  Upload Supporting File (Optional)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full mt-2 p-3 border border-orange-400 rounded-md outline-none"
                />
              </div>
            </div>

            {/* Issue */}
            <div className="mb-8">
              <label className="font-medium">Issue Description*</label>

              <textarea
                rows="4"
                name="issue"
                required
                onChange={handleChange}
                className="w-full mt-2 p-3 border border-orange-400 rounded-md outline-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
              <button
                type="button"
                onClick={() => {
                  fetchComplaints();
                  setShowHistory(true);
                }}
                className="px-6 py-3 border border-orange-400 text-black rounded-md hover:bg-orange-50"
              >
                View Complaints History
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
      {showHistory && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-6xl mx-auto mt-10 rounded-xl p-6 md:p-10 relative shadow-md">
            <div className="flex items-center justify-between mb-10 border-b pb-4">
              <button onClick={() => setShowHistory(false)} className="text-xl">
                ←
              </button>

              <h2 className="text-2xl md:text-3xl font-semibold">
                Complaint History
              </h2>

              <button onClick={() => setShowHistory(false)} className="text-xl">
                ✕
              </button>
            </div>
            {/* Table Header */}
            <div className="grid grid-cols-4 bg-orange-200 text-center py-2 rounded-md font-semibold mb-4">
              <p>Issue</p>
              <p>Reported On</p>
              <p>Status</p>
              <p>Resolved On</p>
            </div>

            {/* Row 1 */}
            {/* Complaint List */}
            {complaints.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-4 items-center border rounded-lg p-4 mb-3"
              >
                <div>
                  <p className="font-medium">{item.issue}</p>
                  <p className="text-sm text-gray-500"># {item.ticketId}</p>
                </div>

                <p className="text-center">
                  {item.reportedOn?.toDate().toLocaleDateString()}
                </p>

                <div className="flex justify-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm text-white ${
                      item.status === "Solved"
                        ? "bg-green-500"
                        : item.status === "Process"
                          ? "bg-green-600"
                          : "bg-red-500"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-center">
                  {item.resolvedOn
                    ? item.resolvedOn.toDate().toLocaleDateString()
                    : "-"}
                </p>
              </div>
            ))}
            {/* Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-600"
              >
                Cancel
              </button>

              <button
                onClick={() => setShowHistory(false)}
                className="bg-orange-500 text-white px-4 py-2 rounded-md"
              >
                Raise Complaint
              </button>
            </div>
          </div>
        </div>
      )}
      {showSuccess && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="bg-white w-[95%] sm:w-[80%] md:w-[650px] lg:w-[700px] rounded-xl p-6 sm:p-8 md:p-10 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowSuccess(false)}
              className="absolute top-4 right-6 text-2xl"
            >
              ✕
            </button>

            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="bg-green-500 text-white w-16 h-16 flex items-center justify-center rounded-full text-3xl">
                ✓
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-center mb-2">
              Ticket Raised Successfully!
            </h2>

            <p className="text-center text-gray-600 mb-6">
              Your issue has been submitted and our support team will solve
              within 24 to 48 hours shortly.
            </p>

            {/* Ticket Box */}
            <div className="bg-gray-200 p-6 rounded-xl flex justify-between items-center mb-6">
              <div>
                <p className="text-gray-600 text-sm">Ticket Id</p>
                <p className="font-semibold text-lg">{ticketId}</p>
              </div>

              <button
                onClick={() => navigator.clipboard.writeText(ticketId)}
                className="bg-orange-200 px-4 py-2 rounded-md"
              >
                Copy
              </button>
            </div>

            {/* What Happens Next */}
            <div className="bg-orange-200 p-6 rounded-xl">
              <h3 className="font-semibold text-lg mb-3">What happens next?</h3>

              <ul className="list-disc ml-6 text-gray-800 space-y-1">
                <li>You'll receive a confirmation email shortly</li>
                <li>Our team will review your ticket within 24 hours</li>
                <li>Track your ticket status in your dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpCenter;
