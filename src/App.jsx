import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { LocalNotifications } from "@capacitor/local-notifications";
import { App as CapApp } from "@capacitor/app";

import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AuthProvider } from "./context/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import usePageTracking from "./hooks/usePageTracking";

/* ================= CORE PAGES ================= */
import RoleSelection from "./pages/RoleSelection.jsx";
import Signup from "./pages/Signup.jsx";
import TrainerSignup from "./pages/TrainerSignup.jsx";
import InstituteSignup from "./pages/InstituteSignup.jsx";
import Login from "./pages/Login.jsx";
import Landing from "./pages/Landing.jsx";
import FeePaymentSuccess from "./pages/FeePaymentSuccess";
import InstFeePaymentSuccess from "./pages/InstFeePaymentSuccess";

/* ================= NAVBAR ================= */
import Navbar from "./components/Navbar.jsx";
import About from "./pages/About.jsx";
import Career from "./pages/Career.jsx";
import Contact from "./pages/Contact.jsx";

/* ================= SHOP ================= */
import ShopPage from "./components/ShopPage.jsx";
import ProductsGridPage from "./components/ProductsGridPage.jsx";
import AddAddressPage from "./components/AddAddressPage.jsx";
import PaymentPage from "./components/PaymentPage.jsx";
import CartPage from "./components/CartPage.jsx";
import WishlistPage from "./components/WishlistPage.jsx";
import ReelViewer from "./pages/ReelViewer";
import Reelspage from "./pages/Reelspage.jsx";

/* ================= DASHBOARDS ================= */
import InstituteDashboard from "./components/InstituteDashboard";
import TrainersDashboard from "./components/TrainersDashboard";
import UserDashboard from "./components/UserDashboard";

/* ================= LIST & DETAILS ================= */
import ViewInstitutes from "./pages/ViewInstitutes.jsx";
import ViewTrainers from "./pages/ViewTrainers.jsx";
import InstituteDetailsPage from "./pages/InstituteDetailsPage.jsx";
import TrainerDetailsPage from "./pages/TrainerDetailsPage.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import PaymentPolicy from "./pages/PaymentPolicy.jsx";
import CustomerCentricPolicies from "./pages/CustomerCentricPolicies.jsx";
import DeliveryAndShippingPolicy from "./pages/DeliveryAndShippingPolicy.jsx";

/* ================= SELL FLOW ================= */
import SellSportsMaterial from "./components/InstituteDashboard/SellSportsMaterial.jsx";
import UploadProductDetails from "./components/InstituteDashboard/UploadProductDetails.jsx";
import ChatBox1 from "./components/InstituteDashboard/ChatBox.jsx";

/* ================= SERVICES ================= */
import MartialArts from "./pages/Services/MartialArts.jsx";
import TeamBallSports from "./pages/Services/TeamBallSports.jsx";
import RacketSports from "./pages/Services/RacketSports.jsx";
import Fitness from "./pages/Services/Fitness.jsx";
import TargetPrecisionSports from "./pages/Services/TargetPrecisionSports.jsx";
import EquestrianSports from "./pages/Services/EquestrianSports.jsx";
import AdventureOutdoorSports from "./pages/Services/AdventureOutdoorSports.jsx";
import IceSports from "./pages/Services/IceSports.jsx";
import Wellness from "./pages/Services/Wellness.jsx";
import Dance from "./pages/Services/Dance.jsx";
import AquaticSports from "./pages/Services/AquaticSports.jsx";

