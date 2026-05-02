import React, { useEffect, useState } from "react";
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
    onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function SuggestedPage() {

    const [profiles, setProfiles] = useState([]);
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [followingIds, setFollowingIds] = useState([]);
    const [reactionMap, setReactionMap] = useState({});
    const [likeCounts, setLikeCounts] = useState({});
    const [dislikeCounts, setDislikeCounts] = useState({});
    const [commentCounts, setCommentCounts] = useState({});
    const [showCommentsFor, setShowCommentsFor] = useState(null);
    const [commentsList, setCommentsList] = useState([]);
    const [commentText, setCommentText] = useState("");

    useEffect(() => {

        const loadData = async () => {

            const trainerSnap = await getDocs(collection(db, "trainers"));
            const instituteSnap = await getDocs(collection(db, "institutes"));

            const trainers = trainerSnap.docs.map(doc => ({
                id: doc.id,
                type: "trainer",
                ...doc.data()
            }));

            const institutes = instituteSnap.docs.map(doc => ({
                id: doc.id,
                type: "institute",
                ...doc.data()
            }));

            setProfiles([...trainers, ...institutes]);

        };

        loadData();

    }, []);
    useEffect(() => {
        const auth = getAuth();
        return onAuthStateChanged(auth, setUser);
    }, []);
    useEffect(() => {

        if (!user) return;

        const loadFollowing = async () => {

            const snap = await getDocs(collection(db, "followers"));

            const ids = snap.docs
                .map(d => d.data())
                .filter(x => x.followerId === user.uid)
                .map(x => x.profileId);

            setFollowingIds(ids);

        };

        loadFollowing();

    }, [user]);
    useEffect(() => {

        const unsubs = profiles.map(item => {

            const mainCol = item.type === "trainer"
                ? "trainers"
                : "institutes";

            return onSnapshot(
                doc(db, mainCol, item.id),
                (snap) => {

                    const data = snap.data();

                    setLikeCounts(p => ({
                        ...p,
                        [item.id]: data?.likeCount || 0
                    }));

                    setDislikeCounts(p => ({
                        ...p,
                        [item.id]: data?.dislikeCount || 0
                    }));



                }
            );

        });

        return () => unsubs.forEach(u => u());

    }, [profiles]);
    const handleFollow = async (profileId) => {
        if (!user) return;

        const id = `${user.uid}_${profileId}`;
        const ref = doc(db, "followers", id);

        const snap = await getDoc(ref);

        if (snap.exists()) return;

        await setDoc(ref, {
            followerId: user.uid,
            profileId,
            createdAt: serverTimestamp()
        });

        setFollowingIds(prev => [...prev, profileId]);
    };
    const handleReaction = async (item, type) => {

        if (!user) return alert("Login first");

        const mainCol = item.type === "trainer"
            ? "trainers"
            : "institutes";

        const reactionRef = doc(
            db,
            mainCol,
            item.id,
            "reactions",
            user.uid
        );

        const snap = await getDoc(reactionRef);
        const oldType = snap.exists() ? snap.data().type : null;

        if (oldType === type) {
            await deleteDoc(reactionRef);
            setReactionMap(p => ({ ...p, [item.id]: null }));
        } else {
            await setDoc(reactionRef, {
                uid: user.uid,
                type,
                createdAt: serverTimestamp()
            });

            setReactionMap(p => ({ ...p, [item.id]: type }));
        }

        const allSnap = await getDocs(
            collection(db, mainCol, item.id, "reactions")
        );

        let likes = 0;
        let dislikes = 0;

        allSnap.forEach(d => {
            if (d.data().type === "like") likes++;
            if (d.data().type === "dislike") dislikes++;
        });

        setLikeCounts(p => ({ ...p, [item.id]: likes }));
        setDislikeCounts(p => ({ ...p, [item.id]: dislikes }));

    };
    const openComments = async (item) => {

        const mainCol = item.type === "trainer"
            ? "trainers"
            : "institutes";

        const snap = await getDocs(
            collection(db, mainCol, item.id, "comments")
        );

        const list = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        setCommentsList(list);
        setShowCommentsFor(item);

    };

    const submitComment = async (item) => {

        if (!user) return;
        if (!commentText.trim()) return;

        const mainCol = item.type === "trainer"
            ? "trainers"
            : "institutes";

        await addDoc(
            collection(db, mainCol, item.id, "comments"),
            {
                name: user.displayName || "User",
                text: commentText,
                createdAt: serverTimestamp()
            }
        );

        await updateDoc(
            doc(db, mainCol, item.id),
            {
                commentCount: increment(1)
            }
        );

        await openComments(item);

        setCommentText("");

    };
    return (
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 md:px-8 py-6 bg-gray-50 min-h-screen overflow-x-hidden">

         
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">

                {profiles.map((item) => (

                    <div
                        key={item.id}
                        className="w-full max-w-full bg-white rounded-xl shadow-sm border overflow-hidden"
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
                                        {item.type === "trainer"
                                            ? `${item.firstName || ""} ${item.lastName || ""}`
                                            : item.instituteName}
                                    </p>

                                    <p className="text-xs text-gray-500">
                                        {item.subCategory || item.category}
                                    </p>
                                </div>

                            </div>
                            <button
                                onClick={() => handleFollow(item.id)}
                                disabled={followingIds.includes(item.id)}
                                className={`text-xs px-3 py-1 rounded-full ${followingIds.includes(item.id)
                                    ? "bg-gray-200 text-gray-600"
                                    : "bg-orange-500 text-white"
                                    }`}
                            >
                                {followingIds.includes(item.id)
                                    ? "Following"
                                    : "Follow"}
                            </button>
                        </div>

                        {/* IMAGE SAME SIZE AS LANDING */}
                        <div
                            onClick={() => navigate(
                                item.type === "trainer"
                                    ? `/trainers/${item.id}`
                                    : `/institutes/${item.id}`
                            )}
                           className="w-full h-48 sm:h-56 md:h-60 lg:h-64 bg-gray-100 overflow-hidden rounded-lg cursor-pointer"
                        >
                            <img
                                src={item.profileImageUrl || "/images/default-avatar.png"}
                                className="w-full h-full object-contain bg-gray-100"
                            />
                        </div>

                        {/* ACTION ROW SAME */}
                        <div className="flex items-center gap-4 px-3 py-2 text-lg">
                            <button
                                onClick={() => handleReaction(item, "like")}
                                className="flex items-center gap-1"
                            >
                                👍 <span className="text-xs">{likeCounts[item.id] || 0}</span>
                            </button>

                            <button
                                onClick={() => handleReaction(item, "dislike")}
                                className="flex items-center gap-1"
                            >
                                👎 <span className="text-xs">{dislikeCounts[item.id] || 0}</span>
                            </button>

                            <button
                                onClick={() => openComments(item)}
                                className="flex items-center gap-1"
                            >
                                💬
                                <span className="text-xs">
                                    {commentCounts[item.id] || 0}
                                </span>
                            </button>
                        </div>
                        {showCommentsFor?.id === item.id && (

                            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">

                               <div className="bg-white w-[95vw] sm:w-[560px] rounded-3xl shadow-xl mx-2">

                                    <div className="p-5 border-b flex justify-between items-center">
                                        <h3 className="text-2xl font-semibold">
                                            Comments ({commentCounts[item.id] || 0})
                                        </h3>

                                        <button
                                            onClick={() => setShowCommentsFor(null)}
                                            className="text-3xl text-gray-500"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="p-5 max-h-[220px] overflow-y-auto">
                                        {commentsList.length === 0 ? (
                                            <p className="text-center text-gray-500">
                                                No comments yet
                                            </p>
                                        ) : (
                                            commentsList.map(c => (
                                                <div
                                                    key={c.id}
                                                    className="border rounded-2xl p-4 mb-3"
                                                >
                                                    <p className="font-medium">
                                                        {c.name}
                                                    </p>

                                                    <p>{c.text}</p>

                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="border-t p-4 flex gap-3">
                                        <input
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Write a comment..."
                                            className="flex-1 border rounded-full px-4 py-3"
                                        />

                                        <button
                                            onClick={() => submitComment(item)}
                                            className="bg-orange-500 text-white px-6 rounded-full"
                                        >
                                            Send
                                        </button>
                                    </div>

                                </div>

                            </div>

                        )}
                        <div className="px-3 pb-3 text-xs text-gray-600">
                            Rated {item.rating || 0} ⭐
                        </div>

                    </div>

                ))}

            </div>
        </div>
    );

}

export default SuggestedPage;