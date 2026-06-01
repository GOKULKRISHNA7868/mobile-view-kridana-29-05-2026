/* =========================================================
   SALARY & EXPENSES PAGE
   FULL UPDATED CODE
   - Salary Firebase Save
   - Expense Firebase Save
   - Expense Fetch
   - Responsive UI
   - Modern Design
   - ALL CONDITIONS + LOGICS PRESERVED
========================================================= */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../../firebase";

import { useAuth } from "../../context/AuthContext";

import {
  Search,
  Bell,
  CalendarDays,
  ChevronDown,
  Users,
  Wallet,
  Clock3,
  IndianRupee,
  Phone,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Plus,
  Receipt,
  Home,
  Zap,
  Droplets,
  Wrench,
  Wifi,
  Megaphone,
  Package,
  Building2,
  Check,
} from "lucide-react";

const MONTHS = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];
const EXPENSE_CATEGORIES = [
  {
    label: "Rent",
    icon: Home,
  },
  {
    label: "Electricity",
    icon: Zap,
  },
  {
    label: "Water",
    icon: Droplets,
  },
  {
    label: "Equipment",
    icon: Package,
  },
  {
    label: "Internet",
    icon: Wifi,
  },
  {
    label: "Maintenance",
    icon: Wrench,
  },
  {
    label: "Marketing",
    icon: Megaphone,
  },
  {
    label: "Miscellaneous",
    icon: Building2,
  },
];
const formatCurrency = (num) => {
  if (!num) return "₹0";

  return `₹${Number(num).toLocaleString("en-IN")}`;
};
const SalaryDetailsPage = () => {
  const { user } = useAuth();

  const [trainers, setTrainers] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [search, setSearch] = useState("");

  const [selectedTrainer, setSelectedTrainer] = useState(null);

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const monthRef = useRef(null);

  const [editData, setEditData] = useState({
    monthlySalary: "",
    bonus: "",
    deductions: "",
    paidAmount: "",
    paymentMethod: "",
    transactionId: "",
    paidDate: "",
  });

  const [expenseData, setExpenseData] = useState({
    category: "",
    amount: "",
    paidThrough: "",
    paidDate: "",
  });

  /* CLICK OUTSIDE */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (monthRef.current && !monthRef.current.contains(e.target)) {
        setShowMonthDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* FETCH TRAINERS */
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const q = query(
        collection(db, "InstituteTrainers"),
        where("instituteId", "==", user.uid),
      );

      const snap = await getDocs(q);

      setTrainers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    fetchData();
  }, [user]);

  /* FETCH SALARIES */
  useEffect(() => {
    if (!user) return;

    const fetchSalary = async () => {
      const q = query(
        collection(db, "instituteSalaries"),
        where("instituteId", "==", user.uid),
      );

      const snap = await getDocs(q);

      setSalaries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    fetchSalary();
  }, [user]);

  /* FETCH EXPENSES */
  useEffect(() => {
    if (!user) return;

    const fetchExpenses = async () => {
      const q = query(
        collection(db, "instituteExpenses"),
        where("instituteId", "==", user.uid),
      );

      const snap = await getDocs(q);

      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    fetchExpenses();
  }, [user]);

  /* FILTERED */
  const filteredTrainers = useMemo(() => {
    return trainers
      .filter((t) =>
        `${t.firstName} ${t.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
      .sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`,
        ),
      );
  }, [trainers, search]);

  /* GET SALARY */
  const getTrainerSalaryData = (trainer) => {
    const currentYear = new Date().getFullYear();

    const selectedMonthKey = `${currentYear}-${selectedMonth}`;

    const record = salaries.find(
      (s) =>
        s &&
        s.trainerId === trainer.id &&
        (s.month === selectedMonth || s.month === selectedMonthKey),
    );
    return {
      paid: Number(record?.paidAmount || 0),
      bonus: Number(record?.bonus || 0),
      deductions: Number(record?.deductions || 0),
      paymentMethod: record?.paymentMethod || "",
      transactionId: record?.transactionId || "",
      date: record?.paidDate || "",
    };
  };

  /* OPEN EDIT */
  const openEdit = (trainer) => {
    if (!selectedMonth) {
      alert("Please select month first");
      return;
    }

    setSelectedTrainer(trainer);

    const currentYear = new Date().getFullYear();

    const monthKey = `${currentYear}-${selectedMonth}`;

    const record = salaries.find(
      (s) =>
        s.trainerId === trainer.id &&
        (s.month === selectedMonth || s.month === monthKey),
    );

    setEditData({
      monthlySalary: trainer.monthlySalary || "",
      bonus: record?.bonus || "",
      deductions: record?.deductions || "",
      paidAmount: record?.paidAmount || "",
      paymentMethod: record?.paymentMethod || "",
      transactionId: record?.transactionId || "",
      paidDate: record?.paidDate || "",
    });

    setShowEditModal(true);
  };

  /* SAVE SALARY */
  /* SAVE SALARY */
  const saveSalary = async () => {
    if (!selectedTrainer) return;

    const {
      monthlySalary,
      bonus,
      deductions,
      paidAmount,
      paymentMethod,
      transactionId,
      paidDate,
    } = editData;

    const currentYear = new Date().getFullYear();

    const monthKey = `${currentYear}-${selectedMonth}`;

    const totalSalary =
      Number(monthlySalary || 0) + Number(bonus || 0) - Number(deductions || 0);

    const existing = salaries.find(
      (s) =>
        s.trainerId === selectedTrainer.id &&
        (s.month === selectedMonth || s.month === monthKey),
    );

    await setDoc(
      doc(db, "InstituteTrainers", selectedTrainer.id),
      {
        monthlySalary: Number(monthlySalary),
      },
      { merge: true },
    );

    let updatedSalaryDoc;

    if (existing) {
      updatedSalaryDoc = {
        ...existing,
        totalAmount: totalSalary,
        monthlySalary: Number(monthlySalary),
        bonus: Number(bonus),
        deductions: Number(deductions),
        paidAmount: Number(paidAmount),
        paymentMethod,
        transactionId,
        paidDate,
        updatedAt: new Date(),
      };

      await setDoc(
        doc(db, "instituteSalaries", existing.id),
        updatedSalaryDoc,
        { merge: true },
      );

      setSalaries((prev) =>
        prev.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                ...updatedSalaryDoc,
              }
            : item,
        ),
      );
    } else {
      const newRef = doc(collection(db, "instituteSalaries"));

      updatedSalaryDoc = {
        id: newRef.id,
        trainerId: selectedTrainer.id,
        instituteId: user.uid,
        totalAmount: totalSalary,
        monthlySalary: Number(monthlySalary),
        bonus: Number(bonus),
        deductions: Number(deductions),
        paidAmount: Number(paidAmount),
        paymentMethod,
        transactionId,
        paidDate,
        month: monthKey,
        createdAt: new Date(),
      };

      await setDoc(newRef, {
        ...updatedSalaryDoc,
        createdAt: serverTimestamp(),
      });

      setSalaries((prev) => [...prev, updatedSalaryDoc]);
    }

    alert("Salary Saved Successfully ✅");

    setShowEditModal(false);
  };
  /* SAVE EXPENSE */
  /* SAVE EXPENSE */
  const saveExpense = async () => {
    const { category, amount, paidThrough, paidDate } = expenseData;

    if (!category || !amount || !paidThrough || !paidDate) {
      alert("Please fill all fields");
      return;
    }

    const expenseMonth = paidDate.slice(0, 7);

    if (editingExpense) {
      const updatedExpense = {
        ...editingExpense,
        category,
        amount: Number(amount),
        paidThrough,
        paidDate,
        month: expenseMonth,
        updatedAt: new Date(),
      };

      await setDoc(
        doc(db, "instituteExpenses", editingExpense.id),
        updatedExpense,
        { merge: true },
      );

      setExpenses((prev) =>
        prev.map((item) =>
          item.id === editingExpense.id ? updatedExpense : item,
        ),
      );

      alert("Expense Updated Successfully ✅");
    } else {
      const newRef = doc(collection(db, "instituteExpenses"));

      const newExpense = {
        id: newRef.id,
        instituteId: user.uid,
        category,
        amount: Number(amount),
        paidThrough,
        paidDate,
        month: expenseMonth,
        createdAt: new Date(),
      };

      await setDoc(newRef, {
        ...newExpense,
        createdAt: serverTimestamp(),
      });

      setExpenses((prev) => [newExpense, ...prev]);

      alert("Expense Added Successfully ✅");
    }

    setExpenseData({
      category: "",
      amount: "",
      paidThrough: "",
      paidDate: "",
    });

    setEditingExpense(null);

    setShowExpenseModal(false);
  };
  /* TOTALS */
  /* TOTALS */

  const currentYear = new Date().getFullYear();

  const selectedMonthKey = selectedMonth
    ? `${currentYear}-${selectedMonth}`
    : "";

  const totalEmployees = trainers.length;

  /* TOTAL SALARY */
  const totalAmount = trainers.reduce(
    (sum, t) => sum + Number(t.monthlySalary || 0),
    0,
  );

  /* TOTAL PAID */
  const totalPaid = selectedMonth
    ? salaries
        .filter(
          (s) =>
            s &&
            s.month &&
            (s.month === selectedMonthKey || s.month === selectedMonth),
        )
        .reduce((sum, s) => sum + Number(s.paidAmount || 0), 0)
    : salaries.reduce((sum, s) => sum + Number(s?.paidAmount || 0), 0);

  /* PENDING */
  const totalPending =
    totalAmount - totalPaid < 0 ? 0 : totalAmount - totalPaid;

  /* FILTER EXPENSES */
  const filteredExpenses = selectedMonth
    ? expenses.filter(
        (e) =>
          e &&
          e.month &&
          (e.month === selectedMonthKey || e.month === selectedMonth),
      )
    : expenses;

  /* TOTAL EXPENSES */
  const totalExpenses = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0,
  );
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);

    setExpenseData({
      category: expense.category || "",
      amount: expense.amount?.toString() || "",
      paidThrough: expense.paidThrough || "",
      paidDate: expense.paidDate || "",
    });

    setShowExpenseModal(true);
  };
  const handleDeleteExpense = async (expenseId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?",
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "instituteExpenses", expenseId));

      setExpenses((prev) => prev.filter((item) => item.id !== expenseId));

      alert("Expense Deleted Successfully ✅");
    } catch (error) {
      console.error(error);

      alert("Failed to delete expense");
    }
  };
  return (
    <div className="min-h-screen bg-[#f7f7f7] px-4 md:px-8 py-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Salary & Expenses
          </h1>

          <p className="text-gray-500 mt-1">
            Manage employee salaries and monthly records
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 mt-8">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee..."
            className="h-16 w-full rounded-3xl bg-white border border-gray-200 pl-14 pr-4 outline-none"
          />
        </div>

        {/* MONTH */}
        <div ref={monthRef} className="relative">
          <button
            onClick={() => setShowMonthDropdown(!showMonthDropdown)}
            className="h-16 w-full rounded-3xl bg-white border border-gray-200 px-5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <CalendarDays size={20} />

              <span className="font-semibold">
                {selectedMonth
                  ? MONTHS.find((m) => m.value === selectedMonth)?.label
                  : "Select Month"}
              </span>
            </div>

            <ChevronDown size={18} />
          </button>

          {showMonthDropdown && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-3xl shadow-xl border overflow-hidden z-50">
              {MONTHS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => {
                    setSelectedMonth(m.value);
                    setShowMonthDropdown(false);
                  }}
                  className="w-full text-left px-5 py-3 hover:bg-orange-50"
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
        <StatCard
          title="Employees"
          value={totalEmployees}
          icon={<Users size={22} />}
          bg="bg-orange-50"
          color="text-orange-600"
        />

        <StatCard
          title="Total Salary"
          value={formatCurrency(totalAmount)}
          icon={<Wallet size={22} />}
          bg="bg-green-50"
          color="text-green-600"
        />

        <StatCard
          title="Pending"
          value={formatCurrency(totalPending)}
          icon={<Clock3 size={22} />}
          bg="bg-red-50"
          color="text-red-600"
        />

        <StatCard
          title="Expenses"
          value={formatCurrency(totalExpenses)}
          icon={<Receipt size={22} />}
          bg="bg-blue-50"
          color="text-blue-600"
        />
      </div>

      {/* EMPLOYEES */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">
          Employee Salary
        </h2>

        <div className="space-y-5">
          {filteredTrainers.map((trainer) => {
            const data = getTrainerSalaryData(trainer);

            const totalSalary =
              Number(trainer.monthlySalary || 0) +
              Number(data.bonus || 0) -
              Number(data.deductions || 0);

            const isPaid = Number(data.paid) >= totalSalary;

            return (
              <div
                key={trainer.id}
                className="bg-white rounded-[30px] border overflow-hidden"
              >
                <div className="p-6">
                  <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px] gap-8">
                    {/* LEFT */}
                    <div className="flex gap-4">
                      <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center text-xl font-bold">
                        {trainer.firstName?.charAt(0)}
                      </div>

                      <div>
                        <h3 className="text-xl font-bold">
                          {trainer.firstName} {trainer.lastName}
                        </h3>

                        <p className="text-gray-500">
                          {trainer.designation || "Trainer"}
                        </p>

                        <div className="flex items-center gap-2 mt-2 text-gray-500">
                          <Phone size={15} />
                          <span>{trainer.phone || "9876543210"}</span>
                        </div>
                      </div>
                    </div>

                    {/* CENTER */}
                    <div className="space-y-4">
                      <EditableSalaryRow
                        trainer={trainer}
                        value={trainer.monthlySalary || 0}
                        setTrainers={setTrainers}
                      />

                      <SalaryRow
                        title="Bonus"
                        value={formatCurrency(data.bonus || 0)}
                      />

                      <SalaryRow
                        title="Deductions"
                        value={formatCurrency(data.deductions || 0)}
                      />

                      <div className="pt-4 border-t flex justify-between">
                        <span className="font-bold text-lg">Total Salary</span>

                        <div className="text-right">
                          <span className="font-bold text-[#FF6B00] text-2xl block">
                            {formatCurrency(totalSalary)}
                          </span>

                          {Number(data.paid || 0) > 0 && (
                            <span className="text-sm text-green-600 font-semibold">
                              Paid: {formatCurrency(data.paid)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-5 py-2 rounded-full text-sm font-semibold ${
                            isPaid
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {isPaid ? "Paid" : "Pending"}
                        </span>
                      </div>

                      <p className="text-gray-500 mt-5">
                        {isPaid ? `Paid on ${data.date}` : "Not Paid Yet"}
                      </p>

                      <div className="space-y-3 mt-5">
                        <button
                          onClick={() => openEdit(trainer)}
                          className="h-12 w-full rounded-2xl border px-4 text-left"
                        >
                          {data.paymentMethod || "Select Method"}
                        </button>

                        <button
                          onClick={() => openEdit(trainer)}
                          className={`h-12 w-full rounded-2xl font-semibold ${
                            isPaid
                              ? "border border-orange-300 text-orange-500"
                              : "bg-[#FF6B00] text-white"
                          }`}
                        >
                          {isPaid ? "Edit Salary" : "Mark as Paid"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {isPaid && (
                  <div className="bg-green-50 px-6 py-5 border-t">
                    <p className="text-green-700 font-semibold">
                      Payment via {data.paymentMethod}
                    </p>

                    <p className="text-sm text-green-700 mt-1">
                      Transaction ID: {data.transactionId}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* EXPENSES */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-900">
            Maintenance Expenses
          </h2>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="h-12 px-5 rounded-2xl bg-[#FF6B00] text-white font-semibold flex items-center gap-2"
          >
            <Plus size={18} />
            Add Expense
          </button>
        </div>

        <div className="bg-white rounded-[30px] border overflow-hidden">
          {filteredExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 border-b"
            >
              <div>
                <h3 className="font-bold text-gray-900">{expense.category}</h3>

                <p className="text-gray-500 text-sm mt-1">Expense Record</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  {formatCurrency(expense.amount)}
                </h3>

                <p className="text-gray-500 text-sm mt-1">{expense.paidDate}</p>
              </div>

              <span className="px-4 py-2 rounded-full bg-orange-100 text-orange-600 text-sm font-semibold w-fit">
                {expense.paidThrough}
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleEditExpense(expense)}
                  className="h-10 w-10 rounded-xl border flex items-center justify-center"
                >
                  <Pencil size={16} />
                </button>

                <button
                  onClick={() => handleDeleteExpense(expense.id)}
                  className="h-10 w-10 rounded-xl border flex items-center justify-center text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SALARY MODAL */}
      {showEditModal && (
        <ModalForm
          data={editData}
          setData={setEditData}
          onClose={() => setShowEditModal(false)}
          onSave={saveSalary}
        />
      )}

      {/* EXPENSE MODAL */}
      {showExpenseModal && (
        <ExpenseModal
          data={expenseData}
          setData={setExpenseData}
          onClose={() => setShowExpenseModal(false)}
          onSave={saveExpense}
        />
      )}
    </div>
  );
};

/* STAT CARD */
/* STAT CARD */
const StatCard = ({ title, value, icon, bg, color }) => (
  <div
    className={`${bg} rounded-[28px] border p-4 md:p-5 min-w-0 overflow-hidden`}
  >
    <div className={`${color}`}>{icon}</div>

    <p className="mt-3 text-gray-600 font-medium text-sm md:text-base truncate">
      {title}
    </p>

    <h3
      className={`
        mt-2
        ${color}
        font-bold
        leading-tight
        break-words
        text-lg
        sm:text-2xl
        md:text-3xl
        lg:text-4xl
      `}
    >
      {value}
    </h3>
  </div>
);

const SalaryRow = ({ title, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-600">{title}</span>

    <span className="font-semibold">{value}</span>
  </div>
);
const EditableSalaryRow = ({ trainer, value, setTrainers }) => {
  const [open, setOpen] = useState(false);
  const [salary, setSalary] = useState(value);

  const saveSalary = async () => {
    try {
      await setDoc(
        doc(db, "InstituteTrainers", trainer.id),
        {
          monthlySalary: Number(salary || 0),
        },
        { merge: true },
      );

      setTrainers((prev) =>
        prev.map((item) =>
          item.id === trainer.id
            ? {
                ...item,
                monthlySalary: Number(salary || 0),
              }
            : item,
        ),
      );

      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to update salary");
    }
  };

  return (
    <>
      {/* ROW */}
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Base Salary</span>

        <button
          onClick={() => setOpen(true)}
          className="font-semibold text-[#FF6B00]"
        >
          {formatCurrency(value)}
        </button>
      </div>

      {/* POPUP */}
      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[30px] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Edit Base Salary</h2>

              <button
                onClick={() => setOpen(false)}
                className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="font-semibold block mb-2">Monthly Salary</label>

              <input
                autoFocus
                value={salary}
                onChange={(e) =>
                  setSalary(e.target.value.replace(/[^0-9]/g, ""))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    saveSalary();
                  }
                }}
                className="h-14 w-full rounded-2xl border px-4 outline-none"
              />
            </div>

            <button
              onClick={saveSalary}
              className="h-14 w-full rounded-2xl bg-[#FF6B00] text-white font-bold mt-6"
            >
              Save Salary
            </button>
          </div>
        </div>
      )}
    </>
  );
};
/* SALARY MODAL */
const ModalForm = ({ data, setData, onClose, onSave }) => (
  <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm overflow-y-auto">
    <div className="min-h-screen flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="w-full max-w-xl bg-white rounded-t-[35px] md:rounded-[35px] overflow-hidden max-h-[92vh] flex flex-col">
        {/* HEADER */}
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold">Update Salary</h2>

          <button
            onClick={onClose}
            className="h-11 w-11 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-32">
          <div>
            <label className="font-semibold block mb-2">Monthly Salary</label>

            <input
              autoFocus
              value={data.monthlySalary}
              onChange={(e) =>
                setData({
                  ...data,
                  monthlySalary: e.target.value.replace(/[^0-9]/g, ""),
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onSave();
                }
              }}
              className="h-14 w-full rounded-2xl border px-4 outline-none"
            />
          </div>
          <InputBox
            label="Bonus"
            value={data.bonus}
            onChange={(v) =>
              setData({
                ...data,
                bonus: v.replace(/[^0-9]/g, ""),
              })
            }
          />

          <InputBox
            label="Deductions"
            value={data.deductions}
            onChange={(v) =>
              setData({
                ...data,
                deductions: v.replace(/[^0-9]/g, ""),
              })
            }
          />

          <InputBox
            label="Paid Amount"
            value={data.paidAmount}
            onChange={(v) =>
              setData({
                ...data,
                paidAmount: v.replace(/[^0-9]/g, ""),
              })
            }
          />

          <InputBox
            label="Payment Method"
            value={data.paymentMethod}
            onChange={(v) =>
              setData({
                ...data,
                paymentMethod: v,
              })
            }
          />

          <InputBox
            label="Transaction ID"
            value={data.transactionId}
            onChange={(v) =>
              setData({
                ...data,
                transactionId: v,
              })
            }
          />

          <div>
            <label className="font-semibold block mb-2">Paid Date</label>

            <input
              type="date"
              value={data.paidDate}
              onChange={(e) =>
                setData({
                  ...data,
                  paidDate: e.target.value,
                })
              }
              className="h-14 w-full rounded-2xl border px-4 outline-none"
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-10 bg-white border-t p-4 pb-6 md:pb-4">
          <button
            onClick={onSave}
            className="h-14 w-full rounded-2xl bg-white text-[#FF6B00] font-bold"
          >
            Save Salary
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* EXPENSE MODAL */
/* EXPENSE MODAL */
const ExpenseModal = ({ data, setData, onClose, onSave }) => {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [customCategory, setCustomCategory] = useState("");

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-end md:items-center justify-center p-0 md:p-4">
        <div className="w-full max-w-lg bg-white rounded-t-[35px] md:rounded-[35px] overflow-hidden max-h-[95vh] flex flex-col">
          {/* HEADER */}
          <div className="p-5 md:p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="text-xl md:text-2xl font-bold">
              {data?.id ? "Edit Expense" : "Add Expense"}
            </h2>

            <button
              onClick={onClose}
              className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <X size={18} />
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-32">
            {/* CATEGORY DROPDOWN */}
            <div ref={dropdownRef}>
              <label className="font-semibold block mb-2">
                Expense Category
              </label>

              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="h-14 w-full rounded-2xl border px-4 flex items-center justify-between bg-white"
              >
                <div className="flex items-center gap-3">
                  {data.category &&
                    (() => {
                      const found = EXPENSE_CATEGORIES.find(
                        (c) => c.label === data.category,
                      );

                      const Icon = found?.icon;

                      return Icon ? (
                        <Icon size={18} className="text-orange-500" />
                      ) : null;
                    })()}

                  <span
                    className={`text-sm md:text-base ${
                      data.category ? "text-black" : "text-gray-400"
                    }`}
                  >
                    {data.category || "Select Category"}
                  </span>
                </div>

                <ChevronDown size={18} />
              </button>

              {/* DROPDOWN */}
              {showCategoryDropdown && (
                <div className="mt-2 bg-white border rounded-2xl shadow-xl overflow-hidden max-h-[320px] overflow-y-auto">
                  {EXPENSE_CATEGORIES.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setData({
                            ...data,
                            category: item.label,
                          });

                          setShowCategoryDropdown(false);
                        }}
                        className="w-full px-4 py-4 flex items-center justify-between hover:bg-orange-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Icon size={18} className="text-orange-600" />
                          </div>

                          <span className="font-medium text-sm md:text-base">
                            {item.label}
                          </span>
                        </div>

                        {data.category === item.label && (
                          <Check size={18} className="text-green-600" />
                        )}
                      </button>
                    );
                  })}

                  {/* CUSTOM CATEGORY */}
                  <div className="border-t p-4 bg-gray-50">
                    <p className="font-semibold text-sm mb-3">
                      Add Custom Category
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter custom category"
                        className="h-12 flex-4 rounded-xl border px-4 outline-none bg-white"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          if (!customCategory.trim()) return;

                          setData({
                            ...data,
                            category: customCategory,
                          });

                          setCustomCategory("");

                          setShowCategoryDropdown(false);
                        }}
                        className="h-12 px-5 rounded-xl bg-[#FF6B00] text-white font-semibold whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AMOUNT */}
            <InputBox
              label="Amount Paid"
              value={data.amount}
              onChange={(v) =>
                setData({
                  ...data,
                  amount: v.replace(/[^0-9]/g, ""),
                })
              }
            />

            {/* PAID THROUGH */}
            <InputBox
              label="Paid Through"
              value={data.paidThrough}
              onChange={(v) =>
                setData({
                  ...data,
                  paidThrough: v,
                })
              }
            />

            {/* DATE */}
            <div>
              <label className="font-semibold block mb-2">Paid Date</label>

              <input
                type="date"
                value={data.paidDate}
                onChange={(e) =>
                  setData({
                    ...data,
                    paidDate: e.target.value,
                  })
                }
                className="h-14 w-full rounded-2xl border px-4 outline-none"
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="sticky bottom-10 bg-white border-t p-4 md:p-4">
            <button
              onClick={onSave}
              className="h-16 w-full rounded-2xl bg-[#FF6B00] text-white font-bold text-sm md:text-base"
            >
              Save Expense
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputBox = ({ label, value, onChange }) => (
  <div>
    <label className="font-semibold block mb-2">{label}</label>

    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-14 w-full rounded-2xl border px-4 outline-none"
    />
  </div>
);

export default SalaryDetailsPage;
