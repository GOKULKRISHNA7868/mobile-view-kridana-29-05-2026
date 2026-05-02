import React, { useEffect, useState, useMemo } from "react";
import {
  TopSearchWithActionsLight,
  FeesOrSalaryCharts,
  ListHeader,
  Pagination,
} from "./shared";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

/**
 * 🔒 Allow salary only from joining month onward
 */
const isMonthAllowed = (joinedDate, selectedMonth) => {
  if (!joinedDate) return false;
  return selectedMonth >= joinedDate.slice(0, 7);
};

const SalaryDetailsPage = () => {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * 🔹 Fetch trainers + salary for selected month
   */
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      const instituteSnap = await getDoc(doc(db, "institutes", user.uid));
      if (!instituteSnap.exists()) {
        setRows([]);
        setLoading(false);
        return;
      }

      const trainerIds = instituteSnap.data().trainers || [];
      const result = [];

      for (const trainerUid of trainerIds) {
        const trainerSnap = await getDoc(
          doc(db, "InstituteTrainers", trainerUid)
        );
        if (!trainerSnap.exists()) continue;

        const trainer = trainerSnap.data();

        // 🔒 Joining month validation
        if (!isMonthAllowed(trainer.joinedDate, selectedMonth)) continue;

        const totalSalary = Number(trainer.monthlySalary || 0);

        const salaryRef = doc(
          db,
          "InstituteSalaryDetails",
          `${user.uid}_${trainerUid}_${selectedMonth}`
        );
        const salarySnap = await getDoc(salaryRef);

        const paid = salarySnap.exists()
          ? Number(salarySnap.data().paidAmount || 0)
          : 0;

        result.push({
          id: trainerUid,
          name: `${trainer.firstName} ${trainer.lastName}`,
          total: totalSalary,
          paid,
          pending: Math.max(totalSalary - paid, 0),
        });
      }

      setRows(result);
      setLoading(false);
    };

    fetchData();
  }, [user, selectedMonth]);

  /**
   * 🔹 Edit paid amount
   */
  const handlePaidChange = (id, value) => {
    const paid = Number(value || 0);

    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              paid,
              pending: Math.max(r.total - paid, 0),
            }
          : r
      )
    );
  };

  /**
   * 🔹 Save salary (month-wise)
   */
  const handleSave = async () => {
    for (const r of rows) {
      await setDoc(
        doc(
          db,
          "InstituteSalaryDetails",
          `${user.uid}_${r.id}_${selectedMonth}`
        ),
        {
          instituteId: user.uid,
          trainerUid: r.id,
          trainerName: r.name,
          month: selectedMonth,
          totalSalary: r.total,
          paidAmount: r.paid,
          pendingAmount: r.pending,
          status: r.pending === 0 ? "SETTLED" : "PENDING",
          updatedAt: serverTimestamp(),
        }
      );
    }

    alert("Salary details saved successfully");
  };

  /**
   * 🔹 Search filter
   */
  const filteredRows = useMemo(() => {
    return rows.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  /**
   * ✅ GRAPH + SIDE VALUES (MONTH-WISE & ACCURATE)
   */
  const totals = useMemo(() => {
    let total = 0;
    let paid = 0;
    let pending = 0;
    let settled = 0;
    let pendingCount = 0;

    rows.forEach((r) => {
      total += r.total;
      paid += r.paid;
      pending += r.pending;

      r.pending === 0 ? settled++ : pendingCount++;
    });

    return {
      total,
      paid,
      pending,
      count: rows.length,
      settled,
      pendingCount,
    };
  }, [rows]);

  return (
    <div className="h-full bg-white text-black p-6 rounded-lg">
      <TopSearchWithActionsLight search={search} setSearch={setSearch} />

      {/* 🔥 MONTH-WISE BAR GRAPH + SIDE VALUES */}
      <FeesOrSalaryCharts
        totalLabel="Total Salary to Pay"
        paidLabel="Amount Paid"
        pendingLabel="Pending Amount"
        peopleLabel="Trainer Overview"
        totalValue={totals.total}
        paidValue={totals.paid}
        pendingValue={totals.pending}
        peopleValue={totals.count}
        settledCount={totals.settled}
        pendingCount={totals.pendingCount}
        selectedMonth={selectedMonth}
      />

      <div className="flex items-center justify-between mb-2">
        <ListHeader title="Monthly Salary Details" />
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border px-3 py-1 rounded-md"
        />
      </div>

      <table className="w-full border text-sm mt-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Trainer</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Pending</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan="4" className="text-center py-6">
                Loading...
              </td>
            </tr>
          )}

          {!loading && filteredRows.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center py-6 text-gray-500">
                No trainers available for this month
              </td>
            </tr>
          )}

          {filteredRows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.name}</td>
              <td>₹ {r.total}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  max={r.total}
                  value={r.paid}
                  onChange={(e) => handlePaidChange(r.id, e.target.value)}
                  className="border px-2 py-1 w-24"
                />
              </td>
              <td
                className={r.pending === 0 ? "text-green-600" : "text-red-600"}
              >
                {r.pending === 0 ? "SETTLED" : `₹ ${r.pending}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          className="bg-orange-500 text-white px-6 py-2 rounded-md font-bold"
        >
          Save
        </button>
      </div>

      <Pagination />
    </div>
  );
};

export default SalaryDetailsPage;
