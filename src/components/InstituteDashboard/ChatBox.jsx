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
  return (
    <div className="flex h-[82vh] md:h-[60vh] w-full bg-[#f3f3f3] overflow-hidden rounded-xl">
      <div className="flex flex-col flex-1">
        {/* HEADER */}
        <div className="bg-[#efb082] px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Conversations</h1>

          {/* MOBILE RECENT CHATS BUTTON */}
          <button
            className="lg:hidden bg-white px-3 py-1 rounded text-sm relative"
            onClick={() => setShowRecentChats(true)}
          >
            Chats
            {/* unread indicator */}
            {Object.values(unreadCounts).some((count) => count > 0) && (
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
              <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-xl border z-50 overflow-hidden">
                {/* CREATE GROUP */}
                <button
                  onClick={() => {
                    setScreen("createGroup");
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-sm"
                >
                  <span className="w-5 h-5 flex items-center justify-center text-black text-[24px] font-bold leading-none">
                    +
                  </span>
                  <span>Create Group</span>
                </button>

                {activeChat?.type === "group" && (
                  <>
                    {/* VIEW PARTICIPANTS */}
                    <button
                      onClick={() => {
                        setScreen("participants");
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-sm"
                    >
                      <img
                        src="/contact.png"
                        className="w-4 h-4 object-contain"
                      />
                      <span>View Participants</span>
                    </button>

                    {isAdmin() && (
                      <>
                        {/* RENAME GROUP */}
                        <button
                          onClick={() => {
                            setRenameValue(activeChatName);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 text-sm"
                        >
                          <img src="/edit-icon.png" className="w-5 h-5" />
                          <span>Rename Group</span>
                        </button>

                        {/* DELETE GROUP */}
                        <button
                          onClick={deleteGroup}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-sm text-red-600"
                        >
                          <img src="/delete-icon.png" className="w-5 h-5" />
                          <span>Delete Group</span>
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
              .sort((a, b) => a.name.localeCompare(b.name))
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
              .sort((a, b) => a.name.localeCompare(b.name))
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
            <div className="flex flex-col flex-1 overflow-hidden">
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

                      {m.text && <span>{m.text}</span>}

                      {m.audio && (
                        <audio controls className="mt-1">
                          <source src={m.audio} type="audio/webm" />
                        </audio>
                      )}

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

                      {m.text && <span>{m.text}</span>}

                      {m.audio && (
                        <audio controls className="mt-1">
                          <source src={m.audio} type="audio/webm" />
                        </audio>
                      )}

                      {m.audio && (
                        <audio controls className="mt-1">
                          <source src={m.audio} type="audio/webm" />
                        </audio>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t bg-white p-3">
              <div className="flex items-end gap-3 border rounded-xl px-4 py-2 bg-white">
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  placeholder="Type message..."
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 outline-none text-sm resize-none max-h-32 overflow-y-auto"
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
      <div className="hidden lg:flex w-80 border-l bg-white flex-col h-screen">
        <div className="px-4 py-4 font-semibold border-b">Recent Chats</div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "group"
            ? groups
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((g) => (
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
            : [...users, ...chatUsers]
                .sort((a, b) => {
                  const aUnread =
                    unreadCounts[[user?.uid, a.uid].sort().join("_")] || 0;

                  const bUnread =
                    unreadCounts[[user?.uid, b.uid].sort().join("_")] || 0;

                  /* ✅ unread chats first */
                  if (aUnread > 0 && bUnread === 0) return -1;
                  if (bUnread > 0 && aUnread === 0) return 1;

                  /* ✅ more unread count first */
                  if (bUnread !== aUnread) return bUnread - aUnread;

                  /* ✅ owner first after unread */
                  if (a.role === "owner") return -1;
                  if (b.role === "owner") return 1;

                  /* ✅ then alphabetical */
                  return a.name.localeCompare(b.name);
                })
                .map((u) => (
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
                      <div className="flex items-center gap-2">
                        <span>{u.name}</span>

                        {u.badge && (
                          <span
                            className={`text-[10px] px-2 py-[2px] rounded-full ${
                              u.role === "solotrainer"
                                ? "bg-blue-100 text-blue-700"
                                : u.role === "outerinstitute"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {u.badge}
                          </span>
                        )}
                      </div>
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
      {showRecentChats && (
        <div className="fixed inset-0 bg-white z-[999] flex flex-col lg:hidden">
          {/* HEADER */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Recent Chats</h2>
            <button onClick={() => setShowRecentChats(false)}>✕</button>
          </div>

          {/* CHAT LIST */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "group"
              ? groups.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => {
                      setActiveChat({ id: g.id, type: "group" });
                      setActiveChatName(g.name);
                      setScreen("chat");
                      setShowRecentChats(false);
                    }}
                    className="px-4 py-3 border-b flex justify-between"
                  >
                    <span>{g.name}</span>
                    {unreadCounts[g.id] > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 rounded-full">
                        {unreadCounts[g.id]}
                      </span>
                    )}
                  </div>
                ))
              : /* ================= REPLACE MOBILE LIST ================= */

                [...users, ...chatUsers]
                  .sort((a, b) => {
                    const aUnread =
                      unreadCounts[[user?.uid, a.uid].sort().join("_")] || 0;

                    const bUnread =
                      unreadCounts[[user?.uid, b.uid].sort().join("_")] || 0;

                    if (aUnread > 0 && bUnread === 0) return -1;
                    if (bUnread > 0 && aUnread === 0) return 1;

                    if (bUnread !== aUnread) return bUnread - aUnread;

                    if (a.role === "owner") return -1;
                    if (b.role === "owner") return 1;

                    return a.name.localeCompare(b.name);
                  })
                  .map((u) => (
                    <div
                      key={u.uid}
                      onClick={() => {
                        startChat(u);
                        setShowRecentChats(false);
                      }}
                      className="px-4 py-3 border-b flex justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span>{u.name}</span>

                        {u.badge && (
                          <span
                            className={`text-[10px] px-2 py-[2px] rounded-full ${
                              u.role === "solotrainer"
                                ? "bg-blue-100 text-blue-700"
                                : u.role === "outerinstitute"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {u.badge}
                          </span>
                        )}
                      </div>

                      {unreadCounts[[user?.uid, u.uid].sort().join("_")] >
                        0 && (
                        <span className="bg-red-500 text-white text-xs px-2 rounded-full">
                          {unreadCounts[[user?.uid, u.uid].sort().join("_")]}
                        </span>
                      )}
                    </div>
                  ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
