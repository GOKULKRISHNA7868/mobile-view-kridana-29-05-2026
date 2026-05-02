import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";

import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function StudentTimetable() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [is24Hour, setIs24Hour] = useState(false);
  const [search, setSearch] = useState("");

  const calendarRef = useRef(null);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const studentId = user.uid;

      try {
        const studentSnap = await getDocs(collection(db, "students"));

        let instituteId = "";

        studentSnap.forEach((doc) => {
          if (doc.id === studentId) {
            instituteId = doc.data().instituteId;
          }
        });

        if (!instituteId) {
          setLoading(false);
          return;
        }

        const timetableSnap = await getDocs(
          collection(db, "institutes", instituteId, "timetable"),
        );

        const filtered = timetableSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) => item.students?.includes(studentId));

        const formatted = filtered.map((s) => ({
          id: s.id,
          title: `${s.title} • ${s.trainerName}`,
          start: s.start?.toDate ? s.start.toDate() : s.start,
          end: s.end?.toDate ? s.end.toDate() : s.end,
          extendedProps: {
            session: s.session,
          },
        }));

        setEvents(formatted);
      } catch (err) {
        console.error(err);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ---------------- FORMAT ---------------- */
  const formatTime = (date) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !is24Hour,
    }).format(date);
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  /* ---------------- SEARCH ---------------- */
  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()),
  );

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600 mb-3"></div>
        Loading timetable...
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-3 sm:p-4 rounded-xl min-h-screen">
      {/* -------- HEADER -------- */}
      <h2 className="text-lg sm:text-xl font-semibold mb-3 text-center">
        📅 My Class Schedule
      </h2>

      {/* -------- TOP BAR -------- */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        {/* LEFT */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="border px-3 py-1 rounded-md bg-white text-sm"
            onChange={(e) =>
              calendarRef.current.getApi().changeView(e.target.value)
            }
          >
            <option value="timeGridDay">Day</option>
            <option value="timeGridWeek">Week</option>
            <option value="dayGridMonth">Month</option>
            <option value="listWeek">List</option>
          </select>

          {/* 12 / 24 TOGGLE */}
          <div className="flex border rounded-md overflow-hidden text-sm">
            <button
              onClick={() => setIs24Hour(false)}
              className={`px-3 py-1 ${
                !is24Hour ? "bg-orange-500 text-white" : "bg-white"
              }`}
            >
              12 hrs
            </button>
            <button
              onClick={() => setIs24Hour(true)}
              className={`px-3 py-1 ${
                is24Hour ? "bg-orange-500 text-white" : "bg-white"
              }`}
            >
              24 hrs
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <input
          type="text"
          placeholder="Search classes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-md w-full sm:w-56 text-sm"
        />
      </div>

      {/* -------- CALENDAR -------- */}
      <div className="bg-white p-2 sm:p-3 rounded-xl border border-orange-300 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView="timeGridWeek"
          headerToolbar={false}
          allDaySlot={false}
          height="auto"
          events={filteredEvents}
          expandRows={true}
          stickyHeaderDates={true}
          dayMaxEvents={true}
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: !is24Hour,
          }}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: !is24Hour,
          }}
          eventClick={(info) => {
            setSelectedEvent({
              title: info.event.title,
              start: info.event.start,
              end: info.event.end,
              session: info.event.extendedProps.session,
            });
          }}
          eventContent={(info) => (
            <div className="bg-orange-200 rounded-md px-2 py-1 text-[11px] sm:text-xs leading-tight overflow-hidden">
              <div className="font-semibold truncate">{info.event.title}</div>
            </div>
          )}
        />
      </div>

      {/* EMPTY STATE */}
      {events.length === 0 && (
        <div className="text-center text-gray-400 mt-6">
          No classes scheduled yet
        </div>
      )}

      {/* ---------- MODAL ---------- */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-3">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-center">
              📘 Class Details
            </h3>

            <div className="space-y-2 text-sm">
              <p>
                <b>📌 Class:</b> {selectedEvent.title}
              </p>
              <p>
                <b>📅 Date:</b> {formatDate(selectedEvent.start)}
              </p>
              <p>
                <b>🕒 Time:</b> {formatTime(selectedEvent.start)} -{" "}
                {formatTime(selectedEvent.end)}
              </p>
              <p>
                <b>📘 Session:</b> {selectedEvent.session || "N/A"}
              </p>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full bg-gray-200 dark:bg-gray-700 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
