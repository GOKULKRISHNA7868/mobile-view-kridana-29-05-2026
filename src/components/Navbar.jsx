import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
  setDoc, // ✅ ADD THIS
  arrayUnion,
  updateDoc,
} from "firebase/firestore";
import { useLocation } from "react-router-dom";
import {
  Home,
  Grid,
  MoreHorizontal,
  TrendingUp,
  LayoutGrid,
  MessageSquareText,
  User, // ✅ IMPORTANT (THIS CAUSED WHITE SCREEN)
} from "lucide-react";

const serviceTypes = [
  { name: "Martial Arts", path: "/services/martial-arts" },
  { name: "Team Ball Sports", path: "/services/teamball" },
  { name: "Racket Sports", path: "/services/racketsports" },
  { name: "Fitness", path: "/services/fitness" },
  {
    name: "Target & Precision Sports",
    path: "/services/target-precision-sports",
  },
  { name: "Equestrian Sports", path: "/services/equestrian-sports" },
  {
    name: "Adventure & Outdoor Sports",
    path: "/services/adventure-outdoor-sports",
  },
  { name: "Ice Sports", path: "/services/ice-sports" },
  { name: "Aquatic Sports", path: "/services/aquatic" },
  { name: "Wellness", path: "/services/wellness" },
  { name: "Dance", path: "/services/dance" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [newFollowerAlert, setNewFollowerAlert] = useState(false);
  const [newFollowersList, setNewFollowersList] = useState([]);
  const [seenFollowers, setSeenFollowers] = useState([]);
  const navigate = useNavigate();
  const servicesRef = useRef(null);
  const userDropdownRef = useRef(null);
  const [profileImage, setProfileImage] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [highlight, setHighlight] = useState(true);
  const [unreadChats, setUnreadChats] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const location = useLocation();
  const [chatRoute, setChatRoute] = useState("/ChatBox");
  const hideNavbarOnChat = location.pathname.includes("ChatBox");
  const markMessagesAsRead = async (chatId) => {
    const snap = await getDocs(collection(db, "chats", chatId, "messages"));

    const updates = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();

      if (
        data.senderId !== auth.currentUser.uid &&
        !(data.readBy || []).includes(auth.currentUser.uid)
      ) {
        updates.push(
          updateDoc(docSnap.ref, {
            readBy: [...(data.readBy || []), auth.currentUser.uid],
          }),
        );
      }
    });

    await Promise.all(updates);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setHighlight(false);
    }, 4000); // highlight for 4 seconds on first visit

    return () => clearTimeout(timer);
  }, []);
  // ================= FOLLOW NOTIFICATION REALTIME =================
  // REPLACE your current follower notification useEffect with this

  // ================= FOLLOW NOTIFICATION REALTIME =================
  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = document.getElementById("bottom-navbar");

      if (!navbar) return;

      const height = keyboardOpen ? 0 : navbar.offsetHeight;

      document.documentElement.style.setProperty(
        "--bottom-navbar-height",
        `${height}px`,
      );
    };

    const initialHeight = window.innerHeight;

    const handleResize = () => {
      const viewportHeight =
        window.visualViewport?.height || window.innerHeight;

      const isKeyboardOpen = viewportHeight < initialHeight - 150;

      setKeyboardOpen(isKeyboardOpen);

      document.documentElement.style.setProperty(
        "--bottom-navbar-height",
        isKeyboardOpen ? "0px" : "64px",
      );
    };

    updateNavbarHeight();

    window.addEventListener("resize", handleResize);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }

    return () => {
      window.removeEventListener("resize", handleResize);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, []);
  useEffect(() => {
    const navbar = document.getElementById("bottom-navbar");

    const shouldHide = keyboardOpen || location.pathname.includes("ChatBox");

    document.documentElement.style.setProperty(
      "--bottom-navbar-height",
      shouldHide ? "0px" : `${navbar?.offsetHeight || 64}px`,
    );
  }, [keyboardOpen, location.pathname]);
  useEffect(() => {
    let unsubAuth = null;
    let unsubFollowers = null;

    unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (unsubFollowers) unsubFollowers();

      if (!user) {
        setNewFollowerAlert(false);
        setNewFollowersList([]);
        return;
      }

      try {
        const notifRef = doc(db, "followNotifications", user.uid);
        const oldSnap = await getDoc(notifRef);

        let seenIds = [];

        if (oldSnap.exists()) {
          seenIds = oldSnap.data().seenIds || [];
        }

        unsubFollowers = onSnapshot(collection(db, "followers"), (snap) => {
          let unseen = [];

          snap.forEach((item) => {
            const data = item.data();

            if (data.profileId === user.uid) {
              if (!seenIds.includes(data.followerId)) {
                unseen.push(data.followerId);
              }
            }
          });

          if (unseen.length > 0) {
            setNewFollowerAlert(true);
            setNewFollowersList(unseen);
          } else {
            setNewFollowerAlert(false);
            setNewFollowersList([]);
          }
        });
      } catch (error) {
        console.log(error);
      }
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubFollowers) unsubFollowers();
    };
  }, []);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) return;

      try {
        let route = "/ChatBox";

        const instituteSnap = await getDoc(
          doc(db, "institutes", currentUser.uid),
        );

        if (instituteSnap.exists()) {
          route = "/components/InstituteDashboard/ChatBox";
        } else {
          const trainerSnap = await getDoc(
            doc(db, "trainers", currentUser.uid),
          );

          if (trainerSnap.exists()) {
            route = "/components/TrainersDashboard/ChatBox";
          } else {
            const trainerStudentSnap = await getDoc(
              doc(db, "trainerstudents", currentUser.uid),
            );

            if (trainerStudentSnap.exists()) {
              route = "/components/UserDashboard/ChatBoxTS";
            } else {
              const studentSnap = await getDoc(
                doc(db, "students", currentUser.uid),
              );

              if (studentSnap.exists()) {
                route = "/components/UserDashboard/ChatBox";
              } else {
                const trainerQuery = query(
                  collection(db, "InstituteTrainers"),
                  where("trainerUid", "==", currentUser.uid),
                );

                const trainerResult = await getDocs(trainerQuery);

                if (!trainerResult.empty) {
                  route = "/components/TrainersDashboard/ChatBox";
                }
              }
            }
          }
        }

        setChatRoute(route);
      } catch (err) {
        console.log(err);
      }
    });

    return () => unsubscribe();
  }, []);
  /* ================= FETCH USER ROLE & PLAN ================= */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        setUserRole(null);
        setHasActivePlan(false);
        setProfileImage("");
        setAuthLoading(false);
        return;
      }

      const trainerSnap = await getDoc(doc(db, "trainers", currentUser.uid));

      if (trainerSnap.exists()) {
        setUserRole("trainer");
        setProfileImage(trainerSnap.data().profileImageUrl || "");
      } else {
        const instituteSnap = await getDoc(
          doc(db, "institutes", currentUser.uid),
        );

        if (instituteSnap.exists()) {
          setUserRole("institute");
          setProfileImage(instituteSnap.data().profileImageUrl || "");
        } else {
          setUserRole("user");
          setProfileImage("");

          /* ✅ NEW: CHECK InstituteTrainers Login */
          const instituteTrainerSnap = await getDoc(
            doc(db, "InstituteTrainers", currentUser.uid),
          );

          if (instituteTrainerSnap.exists()) {
            setProfileImage(instituteTrainerSnap.data().profileImageUrl || "");
          }

          /* ✅ NEW: CHECK Students Login */
          const studentSnap = await getDoc(
            doc(db, "students", currentUser.uid),
          );

          if (studentSnap.exists()) {
            setProfileImage(studentSnap.data().profileImageUrl || "");
          }
        }
      }

      const planSnap = await getDoc(doc(db, "plans", currentUser.uid));
      if (
        planSnap.exists() &&
        planSnap.data()?.currentPlan?.status === "active"
      ) {
        setHasActivePlan(true);
      } else {
        setHasActivePlan(false);
      }

      // ✅ Auth finished loading
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ================= USER DROPDOWN CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  /* ================= CLICK OUTSIDE HANDLER ================= */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target)) {
        setServiceOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  /* ================= CHAT NOTIFICATION ================= */
  // REPLACE THIS ENTIRE BLOCK
  // /* ================= CHAT NOTIFICATION ================= */
  useEffect(() => {
    let unsubAuth = null;
    let unsubChats = null;
    let messageUnsubs = [];

    unsubAuth = auth.onAuthStateChanged((user) => {
      // cleanup previous listeners
      if (unsubChats) unsubChats();
      messageUnsubs.forEach((fn) => fn());
      messageUnsubs = [];

      if (!user) {
        setUnreadChats(false);
        setTotalUnread(0);
        return;
      }

      try {
        const q = query(
          collection(db, "chats"),
          where("members", "array-contains", user.uid),
        );

        unsubChats = onSnapshot(
          q,
          (snap) => {
            // remove old msg listeners only
            messageUnsubs.forEach((fn) => fn());
            messageUnsubs = [];

            const unreadMap = {};

            snap.docs.forEach((chatDoc) => {
              const chatId = chatDoc.id;

              const unsubMsgs = onSnapshot(
                collection(db, "chats", chatId, "messages"),
                (msgSnap) => {
                  let unread = 0;

                  msgSnap.forEach((m) => {
                    const data = m.data();

                    if (
                      data?.senderId !== user.uid &&
                      !(data?.readBy || []).includes(user.uid)
                    ) {
                      unread++;
                    }
                  });

                  unreadMap[chatId] = unread;

                  const total = Object.values(unreadMap).reduce(
                    (a, b) => a + b,
                    0,
                  );

                  setTotalUnread(total);
                  setUnreadChats(total > 0);
                },
                (error) => {
                  console.log("Messages listener error:", error);
                },
              );

              messageUnsubs.push(unsubMsgs);
            });

            if (snap.empty) {
              setTotalUnread(0);
              setUnreadChats(false);
            }
          },
          (error) => {
            console.log("Chats listener error:", error);
            setTotalUnread(0);
            setUnreadChats(false);
          },
        );
      } catch (error) {
        console.log("Chat setup error:", error);
        setTotalUnread(0);
        setUnreadChats(false);
      }
    });

    return () => {
      if (unsubAuth) unsubAuth();
      if (unsubChats) unsubChats();
      messageUnsubs.forEach((fn) => fn());
    };
  }, []);
  /* ================= DASHBOARD NAVIGATION ================= */
  const handleDashboardNavigation = () => {
    setDropdownOpen(false);

    // ✅ if not logged in → open same More popup
    if (!auth.currentUser) {
      setMenuOpen(true);
      return;
    }

    // ✅ Always open dashboard from top
    window.scrollTo(0, 0);

    if (userRole === "user") {
      navigate("/user/dashboard");
      return;
    }
    {
      /*}
    if (
      (userRole === "trainer" || userRole === "institute") &&
      !hasActivePlan
    ) {
      navigate("/plans");
      return;
    }
  */
    }
    if (userRole === "institute") {
      navigate("/institutes/dashboard");
      return;
    }

    if (userRole === "trainer") {
      navigate("/trainers/dashboard");
      return;
    }

    // fallback
    setMenuOpen(true);
  };
  /* ================= LOGOUT ================= */
  const handleLogout = async () => {
    try {
      await auth.signOut();

      setUserRole(null);
      setHasActivePlan(false);
      setDropdownOpen(false);
      setIsOpen(false);

      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const openMenu = () => {
    window.dispatchEvent(new Event("hideLandingBanner"));
    setMenuOpen(true);
  };

  const closeMenu = () => {
    window.dispatchEvent(new Event("showLandingBanner"));
    setMenuOpen(false);
  };
  /* REPLACE THIS useEffect BODY FOR PERFECT PAGE GAP */

  /* ================= MOBILE FOOTER SAFE SPACE ================= */
  /* ================= MOBILE SAFE FOOTER SPACE ================= */
  /* ================= GLOBAL MOBILE SAFE FOOTER SPACE ================= */

  return (
    <>
      <nav className="hidden md:block w-full bg-black shadow-md sticky top-0 z-50">
        <div className="w-full px-6 md:px-10 lg:px-14">
          <div className="flex items-center justify-between h-16">
            {/* LOGO */}
            <div
              onClick={() => navigate("/")}
              className="flex items-center cursor-pointer"
            >
              <div
                className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden 
      bg-white flex items-center justify-center transition-all duration-500
      ${highlight ? "ring-4 ring-orange-400 animate-pulse scale-110" : ""}
      hover:scale-110 hover:ring-2 hover:ring-orange-400`}
              >
                <img
                  src="/Kridana logo.png"
                  alt="Kridana Logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
            </div>

            {/* DESKTOP MENU */}
            <div className="hidden md:flex items-center space-x-8 text-orange-500 font-normal text-lg">
              <NavLink to="/" className="hover:text-white transition">
                Home
              </NavLink>

              {/* SERVICES */}
              <div className="relative" ref={servicesRef}>
                <button
                  onClick={() => setServiceOpen((prev) => !prev)}
                  className="flex items-center gap-1 transition hover:text-white"
                >
                  Categories
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      serviceOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {serviceOpen && (
                  <div className="absolute top-10 left-0 w-60 bg-white shadow-md rounded-lg border border-gray-200 py-1 z-50">
                    {serviceTypes.map((service) => (
                      <NavLink
                        key={service.path}
                        to={service.path}
                        onClick={() => {
                          setIsOpen(false);
                          setServiceOpen(false); // ✅ IMPORTANT FIX
                        }}
                        className="block text-sm hover:text-orange-600"
                      >
                        {service.name}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              <NavLink
                to="/trending-plays"
                className="hover:text-white transition"
              >
                Reels
              </NavLink>

              {/* USER ACTIONS (profile + new dropdown side by side) */}
              {/* PROFILE + ARROW DROPDOWN */}
              {/* PROFILE + SMALL ARROW (tight like Categories) */}
              {auth.currentUser && (
                <div className="relative" ref={userDropdownRef}>
                  <div className="flex items-center">
                    {/* PROFILE ICON (no click) */}
                    {profileImage ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                    )}

                    {/* SMALL ARROW BUTTON */}
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="ml-1 p-1 hover:text-orange-600 transition"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${
                          dropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded-lg border border-gray-200 z-50 overflow-hidden">
                      <button
                        onClick={handleDashboardNavigation}
                        className="block w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-100 transition"
                      >
                        Dashboard
                      </button>

                      <div className="border-t border-gray-200"></div>

                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SIGN UP BUTTON */}
              {!authLoading && !auth.currentUser && (
                <button
                  onClick={() => navigate("/RoleSelection")}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full shadow-md transition"
                >
                  Sign Up
                </button>
              )}
            </div>

            {/* MOBILE BUTTON */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-white text-2xl z-50"
            >
              ☰
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}

        {/* ✅ MOBILE BOTTOM NAVBAR */}
        {/* ✅ MOBILE BOTTOM NAVBAR */}
      </nav>
      {/* ================= MOBILE APP FOOTER NAVBAR ================= */}
      <div
        id="bottom-navbar"
        className={`
    md:hidden
    fixed
    bottom-0
    left-0
    right-0
    z-[9999]
    bg-orange-500
    border-t border-orange-400
    shadow-[0_-4px_20px_rgba(0,0,0,0.18)]
    transition-transform duration-300
    ${keyboardOpen || hideNavbarOnChat ? "translate-y-full" : "translate-y-0"}
  `}
      >
        <div className="w-full max-w-screen-md mx-auto">
          <div className="grid grid-cols-5 items-center h-[42px] px-0">
            {/* HOME */}
            <button
              onClick={() => navigate("/")}
              className="flex flex-col items-center justify-center text-black active:scale-95 transition"
            >
              <Home size={24} strokeWidth={2.2} />

              <span className="text-[10px] sm:text-[11px] font-semibold mt-1">
                Home
              </span>
            </button>

            {/* DASHBOARD */}
            <button
              onClick={handleDashboardNavigation}
              className="flex flex-col items-center justify-center text-black active:scale-95 transition"
            >
              <Grid size={24} strokeWidth={2.2} />

              <span className="text-[10px] sm:text-[11px] font-semibold mt-1">
                Dashboard
              </span>
            </button>

            {/* CATEGORIES */}
            <button
              onClick={() => navigate("/MobileCategoriesPage")}
              className="flex flex-col items-center justify-center text-black active:scale-95 transition"
            >
              <LayoutGrid size={24} strokeWidth={2.2} />

              <span className="text-[10px] sm:text-[11px] font-semibold mt-1 text-center leading-tight">
                Categories
              </span>
            </button>

            {/* CHAT */}
            <button
              onClick={() => {
                if (!auth.currentUser) {
                  navigate("/login");
                  return;
                }

                navigate(chatRoute);
              }}
              className="flex flex-col items-center justify-center text-black relative active:scale-95 transition"
            >
              <div className="relative">
                <MessageSquareText size={24} strokeWidth={2.2} />

                {unreadChats && (
                  <>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>

                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>

                    {totalUnread > 0 && (
                      <span className="absolute -top-2 -right-3 min-w-[16px] h-[16px] px-1 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center font-bold">
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </span>
                    )}
                  </>
                )}
              </div>

              <span className="text-[10px] sm:text-[11px] font-semibold mt-1">
                Chat
              </span>
            </button>

            {/* MORE */}
            <button
              onClick={openMenu}
              className="flex flex-col items-center justify-center text-black relative active:scale-95 transition"
            >
              <div className="relative">
                <MoreHorizontal size={24} strokeWidth={2.2} />

                {newFollowerAlert && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>

                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                )}
              </div>

              <span className="text-[10px] sm:text-[11px] font-semibold mt-1">
                More
              </span>
            </button>
          </div>
        </div>

        {/* ================= MORE MENU PANEL ================= */}

        {menuOpen && (
          <>
            {/* BACKDROP */}
            <div
              onClick={closeMenu}
              className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[9998]"
            />

            {/* PANEL */}
            <div className="fixed inset-x-0 bottom-0 z-[9999] animate-slideUp">
              <div className="bg-white rounded-t-[28px] shadow-2xl max-h-[88vh] overflow-hidden">
                {/* TOP HANDLE */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-14 h-1.5 rounded-full bg-gray-300" />
                </div>

                {/* HEADER */}
                <div className="flex items-center justify-between px-5 py-4 border-b">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">
                      Quick Menu
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Manage your account & navigation
                    </p>
                  </div>

                  <button
                    onClick={closeMenu}
                    className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center active:scale-95"
                  >
                    ✕
                  </button>
                </div>

                {/* BODY */}
                <div className="p-4 overflow-y-auto max-h-[70vh]">
                  {!auth.currentUser ? (
                    <div className="text-center py-10">
                      <div className="w-16 h-16 mx-auto rounded-full bg-orange-100 flex items-center justify-center text-2xl mb-4">
                        👋
                      </div>

                      <h3 className="text-lg font-bold text-gray-800">
                        Welcome to Kridana
                      </h3>

                      <p className="text-sm text-gray-500 mt-2 px-4">
                        Login to access dashboard, chat, bookings and more
                        features.
                      </p>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/RoleSelection");
                        }}
                        className="mt-5 w-full bg-orange-500 text-white py-3 rounded-2xl font-semibold shadow-md active:scale-[0.98]"
                      >
                        Sign Up / Login
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/");
                        }}
                        className="menu-item w-full text-left px-4 py-3 rounded-xl bg-gray-50 font-medium active:scale-[0.98]"
                      >
                        🏠 Home
                      </button>

                      {/* Customers Button with Notification Badge */}
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/AllPeoplePage");
                        }}
                        className="menu-item relative w-full text-left px-4 py-3 rounded-xl bg-gray-50 font-medium active:scale-[0.98] flex items-center justify-between"
                      >
                        <span>👤 People</span>

                        {newFollowerAlert && newFollowersList.length > 0 && (
                          <div className="relative">
                            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>

                            <span className="relative z-10 min-w-[22px] h-[22px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold shadow">
                              {newFollowersList.length}
                            </span>
                          </div>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/MobileEditprofile");
                        }}
                        className="menu-item w-full text-left px-4 py-3 rounded-xl bg-gray-50 font-medium active:scale-[0.98]"
                      >
                        👤 Edit Profile
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/Uploadimages");
                        }}
                        className="menu-item w-full text-left px-4 py-3 rounded-xl bg-gray-50 font-medium active:scale-[0.98]"
                      >
                        🖼 Upload Images
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/terms");
                        }}
                        className="menu-item w-full text-left px-4 py-3 rounded-xl bg-gray-50 font-medium active:scale-[0.98]"
                      >
                        📄 Terms & Conditions
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/privacy");
                        }}
                        className="menu-item w-full text-left px-4 py-3 rounded-xl bg-gray-50 font-medium active:scale-[0.98]"
                      >
                        🔒 Privacy Policy
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/help-center");
                        }}
                        className="menu-item w-full text-left px-4 py-3 rounded-xl bg-gray-50 font-medium active:scale-[0.98]"
                      >
                        ❓ Help Center
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/about");
                        }}
                        className="menu-item w-full text-left px-4 py-3 rounded-xl bg-gray-50 font-medium active:scale-[0.98]"
                      >
                        ℹ️ About
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 rounded-xl bg-red-50 text-red-600 font-semibold active:scale-[0.98]"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Navbar;
