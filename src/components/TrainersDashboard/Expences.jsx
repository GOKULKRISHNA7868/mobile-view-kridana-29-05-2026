import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

import {
  Search,
  CalendarDays,
  ChevronDown,
  Receipt,
  IndianRupee,
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Home,
  Zap,
  Droplets,
  Wrench,
  Wifi,
  Megaphone,
  Building2,
} from "lucide-react";

/* =========================================================
   MONTHS
========================================================= */

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

/* =========================================================
   EXPENSE CATEGORIES
========================================================= */

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

/* =========================================================
   FORMAT MONEY
========================================================= */

const formatCurrency = (num) => {
  if (!num) return "₹0";

  return `₹${Number(num).toLocaleString("en-IN")}`;
};

/* =========================================================
   PAGE
========================================================= */

function TrainerExpensesPage() {
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedMonth, setSelectedMonth] = useState("");

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [editingExpense, setEditingExpense] = useState(null);

  const monthRef = useRef(null);

  const [expenseData, setExpenseData] = useState({
    category: "",
    amount: "",
    paidThrough: "",
    paidDate: "",
  });

  /* =========================================================
     CLOSE MONTH DROPDOWN
  ========================================================= */

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (monthRef.current && !monthRef.current.contains(e.target)) {
        setShowMonthDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =========================================================
     FETCH EXPENSES
  ========================================================= */

  useEffect(() => {
    if (!user?.uid) return;

    fetchExpenses();
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const snap = await getDocs(
        collection(db, "trainers", user.uid, "expenses"),
      );

      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setExpenses(data);
    } catch (error) {
      console.error(error);
    }
  };

  /* =========================================================
     SAVE EXPENSE
  ========================================================= */

  const saveExpense = async () => {
    const { category, amount, paidThrough, paidDate } = expenseData;

    if (!category || !amount || !paidThrough || !paidDate) {
      alert("Please fill all fields");
      return;
    }

    const expenseMonth = paidDate.slice(0, 7);

    try {
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
          doc(db, "trainers", user.uid, "expenses", editingExpense.id),
          updatedExpense,
          {
            merge: true,
          },
        );

        setExpenses((prev) =>
          prev.map((item) =>
            item.id === editingExpense.id ? updatedExpense : item,
          ),
        );

        alert("Expense Updated Successfully ✅");
      } else {
        const newRef = doc(collection(db, "trainers", user.uid, "expenses"));

        const newExpense = {
          id: newRef.id,
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
    } catch (error) {
      console.error(error);

      alert("Failed to save expense");
    }
  };

  /* =========================================================
     EDIT
  ========================================================= */

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

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDeleteExpense = async (expenseId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this expense?",
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "trainers", user.uid, "expenses", expenseId));

      setExpenses((prev) => prev.filter((item) => item.id !== expenseId));

      alert("Expense Deleted Successfully ✅");
    } catch (error) {
      console.error(error);

      alert("Failed to delete expense");
    }
  };

  /* =========================================================
     FILTERS
  ========================================================= */

  const currentYear = new Date().getFullYear();

  const selectedMonthKey = selectedMonth
    ? `${currentYear}-${selectedMonth}`
    : "";

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = expense.category
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const matchesMonth = selectedMonth
        ? expense.month === selectedMonthKey
        : true;

      return matchesSearch && matchesMonth;
    });
  }, [expenses, search, selectedMonth, selectedMonthKey]);

  /* =========================================================
     STATS
  ========================================================= */

  const totalExpenses = filteredExpenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const totalRecords = filteredExpenses.length;

  const categoryCount = new Set(filteredExpenses.map((e) => e.category)).size;

  const currentMonth = new Date().toISOString().slice(0, 7);

  const thisMonthExpense = expenses
    .filter((e) => e.month === currentMonth)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div
      className="
    min-h-screen
    bg-[#f7f7f7]
    px-4
    md:px-8
    py-6
    pb-32
    md:pb-6
  "
    >
      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>

        <p className="text-gray-500 mt-1">Manage your training expenses</p>
      </div>

      {/* SEARCH + MONTH */}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 mt-8">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expense..."
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
              {MONTHS.map((month) => (
                <button
                  key={month.value}
                  onClick={() => {
                    setSelectedMonth(month.value);

                    setShowMonthDropdown(false);
                  }}
                  className="w-full text-left px-5 py-3 hover:bg-orange-50"
                >
                  {month.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon={<IndianRupee size={22} />}
          bg="bg-green-50"
          color="text-green-600"
        />

        <StatCard
          title="This Month"
          value={formatCurrency(thisMonthExpense)}
          icon={<Receipt size={22} />}
          bg="bg-orange-50"
          color="text-orange-600"
        />

        <StatCard
          title="Records"
          value={totalRecords}
          icon={<Package size={22} />}
          bg="bg-blue-50"
          color="text-blue-600"
        />

        <StatCard
          title="Categories"
          value={categoryCount}
          icon={<Receipt size={22} />}
          bg="bg-purple-50"
          color="text-purple-600"
        />
      </div>

      {/* EXPENSE LIST */}

      <div className="mt-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-bold text-gray-900">Expense Records</h2>

          <button
            onClick={() => {
              setEditingExpense(null);

              setExpenseData({
                category: "",
                amount: "",
                paidThrough: "",
                paidDate: "",
              });

              setShowExpenseModal(true);
            }}
            className="h-12 px-5 rounded-2xl bg-[#FF6B00] text-white font-semibold flex items-center gap-2"
          >
            <Plus size={18} />
            Add Expense
          </button>
        </div>

        <div className="bg-white rounded-[30px] border overflow-hidden">
          {filteredExpenses.length === 0 ? (
            <div className="py-16 text-center">
              <Receipt size={50} className="mx-auto text-gray-300" />

              <h3 className="mt-4 text-lg font-semibold text-gray-700">
                No Expenses Found
              </h3>

              <p className="text-gray-500 mt-1">
                Add your first expense record
              </p>
            </div>
          ) : (
            filteredExpenses
              .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
              .map((expense) => {
                const categoryObj = EXPENSE_CATEGORIES.find(
                  (c) => c.label === expense.category,
                );

                const Icon = categoryObj?.icon || Receipt;

                return (
                  <div
                    key={expense.id}
                    className="
    flex
    flex-col
    md:flex-row
    md:items-center
    justify-between
    gap-4
    px-4
    md:px-6
    py-5
    border-b
  "
                  >
                    {/* LEFT */}

                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                        <Icon size={22} className="text-orange-600" />
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-900">
                          {expense.category}
                        </h3>

                        <p className="text-gray-500 text-sm mt-1">
                          Expense Record
                        </p>
                      </div>
                    </div>

                    {/* AMOUNT */}

                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {formatCurrency(expense.amount)}
                      </h3>

                      <p className="text-gray-500 text-sm mt-1">
                        {expense.paidDate}
                      </p>
                    </div>

                    {/* METHOD */}

                    <span className="px-4 py-2 rounded-full bg-orange-100 text-orange-600 text-sm font-semibold w-fit">
                      {expense.paidThrough}
                    </span>

                    {/* ACTIONS */}

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
                );
              })
          )}
        </div>
      </div>

      {/* MODAL */}

      {showExpenseModal && (
        <ExpenseModal
          data={expenseData}
          setData={setExpenseData}
          editingExpense={editingExpense}
          onClose={() => {
            setShowExpenseModal(false);
            setEditingExpense(null);
          }}
          onSave={saveExpense}
        />
      )}
    </div>
  );
}
/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ title, value, icon, bg, color }) {
  return (
    <div
      className={`
        ${bg}
        rounded-[28px]
        border
        p-4
        md:p-5
        min-w-0
        overflow-hidden
      `}
    >
      <div className={color}>{icon}</div>

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
        `}
      >
        {value}
      </h3>
    </div>
  );
}

/* =========================================================
   EXPENSE MODAL
========================================================= */

function ExpenseModal({ data, setData, onClose, onSave, editingExpense }) {
  return (
    <div
      className="
    fixed
    inset-0
    z-[9999]
    bg-black/50
    flex
    items-end
    md:items-center
    justify-center
  "
    >
      <div
        className="
bg-white
w-full
md:w-[520px]
rounded-t-[30px]
md:rounded-[30px]
p-6
pb-[calc(24px+env(safe-area-inset-bottom))]
max-h-[80vh]
md:max-h-[90vh]
overflow-y-auto
"
      >
        {/* HEADER */}

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {editingExpense ? "Edit Expense" : "Add Expense"}
          </h2>

          <button
            onClick={onClose}
            className="
              h-10
              w-10
              rounded-xl
              border
              flex
              items-center
              justify-center
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* CATEGORY */}

        <div className="mt-6">
          <label className="text-sm font-semibold text-gray-600">
            Category
          </label>

          <select
            value={data.category}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                category: e.target.value,
              }))
            }
            className="
              mt-2
              w-full
              h-14
              rounded-2xl
              border
              px-4
              outline-none
            "
          >
            <option value="">Select Category</option>

            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.label} value={cat.label}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* AMOUNT */}

        <div className="mt-5">
          <label className="text-sm font-semibold text-gray-600">Amount</label>

          <input
            type="number"
            placeholder="Enter amount"
            value={data.amount}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                amount: e.target.value,
              }))
            }
            className="
              mt-2
              w-full
              h-14
              rounded-2xl
              border
              px-4
              outline-none
            "
          />
        </div>

        {/* PAYMENT MODE */}

        <div className="mt-5">
          <label className="text-sm font-semibold text-gray-600">
            Paid Through
          </label>

          <select
            value={data.paidThrough}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                paidThrough: e.target.value,
              }))
            }
            className="
              mt-2
              w-full
              h-14
              rounded-2xl
              border
              px-4
              outline-none
            "
          >
            <option value="">Select Method</option>

            <option value="Cash">Cash</option>

            <option value="UPI">UPI</option>

            <option value="Bank Transfer">Bank Transfer</option>

            <option value="Card">Card</option>
          </select>
        </div>

        {/* DATE */}

        <div className="mt-5">
          <label className="text-sm font-semibold text-gray-600">
            Paid Date
          </label>

          <input
            type="date"
            value={data.paidDate}
            onChange={(e) =>
              setData((prev) => ({
                ...prev,
                paidDate: e.target.value,
              }))
            }
            className="
              mt-2
              w-full
              h-14
              rounded-2xl
              border
              px-4
              outline-none
            "
          />
        </div>

        {/* BUTTONS */}

        <div className="grid grid-cols-2 gap-4 mt-8">
          <button
            onClick={onClose}
            className="
              h-14
              rounded-2xl
              border
              font-semibold
            "
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            className="
              h-14
              rounded-2xl
              bg-[#FF6B00]
              text-white
              font-semibold
              flex
              items-center
              justify-center
              gap-2
            "
          >
            <Check size={18} />
            Save Expense
          </button>
        </div>
      </div>
    </div>
  );
}
export default TrainerExpensesPage;
