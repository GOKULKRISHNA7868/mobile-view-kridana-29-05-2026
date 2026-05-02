import React, { useEffect, useState } from "react";
import { MapPin, Star, Share2, Users } from "lucide-react";

// ================= DUMMY DATA =================
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
export default function BookingsPage() {
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAllDates, setShowAllDates] = useState(false);
  const [dates, setDates] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedSport, setSelectedSport] = useState("");
  const { user } = useAuth();

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState(1);
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const institutesSnap = await getDocs(collection(db, "institutes"));

        let allFacilities = [];

        for (const instituteDoc of institutesSnap.docs) {
          const instituteId = instituteDoc.id;

          const facilitiesSnap = await getDocs(
            collection(db, "institutes", instituteId, "sportsfacilities"),
          );

          facilitiesSnap.forEach((docSnap) => {
            const data = docSnap.data();

            allFacilities.push({
              id: docSnap.id,
              instituteId: data.instituteId,

              // UI mapping (IMPORTANT)
              instituteName: data.basicDetails?.instituteName,
              location: data.basicDetails?.location,
              rating: 4.5, // (static for now)
              image: data.facilityDetails?.courtImages?.[0] || "/gym.jpg",

              // full data for booking
              fullData: data,
            });
          });
        }

        setVenues(allFacilities);
        setFilteredVenues(allFacilities);
      } catch (err) {
        console.error("Fetch Error:", err);
      }
    };

    fetchFacilities();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredVenues(venues);
      return;
    }

    const filtered = venues.filter((item) =>
      item.location.toLowerCase().includes(search.toLowerCase()),
    );

    setFilteredVenues(filtered);
  }, [search, venues]);
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();

    const startDate = new Date(year, month, today.getDate());
    const endDate = new Date(year, month + 1, 0);

    let temp = [];

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      temp.push(new Date(d));
    }

    setDates(temp);
  }, [month]);
  // ================= SLOT PAGE =================
  if (selectedVenue) {
    if (showBookingForm) {
      return (
        <div className="bg-gray-100 min-h-screen p-3 sm:p-4 md:p-6">
          <button
            onClick={() => setShowBookingForm(false)}
            className="mb-4 text-orange-500"
          >
            ← Back
          </button>

          <h2 className="text-xl font-semibold mb-4">Book Your Slot Now</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* LEFT FORM */}
            <div className="border-2 border-orange-400 rounded-lg p-4 sm:p-5 bg-white">
              <h3 className="font-semibold mb-2">Institute Name</h3>
              <div className="border-b-2 border-orange-400 mb-3"></div>
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <MapPin size={14} className="mr-1 text-orange-500" />
                {selectedVenue.location}
              </div>

              <div className="space-y-3">
                <div>
                  <label>Sports</label>
                  <select className="w-full border border-orange-400 rounded px-2 py-2 text-sm sm:text-base"></select>
                </div>

                <div>
                  <label>Date</label>
                  <input
                    value={selectedDates.map((d) => `Mar ${d}`).join(", ")}
                    readOnly
                    className="w-full border border-orange-400 rounded px-2 py-2 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label>Time</label>

                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full border border-orange-400 rounded px-2 py-2 text-sm sm:text-base"
                    />

                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full border border-orange-400 rounded px-2 py-2 text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label>Duration</label>
                  <div className="flex justify-between border border-orange-400 rounded px-3 py-1">
                    <button
                      onClick={() => setDuration(Math.max(1, duration - 1))}
                    >
                      -
                    </button>
                    <span>{duration}</span>
                    <button onClick={() => setDuration(duration + 1)}>+</button>
                  </div>
                </div>

                <div>
                  <label>Court</label>
                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    className="w-full border border-orange-400 rounded px-2 py-2 text-sm sm:text-base"
                  >
                    <option value="">Select Sport</option>

                    {(
                      selectedVenue.fullData?.facilityDetails
                        ?.sportsProviding || ""
                    )
                      .split(",")
                      .map((sport, i) => (
                        <option key={i} value={sport.trim()}>
                          {sport.trim()}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    if (!user) {
                      alert("Please login");
                      return;
                    }

                    const bookingId = Date.now().toString();

                    const bookingRef = doc(
                      db,
                      "bookings", // 🔥 CENTRALIZED COLLECTION (BEST FOR ADMIN)
                      bookingId,
                    );

                    await setDoc(bookingRef, {
                      bookingId,

                      // USER
                      studentId: user.uid,

                      // INSTITUTE + FACILITY
                      instituteId: selectedVenue.instituteId,
                      facilityId: selectedVenue.id,
                      instituteName: selectedVenue.instituteName,
                      location: selectedVenue.location,

                      // BOOKING DETAILS
                      selectedDates,
                      selectedSport,
                      startTime,
                      endTime,
                      duration,

                      // PRICING
                      pricePerHour:
                        selectedVenue.fullData?.facilityDetails?.pricePerHour ||
                        0,
                      advanceAmount:
                        selectedVenue.fullData?.facilityDetails
                          ?.advanceAmount || 0,

                      totalAmount:
                        (selectedVenue.fullData?.facilityDetails
                          ?.pricePerHour || 0) *
                        duration *
                        selectedDates.length,

                      // STATUS
                      status: "booked",

                      // TIMESTAMPS
                      createdAt: serverTimestamp(),
                    });

                    setShowSuccess(true);
                  } catch (err) {
                    console.error(err);
                    alert("Booking failed");
                  }
                }}
                className="w-full bg-orange-500 text-white py-2 rounded mt-4"
              >
                Book Now
              </button>
            </div>

            {/* RIGHT CART */}
            <div className="space-y-3 sm:space-y-4">
              <div className="border-2 border-orange-400 rounded-lg p-4 bg-white">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Cart (01)</h3>

                  <img
                    src="/delete-icon.png"
                    alt="delete"
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="border-b-2 border-orange-400 mb-3"></div>

                <p className="font-medium">Basket Ball</p>
                <p className="text-sm text-gray-500">
                  March 29th, 2026 &nbsp;&nbsp; 12:00pm - 01:00pm
                </p>

                <div className="flex justify-between mt-2 text-sm">
                  <span>Price : ₹1000</span>
                  <span>Advance to pay : ₹500</span>
                </div>

                <button className="w-full bg-orange-500 text-white py-2 rounded mt-3">
                  Proceed to pay
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  placeholder="Apply coupons"
                  className="flex-1 w-full border border-orange-400 rounded px-2 py-1"
                />
                <button className="bg-orange-500 text-white px-4 rounded">
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* ✅ SUCCESS MODAL GOES HERE */}
          {showSuccess && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white w-[90%] max-w-2xl rounded-xl p-4 sm:p-8 relative border-2 border-orange-400">
                {/* Close */}
                <button
                  onClick={() => setShowSuccess(false)}
                  className="absolute top-3 right-4 text-xl"
                >
                  ✕
                </button>

                {/* Tick */}
                <div className="flex justify-center mb-4">
                  <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl">
                    ✓
                  </div>
                </div>

                {/* Text */}
                <div className="text-center text-gray-700">
                  <p className="font-medium">
                    Your Slot has been booked successfully
                  </p>
                  <p>March 26, 12:00 PM</p>
                  <p className="mt-2">Booking ID: 12345</p>
                </div>

                {/* Button */}
                <div className="mt-6 flex justify-start">
                  <button className="bg-orange-500 text-white px-6 py-2 rounded-md">
                    Cancel Slot
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="bg-gray-100 min-h-screen p-4 md:p-6">
        <button
          onClick={() => setSelectedVenue(null)}
          className="mb-4 text-orange-500"
        >
          ← Back
        </button>
        {/* TOP BAR (same as list) */}
        <div className="bg-white rounded-xl p-3 mb-4 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* SEARCH */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center border-2 border-orange-400 rounded-lg px-3 sm:px-4 py-2 w-full md:w-96 bg-white">
                  <MapPin className="mr-2" size={18} />
                  <input
                    type="text"
                    placeholder="Search location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="outline-none w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-gray-500">Venues</span>
              <span className="text-orange-500 border-b-2 border-orange-500">
                Book Now
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-3">
            <span>Venues (300)</span>
            <span>Membership (50)</span>
            <span>Events (13)</span>
            <button className="ml-auto border px-3 py-1 rounded">
              All Bookings
            </button>
          </div>
        </div>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              {selectedVenue.instituteName}
            </h2>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPin size={14} className="mr-1 text-orange-500" />
              {selectedVenue.location}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-4">
            <img
              src={selectedVenue.image}
              className="w-full h-64 object-cover rounded-xl"
            />

            <div>
              <h3 className="font-semibold mb-2">Sports Available</h3>
              <div className="flex gap-3">
                {(
                  selectedVenue.fullData?.facilityDetails?.sportsProviding || ""
                )
                  .split(",")
                  .map((s, i) => (
                    <div
                      key={i}
                      className="border rounded-lg px-3 py-2 text-xs bg-white"
                    >
                      {s.trim()}
                    </div>
                  ))}
              </div>
            </div>

            <div className="border border-orange-500 rounded-lg p-3  bg-white">
              <h3 className="font-semibold mb-2">Amenities</h3>
              <div className="text-sm text-gray-600 flex flex-wrap gap-3">
                {selectedVenue.fullData?.facilityDetails?.amenities?.map(
                  (item, i) => (
                    <span key={i}>{item}</span>
                  ),
                )}
              </div>
            </div>

            <div className="border border-orange-500 rounded-lg p-3 bg-white min-h-[100px]">
              <h3 className="font-semibold mb-2">About Venue</h3>
              <p className="text-sm text-gray-600">
                {selectedVenue.fullData?.facilityDetails?.aboutVenue ||
                  "No description"}
              </p>
            </div>
          </div>

          {/* RIGHT */}

          <div className="space-y-4">
            <div className="border-2 border-orange-400 rounded-lg p-5 bg-gray-100">
              <button
                onClick={() => {
                  if (selectedDates.length === 0) {
                    alert("Please select at least one date");
                    return;
                  }
                  setShowBookingForm(true);
                }}
                className="w-full bg-orange-500 text-white py-3 rounded-md font-semibold text-lg mb-4"
              >
                Book a Slot
              </button>
              <div className="flex gap-3 mb-4">
                <button className="border-2 border-orange-400 rounded-md px-6 py-2 flex items-center gap-2 bg-white text-sm">
                  <Share2 size={16} /> Share
                </button>

                <button className="border-2 border-orange-400 rounded-md px-6 py-2 flex items-center gap-2 bg-white text-sm">
                  <Users size={16} /> Max Players{" "}
                  {selectedVenue.fullData?.facilityDetails?.capacityPlayers ||
                    0}
                </button>
              </div>

              <div className="flex gap-3 mb-4">
                <select className="border px-2 py-1 rounded">
                  <option>
                    {selectedVenue.fullData?.availability?.month || "N/A"}
                  </option>
                </select>

                <select className="border px-3 py-1 rounded text-sm bg-white">
                  <option>
                    {selectedVenue.fullData?.availability?.startTime} -{" "}
                    {selectedVenue.fullData?.availability?.endTime}
                  </option>
                </select>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-2 sm:gap-3">
                {(showAllDates
                  ? selectedVenue.fullData?.availability?.selectedDates || []
                  : (
                    selectedVenue.fullData?.availability?.selectedDates || []
                  ).slice(0, 7)
                ).map((day, i) => {
                  const dateObj = new Date(2026, 2, day); // March = 2

                  return (
                    <div
                      key={i}
                      className={`border border-orange-400 rounded-md text-center py-3 text-xs cursor-pointer
  ${selectedDates.includes(day)
                          ? "bg-orange-500 text-white"
                          : "bg-white hover:bg-orange-100"
                        }`}
                      onClick={() => {
                        if (selectedDates.includes(day)) {
                          setSelectedDates(
                            selectedDates.filter((d) => d !== day),
                          );
                        } else {
                          setSelectedDates([...selectedDates, day]);
                        }
                      }}
                    >
                      <div>
                        {dateObj.toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </div>
                      <div>{day}</div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowAllDates(!showAllDates)}
                className="mt-5 w-3/4 mx-auto block bg-orange-500 text-white py-2 rounded-md"
              >
                {showAllDates ? "Show Less" : "View All Dates"}
              </button>
            </div>

            <div className="border-2 border-orange-400 rounded-lg bg-white">
              <h3 className="p-3 font-semibold">Location</h3>
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  selectedVenue.location,
                )}&z=13&output=embed`}
                className="w-full h-40 rounded-b-lg"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= LIST PAGE =================
  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-6">
      {/* TOP HEADER (FIX ADDED) */}
      <div className="bg-white rounded-xl p-3 mb-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* SEARCH */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center border-2 border-orange-400 rounded-lg px-4 py-2 w-full md:w-96 bg-white">
                <MapPin className="mr-2" size={18} />
                <input
                  type="text"
                  placeholder="Search location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="outline-none w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-orange-500 border-b-2 border-orange-500">
              Venues
            </span>
            <span className="text-gray-600">Book Now</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3">
          <span className="font-medium">Venues (300)</span>
          <span>Membership (50)</span>
          <span>Events (13)</span>
          <button className="ml-auto border px-3 py-1 rounded">
            All Bookings
          </button>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredVenues.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border-2 border-orange-400 overflow-hidden"
          >
            <img src={item.image} className="w-full h-48 object-cover" />

            <div className="p-3">
              <div className="flex justify-between">
                <h3 className="font-semibold">{item.instituteName}</h3>
                <div className="flex items-center text-sm">
                  <Star size={14} className="text-yellow-500 mr-1" />
                  {item.rating}
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500 mt-1">
                <MapPin size={14} className="mr-1 text-orange-500" />
                {item.location}
              </div>

              <div className="flex justify-between mt-3">
                <span className="text-xs bg-orange-100 px-2 py-1 rounded">
                  Get up to 10% off
                </span>

                <button
                  onClick={() => setSelectedVenue(item)}
                  className="bg-orange-500 text-white px-3 py-1 rounded-md"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
