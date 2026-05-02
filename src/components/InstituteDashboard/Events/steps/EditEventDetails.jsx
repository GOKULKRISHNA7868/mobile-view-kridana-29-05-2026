import React, { useState, useEffect } from "react";
import { db } from "../../../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../../../../context/AuthContext";
import { deleteDoc } from "firebase/firestore"; // ✅ ADD THIS
export default function EditEventDetails({ eventId, goBack, setActiveMenu }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    organizerName: "",
    volunteersName: "",
    registrationFees: "",
    contactNumber: "",
    email: "",
    emergencyNumber: "",
    documents: "",
    dates: "",
    timings: "",
    address: "",
  });

  const [customers, setCustomers] = useState([]);
  const [management, setManagement] = useState([]);
  const { user } = useAuth(); // admin login

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", email: "" });

  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;

      const ref = doc(db, "events", eventId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        setForm(data.form || {});
        setCustomers(data.customers || []);
        setManagement(data.management || []);
      }
    };

    fetchData();
  }, [eventId]);
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.uid) return;

      const q = query(
        collection(db, "events"),
        where("instituteId", "==", user.uid),
      );

      const snap = await getDocs(q);

      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setEvents(list);
    };

    fetchEvents();
  }, [user]);
  const handleEventSelect = async (id) => {
    setSelectedEventId(id);

    const ref = doc(db, "events", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();

    setForm({
      organizerName: data.organizer?.organizerName || "",
      volunteersName: data.organizer?.volunteersName || "",
      registrationFees: data.pricing?.[0]?.amount || "",
      contactNumber: data.organizer?.phone || "",
      email: data.organizer?.email || "",
      emergencyNumber: data.organizer?.emergencyContact || "",
      documents: data.participants?.requiredDocument || "",
      startDate: formatDate(data.schedule?.startDate),
      endDate: formatDate(data.schedule?.endDate),
      timings: data.schedule?.startTime || "",
      address: data.schedule?.address || "",
    });
    setCustomers(
      Array.isArray(data.participants?.otherInstituteCustomers)
        ? data.participants.otherInstituteCustomers
        : [],
    );
    setManagement(
      Array.isArray(data.participants?.selectedCustomers)
        ? data.participants.selectedCustomers.map((name) => ({ name }))
        : [],
    );
  };
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!selectedEventId) return;

    await setDoc(
      doc(db, "events", selectedEventId),
      {
        organizer: {
          organizerName: form.organizerName,
          volunteersName: form.volunteersName,
          phone: form.contactNumber,
          email: form.email,
          emergencyContact: form.emergencyNumber,
        },

        schedule: {
          address: form.address,
          startDate: form.startDate,
          endDate: form.endDate,
        },

        pricing: [
          {
            type: "registrationFee",
            amount: form.registrationFees,
          },
        ],

        participants: {
          otherInstituteCustomers: customers,
          selectedCustomers: management.map((m) => m.name),
        },
      },
      { merge: true },
    );

    alert("Event Updated Successfully");
  };
  const handleCancelEvent = async () => {
    if (!selectedEventId) {
      alert("Please select an event");
      return;
    }

    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this event?",
    );

    if (!confirmCancel) return;

    try {
      await deleteDoc(doc(db, "events", selectedEventId)); // ✅ DELETE EVENT

      alert("Event cancelled successfully");

      setSelectedEventId(""); // clear selection
      setForm({}); // clear form
      setCustomers([]);
      setManagement([]);
    } catch (error) {
      console.error(error);
      alert("Failed to cancel event");
    }
  };
  // Capitalize each word (Ravi Kumar)
  const capitalizeWords = (value) => {
    return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Allow only alphabets + space
  const onlyAlphabets = (value) => {
    return value.replace(/[^A-Za-z\s]/g, "");
  };
  const removeCustomer = (index) => {
    setCustomers(customers.filter((_, i) => i !== index));
  };

  const removeManagement = (index) => {
    setManagement(management.filter((_, i) => i !== index));
  };
  const formatDate = (date) => {
    if (!date) return "";

    // correct format
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

    // dd-mm-yyyy → convert
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      const [dd, mm, yyyy] = date.split("-");
      return `${yyyy}-${mm}-${dd}`;
    }

    return ""; // reject invalid like 222222
  };
  const inputStyle =
    "w-full border border-orange-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500";
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Edit Event Details</h2>

          <button
            onClick={handleCancelEvent}
            className="border border-orange-500 text-orange-500 px-4 py-1 rounded-md hover:bg-orange-50"
          >
            Cancel Event
          </button>
        </div>
        {/* TITLE */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Select Event</label>

          <select
            value={selectedEventId}
            onChange={(e) => handleEventSelect(e.target.value)}
            className={inputStyle}
          >
            <option value="" disabled>
              Select Event
            </option>

            {events
              .filter((ev) => ev.basicInfo?.eventName?.trim()) // remove empty / spaces
              .sort((a, b) =>
                a.basicInfo.eventName
                  .trim()
                  .toLowerCase()
                  .localeCompare(b.basicInfo.eventName.trim().toLowerCase()),
              ) // sort A-Z
              .map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.basicInfo.eventName.trim()}
                </option>
              ))}
          </select>
        </div>

        {/* FORM GRID */}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Organizer Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Organizer Name
            </label>
            <input
              name="organizerName"
              value={form.organizerName}
              onChange={(e) => {
                let value = onlyAlphabets(e.target.value);
                value = capitalizeWords(value);

                setForm({
                  ...form,
                  organizerName: value,
                });
              }}
              className="w-full border border-orange-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Volunteers Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Volunteers Name
            </label>
            <input
              name="volunteersName"
              value={form.volunteersName}
              onChange={(e) => {
                let value = onlyAlphabets(e.target.value);
                value = capitalizeWords(value);

                setForm({
                  ...form,
                  volunteersName: value,
                });
              }}
              className="w-full border border-orange-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Registration Fees */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Registration Fees
            </label>
            <input
              name="registrationFees"
              value={form.registrationFees}
              onChange={(e) =>
                setForm({
                  ...form,
                  registrationFees: e.target.value.replace(/\D/g, ""),
                })
              }
              className={inputStyle}
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Contact Number
            </label>
            <input
              name="contactNumber"
              maxLength={10}
              value={form.contactNumber}
              onChange={(e) =>
                setForm({
                  ...form,
                  contactNumber: e.target.value.replace(/\D/g, ""),
                })
              }
              className={inputStyle}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Emergency Contact Number
            </label>
            <input
              name="emergencyNumber"
              maxLength={10}
              value={form.emergencyNumber}
              onChange={(e) =>
                setForm({
                  ...form,
                  emergencyNumber: e.target.value.replace(/\D/g, ""),
                })
              }
              className={inputStyle}
            />
          </div>

          {/* Documents */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Additional Documents
            </label>
            <input
              type="file"
              name="documents"
              onChange={(e) =>
                setForm({
                  ...form,
                  documents: e.target.files[0]?.name || "",
                })
              }
              className={inputStyle}
            />
          </div>

          {/* Dates */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Start Date – End Date
            </label>

            <div className="flex gap-4">
              <div className="w-full">
                <input
                  type="date"
                  min="1900-01-01"
                  max="2099-12-31"
                  value={form.startDate || ""}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className={inputStyle}
                />
              </div>

              <div className="w-full">
                <input
                  type="date"
                  min="1900-01-01"
                  max="2099-12-31"
                  value={form.endDate || ""}
                  onChange={(e) => {
                    if (form.startDate && e.target.value < form.startDate) {
                      alert("End date cannot be before start date");
                      return;
                    }
                    setForm({ ...form, endDate: e.target.value });
                  }}
                  className={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Timings */}
          <div>
            <label className="block text-sm font-medium mb-1">Timings</label>
            <input
              type="time"
              name="timings"
              value={form.timings}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className={inputStyle}
            />
          </div>
        </div>

        {/* CUSTOMERS + MANAGEMENT */}

        <div className="grid md:grid-cols-2 gap-6 mt-10">
          {/* CUSTOMERS CARD */}

          <div className="border border-orange-300 rounded-lg">
            <div className="flex justify-between items-center px-4 py-2 border-b border-orange-300">
              <h3 className="font-semibold text-sm">Edit Customer Details</h3>

              <button
                onClick={() => setShowCustomerPopup(true)}
                className="bg-orange-500 text-white text-xs px-3 py-1 rounded"
              >
                + Add Customers
              </button>
            </div>

            <div className="p-3 space-y-3">
              {customers.map((c, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-300"></div>

                    <span className="text-sm">{c.name}</span>
                  </div>

                  <button
                    onClick={() => removeCustomer(i)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* MANAGEMENT CARD */}

          <div className="border border-orange-300 rounded-lg">
            <div className="flex justify-between items-center px-4 py-2 border-b border-orange-300">
              <h3 className="font-semibold text-sm">Edit Management Details</h3>

              <button
                onClick={() => setActiveMenu("Management Details")}
                className="bg-orange-500 text-white text-xs px-3 py-1 rounded"
              >
                + Add Management
              </button>
            </div>

            <div className="p-3 space-y-3">
              {management.map((m, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-300"></div>

                    <span className="text-sm">{m.name}</span>
                  </div>

                  <button
                    onClick={() => removeManagement(i)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {showCustomerPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40">
            <div className="bg-white p-6 rounded-lg w-80 space-y-4">
              <h3 className="font-semibold text-lg">Add Customer</h3>

              <input
                placeholder="Enter Name"
                className={inputStyle}
                value={newCustomer.name}
                onChange={(e) => {
                  let value = onlyAlphabets(e.target.value); // allow only letters
                  value = capitalizeWords(value); // auto capitalize

                  setNewCustomer({ ...newCustomer, name: value });
                }}
              />

              <input
                placeholder="Email"
                className={inputStyle}
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, email: e.target.value })
                }
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCustomerPopup(false)}
                  className="px-4 py-1 border rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setCustomers([...customers, newCustomer]);
                    setNewCustomer({ name: "", email: "" });
                    setShowCustomerPopup(false);
                  }}
                  className="px-4 py-1 bg-orange-500 text-white rounded"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
        {/* FOOTER BUTTONS */}

        <div className="flex justify-end gap-4 mt-8">
          <button onClick={goBack} className="px-6 py-2 border rounded-md">
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-6 py-2 bg-orange-500 text-white rounded-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
