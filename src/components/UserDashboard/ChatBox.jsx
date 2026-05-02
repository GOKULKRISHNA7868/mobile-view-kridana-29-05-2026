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

  const chatUid = selectedStudentUid || user?.uid;
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
  useEffect(() => {
    if (!chatUid) return;

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", chatUid),
    );

    const unsub = onSnapshot(q, async (snap) => {
      let arr = [];

      for (const d of snap.docs) {
        const data = d.data();

        if (data.type === "group") continue;

        const members = data.members || [];
        const otherUid = members.find((id) => id !== chatUid);

        if (!otherUid) continue;

        let profile = {
          uid: otherUid,
          name: "User",
          profileImageUrl: "",
        };

        /* ================= TRAINERS ================= */
        const trainerSnap = await getDoc(doc(db, "trainers", otherUid));

        if (trainerSnap.exists()) {
          const t = trainerSnap.data();

          profile = {
            uid: otherUid,
            name: `${t.firstName || ""} ${t.lastName || ""}`.trim(),
            profileImageUrl: t.profileImageUrl || "",
          };
        } else {
          /* ================= INSTITUTE ================= */
          const instSnap = await getDoc(doc(db, "institutes", otherUid));

          if (instSnap.exists()) {
            const i = instSnap.data();

            profile = {
              uid: otherUid,
              name:
                i.instituteName ||
                i.founderName ||
                `${i.firstName || ""} ${i.lastName || ""}`.trim() ||
                "Institute Admin",
              profileImageUrl: i.profileImageUrl || "",
            };
          } else {
            /* ================= INSTITUTE TRAINERS ================= */
            const tq = query(
              collection(db, "InstituteTrainers"),
              where("trainerUid", "==", otherUid),
            );

            const ts = await getDocs(tq);

            if (!ts.empty) {
              const t = ts.docs[0].data();

              profile = {
                uid: otherUid,
                name: `${t.firstName || ""} ${t.lastName || ""}`.trim(),
                profileImageUrl: t.profileImageUrl || "",
              };
            } else {
              /* ================= STUDENTS ================= */
              const stuSnap = await getDoc(doc(db, "students", otherUid));

              if (stuSnap.exists()) {
                const s = stuSnap.data();

                profile = {
                  uid: otherUid,
                  name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
                  profileImageUrl: s.studentPhotoUrl || s.profileImageUrl || "",
                };
              }
            }
          }
        }

        arr.push({
          id: d.id,
          members: members, // ✅ VERY IMPORTANT
          ...profile,
          lastAt: data.lastAt || data.createdAt,
          lastMessage: data.lastMessage || "",
        });
      }

      arr.sort((a, b) => (b.lastAt?.seconds || 0) - (a.lastAt?.seconds || 0));

      setRecentChats(arr);
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
    <div className="flex h-screen w-full bg-[#f3f3f3] overflow-hidden">
      <div className="flex flex-col flex-1">
        {/* HEADER */}
        <div className="bg-[#efb082] px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Conversations</h1>

          {/* REMOVE THREE DOTS + SHOW CHATS BUTTON */}
          <button
            onClick={() => {
              setShowSidebar(true);
              setHasMobileNotification(false); // remove blink after open
            }}
            className="relative bg-white px-4 py-2 rounded-full text-sm font-medium shadow"
          >
            Chats
            {/* RED BLINK IF NEW MESSAGE */}
            {hasMobileNotification && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
            )}
          </button>
        </div>

        {/* TABS */}
        <div className="px-4 py-3 flex gap-3 bg-[#f3f3f3]">
          <button
            onClick={() => {
              setActiveTab("chats");
              setScreen("chat");
              setHasMobileNotification(false); // remove blink when opened
            }}
            className={`relative px-5 py-1 rounded-full text-sm font-medium ${
              activeTab === "chats"
                ? "bg-orange-500 text-white"
                : "bg-white border"
            }`}
          >
            Chats
            {/* MOBILE RED BLINK DOT */}
            {hasMobileNotification && activeTab !== "chats" && (
              <span className="lg:hidden absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
            )}
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

                {isAdmin() && m.uid !== chatUid && (
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

                return m.senderId === chatUid ? (
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
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* ================= RIGHT SIDEBAR ================= */}
      {/* ================= RIGHT SIDEBAR ================= */}
      <div
        className={`
    fixed lg:static top-0 right-0 h-full w-80 bg-white z-50
    transform transition-all duration-300 ease-in-out
    ${showSidebar ? "translate-x-0 shadow-2xl" : "translate-x-full"}
    lg:translate-x-0 lg:flex flex-col border-l
  `}
      >
        <div className="px-4 py-4 font-semibold border-b flex justify-between items-center">
          <span></span>

          <button
            onClick={() => setShowSidebar(false)}
            className="lg:hidden text-sm text-gray-500"
          >
            Close
          </button>
        </div>
        <div className="px-4 py-4 font-semibold border-b">Recent Chats</div>
        {/* ================= RIGHT SIDEBAR ================= */}

        <div className="flex-1 overflow-y-auto">
          {activeTab === "group" ? (
            groups.map((g) => (
              <div
                key={g.id}
                onClick={() => {
                  setActiveChat({ id: g.id, type: "group" });
                  setActiveChatName(g.name);
                  setScreen("chat");
                  setShowSidebar(false);
                }}
                className="px-4 py-3 border-b hover:bg-gray-100 cursor-pointer"
              >
                {g.name}
              </div>
            ))
          ) : (
            <>
              {/* ================= RECENT CHATS ================= */}
              {recentChats.map((chat) => {
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
                    onClick={async () => {
                      setShowSidebar(false);

                      await new Promise((r) => setTimeout(r, 100));

                      setActiveChat({
                        id: chat.id,
                        type: "individual",
                      });

                      setActiveChatName(otherUser.name);
                      setScreen("chat");
                    }}
                    className="px-4 py-3 border-b hover:bg-gray-100 cursor-pointer flex justify-between"
                  >
                    <div className="flex gap-3 items-center">
                      <img
                        src={getValidImage(
                          otherUser.profileImageUrl,
                          otherUser.name,
                        )}
                        className="w-9 h-9 rounded-full object-cover"
                      />

                      <div>
                        <div className="font-medium">{otherUser.name}</div>
                        <div className="text-xs text-gray-500 truncate w-40">
                          {chat.lastMessage || ""}
                        </div>
                      </div>
                    </div>

                    {unreadCounts[chat.id] > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {unreadCounts[chat.id]}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* ================= FRIENDS WHO MUTUAL FOLLOW ================= */}
              {mutualFriends
                .filter(
                  (f) =>
                    !recentChats.some((chat) => chat.members?.includes(f.uid)),
                )
                .map((friend) => (
                  <div
                    key={friend.uid}
                    onClick={() => startChat(friend)}
                    className="px-4 py-3 border-b hover:bg-orange-50 cursor-pointer"
                  >
                    <div className="flex gap-3 items-center">
                      <img
                        src={getValidImage(friend.profileImageUrl, friend.name)}
                        className="w-9 h-9 rounded-full object-cover"
                      />

                      <div>
                        <div className="font-medium">{friend.name}</div>
                        <div className="text-xs text-orange-500">
                          Start Chat
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
