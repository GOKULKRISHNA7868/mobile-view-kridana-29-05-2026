// src/components/InstituteDashboard/InstituteDataPage.jsx
import React, { useState, useMemo, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

const InstituteDataPage = ({
  students,
  trainers,
  onDeleteStudent,
  onDeleteTrainer,
}) => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [activeType, setActiveType] = useState("students");
  const [search, setSearch] = useState("");

  const handleSelect = (type) => {
    setActiveType(type);
    setOpenDropdown(false);
  };

  // Safe filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (!s) return false;
      const fullName = `${s.firstName || ""} ${s.lastName || ""}`.trim();
      return fullName.toLowerCase().includes(search.toLowerCase());
    });
  }, [students, search]);

  // Safe filtered trainers
  const filteredTrainers = useMemo(() => {
    return trainers.filter((t) => {
      if (!t) return false;
      const fullName = `${t.firstName || ""} ${t.lastName || ""}`.trim();
      return fullName.toLowerCase().includes(search.toLowerCase());
    });
  }, [trainers, search]);

  return (
    <div className="h-full text-white">
      {/* Search + icons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center bg-[#3b2615] border border-[#6b4a2d] rounded-full px-4 py-2 w-full max-w-md">
          <span className="mr-2 text-lg text-gray-300">🔍</span>
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm w-full placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-4 ml-6">
          <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-orange-500 text-xl">
            🔔
          </button>
          <button className="w-9 h-9 rounded-full bg-white" />
        </div>
      </div>

      {/* Title + dropdown + date + add */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenDropdown((v) => !v)}
            className="flex items-center gap-1 text-3xl font-extrabold text-orange-400"
          >
            Institute Data
            <span className="text-xl">{openDropdown ? "▲" : "▼"}</span>
          </button>

          {openDropdown && (
            <div className="absolute mt-2 w-56 bg-[#ffc79a] text-black rounded-md shadow-lg z-10">
              <button
                type="button"
                onClick={() => handleSelect("students")}
                className={
                  "block w-full text-left px-4 py-3 hover:bg-orange-200 " +
                  (activeType === "students" ? "font-semibold" : "")
                }
              >
                Students Data
              </button>
              <button
                type="button"
                onClick={() => handleSelect("trainers")}
                className={
                  "block w-full text-left px-4 py-3 hover:bg-orange-200 " +
                  (activeType === "trainers" ? "font-semibold" : "")
                }
              >
                Trainer’s Data
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            <span>📅</span>
            <span>Jan2026–Feb2026</span>
          </button>
          <button className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            <span>➕</span>
            <span>Add</span>
          </button>
        </div>
      </div>

      {activeType === "students" ? (
        <InstituteStudentsTable
          rows={filteredStudents}
          onDelete={onDeleteStudent}
        />
      ) : (
        <InstituteTrainersTable
          rows={filteredTrainers}
          onDelete={onDeleteTrainer}
        />
      )}
    </div>
  );
};

/* -------- shared row actions (delete + edit/save) -------- */
const TableActions = ({ onDelete, onEditToggle, isEditing }) => (
  <div className="flex items-center gap-3 text-orange-500 text-lg">
    <button title="Delete" onClick={onDelete}>
      🗑️
    </button>
    <button title="Edit / Save" onClick={onEditToggle}>
      {isEditing ? "✅" : "✏️"}
    </button>
  </div>
);

/* -------- Students table -------- */
const InstituteStudentsTable = ({ rows, onDelete }) => {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", batch: "", phone: "" });
  const [localRows, setLocalRows] = useState(rows);

  useEffect(() => setLocalRows(rows), [rows]);

  const startEdit = (row) => {
    setEditingId(row.uid);
    const name = `${row.firstName || ""} ${row.lastName || ""}`.trim();
    setDraft({ name, batch: row.batch || "", phone: row.phone || "" });
  };

  const saveOrStartEdit = async (row) => {
    if (editingId === row.uid) {
      const [firstName, lastName] = draft.name.split(" ");
      const studentRef = doc(db, "students", row.uid);

      try {
        await updateDoc(studentRef, {
          firstName: firstName || "",
          lastName: lastName || "",
          batch: draft.batch,
          phone: draft.phone,
        });
      } catch (err) {
        console.error("Error updating student:", err);
      }

      setLocalRows((prev) =>
        prev.map((r) =>
          r.uid === row.uid
            ? {
                ...r,
                firstName: firstName || "",
                lastName: lastName || "",
                batch: draft.batch,
                phone: draft.phone,
              }
            : r
        )
      );
      setEditingId(null);
    } else startEdit(row);
  };

  const handleChange = (field, value) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="bg-[#f9c199] rounded-t-xl overflow-hidden">
      <div className="grid grid-cols-4 gap-4 px-4 py-3 text-black font-semibold text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border border-black bg-white" />
          <span>Students Name</span>
        </div>
        <div>Batch.No</div>
        <div>Phn.No</div>
        <div>Action</div>
      </div>

      <div className="bg-white text-black">
        {localRows.map((row) => {
          const isEditing = editingId === row.uid;
          const name = `${row.firstName || ""} ${row.lastName || ""}`.trim();
          return (
            <div
              key={row.uid}
              className="grid grid-cols-4 gap-4 px-4 py-3 border-t border-gray-200 text-sm items-center"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#d6e4ff] border border-[#97b2ff]" />
                {isEditing ? (
                  <input
                    value={draft.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="border px-2 py-1 rounded text-xs w-full"
                  />
                ) : (
                  <span>{name}</span>
                )}
              </div>
              <div>
                {isEditing ? (
                  <input
                    value={draft.batch}
                    onChange={(e) => handleChange("batch", e.target.value)}
                    className="border px-2 py-1 rounded text-xs w-full"
                  />
                ) : (
                  row.batch
                )}
              </div>
              <div>
                {isEditing ? (
                  <input
                    value={draft.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="border px-2 py-1 rounded text-xs w-full"
                  />
                ) : (
                  row.phone
                )}
              </div>
              <TableActions
                onDelete={() => onDelete(row.uid)}
                onEditToggle={() => saveOrStartEdit(row)}
                isEditing={isEditing}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* -------- Trainers table -------- */
const InstituteTrainersTable = ({ rows, onDelete }) => {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", category: "", phone: "" });
  const [localRows, setLocalRows] = useState(rows);

  useEffect(() => setLocalRows(rows), [rows]);

  const startEdit = (row) => {
    setEditingId(row.trainerUid);
    const name = `${row.firstName || ""} ${row.lastName || ""}`.trim();
    setDraft({ name, category: row.category || "", phone: row.phone || "" });
  };

  const saveOrStartEdit = async (row) => {
    if (editingId === row.trainerUid) {
      const [firstName, lastName] = draft.name.split(" ");
      const trainerRef = doc(db, "InstituteTrainers", row.trainerUid);

      try {
        await updateDoc(trainerRef, {
          firstName: firstName || "",
          lastName: lastName || "",
          category: draft.category,
          phone: draft.phone,
        });
      } catch (err) {
        console.error("Error updating trainer:", err);
      }

      setLocalRows((prev) =>
        prev.map((r) =>
          r.trainerUid === row.trainerUid
            ? {
                ...r,
                firstName: firstName || "",
                lastName: lastName || "",
                category: draft.category,
                phone: draft.phone,
              }
            : r
        )
      );
      setEditingId(null);
    } else startEdit(row);
  };

  const handleChange = (field, value) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="bg-[#f9c199] rounded-t-xl overflow-hidden">
      <div className="grid grid-cols-4 gap-4 px-4 py-3 text-black font-semibold text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border border-black bg-white" />
          <span>Trainers Name</span>
        </div>
        <div>Category</div>
        <div>Phn.No</div>
        <div>Action</div>
      </div>

      <div className="bg-white text-black">
        {localRows.map((row) => {
          const isEditing = editingId === row.trainerUid;
          const name = `${row.firstName || ""} ${row.lastName || ""}`.trim();
          return (
            <div
              key={row.trainerUid}
              className="grid grid-cols-4 gap-4 px-4 py-3 border-t border-gray-200 text-sm items-center"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#d6e4ff] border border-[#97b2ff]" />
                {isEditing ? (
                  <input
                    value={draft.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="border px-2 py-1 rounded text-xs w-full"
                  />
                ) : (
                  <span>{name}</span>
                )}
              </div>
              <div>
                {isEditing ? (
                  <input
                    value={draft.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="border px-2 py-1 rounded text-xs w-full"
                  />
                ) : (
                  row.category
                )}
              </div>
              <div>
                {isEditing ? (
                  <input
                    value={draft.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="border px-2 py-1 rounded text-xs w-full"
                  />
                ) : (
                  row.phone
                )}
              </div>
              <TableActions
                onDelete={() => onDelete(row.trainerUid)}
                onEditToggle={() => saveOrStartEdit(row)}
                isEditing={isEditing}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InstituteDataPage;
