import React, { useState, useEffect } from "react";
import { MoreVertical, Smile, Send, Mic } from "lucide-react";
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
import { useParams, useLocation } from "react-router-dom";

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
    <div className="flex h-screen w-full bg-[#f3f3f3] overflow-hidden">
      <div className="flex flex-col flex-1">
        {/* HEADER */}
        <div className="bg-[#efb082] px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Conversations</h1>
        </div>

        {/* TABS */}
        <div className="px-4 py-3 flex gap-3 bg-[#f3f3f3]">
          <button
            onClick={() => {
              setActiveTab("chats");
              setScreen("chat");
            }}
            className={`px-5 py-1 rounded-full text-sm font-medium ${
              activeTab === "chats"
                ? "bg-orange-500 text-white"
                : "bg-white border"
            }`}
          >
            Chats
          </button>

          <button
            onClick={() => {
              setActiveTab("group");
              setScreen("chat");
            }}
            className={`px-5 py-1 rounded-full text-sm font-medium ${
              activeTab === "group"
                ? "bg-orange-500 text-white"
                : "bg-white border"
            }`}
          >
            Group
          </button>
        </div>

        {/* TOP MENU */}
        <div className="flex items-center justify-between bg-[#efb082] mx-4 rounded-md px-4 py-3">
          <span className="font-medium">{activeChatName || "Chat"}</span>

          <div className="relative">
            <MoreVertical
              onClick={() => setShowMenu(!showMenu)}
              className="cursor-pointer"
            />

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-md border z-50">
                <button
                  onClick={() => {
                    setScreen("createGroup");
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  ➕ Create Group
                </button>

                {activeChat?.type === "group" && (
                  <>
                    <button
                      onClick={() => {
                        setScreen("participants");
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    >
                      👥 View Participants
                    </button>

                    {isAdmin() && (
                      <>
                        <button
                          onClick={() => {
                            setRenameValue(activeChatName);
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                        >
                          ✏ Rename Group
                        </button>

                        <button
                          onClick={deleteGroup}
                          className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600"
                        >
                          🗑 Delete Group
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RENAME INPUT */}
        {renameValue !== "" && isAdmin() && (
          <div className="px-4 py-2 flex gap-2 bg-white mx-4 mt-2 rounded border">
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="flex-1 border px-3 py-1 rounded text-sm"
              placeholder="New group name"
            />
            <button
              onClick={renameGroup}
              className="bg-orange-500 text-white px-3 rounded text-sm"
            >
              Save
            </button>
          </div>
        )}

        {/* ================= CREATE GROUP ================= */}
        {screen === "createGroup" && (
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="font-semibold mb-3">Create Group</h2>

            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group Name"
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <h3 className="font-semibold mt-2">Students</h3>
            {users
              .filter((u) => u.role === "student")
              .map((u) => (
                <label key={u.uid} className="flex items-center gap-2">
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
                  {u.name}
                </label>
              ))}

            <h3 className="font-semibold mt-4">Trainers</h3>
            {users
              .filter((u) => u.role === "trainer")
              .map((u) => (
                <label key={u.uid} className="flex items-center gap-2">
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
                  {u.name}
                </label>
              ))}

            <button
              onClick={submitCreateGroup}
              className="mt-5 bg-orange-500 text-white px-5 py-2 rounded"
            >
              Create Group
            </button>
          </div>
        )}

        {/* ================= PARTICIPANTS ================= */}
        {screen === "participants" && (
          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="font-semibold mb-4">Participants</h2>

            {memberObjects.map((m) => (
              <div
                key={m.uid}
                className="flex justify-between items-center border-b py-2"
              >
                <span>
                  {m.name} ({m.role})
                </span>

                {isAdmin() && m.uid !== user.uid && (
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
        )}

        {/* ================= CHAT ================= */}
        {screen === "chat" && (
          <>
            <div className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
              {messages.map((m) => {
                const sender = users.find((u) => u.uid === m.senderId);

                return m.senderId === user?.uid ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm flex flex-col gap-1 max-w-[75%]">
                      {activeChat?.type === "group" && (
                        <span className="text-[10px] opacity-80 text-right">
                          You
                        </span>
                      )}

                      <span>{m.text}</span>

                      {m.readBy?.length > 1 && (
                        <span className="text-[10px] opacity-80 text-right">
                          ✓✓
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex">
                    <div className="bg-gray-300 px-4 py-2 rounded-xl text-sm flex flex-col gap-1 max-w-[75%]">
                      {activeChat?.type === "group" && (
                        <span className="text-[10px] font-semibold text-gray-700">
                          {sender?.name || "User"}
                        </span>
                      )}

                      <span>{m.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-4 pb-4">
              <div className="flex items-center gap-3 border rounded-full px-4 py-2 bg-white">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type message..."
                  className="flex-1 outline-none text-sm"
                />
                <Send
                  onClick={sendMessage}
                  className="w-5 h-5 text-orange-500 cursor-pointer"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ================= RIGHT SIDEBAR ================= */}
      <div className="hidden lg:flex w-80 border-l bg-white flex-col">
        <div className="px-4 py-4 font-semibold border-b">Recent Chats</div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "group"
            ? groups.map((g) => (
                <div
                  key={g.id}
                  onClick={() => {
                    setActiveChat({ id: g.id, type: "group" });
                    setActiveChatName(g.name);
                    setScreen("chat");
                  }}
                  className="px-4 py-3 border-b hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-200 flex items-center justify-center font-bold text-orange-700">
                      {g.name?.charAt(0).toUpperCase()}
                    </div>
                    <span>{g.name}</span>
                  </div>

                  {unreadCounts[g.id] > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCounts[g.id]}
                    </span>
                  )}
                </div>
              ))
            : users.map((u) => (
                <div
                  key={u.uid}
                  onClick={() => startChat(u)}
                  className="px-4 py-3 border-b hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getValidImage(u.profileImageUrl, u.name)}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span>{u.name}</span>
                  </div>

                  {unreadCounts[[user?.uid, u.uid].sort().join("_")] > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCounts[[user?.uid, u.uid].sort().join("_")]}
                    </span>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
