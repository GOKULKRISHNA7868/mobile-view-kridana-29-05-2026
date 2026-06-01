import React, { useState, useEffect } from "react";
import { MoreVertical, Smile, Send, Mic, ArrowLeft } from "lucide-react";
import { db, auth } from "../firebase";
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
import { useParams, useLocation, useNavigate } from "react-router-dom";

const ChatBox = () => {
  const [activeTab, setActiveTab] = useState("chats");
  const [screen, setScreen] = useState("chat");
  const [showMenu, setShowMenu] = useState(false);

  const [user, setUser] = useState(null);
  const [instituteId, setInstituteId] = useState(null);

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);

  const [activeChat, setActiveChat] = useState(null);
  const [activeChatName, setActiveChatName] = useState("");
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [renameValue, setRenameValue] = useState("");
  const { chatId } = useParams();
  const location = useLocation();
  const initialChatName = location.state?.chatName || "Chat";
  const getValidImage = (url, name) => {
    if (!url)
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    if (url.startsWith("blob:"))
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    return url;
  };

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
  useEffect(() => {
    if (!chatId) return; // 🔥 prevents crash

    setActiveChat({ id: chatId, type: "individual" });
    setActiveChatName(initialChatName);
    setScreen("chat");
  }, [chatId]);
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
            uid: d.id,
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
    if (!user || !instituteId) return;

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
    if (!groupName.trim() || selectedMembers.length === 0) return;
    const members = [...new Set([user.uid, ...selectedMembers])].filter(
      (m) => m,
    ); // 🔥 REMOVE UNDEFINED USERS

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
  return (
    <div className="h-[95dvh] bg-[#f5f5f5] flex flex-col overflow-hidden touch-none">
      {/* HEADER */}
      <div
        className="
  bg-[#efb082]
  px-4
  py-3
  flex
  items-center
  justify-between
  shadow-sm
  "
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="
      flex
      items-center
      justify-center
      w-9
      h-9
      rounded-full
      hover:bg-black/10
      transition
      "
          >
            <ArrowLeft size={22} />
          </button>

          <div>
            <h2 className="font-semibold text-[16px]">
              {activeChatName || "Conversation"}
            </h2>

            <p className="text-xs opacity-70">Chat</p>
          </div>
        </div>

        <MoreVertical size={20} className="cursor-pointer" />
      </div>

      {/* CHAT AREA */}
      <div
        className="
      flex-1
      overflow-y-auto
      px-3
      py-4
      space-y-3
      "
      >
        {messages.map((m) => {
          const isMe = m.senderId === user?.uid;

          const sender = users.find((u) => u.uid === m.senderId);

          return (
            <div
              key={m.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`
              max-w-[80%]
              rounded-2xl
              px-4
              py-2
              shadow-sm
              ${isMe ? "bg-orange-500 text-white" : "bg-white"}
              `}
              >
                {!isMe && (
                  <div className="text-[11px] font-semibold mb-1">
                    {sender?.name || "User"}
                  </div>
                )}

                <div className="text-sm break-words">{m.text}</div>

                {isMe && m.readBy?.length > 1 && (
                  <div className="text-[10px] text-right mt-1">✓✓</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT */}
      <div
        className="
      bg-white
         bottom-10
      border-t
      px-3
      py-2
      pb-[calc(env(safe-area-inset-bottom)+8px)]
      "
      >
        <div
          className="
        flex
     
        items-center
        gap-2
        bg-[#f8f8f8]
        rounded-full
        px-3
        py-2
        "
        >
          <Smile size={20} className="text-gray-500" />

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="
          flex-1
          bg-transparent
          outline-none
          text-sm
          "
          />

          {text.trim() ? (
            <button
              onClick={sendMessage}
              className="
            bg-orange-500
            text-white
            p-2
            rounded-full
            "
            >
              <Send size={18} />
            </button>
          ) : (
            <button
              className="
            bg-orange-500
            text-white
            p-2
            rounded-full
            "
            >
              <Mic size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
