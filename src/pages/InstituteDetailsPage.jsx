// src/pages/InstituteDetailsPage.jsx
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
  Eye,
  Share2,
  Phone,
  Users,
  Trophy,
  Award,
  Briefcase,
} from "lucide-react";
import { motion } from "framer-motion";

export default function InstituteDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [inst, setInst] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [mediaPosts, setMediaPosts] = useState([]);
  // ================= FETCH MEDIA FROM FIREBASE =================

  const [pageLoading, setPageLoading] = useState(true);

  // ================= FETCH INSTITUTE =================
  // ================= REPLACE ONLY loadData useEffect =================

  useEffect(() => {
    const loadData = async () => {
      try {
        setPageLoading(true);

        const ref = doc(db, "institutes", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setInst({});
          setMediaPosts([]);
          return;
        }

        const data = { id: snap.id, ...snap.data() };
        setInst(data);

        const posts = [];

        // =========================================
        // FETCH TRAINING IMAGES
        // supports:
        // old => ["url1","url2"]
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
            id: `post_${id}_img_${i}`, // KEEP SAME SYSTEM
            postId: `post_${id}_img_${i}`,
            ownerId: id,
            ownerType: "institute",
            type: "image",
            url,
            title: about || "Training Session",
          });
        });

        // =========================================
        // FETCH REELS
        // supports:
        // old => ["url.mp4"]
        // new => [{url,about}]
        // =========================================
        const reels = data.reels || [];

        reels.forEach((item, i) => {
          const url = typeof item === "string" ? item : item?.url;
          const about = typeof item === "string" ? "" : item?.about || "";

          if (!url) return;

          posts.push({
            id: `institute_${id}_${i}`, // KEEP SAME REEL ID SYSTEM
            reelId: `institute_${id}_${i}`,
            ownerId: id,
            ownerType: "institute",
            type: "video",
            url,
            title: about || "",
          });
        });

        setMediaPosts(posts);
      } catch (error) {
        console.log(error);
        setInst({});
        setMediaPosts([]);
      } finally {
        setPageLoading(false);
      }
    };

    if (id) loadData();
  }, [id]);
  // ================= LOADING FIX =================

  // ================= VIEW SAVE =================
  const handleView = async () => {
    if (!user) {
      setOpenPreview(true);
      return;
    }

    try {
      if (isReel) {
        const docId = `${itemId}_${user.uid}`;

        await setDoc(
          doc(db, "reelViews", docId),
          {
            reelId: itemId,
            userId: user.uid,
            createdAt: serverTimestamp(),
          },
          { merge: true }, // duplicate safe
        );
      } else {
        const docId = `${itemId}_${user.uid}`;

        await setDoc(
          doc(db, "postviews", docId),
          {
            postId: itemId,
            userId: user.uid,
            createdAt: serverTimestamp(),
          },
          { merge: true }, // duplicate safe
        );
      }
    } catch (error) {
      console.log(error);
    }

    setOpenPreview(true);
  };

  // ================= LIKE TOGGLE =================
  const toggleLike = async (postId) => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    const likeId = `${postId}_${user.uid}`;
    const likeRef = doc(db, "postlikes", likeId);

    const q = query(
      collection(db, "postlikes"),
      where("__name__", "==", likeId),
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      await deleteDoc(likeRef);
    } else {
      await setDoc(likeRef, {
        postId,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    }
  };
  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "institutes", id));
      if (snap.exists()) setInst({ id: snap.id, ...snap.data() });
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const q = query(collection(db, "followers"), where("profileId", "==", id));

    const unsub = onSnapshot(q, (snap) => {
      setFollowersCount(snap.size);
    });

    return () => unsub();
  }, [id]);

  const startChat = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please login first");
      return;
    }

    const chatId = [user.uid, inst.id].sort().join("_");

    await setDoc(
      doc(db, "chats", chatId),
      {
        type: "institute",
        members: [user.uid, inst.id],
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );

    navigate(`/chat/${chatId}`);
  };

  if (!inst) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    `${inst.city || "Bengaluru"}, ${inst.state || "Karnataka"}`,
  )}&output=embed`;
  if (pageLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#FF6B00] border-t-transparent"></div>
      </div>
    );
  }

  // ================= NO DATA =================
  if (!inst || Object.keys(inst).length === 0) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-500">
        No Institute Found
      </div>
    );
  }
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

        {/* PROFILE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm p-4"
        >
          <div className="flex items-start gap-3">
            <img
              src={
                inst.profileImageUrl ||
                "https://via.placeholder.com/100x100.png?text=Profile"
              }
              alt=""
              className="w-16 h-16 rounded-full object-cover"
            />

            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">
                {inst.instituteName || "Vivek Vardhan"}
              </h1>
              <p className="text-sm text-gray-500">
                {inst.category || "Cricketer"}
              </p>
            </div>

            <div className="bg-orange-50 text-[#FF6B00] text-[10px] px-2 py-1 rounded-full font-semibold">
              LIC-2345
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <button
              onClick={startChat}
              className="border border-[#FF6B00] text-[#FF6B00] py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1"
            >
              <MessageCircle size={15} />
              Chat
            </button>

            <a
              href={`tel:${inst.phoneNumber || "9999999999"}`}
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
              value={`${inst.customers?.length || 100}+`}
            />
            <StatCard
              icon={Heart}
              label="Followers"
              value={`${followersCount || 1000}+`}
            />
            <StatCard icon={Trophy} label="Awards" value="20+" />
            <StatCard icon={Briefcase} label="Exp" value="5Y" />
          </div>
        </motion.div>

        {/* MAP */}
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
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry's standard dummy text.
          </div>
        </Section>

        {/* ACHIEVEMENTS */}
        <Section title="Achievements">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <AchievementRow title="District" g="5" s="3" b="2" />
            <AchievementRow title="State" g="3" s="2" b="1" />
            <AchievementRow title="National" g="1" s="1" b="0" />
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
                <MediaCard
                  key={post.id}
                  post={post}
                  onLike={toggleLike}
                  onView={handleView}
                />
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */
// 🔥 USE THIS MediaCard
// Reel save format fixed:
// institute_{profileId}_{index}_{loginUserId}
// trainer_{profileId}_{index}_{loginUserId}

function MediaCard({ post }) {
  const isReel = post.type === "video";
  const [openPreview, setOpenPreview] = useState(false);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [comments, setComments] = useState(0);
  const [liked, setLiked] = useState(false);

  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentList, setCommentList] = useState([]);

  const user = auth.currentUser;

  const itemId = post.id;
  // ===================================================
  // MAKE CLEAN REEL ID
  // ===================================================
  // Need post.ownerType = institute / trainer
  // Need post.ownerId = profile id
  // Need post.index = reel index

  // ===================================================
  // FETCH COUNTS
  // ===================================================
  useEffect(() => {
    let unsub1, unsub2, unsub3;

    if (isReel) {
      // LIKE
      const q1 = query(
        collection(db, "reelLikes"),
        where("reelId", "==", itemId),
      );

      unsub1 = onSnapshot(q1, (snap) => {
        setLikes(snap.size);

        if (user) {
          setLiked(snap.docs.some((d) => d.data().userId === user.uid));
        }
      });

      // VIEW
      const q2 = query(
        collection(db, "reelViews"),
        where("reelId", "==", itemId),
      );

      unsub2 = onSnapshot(q2, (snap) => {
        setViews(snap.size);
      });

      // COMMENT
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
      // IMAGE LIKE
      const q1 = query(
        collection(db, "postlikes"),
        where("postId", "==", itemId),
      );

      unsub1 = onSnapshot(q1, (snap) => {
        setLikes(snap.size);

        if (user) {
          setLiked(snap.docs.some((d) => d.data().userId === user.uid));
        }
      });

      // IMAGE VIEW
      const q2 = query(
        collection(db, "postviews"),
        where("postId", "==", itemId),
      );

      unsub2 = onSnapshot(q2, (snap) => {
        setViews(snap.size);
      });

      // IMAGE COMMENT
      const q3 = query(
        collection(db, "postcomments"),
        where("postId", "==", itemId),
      );

      unsub3 = onSnapshot(q3, (snap) => {
        setComments(snap.size);

        setCommentList(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })),
        );
      });
    }

    return () => {
      unsub1 && unsub1();
      unsub2 && unsub2();
      unsub3 && unsub3();
    };
  }, [itemId]);

  // ===================================================
  // LIKE
  // ===================================================
  const handleLike = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    if (isReel) {
      const docId = `${itemId}_${user.uid}`;

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
      const docId = `${itemId}_${user.uid}`;

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

  // ===================================================
  // VIEW
  // ===================================================
  const handleView = async () => {
    if (!user) return;

    if (isReel) {
      const docId = `${itemId}_${user.uid}`;

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
      const docId = `${itemId}_${user.uid}`;

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

  // ===================================================
  // COMMENT
  // ===================================================
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

  // ================= REPLACE ONLY MediaCard RETURN =================

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isReel ? (
          <video
            src={post.url}
            controls
            onPlay={handleView}
            onClick={handleView}
            className="w-full h-56 object-cover cursor-pointer"
          />
        ) : (
          <img
            src={post.url}
            alt=""
            onClick={handleView}
            className="w-full h-56 object-cover cursor-pointer"
          />
        )}

        {/* ABOUT TEXT */}
        {post.title && (
          <div className="px-4 pt-3">
            <p className="text-sm sm:text-base text-gray-800 leading-6 break-words whitespace-pre-wrap">
              {post.title}
            </p>
          </div>
        )}

        <div className="p-4">
          <div className="flex justify-between text-sm text-gray-500">
            <button
              onClick={handleLike}
              className={`flex gap-1 items-center ${
                liked ? "text-red-500" : ""
              }`}
            >
              <Heart size={17} fill={liked ? "currentColor" : "none"} />
              {likes}
            </button>

            <div className="flex gap-1 items-center">
              <Eye size={17} />
              {views}
            </div>

            <button
              onClick={() => setShowCommentBox(!showCommentBox)}
              className="flex gap-1 items-center"
            >
              <MessageCircle size={17} />
              {comments}
            </button>
          </div>

          {showCommentBox && (
            <div className="mt-3">
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 border px-3 py-2 rounded-lg text-sm"
                  placeholder="Write comment..."
                />

                <button
                  onClick={sendComment}
                  className="bg-[#FF6B00] text-white px-4 rounded-lg"
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL SCREEN PREVIEW */}
      {openPreview && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-3">
          <button
            onClick={() => setOpenPreview(false)}
            className="absolute top-4 right-4 text-white text-3xl"
          >
            ✕
          </button>

          <div className="w-full max-w-md">
            {isReel ? (
              <video
                src={post.url}
                controls
                autoPlay
                className="w-full max-h-[80vh] object-contain rounded-2xl"
              />
            ) : (
              <img
                src={post.url}
                alt=""
                className="w-full max-h-[80vh] object-contain rounded-2xl"
              />
            )}

            {post.title && (
              <div className="mt-4 bg-white rounded-2xl p-4">
                <p className="text-sm sm:text-base text-gray-800 leading-6 break-words whitespace-pre-wrap">
                  {post.title}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
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

function AchievementRow({ title, g, s, b }) {
  return (
    <div className="grid grid-cols-4 py-2 border-b last:border-none text-sm">
      <div className="font-medium text-gray-700">{title}</div>
      <div className="text-yellow-500">🥇 {g}</div>
      <div className="text-gray-500">🥈 {s}</div>
      <div className="text-orange-700">🥉 {b}</div>
    </div>
  );
}
