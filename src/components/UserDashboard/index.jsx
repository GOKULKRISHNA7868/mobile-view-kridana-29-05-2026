// src/components/InstituteDashboard/InstituteDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import CheckinCheckout from "./CheckinCheckout";
import Studenttimetables from "./Student timetables";
import TrainersTimetables from "./TrainersTimetables";
import FeesDetailsPage from "./FeesDetailsPage";
import TakeAttendance from "./TakeAttendance";
import Myattendance from "./Myattendance";
import TrainerStudentAttendance from "./TrainerStudentAttendance";
import TrainerStudentsFee from "./TrainerStudentsFee";
import MyOders from "./MyOders";
import BookedDemo from "./BookedDemo";
import Payslips from "./Payslips";
import Reports from "./Reports";
import Dashboard from "./Dashboard";
import Timetables from "./Timetables";
import ChatBox from "./ChatBox";
import TrainerDashboard from "./TrainerDashboard";
import CustomerCentricPolicies from "../../pages/CustomerCentricPolicies";
import PrivacyPolicy from "../../pages/Privacy";
import ChatBoxTS from "./ChatBoxTS";
import UserMyAccount from "./UserMyAccount";
import { useSelectedStudent } from "../../context/SelectedStudentContext";
/* ============================= 
   SIDEBAR ITEMS
============================= */
const studentSidebarItems = [
  "Dashboard",
  "Time Table",
  "Chat Box",

  "Fees Details",
];

const trainerSidebarItems = [
  "CheckinCheckout",
  "Trainer's Timetables",
  "My Attendance",
  "Payslips",
  "Take Attendance",
  "Log Out",
];

const trainerStudentSidebarItems = [
  "TrainerDashboard",
  "Time Tables",
  "ChatBox",

  "Fee Details",
];

const otherUserSidebarItems = ["My Account"];
const SettingsItems = ["Customer Policy", "Privacy Policy", "Logout"];
/* ============================= 
   WELCOME SCREEN
============================= */
const WelcomeDashboard = () => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <h1 className="text-3xl font-bold text-orange-700 mb-4">
      Welcome to your Dashboard 👋
    </h1>
    <p className="text-lg text-gray-300">
      Use the menu on the left to get started.
    </p>
  </div>
);

