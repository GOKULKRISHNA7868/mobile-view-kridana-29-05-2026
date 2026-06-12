import React, { useState, useEffect, useRef } from "react";

import {
  ArrowLeft,
  Search,
  Phone,
  MoreVertical,
  Smile,
  Paperclip,
  Camera,
  Mic,
  Send,
} from "lucide-react";
import { db, auth } from "../../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayRemove,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
const ChatBox = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("chats");
  const [screen, setScreen] = useState("chat");
  const [showMenu, setShowMenu] = useState(false);

  const [user, setUser] = useState(null);
  const [instituteId, setInstituteId] = useState(null);

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showRecentChats, setShowRecentChats] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatName, setActiveChatName] = useState("");
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [renameValue, setRenameValue] = useState("");
  const [chatUsers, setChatUsers] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const getValidImage = (url, name) => {
    if (!url)
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    if (url.startsWith("blob:"))
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    return url;
  };

  /* ================= AUTH + INSTITUTE ================= */
  /* ================= AUTH + INSTITUTE (FIXED) ================= */
  /* ================= CHAT MEMBERS (OUTER USERS ONLY) ================= */
  /* ================= CHAT MEMBERS (OUTER USERS ONLY — MESSAGE FILTERED) ================= */
  /* ================= CHAT MEMBERS (OUTER USERS ONLY — MESSAGE FILTERED) ================= */
  /* ================= CHAT MEMBERS (OUTER / SOLO TRAINER / TRAINER STUDENT) ================= */
  /* ================= CHAT MEMBERS (OUTER / SOLO TRAINER / INSTITUTE / TRAINER STUDENT) ================= */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", user.uid),
    );

    const unsub = onSnapshot(q, async (snap) => {
      let validOuterUids = new Set();

      for (let d of snap.docs) {
        const chatId = d.id;

        const msgsSnap = await getDocs(
          query(
            collection(db, "chats", chatId, "messages"),
            orderBy("createdAt", "asc"),
          ),
        );

        msgsSnap.forEach((m) => {
          const msg = m.data();

          if (msg.senderId && msg.senderId !== user.uid) {
            validOuterUids.add(msg.senderId);
          }
        });
      }

      const externalUsers = [];

      for (let uid of validOuterUids) {
        if (users.find((u) => u.uid === uid)) continue;

        let found = null;

        /* ================= 1. USERS ================= */
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
          const data = userSnap.data();

          found = {
            uid,
            id: uid,
            name:
              data.name ||
              `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
              data.email ||
              "User",
            role: "outer",
            badge: "Outer",
            profileImageUrl: data.profileImage || data.profileImageUrl || "",
          };
        }

        /* ================= 2. TRAINER STUDENTS ================= */
        if (!found) {
          const tsSnap = await getDoc(doc(db, "trainerstudents", uid));

          if (tsSnap.exists()) {
            const data = tsSnap.data();

            found = {
              uid,
              id: uid,
              name:
                `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
                "Student",
              role: "outer",
              badge: "Outer",
              profileImageUrl: data.profileImageUrl || "",
            };
          }
        }

        /* ================= 3. SOLO TRAINERS ================= */
        if (!found) {
          const trainerSnap = await getDoc(doc(db, "trainers", uid));

          if (trainerSnap.exists()) {
            const data = trainerSnap.data();

            found = {
              uid,
              id: uid,
              name:
                data.trainerName ||
                `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
                "Trainer",
              role: "solotrainer",
              badge: "Solo Trainer",
              profileImageUrl: data.profileImageUrl || "",
            };
          }
        }

        /* ================= 4. INSTITUTES ================= */
        if (!found) {
          const instSnap = await getDoc(doc(db, "institutes", uid));

          if (instSnap.exists()) {
            const data = instSnap.data();

            found = {
              uid,
              id: uid,
              name: data.instituteName || data.organization || "Institute",
              role: "outerinstitute",
              badge: "Institute",
              profileImageUrl: data.profileImageUrl || "",
            };
          }
        }

        if (found) externalUsers.push(found);
      }

      setChatUsers(externalUsers);
    });

    return () => unsub();
  }, [user, users]);
  useEffect(() => {
    const data = location.state;

    if (!data?.openChatId) return;

    setActiveChat({
      id: data.openChatId,
      type: "individual",
    });

    setActiveChatName(data?.targetUser?.name || "Chat");

    setScreen("chat");
  }, [location.state]);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUser(u);

      /* -------- 1. Check Institute Owner -------- */
      const instRef = doc(db, "institutes", u.uid);
      const instSnap = await getDoc(instRef);
      if (instSnap.exists()) {
        setInstituteId(u.uid);
        return;
      }

      /* -------- 2. Check Student -------- */
      const studentRef = doc(db, "students", u.uid);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const data = studentSnap.data();
        setInstituteId(data.instituteId); // ✅ IMPORTANT
        return;
      }

      /* -------- 3. Check Trainer -------- */
      const trainerQ = query(
        collection(db, "InstituteTrainers"),
        where("trainerUid", "==", u.uid),
      );
      const trainerSnap = await getDocs(trainerQ);

      if (!trainerSnap.empty) {
        const data = trainerSnap.docs[0].data();
        setInstituteId(data.instituteId); // ✅ IMPORTANT
        return;
      }
    });

    return () => unsub();
  }, []);

  /* ================= USERS ================= */
  /* ================= USERS (FIXED & STABLE) ================= */
  useEffect(() => {
    if (!instituteId) return;

    const loadOwner = async () => {
      const instRef = doc(db, "institutes", instituteId); // 👑 OWNER
      const instSnap = await getDoc(instRef);

      if (instSnap.exists()) {
        const data = instSnap.data();

        const ownerUser = {
          id: instituteId,
          uid: instituteId, // 🔑 important: UID = instituteId
          name:
            `${data.ownerFirstName || data.firstName || ""} ${
              data.ownerLastName || data.lastName || ""
            }`.trim() || "Institute Admin",
          role: "owner",
          profileImageUrl: data.ownerPhotoUrl || data.profileImageUrl || "",
        };

        setUsers((prev) => {
          const exists = prev.find((u) => u.uid === instituteId);
          if (exists) return prev; // avoid duplicates
          return [ownerUser, ...prev]; // 👑 owner always on top
        });
      }
    };

    loadOwner();
  }, [instituteId]);
  /* ================= USERS ================= */
  useEffect(() => {
    if (!instituteId) return;

    const unsubStudents = onSnapshot(
      query(
        collection(db, "students"),
        where("instituteId", "==", instituteId),
      ),
      (snap) => {
        const s = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            uid: data.customerUid,
            name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            role: "student",
            profileImageUrl: data.studentPhotoUrl || data.profileImageUrl || "", // ✅ FETCH CLOUDINARY URL
          };
        });
        setUsers((prev) => [...prev.filter((u) => u.role !== "student"), ...s]);
      },
    );

    const unsubTrainers = onSnapshot(
      query(
        collection(db, "InstituteTrainers"),
        where("instituteId", "==", instituteId),
      ),
      (snap) => {
        const t = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            uid: data.trainerUid,
            name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            role: "trainer",
            profileImageUrl: data.profileImageUrl || "", // ✅ FETCH CLOUDINARY URL
          };
        });
        setUsers((prev) => [...prev.filter((u) => u.role !== "trainer"), ...t]);
      },
    );

    return () => {
      unsubStudents();
      unsubTrainers();
    };
  }, [instituteId]);

  /* ================= GROUPS ================= */
  /* ================= GROUPS ================= */
  useEffect(() => {
    if (!user || !instituteId) return;

    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", user.uid),
      where("instituteId", "==", instituteId),
    );

    const unsub = onSnapshot(q, (snap) => {
      setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user, instituteId]);
  /* ================= REALTIME CHAT LIST ================= */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", user.uid),
    );

    const unsub = onSnapshot(q, async (snap) => {
      let chats = [];

      for (const d of snap.docs) {
        const data = d.data();

        /* GROUP */
        if (data.type === "group") {
          chats.push({
            id: d.id,
            type: "group",
            name: data.name || "Group",
            members: data.members || [],
            lastMessage: data.lastMessage || "",
            lastAt: data.lastAt || data.createdAt || null,
            createdAt: data.createdAt || null,
            profileImageUrl: "",
          });

          continue;
        }

        /* INDIVIDUAL */
        const otherUid = (data.members || []).find((m) => m !== user.uid);

        if (!otherUid) continue;

        let foundUser = null;

        /* USERS */
        const userSnap = await getDoc(doc(db, "users", otherUid));

        if (userSnap.exists()) {
          const u = userSnap.data();

          foundUser = {
            uid: otherUid,
            id: d.id,
            type: "individual",
            name:
              u.name ||
              `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
              "User",
            profileImageUrl: u.profileImage || u.profileImageUrl || "",
          };
        }

        /* STUDENTS */
        if (!foundUser) {
          const sSnap = await getDoc(doc(db, "students", otherUid));

          if (sSnap.exists()) {
            const s = sSnap.data();

            foundUser = {
              uid: otherUid,
              id: d.id,
              type: "individual",
              name:
                `${s.firstName || ""} ${s.lastName || ""}`.trim() || "Student",
              profileImageUrl: s.profileImageUrl || s.studentPhotoUrl || "",
            };
          }
        }

        /* TRAINERS */
        if (!foundUser) {
          const tSnap = await getDoc(doc(db, "trainers", otherUid));

          if (tSnap.exists()) {
            const t = tSnap.data();

            foundUser = {
              uid: otherUid,
              id: d.id,
              type: "individual",
              name:
                `${t.firstName || ""} ${t.lastName || ""}`.trim() || "Trainer",
              profileImageUrl: t.profileImageUrl || "",
            };
          }
        }

        /* INSTITUTE */
        if (!foundUser) {
          const iSnap = await getDoc(doc(db, "institutes", otherUid));

          if (iSnap.exists()) {
            const i = iSnap.data();

            foundUser = {
              uid: otherUid,
              id: d.id,
              type: "individual",
              name: i.instituteName || i.organization || "Institute",
              profileImageUrl: i.profileImageUrl || "",
            };
          }
        }

        if (foundUser) {
          chats.push({
            ...foundUser,
            lastMessage: data.lastMessage || "",
            lastAt: data.lastAt || data.createdAt || null,
            createdAt: data.createdAt || null,
          });
        }
      }

      /* SORT BY:
       1. UNREAD FIRST
       2. LATEST MESSAGE FIRST
    */

      chats.sort((a, b) => {
        const aUnread = unreadCounts[a.id] || 0;
        const bUnread = unreadCounts[b.id] || 0;

        if (bUnread !== aUnread) {
          return bUnread - aUnread;
        }

        const aTime = a.lastAt?.seconds || a.createdAt?.seconds || 0;

        const bTime = b.lastAt?.seconds || b.createdAt?.seconds || 0;

        return bTime - aTime;
      });

      setChatList(chats);
    });

    return () => unsub();
  }, [user, unreadCounts]);
  /* ================= REPLACE UNREAD COUNT useEffect ================= */

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", user.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      const unsubMessages = [];

      snap.docs.forEach((chatDoc) => {
        const chatId = chatDoc.id;

        /* realtime listen messages */
        const msgQ = query(
          collection(db, "chats", chatId, "messages"),
          orderBy("createdAt", "asc"),
        );

        const unsubMsg = onSnapshot(msgQ, (msgSnap) => {
          let unread = 0;

          msgSnap.forEach((m) => {
            const data = m.data();

            if (
              data.senderId !== user.uid &&
              !data.readBy?.includes(user.uid)
            ) {
              unread++;
            }
          });

          /* instant update */
          setUnreadCounts((prev) => ({
            ...prev,
            [chatId]: unread,
          }));
        });

        unsubMessages.push(unsubMsg);
      });

      return () => unsubMessages.forEach((fn) => fn());
    });

    return () => unsub();
  }, [user]);
  /* ================= MESSAGES ================= */
  useEffect(() => {
    if (!activeChat?.id) return;

    const q = query(
      collection(db, "chats", activeChat.id, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [activeChat]);

  const isAdmin = () => {
    const g = groups.find((g) => g.id === activeChat?.id);
    return g?.adminId === user?.uid;
  };

  /* ================= START CHAT ================= */
  const startChat = async (target) => {
    if (!user || !instituteId || !target?.uid) return;

    try {
      const chatId = [user.uid, target.uid].sort().join("_");

      const chatRef = doc(db, "chats", chatId);
      const snap = await getDoc(chatRef);

      if (!snap.exists()) {
        await setDoc(chatRef, {
          type: "individual",
          instituteId,
          members: [user.uid, target.uid],
          createdAt: serverTimestamp(),
          lastMessage: "",
        });
      }

      setActiveChat({
        id: chatId,
        type: "individual",
      });

      setActiveChatName(target.name || "Chat");
      setMessages([]);
      setScreen("chat");
    } catch (err) {
      console.error("Start chat error:", err);
    }
  };
  /* ================= GROUP RENAME ================= */
  const renameGroup = async () => {
    if (!activeChat?.id || !renameValue.trim()) return;

    const gRef = doc(db, "groups", activeChat.id);
    const gSnap = await getDoc(gRef);
    if (!gSnap.exists()) return;
    if (gSnap.data().adminId !== user.uid) return;

    await updateDoc(gRef, { name: renameValue });
    await updateDoc(doc(db, "chats", activeChat.id), { name: renameValue });

    setActiveChatName(renameValue);
    setRenameValue("");
  };

  /* ================= GROUP DELETE ================= */
  const deleteGroup = async () => {
    if (!activeChat?.id) return;

    const gRef = doc(db, "groups", activeChat.id);
    const gSnap = await getDoc(gRef);
    if (!gSnap.exists()) return;
    if (gSnap.data().adminId !== user.uid) return;

    const msgs = await getDocs(
      collection(db, "chats", activeChat.id, "messages"),
    );
    for (let m of msgs.docs) {
      await deleteDoc(doc(db, "chats", activeChat.id, "messages", m.id));
    }

    await deleteDoc(doc(db, "chats", activeChat.id));
    await deleteDoc(gRef);

    setActiveChat(null);
    setActiveChatName("");
    setMessages([]);
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim() || !activeChat?.id || !user) return;

    await addDoc(collection(db, "chats", activeChat.id, "messages"), {
      text: text.trim(),
      senderId: user.uid,
      createdAt: serverTimestamp(),
      readBy: [user.uid],
    });

    await updateDoc(doc(db, "chats", activeChat.id), {
      lastMessage: text.trim(),
      lastAt: serverTimestamp(),
    });

    setText("");
  };
  const handleMic = async () => {
    if (!activeChat?.id) {
      alert("Open a chat first");
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Microphone not supported in this browser");
        return;
      }

      if (!isRecording) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: "audio/webm" });

          const audioURL = URL.createObjectURL(blob);

          await addDoc(collection(db, "chats", activeChat.id, "messages"), {
            audio: audioURL,
            senderId: user.uid,
            createdAt: serverTimestamp(),
            readBy: [user.uid],
          });

          await updateDoc(doc(db, "chats", activeChat.id), {
            lastMessage: "🎤 Voice message",
            lastAt: serverTimestamp(),
          });
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);

        console.log("Recording started 🎤");
      } else {
        if (mediaRecorder) {
          mediaRecorder.stop();
        }
        setIsRecording(false);
      }
    } catch (error) {
      console.error("Mic error:", error);
      alert("Microphone permission denied or not available.");
    }
  };
  /* ================= CHAT PREVIEW REALTIME ================= */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", user.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      const chatMap = {};

      snap.forEach((d) => {
        const data = d.data();

        chatMap[d.id] = {
          id: d.id,
          ...data,
        };
      });

      setUsers((prev) =>
        prev.map((u) => {
          const chatId = [user.uid, u.uid].sort().join("_");

          if (chatMap[chatId]) {
            return {
              ...u,
              lastMessage: chatMap[chatId].lastMessage || "",
              lastAt: chatMap[chatId].lastAt || null,
            };
          }

          return u;
        }),
      );

      setChatUsers((prev) =>
        prev.map((u) => {
          const chatId = [user.uid, u.uid].sort().join("_");

          if (chatMap[chatId]) {
            return {
              ...u,
              lastMessage: chatMap[chatId].lastMessage || "",
              lastAt: chatMap[chatId].lastAt || null,
            };
          }

          return u;
        }),
      );

      setGroups((prev) =>
        prev.map((g) => {
          if (chatMap[g.id]) {
            return {
              ...g,
              lastMessage: chatMap[g.id].lastMessage || "",
              lastAt: chatMap[g.id].lastAt || null,
            };
          }

          return g;
        }),
      );
    });

    return () => unsub();
  }, [user]);
  /* ================= AUTO READ ================= */
  useEffect(() => {
    if (!activeChat?.id || !user) return;

    const markRead = async () => {
      const msgs = await getDocs(
        collection(db, "chats", activeChat.id, "messages"),
      );
      for (let m of msgs.docs) {
        const data = m.data();
        if (!data.readBy?.includes(user.uid)) {
          await updateDoc(doc(db, "chats", activeChat.id, "messages", m.id), {
            readBy: [...(data.readBy || []), user.uid],
          });
        }
      }
    };

    markRead();
  }, [activeChat, user]);

  /* ================= UNREAD COUNT ================= */
  useEffect(() => {
    if (!user || !instituteId) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", user.uid),
    );

    const unsub = onSnapshot(q, async (snap) => {
      let counts = {};

      for (let d of snap.docs) {
        const chatId = d.id;
        const msgs = await getDocs(collection(db, "chats", chatId, "messages"));

        let unread = 0;
        msgs.forEach((m) => {
          const data = m.data();
          if (!data.readBy?.includes(user.uid)) unread++;
        });

        counts[chatId] = unread;
      }

      setUnreadCounts(counts);
    });

    return () => unsub();
  }, [user, instituteId]);

  /* ================= CREATE GROUP ================= */
  const submitCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Enter group name");
      return;
    }

    if (selectedMembers.length === 0) {
      alert("Select members");
      return;
    }

    try {
      const members = [...new Set([user.uid, ...selectedMembers])];

      const groupRef = await addDoc(collection(db, "groups"), {
        name: groupName,
        instituteId,
        members,
        adminId: user.uid,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "chats", groupRef.id), {
        type: "group",
        instituteId,
        members,
        name: groupName,
        createdAt: serverTimestamp(),
        lastMessage: "",
      });

      setActiveChat({
        id: groupRef.id,
        type: "group",
      });

      setActiveChatName(groupName);
      setGroupName("");
      setSelectedMembers([]);
      setScreen("chat");
    } catch (error) {
      console.error("Create group error:", error);
    }
  };
  useEffect(() => {
    if (!activeChat?.id || !user) return;

    const markRead = async () => {
      const msgs = await getDocs(
        collection(db, "chats", activeChat.id, "messages"),
      );

      let hasUnread = false;

      for (let m of msgs.docs) {
        const data = m.data();

        if (data.senderId !== user.uid && !data.readBy?.includes(user.uid)) {
          hasUnread = true;

          await updateDoc(doc(db, "chats", activeChat.id, "messages", m.id), {
            readBy: [...(data.readBy || []), user.uid],
          });
        }
      }

      /* ✅ remove unread instantly in UI */
      if (hasUnread) {
        setUnreadCounts((prev) => ({
          ...prev,
          [activeChat.id]: 0,
        }));
      }
    };

    markRead();
  }, [activeChat, user]);
  /* ================= REMOVE PARTICIPANT ================= */
  const removeParticipant = async (uid) => {
    if (!activeChat?.id) return;

    const gRef = doc(db, "groups", activeChat.id);
    const snap = await getDoc(gRef);
    if (!snap.exists()) return;
    if (snap.data().adminId !== user.uid) return;

    await updateDoc(gRef, { members: arrayRemove(uid) });
    await updateDoc(doc(db, "chats", activeChat.id), {
      members: arrayRemove(uid),
    });
  };

  const memberObjects = (
    groups.find((g) => g.id === activeChat?.id)?.members || []
  )
    .map(
      (uid) =>
        users.find((u) => u.uid === uid) || { uid, name: "Unknown User" },
    )
    .filter(Boolean);
  const filteredChats =
    activeTab === "group"
      ? groups.filter((g) =>
          (g.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : [...users, ...chatUsers].filter((u) =>
          (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
        );

  return (
    <div
      className="
    flex
    h-[100dvh]
    w-full
    bg-[#ECE5DD]
    overflow-hidden
    fixed
    inset-0
    overscroll-none
    touch-pan-y
    md:rounded-3xl
  "
    >
      {/* ================= CHAT LIST ================= */}
      <div
        className={`
    ${activeChat ? "hidden md:flex" : "flex"}
    w-full
    md:w-[380px]
    lg:w-[420px]
    flex-col
    bg-[#F8F9FB]
    border-r
    border-gray-200
    relative
    z-20
  `}
      >
        {/* HEADER */}
        <div
          className="
    px-4
    md:px-5
    pt-[max(env(safe-area-inset-top),16px)]
    pb-4
    flex
    items-center
    justify-between
    sticky
    top-0
    z-20
    bg-[#F8F9FB]
    backdrop-blur-xl
  "
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <ArrowLeft size={22} />
            </button>

            <h1 className="text-3xl font-bold text-black">Chat</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Chats */}
            <button
              onClick={() => setActiveTab("chats")}
              className={`
      px-4 py-2 rounded-full text-sm font-medium transition-all
      ${
        activeTab === "chats"
          ? "bg-[#FF6B00] text-white shadow-md"
          : "bg-white text-gray-700 border border-gray-200"
      }
    `}
            >
              Chats
            </button>

            {/* Groups */}
            <button
              onClick={() => setActiveTab("group")}
              className={`
      px-4 py-2 rounded-full text-sm font-medium transition-all
      flex items-center gap-2
      ${
        activeTab === "group"
          ? "bg-[#FF6B00] text-white shadow-md"
          : "bg-white text-gray-700 border border-gray-200"
      }
    `}
            >
              Groups
            </button>

            {/* Create Group */}
            <button
              onClick={() => {
                setActiveTab("group");
                setShowRecentChats(true);
              }}
              className="
      h-11
      w-11
      rounded-full
      bg-[#FF6B00]
      text-white
      flex
      items-center
      justify-center
      shadow-lg
      hover:scale-105
      active:scale-95
      transition-all
    "
              title="Create Group"
            >
              +
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="px-4 mt-2 pb-2">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === "group"
                  ? "Search groups..."
                  : "Search conversations..."
              }
              className="
    w-full
    bg-white
    rounded-2xl
    py-3
    pl-11
    pr-4
    outline-none
    text-sm
    shadow-sm
    border
    border-gray-100
  "
            />
          </div>
        </div>

        {/* ACTIVE USERS */}
        {activeTab !== "group" && (
          <div className="px-4 mt-5">
            <h2 className="font-semibold text-[15px] mb-3">Active Users</h2>

            <div className="overflow-x-auto whitespace-nowrap scrollbar-hide pb-2">
              <div className="flex gap-4">
                {[...users, ...chatUsers].slice(0, 15).map((u) => (
                  <div
                    key={u.uid}
                    onClick={() => startChat(u)}
                    className="flex flex-col items-center cursor-pointer min-w-[70px]"
                  >
                    <div className="relative">
                      <img
                        src={getValidImage(u.profileImageUrl, u.name)}
                        className="
  w-14
  h-14
  md:w-16
  md:h-16
  rounded-full
  object-cover
  border-2
  border-white
  shadow-md
"
                      />

                      <div
                        className="
                absolute
                bottom-1
                right-1
                w-4
                h-4
                bg-green-500
                border-2
                border-white
                rounded-full
              "
                      ></div>
                    </div>

                    <span
                      className="
              text-xs
              mt-2
              font-medium
              text-gray-700
              truncate
              w-full
              text-center
            "
                    >
                      {u.name?.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHAT / GROUP LIST */}
        <div
          className="
  flex-1
  overflow-y-auto
  mt-4
  px-3
  pb-32
"
        >
          {activeTab === "group" && groups.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                <span className="text-3xl">👥</span>
              </div>

              <h3 className="text-lg font-semibold text-gray-700">
                No Groups Found
              </h3>

              <p className="text-sm text-gray-500 mt-2 max-w-[250px]">
                You haven't created or joined any groups yet.
              </p>

              <button
                onClick={() => setShowRecentChats(true)}
                className="mt-5 bg-[#FF6B00] text-white px-6 py-3 rounded-xl font-medium shadow-md hover:scale-105 transition"
              >
                + Create Group
              </button>
            </div>
          )}
          {filteredChats
            /* REMOVE DUPLICATES */
            .filter(
              (item, index, self) =>
                index ===
                self.findIndex(
                  (t) => (t.uid || t.id) === (item.uid || item.id),
                ),
            )

            /* ATTACH CHAT DATA */
            .map((u) => {
              const chatId =
                activeTab === "group"
                  ? u.id
                  : [user?.uid, u.uid].sort().join("_");

              const chatData =
                groups.find((g) => g.id === chatId) ||
                users.find((x) => {
                  const id =
                    activeTab === "group"
                      ? x.id
                      : [user?.uid, x.uid].sort().join("_");

                  return id === chatId;
                }) ||
                {};

              return {
                ...u,
                chatId,
                lastMessage: u.lastMessage || chatData?.lastMessage || "",

                lastAt: u.lastAt || chatData?.lastAt || u.createdAt || null,
              };
            })

            /* SHOW LATEST MESSAGE FIRST */
            .sort((a, b) => {
              const aTime = a.lastAt?.seconds || a.lastAt?.toMillis?.() || 0;

              const bTime = b.lastAt?.seconds || b.lastAt?.toMillis?.() || 0;

              /* unread chats first */
              const aUnread = unreadCounts[a.chatId] || 0;
              const bUnread = unreadCounts[b.chatId] || 0;

              if (aUnread > 0 && bUnread === 0) return -1;
              if (bUnread > 0 && aUnread === 0) return 1;

              return bTime - aTime;
            })

            .map((u) => {
              const chatId = u.chatId;

              return (
                <div
                  key={u.uid || u.id}
                  onClick={() => {
                    if (activeTab === "group") {
                      setActiveChat({
                        id: u.id,
                        type: u.type === "group" ? "group" : "individual",
                      });

                      setActiveChatName(u.name);
                    } else {
                      startChat(u);
                    }
                  }}
                  className="
bg-white
rounded-2xl
px-3
md:px-4
py-3
mb-3
flex
items-center
gap-3
shadow-sm
hover:shadow-md
active:scale-[0.98]
transition-all
duration-200
cursor-pointer
border
border-gray-100
"
                >
                  {/* AVATAR */}
                  <div className="relative shrink-0">
                    <img
                      src={getValidImage(
                        u.profileImageUrl,
                        u.name || u.groupName,
                      )}
                      className="w-14 h-14 rounded-full object-cover"
                    />

                    {activeTab !== "group" && (
                      <div
                        className="
absolute
bottom-0
right-0
w-3.5
h-3.5
bg-green-500
border-2
border-white
rounded-full
"
                      ></div>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[15px] truncate">
                        {u.name}
                      </h3>

                      {u.lastAt && (
                        <span className="text-[11px] text-gray-400">
                          {new Date(
                            u.lastAt?.seconds
                              ? u.lastAt.seconds * 1000
                              : u.lastAt,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-400 truncate pr-3">
                        {u.lastMessage ||
                          (activeTab === "group"
                            ? "Group conversation"
                            : "Start conversation")}
                      </p>

                      {unreadCounts[chatId] > 0 && (
                        <div
                          className="
min-w-[22px]
h-[22px]
px-1
rounded-full
bg-[#FF6B00]
flex
items-center
justify-center
text-white
text-[11px]
font-semibold
"
                        >
                          {unreadCounts[chatId]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* FLOATING CREATE GROUP BUTTON */}

        {/* CREATE GROUP MODAL */}
        {showRecentChats && (
          <div
            className="
    fixed
    inset-0
    bg-black/40
    z-[100]
    flex
    items-end
    md:items-center
    justify-center
    pb-[90px]
    md:pb-0
  "
          >
            <div
              className="
    bg-white
    w-full
    md:w-[430px]
    rounded-t-[30px]
    md:rounded-[30px]
    p-5
    max-h-[82dvh]
    overflow-y-auto
    animate-slideUp
    shadow-2xl
    mb-[env(safe-area-inset-bottom)]
  "
            >
              {/* TOP */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold">Create Group</h2>

                <button
                  onClick={() => setShowRecentChats(false)}
                  className="text-2xl"
                >
                  ×
                </button>
              </div>

              {/* GROUP NAME */}
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="
  w-full
  bg-white
  rounded-2xl
  py-3.5
  pl-11
  pr-4
  outline-none
  text-sm
  shadow-sm
  border
  border-gray-200
  focus:border-[#FF6B00]
  transition
"
              />

              {/* MEMBERS */}
              <div className="space-y-3 max-h-[45vh] overflow-y-auto">
                {users
                  .filter((u) => u.uid !== user?.uid)
                  .map((u) => (
                    <label
                      key={u.uid}
                      className="
              flex
              items-center
              gap-3
              bg-[#F8F8F8]
              rounded-2xl
              p-3
              cursor-pointer
            "
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u.uid)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers((prev) => [...prev, u.uid]);
                          } else {
                            setSelectedMembers((prev) =>
                              prev.filter((id) => id !== u.uid),
                            );
                          }
                        }}
                        className="w-4 h-4"
                      />

                      <img
                        src={getValidImage(u.profileImageUrl, u.name)}
                        className="w-12 h-12 rounded-full object-cover"
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {u.name}
                        </h3>

                        <p className="text-xs text-gray-400 capitalize">
                          {u.role}
                        </p>
                      </div>
                    </label>
                  ))}
              </div>

              {/* CREATE BUTTON */}
              <button
                onClick={() => {
                  submitCreateGroup();
                  setShowRecentChats(false);
                }}
                className="
        w-full
        mt-5
        bg-[#FF6B00]
        text-white
        py-3
        rounded-2xl
        font-semibold
      "
              >
                Create Group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= ACTIVE CHAT ================= */}
      <div
        className={`
    ${activeChat ? "flex" : "hidden md:flex"}
    flex-1
    flex-col
    bg-[#ECE5DD]
    relative
    min-w-0
    h-[100dvh]
    md:h-full
    overflow-hidden
  `}
      >
        {/* HEADER */}
        <div
          className="
    shrink-0
    sticky
    top-0
    pt-[max(env(safe-area-inset-top),0px)]
    z-30
    bg-white/95
    backdrop-blur-xl
    border-b
    border-gray-200
    px-3
    md:px-4
    py-3
    shadow-sm
  "
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveChat(null);
                  setMessages([]);
                }}
                className="md:hidden"
              >
                <ArrowLeft size={22} />
              </button>

              <img
                src={getValidImage("", activeChatName)}
                className="w-11 h-11 rounded-full object-cover"
              />

              <div>
                <h2 className="font-semibold text-[15px]">
                  {activeChatName || "Chat"}
                </h2>

                <p className="text-xs text-green-500">Online</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Phone size={20} className="text-gray-700" />

              <MoreVertical
                size={20}
                className="text-gray-700 cursor-pointer"
                onClick={() => setShowMenu(!showMenu)}
              />
            </div>
          </div>

          {/* GROUP SETTINGS */}
          {showMenu && activeChat?.type === "group" && (
            <div className="mt-4 bg-[#F8F8F8] rounded-2xl p-4 space-y-4">
              {/* RENAME */}
              {isAdmin() && (
                <div>
                  <h3 className="font-semibold mb-2">Rename Group</h3>

                  <div className="flex gap-2">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      placeholder="New group name"
                      className="flex-1 border rounded-xl px-3 py-2 text-sm outline-none"
                    />

                    <button
                      onClick={renameGroup}
                      className="bg-[#FF6B00] text-white px-4 rounded-xl"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* MEMBERS */}
              <div>
                <h3 className="font-semibold mb-2">Participants</h3>

                <div className="space-y-2">
                  {memberObjects.map((m) => (
                    <div
                      key={m.uid}
                      className="flex items-center justify-between bg-white rounded-xl px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getValidImage(m.profileImageUrl, m.name)}
                          className="w-10 h-10 rounded-full object-cover"
                        />

                        <span className="text-sm">{m.name}</span>
                      </div>

                      {isAdmin() && m.uid !== user?.uid && (
                        <button
                          onClick={() => removeParticipant(m.uid)}
                          className="text-red-500 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ADD MEMBERS */}
              {isAdmin() && (
                <div>
                  <h3 className="font-semibold mb-2">Add Participants</h3>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {users
                      .filter(
                        (u) =>
                          !memberObjects.find((m) => m.uid === u.uid) &&
                          u.uid !== user?.uid,
                      )
                      .map((u) => (
                        <div
                          key={u.uid}
                          className="flex items-center justify-between bg-white rounded-xl px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={getValidImage(u.profileImageUrl, u.name)}
                              className="w-10 h-10 rounded-full object-cover"
                            />

                            <span className="text-sm">{u.name}</span>
                          </div>

                          <button
                            onClick={async () => {
                              const gRef = doc(db, "groups", activeChat.id);

                              const cRef = doc(db, "chats", activeChat.id);

                              const gSnap = await getDoc(gRef);

                              const members = [
                                ...(gSnap.data().members || []),
                                u.uid,
                              ];

                              await updateDoc(gRef, { members });
                              await updateDoc(cRef, { members });
                            }}
                            className="text-[#FF6B00] text-sm"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* DELETE */}
              {isAdmin() && (
                <button
                  onClick={deleteGroup}
                  className="w-full bg-red-500 text-white py-3 rounded-2xl"
                >
                  Delete Group
                </button>
              )}
            </div>
          )}
        </div>

        {/* MESSAGES */}
        <div
          className="
    flex-1
    min-h-0
    overflow-y-auto
    px-3
    md:px-5
    py-5
    space-y-3
    pb-32
    scroll-smooth
  "
        >
          {messages.map((m) => {
            const sender = users.find((u) => u.uid === m.senderId);

            const isMine = m.senderId === user?.uid;

            return (
              <div
                key={m.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[72%] px-4 py-3 text-[14px] md:text-sm shadow-sm ${
                    isMine
                      ? "bg-[#DCF8C6] rounded-2xl rounded-br-md"
                      : "bg-white rounded-2xl rounded-bl-md"
                  }`}
                >
                  {activeChat?.type === "group" && !isMine && (
                    <p className="text-[11px] font-semibold text-[#FF6B00] mb-1">
                      {sender?.name}
                    </p>
                  )}

                  {m.text && <p>{m.text}</p>}

                  {m.audio && (
                    <audio controls className="w-full mt-2">
                      <source src={m.audio} type="audio/webm" />
                    </audio>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT */}
        <div
          className="
    sticky
    bottom-0
    bg-[#ECE5DD]
    px-2
    md:px-3
    py-2
    border-t
    border-gray-200
    backdrop-blur-xl
  "
        >
          <div className="flex items-end gap-2">
            <div
              className="
  flex-1
  bg-white
  rounded-[28px]
  px-4
  py-2
  flex
  items-end
  gap-3
  shadow-md
  border
  border-gray-200
"
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={1}
                placeholder="Type a message..."
                className="
  flex-1
  
  resize-none
  outline-none
  text-sm
  bg-transparent
  max-h-60
  overflow-y-auto
  py-2
  leading-5
"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />

              <div className="flex items-center gap-2 shrink-0 mb-1"></div>
            </div>

            <button
              onClick={sendMessage}
              disabled={!text.trim()}
              className={`
    w-14
    h-14
    rounded-full
    flex
    items-center
    justify-center
    shadow-lg
    transition
    ${
      text.trim()
        ? "bg-[#FF6B00] active:scale-95"
        : "bg-gray-300 cursor-not-allowed"
    }
  `}
            >
              <Send size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
