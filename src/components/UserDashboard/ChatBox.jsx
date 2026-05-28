import React, { useState, useEffect } from "react";
import { MoreVertical, Smile, Send, Mic } from "lucide-react";
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
import { useSelectedStudent } from "../../context/SelectedStudentContext";
const ChatBox = () => {
  const [hasMobileNotification, setHasMobileNotification] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");
  const [screen, setScreen] = useState("chat");
  const [showMenu, setShowMenu] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [user, setUser] = useState(null);
  const [instituteId, setInstituteId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatName, setActiveChatName] = useState("");
  const [text, setText] = useState("");
  const [mutualFriends, setMutualFriends] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [renameValue, setRenameValue] = useState("");
  const { selectedStudentUid } = useSelectedStudent();
  const userCache = {};
  const chatUid = selectedStudentUid || user?.uid;
  const [chatFilter, setChatFilter] = useState("all");
  const getValidImage = (url, name) => {
    if (!url)
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    if (url.startsWith("blob:"))
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    return url;
  };
  useEffect(() => {
    const hasUnread = Object.values(unreadCounts).some((count) => count > 0);
    setHasMobileNotification(hasUnread);
  }, [unreadCounts]);
  const fetchUserProfile = async (uid) => {
    if (userCache[uid]) return userCache[uid];

    const collectionsToCheck = [
      "users",
      "students",
      "trainerstudents",
      "trainers",
      "institutes",
    ];

    for (const col of collectionsToCheck) {
      const snap = await getDoc(doc(db, col, uid));

      if (snap.exists()) {
        const d = snap.data();

        const profile = {
          uid,
          name:
            d.name ||
            d.instituteName ||
            d.founderName ||
            d.trainerName ||
            `${d.firstName || ""} ${d.lastName || ""}`.trim() ||
            "User",

          profileImageUrl:
            d.profileImageUrl || d.studentPhotoUrl || d.ownerPhotoUrl || "",

          role: d.role || col,
        };

        userCache[uid] = profile;

        return profile;
      }
    }

    const fallback = {
      uid,
      name: "User",
      profileImageUrl: "",
      role: "user",
    };

    userCache[uid] = fallback;

    return fallback;
  };

  useEffect(() => {
    if (!chatUid) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", chatUid),
    );

    const unsub = onSnapshot(q, async (snap) => {
      const chatsData = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();

          if (data.type === "group") return null;

          const members = data.members || [];

          const otherUid = members.find((id) => id !== chatUid);

          if (!otherUid) return null;

          const profile = await fetchUserProfile(otherUid);

          return {
            id: d.id,
            members,
            ...profile,
            lastAt: data.lastAt || data.createdAt,
            lastMessage: data.lastMessage || "",
          };
        }),
      );

      const filtered = chatsData
        .filter(Boolean)
        .sort((a, b) => (b.lastAt?.seconds || 0) - (a.lastAt?.seconds || 0));

      setRecentChats(filtered);
    });

    return () => unsub();
  }, [chatUid]);

  /* ================= AUTH + INSTITUTE ================= */
  /* ================= AUTH + INSTITUTE (FIXED) ================= */
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
  /* ================= MAIN INSTITUTE OWNER ================= */
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
            uid: data.customerUid || d.id,
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
  useEffect(() => {
    if (!chatUid || !instituteId) return;

    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", chatUid),
      where("instituteId", "==", instituteId),
    );

    const unsub = onSnapshot(q, (snap) => {
      setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [chatUid, instituteId]);

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
    return g?.adminId === chatUid;
  };

  /* ================= START CHAT ================= */
  const startChat = async (target) => {
    if (!chatUid || !instituteId) return;

    const chatId = [chatUid, target.uid].sort().join("_");
    const chatRef = doc(db, "chats", chatId);
    const snap = await getDoc(chatRef);

    if (!snap.exists()) {
      await setDoc(chatRef, {
        type: "individual",
        instituteId,
        members: [chatUid, target.uid],
        createdAt: serverTimestamp(),
        lastMessage: "",
      });
    }

    setActiveChat({ id: chatId, type: "individual" });
    setActiveChatName(target.name);
    setMessages([]);
    setScreen("chat");
  };

  /* ================= GROUP RENAME ================= */
  const renameGroup = async () => {
    if (!activeChat?.id || !renameValue.trim()) return;

    const gRef = doc(db, "groups", activeChat.id);
    const gSnap = await getDoc(gRef);
    if (!gSnap.exists()) return;
    if (gSnap.data().adminId !== chatUid) return;

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
    if (gSnap.data().adminId !== chatUid) return;

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
    if (!text.trim() || !activeChat?.id || !chatUid) return;

    const msgRef = collection(db, "chats", activeChat.id, "messages");

    await addDoc(msgRef, {
      text: text.trim(),
      senderId: chatUid,

      createdAt: serverTimestamp(),
      readBy: [chatUid], // ✅ read receipt
    });

    await updateDoc(doc(db, "chats", activeChat.id), {
      lastMessage: text.trim(),
      lastAt: serverTimestamp(),
    });

    setText("");
  };

  /* ================= AUTO READ ================= */
  useEffect(() => {
    if (!activeChat?.id || !chatUid) return;

    const markRead = async () => {
      const msgs = await getDocs(
        collection(db, "chats", activeChat.id, "messages"),
      );
      for (let m of msgs.docs) {
        const data = m.data();
        if (!data.readBy?.includes(chatUid)) {
          await updateDoc(doc(db, "chats", activeChat.id, "messages", m.id), {
            readBy: [...(data.readBy || []), chatUid],
          });
        }
      }
    };

    markRead();
  }, [activeChat, chatUid]);

  /* ================= UNREAD COUNT ================= */
  useEffect(() => {
    if (!chatUid || !instituteId) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", chatUid),
    );

    const unsub = onSnapshot(q, async (snap) => {
      let counts = {};

      for (let d of snap.docs) {
        const chatId = d.id;
        const msgs = await getDocs(collection(db, "chats", chatId, "messages"));

        let unread = 0;
        msgs.forEach((m) => {
          const data = m.data();
          if (!data.readBy?.includes(chatUid)) unread++;
        });

        counts[chatId] = unread;
      }

      setUnreadCounts(counts);
    });

    return () => unsub();
  }, [chatUid, instituteId]);
  useEffect(() => {
    setActiveChat(null);
    setMessages([]);
  }, [chatUid]);
  /* ================= CREATE GROUP ================= */
  const submitCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;

    const members = [...new Set([chatUid, ...selectedMembers])];

    const ref = await addDoc(collection(db, "groups"), {
      name: groupName,
      instituteId,
      members,
      adminId: user.uid,
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, "chats", ref.id), {
      type: "group",
      instituteId,
      members,
      createdAt: serverTimestamp(),
      name: groupName,
    });

    setActiveChat({ id: ref.id, type: "group" });
    setActiveChatName(groupName);
    setGroupName("");
    setSelectedMembers([]);
    setScreen("chat");
  };
  console.log("chatUid:", chatUid);
  console.log("selectedStudentUid:", selectedStudentUid);
  console.log("userUid:", user?.uid);
  /* ================= REMOVE PARTICIPANT ================= */
  const removeParticipant = async (uid) => {
    if (!activeChat?.id) return;

    const gRef = doc(db, "groups", activeChat.id);
    const snap = await getDoc(gRef);
    if (!snap.exists()) return;
    if (snap.data().adminId !== chatUid) return;

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
  return (
    <div className="flex h-[82vh] md:h-[60vh] w-full bg-[#f3f3f3] overflow-hidden rounded-xl">
      {/* ================= CHAT LIST ================= */}
      <div
        className={`
        ${activeChat && window.innerWidth < 768 ? "hidden" : "flex"}
        flex-col
        w-full
        md:w-[380px]
        bg-[#F8F8F8]
        border-r
        border-gray-100
        h-full
      `}
      >
        {/* HEADER */}
        <div className="px-5 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-black">Chat</h1>

            <button
              onClick={() => setShowSidebar(true)}
              className="relative bg-[#FF6B00] text-white px-4 py-2 rounded-full text-sm font-medium"
            >
              Chats
              {hasMobileNotification && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
              )}
            </button>
          </div>

          {/* SEARCH */}
          <div className="mt-5">
            <input
              placeholder="Search conversations"
              className="
              w-full
              bg-white
              rounded-2xl
              px-5
              py-3
              text-sm
              outline-none
              shadow-sm
              border
              border-gray-100
            "
            />
          </div>
        </div>

        {/* ACTIVE USERS */}
        <div className="px-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-[15px]">Active Users</h2>
          </div>

          <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
            <div className="flex gap-4 pb-3">
              {mutualFriends.slice(0, 20).map((friend) => (
                <div
                  key={friend.uid}
                  onClick={() => startChat(friend)}
                  className="flex flex-col items-center min-w-[72px] cursor-pointer"
                >
                  <div className="relative">
                    <img
                      src={getValidImage(friend.profileImageUrl, friend.name)}
                      className="w-16 h-16 rounded-full object-cover"
                    />

                    <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>

                  <span className="text-xs mt-2 font-medium text-gray-700 truncate w-full text-center">
                    {friend.name?.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHAT LIST */}
        {/* CHAT LIST */}
        {/* FILTER BUTTONS */}
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={() => setChatFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              chatFilter === "all"
                ? "bg-[#FF6B00] text-white"
                : "bg-white text-gray-600"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setChatFilter("individual")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              chatFilter === "individual"
                ? "bg-[#FF6B00] text-white"
                : "bg-white text-gray-600"
            }`}
          >
            Chats
          </button>

          <button
            onClick={() => setChatFilter("group")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              chatFilter === "group"
                ? "bg-[#FF6B00] text-white"
                : "bg-white text-gray-600"
            }`}
          >
            Groups
          </button>
        </div>

        {/* CHAT LIST */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 min-h-0">
          {[
            ...recentChats.map((c) => ({
              ...c,
              chatType: "individual",
            })),

            ...groups.map((g) => ({
              ...g,
              chatType: "group",
              lastAt: g.lastAt || g.createdAt,
            })),
          ]
            .filter((chat) => {
              if (chatFilter === "all") return true;
              return chat.chatType === chatFilter;
            })
            .sort((a, b) => (b.lastAt?.seconds || 0) - (a.lastAt?.seconds || 0))
            .map((chat) => {
              /* ================= GROUP ================= */
              if (chat.chatType === "group") {
                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setActiveChat({
                        id: chat.id,
                        type: "group",
                      });

                      setActiveChatName(chat.name);
                      setScreen("chat");
                    }}
                    className="
              bg-white
              rounded-3xl
              px-4
              py-4
              mb-3
              flex
              items-center
              gap-4
              shadow-sm
              cursor-pointer
            "
                  >
                    {/* GROUP AVATAR */}
                    <div className="relative">
                      <img
                        src={getValidImage("", chat.name)}
                        className="w-14 h-14 rounded-full object-cover"
                      />

                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#FF6B00] border-2 border-white rounded-full"></div>
                    </div>

                    {/* INFO */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-[15px] truncate">
                          {chat.name}
                        </h3>

                        <span className="text-[11px] text-gray-400">
                          {chat.lastAt?.seconds
                            ? new Date(
                                chat.lastAt.seconds * 1000,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-400 truncate pr-3">
                          {chat.lastMessage || "Group conversation"}
                        </p>

                        {unreadCounts[chat.id] > 0 && (
                          <div className="min-w-[22px] h-[22px] px-1 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-[11px] font-semibold">
                            {unreadCounts[chat.id]}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              /* ================= INDIVIDUAL ================= */
              const otherUid = chat.members?.find((m) => m !== chatUid) || "";

              let otherUser = users.find((u) => u.uid === otherUid);

              if (!otherUser) {
                otherUser = {
                  uid: otherUid,
                  name: chat.name || "User",
                  profileImageUrl: chat.profileImageUrl || "",
                };
              }

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChat({
                      id: chat.id,
                      type: "individual",
                    });

                    setActiveChatName(otherUser.name);
                    setScreen("chat");
                  }}
                  className="
            bg-white
            rounded-3xl
            px-4
            py-4
            mb-3
            flex
            items-center
            gap-4
            shadow-sm
            cursor-pointer
          "
                >
                  {/* AVATAR */}
                  <div className="relative">
                    <img
                      src={getValidImage(
                        otherUser.profileImageUrl,
                        otherUser.name,
                      )}
                      className="w-14 h-14 rounded-full object-cover"
                    />

                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>

                  {/* INFO */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[15px] truncate">
                        {otherUser.name}
                      </h3>

                      <span className="text-[11px] text-gray-400">
                        {chat.lastAt?.seconds
                          ? new Date(
                              chat.lastAt.seconds * 1000,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-400 truncate pr-3">
                        {chat.lastMessage || "Start conversation"}
                      </p>

                      {unreadCounts[chat.id] > 0 && (
                        <div className="min-w-[22px] h-[22px] px-1 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-[11px] font-semibold">
                          {unreadCounts[chat.id]}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ================= ACTIVE CHAT ================= */}
      <div
        className={`
        ${activeChat ? "flex" : "hidden md:flex"}
        flex-1
        flex-col
        bg-[#F4F4F4]
        h-full
        overflow-hidden
      `}
      >
        {/* TOP HEADER */}
        <div
          className="
          bg-white
          border-b
          border-gray-100
          px-4
          py-3
          flex
          items-center
          justify-between
          flex-shrink-0
          z-20
        "
        >
          <div className="flex items-center gap-3">
            {/* BACK */}
            <button
              onClick={() => {
                setActiveChat(null);
                setMessages([]);
              }}
              className="md:hidden text-xl"
            >
              ←
            </button>

            {/* PROFILE */}
            <div className="relative">
              <img
                src={getValidImage("", activeChatName)}
                className="w-11 h-11 rounded-full object-cover"
              />

              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            <div>
              <h2 className="font-semibold text-[15px]">
                {activeChatName || "Chat"}
              </h2>

              <p className="text-xs text-green-500">Online</p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-4">
            <button>📞</button>

            <MoreVertical
              size={20}
              className="cursor-pointer"
              onClick={() => setShowMenu(!showMenu)}
            />
          </div>
        </div>

        {/* MESSAGE AREA */}
        <div
          className="
          flex-1
          overflow-y-auto
          px-4
          py-5
          space-y-4
          min-h-0
          pb-[130px]
        "
        >
          {/* TODAY CHIP */}
          <div className="flex justify-center">
            <div className="bg-white text-gray-400 text-xs px-4 py-1 rounded-full shadow-sm">
              Today
            </div>
          </div>

          {messages.map((m) => {
            const sender = users.find((u) => u.uid === m.senderId);

            const isMine = m.senderId === chatUid;

            return (
              <div
                key={m.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                  max-w-[78%]
                  px-4
                  py-3
                  text-sm
                  shadow-sm
                  ${
                    isMine
                      ? "bg-[#FFE2CF] rounded-2xl rounded-tr-sm"
                      : "bg-white rounded-2xl rounded-tl-sm"
                  }
                `}
                >
                  {activeChat?.type === "group" && !isMine && (
                    <p className="text-[11px] font-semibold text-[#FF6B00] mb-1">
                      {sender?.name || "User"}
                    </p>
                  )}

                  <p className="whitespace-pre-wrap break-words">{m.text}</p>

                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-gray-400">
                      {m.readBy?.length > 1 && isMine ? "✓✓" : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT BAR */}
        <div
          className="
          bg-[#F4F4F4]
          border-t
          border-gray-100
          px-3
          pt-2
          pb-[calc(env(safe-area-inset-bottom)+12px)]
          flex-shrink-0
        "
        >
          <div className="flex items-end gap-3">
            {/* INPUT */}
            <div
              className="
              flex-1
              bg-white
              rounded-full
              px-4
              py-3
              flex
              items-center
              gap-3
              shadow-sm
            "
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message"
                className="flex-1 outline-none text-sm bg-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
              />
            </div>

            {/* SEND BUTTON */}
            <button
              onClick={sendMessage}
              className="
              w-14
              h-14
              rounded-full
              bg-[#FF6B00]
              flex
              items-center
              justify-center
              shadow-lg
              shrink-0
            "
            >
              {text.trim() ? (
                <Send size={20} className="text-white" />
              ) : (
                <Mic size={22} className="text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
