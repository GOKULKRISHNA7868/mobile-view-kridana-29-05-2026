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
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useRef } from "react";
const ChatBox = () => {
  const [activeTab, setActiveTab] = useState("chats");
  const [screen, setScreen] = useState("chat");
  const [showMenu, setShowMenu] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [instituteId, setInstituteId] = useState(null);
  const notifiedRequests = useRef(new Set());
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [messages, setMessages] = useState([]);
  const notificationAudio = useRef(
    new Audio(
      "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg",
    ),
  );
  const previousRequestCount = useRef(0);
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
  const [recentChats, setRecentChats] = useState([]);
  const initialChatName = location.state?.chatName || "Chat";
  const [selectedChat, setSelectedChat] = useState(null);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [chatFilter, setChatFilter] = useState("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchedUser, setSearchedUser] = useState([]);

  const [friendRequests, setFriendRequests] = useState([]);
  const [friends, setFriends] = useState([]);
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
    if (!user) return;

    const unsub = onSnapshot(doc(db, "friends", user.uid), async (snap) => {
      if (!snap.exists()) {
        setFriends([]);
        return;
      }

      const ids = snap.data().friends || [];

      const usersData = [];

      for (const uid of ids) {
        let found = null;

        const collections = [
          "users",
          "students",
          "trainerstudents",
          "institutes",
        ];

        for (const col of collections) {
          const docSnap = await getDoc(doc(db, col, uid));

          if (docSnap.exists()) {
            const d = docSnap.data();

            found = {
              uid,
              name:
                d.name ||
                `${d.firstName || ""} ${d.lastName || ""}`.trim() ||
                d.instituteName,
              photo:
                d.profileImageUrl || d.studentPhotoUrl || d.ownerPhotoUrl || "",
            };

            break;
          }
        }

        if (found) usersData.push(found);
      }

      const validFriends = usersData.filter(
        (friend) => friend.uid !== user.uid,
      );

      setFriends(validFriends);
    });

    return () => unsub();
  }, [user]);
  useEffect(() => {
    const setupNotifications = async () => {
      await LocalNotifications.requestPermissions();
    };

    setupNotifications();
  }, []);
  const getUserDetails = async (uid) => {
    const collections = [
      "users",
      "students",
      "institutes",
      "trainerstudents",
      "InstituteTrainers",
      "trainers",
    ];

    for (const col of collections) {
      const snap = await getDoc(doc(db, col, uid));

      if (snap.exists()) {
        const d = snap.data();

        return {
          uid,

          name:
            d.name ||
            d.instituteName ||
            d.trainerName ||
            `${d.firstName || ""} ${d.lastName || ""}`.trim() ||
            "User",

          photo:
            d.profileImageUrl || d.studentPhotoUrl || d.ownerPhotoUrl || "",

          role: col,
        };
      }
    }

    return {
      uid,
      name: "Unknown User",
      photo: "",
      role: "",
    };
  };
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "friendRequests"),
      where("toUid", "==", user.uid),
      where("status", "==", "pending"),
    );

    const unsub = onSnapshot(q, async (snap) => {
      const requests = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();

          const sender = await getUserDetails(data.fromUid);

          return {
            id: d.id,
            ...data,
            senderName: sender.name,
            senderPhoto: sender.photo,
            senderRole: sender.role,
          };
        }),
      );

      setFriendRequests(requests);

      setFriendRequests(requests);

      for (const request of requests) {
        if (!notifiedRequests.current.has(request.id)) {
          notifiedRequests.current.add(request.id);

          await LocalNotifications.schedule({
            notifications: [
              {
                id: Date.now(),
                title: "New Friend Request",
                body: `${request.fromName} sent you a friend request`,
                schedule: {
                  at: new Date(Date.now() + 100),
                },
              },
            ],
          });
        }
      }
    });

    return () => unsub();
  }, [user]);
  const searchFriend = async () => {
    const keyword = searchEmail.trim().toLowerCase();

    if (!keyword) return;

    setSearchLoading(true);

    try {
      let results = [];

      const collectionsToSearch = [
        {
          collection: "users",
          field: "emailOrPhone",
        },
        {
          collection: "students",
          field: "email",
        },
        {
          collection: "trainerstudents",
          field: "email",
        },
      ];

      for (const item of collectionsToSearch) {
        const q = query(
          collection(db, item.collection),
          where(item.field, "==", keyword),
        );

        const snap = await getDocs(q);

        for (const docSnap of snap.docs) {
          const d = docSnap.data();

          let requestStatus = null;

          const reqQuery = query(
            collection(db, "friendRequests"),
            where("fromUid", "==", user.uid),
            where("toUid", "==", docSnap.id),
          );

          const reqSnap = await getDocs(reqQuery);

          if (!reqSnap.empty) {
            requestStatus = reqSnap.docs[0].data().status;
          }

          results.push({
            uid: docSnap.id,
            name: d.name || `${d.firstName || ""} ${d.lastName || ""}`.trim(),
            photo: d.profileImageUrl || d.studentPhotoUrl || "",
            requestStatus,
          });
        }
      }

      setSearchedUser(results);
    } finally {
      setSearchLoading(false);
    }
  };
  const sendFriendRequest = async (person) => {
    const me = await getUserDetails(user.uid);

    await addDoc(collection(db, "friendRequests"), {
      fromUid: user.uid,
      fromName: me.name,
      fromPhoto: me.photo,
      fromRole: me.role,
      toUid: person.uid,
      toName: person.name,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    // Close popup
    setShowFriendModal(false);

    // Clear search
    setSearchEmail("");
    setSearchedUser([]);

    alert("Friend request sent successfully");
  };
  const acceptRequest = async (request) => {
    await updateDoc(doc(db, "friendRequests", request.id), {
      status: "accepted",
    });

    const myRef = doc(db, "friends", user.uid);
    const friendRef = doc(db, "friends", request.fromUid);

    const mySnap = await getDoc(myRef);

    if (!mySnap.exists()) {
      await setDoc(myRef, {
        friends: [request.fromUid],
      });
    } else {
      await updateDoc(myRef, {
        friends: [
          ...new Set([...(mySnap.data().friends || []), request.fromUid]),
        ],
      });
    }

    const friendSnap = await getDoc(friendRef);

    if (!friendSnap.exists()) {
      await setDoc(friendRef, {
        friends: [user.uid],
      });
    } else {
      await updateDoc(friendRef, {
        friends: [...new Set([...(friendSnap.data().friends || []), user.uid])],
      });
    }

    // Create chat after acceptance
    const chatId = [user.uid, request.fromUid].sort().join("_");

    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        type: "individual",
        instituteId,
        members: [user.uid, request.fromUid],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastAt: serverTimestamp(),
      });
    }

    setShowRequestsModal(false);
  };
  useEffect(() => {
    if (!user) return;

    const getUserInfo = async (uid) => {
      // USERS
      let snap = await getDoc(doc(db, "users", uid));

      if (snap.exists()) {
        const d = snap.data();

        return {
          uid,
          name: `${d.name || "User"} (User)`,
          photo: d.profileImageUrl || "",
          role: "user",
        };
      }

      // STUDENTS
      snap = await getDoc(doc(db, "students", uid));

      if (snap.exists()) {
        const d = snap.data();

        return {
          uid,
          name:
            `${d.firstName || ""} ${d.lastName || ""}`.trim() + " (Student)",
          photo: d.profileImageUrl || d.studentPhotoUrl || "",
          role: "student",
        };
      }

      // INSTITUTES
      snap = await getDoc(doc(db, "institutes", uid));

      if (snap.exists()) {
        const d = snap.data();

        return {
          uid,
          name: `${d.instituteName || "Institute"} (Institute)`,
          photo: d.profileImageUrl || "",
          role: "institute",
        };
      }

      // INSTITUTE TRAINERS
      snap = await getDoc(doc(db, "InstituteTrainers", uid));

      if (snap.exists()) {
        const d = snap.data();

        return {
          uid,
          name:
            `${d.firstName || ""} ${d.lastName || ""}`.trim() + " (Trainer)",
          photo: d.profileImageUrl || "",
          role: "trainer",
        };
      }

      // TRAINERS COLLECTION
      snap = await getDoc(doc(db, "trainers", uid));

      if (snap.exists()) {
        const d = snap.data();

        const trainerName =
          d.trainerName || `${d.firstName || ""} ${d.lastName || ""}`.trim();

        return {
          uid,
          name: `${trainerName} (Trainer${
            d.instituteName ? ` - ${d.instituteName}` : ""
          })`,
          photo: d.profileImageUrl || "",
          role: "trainer",
        };
      }

      return {
        uid,
        name: "Unknown User",
        photo: "",
      };
    };

    const q = query(
      collection(db, "chats"),
      where("members", "array-contains", user.uid),
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const chats = await Promise.all(
        snapshot.docs.map(async (chatDoc) => {
          const data = chatDoc.data();

          if (data.type === "group") {
            return {
              id: chatDoc.id,
              ...data,
              displayName: data.name,
              photo: "",
              isChat: true,
            };
          }
          const otherUid = data.members?.find((u) => u !== user.uid);

          if (!otherUid) return null;

          const otherUser = await getUserInfo(otherUid);

          return {
            id: chatDoc.id,
            ...data,
            displayName: otherUser.name,
            photo: otherUser.photo,
            uid: otherUid,
            isChat: true,
          };
        }),
      );

      // Add friends who don't have chats yet
      const merged = chats
        .filter(Boolean)
        .filter((chat) => chat.members?.length > 0);

      merged.sort(
        (a, b) => (b.lastAt?.seconds || 0) - (a.lastAt?.seconds || 0),
      );

      setRecentChats(merged);
    });

    return () => unsub();
  }, [user, friends]);
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
  const startChat = async (friend) => {
    if (!user) return;

    const chatId = [user.uid, friend.uid].sort().join("_");

    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        type: "individual",
        instituteId,
        members: [user.uid, friend.uid],
        createdAt: serverTimestamp(),
        lastMessage: "",
        lastAt: serverTimestamp(),
      });
    }

    setActiveChat({
      id: chatId,
      type: "individual",
    });

    setActiveChatName(friend.name);
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
  const filteredChats = recentChats.filter((chat) => {
    const matchesSearch =
      (chat.displayName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (chat.lastMessage || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (chatFilter === "chats") return chat.type !== "group";

    if (chatFilter === "groups") return chat.type === "group";

    return true;
  });

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  return (
    <div
      className="
  flex
  h-[100dvh]
  md:h-[60vh]
  w-full
  bg-[#f3f3f3]
  overflow-hidden
  md:rounded-xl
"
    >
      {/* ================= CHAT LIST ================= */}
      <div
        className={`
        ${activeChat ? "hidden md:flex" : "flex"}
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
        {showFriendModal && (
          <div
            className="
      fixed inset-0 z-[999]
      bg-black/50
      flex items-end sm:items-center justify-center
    "
          >
            <div
              className="
        bg-white
        w-full
        sm:max-w-md
        rounded-t-3xl sm:rounded-3xl
        p-5
        max-h-[85vh]
        flex flex-col
        shadow-2xl
      "
            >
              {/* HEADER */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Connect With Friends</h2>

                <button
                  onClick={() => {
                    setShowFriendModal(false);
                    setSearchedUser([]);
                    setSearchEmail("");
                  }}
                  className="
            w-8 h-8
            rounded-full
            bg-gray-100
            flex items-center justify-center
            text-gray-600
          "
                >
                  ✕
                </button>
              </div>

              {/* SEARCH */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="
            flex-1
            border
            border-gray-300
            rounded-xl
            p-3
            outline-none
            text-sm
          "
                />

                <button
                  onClick={searchFriend}
                  disabled={searchLoading}
                  className="
            bg-orange-500
            text-white
            px-5
            py-3
            rounded-xl
            font-medium
            disabled:opacity-60
          "
                >
                  {searchLoading ? "Searching..." : "Search"}
                </button>
              </div>

              {/* RESULTS */}
              <div className="flex-1 overflow-y-auto mt-4">
                {!searchLoading && searchedUser.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    Search users by email address
                  </div>
                )}

                {searchedUser.map((person) => (
                  <div
                    key={person.uid}
                    className="
              flex
              items-center
              justify-between
              gap-3
              py-3
              border-b
            "
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={getValidImage(person.photo, person.name)}
                        alt=""
                        className="
                  w-12 h-12
                  rounded-full
                  object-cover
                  shrink-0
                "
                      />

                      <div className="min-w-0">
                        <p className="font-medium truncate">{person.name}</p>
                      </div>
                    </div>

                    {person.requestStatus === "pending" ? (
                      <button
                        disabled
                        className="
                  bg-yellow-500
                  text-white
                  px-3 py-2
                  rounded-lg
                  text-sm
                  shrink-0
                "
                      >
                        Pending
                      </button>
                    ) : person.requestStatus === "accepted" ? (
                      <button
                        disabled
                        className="
                  bg-green-600
                  text-white
                  px-3 py-2
                  rounded-lg
                  text-sm
                  shrink-0
                "
                      >
                        Connected
                      </button>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(person)}
                        className="
                  bg-green-500
                  text-white
                  px-3 py-2
                  rounded-lg
                  text-sm
                  shrink-0
                "
                      >
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {showRequestsModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
            <div
              className="
bg-white
w-full
sm:max-w-sm
rounded-t-3xl
sm:rounded-3xl
p-5
max-h-[80vh]
overflow-y-auto
"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">Friend Requests</h2>

                <button
                  onClick={() => setShowRequestsModal(false)}
                  className="
      w-8
      h-8
      rounded-full
      bg-gray-100
      flex
      items-center
      justify-center
      font-bold
    "
                >
                  ✕
                </button>
              </div>

              {friendRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between border-b py-3"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <img
                        src={getValidImage(req.senderPhoto, req.senderName)}
                        className="w-12 h-12 rounded-full object-cover"
                      />

                      <div>
                        <p className="font-medium">{req.senderName}</p>

                        <p className="text-xs text-gray-500">
                          {req.senderRole}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => acceptRequest(req)}
                    className="bg-green-500 text-white px-3 py-2 rounded-lg"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => navigate(-1)}
              className="
        w-10
        h-10
        rounded-full
        bg-white
        shadow-sm
        border
        border-gray-200
        flex
        items-center
        justify-center
      "
            >
              <ArrowLeft size={20} />
            </button>

            <h1 className="text-3xl font-bold text-black">Chat</h1>
            <button
              onClick={() => navigate("/Howitworkdchatbox")}
              className="
      bg-orange-500
      text-white
      px-10
      py-2
      rounded-xl
      text-sm
      font-medium
      shadow-sm
    "
            >
              How It Works
            </button>
          </div>
          <div className="mt-4">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chats, groups, friends..."
              className="
    w-full
    bg-white
    rounded-2xl
    px-4
    py-3
    text-sm
    outline-none
    border
    border-gray-200
    shadow-sm
  "
            />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {[
              { id: "all", label: "All" },
              { id: "chats", label: "Chats" },
              { id: "groups", label: "Groups" },
              { id: "friends", label: "Friends" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setChatFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition
        ${
          chatFilter === tab.id
            ? "bg-orange-500 text-white"
            : "bg-white text-gray-600 border"
        }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* FRIEND CARDS */}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => setShowFriendModal(true)}
              className="
      bg-white
      rounded-3xl
      border
      border-orange-200
      p-4
      text-left
      shadow-sm
    "
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mb-3">
                👥
              </div>

              <h3 className="font-semibold text-sm">Connect with Friends</h3>

              <p className="text-xs text-gray-500 mt-1">
                Send connection requests
              </p>
            </button>

            <button
              onClick={() => setShowRequestsModal(true)}
              className="
      bg-white
      rounded-3xl
      border
      border-orange-200
      p-4
      text-left
      relative
      shadow-sm
    "
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-50 mb-3">
                📩
              </div>

              <h3 className="font-semibold text-sm">Connection Requests</h3>

              <p className="text-xs text-gray-500 mt-1">View requests</p>

              {friendRequests.length > 0 && (
                <span
                  className="
          absolute
          top-3
          right-3
          bg-orange-500
          text-white
          w-6
          h-6
          rounded-full
          flex
          items-center
          justify-center
          text-xs
        "
                >
                  {friendRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* CHAT LIST */}
        {/* CHAT LIST */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 min-h-0">
          {/* Existing Chats */}
          {chatFilter !== "friends" && filteredChats.length > 0 && (
            <>
              <p className="px-2 mb-3 text-xs font-semibold text-gray-500 uppercase">
                Recent Chats
              </p>

              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChat({
                      id: chat.id,
                      type: chat.type,
                    });

                    setActiveChatName(chat.displayName);
                  }}
                  className="bg-white rounded-3xl px-4 py-4 mb-3 flex items-center gap-4 shadow-sm cursor-pointer"
                >
                  <img
                    src={getValidImage(chat.photo, chat.displayName)}
                    className="w-14 h-14 rounded-full object-cover"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold">{chat.displayName}</h3>

                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage || "Start conversation"}
                    </p>
                  </div>

                  {unreadCounts[chat.id] > 0 && (
                    <div className="bg-orange-500 text-white min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs">
                      {unreadCounts[chat.id]}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Friends */}
          {(chatFilter === "all" || chatFilter === "friends") &&
            filteredFriends.length > 0 && (
              <>
                <p className="px-2 my-3 text-xs font-semibold text-gray-500 uppercase">
                  Friends
                </p>
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.uid}
                    onClick={() => startChat(friend)}
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
                    <div className="relative">
                      <img
                        src={getValidImage(friend.photo, friend.name)}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold">{friend.name}</h3>
                      <p className="text-sm text-gray-400">
                        Start conversation
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}
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
          sticky
          top-0
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
            <button
              onClick={() => {
                setSelectedChat(null);
                setActiveChat(null);
                setMessages([]);
              }}
              className="md:hidden text-xl"
            >
              ←
            </button>

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

          <MoreVertical size={20} className="cursor-pointer" />
        </div>

        {/* MESSAGES */}
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
          <div className="flex justify-center">
            <div className="bg-white text-gray-400 text-xs px-4 py-1 rounded-full shadow-sm">
              Today
            </div>
          </div>

          {messages.length === 0 && activeChat && (
            <div className="flex justify-center mt-8">
              <div className="bg-white rounded-3xl p-6 shadow-sm max-w-sm text-center">
                <img
                  src={getValidImage("", activeChatName)}
                  alt=""
                  className="w-16 h-16 rounded-full mx-auto mb-3"
                />

                <h3 className="font-semibold text-lg">{activeChatName}</h3>

                <p className="text-sm text-gray-500 mt-2">
                  Start your conversation with {activeChatName}.
                </p>
              </div>
            </div>
          )}

          {messages.map((m) => {
            const sender = users.find((u) => u.uid === m.senderId);

            const isMine = m.senderId === user?.uid;

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
                  {!isMine && (
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

            <button
              onClick={sendMessage}
              className="
              w-14
              h-12
              rounded-full
              bg-[#FF6B00]
              flex
              items-center
              justify-center
              shadow-lg
              shrink-0
            "
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
