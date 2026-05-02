import React from "react";
import { useNavigate } from "react-router-dom";
const CustomerCentricPolicies = () => {
   const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-10">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl p-6 md:p-10">
        <button
          onClick={() => navigate("/privacy")}
          className="text-blue-600 underline mb-6"
        >
          ← Back to Policies
        </button>
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-orange-500">
            Customer-Centric Policies – Refund & Cancellation
          </h1>
        </div>

        {/* Intro */}
        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          At Kridana (a product of Kdastsho Fintech Solutions Pvt. Ltd.), we are
          committed to providing transparent and customer-friendly policies for our users.
        </p>

        {/* Subscription Plans */}
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          Subscription Plans
        </h2>

        <p className="text-gray-700 leading-relaxed text-justify mb-3">
          We offer subscription-based access to our software tools:
        </p>

        <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
          <li>₹999 for sports institutions</li>
          <li>₹499 for sole proprietorship sports businesses</li>
        </ul>

        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          Upon successful payment, subscription access details and confirmation
          will be shared directly with the registered business email ID and the
          main administrator email ID.
        </p>

        {/* Cancellation Policy */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Cancellation Policy
        </h2>
        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          Customers may request cancellation of their subscription by contacting
          our support team through the official communication channels.
          Cancellation requests will be reviewed and processed in accordance
          with our service terms.
        </p>

        {/* Refund Policy */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Refund Policy
        </h2>
        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          If a refund request is approved, the refund will be initiated within
          48 hours of confirmation. The amount will be processed back through
          the original payment method, subject to applicable payment gateway
          timelines.
        </p>

        {/* Customer Commitment */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Customer Commitment
        </h2>
        <p className="text-gray-700 leading-relaxed text-justify">
          We strive to ensure fair handling of customer requests, prompt
          communication, and transparent processes. Our goal is to deliver
          reliable software tools while maintaining trust and satisfaction
          across all customer interactions.
        </p>

      </div>
    </div>
  );
};

export default CustomerCentricPolicies;
