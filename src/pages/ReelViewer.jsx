// Mobile-first Instagram/TikTok style Reel Viewer
// Replace full ReelViewer.jsx with this code

import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  UserCheck,
  Eye,
  ArrowLeft,
  ThumbsDown,
} from "lucide-react";

import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

const ReelViewer = () => {
  const { index } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [reels, setReels] = useState(location.state?.reels || []);
  const [activeIndex, setActiveIndex] = useState(Number(index) || 0);
  const [loading, setLoading] = useState(true);

  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [liked, setLiked] = useState(false);

  const [dislikes, setDislikes] = useState(0);
  const [disliked, setDisliked] = useState(false);

  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const user = auth.currentUser;

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const reel =
    reels.length > 0 && reels[activeIndex] ? reels[activeIndex] : null;

  /* ================= FETCH REELS ================= */
  // REPLACE FULL fetchReels FUNCTION WITH THIS

  // REPLACE YOUR EXISTING FETCH REELS SECTION + USEEFFECT CALLS WITH THIS
  // This fixes: showing "Unknown Institute" / old location.state reels data / missing names

  /* ================= FETCH REELS ================= */
  const fetchReels = async () => {
    try {
      setLoading(true);

      const trainerSnap = await getDocs(collection(db, "trainers"));
      const instituteSnap = await getDocs(collection(db, "institutes"));

      let allReels = [];

      /* ===== TRAINERS ===== */
      trainerSnap.forEach((docu) => {
        const data = docu.data();

        const ownerName =
          data.trainerName ||
          data.name ||
          data.firstName ||
          data.displayName ||
          data.userName ||
          "Trainer";

        const ownerPhoto =
          data.profileImageUrl || data.profileImage || data.photoURL || "";

        if (Array.isArray(data.reels)) {
          data.reels.forEach((videoUrl, idx) => {
            if (videoUrl) {
              allReels.push({
                reelId: `trainer_${docu.id}_${idx}`,
                videoUrl,
                title: ownerName,
                ownerName,
                ownerPhoto,
                ownerId: docu.id,
                type: "trainer",
              });
            }
          });
        }
      });

      /* ===== INSTITUTES ===== */
      instituteSnap.forEach((docu) => {
        const data = docu.data();

        const ownerName =
          data.instituteName ||
          data.name ||
          data.fullName ||
          data.displayName ||
          data.userName ||
          "Institute";

        const ownerPhoto =
          data.profileImageUrl || data.profileImage || data.photoURL || "";

        if (Array.isArray(data.reels)) {
          data.reels.forEach((videoUrl, idx) => {
            if (videoUrl) {
              allReels.push({
                reelId: `institute_${docu.id}_${idx}`,
                videoUrl,
                title: ownerName,
                ownerName,
                ownerPhoto,
                ownerId: docu.id,
                type: "institute",
              });
            }
          });
        }
      });

      setReels(allReels);
      setActiveIndex(Number(index) || 0);
      setLoading(false);
    } catch (error) {
      console.error("Fetch reels error:", error);
      setLoading(false);
    }
  };

  /* ================= IMPORTANT ================= */
  /* DELETE your old location.state useEffect */
  /* DELETE your duplicate fetchReels useEffect */

  /* KEEP ONLY THIS ONE */
  useEffect(() => {
    fetchReels();
  }, [index]);
  // REPLACE ONLY THIS useEffect BLOCK

  useEffect(() => {
    // hide page scroll
    document.body.style.overflow = "hidden";

    // hide bottom navbar (if your navbar uses these selectors)
    const nav =
      document.querySelector("nav") ||
      document.querySelector(".bottom-navbar") ||
      document.getElementById("bottom-navbar");

    if (nav) {
      nav.style.display = "none";
    }

    return () => {
      document.body.style.overflow = "auto";

      if (nav) {
        nav.style.display = "";
      }
    };
  }, []);

  /* ================= REEL VIEW COUNT ================= */
  useEffect(() => {
    if (!reel || !user) return;

    const run = async () => {
      const viewRef = doc(db, "reelViews", `${reel.reelId}_${user.uid}`);
      const reelRef = doc(db, "reels", reel.reelId);

      const viewSnap = await getDoc(viewRef);

      if (!viewSnap.exists()) {
        await setDoc(viewRef, {
          reelId: reel.reelId,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });

        const reelSnap = await getDoc(reelRef);

        if (!reelSnap.exists()) {
          await setDoc(reelRef, {
            views: 1,
            likes: 0,
            dislikes: 0,
          });
          setViews(1);
        } else {
          const total = (reelSnap.data().views || 0) + 1;
          await updateDoc(reelRef, { views: total });
          setViews(total);
        }
      } else {
        const reelSnap = await getDoc(reelRef);
        if (reelSnap.exists()) setViews(reelSnap.data().views || 0);
      }
    };

    run();
  }, [reel]);

  /* ================= LIKE/DISLIKE LOAD ================= */
  useEffect(() => {
    if (!reel || !user) return;

    const load = async () => {
      const reelRef = doc(db, "reels", reel.reelId);
      const likeRef = doc(db, "reelLikes", `${reel.reelId}_${user.uid}`);
      const dislikeRef = doc(db, "reelDislikes", `${reel.reelId}_${user.uid}`);

      const reelSnap = await getDoc(reelRef);
      const likeSnap = await getDoc(likeRef);
      const dislikeSnap = await getDoc(dislikeRef);

      if (reelSnap.exists()) {
        setLikes(reelSnap.data().likes || 0);
        setDislikes(reelSnap.data().dislikes || 0);
      }

      setLiked(likeSnap.exists());
      setDisliked(dislikeSnap.exists());
    };

    load();
  }, [reel]);

  /* ================= COMMENTS ================= */
  useEffect(() => {
    if (!reel) return;

    const q = query(
      collection(db, "reelComments", reel.reelId, "comments"),
      orderBy("createdAt", "asc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      setComments(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      );
    });

    return () => unsub();
  }, [reel]);

  /* ================= FOLLOW ================= */
  useEffect(() => {
    if (!user || !reel) return;

    const followRef = doc(db, "followers", `${user.uid}_${reel.ownerId}`);

    const unsub = onSnapshot(followRef, (snap) => {
      setIsFollowing(snap.exists());
    });

    return () => unsub();
  }, [reel]);

  /* ================= ACTIONS ================= */
  const toggleLike = async () => {
    if (!user) return;

    const likeRef = doc(db, "reelLikes", `${reel.reelId}_${user.uid}`);
    const reelRef = doc(db, "reels", reel.reelId);
    const snap = await getDoc(reelRef);

    const current = snap.data()?.likes || 0;

    if (liked) {
      await deleteDoc(likeRef);
      await updateDoc(reelRef, { likes: Math.max(current - 1, 0) });
      setLikes(Math.max(current - 1, 0));
      setLiked(false);
    } else {
      await setDoc(likeRef, { reelId: reel.reelId, userId: user.uid });
      await updateDoc(reelRef, { likes: current + 1 });
      setLikes(current + 1);
      setLiked(true);
    }
  };

  const toggleDislike = async () => {
    if (!user) return;

    const dislikeRef = doc(db, "reelDislikes", `${reel.reelId}_${user.uid}`);
    const reelRef = doc(db, "reels", reel.reelId);
    const snap = await getDoc(reelRef);

    const current = snap.data()?.dislikes || 0;

    if (disliked) {
      await deleteDoc(dislikeRef);
      await updateDoc(reelRef, { dislikes: Math.max(current - 1, 0) });
      setDislikes(Math.max(current - 1, 0));
      setDisliked(false);
    } else {
      await setDoc(dislikeRef, { reelId: reel.reelId, userId: user.uid });
      await updateDoc(reelRef, { dislikes: current + 1 });
      setDislikes(current + 1);
      setDisliked(true);
    }
  };

  const followProfile = async () => {
    if (!user || followLoading) return;

    setFollowLoading(true);

    await setDoc(doc(db, "followers", `${user.uid}_${reel.ownerId}`), {
      followerId: user.uid,
      profileId: reel.ownerId,
      createdAt: serverTimestamp(),
    });

    setFollowLoading(false);
  };

  const unfollowProfile = async () => {
    if (!user || followLoading) return;

    setFollowLoading(true);

    await deleteDoc(doc(db, "followers", `${user.uid}_${reel.ownerId}`));

    setFollowLoading(false);
  };

  const sendComment = async () => {
    if (!user || !commentText.trim()) return;

    await addDoc(collection(db, "reelComments", reel.reelId, "comments"), {
      userId: user.uid,
      userName: user.displayName || user.email || "User",
      text: commentText,
      createdAt: serverTimestamp(),
    });

    setCommentText("");
  };

  /* ================= TOUCH ================= */
  const onTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    const endY = e.changedTouches[0].clientY;
    const endX = e.changedTouches[0].clientX;

    const diffY = touchStartY.current - endY;
    const diffX = touchStartX.current - endX;

    // swipe left/right = back page
    if (Math.abs(diffX) > 80 && Math.abs(diffX) > Math.abs(diffY)) {
      navigate(-1);
      return;
    }

    // swipe up/down = next/prev reel
    if (diffY > 80) {
      setActiveIndex((prev) => (prev + 1 >= reels.length ? 0 : prev + 1));
    }

    if (diffY < -80) {
      setActiveIndex((prev) => (prev - 1 < 0 ? reels.length - 1 : prev - 1));
    }
  };

  if (loading || !reel) {
    return (
      <div className="w-screen h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="fixed inset-0 z-[99999] bg-black overflow-hidden"
    >
      {/* VIDEO */}
      <AnimatePresence mode="wait">
        <motion.video
          key={reel.reelId}
          src={reel.videoUrl}
          autoPlay
          muted={false}
          playsInline
          loop
          controls={false}
          initial={{ opacity: 0.5, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.5 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 w-full h-full object-contain bg-black"
        />
      </AnimatePresence>

      {/* TOP */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={() => navigate(-1)}
          className="text-white bg-black/40 p-2 rounded-full"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-white text-sm flex items-center gap-1">
          <Eye size={16} />
          {views}
        </div>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="absolute right-3 bottom-28 flex flex-col gap-5 items-center text-white">
        <button onClick={toggleLike}>
          <Heart
            size={28}
            fill={liked ? "white" : "none"}
            className={liked ? "text-red-500" : "text-white"}
          />
          <p className="text-xs">{likes}</p>
        </button>

        <button onClick={toggleDislike}>
          <ThumbsDown
            size={26}
            className={disliked ? "text-red-500" : "text-white"}
          />
          <p className="text-xs">{dislikes}</p>
        </button>

        <button onClick={() => setShowComments(true)}>
          <MessageCircle size={28} />
          <p className="text-xs">{comments.length}</p>
        </button>

        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
        >
          <Share2 size={26} />
        </button>
      </div>

      {/* BOTTOM INFO */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
        <div className="flex items-center gap-3 mb-3">
          {/* PROFILE PHOTO */}
          {reel.ownerPhoto ? (
            <img
              src={reel.ownerPhoto}
              alt="owner"
              className="w-11 h-11 rounded-full object-cover border border-white"
            />
          ) : (
            <img
              src={reel.profileImage || "/default-user.png"}
              alt="profile"
              className="w-10 h-10 rounded-full object-cover border border-white"
            />
          )}

          {/* OWNER NAME */}

          <span className="text-sm font-semibold">{reel.title}</span>

          {/* FOLLOW BUTTON */}
          {!isFollowing ? (
            <button
              onClick={followProfile}
              disabled={followLoading}
              className="bg-orange-500 px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              <UserPlus size={14} />
              Follow
            </button>
          ) : (
            <button
              onClick={unfollowProfile}
              disabled={followLoading}
              className="bg-white text-black px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              <UserCheck size={14} />
              Following
            </button>
          )}
        </div>

        <button
          onClick={() =>
            navigate(
              reel.type === "trainer"
                ? `/trainers/${reel.ownerId}`
                : `/institutes/${reel.ownerId}`,
            )
          }
          className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold"
        >
          View Profile
        </button>
      </div>
      {/* COMMENTS */}
      {showComments && (
        <div className="absolute inset-0 bg-black/60 flex items-end z-50">
          <div className="bg-white w-full h-[70vh] rounded-t-3xl flex flex-col">
            <div className="p-4 border-b flex justify-between">
              <h2 className="font-semibold">Comments</h2>
              <button onClick={() => setShowComments(false)}>✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.map((c) => (
                <div key={c.id}>
                  <p className="font-semibold text-sm">{c.userName}</p>
                  <p className="text-sm text-gray-700">{c.text}</p>
                </div>
              ))}
            </div>

            <div className="p-3 border-t flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add comment..."
                className="flex-1 border rounded-full px-4 py-2 outline-none"
              />

              <button
                onClick={sendComment}
                className="bg-orange-500 text-white px-4 rounded-full"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelViewer;
