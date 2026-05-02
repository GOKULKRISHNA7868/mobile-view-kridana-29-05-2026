import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";

const StudentsTable = () => {
  const { user } = useAuth(); // current trainer
  const [students, setStudents] = useState([]);
  const [localRows, setLocalRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", category: "", sessions: "", phone: "" });

  // Sync localRows whenever students data updates
  useEffect(() => {
    setLocalRows(students);
  }, [students]);

  // Fetch students from Firestore
  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.uid) return;
      try {
        const q = query(collection(db, "trainerstudents"), where("trainerId", "==", user.uid));
        const snapshot = await getDocs(q);
       const studentsData = snapshot.docs
  .map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
  .sort((a, b) =>
    (a.firstName || "").localeCompare(b.firstName || "")
  );
        setStudents(studentsData);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };
    fetchStudents();
  }, [user]);

  // Start editing a row
  const startEdit = (row) => {
    setEditingId(row.id);
    setDraft({
      name: `${row.firstName || ""} ${row.lastName || ""}`,
      category: row.category,
      sessions: row.sessions,
      phone: row.phone,
    });
  };

  // Save or start edit
  const saveOrStartEdit = async (row) => {
    if (editingId === row.id) {
      const studentRef = doc(db, "trainerstudents", row.id);
      try {
        const [firstName, lastName = ""] = draft.name.split(" ");
        await updateDoc(studentRef, {
          firstName,
          lastName,
          category: draft.category,
          sessions: draft.sessions,
          phone: draft.phone,
        });
        setLocalRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? {
                ...r,
                firstName,
                lastName,
                category: draft.category,
                sessions: draft.sessions,
                phone: draft.phone,
              }
              : r
          )
        );
      } catch (err) {
        console.error("Error updating student:", err);
      }
      setEditingId(null);
    } else {
      startEdit(row);
    }
  };

  const handleChange = (field, value) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow w-full">
      {/* HEADER */}
    <div className="grid grid-cols-4 min-w-[900px] px-6 py-4 bg-[#1e293b] text-white font-bold text-lg items-center">

        <div className="flex justify-center items-center gap-2">Students Name</div>
        <div className="flex justify-center items-center">Category</div>
        <div className="flex justify-center items-center">Sessions</div>
        <div className="flex justify-center items-center">Phone Number</div>
      </div>

      {/* TABLE BODY */}
      <div className="bg-white text-black">
        {localRows.length === 0 ? (
          <div className="grid grid-cols-4 min-w-[900px] gap-2 sm:gap-4 px-4 py-6 border-t border-orange-200 text-sm text-center">
            <div className="col-span-1 sm:col-span-4 text-center text-gray-500 font-medium">
              No students assigned
            </div>
          </div>
        ) : (
          localRows.map((row, index) => {
            const isEditing = editingId === row.id;
            return (
              <div
                key={row.id}
                className="grid grid-cols-4 min-w-[900px] px-6 py-4 border-b border-gray-200 text-sm items-center hover:bg-gray-100 cursor-pointer"
                onClick={() => saveOrStartEdit(row)}
              >
                <div className="flex items-center">
                  {isEditing ? (
                    <input
                      value={draft.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      className="border px-2 py-1 rounded text-xs w-full text-center"
                    />
                  ) : (
                   <span className="ml-4 sm:ml-10 md:ml-20">
                      {index + 1}. {row.firstName || ""} {row.lastName || ""}
                    </span>

                  )}
                </div>

                <div className="text-center">
                  {isEditing ? (
                    <input
                      value={draft.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                      className="border px-2 py-1 rounded text-xs w-full text-center"
                    />
                  ) : (
                    row.category
                  )}
                </div>

                <div className="text-center">
                  {isEditing ? (
                    <input
                      value={draft.sessions}
                      onChange={(e) => handleChange("sessions", e.target.value)}
                      className="border px-2 py-1 rounded text-xs w-full text-center"
                    />
                  ) : (
                    row.sessions
                  )}
                </div>

                <div className="text-center">
                  {isEditing ? (
                    <input
                      value={draft.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="border px-2 py-1 rounded text-xs w-full text-center"
                    />
                  ) : (
                    row.phone
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentsTable;