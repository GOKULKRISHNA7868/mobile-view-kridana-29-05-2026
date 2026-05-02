import React, { useState, useEffect } from "react";

export const TopSearchWithActionsDark = ({ search, setSearch }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center bg-[#3b2615] border border-[#6b4a2d] rounded-full px-4 py-2 w-full max-w-md">
      <span className="mr-2 text-lg text-gray-300">🔍</span>
      <input
        type="text"
        placeholder="Search here..."
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
);

export const TopSearchWithActionsLight = ({ search, setSearch }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 w-full max-w-md">
      <span className="mr-2 text-lg text-gray-500">🔍</span>
      <input
        type="text"
        placeholder="Search here..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-transparent outline-none text-sm w-full placeholder:text-gray-400"
      />
    </div>
    <div className="flex items-center gap-4 ml-6">
      <button className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
        <span>➕</span>
        <span>Add</span>
      </button>
      <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-orange-500 text-xl border border-gray-300">
        🔔
      </button>
      <button className="w-9 h-9 rounded-full bg-white border border-gray-300" />
    </div>
  </div>
);

export const HeaderWithDate = ({ title }) => (
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-3xl font-extrabold text-orange-500">{title}</h1>
    <button className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
      <span>📅</span>
      <span>Jan2026–Feb2026</span>
    </button>
  </div>
);

export const FeesOrSalaryCharts = ({
  totalLabel,
  paidLabel,
  pendingLabel,
  peopleLabel,
}) => (
  <div className="flex flex-wrap gap-4 mb-6">
    <div className="bg-black rounded-2xl p-4 flex-[0.9] min-w-[260px]">
      <div className="flex justify-between items-end h-40 gap-2">
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"].map(
          (m, idx) => (
            <div key={m} className="flex flex-col items-center gap-1">
              <div
                className="w-6 bg-orange-500 rounded-t-md"
                style={{ height: `${40 + (idx % 4) * 15}px` }}
              />
              <span className="text-xs text-white mt-1">{m}</span>
            </div>
          )
        )}
      </div>
    </div>

    <div className="flex flex-col gap-3 flex-[1] min-w-[260px]">
      <div className="grid grid-cols-2 gap-3">
        <SmallStatCard label={totalLabel} value="₹ 5,00,000" />
        <SmallStatCard label={paidLabel} value="₹ 3,00,000" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SmallStatCard label={pendingLabel} value="₹ 2,00,000" />
        <SmallStatCard label={peopleLabel} value="8,000" />
      </div>
    </div>
  </div>
);

export const SmallStatCard = ({ label, value }) => (
  <div className="bg-black text-white rounded-xl px-4 py-3 text-sm">
    <p className="text-xs text-gray-300 mb-1">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

export const ListHeader = ({ title }) => (
  <div className="flex items-center justify-between mb-2">
    <h2 className="text-xl font-extrabold text-orange-500">{title}</h2>
    <div className="flex items-center gap-4 text-sm">
      <button className="flex items-center gap-1 text-gray-700">
        <span>📅</span>
        <span>Today</span>
      </button>
      <button className="text-gray-700">All Classes ▾</button>
      <button className="bg-orange-500 text-white px-4 py-2 rounded-md font-semibold">
        Edit
      </button>
    </div>
  </div>
);

export const AmountsTable = ({ rows, firstColLabel }) => {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({
    name: "",
    batch: "",
    total: "",
    paid: "",
    pending: "",
  });
  const [localRows, setLocalRows] = useState(rows);

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  const startEdit = (row) => {
    setEditingId(row.id);
    setDraft({
      name: row.name,
      batch: row.batch,
      total: row.total,
      paid: row.paid,
      pending: row.pending,
    });
  };

  const saveOrStartEdit = (row) => {
    if (editingId === row.id) {
      setLocalRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, ...draft } : r))
      );
      setEditingId(null);
    } else {
      startEdit(row);
    }
  };

  const handleChange = (field, value) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="bg-[#f9c199] rounded-t-xl overflow-hidden">
      <div className="grid grid-cols-5 gap-4 px-4 py-3 text-black font-semibold text-sm">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border border-black bg-white" />
          <span>{firstColLabel}</span>
        </div>
        <div>Batch.No</div>
        <div>Total Amount</div>
        <div>Paid</div>
        <div>Pending</div>
      </div>

      <div className="bg-white">
        {localRows.map((row) => {
          const isEditing = editingId === row.id;
          return (
            <div
              key={row.id}
              className="grid grid-cols-5 gap-4 px-4 py-3 border-t border-gray-200 text-sm items-center"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded border border-gray-400 bg-white" />
                {isEditing ? (
                  <input
                    value={draft.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="border px-2 py-1 rounded text-xs w-full"
                  />
                ) : (
                  <span>{row.name}</span>
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
                    value={draft.total}
                    onChange={(e) => handleChange("total", e.target.value)}
                    className="border px-2 py-1 rounded text-xs w-full"
                  />
                ) : (
                  row.total
                )}
              </div>

              <div>
                {isEditing ? (
                  <input
                    value={draft.paid}
                    onChange={(e) => handleChange("paid", e.target.value)}
                    className="border px-2 py-1 rounded text-xs w-full"
                  />
                ) : (
                  row.paid
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                {isEditing ? (
                  <input
                    value={draft.pending}
                    onChange={(e) => handleChange("pending", e.target.value)}
                    className="border px-2 py-1 rounded text-xs w-full mr-2"
                  />
                ) : (
                  <span>{row.pending}</span>
                )}
                <button
                  onClick={() => saveOrStartEdit(row)}
                  className="text-xs font-semibold text-orange-500 underline"
                >
                  {isEditing ? "Save" : "Edit"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
    if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-4 mb-16">
      {/* Previous */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="text-orange-500 text-2xl disabled:opacity-40"
      >
        &lt;
      </button>

      {/* Page numbers */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onPageChange(n)}
          className={
            "w-8 h-8 rounded-md border text-sm font-semibold " +
            (n === currentPage
              ? "bg-orange-500 text-white border-orange-500"
              : "bg-white text-black border-black")
          }
        >
          {n}
        </button>
      ))}

      {/* Next */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="text-orange-500 text-2xl disabled:opacity-40"
      >
        &gt;
      </button>
    </div>
  );
};
