import React from "react";
import { useNavigate } from "react-router-dom";
const PaymentAndRefundPolicy = () => {
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
            Payment & Refund Policy
          </h1>
        </div>

        {/* Payment Terms */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          1. Payment Terms
        </h2>
        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          Kridana, a product of Kdastsho Fintech Solutions Pvt. Ltd., provides
          subscription-based access to software tools for sports institutions
          and independent trainers. Subscription fees are ₹499 per month/year
          for independent trainers and ₹999 per month/year for institutions, as
          applicable. Payments are processed securely through integrated payment
          gateways and must be completed in advance to activate or continue
          access to platform features. Upon successful payment, invoices and
          confirmations are shared with the registered business and
          administrator email IDs.
        </p>

        {/* Free Access for Users */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          2. Free Access for Users
        </h2>
        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          General users, including parents, students, and individuals exploring
          sports services, may access the platform without subscription charges.
          Fees are applicable only to institutions and independent trainers for
          use of software tools.
        </p>

        {/* Refund Policy */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          3. Refund Policy
        </h2>
        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          If a customer requests cancellation after payment, refund requests
          must be submitted within the eligible period. Approved refunds will be
          processed within 48 hours of confirmation and credited through the
          original payment method, subject to payment gateway timelines. Refunds
          may not be applicable once subscription benefits have been extensively
          utilized or in cases of policy misuse.
        </p>

        {/* Cancellation Policy */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          4. Cancellation Policy
        </h2>
        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          Subscribers may cancel renewal at any time through their account
          settings or by contacting support. Cancellation prevents future
          billing but does not retroactively refund completed billing cycles
          unless covered under the refund terms.
        </p>

        {/* Policy Updates */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          5. Policy Updates
        </h2>
        <p className="text-gray-700 leading-relaxed text-justify">
          Kdastsho Fintech Solutions Pvt. Ltd. reserves the right to update this
          policy to reflect operational, regulatory, or product changes. Updated
          versions will be published on the official website.
        </p>
      </div>
    </div>
  );
};

export default PaymentAndRefundPolicy;
