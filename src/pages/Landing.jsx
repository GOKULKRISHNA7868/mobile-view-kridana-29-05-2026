import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { getCurrentUserLocation } from "../utils/location";
import { db } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  Dribbble,
  Users,
  Dumbbell,
  ArrowRight,
  Globe,
  UserCheck,
  Activity,
} from "lucide-react";
import {
  FaFistRaised,
  FaFootballBall,
  FaTableTennis,
  FaDumbbell,
  FaBullseye,
  FaHorse,
  FaMountain,
  FaSnowflake,
  FaSwimmer,
  FaSpa,
  FaMusic,
} from "react-icons/fa";
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
} from "@capacitor-community/admob";
const categories = [
  { name: "Martial Arts", path: "/services/martial-arts", icon: FaFistRaised },
  {
    name: "Team Ball Sports",
    path: "/services/teamball",
    icon: FaFootballBall,
  },
  {
    name: "Racket Sports",
    path: "/services/racketsports",
    icon: FaTableTennis,
  },
  { name: "Fitness", path: "/services/fitness", icon: FaDumbbell },
  {
    name: "Target & Precision Sports",
    path: "/services/target-precision-sports",
    icon: FaBullseye,
  },
  {
    name: "Equestrian Sports",
    path: "/services/equestrian-sports",
    icon: FaHorse,
  },
  {
    name: "Adventure & Outdoor Sports",
    path: "/services/adventure-outdoor-sports",
    icon: FaMountain,
  },
  { name: "Ice Sports", path: "/services/ice-sports", icon: FaSnowflake },
  { name: "Aquatic Sports", path: "/services/aquatic", icon: FaSwimmer },
  { name: "Wellness", path: "/services/wellness", icon: FaSpa },
  { name: "Dance", path: "/services/dance", icon: FaMusic },
];

/* ================= DISTANCE ================= */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

/* ===================================================== */
/* ================= LANDING PAGE ====================== */
/* ===================================================== */

