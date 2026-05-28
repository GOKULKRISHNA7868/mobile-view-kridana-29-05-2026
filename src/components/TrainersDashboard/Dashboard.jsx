import React, { useEffect, useMemo, useState } from "react";

import {
  Settings,
  Search,
  Phone,
  Mail,
  Eye,
  IndianRupee,
  Users,
  BadgeCheck,
} from "lucide-react";

import { db } from "../../firebase";

import { useAuth } from "../../context/AuthContext";

import { collection, query, where, getDocs } from "firebase/firestore";

import { useNavigate } from "react-router-dom";

const TrainerDashboard = () => {
  const { user } = useAuth();

  const navigate = useNavigate();

  const [students, setStudents] = useState([]);

  const [fees, setFees] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [stats, setStats] = useState({
    totalStudents: 0,
    newStudents: 0,
    totalFees: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });

  // =========================================================
  // FETCH DATA
  // =========================================================
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // =====================================================
        // STUDENTS
        // =====================================================
        const studentSnap = await getDocs(
          query(
            collection(db, "trainerstudents"),
            where("trainerId", "==", user.uid),
          ),
        );

        const studentsData = studentSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setStudents(studentsData);

        // =====================================================
        // FEES
        // =====================================================
        const feeSnap = await getDocs(
          query(
            collection(db, "institutesFees"),
            where("trainerId", "==", user.uid),
          ),
        );

        const feesData = feeSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setFees(feesData);

        // =====================================================
        // TOTAL FEES
        // =====================================================
        let totalFees = 0;

        studentsData.forEach((student) => {
          if (Array.isArray(student.sports) && student.sports.length > 0) {
            student.sports.forEach((sport) => {
              totalFees += Number(sport.fee || 0);
            });
          } else {
            totalFees += Number(student.monthlyFee || 0);
          }
        });

        // =====================================================
        // PAID
        // =====================================================
        let paidAmount = 0;

        feesData.forEach((fee) => {
          paidAmount += Number(fee.paidAmount || 0);
        });

        // =====================================================
        // PENDING
        // =====================================================
        const pendingAmount = totalFees - paidAmount;

        // =====================================================
        // NEW STUDENTS
        // =====================================================
        const newStudents = studentsData.filter((student) => {
          const joinDate = new Date(student.joiningDate);

          const now = new Date();

          const diffDays = (now - joinDate) / (1000 * 60 * 60 * 24);

          return diffDays <= 30;
        }).length;

        // =====================================================
        // STATS
        // =====================================================
        setStats({
          totalStudents: studentsData.length,
          newStudents,
          totalFees,
          paidAmount,
          pendingAmount,
        });
      } catch (err) {
        console.log(err);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // =========================================================
  // SEARCH FILTER
  // =========================================================
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const text = `
        ${student.firstName}
        ${student.lastName}
        ${student.phone}
        ${student.email}
        ${student.registerNumber}
        ${student.category}
        ${student.subCategory}
      `.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [students, search]);

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF7F2] flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF7F2] pb-32">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-3">
            <img
              src={user?.photoURL || "https://ui-avatars.com/api/?name=Trainer"}
              alt=""
              className="w-12 h-12 rounded-full object-cover border"
            />

            <div>
              <h1 className="font-bold text-lg">Trainer Dashboard</h1>

              <p className="text-sm text-gray-500">Welcome Trainer 👋</p>
            </div>
          </div>

          {/* SETTINGS */}
          <button className="bg-[#FF6A00] text-white p-3 rounded-2xl">
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* ===================================================
            STATS TABLE
        =================================================== */}

        {/* ===================================================
            SEARCH
        =================================================== */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 border rounded-2xl px-4 py-3">
            <Search size={18} className="text-gray-400" />

            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none bg-transparent"
            />
          </div>
        </div>

        {/* ===================================================
            STUDENTS TABLE
        =================================================== */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {/* HEADER */}
          <div className="px-4 py-4 bg-[#FF6A00]">
            <h2 className="text-white font-bold text-lg">Students List</h2>
          </div>

          {/* MOBILE TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px]">
              <thead className="bg-orange-50">
                <tr className="text-left">
                  <Th>Photo</Th>

                  <Th>Name</Th>

                  <Th>Phone</Th>

                  <Th>Email</Th>

                  <Th>Register No</Th>

                  <Th>Category</Th>

                  <Th>Sport</Th>

                  <Th>Session</Th>

                  <Th>Timing</Th>

                  <Th>Fee</Th>

                  <Th>Joining</Th>

                  <Th>Status</Th>

                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      className="text-center py-10 text-gray-500"
                    >
                      No Students Found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => {
                    const sport = student.sports?.[0] || {};

                    return (
                      <tr
                        key={student.id}
                        className={`border-b ${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        {/* PHOTO */}
                        <Td>
                          <img
                            src={student.profileImageUrl}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover border"
                          />
                        </Td>

                        {/* NAME */}
                        <Td>
                          <div className="font-semibold">
                            {student.firstName} {student.lastName}
                          </div>

                          <div className="text-xs text-gray-500">
                            {student.gender}
                          </div>
                        </Td>

                        {/* PHONE */}
                        <Td>
                          <div className="flex items-center gap-2">
                            <Phone size={14} />

                            {student.phone}
                          </div>
                        </Td>

                        {/* EMAIL */}
                        <Td>
                          <div className="flex items-center gap-2">
                            <Mail size={14} />

                            <span className="break-all">{student.email}</span>
                          </div>
                        </Td>

                        {/* REGISTER */}
                        <Td>{student.registerNumber}</Td>

                        {/* CATEGORY */}
                        <Td>{student.category}</Td>

                        {/* SPORT */}
                        <Td>{student.subCategory || sport.subCategory}</Td>

                        {/* SESSION */}
                        <Td>{student.sessions}</Td>

                        {/* TIMING */}
                        <Td>{student.timings || sport.timings}</Td>

                        {/* FEE */}
                        <Td>₹{student.monthlyFee || sport.fee || 0}</Td>

                        {/* JOINING */}
                        <Td>{student.joiningDate}</Td>

                        {/* STATUS */}
                        <Td>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              student.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {student.status || "Active"}
                          </span>
                        </Td>

                        {/* ACTIONS */}
                        <Td>
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${student.phone}`}
                              className="bg-green-500 text-white px-3 py-2 rounded-xl text-xs"
                            >
                              Call
                            </a>
                          </div>
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================================================
            FEES TABLE
        =================================================== */}
      </div>
    </div>
  );
};

// =========================================================
// TABLE HEADER
// =========================================================
const Th = ({ children }) => {
  return (
    <th className="px-4 py-4 text-sm font-bold text-gray-700 whitespace-nowrap">
      {children}
    </th>
  );
};

// =========================================================
// TABLE DATA
// =========================================================
const Td = ({ children, className = "" }) => {
  return (
    <td className={`px-4 py-4 text-sm whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
};

// =========================================================
// SUMMARY TABLE ROW
// =========================================================
const TableRow = ({ icon, label, value, valueColor }) => {
  return (
    <tr className="border-b">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 text-[#FF6A00] p-2 rounded-xl">
            {icon}
          </div>

          <span className="font-medium">{label}</span>
        </div>
      </td>

      <td
        className={`px-4 py-4 text-right font-bold ${
          valueColor || "text-black"
        }`}
      >
        {value}
      </td>
    </tr>
  );
};

export default TrainerDashboard;
