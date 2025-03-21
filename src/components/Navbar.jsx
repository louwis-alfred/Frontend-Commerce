import { assets } from "../assets/frontend_assets/assets";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext.js";
import axios from "axios";
import ApplyForm from "../pages/ApplyForm";
import ApplyAsInvestor from "../pages/ApplyAsInvestor.jsx";
import { motion, AnimatePresence } from "framer-motion";
import NotificationBell from "./NotificationBell.jsx";
import OrderHistory from "./OrderHistory.jsx";
// You can use react-icons instead if you prefer
import {
  FaUser,
  FaShoppingCart,
  FaBars,
  FaTimes,
  FaHome,
  FaStore,
  FaChartLine,
  FaInfoCircle,
  FaSignOutAlt,
  FaBox,
} from "react-icons/fa";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { getCartCount, token, setToken, setCartItems } =
    useContext(ShopContext);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showInvestorApplyForm, setShowInvestorApplyForm] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  // const [isInvestor, setIsInvestor] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const checkSellerStatus = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/seller-status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Only set isSeller if the API call was successful
        if (response.data && response.data.isSeller !== undefined) {
          setIsSeller(response.data.isSeller);
        }
      } catch (error) {
        // Silently handle 401/403 errors (not authenticated or not authorized)
        if (
          !error.response ||
          (error.response.status !== 401 && error.response.status !== 403)
        ) {
          console.error("Error checking seller status:", error.message);
        }
      }
    };

    // const checkInvestorStatus = async () => {
    //   try {
    //     const response = await axios.get(
    //       "http://localhost:4000/api/user/check-investor-status",
    //       {
    //         headers: {
    //           Authorization: `Bearer ${token}`,
    //         },
    //       }
    //     );
    //     // Only set isInvestor if the API call was successful
    //     if (response.data && response.data.isInvestor !== undefined) {
    //       setIsInvestor(response.data.isInvestor);
    //     }
    //   } catch (error) {
    //     // Silently handle 401/403 errors (not authenticated or not authorized)
    //     if (
    //       !error.response ||
    //       (error.response.status !== 401 && error.response.status !== 403)
    //     ) {
    //       console.error("Error checking investor status:", error.message);
    //     }
    //   }
    // };

    checkSellerStatus();
    checkInvestorStatus();
    const intervalId = setInterval(() => {
      checkSellerStatus();
      checkInvestorStatus();
    }, 3000); // Reduced API calls

    return () => clearInterval(intervalId);
  }, []);

  const handleApplyClick = () => {
    if (isSeller) {
      navigate("/seller/dashboard");
    } else {
      setShowApplyForm(true);
    }
  };

  // const handleInvestorApplyClick = () => {
  //   if (isInvestor) {
  //     navigate("/investor/dashboard");
  //   } else {
  //     setShowInvestorApplyForm(true);
  //   }
  // };

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".profile-menu")) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    setToken("");
    setCartItems({});
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setCurrentUser(response.data.user);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchCurrentUser();
  }, [token]);

  return (
    <>
      {/* ✅ TOP NAVBAR */}
      <div className="flex items-center justify-between px-6 py-3 shadow-md bg-white sticky top-0 z-40">
        {/* Logo */}
        <Link to="/" className="flex items-center mr-6">
          <span className="text-xl font-bold text-green-700 hidden md:block">
            A
          </span>
        </Link>
        {token && currentUser && (
          <div className="hidden sm:block mr-4 text-sm">
            <span className="text-gray-600">Welcome, </span>
            <span className="font-medium text-green-700">
              {currentUser.name}
            </span>
          </div>
        )}
        {/* 🔹 Desktop Navigation */}
        <div className="hidden sm:flex flex-1 justify-center">
          <ul className="flex gap-8 text-base font-medium text-gray-700 items-center">
            {token && currentUser?._id ? (
              <NotificationBell token={token} userId={currentUser._id} />
            ) : null}
            {[
              { name: "Home", path: "/", icon: <FaHome className="mr-1" /> },
              {
                name: "Market",
                path: "/collection",
                icon: <FaStore className="mr-1" />,
              },
              {
                name: "Invest",
                path: "/invest",
                icon: <FaChartLine className="mr-1" />,
              },
              {
                name: "Education",
                path: "/education",
                icon: <FaChartLine className="mr-1" />,
              },
              {
                name: "About",
                path: "/about",
                icon: <FaInfoCircle className="mr-1" />,
              },
            ].map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 transition duration-300 ease-in-out hover:text-green-600 
                  relative after:block after:content-[''] after:absolute after:h-[2px] after:w-0 
                  after:left-0 after:bottom-0 after:bg-green-600 after:transition-all after:duration-300 
                  hover:after:w-full ${
                    isActive ? "text-green-600 after:w-full" : ""
                  }`
                }
              >
                {link.icon}
                {link.name}
              </NavLink>
            ))}
          </ul>
        </div>

        {/* 🔹 Action Buttons & Icons */}
        <div className="flex items-center gap-5">
          {/* 🔹 Apply Buttons (Desktop) */}
          {token && (
            <div className="hidden sm:flex gap-3">
              <button
                onClick={handleApplyClick}
                className="px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 
                  rounded-full hover:bg-green-100 transition-all duration-300"
              >
                {isSeller ? "Seller Dashboard" : "Apply as Seller"}
              </button>

              {/* <button
                onClick={handleInvestorApplyClick}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 
                  rounded-full hover:bg-blue-100 transition-all duration-300"
              >
                {isInvestor ? "Investor Dashboard" : "Apply as Investor"}
              </button> */}
            </div>
          )}

          {/* Mobile menu hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className="sm:hidden text-gray-700 hover:text-green-700 p-1 rounded-md"
          >
            <FaBars size={20} />
          </button>

          {/* 🔹 Profile Menu */}
          <div className="relative profile-menu">
            <button
              onClick={() => (token ? toggleDropdown() : navigate("/login"))}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 
                hover:bg-gray-200 transition-all duration-300"
              aria-label="Profile"
            >
              <FaUser className="text-gray-700" size={16} />
            </button>

            <AnimatePresence>
              {token && isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 bg-white shadow-lg rounded-md mt-2 w-52 overflow-hidden z-50"
                >
                  <div className="py-2">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <FaUser className="text-gray-500" /> My Profile
                    </button>
                    <button
                      onClick={() => navigate("/orders")}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaBox className="text-gray-500" /> Orders
                    </button>
                    {/* Add this new button for Order History */}
                    <button
                      onClick={() => {
                        if (currentUser?._id) {
                          setSelectedOrderId(currentUser._id);
                          setShowOrderHistory(true);
                          setIsDropdownOpen(false);
                        }
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaBox className="text-gray-500" /> Order History
                    </button>

                    <div className="border-t border-gray-100 my-1">
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <FaSignOutAlt className="text-red-500" /> Logout
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 🔹 Cart */}
          <Link to="/cart" className="relative p-1.5">
            <FaShoppingCart
              className="text-gray-700 hover:text-green-600 transition-colors"
              size={20}
            />
            {getCartCount() > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center bg-green-600 text-white rounded-full">
                {getCartCount()}
              </span>
            )}
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 sm:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white w-72 h-full shadow-lg flex flex-col ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 🔹 Close Button */}
              <div className="p-4 flex justify-between items-center border-b">
                <div className="flex items-center gap-2">
                  <img
                    src={assets.logo || "https://placehold.co/40x40?text=AG"}
                    alt="AgriFresh"
                    className="h-8 w-auto"
                  />
                  <p className="text-lg font-bold text-green-700">AgriFresh</p>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {/* 🔹 Mobile Links */}
              <div className="flex flex-col py-2">
                {token && currentUser && (
                  <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                      <FaUser size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Welcome,</p>
                      <p className="font-medium text-gray-800">
                        {currentUser.name}
                      </p>
                    </div>
                  </div>
                )}

                {[
                  { name: "Home", path: "/", icon: <FaHome /> },
                  { name: "Market", path: "/collection", icon: <FaStore /> },
                  { name: "Invest", path: "/invest", icon: <FaChartLine /> },
                  { name: "About", path: "/about", icon: <FaInfoCircle /> },
                ].map((link) => (
                  <NavLink
                    key={link.name}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-3 px-6 border-b border-gray-100 hover:bg-gray-50
                      ${
                        isActive
                          ? "text-green-600 border-l-4 border-l-green-600 pl-5"
                          : ""
                      }`
                    }
                    to={link.path}
                  >
                    {link.icon}
                    {link.name}
                  </NavLink>
                ))}
              </div>

              {/* 🔹 Apply Button (Mobile) */}
              {token && (
                <div className="p-4 flex flex-col gap-3 mt-2">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleApplyClick();
                    }}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 
                      transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {isSeller ? "Seller Dashboard" : "Apply as Seller"}
                  </button>

                  {/* <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleInvestorApplyClick();
                    }}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                      transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {isInvestor ? "Investor Dashboard" : "Apply as Investor"}
                  </button> */}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showOrderHistory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50"
          onClick={() => setShowOrderHistory(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <OrderHistory
              orderId={selectedOrderId}
              onClose={() => setShowOrderHistory(false)}
              token={token}
            />
          </motion.div>
        </motion.div>
      )}

      {/* ✅ APPLY FORM MODAL */}
      {showApplyForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl m-4"
          >
            <ApplyForm onClose={() => setShowApplyForm(false)} />
          </motion.div>
        </motion.div>
      )}

      {/* ✅ INVESTOR APPLY FORM MODAL */}
      {showInvestorApplyForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl m-4"
          >
            <ApplyAsInvestor onClose={() => setShowInvestorApplyForm(false)} />
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default Navbar;
