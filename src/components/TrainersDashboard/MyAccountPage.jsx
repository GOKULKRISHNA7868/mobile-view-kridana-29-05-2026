import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

import { serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { User, Users, ImageUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MyAccountPage = ({ setActiveMenu }) => {
  const { user } = useAuth();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("edit");

  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    bio: "",
    profileImage: "", // ✅ added
  });

  const [media, setMedia] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTrainerDeleteModal, setShowTrainerDeleteModal] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");

  const [activeCount, setActiveCount] = useState(0);
  const [leftCount, setLeftCount] = useState(0);
  const [newCount, setNewCount] = useState(0);

  /* ================= CUSTOMERS STATE ================= */
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [showUploadTypeModal, setShowUploadTypeModal] = useState(false);
  const [selectedUploadType, setSelectedUploadType] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  /* ================= FETCH PROFILE ================= */
  const categories = [
    "Martial Arts",
    "Team Ball Sports",
    "Racket Sports",
    "Fitness",
    "Target & Precision Sports",
    "Equestrian Sports",
    "Adventure & Outdoor Sports",
    "Ice Sports",
    "Aquatic Sports",
    "Wellness",
    "Dance",
  ];

  const subCategoryMap = {
    "Martial Arts": [
      "Karate",
      "Kung Fu",
      "Krav Maga",
      "Muay Thai",
      "Taekwondo",
      "Judo",
      "Brazilian Jiu-Jitsu",
      "Aikido",
      "Jeet Kune Do",
      "Capoeira",
      "Sambo",
      "Silat",
      "Kalaripayattu",
      "Hapkido",
      "Wing Chun",
      "Shaolin",
      "Ninjutsu",
      "Kickboxing",
      "Boxing",
      "Wrestling",
      "Shorinji Kempo",
      "Kyokushin",
      "Goju-ryu",
      "Shotokan",
      "Wushu",
      "Savate",
      "Lethwei",
      "Bajiquan",
      "Hung Gar",
      "Praying Mantis Kung Fu",
    ],
    "Team Ball Sports": [
      "Football / Soccer",
      "Basketball",
      "Handball",
      "Rugby",
      "Futsal",
      "Field Hockey",
      "Lacrosse",
      "Gaelic Football",
      "Volleyball",
      "Beach Volleyball",
      "Sepak Takraw",
      "Roundnet (Spikeball)",
      "Netball",
      "Cricket",
      "Baseball",
      "Softball",
      "Wheelchair Rugby",
      "Dodgeball",
      "Korfball",
    ],
    "Racket Sports": [
      "Tennis",
      "Table Tennis",
      "Badminton",
      "Squash",
      "Racquetball",
      "Padel",
      "Pickleball",
      "Platform Tennis",
      "Real Tennis",
      "Soft Tennis",
      "Frontenis",
      "Speedminton (Crossminton)",
      "Paddle Tennis (POP Tennis)",
      "Speed-ball",
      "Chaza",
      "Totem Tennis (Swingball)",
      "Matkot",
      "Jombola",
    ],
    Fitness: [
      "Gym Workout",
      "Weight Training",
      "Bodybuilding",
      "Powerlifting",
      "CrossFit",
      "Calisthenics",
      "Circuit Training",
      "HIIT",
      "Functional Training",
      "Core Training",
      "Mobility Training",
      "Stretching",
      "Resistance Band Training",
      "Kettlebell Training",
      "Boot Camp Training",
      "Spinning",
      "Step Fitness",
      "Pilates",
      "Yoga",
    ],
    "Target & Precision Sports": [
      "Archery",
      "Golf",
      "Bowling",
      "Darts",
      "Snooker",
      "Pool",
      "Billiards",
      "Target Shooting",
      "Clay Pigeon Shooting",
      "Air Rifle Shooting",
      "Air Pistol Shooting",
      "Croquet",
      "Petanque",
      "Bocce",
      "Lawn Bowls",
      "Carom Billiards",
      "Nine-Pin Bowling",
      "Disc Golf",
      "Kubb",
      "Pitch and Putt",
      "Shove Ha’penny",
      "Toad in the Hole",
      "Bat and Trap",
      "Boccia",
      "Gateball",
    ],
    "Equestrian Sports": [
      "Horse Racing",
      "Barrel Racing",
      "Rodeo",
      "Mounted Archery",
      "Tent Pegging",
    ],
    "Adventure & Outdoor Sports": [
      "Rock Climbing",
      "Mountaineering",
      "Trekking",
      "Hiking",
      "Mountain Biking",
      "Sandboarding",
      "Orienteering",
      "Obstacle Course Racing",
      "Skydiving",
      "Paragliding",
      "Hang Gliding",
      "Parachuting",
      "Hot-air Ballooning",
      "Skiing",
      "Snowboarding",
      "Ice Climbing",
      "Heli-skiing",
      "Bungee Jumping",
      "BASE Jumping",
      "Canyoning",
      "Kite Buggy",
      "Zorbing",
      "Zip Lining",
    ],
    "Aquatic Sports": [
      "Swimming",
      "Water Polo",
      "Surfing",
      "Scuba Diving",
      "Snorkeling",
      "Freediving",
      "Kayaking",
      "Canoeing",
      "Rowing",
      "Sailing",
      "Windsurfing",
      "Kite Surfing",
      "Jet Skiing",
      "Wakeboarding",
      "Water Skiing",
      "Stand-up Paddleboarding",
      "Whitewater Rafting",
      "Dragon Boat Racing",
      "Artistic Swimming",
      "Open Water Swimming",
    ],
    "Ice Sports": [
      "Ice Skating",
      "Figure Skating",
      "Ice Hockey",
      "Speed Skating",
      "Ice Dance",
      "Synchronized Skating",
      "Curling",
      "Broomball",
      "Bobsleigh",
      "Skiboarding",
      "Ice Dragon Boat Racing",
      "Ice Cross Downhill",
    ],
    Wellness: [
      "Yoga & Meditation",
      "Spa & Relaxation",
      "Mental Wellness",
      "Fitness",
      "Nutrition",
      "Traditional & Alternative Therapies",
      "Rehabilitation",
      "Lifestyle Coaching",
    ],
    Dance: [
      "Bharatanatyam",
      "Kathak",
      "Kathakali",
      "Kuchipudi",
      "Odissi",
      "Mohiniyattam",
      "Manipuri",
      "Sattriya",
      "Chhau",
      "Yakshagana",
      "Lavani",
      "Ghoomar",
      "Kalbelia",
      "Garba",
      "Dandiya Raas",
      "Bhangra",
      "Bihu",
      "Dollu Kunitha",
      "Theyyam",
      "Ballet",
      "Contemporary",
      "Hip Hop",
      "Breakdance",
      "Jazz Dance",
      "Tap Dance",
      "Modern Dance",
      "Street Dance",
      "House Dance",
      "Locking",
      "Popping",
      "Krumping",
      "Waacking",
      "Voguing",
      "Salsa",
      "Bachata",
      "Merengue",
      "Cha-Cha",
      "Rumba",
      "Samba",
      "Paso Doble",
      "Jive",
      "Tango",
      "Waltz",
      "Foxtrot",
      "Quickstep",
      "Flamenco",
      "Irish Stepdance",
      "Scottish Highland Dance",
      "Morris Dance",
      "Hula",
      "Maori Haka",
      "African Tribal Dance",
      "Zumba",
      "K-Pop Dance",
      "Shuffle Dance",
      "Electro Dance",
      "Pole Dance",
      "Ballroom Dance",
      "Line Dance",
      "Square Dance",
      "Folk Dance",
      "Contra Dance",
    ],
  };
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;

      const ref = doc(db, "trainers", user.uid);

      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();

        setProfile({
          fullName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          email: data.email || "",
          phone: data.phoneNumber || "",
          bio: data.experience || "",
          profileImage: data.profileImageUrl || "",
        });
      }
    };

    fetchProfile();
  }, [user]);

  /* ================= FETCH MEDIA ================= */
  useEffect(() => {
    const fetchMedia = async () => {
      if (!user?.uid) return;

      const snap = await getDocs(collection(db, "trainers", user.uid, "media"));
      setMedia(snap.docs.map((d) => d.data().image));
    };

    fetchMedia();
  }, [user]);
  useEffect(() => {
    if (activeTab !== "management" || !user?.uid) return;

    const fetchTrainers = async () => {
      const q = query(
        collection(db, "trainers"),
        where("role", "==", "trainer"),
      );

      const snap = await getDocs(q);

      const list = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        .filter((t) => t.status !== "Left");

      setTrainers(list);
    };

    fetchTrainers();
  }, [activeTab, user]);

  /* ================= FETCH STUDENTS ================= */
  useEffect(() => {
    if (activeTab !== "customers" || !user?.uid) return;
    const fetchLeftTrainers = async () => {
      const q = query(
        collection(db, "trainerstudents"),
        where("trainerId", "==", user.uid),
        where("status", "==", "Left"),
      );

      const snap = await getDocs(q);

      const leftList = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      console.log("Left Trainers:", leftList); // check in console
    };

    const fetchStudents = async () => {
      const q = query(
        collection(db, "trainerstudents"),
        where("trainerId", "==", user.uid),
      );

      const snap = await getDocs(q);

      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        status: d.data().status || "Active", // default Active
      }));
      list.sort((a, b) =>
        `${a.firstName} ${a.lastName}`.localeCompare(
          `${b.firstName} ${b.lastName}`,
        ),
      );
      setStudents(list);
      setFilteredStudents(list);
    };

    fetchStudents();
  }, [activeTab, user]);

  const uploadToCloudinary = async (file, type) => {
    setUploading(true);
    setUploadMsg("");

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "kirdana"); // 👈 your unsigned preset name

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/dr0svrhu1/${type}/upload`,
        {
          method: "POST",
          body: data,
        },
      );

      const result = await res.json();

      if (!result.secure_url) {
        throw new Error(result.error?.message || "Cloudinary upload failed");
      }

      setUploadMsg("✅ Upload Successful!");
      return result.secure_url;
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      alert("Upload Failed: " + err.message);
      return "";
    } finally {
      setUploading(false);
      setTimeout(() => setUploadMsg(""), 3000);
    }
  };

  /* ================= FILTER STUDENTS ================= */
  useEffect(() => {
    let data = [...students];

    if (statusFilter !== "All") {
      data = data.filter((s) => s.status === statusFilter);
    }

    if (searchText) {
      data = data.filter((s) =>
        `${s.firstName} ${s.lastName}`
          .toLowerCase()
          .includes(searchText.toLowerCase()),
      );
    }

    data.sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
      ),
    );

    setFilteredStudents(data);
  }, [searchText, statusFilter, students]);
  /* ================= UPDATE COUNTS INSTANTLY ================= */
  useEffect(() => {
    const active = students.filter((s) => s.status === "Active").length;
    const left = students.filter((s) => s.status === "Left").length;

    const now = new Date();
    const last30Days = students.filter((s) => {
      if (!s.createdAt) return false;
      const created = s.createdAt.toDate();
      const diff = (now - created) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }).length;

    setActiveCount(active);
    setLeftCount(left);
    setNewCount(last30Days);
  }, [students]);

  /* ================= HANDLE INPUT ================= */
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  /* ================= SAVE PROFILE ================= */
  const handleSave = async () => {
    await setDoc(doc(db, "trainers", user.uid), profile, { merge: true });

    alert("Profile Saved ✅");
  };
  const handleStudentProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingStudent) return;

    // Upload to Cloudinary using your existing API
    const url = await uploadToCloudinary(file, "image");

    if (!url) return;

    try {
      // Update Firebase
      await updateDoc(doc(db, "trainerstudents", editingStudent.id), {
        profileImageUrl: url,
      });

      // Update modal state
      setEditingStudent((prev) => ({
        ...prev,
        profileImageUrl: url,
      }));

      // Update table state instantly
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingStudent.id ? { ...s, profileImageUrl: url } : s,
        ),
      );
    } catch (error) {
      console.error("Profile image update error:", error);
    }
  };
  /* ================= UPLOAD PROFILE IMAGE ================= */
  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.uid) return;

    const url = await uploadToCloudinary(file, "image");

    if (!url) return;

    try {
      // update UI instantly
      setProfile((prev) => ({
        ...prev,
        profileImage: url,
      }));

      // save to firestore
      await updateDoc(doc(db, "trainers", user.uid), {
        profileImageUrl: url,
      });
    } catch (error) {
      console.error("Profile upload error:", error);
    }
  };

  const removeProfileImage = async () => {
    try {
      setProfile((prev) => ({
        ...prev,
        profileImage: "",
      }));

      await updateDoc(doc(db, "trainers", user.uid), {
        profileImageUrl: "",
      });
    } catch (error) {
      console.error("Error removing profile image:", error);
    }
  };

  const removeCustomerImage = async () => {
    if (!editingStudent?.id) return;

    try {
      // update UI
      setEditingStudent((prev) => ({
        ...prev,
        profileImageUrl: "",
      }));

      // update firestore
      await updateDoc(doc(db, "trainerstudents", editingStudent.id), {
        profileImageUrl: "",
      });

      // update table instantly
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingStudent.id ? { ...s, profileImageUrl: "" } : s,
        ),
      );
    } catch (error) {
      console.error("Error removing image:", error);
    }
  };

  /* ================= UPLOAD MEDIA ================= */
  const handleUpload = async () => {
    if (!pendingFile || !selectedUploadType || !user?.uid) return;

    const cloudType = selectedUploadType === "image" ? "image" : "video";

    const url = await uploadToCloudinary(pendingFile, cloudType);
    if (!url) return;

    const instituteRef = doc(db, "trainers", user.uid);

    const snap = await getDoc(instituteRef);
    if (!snap.exists()) return;

    const data = snap.data() || {};

    let updateData = {};

    if (selectedUploadType === "image") {
      updateData = {
        images: [...(data.images || []), url],
        updatedAt: serverTimestamp(),
      };
    }

    if (selectedUploadType === "video") {
      updateData = {
        videos: [...(data.videos || []), url],
        updatedAt: serverTimestamp(),
      };
    }

    if (selectedUploadType === "reel") {
      updateData = {
        reels: [...(data.reels || []), url],
        updatedAt: serverTimestamp(),
      };
    }

    await updateDoc(instituteRef, updateData);

    setMedia((prev) => [...prev, url]); // preview
    setPendingFile(null);
    setSelectedUploadType("");
    setShowUploadTypeModal(false);
  };

  const confirmDeleteTrainer = async () => {
    if (!trainerToDelete || !deleteReason.trim()) {
      alert("Please enter reason");
      return;
    }

    try {
      await updateDoc(doc(db, "trainerstudents", trainerToDelete.id), {
        status: "Left",
        leftReason: deleteReason,
        leftDate: serverTimestamp(),
      });

      // Remove from UI immediately
      setTrainers((prev) => prev.filter((t) => t.id !== trainerToDelete.id));

      setDeleteReason("");
      setTrainerToDelete(null);
      setShowTrainerDeleteModal(false);
    } catch (error) {
      console.error("Error updating trainer:", error);
    }
  };

  const handleEditTrainer = (trainer) => {
    setEditingTrainer(trainer);
    setShowEditModal(true);
  };

  const handleUpdateTrainer = async () => {
    await updateDoc(
      doc(db, "trainerstudents", editingTrainer.id),
      editingTrainer,
    );

    setTrainers((prev) =>
      prev.map((t) => (t.id === editingTrainer.id ? editingTrainer : t)),
    );

    setShowEditModal(false);
  };
  const markStudentLeft = async () => {
    if (!selectedStudent) return;

    await updateDoc(doc(db, "trainerstudents", selectedStudent.id), {
      status: "Left",
      leftReason: leaveReason,
      leftDate: serverTimestamp(),
    });

    setStudents((prev) =>
      prev.map((s) =>
        s.id === selectedStudent.id
          ? {
              ...s,
              status: "Left",
              leftReason: leaveReason,
              leftDate: serverTimestamp(),
            }
          : s,
      ),
    );

    setLeaveReason("");
    setShowDeleteModal(false);
    setSelectedStudent(null);
  };
  const permanentlyDeleteStudent = async (student) => {
    if (!window.confirm("Permanently delete this customer?")) return;

    await deleteDoc(doc(db, "trainerstudents", student.id));

    setStudents((prev) => prev.filter((s) => s.id !== student.id));
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Mark this customer as Left?")) return;

    await updateDoc(doc(db, "trainerstudents", id), {
      status: "Left",
      leftDate: serverTimestamp(),
    });

    setStudents((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "Left", leftDate: serverTimestamp() } : s,
      ),
    );
  };
  const markAsLeftConfirm = async (student) => {
    const reason = prompt("Enter reason for marking as Left:");
    if (!reason) return;

    await updateDoc(doc(db, "trainerstudents", student.id), {
      status: "Left",
      leftReason: reason,
      leftDate: serverTimestamp(),
    });

    setStudents((prev) =>
      prev.map((s) =>
        s.id === student.id
          ? {
              ...s,
              status: "Left",
              leftReason: reason,
              leftDate: serverTimestamp(),
            }
          : s,
      ),
    );
  };
  const generateTimes = () => {
    const times = [];

    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m++) {
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        const minute = m.toString().padStart(2, "0");
        const ampm = h < 12 ? "AM" : "PM";

        times.push(`${hour12}:${minute} ${ampm}`);
      }
    }

    return times;
  };

  const TIME_OPTIONS = generateTimes();
  const handleAadharUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !editingStudent) return;

    const urls = [];

    for (const file of files) {
      const url = await uploadToCloudinary(file, "image");
      if (url) urls.push(url);
    }

    const updatedUrls = [...(editingStudent.aadharUrls || []), ...urls];

    setEditingStudent({
      ...editingStudent,
      aadharUrls: updatedUrls,
      aadharFilesCount: updatedUrls.length,
    });
  };

  const removeAadharImage = (index) => {
    const updated = editingStudent.aadharUrls.filter((_, i) => i !== index);

    setEditingStudent({
      ...editingStudent,
      aadharUrls: updated,
      aadharFilesCount: updated.length,
    });
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-6 bg-[#FAFAFA] min-h-screen">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black">
            My Account
          </h1>
          <p className="text-orange-500 text-sm">
            Manage your team and customers
          </p>
        </div>

        {/* PROFILE */}
        <div className="flex items-center gap-4">
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border shadow"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-xl flex items-center justify-center">
              <User />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="cursor-pointer bg-orange-500 text-white px-3 py-1 rounded text-sm text-center">
              Change
              <input
                type="file"
                className="hidden"
                onChange={handleProfileUpload}
              />
            </label>

            {profile.profileImage && (
              <button
                onClick={removeProfileImage}
                className="text-red-500 text-sm"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex gap-4 border-b pb-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 pb-2 border-b-2 whitespace-nowrap ${
            activeTab === "customers"
              ? "text-orange-500 border-orange-500 font-semibold"
              : "text-gray-600 border-transparent"
          }`}
        >
          <Users size={18} /> Customers
        </button>
      </div>

      {/* ================= CUSTOMERS ================= */}
      {activeTab === "customers" && (
        <div className="bg-white border rounded-lg p-4 sm:p-6 shadow-sm">
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4 bg-[#FFFDF9]">
              <p className="text-sm text-gray-500">Active Customers</p>
              <p className="text-orange-500 text-lg font-semibold">
                {activeCount}
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-[#FFFDF9]">
              <p className="text-sm text-gray-500">Left Customers</p>
              <p className="text-orange-500 text-lg font-semibold">
                {leftCount}
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-[#FFFDF9]">
              <p className="text-sm text-gray-500">New (30 days)</p>
              <p className="text-orange-500 text-lg font-semibold">
                {newCount}
              </p>
            </div>
          </div>

          {/* HEADER ACTIONS */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div>
              <h2 className="text-orange-500 text-lg font-semibold">
                Customer Management
              </h2>
              <p className="text-sm text-gray-500">
                Track and manage your customers
              </p>
            </div>

            <button
              onClick={() => setActiveMenu("Customer Details")}
              className="bg-orange-500 text-white px-4 py-2 rounded-md"
            >
              + Add Customer
            </button>
          </div>

          {/* SEARCH + FILTER */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative w-full md:w-[320px]">
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search Customer..."
                className="w-full pl-10 pr-3 py-2 border rounded-md"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {["All", "Active", "Left"].map((item) => (
                <button
                  key={item}
                  onClick={() => setStatusFilter(item)}
                  className={`px-4 py-1.5 rounded-md text-sm ${
                    statusFilter === item
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* ================= DESKTOP TABLE ================= */}
          <div className="hidden md:block overflow-x-auto rounded-lg border">
            <div className="grid grid-cols-[2fr_.8fr_.8fr_1fr_1.2fr_1fr_1fr_.8fr] bg-gray-900 text-orange-400 text-sm font-semibold px-4 py-3">
              <p>Name</p>
              <p className="text-center">Age</p>
              <p>Belt</p>
              <p>Status</p>
              {statusFilter === "Left" && <p>Reason</p>}
              <p className="text-center">Added</p>
              <p className="text-center">Left</p>
              <p className="text-center">Action</p>
            </div>

            {filteredStudents.map((student, index) => (
              <div
                key={student.id}
                className="grid grid-cols-[2fr_.8fr_.8fr_1fr_1.2fr_1fr_1fr_.8fr] px-4 py-3 border-t text-sm items-center"
              >
                <p>
                  {index + 1}. {student.firstName} {student.lastName}
                </p>
                <p className="text-center">{student.age}</p>
                <p>{student.sports?.[0]?.belt || "-"}</p>

                <p>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      student.status === "Left"
                        ? "bg-red-500 text-white"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {student.status}
                  </span>
                </p>

                {statusFilter === "Left" && <p>{student.leftReason || "-"}</p>}

                <p className="text-center">
                  {student.createdAt?.toDate?.().toLocaleDateString() || "-"}
                </p>

                <p className="text-center">
                  {student.leftDate?.toDate?.().toLocaleDateString() || "-"}
                </p>

                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => {
                      setEditingStudent(student);
                      setShowEditStudentModal(true);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() =>
                      statusFilter === "Left"
                        ? permanentlyDeleteStudent(student)
                        : markAsLeftConfirm(student)
                    }
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ================= MOBILE CARDS ================= */}
          <div className="md:hidden space-y-3">
            {filteredStudents.map((student, index) => (
              <div
                key={student.id}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex justify-between">
                  <p className="font-semibold">
                    {index + 1}. {student.firstName} {student.lastName}
                  </p>

                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      student.status === "Left"
                        ? "bg-red-500 text-white"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {student.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-1">Age: {student.age}</p>

                <p className="text-sm">
                  Belt: {student.sports?.[0]?.belt || "-"}
                </p>

                <div className="flex justify-end gap-3 mt-3">
                  <button
                    onClick={() => {
                      setEditingStudent(student);
                      setShowEditStudentModal(true);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() =>
                      statusFilter === "Left"
                        ? permanentlyDeleteStudent(student)
                        : markAsLeftConfirm(student)
                    }
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= UPLOAD TYPE MODAL ================= */}

      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 lg:pl-[220px]">
          <div className="bg-white w-[95%] max-w-[700px] sm:max-w-[800px] md:max-w-[900px] rounded-2xl shadow-2xl mx-auto">
            <div className="max-h-[80vh] sm:max-h-[85vh] overflow-y-auto">
              {/* HEADER */}
              <div className="flex justify-between items-center px-6 py-4 border-b bg-orange-50 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <img
                    src="/edit-icon.png"
                    alt="edit"
                    className="w-4 h-4 opacity-70"
                  />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Edit Customer Details
                  </h2>
                </div>

                <button
                  onClick={() => setShowEditStudentModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition"
                  title="Close"
                >
                  <span className="text-black-500 text-lg font-light">✕</span>
                </button>
              </div>

              {/* BODY */}
              <div className="p-6 space-y-8">
                {/* ================= PROFILE SECTION ================= */}
                <div>
                  <h3 className="text-lg font-semibold text-orange-500 mb-4">
                    Profile Information
                  </h3>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium mb-2">Profile Image</p>

                      {editingStudent.profileImageUrl ? (
                        <img
                          src={editingStudent.profileImageUrl}
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border shadow"
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-200 rounded-xl flex items-center justify-center">
                          No Image
                        </div>
                      )}

                      <div className="flex flex-col items-center gap-2 mt-3">
                        <label className="cursor-pointer bg-orange-500 text-white px-3 py-1 rounded text-sm">
                          Change Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleStudentProfileUpload}
                          />
                        </label>

                        {editingStudent.profileImageUrl && (
                          <button
                            onClick={removeCustomerImage}
                            className="text-red-500 text-sm hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-w-0">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          First Name
                        </label>
                        <input
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          value={editingStudent.firstName || ""}
                          onChange={(e) => {
                            let value = e.target.value.replace(
                              /[^A-Za-z ]/g,
                              "",
                            );

                            // ✅ Capitalize first letter
                            if (value.length > 0) {
                              value =
                                value.charAt(0).toUpperCase() + value.slice(1);
                            }

                            setEditingStudent({
                              ...editingStudent,
                              firstName: value,
                            });
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Last Name
                        </label>
                        <input
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          value={editingStudent.lastName || ""}
                          onChange={(e) => {
                            let value = e.target.value.replace(
                              /[^A-Za-z ]/g,
                              "",
                            );

                            // ✅ Capitalize first letter
                            if (value.length > 0) {
                              value =
                                value.charAt(0).toUpperCase() + value.slice(1);
                            }

                            setEditingStudent({
                              ...editingStudent,
                              lastName: value,
                            });
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={editingStudent.dateOfBirth || ""}
                          onChange={(e) =>
                            setEditingStudent({
                              ...editingStudent,
                              dateOfBirth: e.target.value,
                            })
                          }
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Phone Number
                        </label>
                        <input
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          value={editingStudent.phone || ""}
                          maxLength={10}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            setEditingStudent({
                              ...editingStudent,
                              phone: value,
                            });
                          }}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                          Email Address
                        </label>
                        <input
                          value={editingStudent.email || ""}
                          onChange={(e) =>
                            setEditingStudent({
                              ...editingStudent,
                              email: e.target.value,
                            })
                          }
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-1">
                          Address
                        </label>
                        <input
                          value={editingStudent.address || ""}
                          onChange={(e) =>
                            setEditingStudent({
                              ...editingStudent,
                              address: e.target.value,
                            })
                          }
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= TRAINING SECTION ================= */}
                <h3 className="text-lg font-semibold text-orange-500 mb-4">
                  Training Details
                </h3>

                {(editingStudent.sports || []).map((sport, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 mb-4 bg-gray-50"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* CATEGORY */}
                      <div>
                        <label className="text-sm font-medium">Category</label>
                        <select
                          value={sport.category || ""}
                          onChange={(e) => {
                            const updated = [...editingStudent.sports];

                            updated[index].category = e.target.value;

                            // reset subcategory when category changes
                            updated[index].subCategory = "";

                            setEditingStudent({
                              ...editingStudent,
                              sports: updated,
                            });
                          }}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="">Select Category</option>

                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* SUBCATEGORY */}
                      <div>
                        <label className="text-sm font-medium">
                          Sub Category
                        </label>
                        <select
                          value={sport.subCategory || ""}
                          onChange={(e) => {
                            const updated = [...editingStudent.sports];
                            updated[index].subCategory = e.target.value;

                            setEditingStudent({
                              ...editingStudent,
                              sports: updated,
                            });
                          }}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="">Select Sub Category</option>

                          {(subCategoryMap[sport.category] || []).map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* BELT */}
                      {/* Belt / Skill Level */}
                      <div>
                        <label className="text-sm font-medium">
                          {sport.category === "Martial Arts"
                            ? "Belt"
                            : "Skill Level"}
                        </label>
                        <div>
                          {sport.category === "Martial Arts" ? (
                            // ✅ Martial Arts → Show Belt
                            <select
                              value={sport.belt || ""}
                              onChange={(e) => {
                                const updated = [...editingStudent.sports];
                                updated[index].belt = e.target.value;

                                setEditingStudent({
                                  ...editingStudent,
                                  sports: updated,
                                });
                              }}
                              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                            >
                              <option value="">Select Belt</option>
                              <option value="White">White</option>
                              <option value="Yellow">Yellow</option>
                              <option value="Orange">Orange</option>
                              <option value="Blue">Blue</option>
                              <option value="Brown">Brown</option>
                              <option value="Black">Black</option>
                              <option value="Green">Green</option>
                            </select>
                          ) : (
                            // ✅ Other Categories → Show Skill Level
                            <select
                              value={sport.skillLevel || ""}
                              onChange={(e) => {
                                const updated = [...editingStudent.sports];
                                updated[index].skillLevel = e.target.value;

                                setEditingStudent({
                                  ...editingStudent,
                                  sports: updated,
                                });
                              }}
                              className="w-full border rounded-lg px-3 py-2 focus:outline-none"
                            >
                              <option value="">Select Skill Level</option>
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                          )}
                        </div>
                      </div>

                      {/* SESSION */}
                      <div>
                        <label className="text-sm font-medium">Sessions</label>

                        <select
                          value={sport.sessions || ""}
                          onChange={(e) => {
                            const updated = [...editingStudent.sports];
                            updated[index].sessions = e.target.value;

                            setEditingStudent({
                              ...editingStudent,
                              sports: updated,
                            });
                          }}
                          className="w-full border rounded-lg px-3 py-2 bg-white"
                        >
                          <option value="">Select Session</option>
                          <option value="Morning">Morning</option>
                          <option value="Afternoon">Afternoon</option>
                          <option value="Evening">Evening</option>
                        </select>
                      </div>

                      {/* TIMING */}
                      <div>
                        <label className="text-sm font-medium">Timings</label>

                        <input
                          type="time"
                          value={sport.timings || ""}
                          onChange={(e) => {
                            const updated = [...editingStudent.sports];
                            updated[index].timings = e.target.value;

                            setEditingStudent({
                              ...editingStudent,
                              sports: updated,
                            });
                          }}
                          className="w-full border rounded-lg px-3 py-2 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Fee</label>
                        <input
                          value={sport.fee || ""}
                          onChange={(e) => {
                            const updated = [...editingStudent.sports];

                            const value = e.target.value.replace(/\D/g, ""); // ✅ ONLY NUMBERS

                            updated[index].fee = value;

                            setEditingStudent({
                              ...editingStudent,
                              sports: updated,
                            });
                          }}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>

                    {/* REMOVE BUTTON */}
                    <button
                      onClick={() => {
                        const updated = editingStudent.sports.filter(
                          (_, i) => i !== index,
                        );

                        setEditingStudent({
                          ...editingStudent,
                          sports: updated,
                        });
                      }}
                      className="mt-3 text-red-500 text-sm"
                    >
                      Remove Sport
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setEditingStudent({
                      ...editingStudent,
                      sports: [
                        ...(editingStudent.sports || []),
                        {
                          category: "",
                          subCategory: "",
                          belt: "",
                          sessions: "",
                          timings: "",
                          fee: "",
                        },
                      ],
                    });
                  }}
                  className="bg-orange-500 text-white px-4 py-2 rounded-md"
                >
                  + Add Sport
                </button>
                {/* ================= AADHAAR SECTION ================= */}
                <div>
                  <h3 className="text-lg font-semibold text-orange-500 mb-4">
                    Aadhaar Documents
                  </h3>

                  <div className="flex flex-wrap gap-4 mb-3">
                    {(editingStudent.aadharUrls || []).map((url, i) => (
                      <div key={i} className="relative">
                        <img
                          src={url}
                          className="w-24 h-24 object-cover rounded-lg border shadow"
                        />

                        <button
                          onClick={() => removeAadharImage(i)}
                          className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Upload */}
                  <label className="cursor-pointer bg-orange-500 text-white px-4 py-2 rounded-md text-sm">
                    + Add Aadhaar
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAadharUpload}
                    />
                  </label>

                  <p className="text-sm text-gray-500 mt-2">
                    Total Files: {editingStudent.aadharFilesCount || 0}
                  </p>
                </div>
              </div>

              {/* FOOTER */}
              <div className="p-4 border-t flex justify-end gap-3">
                <button onClick={() => setShowEditStudentModal(false)}>
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    await updateDoc(
                      doc(db, "trainerstudents", editingStudent.id),
                      editingStudent,
                    );

                    setStudents((prev) =>
                      prev.map((s) =>
                        s.id === editingStudent.id ? editingStudent : s,
                      ),
                    );

                    setShowEditStudentModal(false);
                  }}
                  className="bg-orange-500 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAccountPage;
