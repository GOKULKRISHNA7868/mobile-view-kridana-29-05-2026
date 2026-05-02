import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
const ComplaintHistory = ({ ticketId, setActiveMenu }) => {
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState("");
const [resolvedDate, setResolvedDate] = useState("");
const navigate = useNavigate();
useEffect(() => {
  if (!ticketId) return;   // ✅ prevent error

  const fetchTicket = async () => {
    const ref = doc(db, "helpcenter", ticketId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      setTicket(data);
      setStatus(data.status || "Pending");

      if (data.resolvedOn) {
        const date = data.resolvedOn.toDate().toISOString().split("T")[0];
        setResolvedDate(date);
      }
    }
  };

  fetchTicket();
}, [ticketId]);

  const updateTicket = async () => {
    const ref = doc(db, "helpcenter", ticketId);

  await updateDoc(ref, {
  status: status,
  resolvedOn: resolvedDate ? new Date(resolvedDate) : null,
});
    alert("Updated Successfully");
  };

  if (!ticket) return <p>Loading...</p>;

 return (
  <div className="p-6 mt-6">

    {/* 🔙 BACK BUTTON */}
   <button
 onClick={() => setActiveMenu("Dashboard")}
      className="mb-4 flex items-center gap-2 text-orange-600 font-semibold hover:gap-3 transition-all"
    >
      ← Back
    </button>

    <div className="flex justify-center">
    <div className="bg-white shadow-lg rounded-lg w-full max-w-3xl p-6">

      {/* HEADER */}
      <h2 className="text-2xl font-bold text-orange-600 mb-6">
        Complaint Details
      </h2>

      {/* ISSUE */}
      <div className="mb-4">
        <p className="text-gray-500 text-sm">Issue</p>
        <p className="font-semibold text-black">{ticket.issue}</p>
      </div>

      {/* TICKET ID */}
      <div className="mb-4">
        <p className="text-gray-500 text-sm">Ticket ID</p>
       <p className="font-semibold text-black">{ticketId}</p>
      </div>

    <div className="flex gap-6 mb-6">

  {/* STATUS */}
  <div className="flex-1">
    <label className="text-gray-500 text-sm">Status</label>

    <select
      value={status}
      onChange={(e) => setStatus(e.target.value)}
      className="border rounded-md p-2 w-full mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
    >
      <option>Pending</option>
      <option>Process</option>
      <option>Solved</option>
    </select>
  </div>

  {/* RESOLVED DATE */}
  <div className="flex-1">
    <label className="text-gray-500 text-sm">Resolved On</label>

<input
  type="date"
  value={resolvedDate}
  onChange={(e) => setResolvedDate(e.target.value)}
  className="border rounded-md p-2 w-full mt-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
/>
  </div>

</div>

      {/* UPDATE BUTTON */}
      <div className="flex justify-end">
        <button
          onClick={updateTicket}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium transition"
        >
          Update
        </button>
      </div>

    </div>
</div>
  </div>
);
};

export default ComplaintHistory;