import Categories from "./pages/Categories";
import AvailableDemoClasses from "./pages/AvailableDemoClasses.jsx";
import "./index.css";
import Plans from "./pages/Plans.jsx";
import ProtectedRoute from "./routes/ProtectedRoute";
import PaymentAndRefundPolicy from "./pages/PaymentAndRefundPolicy";
import ChatBox from "./pages/ChatBox.jsx";
import PaymentSuccess from "./components/PaymentSuccess.jsx";
import PaymentFailed from "./components/PaymentFailed.jsx";
import { SelectedStudentProvider } from "./context/SelectedStudentContext";
import ResetPassword from "./pages/ResetPassword";
import Feedback from "./pages/Feedback";
import HelpCenter from "./pages/HelpCenter.jsx";
import MobileCategoriesPage from "./pages/MobileCategoriesPage";
import MobileEditprofile from "./pages/MobileEditprofile";
import PendingFeesDetails from "./components/InstituteDashboard/PendingFeesDetails";
import StudentsAttendancePage from "./components/InstituteDashboard/StudentsAttendancePage";
import TrainerStudentsPage from "./components/TrainersDashboard/TrainerStudentsPage";
import Uploadimages from "./pages/Uploadimages";
import SuggestedPage from "./pages/SuggestedPage.jsx";
import ChatBoxT from "./components/TrainersDashboard/ChatBox";
import ChatBoxS from "./components/UserDashboard/ChatBox";
import Reelsdata from "./components/TrainersDashboard/Reelsdata.jsx";
import InstituteReelsdata from "./components/InstituteDashboard/Reelsdata.jsx";
import AllPeoplePage from "./pages/AllPeoplePage";
function App() {
  usePageTracking();
  const location = useLocation();

  const hideNavbarPaths = [
    "/RoleSelection",
    "/login",
    "/signup",
    "/trainer-signup",
    "/institute-signup",
  ];
  const hideFooterPaths = [
    "/RoleSelection", // Welcome to Kridana page
  ];

  const showNavbar = !hideNavbarPaths.includes(location.pathname);
  const showFooter = !hideFooterPaths.includes(location.pathname);

  /* ================= MOBILE NOTIFICATION PERMISSION ================= */
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await LocalNotifications.requestPermissions();

        await LocalNotifications.createChannel({
          id: "chat_messages",
          name: "Chat Messages",
          description: "New message alerts",
          importance: 5,
          sound: "beep.wav",
          visibility: 1,
        });
      } catch (error) {
        console.log(error);
      }
    };

    initNotifications();

    CapApp.addListener("appStateChange", ({ isActive }) => {
      console.log("App Active:", isActive);
    });
  }, []);

  return (
    <AuthProvider>
      <SelectedStudentProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="bg-white text-black min-h-screen">
              {showNavbar && <Navbar />}
              <ScrollToTop />

              <Routes>
                {/* AUTH */}
                <Route path="AllPeoplePage" element={<AllPeoplePage />} />
                <Route path="/about" element={<About />} />
                <Route path="/career" element={<Career />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/trainer-signup" element={<TrainerSignup />} />
                <Route path="/institute-signup" element={<InstituteSignup />} />
                <Route path="/chat/:chatId" element={<ChatBox />} />
                <Route
                  path="/MobileCategoriesPage"
                  element={<MobileCategoriesPage />}
                />
                <Route
                  path="/MobileEditprofile"
                  element={<MobileEditprofile />}
                />
                <Route
                  path="/StudentsAttendancePage"
                  element={<StudentsAttendancePage />}
                />
                <Route
                  path="/TrainerStudentsPage"
                  element={<TrainerStudentsPage />}
                />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/help-center" element={<HelpCenter />} />
                <Route
                  path="/pending-fees/:branch"
                  element={<PendingFeesDetails />}
                />
                <Route path="/Uploadimages" element={<Uploadimages />} />
                <Route
                  path="/components/InstituteDashboard/ChatBox"
                  element={<ChatBox1 />}
                />
                <Route path="/ChatBox" element={<ChatBoxT />} />
                <Route
                  path="/components/UserDashboard/ChatBox"
                  element={<ChatBoxS />}
                />

                {/* LANDING */}
                <Route path="/RoleSelection" element={<RoleSelection />} />
                <Route path="/reels/:index" element={<ReelViewer />} />
                <Route path="/trending-plays" element={<Reelspage />} />
                <Route
                  path="/feepaymentsuccess"
                  element={<FeePaymentSuccess />}
                />
                <Route
                  path="/Instfeepaymentsuccess"
                  element={<InstFeePaymentSuccess />}
                />

                {/* DASHBOARDS */}
                <Route
                  path="/trainers/dashboard"
                  element={
                    <ProtectedRoute role="trainer">
                      <TrainersDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/institutes/dashboard"
                  element={
                    <ProtectedRoute role="institute">
                      <InstituteDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="/user/dashboard" element={<UserDashboard />} />

                {/* SELL */}
                <Route
                  path="/sell-sports-material"
                  element={<SellSportsMaterial />}
                />
                <Route
                  path="/upload-product-details"
                  element={<UploadProductDetails />}
                />

                {/* SHOP */}
                <Route
                  path="/components/TrainersDashboard/reelsdata"
                  element={<Reelsdata />}
                />
                <Route
                  path="/components/InstituteDashboard/Reelsdata"
                  element={<InstituteReelsdata />}
                />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/shop/:category" element={<ProductsGridPage />} />
                <Route path="/addresspage" element={<AddAddressPage />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/payment-failed" element={<PaymentFailed />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />

                <Route
                  path="/components/TrainersDashboard/ChatBox"
                  element={<ChatBoxT />}
                />

                {/* DETAILS */}
                <Route path="/trainers" element={<ViewTrainers />} />
                <Route path="/institutes" element={<ViewInstitutes />} />
                <Route path="/trainers/:id" element={<TrainerDetailsPage />} />
                <Route
                  path="/institutes/:id"
                  element={<InstituteDetailsPage />}
                />
                <Route path="/viewTrainers" element={<ViewTrainers />} />
                <Route path="/viewInstitutes" element={<ViewInstitutes />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/paymentpolicy" element={<PaymentPolicy />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route
                  path="/customer-policies"
                  element={<CustomerCentricPolicies />}
                />
                <Route
                  path="/delivery-shipping-policy"
                  element={<DeliveryAndShippingPolicy />}
                />
                <Route
                  path="/payment-refund-policy"
                  element={<PaymentAndRefundPolicy />}
                />

                {/* SERVICES */}
                <Route path="/categories" element={<Categories />} />
                <Route
                  path="/services/martial-arts"
                  element={<MartialArts />}
                />
                <Route path="/services/teamball" element={<TeamBallSports />} />
                <Route
                  path="/services/racketsports"
                  element={<RacketSports />}
                />
                <Route path="/services/fitness" element={<Fitness />} />
                <Route
                  path="/services/target-precision-sports"
                  element={<TargetPrecisionSports />}
                />
                <Route
                  path="/services/equestrian-sports"
                  element={<EquestrianSports />}
                />
                <Route
                  path="/services/adventure-outdoor-sports"
                  element={<AdventureOutdoorSports />}
                />
                <Route path="/services/ice-sports" element={<IceSports />} />
                <Route path="/services/wellness" element={<Wellness />} />
                <Route path="/services/dance" element={<Dance />} />
                <Route path="/services/aquatic" element={<AquaticSports />} />

                <Route path="/plans" element={<Plans />} />
                <Route
                  path="/book-demo/:instituteId"
                  element={<AvailableDemoClasses />}
                />
              </Routes>
            </div>
          </WishlistProvider>
        </CartProvider>
      </SelectedStudentProvider>
    </AuthProvider>
  );
}

export default App;
