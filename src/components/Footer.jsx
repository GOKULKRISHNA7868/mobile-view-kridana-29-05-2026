import React, { useState } from "react";
import { FaLinkedinIn } from "react-icons/fa";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const [openSection, setOpenSection] = useState(null);

  const toggle = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="w-full bg-gradient-to-r from-[#FFE2B8] via-[#FFF1DB] to-[#FFD199] py-10">
      <div className="max-w-7xl mx-auto px-5">
        {/* MOBILE ACCORDION */}
        <div className="md:hidden space-y-3">
          {/* COMPANY */}
          <div className="bg-white/40 rounded-xl p-4">
            <button
              onClick={() => toggle("company")}
              className="flex justify-between w-full font-semibold text-[#DB6A2E]"
            >
              Company <ChevronDown />
            </button>

            {openSection === "company" && (
              <div className="mt-3 flex flex-col gap-2 text-[#5D3A09]">
                <Link onClick={scrollToTop} to="/about">
                  About Us
                </Link>
                <Link onClick={scrollToTop} to="/career">
                  Careers
                </Link>
              </div>
            )}
          </div>

          {/* HELP */}
          <div className="bg-white/40 rounded-xl p-4">
            <button
              onClick={() => toggle("help")}
              className="flex justify-between w-full font-semibold text-[#DB6A2E]"
            >
              Need Help? <ChevronDown />
            </button>

            {openSection === "help" && (
              <div className="mt-3 flex flex-col gap-2 text-[#5D3A09]">
                <Link onClick={scrollToTop} to="/help-center">
                  Help Centre
                </Link>
                <Link onClick={scrollToTop} to="/feedback">
                  Feedback
                </Link>
              </div>
            )}
          </div>

          {/* CONNECT */}
          <div className="bg-white/40 rounded-xl p-4 flex justify-between items-center">
            <span className="font-semibold text-[#DB6A2E]">
              Connect with Us
            </span>

            <a
              href="https://www.linkedin.com/company/kridana-sports-software/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 flex items-center justify-center rounded-full border border-[#DB6A2E] text-[#DB6A2E]"
            >
              <FaLinkedinIn size={18} />
            </a>
          </div>
        </div>

        {/* TABLET + DESKTOP GRID */}
        <div className="hidden md:grid grid-cols-3 gap-10 text-left">
          {/* COMPANY */}
          <div>
            <h3 className="text-lg font-bold text-[#DB6A2E] mb-3">Company</h3>
            <div className="flex flex-col gap-2 text-[#5D3A09]">
              <Link onClick={scrollToTop} to="/about">
                About Us
              </Link>
              <Link onClick={scrollToTop} to="/career">
                Careers
              </Link>
            </div>
          </div>

          {/* HELP */}
          <div>
            <h3 className="text-lg font-bold text-[#DB6A2E] mb-3">
              Need Help?
            </h3>
            <div className="flex flex-col gap-2 text-[#5D3A09]">
              <Link onClick={scrollToTop} to="/help-center">
                Help Centre
              </Link>
              <Link onClick={scrollToTop} to="/feedback">
                Feedback
              </Link>
            </div>
          </div>

          {/* CONNECT */}
          <div className="flex flex-col items-start gap-4">
            <h3 className="text-lg font-bold text-[#DB6A2E]">
              Connect with Us
            </h3>

            <a
              href="https://www.linkedin.com/company/kridana-sports-software/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-14 h-14 flex items-center justify-center rounded-full border-2 border-[#DB6A2E] text-[#DB6A2E] hover:bg-[#DB6A2E] hover:text-white transition"
            >
              <FaLinkedinIn size={20} />
            </a>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="mt-10 border-t border-[#DB6A2E]/30 pt-6 text-center text-[#5D3A09] text-sm">
          <p>© {new Date().getFullYear()} Kridana. All rights reserved.</p>

          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <Link
              onClick={scrollToTop}
              to="/terms"
              className="hover:text-[#DB6A2E]"
            >
              Terms
            </Link>
            <Link
              onClick={scrollToTop}
              to="/privacy"
              className="hover:text-[#DB6A2E]"
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
