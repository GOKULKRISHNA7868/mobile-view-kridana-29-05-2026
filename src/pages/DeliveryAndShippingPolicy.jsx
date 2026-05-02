import React from "react";

const DeliveryAndShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-10">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl p-6 md:p-10">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-orange-500">
            Delivery & Shipping Policy
          </h1>
        </div>

        {/* Intro */}
        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          At Kridana (a product of Kdastsho Fintech Solutions Pvt. Ltd.), our platform enables sports institutions and sole proprietorship businesses to list and sell their products through the website shop feature.
        </p>

        {/* Product Listings */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Product Listings
        </h2>
        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          Institutions and independent businesses may add their products to the shop section of our platform. These products are managed and fulfilled by the respective sellers.
        </p>

        {/* Order Processing */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Order Processing
        </h2>
        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          When a customer places an order through the website, the order details are shared with the respective seller for processing and fulfillment. All purchases are conducted through the platform interface.
        </p>

        {/* Delivery & Shipping */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Delivery & Shipping
        </h2>
        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          Delivery of products is arranged and executed by the respective institution or sole proprietor. Shipping timelines, packaging, and logistics are handled by the seller unless otherwise specified. Customers will receive order and delivery updates through the platform or registered communication channels.
        </p>

        {/* Responsibility & Support */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Responsibility & Support
        </h2>
        <p className="text-gray-700 leading-relaxed text-justify mb-6">
          While Kridana provides the platform to facilitate transactions, product availability, shipping timelines, and delivery execution remain the responsibility of the respective sellers. However, we are committed to supporting users and assisting in resolving concerns related to order tracking or communication.
        </p>

        {/* Customer Commitment */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Customer Commitment
        </h2>
        <p className="text-gray-700 leading-relaxed text-justify">
          We aim to provide a smooth and transparent shopping experience by ensuring clear communication between customers and sellers through our platform.
        </p>

      </div>
    </div>
  );
};

export default DeliveryAndShippingPolicy;
