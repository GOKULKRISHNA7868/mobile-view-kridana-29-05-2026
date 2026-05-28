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

const ChatBox = () => {
  const [activeTab, setActiveTab] = useState("chats");
  const [screen, setScreen] = useState("chat");
  const [showMenu, setShowMenu] = useState(false);

  const [user, setUser] = useState(null);
  const [trainerId, setTrainerId] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const chatUid = user?.uid;
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);

  const [activeChat, setActiveChat] = useState(null);
  const [activeChatName, setActiveChatName] = useState("");
  const [text, setText] = useState("");
  const [mutualFriends, setMutualFriends] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [renameValue, setRenameValue] = useState("");
  const getValidImage = (url, name) => {
    if (!url)
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    if (url.startsWith("blob:"))
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    return url;
  };
  /* =====================================================
REPLACE OLD fetchUserProfile FUNCTION WITH THIS
NOW SUPPORTS:
users
students
trainerstudents
trainers
institutes
===================================================== */
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", user.uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setRecentChats(arr);
    });

    return () => unsub();
  }, [user]);
  const fetchUserProfile = async (uid) => {
    /* ================= USERS ================= */
    const userSnap = await getDoc(doc(db, "users", uid));
    if (userSnap.exists()) {
      const d = userSnap.data();

      return {
        uid,
        name: d.name || "User",
        profileImageUrl: d.profileImageUrl || "",
        role: d.role || "user",
      };
    }

    /* ================= STUDENTS ================= */
    const stuSnap = await getDoc(doc(db, "students", uid));
    if (stuSnap.exists()) {
      const d = stuSnap.data();

      return {
        uid,
        name: `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Student",
        profileImageUrl: d.profileImageUrl || d.studentPhotoUrl || "",
        role: d.role || "student",
      };
    }

    /* ================= TRAINER STUDENTS ================= */
    const tsSnap = await getDoc(doc(db, "trainerstudents", uid));
    if (tsSnap.exists()) {
      const d = tsSnap.data();

      return {
        uid,
        name: `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Student",
        profileImageUrl: d.profileImageUrl || "",
        role: d.role || "student",
      };
    }

    /* ================= TRAINERS ================= */
    const trainerSnap = await getDoc(doc(db, "trainers", uid));
    if (trainerSnap.exists()) {
      const d = trainerSnap.data();

      return {
        uid,
        name:
          `${d.firstName || ""} ${d.lastName || ""}`.trim() ||
          d.trainerName ||
          "Trainer",
        profileImageUrl: d.profileImageUrl || "",
        role: d.role || "trainer",
      };
    }

    /* ================= INSTITUTES ================= */
    const instSnap = await getDoc(doc(db, "institutes", uid));
    if (instSnap.exists()) {
      const d = instSnap.data();

      return {
        uid,
        name: d.instituteName || d.founderName || "Institute",
        profileImageUrl: d.profileImageUrl || "",
        role: d.role || "institute",
      };
    }

    /* ================= DEFAULT ================= */
    return {
      uid,
      name: "User",
      profileImageUrl: "",
      role: "user",
    };
  };
  useEffect(() => {
    if (!chatUid) return;

    const q = query(collection(db, "followers"));

    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map((d) => d.data());

      /* people i follow */
      const iFollow = docs
        .filter((x) => x.followerId === chatUid)
        .map((x) => x.profileId);

      /* follow me */
      const followMe = docs
        .filter((x) => x.profileId === chatUid)
        .map((x) => x.followerId);

      /* mutual */
      const mutualIds = iFollow.filter((id) => followMe.includes(id));

      let arr = [];

      for (const uid of mutualIds) {
        const p = await fetchUserProfile(uid);
        arr.push(p);
      }

      setMutualFriends(arr);
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
      const instRef = doc(db, "trainers", u.uid);
      const instSnap = await getDoc(instRef);
      if (instSnap.exists()) {
        setInstituteId(u.uid);
        return;
      }

      /* -------- 2. Check Student -------- */
      const studentRef = doc(db, "trainerstudents", u.uid);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const data = studentSnap.data();
        setTrainerId(data.trainerId); // ✅ IMPORTANT
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
        setInstituteId(data.trainerId); // ✅ IMPORTANT
        return;
      }
    });

    return () => unsub();
  }, []);
  useEffect(() => {
    if (!trainerId) return;

    let unsub = null;

    const loadUsersForStudent = async () => {
      // 1️⃣ Get the main trainer (owner)
      const trainerRef = doc(db, "trainers", trainerId);
      const trainerSnap = await getDoc(trainerRef);

      let mainTrainer = null;
      if (trainerSnap.exists()) {
        const tData = trainerSnap.data();
        mainTrainer = {
          id: trainerId,
          uid: trainerId,
          name: `${tData.firstName || ""} ${tData.lastName || ""}`.trim(),
          role: "trainer",
          profileImageUrl: tData.profileImageUrl || "",
        };
      }

      // 2️⃣ Get other students
      const qStudents = query(
        collection(db, "trainerstudents"),
        where("trainerId", "==", trainerId),
      );
      unsub = onSnapshot(qStudents, (snap) => {
        const students = snap.docs.map((d) => {
          const s = d.data();
          return {
            id: d.id,
            uid: s.studentUid,
            name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
            role: "student",
            profileImageUrl: s.studentPhotoUrl || s.profileImageUrl || "",
          };
        });

        // Merge main trainer + students
        const merged = mainTrainer ? [mainTrainer, ...students] : [...students];

        setUsers(merged);
      });
    };

    loadUsersForStudent();

    return () => {
      if (unsub) unsub();
    };
  }, [trainerId]);
  /* ================= USERS ================= */
  useEffect(() => {
    if (!trainerId) return;

    const unsubStudents = onSnapshot(
      query(
        collection(db, "trainerstudents"),
        where("trainerId", "==", trainerId),
      ),
      (snap) => {
        const s = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            uid: data.studentUid,
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
        where("trainerId", "==", trainerId),
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
  }, [trainerId]);

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
    try {
      if (!user?.uid || !target?.uid) return;

      const chatId = [user.uid, target.uid].sort().join("_");

      const chatRef = doc(db, "chats", chatId);
      const snap = await getDoc(chatRef);

      if (!snap.exists()) {
        await setDoc(chatRef, {
          type: "individual",
          members: [user.uid, target.uid],
          trainerId: trainerId || null,
          createdAt: serverTimestamp(),
          lastMessage: "",
          lastAt: serverTimestamp(),
        });
      }

      // force open selected chat
      setActiveChat({
        id: chatId,
        type: "individual",
        members: [user.uid, target.uid],
      });

      setActiveChatName(target.name || "User");
      setMessages([]);
      setText("");
      setScreen("chat");
      setShowSidebar(false);
    } catch (error) {
      console.log(error);
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
    if (!text.trim()) return;
    if (!activeChat?.id) return;
    if (!user?.uid) return;

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
    if (!groupName.trim() || selectedMembers.length === 0) return;

    const members = [...new Set([user.uid, ...selectedMembers])];

    const ref = await addDoc(collection(db, "groups"), {
      name: groupName,
      trainerId,
      members,
      adminId: user.uid,
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, "chats", ref.id), {
      type: "group",
      trainerId,
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
    .map((uid) => users.find((u) => u.uid === uid))
    .filter(Boolean);
  return (
    <div className="h-screen w-full bg-[#f4f7fb] flex overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <div
        className={`
      ${activeChat ? "hidden md:flex" : "flex"}
      w-full md:w-[360px] bg-white border-r border-gray-200 flex-col
    `}
      >
        {/* HEADER */}
        <div className="px-5 py-5 border-b bg-white sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
              <p className="text-sm text-gray-500">Connect with your people</p>
            </div>

            {activeTab === "group" && (
              <button
                onClick={() => setScreen("createGroup")}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow"
              >
                + Group
              </button>
            )}
          </div>

          {/* TABS */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => {
                setActiveTab("chats");
                setScreen("chat");
              }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === "chats"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Chats
            </button>

            <button
              onClick={() => {
                setActiveTab("group");
                setScreen("chat");
              }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === "group"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Groups
            </button>
          </div>
        </div>

        {/* CREATE GROUP */}
        {screen === "createGroup" && (
          <div className="p-4 overflow-y-auto border-b bg-[#fafafa]">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="font-semibold text-lg mb-4">Create Group</h2>

              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none mb-4"
              />

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {users.map((u) => (
                  <label
                    key={u.uid}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(u.uid)}
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
                      className="w-11 h-11 rounded-full object-cover"
                    />

                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {u.role}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setScreen("chat")}
                  className="flex-1 border border-gray-300 rounded-xl py-3"
                >
                  Cancel
                </button>

                <button
                  onClick={submitCreateGroup}
                  className="flex-1 bg-orange-500 text-white rounded-xl py-3"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAT LIST */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === "group" ? (
            groups.map((g) => (
              <div
                key={g.id}
                onClick={() => {
                  setActiveChat({ id: g.id, type: "group" });
                  setActiveChatName(g.name);
                  setScreen("chat");
                }}
                className="bg-white hover:bg-orange-50 transition rounded-2xl p-4 mb-3 cursor-pointer shadow-sm flex items-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                  {g.name?.charAt(0)}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{g.name}</h3>

                  <p className="text-sm text-gray-500 truncate">
                    Group conversation
                  </p>
                </div>
              </div>
            ))
          ) : (
            <>
              {recentChats.map((chat) => {
                const otherUid = chat.members?.find((m) => m !== chatUid) || "";

                let otherUser = users.find((u) => u.uid === otherUid);

                if (!otherUser) {
                  otherUser = {
                    uid: otherUid,
                    name: chat.name || "User",
                    profileImageUrl: "",
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
                    className="bg-white hover:bg-orange-50 transition rounded-2xl p-4 mb-3 cursor-pointer shadow-sm flex items-center gap-3"
                  >
                    <img
                      src={getValidImage(
                        otherUser.profileImageUrl,
                        otherUser.name,
                      )}
                      className="w-14 h-14 rounded-full object-cover"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {otherUser.name}
                      </h3>

                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessage || "Start conversation"}
                      </p>
                    </div>

                    {unreadCounts[chat.id] > 0 && (
                      <div className="min-w-[22px] h-[22px] bg-orange-500 text-white rounded-full flex items-center justify-center text-xs">
                        {unreadCounts[chat.id]}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* ================= CHAT AREA ================= */}
      <div
        className={`
      ${activeChat ? "flex" : "hidden md:flex"}
      flex-1 flex-col bg-[#eef2f7]
    `}
      >
        {/* CHAT HEADER */}
        <div className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveChat(null)} className="md:hidden">
              ←
            </button>

            <img
              src={getValidImage("", activeChatName)}
              className="w-12 h-12 rounded-full object-cover"
            />

            <div>
              <h2 className="font-semibold text-gray-800">
                {activeChatName || "Select Chat"}
              </h2>

              <p className="text-sm text-green-500">Online</p>
            </div>
          </div>

          <div className="relative">
            <MoreVertical
              className="cursor-pointer text-gray-600"
              onClick={() => setShowMenu(!showMenu)}
            />

            {showMenu && activeChat?.type === "group" && (
              <div className="absolute right-0 mt-2 bg-white rounded-2xl shadow-lg border w-56 overflow-hidden z-50">
                <button
                  onClick={() => {
                    setScreen("participants");
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm"
                >
                  Participants
                </button>

                {isAdmin() && (
                  <>
                    <button
                      onClick={() => {
                        setRenameValue(activeChatName);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm"
                    >
                      Rename Group
                    </button>

                    <button
                      onClick={deleteGroup}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-500 text-sm"
                    >
                      Delete Group
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RENAME */}
        {renameValue !== "" && isAdmin() && (
          <div className="p-4 bg-white border-b flex gap-3">
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="flex-1 border rounded-xl px-4 py-3 outline-none"
              placeholder="Rename group"
            />

            <button
              onClick={renameGroup}
              className="bg-orange-500 text-white px-5 rounded-xl"
            >
              Save
            </button>
          </div>
        )}

        {/* PARTICIPANTS */}
        {screen === "participants" && (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-semibold text-lg mb-4">Participants</h2>

              <div className="space-y-3">
                {memberObjects.map((m) => (
                  <div
                    key={m.uid}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getValidImage(m.profileImageUrl, m.name)}
                        className="w-12 h-12 rounded-full object-cover"
                      />

                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {m.role}
                        </p>
                      </div>
                    </div>

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
            </div>
          </div>
        )}

        {/* MESSAGES */}
        {screen === "chat" && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
              {messages.map((m) => {
                const sender = users.find((u) => u.uid === m.senderId);

                const isMine = m.senderId === user?.uid;

                return (
                  <div
                    key={m.id}
                    className={`flex ${
                      isMine ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                        isMine
                          ? "bg-orange-500 text-white rounded-br-md"
                          : "bg-white text-gray-800 rounded-bl-md"
                      }`}
                    >
                      {activeChat?.type === "group" && !isMine && (
                        <p className="text-xs font-semibold text-orange-500 mb-1">
                          {sender?.name || "User"}
                        </p>
                      )}

                      <p className="text-sm break-words">{m.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* INPUT */}
            <div className="bg-white border-t px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center bg-[#f4f7fb] rounded-full px-4 py-3">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type message..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMessage();
                    }}
                  />
                </div>

                <button
                  onClick={sendMessage}
                  className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow"
                >
                  <Send className="text-white w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
