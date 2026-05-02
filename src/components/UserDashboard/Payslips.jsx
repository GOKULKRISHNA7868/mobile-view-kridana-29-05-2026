import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import html2pdf from "html2pdf.js";

/* ============================
   HELPERS
============================ */
const getCurrentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/* ============================
   COMPONENT
============================ */
export default function PaymentsPage() {
  const trainerUID = auth.currentUser?.uid;

  const [month, setMonth] = useState(getCurrentMonth());
  const [payslips, setPayslips] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ============================
     LOAD PAYSLIPS (TRAINER ONLY)
  ============================ */
  useEffect(() => {
    if (!trainerUID || !month) return;

    const loadPayslips = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "PAYSLIPS"),
          where("trainerId", "==", trainerUID),
          where("month", "==", month),
        );

        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setPayslips(list);
        setFiltered(list);
      } catch (err) {
        console.error("Payslip load error:", err);
      }
      setLoading(false);
    };

    loadPayslips();
  }, [trainerUID, month]);

  /* ============================
     SEARCH
  ============================ */
  useEffect(() => {
    const s = search.toLowerCase();
    setFiltered(
      payslips.filter(
        (p) =>
          p.studentName?.toLowerCase().includes(s) ||
          p.studentEmail?.toLowerCase().includes(s),
      ),
    );
  }, [search, payslips]);

  /* ============================
     DOWNLOAD
  ============================ */
  const downloadPDF = () => {
    const element = document.getElementById("payslip-view");
    html2pdf().from(element).save();
  };

  /* ============================
     UI
  ============================ */
  return (
    <div className="min-h-screen p-6 text-black">
      <h2 className="text-2xl font-semibold mb-4 text-black">My Payslips</h2>

      {/* CONTROLS */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-gray-400 bg-white text-black px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
        />

        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-400 bg-white text-black px-3 py-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>

      {/* ============================
          TABLE VIEW
      ============================ */}
      {!selectedSlip && (
        <>
          {loading ? (
            <p className="text-black">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-black">No payslips found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-400 bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-400 px-3 py-2 text-left text-black">
                      Name
                    </th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-black">
                      Email
                    </th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-black">
                      Month
                    </th>
                    <th className="border border-gray-400 px-3 py-2 text-left text-black">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="border border-gray-400 px-3 py-2 text-black">
                        {p.studentName}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-black">
                        {p.studentEmail}
                      </td>
                      <td className="border border-gray-400 px-3 py-2 text-black">
                        {p.month}
                      </td>
                      <td className="border border-gray-400 px-3 py-2">
                        <button
                          onClick={() => setSelectedSlip(p)}
                          className="px-3 py-1 border border-gray-500 rounded bg-white text-black hover:bg-gray-200"
                        >
                          View Payslip
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ============================
          PAYSLIP VIEW
      ============================ */}
      {selectedSlip && (
        <>
          <div
            id="payslip-view"
            className="bg-white border border-gray-400 p-6 max-w-xl text-black"
          >
            <h3 className="text-xl font-semibold mb-4 text-black">Payslip</h3>

            <p className="mb-2 text-black">
              <span className="font-medium">Name:</span>{" "}
              {selectedSlip.studentName}
            </p>

            <p className="mb-2 text-black">
              <span className="font-medium">Email:</span>{" "}
              {selectedSlip.studentEmail}
            </p>

            <p className="mb-2 text-black">
              <span className="font-medium">Month:</span> {selectedSlip.month}
            </p>

            <p className="mb-2 text-black">
              <span className="font-medium">Amount:</span> ₹
              {selectedSlip.amount}
            </p>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={downloadPDF}
              className="px-4 py-2 border border-gray-600 bg-white text-black rounded hover:bg-gray-200"
            >
              Download
            </button>

            <button
              onClick={() => setSelectedSlip(null)}
              className="px-4 py-2 border border-gray-600 bg-white text-black rounded hover:bg-gray-200"
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}
