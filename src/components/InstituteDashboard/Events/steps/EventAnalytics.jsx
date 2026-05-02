import { useEffect, useState } from "react";
import { db } from "../../../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../../../../context/AuthContext";

const EventAnalytics = () => {
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      const q = query(
        collection(db, "events"),
        where("instituteId", "==", user.uid),
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // ✅ SORT EVENTS BY NAME (A → Z)
      const sortedData = data.sort((a, b) =>
        (a.basicInfo?.eventName || "").localeCompare(
          b.basicInfo?.eventName || "",
        ),
      );

      // ✅ SET SORTED DATA
      setEvents(sortedData);

      // ✅ SET FIRST EVENT FROM SORTED LIST
      if (sortedData.length) setSelectedEvent(sortedData[0]);
    };

    fetchEvents();
  }, [user]);

  /* ================= Students ================= */

  const instituteStudents =
    selectedEvent?.participants?.selectedCustomers?.length || 0;

  const outsideStudents =
    selectedEvent?.participants?.otherInstituteCustomers?.length || 0;

  const totalStudents = instituteStudents + outsideStudents;

  /* ================= Revenue ================= */

  const registrationFee =
    parseInt(
      selectedEvent?.pricing?.find((p) => p.type === "registrationFee")
        ?.amount || 0,
    ) || 0;

  const discount = parseInt(selectedEvent?.pricing?.discount || 0) || 0;

  const present = instituteStudents + outsideStudents;

  const finalFee = registrationFee - discount;

  const totalRevenue = present * finalFee;

  return (
    <div className="w-full px-10 pt-6 pb-16">
      {/* Event Filter */}
      <select
        className="border border-gray-300 px-4 py-2 rounded mb-6"
        value={selectedEvent?.id || ""}
        onChange={(e) => {
          const event = events.find((ev) => ev.id === e.target.value);
          setSelectedEvent(event);
        }}
      >
        {events
          .filter((ev) => ev.basicInfo?.eventName)
          .map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.basicInfo?.eventName}
            </option>
          ))}
      </select>

      {/* Top Summary Cards */}
      <div className="flex flex-col sm:flex-row gap-8 mb-12">
        <div className="flex flex-wrap gap-8 mb-12">
          {/* Total Students */}
          <div className="bg-orange-500 text-black px-8 py-6 rounded-xl shadow-md flex items-center gap-6 min-w-[260px]">
            <div className="bg-white p-3 rounded-full">
              <img src="/contact.png" className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Total Students</p>
              <p className="text-xl font-bold">{totalStudents}</p>
            </div>
          </div>

          {/* Institute Students */}
          <div className="bg-orange-500 text-black px-8 py-6 rounded-xl shadow-md flex items-center gap-6 min-w-[260px]">
            <div className="bg-white p-3 rounded-full">
              <img src="/contact.png" className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Institute Students</p>
              <p className="text-xl font-bold">{instituteStudents}</p>
            </div>
          </div>

          {/* Outside Students */}
          <div className="bg-orange-500 text-black px-8 py-6 rounded-xl shadow-md flex items-center gap-6 min-w-[260px]">
            <div className="bg-white p-3 rounded-full">
              <img src="/contact.png" className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Outside Students</p>
              <p className="text-xl font-bold">{outsideStudents}</p>
            </div>
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
            <p className="text-sm font-medium">Amount Earned</p>
            <p className="text-xl font-bold">₹ {totalRevenue}</p>
          </div>
        </div>
      </div>

      {/* Profile View Analytics */}
    </div>
  );
};

export default EventAnalytics;
