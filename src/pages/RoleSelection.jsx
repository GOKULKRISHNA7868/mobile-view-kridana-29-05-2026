import { useState } from "react";
import { ChevronRight, User, Users, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
export default function RoleSelection() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState(null);

  const toggleRole = (role) => {
    setActiveRole(activeRole === role ? null : role);
  };

  const roles = [
    {
      id: "user",
      title: "Create a Customer Account",
      icon: <User size={22} />,
      points: [
        "View available training sessions, book slots, and track schedule updates.",
        "Purchase gym merchandise, supplements, and training equipment conveniently.",
        "Access instructional and workout videos for guided training anytime.",
        "Connect with trainers for personalized guidance, feedback, and improvement tips.",
      ],
    },
    {
      id: "trainer",
      title: "Create a Trainer Profile",
      icon: <Users size={22} />,
      points: [
        "Manage member details, progress, and communication.",
        "Update and maintain trainer profiles with achievements and specialties.",
        "Track member attendance and manage payment records effortlessly.",
        "Promote services, merchandise, and partner offers within the app.",
      ],
    },
    {
      id: "institute",
      title: "Onboard Your Institute",
      icon: <Building2 size={22} />,
      points: [
        "Manage member details, progress, and communication.",
        "Update and maintain trainer profiles with achievements and specialties.",
        "Track member attendance and manage payment records effortlessly.",
        "Promote services, merchandise, and partner offers within the app.",
      ],
    },
  ];

  const getSignupPath = (role) => {
    switch (role) {
      case "user":
        return "/signup";
      case "trainer":
        return "/trainer-signup";
      case "institute":
        return "/institute-signup";
      default:
        return "/signup";
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 
    bg-gradient-to-b from-[#401F00] via-[#FF7A00] to-[#401F00]"
    >
      <button
        onClick={() => navigate("/")}
        className="absolute left-0 top-4 flex items-center gap-2 
    text-white bg-black/20 px-3 py-1.5 rounded-md backdrop-blur-sm"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back</span>
      </button>
      <div className="w-full max-w-lg mx-auto text-center">
        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-black">
          Welcome to Kridana
        </h1>

        <p className="text-white mt-2 mb-6 text-sm sm:text-base">
          choose your account type to get started
        </p>

        {/* Cards */}
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id}>
              {/* CARD HEADER */}
              <div
                onClick={() => toggleRole(role.id)}
                className="flex items-center justify-between 
                bg-white rounded-lg shadow-sm border border-gray-100 
                px-4 py-4 cursor-pointer"
              >
                {/* LEFT */}
                <div className="flex items-center gap-3">
                  <div className="text-[#FF6A00]">{role.icon}</div>

                  <span className="font-semibold text-black text-sm sm:text-base">
                    {role.title}
                  </span>
                </div>

                {/* RIGHT ARROW */}
                <ChevronRight className="text-black" size={20} />
              </div>

              {/* EXPAND SECTION (same logic preserved) */}
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  activeRole === role.id ? "max-h-[500px] mt-3" : "max-h-0"
                }`}
              >
                <div className="bg-white rounded-lg border border-gray-100 p-4 text-left">
                  <ul className="list-disc pl-5 space-y-2 text-sm text-black">
                    {role.points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>

                  {/* BUTTONS */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                      onClick={() => navigate(getSignupPath(role.id))}
                      className="w-full bg-[#FF6A00] text-white py-2 rounded-md font-semibold"
                    >
                      Sign Up
                    </button>

                    <button
                      onClick={() => navigate(`/login?role=${role.id}`)}
                      className="w-full border border-gray-300 py-2 rounded-md font-semibold text-black"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
