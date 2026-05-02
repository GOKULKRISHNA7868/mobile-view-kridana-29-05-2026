import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import {
  ChevronDown,
  Search,
  IndianRupee,
  Users,
  Wallet,
  Clock3,
  Pencil,
  X,
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

const SalaryDetailsPage = () => {
  const { user } = useAuth();

  const [trainers, setTrainers] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const monthRef = useRef(null);

  const [editData, setEditData] = useState({
    monthlySalary: "",
    paidAmount: "",
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
    const record = salaries.find(
      (s) => s.trainerId === trainer.id && s.month === selectedMonth,
    );

    return {
      paid: record?.paidAmount || 0,
      date: record?.paidDate || "-",
    };
  };

  /* OPEN EDIT */
  const openEdit = (trainer) => {
    if (!selectedMonth) {
      alert("Please select month first");
      return;
    }

    setSelectedTrainer(trainer);

    const record = salaries.find(
      (s) => s.trainerId === trainer.id && s.month === selectedMonth,
    );

    setEditData({
      monthlySalary: trainer.monthlySalary || "",
      paidAmount: record?.paidAmount || "",
      paidDate: record?.paidDate || "",
    });

    setShowEditModal(true);
  };

  /* SAVE */
  const saveSalary = async () => {
    if (!selectedTrainer) return;

    const { monthlySalary, paidAmount, paidDate } = editData;

    const existing = salaries.find(
      (s) => s.trainerId === selectedTrainer.id && s.month === selectedMonth,
    );

    await setDoc(
      doc(db, "InstituteTrainers", selectedTrainer.id),
      { monthlySalary: Number(monthlySalary) },
      { merge: true },
    );

    if (existing) {
      await setDoc(
        doc(db, "instituteSalaries", existing.id),
        {
          totalAmount: Number(monthlySalary),
          paidAmount: Number(paidAmount),
          paidDate,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      await setDoc(doc(collection(db, "instituteSalaries")), {
        trainerId: selectedTrainer.id,
        instituteId: user.uid,
        totalAmount: Number(monthlySalary),
        paidAmount: Number(paidAmount),
        paidDate,
        month: selectedMonth,
        createdAt: serverTimestamp(),
      });
    }

    alert("Saved Successfully ✅");
    setShowEditModal(false);
  };

  /* TOTALS */
  const totalEmployees = trainers.length;

  const totalAmount = selectedMonth
    ? trainers.reduce((sum, t) => sum + Number(t.monthlySalary || 0), 0)
    : 0;

  const totalPaid = selectedMonth
    ? salaries
        .filter((s) => s.month === selectedMonth)
        .reduce((sum, s) => sum + Number(s.paidAmount || 0), 0)
    : 0;

  const totalPending = totalAmount - totalPaid;

  return (
    <div className="fixed inset-0 top-[60px] bg-gray-50 overflow-hidden flex flex-col overscroll-none">
      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-sm p-3 sm:p-5 mb-3 shrink-0">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Salary Details
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage employee monthly salary records
            </p>
          </div>

          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* SEARCH */}
            <div className="relative w-full sm:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee..."
                className="w-full border rounded-xl pl-10 pr-4 py-3 bg-gray-50 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* MONTH */}
            <div ref={monthRef} className="relative w-full sm:w-52">
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="w-full bg-orange-500 text-white rounded-xl px-4 py-3 flex justify-between items-center font-medium"
              >
                <span>
                  {selectedMonth
                    ? MONTHS.find((m) => m.value === selectedMonth)?.label
                    : "Select Month"}
                </span>

                <ChevronDown
                  size={18}
                  className={showMonthDropdown ? "rotate-180" : ""}
                />
              </button>

              {showMonthDropdown && (
                <div className="absolute z-50 top-full mt-2 bg-white border rounded-2xl shadow-xl w-full max-h-72 overflow-auto">
                  {MONTHS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => {
                        setSelectedMonth(m.value);
                        setShowMonthDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-3 hover:bg-orange-50"
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3 shrink-0">
        <StatCard
          title="Employees"
          value={totalEmployees}
          icon={<Users size={20} />}
        />
        <StatCard
          title="Total Salary"
          value={`₹ ${totalAmount}`}
          icon={<IndianRupee size={20} />}
        />
        <StatCard
          title="Paid"
          value={`₹ ${totalPaid}`}
          icon={<Wallet size={20} />}
        />
        <StatCard
          title="Pending"
          value={`₹ ${totalPending}`}
          icon={<Clock3 size={20} />}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex-1 min-h-0">
        {/* DESKTOP */}
        <div className="hidden md:block h-full overflow-auto">
          <div className="grid grid-cols-5 bg-black text-orange-500 px-6 py-4 font-semibold text-sm">
            <div>Name</div>
            <div>Designation</div>
            <div>Salary</div>
            <div>Paid</div>
            <div>Action</div>
          </div>

          {filteredTrainers.map((trainer, index) => {
            const data = getTrainerSalaryData(trainer);

            return (
              <div
                key={trainer.id}
                className="grid grid-cols-5 px-6 py-4 border-t text-sm items-center hover:bg-gray-50"
              >
                <div className="font-medium">
                  {index + 1}. {trainer.firstName} {trainer.lastName}
                </div>

                <div>{trainer.designation || "-"}</div>

                <div>₹ {trainer.monthlySalary || 0}</div>

                <div className="text-green-600 font-semibold">
                  ₹ {data.paid}
                </div>

                <div>
                  <button
                    onClick={() => openEdit(trainer)}
                    className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* MOBILE */}
        <div className="md:hidden divide-y h-full overflow-y-auto pb-24">
          {filteredTrainers.map((trainer, index) => {
            const data = getTrainerSalaryData(trainer);

            return (
              <div key={trainer.id} className="p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {index + 1}. {trainer.firstName} {trainer.lastName}
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      {trainer.designation || "-"}
                    </p>
                  </div>

                  <button
                    onClick={() => openEdit(trainer)}
                    className="h-fit px-3 py-2 rounded-xl border border-orange-500 text-orange-500 text-sm"
                  >
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <SmallBox
                    title="Salary"
                    value={`₹ ${trainer.monthlySalary || 0}`}
                  />
                  <SmallBox title="Paid" value={`₹ ${data.paid}`} green />
                </div>

                <p className="text-xs text-gray-500 mt-3">
                  Paid Date: {data.date}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL */}
      {showEditModal && (
        <ModalForm
          data={editData}
          setData={setEditData}
          onClose={() => setShowEditModal(false)}
          onSave={saveSalary}
        />
      )}
    </div>
  );
};

/* CARD */
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white rounded-xl p-3 shadow-sm border">
    <div className="flex justify-between items-center mb-3 text-orange-500">
      {icon}
    </div>

    <p className="text-xs text-gray-500">{title}</p>
    <h3 className="text-xl font-bold mt-1">{value}</h3>
  </div>
);

const SmallBox = ({ title, value, green }) => (
  <div className="bg-gray-50 rounded-2xl p-3">
    <p className="text-xs text-gray-500">{title}</p>
    <p
      className={`font-semibold mt-1 ${
        green ? "text-green-600" : "text-gray-800"
      }`}
    >
      {value}
    </p>
  </div>
);

/* MODAL */
const ModalForm = ({ data, setData, onClose, onSave }) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl w-full max-w-md p-5">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold">Update Salary</h2>

        <button onClick={onClose} className="p-2 rounded-full bg-gray-100">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <InputBox
          label="Monthly Salary"
          value={data.monthlySalary}
          onChange={(v) =>
            setData({
              ...data,
              monthlySalary: v.replace(/[^0-9]/g, ""),
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

        <div>
          <label className="text-sm font-medium text-gray-600 block mb-2">
            Paid Date
          </label>

          <input
            type="date"
            value={data.paidDate}
            onChange={(e) =>
              setData({
                ...data,
                paidDate: e.target.value,
              })
            }
            className="w-full border rounded-xl px-4 py-3"
          />
        </div>

        <button
          onClick={onSave}
          className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold"
        >
          Save Salary
        </button>
      </div>
    </div>
  </div>
);

const InputBox = ({ label, value, onChange }) => (
  <div>
    <label className="text-sm font-medium text-gray-600 block mb-2">
      {label}
    </label>

    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded-xl px-4 py-3"
    />
  </div>
);

export default SalaryDetailsPage;
