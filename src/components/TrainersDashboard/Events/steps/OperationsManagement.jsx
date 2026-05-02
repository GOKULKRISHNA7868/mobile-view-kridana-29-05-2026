import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";

const OperationsManagement = ({ formData, setFormData, eventId }) => {
  const { user } = useAuth();
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceEnabled, setAttendanceEnabled] = useState(
    formData?.operations?.attendanceEnabled || false,
  );
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState([]); // merged list
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  /* ================= FETCH ALL CUSTOMERS ================= */
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
        name: doc.data()?.basicInfo?.eventName || "Event",
      }));

      setEvents(list);

      if (list.length > 0) {
        setSelectedEvent(list[0].id);
      }
    };

    fetchEvents();
  }, [user]);
  useEffect(() => {
    const fetchEventParticipants = async () => {
      if (!attendanceEnabled || !selectedEvent) return;

      setLoading(true);

      const eventRef = doc(db, "events", selectedEvent);
      const eventSnap = await getDoc(eventRef);

      if (!eventSnap.exists()) {
        setCustomers([]);
        return;
      }

      const data = eventSnap.data();

      const instituteCustomers =
        data?.participants?.selectedCustomers?.map((name) => ({
          id: name,
          name: name,
          category: "Institute",
        })) || [];

      const outsideCustomers =
        data?.participants?.otherInstituteCustomers?.map((c) => ({
          id: c.name,
          name: c.name,
          category: "Outside",
        })) || [];

      const merged = [...instituteCustomers, ...outsideCustomers];

      setCustomers(merged);

      setLoading(false);
    };

    fetchEventParticipants();
  }, [attendanceEnabled, selectedEvent]);
  /* -------- Outside Customers (from formData) -------- */

  /* ================= FETCH EXISTING ATTENDANCE ================= */
  useEffect(() => {
    if (!attendanceEnabled || !selectedEvent || !attendanceDate) return;

    const fetchAttendance = async () => {
      try {
        setLoading(true);

        const customersRef = collection(
          db,
          "events",
          selectedEvent,
          "attendance",
          attendanceDate,
          "customers",
        );

        const snap = await getDocs(customersRef);

        const data = {};

        snap.forEach((doc) => {
          data[doc.id] = doc.data();
        });

        setAttendanceData(data);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }

      setLoading(false);
    };

    fetchAttendance();
  }, [customers, attendanceDate, selectedEvent]);

  /* ================= SAVE TO FORM DATA ================= */
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      operations: {
        ...prev.operations,
        attendanceEnabled,
      },
    }));
  }, [attendanceEnabled]);

  /* ================= HANDLE STATUS ================= */
  /* ================= HANDLE STATUS ================= */
  const handleAttendanceChange = async (customer, status) => {
    try {
      setSaving(true);

      const updatedAttendanceData = {
        ...attendanceData,
        [customer.name]: {
          ...attendanceData[customer.name],
          status,
          reason: attendanceData[customer.name]?.reason || "",
          marks: attendanceData[customer.name]?.marks || "",
        },
      };

      setAttendanceData(updatedAttendanceData);

      const ref = doc(
        db,
        "events",
        selectedEvent,
        "attendance",
        attendanceDate,
        "customers",
        customer.name,
      );

      await setDoc(
        ref,
        {
          name: customer.name,
          status,
          reason: updatedAttendanceData[customer.name]?.reason || "",
          marks: updatedAttendanceData[customer.name]?.marks || "",
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (err) {
      console.error(err);
    }

    setSaving(false);
  };
  /* ================= HANDLE REASON ================= */
  const handleReasonChange = async (customer, value) => {
    const updatedAttendanceData = {
      ...attendanceData,
      [customer.name]: {
        ...attendanceData[customer.name],
        reason: value,
      },
    };

    setAttendanceData(updatedAttendanceData);

    const ref = doc(
      db,
      "events",
      selectedEvent,
      "attendance",
      attendanceDate,
      "customers",
      customer.name,
    );

    await setDoc(
      ref,
      {
        name: customer.name,
        reason: value,
        status: updatedAttendanceData[customer.name]?.status || "",
        marks: updatedAttendanceData[customer.name]?.marks || "",
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  };
  const handleMarksChange = async (customer, value) => {
    const updatedAttendanceData = {
      ...attendanceData,
      [customer.name]: {
        ...attendanceData[customer.name],
        marks: value,
      },
    };

    setAttendanceData(updatedAttendanceData);

    const ref = doc(
      db,
      "events",
      selectedEvent,
      "attendance",
      attendanceDate,
      "customers",
      customer.name,
    );

    await setDoc(
      ref,
      {
        name: customer.name,
        marks: value,
        status: updatedAttendanceData[customer.name]?.status || "",
        reason: updatedAttendanceData[customer.name]?.reason || "",
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  };
  return (
    <div className="w-full space-y-6">
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-6">
          Operations Management
        </h2>

        {/* ATTENDANCE TOGGLE */}
        <div className="mb-6 space-y-3">
          <p className="font-semibold text-sm">Attendance Tracking*</p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setAttendanceEnabled(true)}
              className={`px-4 py-1 rounded ${
                attendanceEnabled ? "bg-green-500 text-white" : "border"
              }`}
            >
              Enable
            </button>

            <button
              onClick={() => setAttendanceEnabled(false)}
              className={`px-4 py-1 rounded ${
                !attendanceEnabled ? "bg-gray-500 text-white" : "border"
              }`}
            >
              Disable
            </button>
          </div>
        </div>
        <select
          className="border px-3 py-1 rounded"
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
        <div className="mt-3">
          <label className="font-semibold text-sm mr-2">Attendance Date</label>

          <input
            type="date"
            className="border px-3 py-1 rounded"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
          />
        </div>
        {/* TABLE */}
        {attendanceEnabled && (
          <div className="overflow-x-auto border rounded-lg">
            {loading && (
              <div className="text-center py-4 font-semibold text-gray-500">
                Fetching Attendance...
              </div>
            )}

            {saving && (
              <div className="text-center py-2 text-blue-500 font-semibold">
                Saving Attendance...
              </div>
            )}
            <table className="min-w-full text-sm">
              <thead className="bg-black text-orange-400">
                <tr>
                  <th className="px-4 py-2 text-left">Customer Name</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-center">Present</th>
                  <th className="px-4 py-2 text-center">Absent</th>
                  <th className="px-4 py-2 text-left">Reason</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{customer.name}</td>

                    <td className="px-4 py-2">{customer.category}</td>

                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={
                          attendanceData[customer.id]?.status === "present"
                        }
                        onChange={() =>
                          handleAttendanceChange(customer, "present")
                        }
                      />
                    </td>

                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={
                          attendanceData[customer.id]?.status === "absent"
                        }
                        onChange={() =>
                          handleAttendanceChange(customer, "absent")
                        }
                      />
                    </td>

                    <td className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Reason..."
                        className="border rounded px-2 py-1 w-full"
                        value={attendanceData[customer.id]?.reason || ""}
                        onChange={(e) =>
                          handleReasonChange(customer, e.target.value)
                        }
                        disabled={
                          attendanceData[customer.id]?.status !== "absent"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsManagement;
