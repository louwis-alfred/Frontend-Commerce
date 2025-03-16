import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import About from "./pages/About";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import PlaceOrder from "./pages/PlaceOrder";
import Orders from "./pages/Orders";
import SelectedInvest from "./pages/SelectedInvest";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import { ToastContainer } from "react-toastify";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import InvestPage from "./pages/InvestPage";
import SellerDashboard from "./pages/SellerDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import SellerCampaignDetails from "./pages/SellerCampaignDetails";
import IframeComponent from "./components/IframeComponent";
import FarmerEducationalPlatform from './pages/FarmerEducation/FarmerEducationPlatform';
const App = () => {
  const location = useLocation();
  const isSelectedInvest = location.pathname === "/selected-invest";

  // Simplified page transition animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } }, // Reduced duration
    exit: { opacity: 0, transition: { duration: 0.3 } }, // Reduced duration
  };

  // If the route is for SelectedInvest, render it without the main layout.
  if (isSelectedInvest) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/selected-invest"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <SelectedInvest />
              </motion.div>
            }
          />
          
          
        </Routes>
      </AnimatePresence>
    );
  }

  // Else render the main layout with its routes.
  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <ToastContainer />
      <Navbar />
      <SearchBar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <Home />
              </motion.div>
            }
          />
          <Route
            path="/collection"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <Collection />
              </motion.div>
            }
          />
          <Route
            path="/about"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <About />
              </motion.div>
            }
          />
          <Route
            path="/product/:productId"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <Product />
              </motion.div>
            }
          />
          <Route
            path="/cart"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <Cart />
              </motion.div>
            }
          />

          <Route
            path="/login"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <Login />
              </motion.div>
            }
          />
          <Route
            path="/place-order"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <PlaceOrder />
              </motion.div>
            }
          />
          <Route
            path="/orders"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <Orders />
              </motion.div>
            }
          />
          <Route
            path="/invest"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <InvestPage />
              </motion.div>
            }
          />
         
          <Route
            path="/seller/dashboard"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <SellerDashboard />
              </motion.div>
            }
          />
          <Route
            path="/investor/dashboard"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <InvestorDashboard />
              </motion.div>
            }
          />
          <Route
            path="/education"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <FarmerEducationalPlatform />
              </motion.div>
            }
          />
          <Route
            path="/seller/campaign/:campaignId"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <SellerCampaignDetails />
              </motion.div>
            }
          />

          <Route
            path="/chat"
            element={
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
              >
                <IframeComponent />
              </motion.div>
            }
          />
        </Routes>
      </AnimatePresence>
      <Footer />
    </div>
  );
};

export default App;
