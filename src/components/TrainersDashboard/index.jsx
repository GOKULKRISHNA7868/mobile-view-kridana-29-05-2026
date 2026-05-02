import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import {
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import TrainersTable from "./TrainersTable";
import StudentsAttendancePage from "./StudentsAttendancePage";
import FeesDetailsPage from "./FeesDetailsPage";
import AddStudentDetailsPage from "./AddStudentDetailsPage";
import PaymentsPage from "./PaymentsPage";
import { Pagination } from "./shared";
import Editprofile from "./Editprofile";
import MyStudents from "./MyStudents";
import DemoClasses from "./DemoClasses";
import InstituteBookedDemos from "./InstituteBookedDemos";
import TermsAndConditions from "../../pages/Terms";
import PrivacyPolicy from "../../pages/Privacy";
import PerformanceReports from "./PerformanceReports";
import Timetable from "./Timetable";
import PaymentsSubscriptionPage from "./PaymentsSubscriptionPage";
import MyAccountPage from "./MyAccountPage";
import { db } from "../../firebase";
import ResetPassword from "./ResetPassword";
import PaidRecipet from "./PaidRecipet";
import Dashboard from "./Dashboard";
import KYC from "./KYC";

import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import Reelsdata from "./Reelsdata";
import ChatBox from "./ChatBox";
import TrainerEventsPage from "./Events/EventsPage";
import Myaccountpage from "./MyAccountPage";
import TrainerMyAccountLayout from "./MyAccount/MyAccountLayout";
import ComplaintHistory from "./ComplaintHistory";
import RegisterNumber from "./RegisterNumber";
//import Family from "./Family";
/* =============================
   🔥 NEW ROLE STATE
============================= */
import {
  FaTachometerAlt,
  FaUsers,
  FaCogs,
  FaChartBar,
  FaUserCircle,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";
import { i } from "framer-motion/client";
const TrainersDashboard = () => {
  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [view, setView] = useState("Dashboard");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [trainerType, setTrainerType] = useState("Trainer"); // NEW
  const { institute, user } = useAuth();
  const [trainerData, setTrainerData] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (title) => {
    setOpenMenu(openMenu === title ? null : title);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [seenNotifications, setSeenNotifications] = useState(() => {
    const saved = localStorage.getItem("trainerSeenNotifications");
    return saved ? JSON.parse(saved) : [];
  });
  const unreadNotifications = notifications.filter(
    (n) => !seenNotifications.includes(String(n.id)),
  );
  const markAllSeen = () => {
    const ids = notifications.map((n) => String(n.id));

    const updatedSeen = [...new Set([...seenNotifications, ...ids])];

    setSeenNotifications(updatedSeen);

    localStorage.setItem(
      "trainerSeenNotifications",
      JSON.stringify(updatedSeen),
    );
  };
  const studentLabel = trainerType === "Therapist" ? "Patients" : "Students";
  const trainerLabel = trainerType === "Therapist" ? "Therapist" : "Trainer";

  const sidebarSections = [
    {
      title: "Main",
      icon: "dashboard",
      items: [{ label: "Dashboard", value: "Dashboard" }],
    },
    {
      title: "Customers",
      icon: "customers",
      items: [
        { label: "Customers Attendance", value: "Customers Attendance" },
        { label: "Customer Details", value: "Customer Details" },
        //{ label: "Family Details", value: "Family Details" },
        //{ label: "RegisterNumber", value: "RegisterNumber" },
        { label: "PaidReceipt", value: "PaidReceipt" },
        { label: "Fees Details", value: "Fees Details" },
        { label: "Performance Reports", value: "Performance Reports" },
      ],
    },
    {
      title: "Operations",
      icon: "operations",
      items: [
        { label: "Time Table", value: "Time Table" },
        { label: "Add Events", value: "Add Events" },
        { label: "Chat Box", value: "Chat Box" },
      ],
    },
    {
      title: "Analytics",
      icon: "analytics",
      items: [{ label: "Analytics", value: "Analytics" }],
    },
    {
      title: "Account",
      icon: "account",
      items: [
        {
          label: "Customer & Management Settings",
          value: "Customer & Management Settings",
        },
        { label: "My Account", value: "My Account" },
        { label: "Complete KYC", value: "Complete KYC" },

        { label: "Payment & Subscription", value: "Payment & Subscription" },
      ],
    },
  ];
  const getIcon = (icon) => {
    switch (icon) {
      case "dashboard":
        return <FaTachometerAlt />;
      case "customers":
        return <FaUsers />;
      case "operations":
        return <FaCogs />;
      case "analytics":
        return <FaChartBar />;
      case "account":
        return <FaUserCircle />;
      default:
        return null;
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletedSuccess, setShowDeletedSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /* =============================
     🔥 FETCH TRAINER TYPE
  ============================= */
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(true);
    }
  }, []);
  useEffect(() => {
    const fetchTrainerType = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const q = query(
          collection(db, "trainers"),
          where("__name__", "==", user.uid),
        );

        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setTrainerType(data.trainerType || "Trainer");
        }
      } catch (err) {
        console.error("Error fetching trainer type:", err);
      }
    };

    fetchTrainerType();
  }, []);
  useEffect(() => {
    const q = query(collection(db, "helpcenter"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => b.reportedOn?.seconds - a.reportedOn?.seconds);

      setNotifications(data);
    });

    return () => unsub();
  }, []);

  /* =============================
   🔥 FETCH STUDENTS
============================= */
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(
          collection(db, "trainerstudents"),
          where("trainerUID", "==", user.uid),
        );

        const snap = await getDocs(q);

        const studentsData = snap.docs.map((doc) => ({
          id: doc.id,
          name: `${doc.data().firstName || ""} ${doc.data().lastName || ""}`,
          batch: doc.data().category || "N/A",
          phone: doc.data().phoneNumber || "N/A",
          createdAt: doc.data().createdAt || null,
        }));

        setTrainers(studentsData);
      } catch (error) {
        console.error("Error fetching trainer students:", error);
      }
    };

    fetchStudents();
  }, []);
  useEffect(() => {
    const fetchTrainerData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, "trainers", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setTrainerData(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching trainer data:", err);
      }
    };

    fetchTrainerData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDate]);

  const isSameDay = (firestoreDate, selectedDate) => {
    if (!selectedDate) return true;
    if (!firestoreDate) return false;

    let d1;

    if (firestoreDate.seconds) {
      d1 = new Date(firestoreDate.seconds * 1000);
    } else if (firestoreDate instanceof Date) {
      d1 = firestoreDate;
    } else {
      return false;
    }

    const d2 = new Date(selectedDate);

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const filteredTrainers = useMemo(() => {
    return trainers.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
      const matchesDate = isSameDay(t.createdAt, selectedDate);

      return matchesSearch && matchesDate;
    });
  }, [trainers, search, selectedDate]);

  const totalPages = Math.ceil(filteredTrainers.length / itemsPerPage);

  const paginatedTrainers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTrainers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTrainers, currentPage]);

  const handleMenuClick = (item) => {
    setActiveMenu(item);
    setSidebarOpen(false);
    if (item === "Home") return setView("trainersData");

    if (item === "Customers Attendance") return setView("studentsAttendance");

    if (item === "Customer Details") return setView("addStudent");

    if (item === "Performance Reports") return setView("performance");

    if (item === "Fees Details") return setView("feesDetails");

    if (item === "Time Table") return setView("timetable");

    if (item === "Add Events") return setView("events");

    if (item === "Analytics") return setView("analytics");

    if (item === "Chat Box") return setView("chatBox");

    if (item === "My Account") return setView("myAccount");
    if (item === "Complete KYC") return setView("KYC");
    if (item === "Dashboard") return setView("Dashboard");
    if (item === "Customer & Management Settings")
      return setView("CustomerManagementSettings");
    //if (item === "Family Details") return setView("Family");
    if (item === "RegisterNumber") return setView("RegisterNumber");
    if (item === "PaidReceipt") return setView("PaidReceipt");
    if (item === "Payment & Subscription")
      return setView("PaymentsSubscriptionPage");
    if (item === "terms") return setView("terms");
    if (item === "privacy") return setView("privacy");
    if (item === "ResetPassword") return setView("ResetPassword");

    setView("notConnected");
  };

  const handleDeleteStudent = async (id) => {
    try {
      await deleteDoc(doc(db, "trainerstudents", id));
      setTrainers((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Error deleting student:", err);
    }
  };
  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);

      const trainerRef = doc(db, "trainers", auth.currentUser.uid);

      const deleteAfter = new Date();
      deleteAfter.setDate(deleteAfter.getDate() + 60);

      await updateDoc(trainerRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deleteAfter: deleteAfter,
      });

      setShowDeleteModal(false);
      setShowDeletedSuccess(true);

      setTimeout(async () => {
        await signOut(auth);
        navigate("/");
      }, 2000);
    } catch (error) {
      console.log(error);
      alert("Something went wrong.");
    } finally {
      setDeleting(false);
    }
  };
  const renderMainContent = () => {
    if (view === "MyStudents") return <MyStudents />;
    if (view === "Editprofile") return <Editprofile />;
    if (view === "studentsAttendance") return <StudentsAttendancePage />;
    if (view === "feesDetails") return <FeesDetailsPage />;
    if (view === "addStudent") return <AddStudentDetailsPage />;
    if (view === "paymentDetails") return <PaymentsPage />;
    if (view === "demoClasses") return <DemoClasses />;
    if (view === "bookedDemos") return <InstituteBookedDemos />;
    if (view === "terms") return <TermsAndConditions />;
    if (view === "privacy") return <PrivacyPolicy />;
    if (view === "ResetPassword") return <ResetPassword />;
    if (view === "performance") return <PerformanceReports />;
    if (view === "analytics") return <Reelsdata />;
    if (view === "myAccount") return <TrainerMyAccountLayout />;
    if (view === "KYC") return <KYC />;
    if (view === "Dashboard") return <Dashboard />;
    if (view === "chatBox") return <ChatBox />;
    if (view === "timetable") return <Timetable />;
    if (view === "events")
      return <TrainerEventsPage setActiveMenu={handleMenuClick} />;
    if (view === "CustomerManagementSettings")
      return <MyAccountPage setActiveMenu={handleMenuClick} />;
    //if (view === "Family") return <Family />;
    if (view === "RegisterNumber") return <RegisterNumber />;
    if (view === "PaidReceipt") return <PaidRecipet />;
    if (view === "complaintHistory")
      return (
        <ComplaintHistory
          ticketId={selectedTicket}
          setView={setView} // ✅ ADD THIS
        />
      );
    if (view === "PaymentsSubscriptionPage")
      return <PaymentsSubscriptionPage />;
    if (view === "notConnected") {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <h1 className="text-3xl font-bold text-orange-500 mb-3">
              🚧 Page Not Connected
            </h1>
            <p className="text-gray-500">
              This section is not implemented yet.
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center mb-4 w-full"></div>

        <h1 className="text-3xl font-extrabold text-orange-500 mb-4">
          {trainerLabel}s Data
        </h1>

        <TrainersTable
          rows={paginatedTrainers}
          onDelete={handleDeleteStudent}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </>
    );
  };

  return (
    <div className="h-screen flex bg-gray-700 overflow-hidden relative">
      {/* Mobile Header */}
      <div
        className="
    lg:hidden
    fixed top-0 left-0 right-0
    z-[999]
    flex items-center justify-between
    px-4 py-3
    bg-gray-900
    border-b border-gray-800
    shadow-lg
    backdrop-blur-md
  "
      >
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-white text-2xl"
        >
          ☰
        </button>

        <span className="text-orange-500 font-bold">
          {institute?.instituteName}
        </span>
      </div>
      <aside
        className={`
    fixed lg:static top-0 left-0 h-full w-72 sm:w-80 bg-gray-900 p-4 overflow-y-auto
    transform transition-transform duration-300 z-[100] shadow-xl
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0
  `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden flex justify-end mb-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white text-2xl"
          >
            ✕
          </button>
        </div>
        {/* ===== INSTITUTE CARD ===== */}
        <div className="bg-black rounded-xl px-4 py-3 flex items-center gap-4 mb-3">
          {/* PROFILE IMAGE */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-orange-400 shadow-md">
              {trainerData?.profileImageUrl ? (
                <img
                  src={trainerData.profileImageUrl}
                  alt="profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <span className="text-orange-400 font-bold text-lg sm:text-xl">
                    {trainerData?.instituteName?.charAt(0)?.toUpperCase() ||
                      "I"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* INSTITUTE NAME */}
          <div className="flex-1 min-w-0">
            <h2 className="text-orange-500 font-bold text-base sm:text-lg md:text-xl break-words leading-snug">
              {trainerData?.firstName || "Institute Name"}
            </h2>
          </div>
        </div>

        {/* ===== MENU CARD ===== */}
        <div className="bg-black rounded-xl p-3 mb-3 space-y-2">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              {/* SECTION HEADER */}
              <button
                onClick={() => toggleMenu(section.title)}
                className="w-full flex items-center justify-between px-4 py-2 text-white hover:bg-gray-800 rounded-lg transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-orange-400">
                    {getIcon(section.icon)}
                  </span>
                  <span className="font-medium">{section.title}</span>
                </div>

                {section.items.length > 0 &&
                  (openMenu === section.title ? (
                    <FaChevronDown size={12} />
                  ) : (
                    <FaChevronRight size={12} />
                  ))}
              </button>

              {/* DROPDOWN ITEMS */}
              {openMenu === section.title && (
                <div className="ml-8 mt-1 space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => handleMenuClick(item.value)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm transition
                ${
                  activeMenu === item.value
                    ? "bg-gray-800 text-orange-500 font-semibold"
                    : "text-gray-300 hover:text-orange-400 hover:bg-gray-800"
                }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ===== SETTINGS CARD ===== */}
        <div className="bg-black rounded-xl p-4">
          <h3 className="text-white font-bold text-lg mb-3">Settings</h3>

          <button
            onClick={() => handleMenuClick("terms")}
            className={`block w-full text-left py-2 ${
              activeMenu === "Terms & Conditions"
                ? "text-orange-500 font-semibold"
                : "text-white hover:text-orange-400"
            }`}
          >
            Terms & Conditions
          </button>

          <button
            onClick={() => handleMenuClick("privacy")}
            className={`block w-full text-left py-2 ${
              activeMenu === "Privacy Policy"
                ? "text-orange-500 font-semibold"
                : "text-white hover:text-orange-400"
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => handleMenuClick("ResetPassword")}
            className={`block w-full text-left py-2 ${
              activeMenu === "ResetPassword"
                ? "text-orange-500 font-semibold"
                : "text-white hover:text-orange-400"
            }`}
          >
            Reset Password
          </button>
          <button
            onClick={() => signOut(auth)}
            className="block w-full text-left py-2 text-white hover:text-red-400"
          >
            Logout
          </button>
        </div>
        <div className="bg-black rounded-xl p-4 mt-3">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full text-left text-red-500 hover:text-red-400 font-semibold flex items-center gap-2"
          >
            <img src="/delete-icon.png" alt="delete" className="w-5 h-5" />
            <span>Delete Account</span>
          </button>
        </div>
      </aside>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-[50] lg:hidden"
        />
      )}

      <main className="flex-1 bg-white px-4 sm:px-6 md:px-8 lg:px-10 py-8 overflow-y-auto h-full mt-14 lg:mt-0">
        {renderMainContent()}
      </main>
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white w-[600px] rounded-lg p-8 relative text-center">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-2xl"
            >
              ✕
            </button>

            <h2 className="text-3xl font-bold text-red-600 mb-4">
              Delete Account ?
            </h2>

            <p className="text-gray-600 mb-2">
              Are you sure you want delete your account ?
            </p>

            <p className="text-gray-500 mb-2">
              This action cannot be undone and all your data will be permanently
              removed after 60 days
            </p>

            <p className="text-green-600 mb-6 font-medium">
              You can re-activate your account within 60 days
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2 bg-gray-300 rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-6 py-2 bg-red-600 text-white rounded-md"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeletedSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white w-[900px] h-[500px] rounded-lg relative flex flex-col items-center justify-center">
            <button
              onClick={() => {
                setShowDeletedSuccess(false);
                navigate("/");
              }}
              className="absolute top-6 right-6 text-3xl"
            >
              ✕
            </button>

            {/* ✅ Success Image */}
            <img
              src="/delete-success.png"
              alt="Account Deleted"
              className="w-64 mb-8 object-contain"
            />

            <h2 className="text-3xl font-semibold text-black text-center">
              Your Account has been deleted successfully
            </h2>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainersDashboard;
