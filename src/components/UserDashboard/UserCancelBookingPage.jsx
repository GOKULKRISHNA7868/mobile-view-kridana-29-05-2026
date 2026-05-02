import React, { useState } from "react";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import { CheckCircle } from "lucide-react";

const UserCancelBookingPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bookingId: "",
    fullName: "",
    email: "",
    phone: "",
    reason: "",
    refundMethod: "",
    acceptPolicy: false,
  });
const [showSuccess, setShowSuccess] = useState(false);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

const handleSubmit = (e) => {
  e.preventDefault();

  console.log("Cancellation Request:", formData);

  // Show success popup
  setShowSuccess(true);
};

  return (
    <div className="min-h-screen bg-white">

      {/* ===== Top Header ===== */}
     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-b border-orange-200">
        <div className="flex items-center gap-3">


          <div className="flex items-center gap-2 border border-orange-400 rounded-md px-3 py-1 text-sm">
            <MapPin size={14} />
            Marathahalli, Bangalore, India
          </div>
        </div>

       <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm font-medium">
          <button>Venues</button>
          <button>Book Now</button>
        </div>
      </div>

      {/* ===== Page Content ===== */}
     <div className="w-full max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4">

        {/* Title */}
        <h2 className="text-lg font-semibold">
          Cancellation Sport Slot Booking
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Please provide the following information to process your cancellation request
        </p>

        {/* ===== Booking Details Box ===== */}
       <div className="border border-orange-400 rounded-md p-4 sm:p-5 bg-white mb-6">
          <h3 className="font-semibold mb-4">Booking Details</h3>

          <div className="text-sm space-y-2">
            <p><strong>Date :</strong> 26th – March – 2026</p>
            <p><strong>Time :</strong> 12:00pm – 01:00pm</p>
            <p><strong>Location :</strong> Marathahalli, Bangalore</p>
          </div>
        </div>

        {/* ===== Cancellation Policy ===== */}
        <div className="bg-orange-50 border border-orange-200 rounded-md p-3 sm:p-4 mb-6">
          <h4 className="font-semibold mb-2">Cancellation Policy</h4>
          <p className="text-sm text-gray-700">
            Cancellations made 24+ hours before the booking time will receive a full refund.
            Cancellations within 24 hours may incur a 50% cancellation fee.
          </p>
        </div>

        {/* ===== Form ===== */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

          {/* Booking ID */}
          <div>
            <label className="text-sm font-medium">
              Booking ID / Reference Number*
            </label>
            <input
              type="text"
              name="bookingId"
              value={formData.bookingId}
              onChange={handleChange}
              required
              className="w-full mt-1 border border-orange-300 rounded-md px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="text-sm font-medium">Full Name*</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="w-full mt-1 border border-orange-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium">E Mail Address*</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full mt-1 border border-orange-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium">Phone Number*</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full mt-1 border border-orange-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-sm font-medium">Reason for Cancellation*</label>
            <div className="mt-2 space-y-2 text-xs sm:text-sm">
              {[
                "Schedule conflict / Unable to attend",
                "Weather conditions",
                "Injury / Health reasons",
                "Facility or court issue",
                "Duplicate booking",
                "Other",
              ].map((item) => (
                <label key={item} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="reason"
                    value={item}
                    checked={formData.reason === item}
                    onChange={handleChange}
                    required
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>

          {/* Refund Method */}
          <div>
            <label className="text-sm font-medium">
              Preferred Refund Method*
            </label>
            <div className="mt-2 space-y-2 text-sm">
              {[
                "Refund to original payment method",
                "Add to account wallet for future bookings",
                "Bank transfer (3–5 business days)",
              ].map((method) => (
                <label key={method} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="refundMethod"
                    value={method}
                    checked={formData.refundMethod === method}
                    onChange={handleChange}
                    required
                  />
                  {method}
                </label>
              ))}
            </div>
          </div>

          {/* Accept Policy */}
<div className="flex items-start gap-3 text-sm mt-2">
  <input
    type="checkbox"
    name="acceptPolicy"
    checked={formData.acceptPolicy}
    onChange={handleChange}
    required
    className="mt-[3px] accent-orange-500"
  />
  <label className="text-gray-700 leading-5">
    I understand and accept the cancellation policy. I confirm that
    all the information provided is accurate.
  </label>
</div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-1/2 bg-gray-300 text-black py-2 rounded-md font-medium text-black py-2 rounded-md font-medium"
            >
              Go Back
            </button>

            <button
              type="submit"
              className="w-1/2 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md font-medium"
            >
              Submit Cancellation Request
            </button>
          </div>

        </form>
      </div>
      {showSuccess && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    
    {/* Modal Box */}
   <div className="bg-white w-[90%] max-w-2xl rounded-lg p-4 sm:p-8 relative">

      {/* Close Button */}
      <button
        onClick={() => setShowSuccess(false)}
        className="absolute top-3 right-4 text-lg font-bold"
      >
        ×
      </button>

      {/* Content */}
      <div className="border-2 border-orange-500 rounded-lg p-8 text-center">

<div className="flex justify-center mb-4">
  <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
    <span className="text-white text-2xl font-bold">✓</span>
  </div>
</div>

        {/* Message */}
        <p className="text-gray-800 font-medium">
          Your cancellation request has been received. A confirmation email will be sent to{" "}
          <span className="font-semibold">{formData.email}</span> within 24 hours.
        </p>

        <p className="mt-2 text-sm text-gray-600">
          Booking ID : {formData.bookingId || "12345"}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 justify-center">
        <button
          onClick={() => navigate("/my-bookings")}
          className="border border-orange-500 px-4 py-2 rounded-md"
        >
          View all bookings
        </button>

        <button
          onClick={() => setShowSuccess(false)}
          className="bg-orange-500 text-white px-6 py-2 rounded-md"
        >
          Go Back
        </button>
      </div>

    </div>
  </div>
)}
    </div>
  );
};

export default UserCancelBookingPage;