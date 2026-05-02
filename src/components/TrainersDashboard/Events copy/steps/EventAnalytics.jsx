import React from "react";

const EventAnalytics = ({ formData }) => {

  const customers = formData?.participants?.customers || [];

  const fee = parseInt(formData?.pricing?.registrationFee || 0);
  const discount = parseInt(formData?.pricing?.discount || 0);

  const present = customers.filter(
    (c) => c.status === "present"
  ).length;

  const finalFee = fee - discount;
  const totalRevenue = present * finalFee;

  return (
    <div className="w-full px-10 pt-6 pb-16">

      {/* Top Summary Cards */}
      <div className="flex flex-col sm:flex-row gap-8 mb-12">

        {/* Customers Joined */}
        <div className="bg-orange-500 text-black px-8 py-6 rounded-xl shadow-md flex items-center gap-6 min-w-[260px]">
          <div className="bg-white p-3 rounded-full text-2xl">
            <img
    src="/contact.png"
    alt="Upload"
    className="w-5 h-5 object-contain"
  />
          </div>
          <div>
            <p className="text-sm font-medium">
              Customers Joined
            </p>
            <p className="text-xl font-bold">
              {customers.length}
            </p>
          </div>
        </div>

        {/* Amount Earned */}
        <div className="bg-orange-500 text-black px-8 py-6 rounded-xl shadow-md flex items-center gap-6 min-w-[260px]">
          <div className="bg-white p-3 rounded-full text-2xl">
            <img
    src="/money.png"
    alt="Upload"
    className="w-5 h-5 object-contain"
  />
          </div>
          <div>
            <p className="text-sm font-medium">
              Amount Earned
            </p>
            <p className="text-xl font-bold">
              ₹ {totalRevenue}
            </p>
          </div>
        </div>

      </div>

      {/* Profile View Analytics */}
      <div>

        <h3 className="text-2xl font-bold ">
          Profile View Analytics
        </h3>

        <div className="bg-white p-8 rounded-xl shadow-md ">

          <div className="relative w-full h-[380px] ">

            {/* Y Axis Labels */}
           <div className="absolute left-2 top-20 flex flex-col gap-8 text-sm text-orange-500">

              <span>30k</span>
              <span>25k</span>
              <span>20k</span>
              <span>15k</span>
              <span>10k</span>
              <span>5k</span>
              <span>0</span>
            </div>

            {/* SVG Graph */}
            <svg
              viewBox="0 0 900 380"
              className="ml-16 w-[92%] h-full"
              shapeRendering="geometricPrecision"
            >
         
              {/* Y Axis Line */}
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="500"
                stroke="black"
                strokeWidth="1.5"
              />

              {/* X Axis Line */}
              <line
                x1="0"
                y1="500"
                x2="900"
                y2="500"
                stroke="black"
                strokeWidth="1.5"
              />

              {/* Graph Line */}
              <polyline
                fill="none"
                stroke="black"
                strokeWidth="2"
                points="
                  0,500
                  80,250
                  160,270
                  240,170
                  320,170
                  400,170
                  480,60
                  560,120
                  640,170
                  720,170
                  800,60
                "
              />

              {/* Orange Dots */}
              {[
                [5, 500],
                [80, 250],
                [160, 270],
                [240, 170],
                [320, 170],
                [400, 170],
                [480, 60],
                [560, 120],
                [640, 170],
                [720, 170],
                [800, 60],
              ].map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#FF6A00"
                />
              ))}

            </svg>

          </div>

          {/* Months */}
          <div className="flex justify-between ml-16 mt-6 text-orange-500 text-sm">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default EventAnalytics;