const Landing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("top");
  const [instituteMode, setInstituteMode] = useState("top");
  const [trainers, setTrainers] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [reels, setReels] = useState([]);

  const [showCommentsFor, setShowCommentsFor] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [showReelViewer, setShowReelViewer] = useState(false);
  const [activeReelIndex, setActiveReelIndex] = useState(0);

  const [userLocation, setUserLocation] = useState(null);

  const [suggestedProfiles, setSuggestedProfiles] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [reactionMap, setReactionMap] = useState({});

  const [commentBox, setCommentBox] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentCounts, setCommentCounts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [dislikeCounts, setDislikeCounts] = useState({});
  /* ===================================================== */
  /* ================= FETCH SUGGESTED =================== */
  /* ===================================================== */
  // Landing.jsx

  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new Event("showLandingBanner"));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    let bannerLoadedListener;
    let bannerFailedListener;

    const loadAds = async () => {
      try {
        await AdMob.initialize({
          initializeForTesting: true,
        });

        bannerLoadedListener = await AdMob.addListener("bannerAdLoaded", () => {
          console.log("Banner loaded");
        });

        bannerFailedListener = await AdMob.addListener(
          "bannerAdFailedToLoad",
          (error) => {
            console.log("Banner failed:", error);
          },
        );

        await AdMob.showBanner({
          adId: "ca-app-pub-3940256099942544/6300978111",
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.TOP_CENTER,
          margin: 0,
          isTesting: true,
        });
      } catch (err) {
        console.log(err);
      }
    };

    loadAds();

    return () => {
      AdMob.removeBanner().catch(() => {});
      bannerLoadedListener?.remove();
      bannerFailedListener?.remove();
    };
  }, []);
  const openComments = async (item) => {
    const mainCol = item.type === "trainer" ? "trainers" : "institutes";

    const snap = await getDocs(collection(db, mainCol, item.id, "comments"));

    const list = snap.docs
      .map((d) => ({
        id: d.id,
        ...d.data(),
      }))
      .sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
      );

    setCommentsList(list);
    setShowCommentsFor(item);
  };

  useEffect(() => {
    const loadSuggested = async () => {
      const trainerSnap = await getDocs(collection(db, "trainers"));
      const instituteSnap = await getDocs(collection(db, "institutes"));

      const trainerList = trainerSnap.docs.map((doc) => ({
        id: doc.id,
        type: "trainer",
        ...doc.data(),
      }));

      const instituteList = instituteSnap.docs.map((doc) => ({
        id: doc.id,
        type: "institute",
        ...doc.data(),
      }));

      let all = [...trainerList, ...instituteList];

      all = all.map((item) => ({
        ...item,
        distance:
          userLocation && item.latitude && item.longitude
            ? getDistance(
                userLocation.lat,
                userLocation.lng,
                Number(item.latitude),
                Number(item.longitude),
              )
            : null,
      }));

      all.sort((a, b) => {
        if (userLocation) {
          return (a.distance || 9999) - (b.distance || 9999);
        }
        return Number(b.rating || 0) - Number(a.rating || 0);
      });

      setSuggestedProfiles(all.slice(0, 8));
    };

    loadSuggested();
  }, [userLocation]);

  /* ===================================================== */
  /* ================= LOAD FOLLOWING ==================== */
  /* ===================================================== */

  /* ================= AUTH ================= */

  useEffect(() => {
    const auth = getAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);
  useEffect(() => {
    if (!user) return;

    const loadFollowing = async () => {
      const snap = await getDocs(collection(db, "followers"));

      const ids = snap.docs
        .map((d) => d.data())
        .filter((x) => x.followerId === user.uid)
        .map((x) => x.profileId);

      setFollowingIds(ids);
    };

    loadFollowing();
  }, [user]);

  /* ===================================================== */
  /* ================= FOLLOW ============================ */
  /* ===================================================== */

  /* ===================================================== */
  /* ================= FOLLOW (UPDATED) =================== */
  /* ===================================================== */

  const handleFollow = async (profileId) => {
    if (!user) {
      alert("Login First");
      return;
    }

    if (user.uid === profileId) return;

    const followId = `${user.uid}_${profileId}`;
    const followRef = doc(db, "followers", followId);

    try {
      const snap = await getDoc(followRef);

      // already following
      if (snap.exists()) return;

      /* SAVE FOLLOW SAME AS ALLPEOPLEPAGE */
      await setDoc(followRef, {
        followerId: user.uid,
        profileId: profileId,
        createdAt: serverTimestamp(),
      });

      /* UPDATE UI IMMEDIATELY */
      setFollowingIds((prev) => [...prev, profileId]);
    } catch (error) {
      console.log(error);
    }
  };

  /* ===================================================== */
  /* ================= LIKE / DISLIKE ==================== */
  /* ===================================================== */

  const handleReaction = async (item, type) => {
    if (!user) return alert("Login First");

    const mainCol = item.type === "trainer" ? "trainers" : "institutes";

    const reactionRef = doc(db, mainCol, item.id, "reactions", user.uid);

    const snap = await getDoc(reactionRef);
    const oldType = snap.exists() ? snap.data().type : null;

    // SAME CLICK = REMOVE
    if (oldType === type) {
      await deleteDoc(reactionRef);
      setReactionMap((p) => ({ ...p, [item.id]: null }));
    } else {
      // NEW / SWITCH
      await setDoc(reactionRef, {
        uid: user.uid,
        type,
        createdAt: serverTimestamp(),
      });

      setReactionMap((p) => ({
        ...p,
        [item.id]: type,
      }));
    }

    // 🔥 RECALCULATE COUNTS
    const allSnap = await getDocs(
      collection(db, mainCol, item.id, "reactions"),
    );

    let likes = 0;
    let dislikes = 0;

    allSnap.forEach((d) => {
      const t = d.data().type;

      if (t === "like") likes++;
      if (t === "dislike") dislikes++;
    });

    await updateDoc(doc(db, mainCol, item.id), {
      likeCount: likes,
      dislikeCount: dislikes,
    });
  };
  /* ===================================================== */
  /* ================= COMMENT =========================== */
  /* ===================================================== */

  const submitComment = async (item) => {
    if (!user) return alert("Login First");
    if (!commentText.trim()) return;

    const mainCol = item.type === "trainer" ? "trainers" : "institutes";

    await addDoc(collection(db, mainCol, item.id, "comments"), {
      uid: user.uid,
      text: commentText,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, mainCol, item.id), {
      commentCount: increment(1),
    });

    setCommentText("");
    setCommentBox(null);
  };

  /* ===================================================== */
  /* ================= LIVE COUNTS ======================= */
  /* ===================================================== */

  useEffect(() => {
    const unsubs = suggestedProfiles.map((item) => {
      const mainCol = item.type === "trainer" ? "trainers" : "institutes";

      return onSnapshot(doc(db, mainCol, item.id), (snap) => {
        const data = snap.data();

        setLikeCounts((p) => ({
          ...p,
          [item.id]: data?.likeCount || 0,
        }));

        setDislikeCounts((p) => ({
          ...p,
          [item.id]: data?.dislikeCount || 0,
        }));

        setCommentCounts((p) => ({
          ...p,
          [item.id]: data?.commentCount || 0,
        }));
      });
    });

    return () => unsubs.forEach((u) => u());
  }, [suggestedProfiles]);

  /* ================= FETCH TRAINERS + INSTITUTES ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const trainerSnap = await getDocs(collection(db, "trainers"));
        const instituteSnap = await getDocs(collection(db, "institutes"));

        // ✅ Trainers
        const trainerList = trainerSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // ✅ Institutes
        const instituteList = instituteSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTrainers(trainerList);
        setInstitutes(instituteList);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      }
    };

    fetchData();
  }, []);
  /* ================= LOCATION ================= */

  useEffect(() => {
    const loadLocation = async () => {
      const loc = await getCurrentUserLocation();
      setUserLocation(loc);
    };

    loadLocation();
  }, []);

  /* ================= FETCH TRAINERS + INSTITUTES ================= */

  /* ================= FETCH REELS ================= */
  /* ================= ✅ FETCH REELS FROM TRAINERS + INSTITUTES ================= */
  useEffect(() => {
    const fetchReels = async () => {
      const trainerSnap = await getDocs(collection(db, "trainers"));
      const instituteSnap = await getDocs(collection(db, "institutes"));

      let all = []; // ✅ correct variable

      // ✅ TRAINERS
      trainerSnap.docs.forEach((doc) => {
        const data = doc.data();

        if (data.reels && Array.isArray(data.reels)) {
          data.reels.forEach((video, index) => {
            // ✅ index added
            all.push({
              reelId: `trainer_${doc.id}_${index}`, // ✅ correct
              videoUrl: video,
              ownerId: doc.id,
              type: "trainer",
              title: data.trainerName || "Trainer Reel",
            });
          });
        }
      });

      // ✅ INSTITUTES
      instituteSnap.docs.forEach((doc) => {
        const data = doc.data();

        if (data.reels && Array.isArray(data.reels)) {
          data.reels.forEach((video, index) => {
            // ✅ index added
            all.push({
              reelId: `institute_${doc.id}_${index}`, // ✅ correct
              videoUrl: video,
              ownerId: doc.id,
              type: "institute",
              title: data.instituteName || "Institute Reel",
            });
          });
        }
      });

      // ✅ Shuffle
      all = all.sort(() => Math.random() - 0.5);

      // ✅ Limit
      setReels(all.slice(0, 5));
    };

    fetchReels();
  }, []);

  useEffect(() => {
    const fetchReels = async () => {
      const trainerSnap = await getDocs(collection(db, "trainers"));
      const instituteSnap = await getDocs(collection(db, "institutes"));

      let all = [];

      trainerSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.reels) {
          data.reels.forEach((video) => {
            all.push({
              reelId: `trainer_${doc.id}_${index}`,
              videoUrl: video,
              ownerId: doc.id, // ✅ REQUIRED
              type: "trainer",
              title: data.trainerName || "Trainer Reel",
            });
          });
        }
      });

      instituteSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.reels) {
          data.reels.forEach((video) => {
            all.push({
              reelId: `institute_${doc.id}_${index}`,
              videoUrl: video,
              ownerId: doc.id, // ✅ REQUIRED
              type: "institute",
              title: data.instituteName || "Institute Reel",
            });
          });
        }
      });

      all = all.sort(() => Math.random() - 0.5);
      setReels(all.slice(0, 4));
    };

    fetchReels();
  }, []);

  return (
    <div className="w-full font-sans pb-50">
      {/* 3px white line */}
      <div className="w-full h-[90px] bg-white"></div>

      <section className="w-full bg-[#FFFBF8] border-b border-orange-100 py-2 md:py-20 overflow-hidden">
        {/* ==================== MOBILE VIEW ===================== */}
        <div className="flex md:hidden flex-col px-4 gap-2">
          {/* Top Tagline Badge */}
          <div>
            <span className="inline-flex items-center gap-1 bg-[#FFF5EE] border border-[#FF6A00] px-3 py-1 rounded-full text-[11px] font-semibold text-[#FF6A00]">
              <Trophy className="w-3 h-3" /> DISCOVER YOUR SPORT
            </span>
          </div>

          {/* Main Headings */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[32px] font-extrabold text-[#0B0B0B] leading-tight tracking-tight">
              Search your <br />
              favourite <span className="text-[#FF6A00]">Sports</span>
            </h1>
            <h2 className="text-[20px] font-bold text-[#0B0B0B] mt-1">
              Train hard. <span className="text-[#FF6A00]">Enjoy & Sweat.</span>
            </h2>
            <p className="mt-3 text-[14px] text-gray-600 font-normal leading-relaxed">
              Find indoor or outdoor sports, connect with expert trainers and
              track your progress — all in one place.
            </p>
          </div>

          {/* Main Image Asset Showcase */}
          <div className="w-full flex justify-center py-2 relative">
            <img
              src="/image.png" // Replace with your complete right-side compiled banner asset
              alt="Sports dashboard composite"
              className="w-[85%] h-auto object-contain drop-shadow-xl"
            />
          </div>

          {/* Features Minimal Feature Cards Block */}

          {/* Action Call to Action Buttons */}
          <div className="flex flex-col gap-1 mt-2 w-full">
            <button
              onClick={() => navigate("/MobileCategoriesPage")}
              className="w-full bg-[#FF6A00] hover:bg-orange-600 transition-colors text-white py-3.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
            >
              Explore Sports <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ==================== DESKTOP VIEW ===================== */}
        <div className="hidden md:flex max-w-[1280px] mx-auto items-center justify-between px-8 gap-8">
          {/* LEFT TEXT PANEL */}
          <div className="w-[50%] flex flex-col items-start">
            {/* Top Tagline Badge */}
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 bg-[#FFF5EE] border border-[#FF6A00] text-[#FF6A00] px-4 py-1.5 rounded-full text-[13px] font-bold uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5" /> DISCOVER YOUR SPORT
              </span>
            </div>

            {/* Core App Headings */}
            <h1 className="text-[56px] font-black text-[#0B0B0B] leading-[1.1] tracking-tight">
              Search your <br />
              favourite <span className="text-[#FF6A00]">Sports</span>
            </h1>

            <h2 className="text-[32px] font-extrabold text-[#0B0B0B] mt-3">
              Train hard. <span className="text-[#FF6A00]">Enjoy & Sweat.</span>
            </h2>

            {/* Subtext Description */}
            <p className="text-gray-600 mt-5 text-[16px] leading-[1.6] max-w-[500px] font-medium">
              Find indoor or outdoor sports, connect with expert trainers and
              track your progress — all in one place.
            </p>

            {/* Feature Grid Quick Metrics */}
            <div className="grid grid-cols-4 gap-4 mt-8 w-full max-w-[540px]">
              <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-[#FFF5EE] rounded-xl flex items-center justify-center text-[#FF6A00] mb-2.5">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="text-[13px] font-bold text-[#0B0B0B] whitespace-nowrap">
                  Indoor Sports
                </span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-[#FFF5EE] rounded-xl flex items-center justify-center text-[#FF6A00] mb-2.5">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-[13px] font-bold text-[#0B0B0B] whitespace-nowrap">
                  Outdoor Sports
                </span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-[#FFF5EE] rounded-xl flex items-center justify-center text-[#FF6A00] mb-2.5">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-[13px] font-bold text-[#0B0B0B] whitespace-nowrap">
                  Expert Trainers
                </span>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-[#FFF5EE] rounded-xl flex items-center justify-center text-[#FF6A00] mb-2.5">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[13px] font-bold text-[#0B0B0B] whitespace-nowrap">
                  Stay Fit
                </span>
              </div>
            </div>

            {/* Action Trigger Buttons */}
            <div className="flex items-center gap-2 mt-8">
              <button
                onClick={() => navigate("/book")}
                className="bg-[#FF6A00] hover:bg-orange-600 transition-colors text-white px-8 py-3.5 rounded-xl text-[15px] font-bold flex items-center gap-2 shadow-lg shadow-orange-500/10"
              >
                Explore Sports <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate("/features")}
                className="border border-[#FF6A00] hover:bg-[#FFF5EE] transition-colors text-[#FF6A00] px-8 py-3.5 rounded-xl text-[15px] font-bold flex items-center gap-2 bg-white"
              >
                Join Community <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RIGHT SIDE GRAPHICS WRAPPER */}
          <div className="w-[50%] flex justify-end relative">
            <img
              src="/hero.png" // Point this image route directly to your UI asset layout
              alt="Comprehensive Sports Dashboard Showcase"
              className="w-full max-w-[560px] h-auto object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>
      {/* ================= CATEGORIES ================= */}
      <section className="px-4 py-2 bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Categories</h2>
          <button
            onClick={() => navigate("/MobileCategoriesPage")}
            className="text-orange-500 text-sm font-semibold"
          >
            See All
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((cat, index) => {
            const Icon = cat.icon;

            return (
              <div
                key={index}
                onClick={() => {
                  navigate(cat.path);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="min-w-[90px] flex-shrink-0 flex flex-col items-center cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full border border-gray-300 flex items-center justify-center bg-white shadow-sm">
                  <Icon className="text-gray-700 text-lg" />
                </div>

                <p className="text-[11px] text-orange-500 text-center mt-2 font-medium">
                  {cat.name}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= SUGGESTED ================= */}
      <section className="px-4 py-2 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Suggested</h2>

          <button
            onClick={() => {
              navigate("/suggested");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-orange-500 text-sm font-semibold hover:text-orange-600 shrink-0"
          >
            See All
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {suggestedProfiles.map((item) => {
            const liked = reactionMap[item.id] === "like";
            const disliked = reactionMap[item.id] === "dislike";
            const followed = followingIds.includes(item.id);

            const name =
              item.type === "trainer"
                ? `${item.firstName || ""} ${item.lastName || ""}`
                : item.instituteName;

            const category = item.subCategory || item.category || "Sports";

            return (
              <div
                key={item.id}
                className="min-w-[260px] bg-white rounded-xl shadow-sm border"
              >
                {/* HEADER */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={item.profileImageUrl || "/images/default-avatar.png"}
                      className="w-8 h-8 rounded-full object-cover"
                    />

                    <div>
                      <p className="text-sm font-semibold line-clamp-1">
                        {name}
                      </p>
                      <p className="text-xs text-gray-500">{category}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFollow(item.id)}
                    disabled={followed}
                    className={`text-xs px-3 py-1 rounded-full ${
                      followed
                        ? "bg-gray-200 text-gray-600"
                        : "bg-orange-500 text-white"
                    }`}
                  >
                    {followed ? "Following" : "Follow"}
                  </button>
                </div>

                {/* IMAGE */}
                <div
                  className="w-full h-52 sm:h-56 md:h-60 bg-gray-100 cursor-pointer overflow-hidden rounded-lg"
                  onClick={() =>
                    navigate(
                      item.type === "trainer"
                        ? `/trainers/${item.id}`
                        : `/institutes/${item.id}`,
                    )
                  }
                >
                  <img
                    src={item.profileImageUrl}
                    className="w-full h-full object-contain bg-gray-100"
                  />
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-4 px-3 py-2 text-lg">
                  <button
                    onClick={() => handleReaction(item, "like")}
                    className={`flex items-center gap-1 ${
                      liked ? "text-green-500" : "text-gray-400"
                    }`}
                  >
                    👍{" "}
                    <span className="text-xs">{likeCounts[item.id] || 0}</span>
                  </button>

                  <button
                    onClick={() => handleReaction(item, "dislike")}
                    className={`flex items-center gap-1 ${
                      disliked ? "text-red-500" : "text-gray-400"
                    }`}
                  >
                    👎{" "}
                    <span className="text-xs">
                      {dislikeCounts[item.id] || 0}
                    </span>
                  </button>

                  <button
                    onClick={() => openComments(item)}
                    className="flex items-center gap-1 text-gray-500 hover:text-orange-500 transition"
                  >
                    💬
                    <span className="text-xs font-medium">
                      {commentCounts[item.id] || 0}
                    </span>
                  </button>
                </div>

                {/* MOBILE PROFESSIONAL COMMENT SHEET */}
                {showCommentsFor?.id === item.id && (
                  <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
                    <div
                      className="
    bg-white w-full md:w-[450px]
    rounded-t-3xl md:rounded-2xl
    shadow-2xl flex flex-col
    animate-slideUp
    max-h-[calc(100vh-90px)]
    md:max-h-[85vh]
    pb-[env(safe-area-inset-bottom)]
    mb-16 md:mb-0
  "
                    >
                      {/* TOP BAR */}
                      <div className="sticky top-0 bg-white border-b px-4 py-3 rounded-t-3xl">
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3"></div>

                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-lg">
                            Comments ({commentCounts[item.id] || 0})
                          </h3>

                          <button
                            onClick={() => setShowCommentsFor(null)}
                            className="text-gray-500 text-xl"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* COMMENTS LIST */}
                      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                        {commentsList.length === 0 ? (
                          <div className="text-center text-sm text-gray-500 py-10">
                            No comments yet
                          </div>
                        ) : (
                          commentsList.map((c) => (
                            <div
                              key={c.id}
                              className="bg-gray-50 border rounded-2xl px-3 py-2"
                            >
                              <div className="flex items-start gap-2">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-semibold text-orange-500">
                                  {c.name?.charAt(0) || "U"}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800">
                                    {c.name || "User"}
                                  </p>

                                  <p className="text-sm text-gray-700 break-words">
                                    {c.text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* INPUT BOX */}
                      <div className="border-t bg-white p-3">
                        <div className="flex items-end gap-2">
                          <textarea
                            rows="1"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 resize-none border rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 max-h-28 overflow-y-auto"
                          />

                          <button
                            onClick={() => submitComment(item)}
                            className="bg-orange-500 text-white px-4 py-2 rounded-2xl text-sm font-medium active:scale-95 transition"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* CAPTION */}
                <div className="px-3 pb-3 text-xs text-gray-600">
                  Rated {item.rating || 0} ⭐
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================================================= */}
      {/* ================= DOMAINS SECTION ================= */}
      {/* ================================================= */}

      {/* ================================================= */}
      {/* ================= DOMAINS SECTION ================= */}
      {/* ================================================= */}

      {/* ================= ADS SECTION ================= */}

      {/* ================================================= */}
      {/* ================= TOP TRAINERS =================== */}
      {/* ================================================= */}

      <section className="px-2 md:px-2 md:px-20 py-8 bg-white">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row md:flex-row md:items-center md:justify-between gap-2 mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">Top Trainers</h2>

          {/* Filter Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setMode("top")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                mode === "top"
                  ? "bg-orange-500 text-white"
                  : "border border-orange-500 text-orange-500"
              }`}
            >
              <svg
                className="w-4 h-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.955a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.45a1 1 0 00-.364 1.118l1.287 3.955c.3.921-.755 1.688-1.538 1.118l-3.37-2.45a1 1 0 00-1.175 0l-3.37 2.45c-.783.57-1.838-.197-1.538-1.118l1.287-3.955a1 1 0 00-.364-1.118l-3.37-2.45c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.955z" />
              </svg>
              Top Rated
            </button>

            <button
              onClick={() => setMode("nearby")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                mode === "nearby"
                  ? "bg-orange-500 text-white"
                  : "border border-orange-500 text-orange-500"
              }`}
            >
              <img
                src="/location-icon.png"
                className="w-4 h-4"
                alt="location"
              />
              Near Me
            </button>
          </div>
        </div>

        {/* Trainers Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {(mode === "top"
            ? [...trainers].sort(
                (a, b) => Number(b.rating || 0) - Number(a.rating || 0),
              )
            : userLocation
            ? trainers
                .filter(
                  (t) =>
                    t.latitude !== undefined &&
                    t.longitude !== undefined &&
                    t.latitude !== null &&
                    t.longitude !== null,
                )
                .map((t) => ({
                  ...t,
                  distance: getDistance(
                    userLocation.lat,
                    userLocation.lng,
                    Number(t.latitude),
                    Number(t.longitude),
                  ),
                }))
                .sort((a, b) => a.distance - b.distance)
            : []
          )
            .slice(0, 3)
            .map((t) => (
              <div
                key={t.id}
                className="rounded-xl overflow-hidden border border-orange-400 shadow-sm bg-white"
              >
                {/* Image */}
                <div className="h-72 w-full bg-white overflow-hidden">
                  <img
                    src={t.profileImageUrl || "/images/default-avatar.png"}
                    alt={t.trainerName}
                    className="w-full h-full object-contain bg-white"
                  />
                </div>

                {/* Bottom Content */}
                <div className="p-4 flex justify-between items-start">
                  {/* Left */}
                  <div>
                    <h3 className="font-bold text-lg">
                      {t.firstName} {t.lastName}
                    </h3>

                    {/* ✅ CATEGORY TAGS LIKE INSTITUTES */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {t.category && (
                        <span className="px-3 py-1 text-xs border border-orange-400 text-orange-500 rounded-full">
                          {t.category}
                        </span>
                      )}

                      {t.subCategory && (
                        <span className="px-3 py-1 text-xs border border-orange-400 text-orange-500 rounded-full">
                          {t.subCategory}
                        </span>
                      )}
                    </div>
                    {t.distance && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t.distance.toFixed(1)} km away
                      </p>
                    )}
                  </div>

                  {/* Right */}
                  <button
                    onClick={() => navigate(`/trainers/${t.id}`)}
                    className="text-orange-500 font-semibold hover:underline"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* See More */}
        <div className="text-center mt-10">
          <button
            onClick={() => navigate("/trainers")}
            className="bg-orange-500 text-white px-8 py-3 rounded-md text-lg hover:bg-orange-600 transition"
          >
            See more
          </button>
        </div>
      </section>

      {/* ================================================= */}
      {/* ================= TOP INSTITUTES ================= */}
      {/* ================================================= */}

      {/* ================================================= */}
      {/* ================= TOP INSTITUTES ================= */}
      {/* ================================================= */}

      <section className="px-6 md:px-20 py-4 bg-gray-50">
        {/* Header + Filters */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-2">
          <h2 className="text-3xl md:text-4xl font-bold">Top Institutes</h2>

          <div className="flex gap-3">
            <button
              onClick={() => setInstituteMode("top")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                instituteMode === "top"
                  ? "bg-orange-500 text-white"
                  : "border border-orange-500 text-orange-500"
              }`}
            >
              <svg
                className="w-4 h-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.955a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.45a1 1 0 00-.364 1.118l1.287 3.955c.3.921-.755 1.688-1.538 1.118l-3.37-2.45a1 1 0 00-1.175 0l-3.37 2.45c-.783.57-1.838-.197-1.538-1.118l1.287-3.955a1 1 0 00-.364-1.118l-3.37-2.45c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.955z" />
              </svg>
              Top Rated
            </button>

            <button
              onClick={() => setInstituteMode("nearby")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                instituteMode === "nearby"
                  ? "bg-orange-500 text-white"
                  : "border border-orange-500 text-orange-500"
              }`}
            >
              <img
                src="/location-icon.png"
                className="w-4 h-4"
                alt="location"
              />
              Near Me
            </button>
          </div>
        </div>

        {/* Institutes Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {(instituteMode === "top"
            ? [...institutes].sort(
                (a, b) => Number(b.rating || 0) - Number(a.rating || 0),
              )
            : userLocation
            ? institutes
                .filter(
                  (i) =>
                    i.latitude !== undefined &&
                    i.longitude !== undefined &&
                    i.latitude !== null &&
                    i.longitude !== null,
                )
                .map((i) => ({
                  ...i,
                  distance: getDistance(
                    userLocation.lat,
                    userLocation.lng,
                    Number(i.latitude),
                    Number(i.longitude),
                  ),
                }))
                .sort((a, b) => a.distance - b.distance)
            : []
          )
            .slice(0, 3)
            .map((i) => (
              <div
                key={i.id}
                className="bg-white rounded-2xl overflow-hidden shadow-md border border-orange-400 hover:shadow-xl transition"
              >
                {/* Image */}
                <div className="h-64 w-full overflow-hidden bg-white">
                  <img
                    src={
                      i.profileImageUrl && !i.profileImageUrl.endsWith(".mp4")
                        ? i.profileImageUrl
                        : "/images/default-institute.png"
                    }
                    alt={i.instituteName}
                    className="w-full h-full object-contain bg-white"
                  />
                </div>

                {/* Content */}
                <div className="p-4 flex justify-between items-start">
                  {/* Left Side */}
                  <div>
                    <h3 className="font-bold text-lg">{i.instituteName}</h3>

                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <img
                        src="/location-icon.png"
                        className="w-4 h-4"
                        alt="location"
                      />
                      {i.city || "Unknown"}, {i.state || ""}
                    </p>

                    {i.distance && (
                      <p className="text-xs text-gray-500 mt-1">
                        {i.distance.toFixed(1)} km away
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {i.category && (
                        <span className="px-3 py-1 text-xs border border-orange-400 text-orange-500 rounded-full">
                          {i.category}
                        </span>
                      )}
                      {i.subCategory && (
                        <span className="px-3 py-1 text-xs border border-orange-400 text-orange-500 rounded-full">
                          {i.subCategory}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Side Button */}
                  <button
                    onClick={() => navigate(`/institutes/${i.id}`)}
                    className="text-orange-500 font-semibold hover:underline"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* See More Button */}
        <div className="flex justify-center mt-10">
          <button
            onClick={() => navigate("/institutes")}
            className="bg-orange-500 text-white px-8 py-3 rounded-md hover:bg-orange-600 transition"
          >
            See More
          </button>
        </div>
      </section>
      {/* ================= FULLSCREEN REEL VIEWER ================= */}
      <section className="py-10 sm:py-10 md:py-14 px-4 sm:px-6 md:px-12 lg:px-16 bg-gray-50 overflow-hidden pb-10 md:pb-16">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
            Trending Reels & Training Videos 🎥
          </h2>
        </div>

        {/* Reels Row */}
        <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {reels.slice(0, 3).map((r, index) => (
            <motion.div
              key={r.reelId}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                navigate(`/reels/${index}`, {
                  state: { reels },
                });
              }}
              className="snap-start shrink-0 w-[78vw] xs:w-[72vw] sm:w-[320px] md:w-[340px] lg:w-[360px] rounded-3xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
            >
              {/* Video */}
              <div className="relative h-[420px] sm:h-[460px] md:h-[500px] bg-black">
                <video
                  src={r.videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />

                {/* Subtle bottom gradient (professional look, no icons) */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                  <p className="text-white font-semibold text-sm sm:text-base line-clamp-2">
                    {r.title || "Training Reel"}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================================================= */}
      {/* ================= SPOTLIGHT REELS ================ */}
      {/* ================================================= */}
    </div>
  );
};

export default Landing;
