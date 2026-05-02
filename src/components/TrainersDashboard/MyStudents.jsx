import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayRemove,
} from "firebase/firestore";
import { Pagination } from "../InstituteDashboard/shared";


export default function TrainerStudentsPage() {
  const trainerId = auth.currentUser?.uid;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editStudent, setEditStudent] = useState(null);
  const [form, setForm] = useState({});
  // 🔢 Pagination state
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

useEffect(() => {
  setCurrentPage(1);
}, [students]);


  /* ==============================
     🔹 FETCH TRAINER STUDENTS
  ============================== */
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const trainerSnap = await getDoc(doc(db, "trainers", trainerId));
        if (!trainerSnap.exists()) return;

        const studentIds = trainerSnap.data().students || [];
        if (studentIds.length === 0) {
          setStudents([]);
          setLoading(false);
          return;
        }

        const studentDocs = await Promise.all(
          studentIds.map((id) => getDoc(doc(db, "trainerstudents", id)))
        );

        const list = studentDocs
          .filter((s) => s.exists())
          .map((s) => ({ id: s.id, ...s.data() }));

        setStudents(list);
      } catch (err) {
        console.error("Fetch students error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (trainerId) fetchStudents();
  }, [trainerId]);

  /* ==============================
     ✏️ EDIT HANDLERS
  ============================== */
  const openEdit = (student) => {
    setEditStudent(student);
    setForm(student);
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "trainerstudents", editStudent.id), {
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        email: form.email,
        category: form.category,
        feeAmount: Number(form.feeAmount),
      });

      setStudents((prev) =>
        prev.map((s) => (s.id === editStudent.id ? { ...s, ...form } : s))
      );

      setEditStudent(null);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  if (loading) {
    return <p className="text-white">Loading students...</p>;
  }

  const totalPages = Math.ceil(students.length / itemsPerPage);

const paginatedStudents = students.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

const handleDeleteStudent = async (studentId) => {
  try {
    // 1️⃣ Delete student document
    await deleteDoc(doc(db, "trainerstudents", studentId));

    // 2️⃣ Remove student ID from trainer document
    await updateDoc(doc(db, "trainers", trainerId), {
      students: arrayRemove(studentId),
    });

    // 3️⃣ Update UI
    setStudents((prev) =>
      prev.filter((s) => s.id !== studentId)
    );
  } catch (err) {
    console.error("Delete student failed:", err);
  }
};


  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-orange-500 mb-6">My Students</h1>

      {/* ================= TABLE ================= */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-sm text-gray-800">
          <thead className="bg-[#f9c199] text-black">
            <tr>
             <th className="p-3 text-left w-48">Name</th>
<th className="p-3 text-left w-32">Category</th>
<th className="p-3 text-left w-32">Phone</th>
<th className="p-3 text-left w-64">Email</th>
<th className="p-3 text-left w-24">Fee</th>
<th className="p-3 text-left w-32">Joined</th>
<th className="p-3 text-center w-28">Action</th>

            </tr>
          </thead>

          <tbody>
            {paginatedStudents.map((s) => (

              <tr key={s.id} className="border-b hover:bg-gray-100">
                <td className="p-3 font-semibold w-48">
  {s.firstName} {s.lastName}
</td>
<td className="p-3 w-32">{s.category}</td>
<td className="p-3 w-32">{s.phoneNumber}</td>
<td className="p-3 w-64">{s.email}</td>
<td className="p-3 w-24">₹{s.feeAmount}</td>
<td className="p-3 w-32">{s.joinedDate}</td>
<td className="p-3 w-28 text-center">

                  <div className="flex gap-2 justify-center">
  <button
    onClick={() => openEdit(s)}
    className="px-4 py-1.5 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition"
  >
    Edit
  </button>

  <button
    onClick={() => handleDeleteStudent(s.id)}
    className="px-4 py-1.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
  >
    Delete
  </button>
</div>

                </td>
              </tr>
            ))}

            {students.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center p-4">
                  No students assigned
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>


      {/* ================= EDIT MODAL ================= */}
      {editStudent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white text-gray-900 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Edit Student
            </h2>

            {[
              ["First Name", "firstName"],
              ["Last Name", "lastName"],
              ["Phone Number", "phoneNumber"],
              ["Email", "email"],
              ["Category", "category"],
              ["Fee Amount", "feeAmount"],
            ].map(([label, key]) => (
              <div key={key} className="mb-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  type="text"
                  value={form[key] || ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="
              w-full px-3 py-2
              border border-gray-300 rounded-lg
              bg-white text-gray-900
              placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-orange-500
            "
                />
              </div>
            ))}

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditStudent(null)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}