/* ============================= 
   MAIN DASHBOARD
============================= */
const UserDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("WELCOME");
  const { user } = useAuth();
  const navigate = useNavigate();
  const idleTimer = useRef(null);

  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [familyStudents, setFamilyStudents] = useState([]);
  const { selectedStudentUid, setSelectedStudentUid } = useSelectedStudent();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletedSuccess, setShowDeletedSuccess] = useState(false);
  const [familyStudentDetails, setFamilyStudentDetails] = useState([]);
  const [selectedStudentRole, setSelectedStudentRole] = useState(null);
  /* ============================= 
     AUTO LOGOUT (5 MIN)
  ============================= */
  useEffect(() => {
    if (!user?.uid) return;

    const fetchSameEmailStudents = async () => {
      try {
        const baseUid = user.uid.split("_")[0];

        const studentSnap = await getDocs(collection(db, "students"));
        const trainerStudentSnap = await getDocs(
          collection(db, "trainerstudents"),
        );

        // 🔥 MERGE BOTH COLLECTIONS
        const allUsers = [
          ...studentSnap.docs.map((doc) => ({ uid: doc.id, ...doc.data() })),
          ...trainerStudentSnap.docs.map((doc) => ({
            uid: doc.id,
            ...doc.data(),
          })),
        ];

        // 🔥 FILTER SAME FAMILY (UID BASE)
        const matched = allUsers.filter((item) => item.uid.startsWith(baseUid));

        // 🔥 FETCH INSTITUTE NAMES
        const finalList = await Promise.all(
          matched.map(async (s) => {
            let instituteName = "";

            if (s.instituteId) {
              const instSnap = await getDoc(
                doc(db, "institutes", s.instituteId),
              );

              if (instSnap.exists()) {
                instituteName = instSnap.data().instituteName || "";
              }
            }

            return {
              uid: s.uid,
              name: `${s.firstName} ${s.lastName}${
                instituteName ? ` (${instituteName})` : ""
              }`,
            };
          }),
        );

        setFamilyStudentDetails(finalList);

        // ✅ AUTO SELECT FIRST
        if (finalList.length > 0) {
          setSelectedStudentUid(finalList[0].uid);
        }
      } catch (err) {
        console.error("Sibling fetch error:", err);
      }
    };

    fetchSameEmailStudents();
  }, [user]);
  useEffect(() => {
    const resetTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(handleLogout, 5 * 60 * 1000);
    };
    ["mousemove", "keydown", "click", "scroll"].forEach((e) =>
      window.addEventListener(e, resetTimer),
    );
    resetTimer();

    return () => {
      ["mousemove", "keydown", "click", "scroll"].forEach((e) =>
        window.removeEventListener(e, resetTimer),
      );
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  /* ============================= 
     LOGOUT
  ============================= */
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/", { replace: true });
  };

  /* ============================= 
     ROLE DETECTION
  ============================= */
  useEffect(() => {
    if (!user?.uid) return;

    const detectRole = async () => {
      setRoleLoading(true);

      const studentSnap = await getDoc(doc(db, "students", user.uid));
      if (studentSnap.exists()) {
        setRole("student");
        setRoleLoading(false);
        return;
      }

      const trainerSnap = await getDoc(doc(db, "InstituteTrainers", user.uid));
      if (trainerSnap.exists()) {
        setRole("trainer");
        setRoleLoading(false);
        return;
      }

      const trainerStudentSnap = await getDoc(
        doc(db, "trainerstudents", user.uid),
      );
      if (trainerStudentSnap.exists()) {
        setRole("trainerstudent");
        setRoleLoading(false);
        return;
      }

      const familySnap = await getDoc(doc(db, "families", user.uid));

      if (familySnap.exists()) {
        const familyData = familySnap.data();

        // If family linked to trainer
        if (familyData.trainerId) {
          setRole("trainerstudent");

          setFamilyStudents(familyData.students || []);
          setSelectedStudentUid(familyData.students?.[0] || "");

          setRoleLoading(false);
          return;
        }

        // If family linked to institute
        if (familyData.instituteId) {
          setRole("family");

          setFamilyStudents(familyData.students || []);
          setSelectedStudentUid(familyData.students?.[0] || "");

          setRoleLoading(false);
          return;
        }
      }

      setRole("other");
      setRoleLoading(false);
    };

    detectRole();
  }, [user]);

  /* ============================= 
     FETCH DATA
  ============================= */
  useEffect(() => {
    if (!user?.uid) return;

    const studentsQuery = query(
      collection(db, "students"),
      where("instituteId", "==", user.uid),
    );
    const unsubStudents = onSnapshot(studentsQuery, (snap) =>
      setStudents(snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }))),
    );

    const trainersQuery = query(
      collection(db, "InstituteTrainers"),
      where("instituteId", "==", user.uid),
    );
    const unsubTrainers = onSnapshot(trainersQuery, (snap) =>
      setTrainers(
        snap.docs.map((doc) => ({ trainerUid: doc.id, ...doc.data() })),
      ),
    );

    return () => {
      unsubStudents();
      unsubTrainers();
    };
  }, [user]);
  /* ============================= 
   DEFAULT ACTIVE MENU BASED ON ROLE
============================= */
  useEffect(() => {
    if (!familyStudents.length) return;

    const fetchStudents = async () => {
      const list = [];

      for (let uid of familyStudents) {
        let snap = await getDoc(doc(db, "students", uid));

        if (!snap.exists()) {
          snap = await getDoc(doc(db, "trainerstudents", uid));
        }

        if (snap.exists()) {
          const data = snap.data();

          let instituteName = "";

          if (data.instituteId) {
            const instSnap = await getDoc(
              doc(db, "institutes", data.instituteId),
            );

            if (instSnap.exists()) {
              instituteName = instSnap.data().instituteName || "";
            }
          }

          list.push({
            uid,
            name: `${data.firstName || ""} ${data.lastName || ""}${
              instituteName ? ` (${instituteName})` : ""
            }`,
          });
        }
      }

      setFamilyStudentDetails(list);
    };

    fetchStudents();
  }, [familyStudents]);
  useEffect(() => {
    if (!role) return;

    if (role === "student" || role === "family") setActiveMenu("Dashboard");
    else if (role === "trainerstudent") setActiveMenu("TrainerDashboard");
    else setActiveMenu("WELCOME"); // or whatever default for trainer/other
  }, [role]);
  /* ============================= 
     MAIN CONTENT RENDER
  ============================= */
  const renderMainContent = () => {
    switch (activeMenu) {
      case "Dashboard":
        return <Dashboard />;
      case "Student Timetables":
        return <Studenttimetables />;
      case "Trainer's Timetables":
        return <TrainersTimetables />;
      case "Fees Details":
        return <FeesDetailsPage />;
      case "Take Attendance":
        return <TakeAttendance />;
      case "My Attendance":
        return <Myattendance />;
      case "TrainerStudentAttendance":
        return <TrainerStudentAttendance studentUid={selectedStudentUid} />;
      case "Fee Details":
        return <TrainerStudentsFee studentUid={selectedStudentUid} />;
      case "CheckinCheckout":
        return <CheckinCheckout />;
      case "MyOders":
        return <MyOders />;
      case "Booked Demos":
        return <BookedDemo />;
      case "Payslips":
        return <Payslips />;
      case "Reports":
        return <Reports />;
      case "Time Table":
        return <Timetables />;
      case "Chat Box":
        return <ChatBox />;
      case "TrainerDashboard":
        return <TrainerDashboard />;
      case "Time Tables":
        return <TrainersTimetables />;
      case "Customer Policy":
        return <CustomerCentricPolicies />;

      case "Privacy Policy":
        return <PrivacyPolicy />;
      case "ChatBox":
        return <ChatBoxTS />;
      case "My Account":
        return <UserMyAccount />;

      default:
        return null;
    }
  };

  /* ============================= 
     SIDEBAR ITEMS BASED ON ROLE
  ============================= */
  /* ============================= 
   SIDEBAR ITEMS BASED ON ROLE
============================= */
  /* ============================= 
   EFFECTIVE ROLE BASED ON SELECTED STUDENT
============================= */
  const [effectiveRole, setEffectiveRole] = useState(role);

  useEffect(() => {
    if (!selectedStudentUid) return;

    const checkSelectedStudentRole = async () => {
      try {
        const studentSnap = await getDoc(
          doc(db, "students", selectedStudentUid),
        );
        if (studentSnap.exists()) {
          setSelectedStudentRole("student");
          return;
        }

        const trainerStudentSnap = await getDoc(
          doc(db, "trainerstudents", selectedStudentUid),
        );
        if (trainerStudentSnap.exists()) {
          setSelectedStudentRole("trainerstudent");
          return;
        }

        // fallback
        setSelectedStudentRole(null);
      } catch (err) {
        console.error("Error checking selected student role:", err);
        setSelectedStudentRole(null);
      }
    };

    checkSelectedStudentRole();
  }, [selectedStudentUid]);

  /* ============================= 
   SIDEBAR ITEMS BASED ON EFFECTIVE ROLE
============================= */
  const sidebarItems = React.useMemo(() => {
    if (selectedStudentRole === "student") return studentSidebarItems;
    if (selectedStudentRole === "trainerstudent")
      return trainerStudentSidebarItems;
    // fallback: logged-in user role
    if (role === "trainer") return trainerSidebarItems;
    return otherUserSidebarItems;
  }, [selectedStudentRole, role]);
  /* ============================= 
     LOADING SCREEN
  ============================= */
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-semibold text-orange-700">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    try {
      if (!auth.currentUser) return;

      let collectionName = "";

      if (role === "student") {
        collectionName = "students";
      } else if (role === "trainer") {
        collectionName = "InstituteTrainers";
      } else if (role === "trainerstudent") {
        collectionName = "trainerstudents";
      } else if (role === "other") {
        collectionName = "users"; // if you have
      } else {
        alert("Role not found.");
        return;
      }

      const userRef = doc(db, collectionName, auth.currentUser.uid);

      const deleteAfter = new Date();
      deleteAfter.setDate(deleteAfter.getDate() + 60);

      await updateDoc(userRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deleteAfter: deleteAfter,
      });

      setShowDeleteModal(false);
      setShowDeletedSuccess(true);

      setTimeout(async () => {
        await signOut(auth);
        navigate("/", { replace: true });
      }, 2000);
    } catch (error) {
      console.error("DELETE ERROR:", error);
      alert(error.message);
    }
  };

  /* ============================= 
     DASHBOARD UI
  ============================= */
  return (
    <div className="h-screen flex flex-col md:flex-row  overflow-hidden">
      {/* Sidebar */}
      <div className="md:hidden fixed top-13 left-0 right-0  z-[60] flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-black text-2xl"
        >
          ☰
        </button>

        <h2 className="text-orange-500 font-bold">{user?.displayName}</h2>
      </div>
      <aside
        className={`
    fixed md:static top-0 left-0 h-full w-72 bg-gray-700 p-3
    transform transition-transform duration-300 z-[100]
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
  `}
      >
        <div className="md:hidden flex justify-end mb-3">
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white text-2xl"
          >
            ✕
          </button>
        </div>
        {/* User Card */}
        <div className="bg-black rounded-xl p-4 flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-orange-400">
            <span className="text-orange-400 font-bold">
              {user?.displayName?.charAt(0) || "U"}
            </span>
          </div>
          <span className="text-orange-500 font-bold text-lg">
            {user?.displayName || "User"}
          </span>
        </div>

        {/* FAMILY STUDENT SELECTION */}
        {/* FAMILY / TRAINER FAMILY STUDENT SELECTION */}

        {(role === "family" ||
          role === "trainerstudent" ||
          role === "student") &&
          familyStudentDetails.length > 0 && (
            <div className="bg-black rounded-xl p-3 mb-3">
              <label className="block text-sm text-orange-400 font-semibold mb-1">
                Select Student:
              </label>

              <select
                value={selectedStudentUid}
                onChange={(e) => setSelectedStudentUid(e.target.value)}
                className="w-full border border-orange-400 rounded px-2 py-1 text-sm bg-gray-800 text-white"
              >
                {familyStudentDetails.map((student) => (
                  <option key={student.uid} value={student.uid}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          )}

        {/* Sidebar Items */}
        <div className="bg-black rounded-xl p-3 mb-3">
          {sidebarItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                if (item === "Log Out") return handleLogout();
                setActiveMenu(item);
                setSidebarOpen(false); // ✅ CLOSE ON MOBILE
              }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 transition-all mb-1 ${
                activeMenu === item
                  ? "text-orange-500 font-semibold bg-gray-800"
                  : "text-white hover:text-orange-400"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="bg-black rounded-xl p-4">
          <h3 className="text-white font-bold text-lg mb-3">Settings</h3>

          {SettingsItems.map((item) => (
            <button
              key={item}
              onClick={() => {
                if (item === "Logout") return handleLogout();
                setActiveMenu(item);
              }}
              className={`block w-full text-left py-2 ${
                activeMenu === item
                  ? "text-orange-500 font-semibold"
                  : "text-white hover:text-orange-400"
              }`}
            >
              {item}
            </button>
          ))}
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

      {/* Main Content */}
      <main className="flex-1 bg-white px-4 sm:px-6 md:px-10 py-6 md:py-8 overflow-y-auto h-full mt-14 md:mt-0">
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
                className="px-6 py-2 bg-red-600 text-white rounded-md"
              >
                Delete Account
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

            <h2 className="text-3xl font-semibold text-black text-center">
              Your Account has been deleted successfully
            </h2>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
