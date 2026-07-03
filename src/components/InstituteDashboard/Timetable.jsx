import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc } from "firebase/firestore";
export default function ClassTime() {
  const [instituteId, setInstituteId] = useState("");
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [categoriesMap, setCategoriesMap] = useState({});
  const calendarRef = React.useRef(null);
  const [is24Hour, setIs24Hour] = useState(false);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const categories = [
    "Martial Arts",
    "Team Ball Sports",
    "Racket Sports",
    "Fitness",
    "Target & Precision Sports",
    "Equestrian Sports",
    "Adventure & Outdoor Sports",
    "Ice Sports",
    "Aquatic Sports",
    "Wellness",
    "Dance",
  ];

  const subCategoryMap = {
    "Martial Arts": [
      "Karate",
      "Kung Fu",
      "Krav Maga",
      "Muay Thai",
      "Taekwondo",
      "Judo",
      "Brazilian Jiu-Jitsu",
      "Aikido",
      "Jeet Kune Do",
      "Capoeira",
      "Sambo",
      "Silat",
      "Kalaripayattu",
      "Hapkido",
      "Wing Chun",
      "Shaolin",
      "Ninjutsu",
      "Kickboxing",
      "Boxing",
      "Wrestling",
      "Shorinji Kempo",
      "Kyokushin",
      "Goju-ryu",
      "Shotokan",
      "Wushu",
      "Savate",
      "Lethwei",
      "Bajiquan",
      "Hung Gar",
      "Praying Mantis Kung Fu",
    ],
    "Team Ball Sports": [
      "Football / Soccer",
      "Basketball",
      "Handball",
      "Rugby",
      "Futsal",
      "Field Hockey",
      "Lacrosse",
      "Gaelic Football",
      "Volleyball",
      "Beach Volleyball",
      "Sepak Takraw",
      "Roundnet (Spikeball)",
      "Netball",
      "Cricket",
      "Baseball",
      "Softball",
      "Wheelchair Rugby",
      "Dodgeball",
      "Korfball",
    ],
    "Racket Sports": [
      "Tennis",
      "Table Tennis",
      "Badminton",
      "Squash",
      "Racquetball",
      "Padel",
      "Pickleball",
      "Platform Tennis",
      "Real Tennis",
      "Soft Tennis",
      "Frontenis",
      "Speedminton (Crossminton)",
      "Paddle Tennis (POP Tennis)",
      "Speed-ball",
      "Chaza",
      "Totem Tennis (Swingball)",
      "Matkot",
      "Jombola",
    ],
    Fitness: [
      "Gym Workout",
      "Weight Training",
      "Bodybuilding",
      "Powerlifting",
      "CrossFit",
      "Calisthenics",
      "Circuit Training",
      "HIIT",
      "Functional Training",
      "Core Training",
      "Mobility Training",
      "Stretching",
      "Resistance Band Training",
      "Kettlebell Training",
      "Boot Camp Training",
      "Spinning",
      "Step Fitness",
      "Pilates",
      "Yoga",
    ],
    "Target & Precision Sports": [
      "Archery",
      "Golf",
      "Bowling",
      "Darts",
      "Snooker",
      "Pool",
      "Billiards",
      "Target Shooting",
      "Clay Pigeon Shooting",
      "Air Rifle Shooting",
      "Air Pistol Shooting",
      "Croquet",
      "Petanque",
      "Bocce",
      "Lawn Bowls",
      "Carom Billiards",
      "Nine-Pin Bowling",
      "Disc Golf",
      "Kubb",
      "Pitch and Putt",
      "Shove Ha’penny",
      "Toad in the Hole",
      "Bat and Trap",
      "Boccia",
      "Gateball",
    ],
    "Equestrian Sports": [
      "Horse Racing",
      "Barrel Racing",
      "Rodeo",
      "Mounted Archery",
      "Tent Pegging",
    ],
    "Adventure & Outdoor Sports": [
      "Rock Climbing",
      "Mountaineering",
      "Trekking",
      "Hiking",
      "Mountain Biking",
      "Sandboarding",
      "Orienteering",
      "Obstacle Course Racing",
      "Skydiving",
      "Paragliding",
      "Hang Gliding",
      "Parachuting",
      "Hot-air Ballooning",
      "Skiing",
      "Snowboarding",
      "Ice Climbing",
      "Heli-skiing",
      "Bungee Jumping",
      "BASE Jumping",
      "Canyoning",
      "Kite Buggy",
      "Zorbing",
      "Zip Lining",
    ],
    "Aquatic Sports": [
      "Swimming",
      "Water Polo",
      "Surfing",
      "Scuba Diving",
      "Snorkeling",
      "Freediving",
      "Kayaking",
      "Canoeing",
      "Rowing",
      "Sailing",
      "Windsurfing",
      "Kite Surfing",
      "Jet Skiing",
      "Wakeboarding",
      "Water Skiing",
      "Stand-up Paddleboarding",
      "Whitewater Rafting",
      "Dragon Boat Racing",
      "Artistic Swimming",
      "Open Water Swimming",
    ],
    "Ice Sports": [
      "Ice Skating",
      "Figure Skating",
      "Ice Hockey",
      "Speed Skating",
      "Ice Dance",
      "Synchronized Skating",
      "Curling",
      "Broomball",
      "Bobsleigh",
      "Skiboarding",
      "Ice Dragon Boat Racing",
      "Ice Cross Downhill",
    ],
    Wellness: [
      "Yoga & Meditation",
      "Spa & Relaxation",
      "Mental Wellness",
      "Fitness",
      "Nutrition",
      "Traditional & Alternative Therapies",
      "Rehabilitation",
      "Lifestyle Coaching",
    ],
    Dance: [
      "Bharatanatyam",
      "Kathak",
      "Kathakali",
      "Kuchipudi",
      "Odissi",
      "Mohiniyattam",
      "Manipuri",
      "Sattriya",
      "Chhau",
      "Yakshagana",
      "Lavani",
      "Ghoomar",
      "Kalbelia",
      "Garba",
      "Dandiya Raas",
      "Bhangra",
      "Bihu",
      "Dollu Kunitha",
      "Theyyam",
      "Ballet",
      "Contemporary",
      "Hip Hop",
      "Breakdance",
      "Jazz Dance",
      "Tap Dance",
      "Modern Dance",
      "Street Dance",
      "House Dance",
      "Locking",
      "Popping",
      "Krumping",
      "Waacking",
      "Voguing",
      "Salsa",
      "Bachata",
      "Merengue",
      "Cha-Cha",
      "Rumba",
      "Samba",
      "Paso Doble",
      "Jive",
      "Tango",
      "Waltz",
      "Foxtrot",
      "Quickstep",
      "Flamenco",
      "Irish Stepdance",
      "Scottish Highland Dance",
      "Morris Dance",
      "Hula",
      "Maori Haka",
      "African Tribal Dance",
      "Zumba",
      "K-Pop Dance",
      "Shuffle Dance",
      "Electro Dance",
      "Pole Dance",
      "Ballroom Dance",
      "Line Dance",
      "Square Dance",
      "Folk Dance",
      "Contra Dance",
    ],
  };
  const [form, setForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    category: "",
    subCategory: "",
    branch: "",
    trainerId: "",
    students: [],
  });
  const isEdit = !!editId;
  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setInstituteId(user.uid);
    });
    return () => unsub();
  }, []);

  /* ---------------- LOAD DATA ---------------- */
  useEffect(() => {
    if (!instituteId) return;

    const loadData = async () => {
      try {
        /* ---------------- TRAINERS ---------------- */
        const trainerSnap = await getDocs(
          query(
            collection(db, "InstituteTrainers"),
            where("instituteId", "==", instituteId),
          ),
        );

        setTrainers(trainerSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        /* ---------------- INSTITUTE (CATEGORIES) ---------------- */
        const instituteDoc = await getDoc(doc(db, "institutes", instituteId));

        const instituteData = instituteDoc.data();

        /* ---------------- STUDENTS ---------------- */
        const studentSnap = await getDocs(
          query(
            collection(db, "students"),
            where("instituteId", "==", instituteId),
          ),
        );

        const studentList = studentSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setStudents(studentList);

        /* ---------------- BRANCHES (FIXED) ---------------- */
        const branchSet = new Set();

        studentList.forEach((s) => {
          if (s.branch && s.branch.trim() !== "") {
            branchSet.add(s.branch.trim());
          }
        });

        setBranches([...branchSet]);

        console.log("Students:", studentList);
        console.log("Branches:", [...branchSet]);

        /* ---------------- TIMETABLE ---------------- */
        const timetableSnap = await getDocs(
          collection(db, "institutes", instituteId, "timetable"),
        );

        setSchedule(
          timetableSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })),
        );
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };

    loadData();
  }, [instituteId]);
  const filteredStudents = students.filter((s) => s.branch === form.branch);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  /* ---------------- SAVE ---------------- */
  const saveClass = async () => {
    if (
      !form.category ||
      !form.subCategory ||
      !form.branch ||
      !form.trainerId ||
      form.students.length === 0
    ) {
      if (!form.category) {
        alert("Select Category");
        return;
      }

      if (!form.subCategory) {
        alert("Select Sub Category");
        return;
      }

      if (!form.branch) {
        alert("Select Branch");
        return;
      }

      if (!form.trainerId) {
        alert("Select Trainer");
        return;
      }

      if (!form.students || form.students.length === 0) {
        alert("No students found in selected branch");
        return;
      }
      return;
    }

    const trainer = trainers.find((t) => t.id === form.trainerId);

    const startDateTime = new Date(`${form.date}T${form.startTime}`);
    const endDateTime = new Date(`${form.date}T${form.endTime}`);

    const payload = {
      title: form.subCategory,
      category: form.category,
      subCategory: form.subCategory,
      branch: form.branch,
      start: startDateTime,
      end: endDateTime,
      trainerId: trainer.id,
      trainerName: trainer.firstName,
      students: form.students,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editId) {
        // 🔥 UPDATE
        await updateDoc(
          doc(db, "institutes", instituteId, "timetable", editId),
          payload,
        );

        // ✅ update state locally
        setSchedule((prev) =>
          prev.map((item) =>
            item.id === editId ? { ...item, ...payload } : item,
          ),
        );
      } else {
        // 🔥 ADD
        const docRef = await addDoc(
          collection(db, "institutes", instituteId, "timetable"),
          {
            ...payload,
            createdAt: serverTimestamp(),
          },
        );

        // ✅ add to state locally
        setSchedule((prev) => [...prev, { id: docRef.id, ...payload }]);
      }

      // ✅ close modal & reset
      setShowModal(false);
      setEditId(null);
    } catch (err) {
      console.error("Save error:", err);
    }
  };
  useEffect(() => {
    if (form.branch && students.length > 0 && !editId) {
      const autoStudents = students
        .filter(
          (s) =>
            s.branch?.trim().toLowerCase() ===
            form.branch?.trim().toLowerCase(),
        )
        .map((s) => s.id);

      console.log("Selected Branch:", form.branch);
      console.log("Matched Students:", autoStudents);

      setForm((prev) => ({
        ...prev,
        students: autoStudents,
      }));
    }
  }, [form.branch, students, editId]);
  /* ---------------- FORMAT EVENTS ---------------- */
  const events = schedule.map((s) => ({
    id: s.id,
    title: s.cancelled ? `❌ Cancelled - ${s.subCategory}` : s.subCategory,
    start: s.start?.toDate ? s.start.toDate() : s.start,
    end: s.end?.toDate ? s.end.toDate() : s.end,

    extendedProps: {
      trainer: s.trainerName,
      count: s.students?.length || 0,
      cancelled: s.cancelled || false,
      cancelReason: s.cancelReason || "",
    },
  }));
  const filteredEvents = events.filter((e) =>
    e.title?.toLowerCase().includes(search.toLowerCase()),
  );
  const cancelClass = async () => {
    if (!editId) return;

    if (!cancelReason.trim()) {
      alert("Please enter cancellation reason");
      return;
    }

    try {
      await updateDoc(doc(db, "institutes", instituteId, "timetable", editId), {
        cancelled: true,
        cancelReason: cancelReason,
        cancelledAt: serverTimestamp(),
      });

      setSchedule((prev) =>
        prev.map((item) =>
          item.id === editId
            ? {
                ...item,
                cancelled: true,
                cancelReason,
              }
            : item,
        ),
      );

      setShowCancelModal(false);
      setCancelReason("");
      setShowModal(false);

      alert("Class cancelled successfully");
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <div className="bg-gray-100 p-3 sm:p-4 rounded-xl min-h-screen">
      {/* -------- TOP BAR -------- */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
        {/* LEFT */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="border px-3 py-2 rounded-md bg-white text-sm w-full sm:w-auto"
            onChange={(e) => {
              const view = e.target.value;
              calendarRef.current.getApi().changeView(view);
            }}
          >
            <option value="timeGridDay">Day</option>
            <option value="timeGridWeek">Week</option>
            <option value="dayGridMonth">Month</option>
            <option value="listWeek">List</option>
          </select>

          {/* TIME FORMAT */}
          <div className="flex border rounded-md overflow-hidden text-sm w-full sm:w-auto">
            <button
              onClick={() => setIs24Hour(false)}
              className={`flex-1 sm:flex-none px-3 py-2 ${
                !is24Hour ? "bg-orange-500 text-white" : "bg-white"
              }`}
            >
              12 hrs
            </button>
            <button
              onClick={() => setIs24Hour(true)}
              className={`flex-1 sm:flex-none px-3 py-2 ${
                is24Hour ? "bg-orange-500 text-white" : "bg-white"
              }`}
            >
              24 hrs
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search here..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-md w-full sm:w-56 text-sm"
          />

          <button
            onClick={() => setShowModal(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-md text-sm w-full sm:w-auto"
          >
            + Add New
          </button>
        </div>
      </div>

      {/* -------- CALENDAR -------- */}
      <div className="bg-white p-1 sm:p-3 rounded-xl border border-orange-300 overflow-hidden touch-manipulation">
        <FullCalendar
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            listPlugin,
          ]}
          selectable={true}
          selectMirror={true}
          /* 👇 MOBILE FIX */
          longPressDelay={100}
          selectLongPressDelay={100}
          eventLongPressDelay={100}
          /* 👇 IMPORTANT */
          selectOverlap={false}
          initialView="timeGridDay"
          headerToolbar={false}
          slotMinTime="09:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          height="auto"
          events={filteredEvents}
          selectable={true}
          /* ✅ RESPONSIVE FIX */
          expandRows={true}
          slotMinWidth={36}
          dayMaxEventRows={2}
          stickyHeaderDates={true}
          dayHeaderFormat={{
            weekday: "short",
            month: "numeric",
            day: "numeric",
          }}
          slotLabelInterval="01:00"
          dayMaxEvents={true}
          /* TIME FORMAT */
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
          /* SELECT */
          select={(info) => {
            const date = info.startStr.split("T")[0];
            const start = info.startStr.split("T")[1]?.slice(0, 5);
            const end = info.endStr.split("T")[1]?.slice(0, 5);

            setEditId(null);

            setForm({
              date,
              startTime: start,
              endTime: end,
              category: "",
              subCategory: "",
              branch: "",
              trainerId: "",
              students: [],
            });

            setShowModal(true);
          }}
          /* CLICK */
          eventClick={(info) => {
            const event = schedule.find((s) => s.id === info.event.id);

            setEditId(event.id);

            setForm({
              date: info.event.startStr.split("T")[0],
              startTime: info.event.startStr.split("T")[1]?.slice(0, 5),
              endTime: info.event.endStr.split("T")[1]?.slice(0, 5),
              category: event.category || "",
              subCategory: event.subCategory || "",
              branch: event.branch || "",
              trainerId: event.trainerId || "",
              students: event.students || [],
            });

            setShowModal(true);
          }}
          /* EVENT UI */
          eventContent={(info) => (
            <div
              className={`rounded-md px-2 py-1 text-xs
      ${
        info.event.extendedProps.cancelled
          ? "bg-red-200 text-red-800"
          : "bg-orange-200"
      }
    `}
            >
              <div className="font-semibold">{info.event.title}</div>

              <div>👤 {info.event.extendedProps.trainer}</div>

              <div>👥 {info.event.extendedProps.count}</div>

              {info.event.extendedProps.cancelled && (
                <div className="mt-1 text-[10px] font-medium">
                  Reason: {info.event.extendedProps.cancelReason}
                </div>
              )}
            </div>
          )}
        />
      </div>

      {/* ---------- MODAL ---------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-3">
          <div className="bg-white p-4 sm:p-6 rounded-2xl w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-center">
              {isEdit ? "✏️ Edit Class" : "📅 Schedule Class"}
            </h3>

            {/* DATE */}
            <div>
              <label className="text-sm text-gray-500">Date</label>
              <input
                type="date"
                className="w-full border rounded-lg p-2 mt-1"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            {/* TIME */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                className="border p-2 rounded-md w-full"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
              />
              <input
                type="time"
                className="border p-2 rounded-md w-full"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>

            {/* CATEGORY */}
            <select
              className="w-full border p-2 rounded-md"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                  subCategory: "",
                })
              }
            >
              <option>Select Category</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            {/* SUBCATEGORY */}
            <select
              className="w-full border p-2 rounded-md"
              value={form.subCategory}
              onChange={(e) =>
                setForm({
                  ...form,
                  subCategory: e.target.value,
                })
              }
            >
              <option>Select SubCategory</option>
              {(subCategoryMap[form.category] || []).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            {/* BRANCH */}
            <select
              className="w-full border p-2 rounded-md"
              value={form.branch}
              onChange={(e) =>
                setForm({
                  ...form,
                  branch: e.target.value,
                })
              }
            >
              <option>Select Branch</option>
              {branches.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>

            {/* TRAINER */}
            <select
              className="w-full border p-2 rounded-md"
              value={form.trainerId}
              onChange={(e) =>
                setForm({
                  ...form,
                  trainerId: e.target.value,
                })
              }
            >
              <option>Select Trainer</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName}
                </option>
              ))}
            </select>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {editId && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-lg"
                >
                  Cancel Class
                </button>
              )}
              <button
                onClick={saveClass}
                className="flex-1 bg-orange-500 text-white py-2 rounded-lg"
              >
                {editId ? "Update" : "Save"}
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
          <div className="bg-white p-5 rounded-xl w-[350px]">
            <h3 className="font-semibold mb-3">Cancel Class</h3>

            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              className="w-full border rounded-lg p-3 h-28"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="border px-4 py-2 rounded-lg"
              >
                Close
              </button>

              <button
                onClick={cancelClass}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Save Reason
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
