// src/pages/TrainerDetailsPage.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Phone,
  Users,
  Trophy,
  Briefcase,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";

export default function TrainerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [mediaPosts, setMediaPosts] = useState([]);

  // ================= LOAD TRAINER =================
  // ================= LOAD TRAINER =================
  useEffect(() => {
    const loadTrainer = async () => {
      try {
        setPageLoading(true);

        const snap = await getDoc(doc(db, "trainers", id));

        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setTrainer(data);

          const posts = [];

          // =========================================
          // FETCH TRAINING IMAGES
          // old => ["url1"]
          // new => [{url,about}]
          // =========================================
          const trainingImages = data.trainingImages || [];
          const mediaTraining = data.mediaGallery?.trainingImages || [];

          const allImages = [...trainingImages, ...mediaTraining];

          allImages.forEach((item, i) => {
            const url = typeof item === "string" ? item : item?.url;
            const about = typeof item === "string" ? "" : item?.about || "";

            if (!url) return;

            posts.push({
              id: `post_${id}_img_${i}`,
              type: "image",
              url,
              title: about || "Training Photo",
            });
          });

          // =========================================
          // FETCH REELS
          // old => ["url.mp4"]
          // new => [{url,about}]
          // =========================================
          const reels = data.reels || [];

          reels.forEach((item, i) => {
            const url = typeof item === "string" ? item : item?.url;
            const about = typeof item === "string" ? "" : item?.about || "";

            if (!url) return;

            posts.push({
              id: `trainer_${id}_${i}`,
              type: "video",
              url,
              title: about || "Trainer Reel",
            });
          });

          setMediaPosts(posts);
        } else {
          setTrainer({});
          setMediaPosts([]);
        }
      } catch (error) {
        console.log(error);
        setTrainer({});
        setMediaPosts([]);
      } finally {
        setPageLoading(false);
      }
    };

    loadTrainer();
  }, [id]);

  // ================= FOLLOWERS =================
  useEffect(() => {
    const q = query(collection(db, "followers"), where("profileId", "==", id));

    const unsub = onSnapshot(q, (snap) => {
      setFollowersCount(snap.size);
    });

    return () => unsub();
  }, [id]);

  // ================= CHAT =================
  const startTrainerChat = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    const chatId = [user.uid, trainer.id].sort().join("_");

    await setDoc(
      doc(db, "chats", chatId),
      {
        type: "trainer",
        members: [user.uid, trainer.id],
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );

    navigate(`/chat/${chatId}`);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#FF6B00] border-t-transparent"></div>
      </div>
    );
  }

  if (!trainer || Object.keys(trainer).length === 0) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-500">
        No Trainer Found
      </div>
    );
  }

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    `${trainer.city || "Bengaluru"}, ${trainer.state || "Karnataka"}`,
  )}&output=embed`;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex justify-center px-3 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-6">
      <div className="w-full max-w-md">
        {/* BACK */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-[#FF6B00] font-medium"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* PROFILE */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-4"
        >
          <div className="flex items-start gap-3">
            <img
              src={
                trainer.profileImageUrl ||
                "https://via.placeholder.com/100x100.png?text=Profile"
              }
              className="w-16 h-16 rounded-full object-cover"
              alt=""
            />

            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">
                {trainer.trainerName ||
                  `${trainer.firstName || ""} ${trainer.lastName || ""}`}
              </h1>

              <p className="text-sm text-gray-500">
                {trainer.designation || "Trainer"}
              </p>
            </div>

            <div className="bg-orange-50 text-[#FF6B00] text-[10px] px-2 py-1 rounded-full font-semibold">
              PRO
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <button
              onClick={startTrainerChat}
              className="border border-[#FF6B00] text-[#FF6B00] py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
            >
              <MessageCircle size={15} />
              Chat
            </button>

            <a
              href={`tel:${trainer.phoneNumber || ""}`}
              className="border border-[#FF6B00] text-[#FF6B00] py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
            >
              <Phone size={15} />
              Call
            </a>

            <button className="bg-[#FF6B00] text-white py-2 rounded-xl text-sm font-semibold">
              Book Slot
            </button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            <StatCard
              icon={Users}
              label="Students"
              value={`${trainer.students?.length || 0}+`}
            />
            <StatCard
              icon={Heart}
              label="Followers"
              value={`${followersCount}+`}
            />
            <StatCard icon={Trophy} label="Awards" value="10+" />
            <StatCard
              icon={Briefcase}
              label="Exp"
              value={trainer.experience || "2Y"}
            />
          </div>
        </motion.div>

        {/* LOCATION */}
        <Section title="Location">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <iframe
              title="map"
              src={mapSrc}
              className="w-full h-52 border-0"
              loading="lazy"
            />
          </div>
        </Section>

        {/* ABOUT */}
        <Section title="About">
          <div className="bg-orange-50 rounded-2xl p-4 text-sm text-gray-600 leading-6">
            {trainer.about ||
              "Professional trainer helping students improve skills with structured coaching."}
          </div>
        </Section>

        {/* DETAILS */}
        <Section title="Trainer Details">
          <div className="bg-white rounded-2xl p-4 text-sm space-y-2">
            <p>
              <b>Category:</b> {trainer.category || "-"}
            </p>
            <p>
              <b>Sub Category:</b> {trainer.subCategory || "-"}
            </p>
            <p>
              <b>Email:</b> {trainer.email || "-"}
            </p>
            <p>
              <b>Phone:</b> {trainer.phoneNumber || "-"}
            </p>
            <p>
              <b>State:</b> {trainer.state || "-"}
            </p>
          </div>
        </Section>

        {/* MEDIA */}
        <Section title="Media & Gallery">
          {mediaPosts.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl text-center text-gray-400">
              No Media Available
            </div>
          ) : (
            <div className="space-y-4">
              {mediaPosts.map((post) => (
                <MediaCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

/* ================= MEDIA CARD ================= */
function MediaCard({ post }) {
  const isReel = post.type === "video";

  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [comments, setComments] = useState(0);
  const [liked, setLiked] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentList, setCommentList] = useState([]);

  const user = auth.currentUser;
  const itemId = post.id;

  // ================= FETCH COUNTS =================
  useEffect(() => {
    let unsub1, unsub2, unsub3;

    if (isReel) {
      // reel likes
      unsub1 = onSnapshot(
        query(collection(db, "reelLikes"), where("reelId", "==", itemId)),
        (snap) => {
          setLikes(snap.size);

          if (user) {
            setLiked(snap.docs.some((d) => d.data().userId === user.uid));
          }
        },
      );

      // reel views
      unsub2 = onSnapshot(
        query(collection(db, "reelViews"), where("reelId", "==", itemId)),
        (snap) => setViews(snap.size),
      );

      // reel comments
      unsub3 = onSnapshot(
        collection(db, "reelComments", itemId, "comments"),
        (snap) => {
          setComments(snap.size);

          setCommentList(
            snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })),
          );
        },
      );
    } else {
      // photo likes
      unsub1 = onSnapshot(
        query(collection(db, "postlikes"), where("postId", "==", itemId)),
        (snap) => {
          setLikes(snap.size);

          if (user) {
            setLiked(snap.docs.some((d) => d.data().userId === user.uid));
          }
        },
      );

      // photo views
      unsub2 = onSnapshot(
        query(collection(db, "postviews"), where("postId", "==", itemId)),
        (snap) => setViews(snap.size),
      );

      // photo comments
      unsub3 = onSnapshot(
        query(collection(db, "postcomments"), where("postId", "==", itemId)),
        (snap) => {
          setComments(snap.size);

          setCommentList(
            snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            })),
          );
        },
      );
    }

    return () => {
      unsub1 && unsub1();
      unsub2 && unsub2();
      unsub3 && unsub3();
    };
  }, [itemId]);

  // ================= LIKE =================
  const handleLike = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    const docId = `${itemId}_${user.uid}`;

    if (isReel) {
      const ref = doc(db, "reelLikes", docId);

      if (liked) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, {
          reelId: itemId,
          userId: user.uid,
        });
      }
    } else {
      const ref = doc(db, "postlikes", docId);

      if (liked) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, {
          postId: itemId,
          userId: user.uid,
        });
      }
    }
  };

  // ================= VIEW =================
  const handleView = async () => {
    if (!user) return;

    const docId = `${itemId}_${user.uid}`;

    if (isReel) {
      await setDoc(
        doc(db, "reelViews", docId),
        {
          reelId: itemId,
          userId: user.uid,
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      await setDoc(
        doc(db, "postviews", docId),
        {
          postId: itemId,
          userId: user.uid,
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
    }
  };

  // ================= COMMENT =================
  const sendComment = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    if (!commentText.trim()) return;

    if (isReel) {
      await addDoc(collection(db, "reelComments", itemId, "comments"), {
        text: commentText,
        userId: user.uid,
        userName: user.email || "User",
        createdAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, "postcomments"), {
        postId: itemId,
        text: commentText,
        userId: user.uid,
        userName: user.email || "User",
        createdAt: serverTimestamp(),
      });
    }

    setCommentText("");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {isReel ? (
        <video
          src={post.url}
          controls
          onPlay={handleView}
          className="w-full h-56 object-cover"
        />
      ) : (
        <img
          src={post.url}
          onClick={handleView}
          className="w-full h-56 object-cover"
          alt=""
        />
      )}

      <div className="p-4">
        {post.title && (
          <p className="text-sm text-gray-800 leading-6 break-words whitespace-pre-wrap mb-3">
            {post.title}
          </p>
        )}

        <div className="flex justify-between text-sm text-gray-500">
          {/* LIKE */}
          <button
            onClick={handleLike}
            className={`flex gap-1 items-center ${liked ? "text-red-500" : ""}`}
          >
            <Heart size={17} fill={liked ? "currentColor" : "none"} />
            {likes}
          </button>

          {/* VIEW */}
          <div className="flex gap-1 items-center">
            <Eye size={17} />
            {views}
          </div>

          {/* COMMENT */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex gap-1 items-center"
          >
            <MessageCircle size={17} />
            {comments}
          </button>
        </div>

        {/* COMMENT BOX */}
        {showComments && (
          <div className="mt-4 border-t pt-3">
            <div className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write comment..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />

              <button
                onClick={sendComment}
                className="bg-[#FF6B00] text-white px-4 rounded-lg text-sm"
              >
                Send
              </button>
            </div>

            <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
              {commentList.map((c) => (
                <div key={c.id} className="bg-gray-100 px-3 py-2 rounded-lg">
                  <p className="text-xs font-semibold">{c.userName}</p>
                  <p className="text-sm">{c.text}</p>
                </div>
              ))}

              {commentList.length === 0 && (
                <p className="text-xs text-gray-400">No comments yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= UI ================= */
function Section({ title, children }) {
  return (
    <div className="mt-5">
      <h2 className="text-sm font-bold text-gray-800 mb-3 px-1">{title}</h2>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-gray-100 rounded-xl p-2 text-center">
      <Icon size={16} className="mx-auto text-[#FF6B00] mb-1" />
      <p className="text-xs font-semibold text-gray-800">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}
