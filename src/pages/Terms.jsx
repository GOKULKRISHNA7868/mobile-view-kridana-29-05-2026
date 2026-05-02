import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-3 sm:px-6 md:px-10">
      <div className="w-full max-w-5xl mx-auto bg-white shadow-lg rounded-2xl p-4 sm:p-6 md:p-10">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#FF6A00] font-semibold mb-6"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-orange-500 leading-snug">
            Kridhana – Terms & Conditions
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Effective Date: From January 31st
          </p>

          <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
            KDASTSHO FINTECH SOLUTIONS <br />
            CIN No: U62099AP2025PTC117393
          </p>
        </div>

        {/* Intro */}
        <p className="text-gray-700 text-sm sm:text-base mb-6 leading-relaxed text-justify">
          By using Kridhana, you agree to follow these Terms & Conditions. If
          you do not agree, you must stop using the app immediately.
        </p>

        {/* Sections */}
        {[
          {
            title: "1. Platform Purpose",
            content: [
              "Kridhana is a sports-focused digital platform created exclusively for athletes, coaches, trainers, academies, and sports professionals.",
              "The app is designed to support sports development, opportunities, networking, and performance visibility.",
              "Users must only engage in activities related to sports growth and professional advancement.",
              "Using the app for business unrelated to sports, political activity, or personal promotions is prohibited.",
              "Kridhana reserves the right to determine whether usage aligns with the platform’s purpose.",
              "Any misuse outside sports-related objectives may result in account suspension.",
            ],
          },
          {
            title: "2. Eligibility & Registration",
            content: [
              "Users must provide accurate, current, and complete information during registration.",
              "Sports background details, achievements, and identity must be genuine and verifiable.",
              "Fake profiles, impersonation, or false claims of achievements are strictly forbidden.",
              "Kridhana may request documents, ID proof, or sports certificates for verification.",
              "Failure to provide verification when requested may lead to account restrictions.",
              "Users must be legally capable of entering into binding agreements under Indian law.",
            ],
          },
          {
            title: "3. Account Responsibility",
            content: [
              "Users are fully responsible for maintaining the confidentiality of login credentials.",
              "All actions performed through an account are considered the responsibility of the account holder.",
              "Sharing account access with others is strictly prohibited.",
              "Users must notify Kridhana immediately in case of unauthorized account use.",
              "Kridhana is not liable for losses due to user negligence in protecting account details.",
              "Repeated suspicious activity may result in temporary or permanent suspension.",
            ],
          },
          {
            title: "4. Code of Conduct",
            content: [
              "Users must behave respectfully and professionally on the platform at all times.",
              "Posting abusive, defamatory, obscene, political, or religiously offensive content is prohibited.",
              "Harassment, threats, discrimination, or exploitation of other users will not be tolerated.",
              "Users must not promote gambling, betting, or illegal sports-related activities.",
              "Uploading forged certificates, edited proof, or misleading performance data is a serious violation.",
              "Breaking conduct rules can result in immediate account termination without notice.",
            ],
          },
          {
            title: "5. User Content & Rights",
            content: [
              "Users retain ownership of the photos, videos, and achievements they upload.",
              "By posting content, users grant Kridhana permission to display and promote it within the platform.",
              "Content must not violate copyright, privacy, or intellectual property rights of others.",
              "Kridhana may remove or restrict any content that violates policies.",
              "Users are solely responsible for the legality and accuracy of uploaded materials.",
              "Content removal does not require prior explanation from Kridhana.",
            ],
          },
          {
            title: "6. Services & Opportunities Disclaimer",
            content: [
              "Kridhana acts only as a facilitator connecting sports persons and opportunities.",
              "We do not guarantee team selection, sponsorships, trials, or professional contracts.",
              "Any agreement between users and third parties is their independent responsibility.",
              "Kridhana does not verify every opportunity listed by external parties.",
              "Users must conduct their own due diligence before entering agreements.",
              "Kridhana is not liable for failed opportunities or third-party disputes.",
            ],
          },
          {
            title: "7. Payments & Subscriptions",
            content: [
              "Certain features or services may require payment or subscription.",
              "All payments made through the platform are final and non-refundable.",
              "Users are responsible for providing accurate payment information.",
              "Chargebacks or fraudulent payment claims may lead to account blocking.",
              "Kridhana reserves the right to change pricing, plans, or features at any time.",
              "Continued use after changes implies acceptance of new pricing.",
            ],
          },
          {
            title: "8. Data Usage & Privacy",
            content: [
              "Kridhana collects and processes user data to operate and improve services.",
              "Basic profile information may be visible to other sports-related users.",
              "Limited data may be shared with verified partners for sports opportunities.",
              "We do not sell personal data to unrelated third parties.",
              "Users consent to data usage by creating an account.",
              "All data handling follows our Privacy Policy.",
            ],
          },
          {
            title: "9. Suspension & Termination",
            content: [
              "Kridhana may suspend or permanently ban users violating these Terms.",
              "Serious violations may result in immediate termination without warning.",
              "Accounts involved in fraud, abuse, or illegal activities will be blocked.",
              "Kridhana may restrict device access or IP addresses if necessary.",
              "Users cannot claim compensation for terminated accounts.",
              "Decisions made for platform safety are final.",
            ],
          },
          {
            title: "10. Limitation of Liability",
            content: [
              "Kridhana is not responsible for injuries during sports participation.",
              "We are not liable for financial losses, fraud, or third-party misconduct.",
              "Technical errors, service interruptions, or data loss may occur.",
              "Users agree to use the platform at their own risk.",
              "Kridhana’s liability, if any, is limited to the amount paid for services.",
              "This limitation applies to the maximum extent permitted by law.",
            ],
          },
          {
            title: "11. Intellectual Property",
            content: [
              "All app design, software, logos, and branding belong exclusively to Kridhana.",
              "Users may not copy, modify, or commercially use platform materials.",
              "Reverse engineering or unauthorized system access is strictly prohibited.",
              "Violation of intellectual property rights may lead to legal action.",
              "Use of Kridhana branding requires written permission.",
            ],
          },
          {
            title: "12. Changes to Terms",
            content: [
              "Kridhana may update these Terms at any time without prior notice.",
              "Users are responsible for reviewing updates periodically.",
              "Continued use of the app means acceptance of revised Terms.",
              "If you disagree with changes, you must stop using the platform.",
            ],
          },
          {
            title: "13. Governing Law",
            content: [
              "These Terms are governed by the laws of India.",
              "All disputes shall fall under Indian court jurisdiction only.",
              "Legal proceedings will be handled in designated courts within India.",
            ],
          },
        ].map((section, index) => (
          <div key={index} className="mb-6 border-b pb-4 last:border-none">
            <h2 className="text-base sm:text-xl font-semibold text-gray-800 mb-2">
              {section.title}
            </h2>

            <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-gray-700 leading-relaxed">
              {section.content.map((item, i) => (
                <li key={i} className="text-justify">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TermsAndConditions;
