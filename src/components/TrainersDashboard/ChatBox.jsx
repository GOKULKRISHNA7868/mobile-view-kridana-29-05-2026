import React, { useState, useEffect } from "react";
import { MoreVertical, Smile, Send, Mic, ArrowLeft } from "lucide-react";
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
import { useNavigate } from "react-router-dom";
const ChatBox = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chats");
  const [screen, setScreen] = useState("chat");
  const [showMenu, setShowMenu] = useState(false);
  const [showRecentChats, setShowRecentChats] = useState(false);
  const [user, setUser] = useState(null);
  const [trainerId, setTrainerId] = useState(null);

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);

  const [activeChat, setActiveChat] = useState(null);
  const [activeChatName, setActiveChatName] = useState("");
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [renameValue, setRenameValue] = useState("");
  const [search, setSearch] = useState("");
  const [chatUsers, setChatUsers] = useState([]);
  const getValidImage = (url, name) => {
    if (!url)
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    if (url.startsWith("blob:"))
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    return url;
  };
  /* ================= CHAT MEMBERS (OUTER USERS ONLY — MESSAGE FILTERED) ================= */
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
  /* ================= AUTH + INSTITUTE ================= */
  /* ================= AUTH + TRAINER ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUser(u);

      // Trainer document itself
      const trainerRef = doc(db, "trainers", u.uid);
      const trainerSnap = await getDoc(trainerRef);

      if (trainerSnap.exists()) {
        setTrainerId(u.uid); // trainer = institute
      }
    });

    return () => unsub();
  }, []);

  /* ================= USERS ================= */
  /* ================= USERS (TRAINER + TRAINER STUDENTS) ================= */
  useEffect(() => {
    if (!trainerId || !user) return;

    const loadUsers = async () => {
      const trainerRef = doc(db, "trainers", trainerId);
      const trainerSnap = await getDoc(trainerRef);
      if (!trainerSnap.exists()) return;

      const trainerData = trainerSnap.data();

      // Trainer as user
      const trainerUser = {
        id: trainerId,
        uid: trainerId,
        name: `${trainerData.firstName || ""} ${
          trainerData.lastName || ""
        }`.trim(),
        role: "trainer",
        profileImageUrl: trainerData.profileImageUrl || "",
      };

      // Students list from trainer document
      const studentUids = trainerData.students || [];

      const students = [];

      for (let uid of studentUids) {
        const sRef = doc(db, "trainerstudents", uid);
        const sSnap = await getDoc(sRef);
        if (sSnap.exists()) {
          const data = sSnap.data();
          students.push({
            id: uid,
            uid: data.studentUid,
            name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            role: "student",
            profileImageUrl: data.profileImageUrl || "",
          });
        }
      }

      setUsers([trainerUser, ...students]);
    };

    loadUsers();
  }, [trainerId, user]);

  /* ================= GROUPS ================= */
  useEffect(() => {
    if (!user || !trainerId) return;

    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", user.uid),
      where("trainerId", "==", trainerId),
    );

    const unsub = onSnapshot(q, (snap) => {
      setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [user, trainerId]);

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
    if (!user || !trainerId) return;

    try {
      const chatId = [user.uid, target.uid].sort().join("_");

      const chatRef = doc(db, "chats", chatId);
      const snap = await getDoc(chatRef);

      if (!snap.exists()) {
        await setDoc(chatRef, {
          type: "individual",
          trainerId,
          members: [user.uid, target.uid],
          createdAt: serverTimestamp(),
          lastMessage: "",
        });
      }

      setActiveChat({
        id: chatId,
        type: "individual",
      });

      setActiveChatName(target.name);
      setMessages([]);
      setScreen("chat");
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };
  /* ================= GROUP RENAME ================= */
  /* ================= GROUP RENAME ================= */
  /* ================= DELETE GROUP ================= */
  const deleteGroup = async () => {
    try {
      if (!activeChat?.id) {
        alert("No group selected");
        return;
      }

      const groupRef = doc(db, "groups", activeChat.id);

      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        alert("Group not found");
        return;
      }

      const groupData = groupSnap.data();

      // only admin can delete
      if (groupData.adminId !== user.uid) {
        alert("Only admin can delete group");
        return;
      }

      // delete all messages
      const msgsSnap = await getDocs(
        collection(db, "chats", activeChat.id, "messages"),
      );

      for (const msg of msgsSnap.docs) {
        await deleteDoc(doc(db, "chats", activeChat.id, "messages", msg.id));
      }

      // delete chat doc
      await deleteDoc(doc(db, "chats", activeChat.id));

      // delete group doc
      await deleteDoc(groupRef);

      // reset UI
      setActiveChat(null);
      setActiveChatName("");
      setMessages([]);
      setShowMenu(false);

      alert("Group deleted successfully");
    } catch (err) {
      console.error("Delete group error:", err);
      alert("Failed to delete group");
    }
  };
  const renameGroup = async () => {
    try {
      if (!activeChat?.id) {
        alert("No active group selected");
        return;
      }

      if (!renameValue.trim()) {
        alert("Enter new group name");
        return;
      }

      // check group exists
      const groupRef = doc(db, "groups", activeChat.id);

      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        alert("Group not found");
        return;
      }

      const groupData = groupSnap.data();

      // only admin can rename
      if (groupData.adminId !== user.uid) {
        alert("Only admin can rename group");
        return;
      }

      // update groups collection
      await updateDoc(groupRef, {
        name: renameValue.trim(),
      });

      // update chats collection also
      const chatRef = doc(db, "chats", activeChat.id);

      const chatSnap = await getDoc(chatRef);

      if (chatSnap.exists()) {
        await updateDoc(chatRef, {
          name: renameValue.trim(),
          lastMessage: `Group renamed to ${renameValue.trim()}`,
          lastAt: serverTimestamp(),
        });
      }

      // local ui update
      setGroups((prev) =>
        prev.map((g) =>
          g.id === activeChat.id ? { ...g, name: renameValue.trim() } : g,
        ),
      );

      setActiveChat((prev) => ({
        ...prev,
        name: renameValue.trim(),
      }));

      // optional system message
      await addDoc(collection(db, "chats", activeChat.id, "messages"), {
        text: `Group renamed to "${renameValue.trim()}"`,
        system: true,
        senderId: user.uid,
        createdAt: serverTimestamp(),
        readBy: [user.uid],
      });

      setRenameValue("");

      alert("Group renamed successfully");
    } catch (err) {
      console.error("Rename error:", err);
      alert("Failed to rename group");
    }
  };
  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim() || !activeChat?.id || !user) return;

    const msgRef = collection(db, "chats", activeChat.id, "messages");

    await addDoc(msgRef, {
      text: text.trim(),
      senderId: user.uid,
      createdAt: serverTimestamp(),
      readBy: [user.uid], // ✅ read receipt
    });

    await updateDoc(doc(db, "chats", activeChat.id), {
      lastMessage: text.trim(),
      lastAt: serverTimestamp(),
    });

    setText("");
  };
  const handleMic = async () => {
    if (!activeChat?.id) return;

    if (!isRecording) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);

      let chunks = [];

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
      };

      recorder.start();

      setMediaRecorder(recorder);
      setIsRecording(true);
    } else {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };
  /* ================= REPLACE AUTO READ useEffect ================= */

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
    if (!user || !trainerId) return;

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
  }, [user, trainerId]);

  /* ================= CREATE GROUP ================= */
  const submitCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      alert("Enter group name and select members");
      return;
    }

    try {
      const members = [...new Set([user.uid, ...selectedMembers])];

      const groupRef = await addDoc(collection(db, "groups"), {
        name: groupName,
        trainerId,
        members,
        adminId: user.uid,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "chats", groupRef.id), {
        type: "group",
        trainerId,
        members,
        name: groupName,
        lastMessage: "",
        createdAt: serverTimestamp(),
      });

      setActiveChat({
        id: groupRef.id,
        type: "group",
      });

      setActiveChatName(groupName);
      setGroupName("");
      setSelectedMembers([]);
      setScreen("chat");
    } catch (err) {
      console.error("Error creating group:", err);
    }
  };

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
    .map((uid) => users.find((u) => u.uid === uid))
    .filter(Boolean);
  const filteredUsers = [...users, ...chatUsers].filter((u) =>
    u?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredGroups = groups.filter((g) =>
    g?.name?.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div
      className="
    flex flex-col
    
    h-[100dvh]
    w-full
    bg-[#ECE5DD]
    overflow-hidden
    fixed inset-0
    md:rounded-3xl
  "
    >
      {/* ================= LEFT / MOBILE CHAT LIST ================= */}
      <div
        className={`${
          activeChat || screen === "createGroup" || screen === "participants"
            ? "hidden md:flex"
            : "flex"
        } flex-col w-full md:w-[380px] border-r bg-[#f7f7f7] h-full`}
      >
        {/* HEADER */}
        <div className="sticky top-0 z-40 bg-[#f7f7f7] px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                >
                  <ArrowLeft size={22} />
                </button>

                <h1 className="text-3xl font-bold text-black">Chat</h1>
              </div>

              <p className="text-sm text-gray-500 mt-1">
                Connect with your people
              </p>
            </div>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-11 h-11 rounded-full bg-white shadow flex items-center justify-center"
            >
              <MoreVertical size={20} />
            </button>
          </div>

          {/* MENU */}
          {showMenu && (
            <div className="absolute right-5 top-20 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border w-56">
              <button
                onClick={() => {
                  setActiveChat(null);
                  setScreen("createGroup");
                  setShowMenu(false);
                }}
                className="w-full text-left sticky top-9 bg-white z-20 border-b px-5 py-4 hover:bg-gray-50 font-medium"
              >
                + Create Group
              </button>

              {activeChat?.type === "group" && (
                <>
                  <button
                    onClick={() => {
                      setScreen("participants");
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-5 py-4 hover:bg-gray-50 font-medium"
                  >
                    Participants
                  </button>

                  {isAdmin() && (
                    <>
                      <div className="px-4 py-4 border-t">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          placeholder="Enter new group name"
                          className="w-full border rounded-xl px-3 py-2 outline-none mb-3"
                        />

                        <button
                          onClick={renameGroup}
                          className="w-full bg-[#FF6B00] text-white py-2 rounded-xl font-medium"
                        >
                          Change Group Name
                        </button>
                      </div>

                      <button
                        onClick={deleteGroup}
                        className="w-full text-left px-5 py-4 hover:bg-red-50 text-red-500 font-medium"
                      >
                        Delete Group
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* SEARCH */}
          <div className="mt-5">
            <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              <input
                type="text"
                placeholder="Search messages, users, groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none flex-1 text-sm"
              />
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-3 mt-5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("chats")}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                activeTab === "chats"
                  ? "bg-[#FF6B00] text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Chats
            </button>

            <button
              onClick={() => setActiveTab("group")}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                activeTab === "group"
                  ? "bg-[#FF6B00] text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              Groups
            </button>
          </div>

          {/* ACTIVE USERS */}
          <div className="mt-6 overflow-x-auto whitespace-nowrap no-scrollbar shrink-0">
            <div className="flex gap-4">
              {[...users, ...chatUsers].slice(0, 20).map((u) => (
                <div
                  key={u.uid}
                  onClick={() => startChat(u)}
                  className="flex flex-col items-center w-[72px] shrink-0 cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={getValidImage(u.profileImageUrl, u.name)}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#FF6B00]"
                    />

                    <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                  </div>

                  <span className="text-xs mt-2 truncate w-full text-center font-medium">
                    {u.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHAT LIST */}
        {(
          activeTab === "group"
            ? filteredGroups.length === 0
            : filteredUsers.length === 0
        ) ? (
          <div className="flex flex-col items-center justify-center h-[55vh] px-6 text-center">
            <div className="w-28 h-28 rounded-full bg-orange-100 flex items-center justify-center mb-5">
              <span className="text-5xl">👋</span>
            </div>

            <h2 className="text-xl font-bold text-gray-800">
              Make New Friends
            </h2>

            <p className="text-gray-500 text-sm mt-3 max-w-[280px] leading-6">
              No conversations yet. Discover people, connect with students,
              trainers and professionals, then start chatting instantly.
            </p>

            <button
              onClick={() => navigate("/allpeoplepage")}
              className="
        mt-6
        bg-[#FF6B00]
        text-white
        px-8
        py-3
        rounded-2xl
        font-semibold
        shadow-lg
        hover:scale-105
        active:scale-95
        transition-all
      "
            >
              Make Friends
            </button>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto whitespace-nowrap no-scrollbar">
            {(activeTab === "group" ? filteredGroups : filteredUsers)
              .sort((a, b) => {
                const aUnread =
                  unreadCounts[
                    activeTab === "group"
                      ? a.id
                      : [user?.uid, a.uid].sort().join("_")
                  ] || 0;

                const bUnread =
                  unreadCounts[
                    activeTab === "group"
                      ? b.id
                      : [user?.uid, b.uid].sort().join("_")
                  ] || 0;

                if (aUnread > 0 && bUnread === 0) return -1;
                if (bUnread > 0 && aUnread === 0) return 1;

                return bUnread - aUnread;
              })
              .map((u) => {
                const unread =
                  unreadCounts[
                    activeTab === "group"
                      ? u.id
                      : [user?.uid, u.uid].sort().join("_")
                  ] || 0;

                return (
                  <div
                    key={u.uid || u.id}
                    onClick={() => {
                      if (activeTab === "group") {
                        setActiveChat({
                          id: u.id,
                          type: "group",
                        });

                        setActiveChatName(u.name);
                      } else {
                        startChat(u);
                      }

                      setScreen("chat");
                    }}
                    className="bg-white rounded-3xl p-4 mb-4 flex items-center gap-4 shadow-sm active:scale-[0.98] transition cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={getValidImage(u.profileImageUrl, u.name)}
                        className="w-14 h-14 rounded-full object-cover"
                        alt={u.name}
                      />

                      <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold truncate">{u.name}</h3>

                        <span className="text-[11px] text-gray-400">Now</span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-500 truncate">
                          {u.lastMessage || "Tap to chat"}
                        </p>

                        {unread > 0 && (
                          <div className="min-w-[22px] h-[22px] rounded-full bg-[#FF6B00] text-white text-xs flex items-center justify-center font-semibold">
                            {unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
      {/* ================= CREATE GROUP ================= */}
      {screen === "createGroup" && !activeChat && (
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="sticky top-10 bg-white z-20 border-b px-4 py-4 flex items-center gap-3">
            <button onClick={() => setScreen("chat")} className="text-lg">
              ←
            </button>

            <h2 className="font-semibold text-lg">Create Group</h2>
          </div>

          <div className="p-10">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group Name"
              className="w-full border rounded-2xl px-4 py-3 mb-5 outline-none"
            />

            <div className="space-y-4">
              {[...users]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((u) => (
                  <label
                    key={u.uid}
                    className="flex items-center gap-3 bg-[#f7f7f7] rounded-2xl p-3"
                  >
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        setSelectedMembers((p) =>
                          e.target.checked
                            ? [...p, u.uid]
                            : p.filter((id) => id !== u.uid),
                        );
                      }}
                    />

                    <img
                      src={getValidImage(u.profileImageUrl, u.name)}
                      className="w-12 h-12 rounded-full object-cover"
                    />

                    <div>
                      <p className="font-medium">{u.name}</p>

                      <p className="text-xs text-gray-500">{u.role}</p>
                    </div>
                  </label>
                ))}
            </div>

            <button
              onClick={submitCreateGroup}
              className="w-full mt-6 bg-[#FF6B00] text-white py-4 rounded-2xl font-semibold"
            >
              Create Group
            </button>
          </div>
        </div>
      )}

      {/* ================= PARTICIPANTS ================= */}
      {/* ================= PARTICIPANTS ================= */}
      {screen === "participants" && activeChat && (
        <div className="flex-1 bg-[#f7f7f7] overflow-y-auto">
          {/* HEADER */}
          <div className="sticky top-10 z-30 bg-white border-b px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => setScreen("chat")}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
            >
              ←
            </button>

            <div>
              <h2 className="font-bold text-lg">Participants</h2>
              <p className="text-xs text-gray-500">
                {memberObjects.length} members
              </p>
            </div>
          </div>

          {/* LIST */}
          <div className="p-4 space-y-4">
            {memberObjects.map((m) => (
              <div
                key={m.uid}
                className="bg-white rounded-3xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={getValidImage(m.profileImageUrl, m.name)}
                      className="w-14 h-14 rounded-full object-cover"
                    />

                    <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm">{m.name}</h3>

                    <p className="text-xs text-gray-500 capitalize">{m.role}</p>

                    {m.uid === user.uid && (
                      <span className="text-[11px] text-[#FF6B00] font-medium">
                        You
                      </span>
                    )}
                  </div>
                </div>

                {/* REMOVE BUTTON */}
                {isAdmin() && m.uid !== user.uid && (
                  <button
                    onClick={async () => {
                      const ok = window.confirm(`Remove ${m.name} from group?`);

                      if (!ok) return;

                      await removeParticipant(m.uid);
                    }}
                    className="px-4 py-2 rounded-full bg-red-50 text-red-500 text-xs font-semibold"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= ACTIVE CHAT ================= */}
      {screen === "chat" && activeChat && (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-[#f7f7f7]">
          {/* HEADER */}
          <div className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveChat(null)} className="md:hidden">
                ←
              </button>

              <div className="relative">
                <img
                  src={getValidImage("", activeChatName)}
                  className="w-11 h-11 rounded-full object-cover"
                />

                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              <div>
                <h2 className="font-semibold text-sm">{activeChatName}</h2>

                <p className="text-xs text-green-600">Online</p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative">
              {/* CALL BUTTON */}

              {/* MENU BUTTON */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <MoreVertical size={18} />
              </button>

              {/* DROPDOWN */}
              {showMenu && (
                <div className="absolute top-14 right-0 w-64 bg-white rounded-3xl shadow-2xl border overflow-hidden z-[999]">
                  {/* VIEW PARTICIPANTS */}
                  {activeChat?.type === "group" && (
                    <button
                      onClick={() => {
                        setScreen("participants");
                        setShowMenu(false);
                      }}
                      className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        👥
                      </div>

                      <div className="text-left">
                        <p className="font-semibold text-sm">
                          View Participants
                        </p>
                        <p className="text-xs text-gray-500">
                          See all group members
                        </p>
                      </div>
                    </button>
                  )}

                  {/* RENAME GROUP */}
                  {/* RENAME GROUP */}
                  {activeChat?.type === "group" && isAdmin() && (
                    <div className="border-t p-4">
                      <p className="text-sm font-semibold mb-2">Rename Group</p>

                      <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        placeholder="Enter new group name"
                        className="w-full border rounded-xl px-3 py-2 outline-none text-sm mb-3"
                      />

                      <button
                        onClick={async () => {
                          await renameGroup();
                          setShowMenu(false);
                        }}
                        className="w-full bg-[#FF6B00] text-white py-2 rounded-xl text-sm font-medium"
                      >
                        Save Name
                      </button>
                    </div>
                  )}
                  {/* DELETE GROUP */}
                  {activeChat?.type === "group" && isAdmin() && (
                    <button
                      onClick={async () => {
                        const ok = window.confirm(
                          "Delete this group permanently?",
                        );

                        if (!ok) return;

                        await deleteGroup();

                        setShowMenu(false);
                        setActiveChat(null);
                      }}
                      className="w-full px-5 py-4 flex items-center gap-3 hover:bg-red-50 transition border-t"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        🗑️
                      </div>

                      <div className="text-left">
                        <p className="font-semibold text-sm text-red-500">
                          Delete Group
                        </p>
                        <p className="text-xs text-gray-500">
                          Remove chat permanently
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-4">
            <div className="flex justify-center">
              <div className="bg-gray-200 text-xs px-4 py-1 rounded-full text-gray-600">
                Today
              </div>
            </div>

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.senderId === user?.uid ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[78%] px-4 py-3 shadow-sm ${
                    m.senderId === user?.uid
                      ? "bg-[#FFD8BF] rounded-2xl rounded-br-md"
                      : "bg-white rounded-2xl rounded-bl-md"
                  }`}
                >
                  {activeChat?.type === "group" && m.senderId !== user?.uid && (
                    <p className="text-[11px] font-semibold text-[#FF6B00] mb-1">
                      {users.find((u) => u.uid === m.senderId)?.name || "User"}
                    </p>
                  )}

                  {m.text && (
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {m.text}
                    </p>
                  )}

                  {m.audio && (
                    <audio controls className="mt-2">
                      <source src={m.audio} type="audio/webm" />
                    </audio>
                  )}

                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-gray-400">
                      {m.readBy?.length > 1 && m.senderId === user?.uid
                        ? "✓✓"
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* INPUT */}
          <div className="shrink-0 bg-[#f7f7f7] px-4 py-4 border-t">
            <div className="bg-white rounded-full flex items-center gap-3 px-4 py-3 shadow-lg">
              <button className="text-gray-500">📎</button>

              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                placeholder="Type message..."
                className="flex-1 outline-none text-sm bg-transparent"
              />

              {text.trim() ? (
                <button
                  onClick={sendMessage}
                  className="w-11 h-11 rounded-full bg-[#FF6B00] flex items-center justify-center text-white shrink-0"
                >
                  <Send size={18} />
                </button>
              ) : (
                <button onClick={handleMic}></button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
