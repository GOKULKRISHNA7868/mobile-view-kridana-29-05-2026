import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

const InstituteFees = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeHistory, setFeeHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [feeData, setFeeData] = useState({
    month: "",
    year: new Date().getFullYear(),
    baseFee: "",
    discount: "",
    extra: "",
    dueDate: "",
    paymentMode: "Cash",
    remarks: "",
  });

  const instituteId = auth.currentUser?.uid;

  /* ================= FETCH STUDENTS ================= */
  useEffect(() => {
    if (!instituteId) return;

    const fetchStudents = async () => {
      const q = query(
        collection(db, "students"),
        where("instituteId", "==", instituteId)
      );
      const snap = await getDocs(q);
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };

    fetchStudents();
  }, [instituteId]);

  /* ================= FETCH FEES ================= */
  const fetchFeeHistory = async (studentId) => {
    const q = query(
      collection(db, "studentFees"),
      where("studentId", "==", studentId)
    );

    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    data.sort((a, b) =>
      `${b.year}${b.month}`.localeCompare(`${a.year}${a.month}`)
    );

    setFeeHistory(data);
  };

  /* ================= RECEIPT ================= */
  const generateReceiptNo = () => {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `REC-${y}${m}-${rand}`;
  };

  /* ================= GENERATE FEE ================= */
  const generateFee = async () => {
    if (!selectedStudent) return alert("Select student");
    if (!feeData.month || !feeData.baseFee)
      return alert("Month & Base Fee required");

    const exists = feeHistory.find(
      (f) => f.month === feeData.month && f.year === feeData.year
    );
    if (exists) return alert("Fee already generated for this month");

    const total =
      Number(feeData.baseFee || 0) -
      Number(feeData.discount || 0) +
      Number(feeData.extra || 0);

    await addDoc(collection(db, "studentFees"), {
      studentId: selectedStudent.id,
      studentName: `${selectedStudent.firstName} ${
        selectedStudent.lastName || ""
      }`,
      instituteId,
      month: feeData.month,
      year: feeData.year,
      baseFee: Number(feeData.baseFee),
      discount: Number(feeData.discount),
      extraCharges: Number(feeData.extra),
      finalAmount: total,
      paymentMode: feeData.paymentMode,
      receiptNo: generateReceiptNo(),
      remarks: feeData.remarks,
      dueDate: feeData.dueDate,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    alert("Fee generated successfully");
    fetchFeeHistory(selectedStudent.id);

    setFeeData({
      month: "",
      year: new Date().getFullYear(),
      baseFee: "",
      discount: "",
      extra: "",
      dueDate: "",
      paymentMode: "Cash",
      remarks: "",
    });
  };

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "studentFees", id), {
      status,
      paidAt: status === "paid" ? serverTimestamp() : null,
    });
    fetchFeeHistory(selectedStudent.id);
  };

  /* ================= DELETE ================= */
  const deleteFee = async (id) => {
    if (!window.confirm("Delete this fee record?")) return;
    await deleteDoc(doc(db, "studentFees", id));
    fetchFeeHistory(selectedStudent.id);
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-100">
      <h1 className="text-2xl font-bold mb-6">Institute Fee Management</h1>

      {/* STUDENTS */}
      <div className="grid md:grid-cols-2 gap-4">
        {students.map((s) => (
          <div
            key={s.id}
            onClick={() => {
              setSelectedStudent(s);
              fetchFeeHistory(s.id);
            }}
            className="bg-gray-800 border border-gray-700 p-4 rounded cursor-pointer hover:border-blue-500"
          >
            <h3 className="font-semibold">
              {s.firstName} {s.lastName}
            </h3>
            <p className="text-sm text-gray-400">Category: {s.category}</p>
            <p className="text-sm">Fee: ₹{s.studentFee}</p>
          </div>
        ))}
      </div>

      {/* FEE FORM */}
      {selectedStudent && (
        <div className="mt-8 bg-gray-900 p-6 rounded border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">
            Fee Details — {selectedStudent.firstName}
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="month"
              className="input"
              onChange={(e) =>
                setFeeData({
                  ...feeData,
                  month: e.target.value.split("-")[1],
                  year: e.target.value.split("-")[0],
                })
              }
            />

            <input
              className="input"
              placeholder="Base Fee"
              type="number"
              value={feeData.baseFee}
              onChange={(e) =>
                setFeeData({ ...feeData, baseFee: e.target.value })
              }
            />

            <input
              className="input"
              placeholder="Discount"
              type="number"
              value={feeData.discount}
              onChange={(e) =>
                setFeeData({ ...feeData, discount: e.target.value })
              }
            />

            <input
              className="input"
              placeholder="Extra Charges"
              type="number"
              value={feeData.extra}
              onChange={(e) =>
                setFeeData({ ...feeData, extra: e.target.value })
              }
            />

            <select
              className="input"
              value={feeData.paymentMode}
              onChange={(e) =>
                setFeeData({ ...feeData, paymentMode: e.target.value })
              }
            >
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Bank Transfer</option>
              <option>Other</option>
            </select>

            <input
              className="input"
              placeholder="Remarks"
              value={feeData.remarks}
              onChange={(e) =>
                setFeeData({ ...feeData, remarks: e.target.value })
              }
            />
          </div>

          <button
            onClick={generateFee}
            className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
          >
            Generate Fee
          </button>

          {/* HISTORY */}
          <h3 className="mt-8 font-semibold">Fee History</h3>
          <div className="overflow-x-auto mt-3">
            <table className="w-full border border-gray-700 text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Mode</th>
                  <th>Receipt</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {feeHistory.map((f) => (
                  <tr key={f.id} className="border-t border-gray-700">
                    <td>{f.month}/{f.year}</td>
                    <td>₹{f.finalAmount}</td>
                    <td
                      className={
                        f.status === "paid"
                          ? "text-green-400"
                          : "text-yellow-400"
                      }
                    >
                      {f.status}
                    </td>
                    <td>{f.paymentMode}</td>
                    <td>{f.receiptNo}</td>
                    <td className="flex gap-3">
                      <button
                        disabled={f.status === "paid"}
                        onClick={() => updateStatus(f.id, "paid")}
                        className="text-green-400 disabled:opacity-40"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => deleteFee(f.id)}
                        className="text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteFees;
