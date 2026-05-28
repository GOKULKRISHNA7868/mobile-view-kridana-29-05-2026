import { useState } from "react";
import { ChevronRight, User, Users, Building2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
      title: "Solo Coach",
      icon: <Users size={22} />,
      points: [
        "Build and manage your coaching practice with professionalism and ease.",
        "Streamline member management, progress tracking, and communication.",
        "Present a compelling personal profile to attract and engage prospective clients.",
        "Maintain accurate records of attendance and payments.",
        "Expand your reach by promoting services, merchandise, and partner offerings.",
      ],
    },

    {
      id: "institute",
      title: "Academy",
      icon: <Building2 size={22} />,
      points: [
        "Operate and scale your academy with complete control and visibility.",
        "Centralize member management, performance tracking, and communication.",
        "Establish a high-impact academy profile showcasing achievements and specialties, accessible to customers 24/7.",
        "Oversee trainer operations, including attendance, compensation, and skill management.",
        "Gain full visibility into member attendance and payment workflows.",
        "Drive growth by promoting services, merchandise, and strategic partner offerings.",
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
      className="
        min-h-screen
        flex
        items-center
        justify-center
        px-4
        bg-gradient-to-b
        from-[#401F00]
        via-[#FF7A00]
        to-[#401F00]
      "
    >
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate("/")}
        className="
          absolute
          left-4
          top-4
          flex
          items-center
          gap-2
          text-white
          bg-black/20
          px-3
          py-1.5
          rounded-md
          backdrop-blur-sm
          z-20
        "
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back</span>
      </button>

      <div className="w-full max-w-lg mx-auto text-center">
        {/* HEADING */}
        <h1 className="text-2xl sm:text-3xl font-bold text-black">
          Welcome to Kridana
        </h1>

        <p className="text-white mt-2 mb-6 text-sm sm:text-base">
          choose your account type to get started
        </p>

        {/* ROLE CARDS */}
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id}>
              {/* CARD HEADER */}
              <div
                onClick={() => toggleRole(role.id)}
                className="
                  flex
                  items-center
                  justify-between
                  bg-white
                  rounded-lg
                  shadow-sm
                  border
                  border-gray-100
                  px-4
                  py-4
                  cursor-pointer
                "
              >
                {/* LEFT SECTION */}
                <div className="flex items-center gap-3 text-left">
                  <div className="text-[#FF6A00]">{role.icon}</div>

                  <span className="font-semibold text-black text-sm sm:text-base">
                    {role.title}
                  </span>
                </div>

                {/* RIGHT ARROW */}
                <ChevronRight
                  className={`text-black transition-transform duration-300 ${
                    activeRole === role.id ? "rotate-90" : ""
                  }`}
                  size={20}
                />
              </div>

              {/* EXPAND SECTION */}
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  activeRole === role.id ? "max-h-[700px] mt-3" : "max-h-0"
                }`}
              >
                <div className="bg-white rounded-lg border border-gray-100 p-4 text-left">
                  <ul className="list-disc pl-5 space-y-3 text-sm text-black">
                    {role.points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>

                  {/* BUTTONS */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-5">
                    <button
                      onClick={() => navigate(getSignupPath(role.id))}
                      className="
                        w-full
                        bg-[#FF6A00]
                        text-white
                        py-2.5
                        rounded-md
                        font-semibold
                        active:scale-[0.98]
                        transition
                      "
                    >
                      Sign Up
                    </button>

                    <button
                      onClick={() => navigate(`/login?role=${role.id}`)}
                      className="
                        w-full
                        border
                        border-gray-300
                        py-2.5
                        rounded-md
                        font-semibold
                        text-black
                        active:scale-[0.98]
                        transition
                      "
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
