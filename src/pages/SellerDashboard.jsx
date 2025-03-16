import { useState, useEffect, useRef, useContext, createRef } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import Modal from "../components/Modal";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AvailableForTrade from "../components/AvailableForTrade";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TradeProduct from "../components/TradeProduct";
import TradeRequests from "../components/TradeRequests";
import CampaignVideoManager from "../components/CampaignVideoManager";
import CompletedTrades from "../components/CompletedTrades";
import TradedProductsList from "../components/TradedProductsList";
import OrderConfirmation from "../components/OrderConfirmation";
import SellerOrders from "./SellerOrders";
import PropTypes from "prop-types";
import NotificationBadge from "../components/NotificationBadge";
import { NotificationContext } from "../context/NotificationContext";
const backendUrl = "https://e-farm-backend-4.onrender.com";

const RemoveProductModal = ({
  isOpen = false,
  onClose = () => {},
  onConfirm = () => {},
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md w-full">
        {/* Keep all your existing modal content */}
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
            {/* SVG content */}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Confirm Product Removal
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Rest of the modal content */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Yes, Remove Product(s)
          </button>
        </div>
      </div>
    </Modal>
  );
};

const SellerDashboard = () => {
  const { fetchNotifications } = useContext(NotificationContext);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const authToken = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(null);
  const [sellerId, setSellerId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    images: Array(4).fill(null),
    category: "",
    stock: "",
    unitOfMeasurement: "",
    freshness: "Fresh",
  });
  const [tradeListReloadTrigger, setTradeListReloadTrigger] = useState(0);

  const [campaignFormData, setCampaignFormData] = useState({
    title: "",
    description: "",
    videos: Array(2).fill(null),
    category: "",
    endDate: "",
  });
  const [campaigns, setCampaigns] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState(Array(2).fill(null));
  // const videoInputRefs = useRef(
  //   Array(2)
  //     .fill(null)
  //     .map(() => createRef())
  // );
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [products, setProducts] = useState([]);
  const [imagePreviews, setImagePreviews] = useState(Array(4).fill(null));
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedSection, setSelectedSection] = useState("dashboard");
  const [productFilter, setProductFilter] = useState("all");
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const fileInputRefs = useRef(Array.from({ length: 4 }, () => createRef()));
  const { getProductsData } = useContext(ShopContext);
  const handleOrderAction = async (orderId, action, reason = null) => {
    try {
      // Create request payload
      const payload = {
        orderId,
        action,
      };

      // Add reason if provided (for rejections)
      if (reason) {
        payload.reason = reason;
      }

      // Display loading message
      const loadingToast = toast.loading(
        action === "confirm" ? "Accepting order..." : "Rejecting order..."
      );

      // Call the API endpoint
      const response = await axios.post(
        `${backendUrl}/api/orders/confirm-reject`,
        payload,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      // Dismiss the loading toast
      toast.dismiss(loadingToast);

      // Display success message
      if (response.data.success) {
        toast.success(
          action === "confirm"
            ? "Order accepted successfully!"
            : "Order rejected successfully"
        );

        // Update the orders list
        const updatedOrders = orders.filter((order) => order._id !== orderId);
        setOrders(updatedOrders);
      } else {
        toast.error(response.data.message || "Failed to process order");
      }
    } catch (error) {
      console.error(`Error processing order:`, error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred while processing the order"
      );
    }
  };
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file for thumbnail");
        return;
      }

      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Thumbnail file size should be less than 5MB");
        return;
      }

      // Update thumbnail state
      setSelectedThumbnail(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };

  // Add cleanup for preview URLs in useEffect
  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);
  const handleOpenTradeModal = (product) => {
    setSelectedProduct(product);
    setIsTradeModalOpen(true);
  };
  // eslint-disable-next-line no-unused-vars
  const handleTradeCompletion = (success, tradeData) => {
    setIsTradeModalOpen(false);
    setSelectedProduct(null);

    // Only show success message if trade was actually initiated
    if (success) {
      toast.success("Trade request sent successfully!");
      // Refresh product data if needed
      if (typeof getProductsData === "function") {
        getProductsData();
      }
    }
  };
  const handleCampaignChange = (e) => {
    const { name, value } = e.target;
    setCampaignFormData({ ...campaignFormData, [name]: value });
  };

  // Remove this entire function
  // const handleVideoChange = (e, index) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     // Check file type
  //     if (!file.type.startsWith("video/")) {
  //       toast.error("Selected file must be a video");
  //       return;
  //     }

  //     const updatedVideos = [...campaignFormData.videos];
  //     updatedVideos[index] = file;
  //     setCampaignFormData({ ...campaignFormData, videos: updatedVideos });

  //     // Generate preview URL for the video
  //     const videoURL = URL.createObjectURL(file);
  //     const updatedPreviews = [...videoPreviews];
  //     updatedPreviews[index] = {
  //       url: videoURL,
  //       name: file.name,
  //       size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
  //       type: file.type,
  //     };
  //     setVideoPreviews(updatedPreviews);
  //   }
  // };

  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", campaignFormData.title);
    data.append("description", campaignFormData.description);
    data.append("category", campaignFormData.category);
    data.append("endDate", campaignFormData.endDate);
    data.append("creatorType", "seller");

    // Add video file if available
    if (campaignFormData.videoFile) {
      data.append("video", campaignFormData.videoFile);
    }

    // Fix the bug here - using 'data' instead of 'formData' for thumbnail
    if (selectedThumbnail) {
      data.append("thumbnail", selectedThumbnail);
    }

    try {
      const loadingToast = toast.loading("Creating video campaign...");

      await axios.post(`${backendUrl}/api/campaign/create`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.dismiss(loadingToast);
      toast.success("Video campaign created successfully!");
      setSelectedThumbnail(null);
      setThumbnailPreview(null);

      // Refresh campaigns
      const updatedCampaigns = await axios.get(
        `${backendUrl}/api/campaign/seller/${sellerId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setCampaigns(updatedCampaigns.data.campaigns || []);

      // Reset form data
      setCampaignFormData({
        title: "",
        description: "",
        category: "",
        endDate: "",
        videoFile: null,
        videos: Array(2).fill(null),
      });

      setVideoPreviews(Array(2).fill(null));
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Error creating campaign");
      console.error("Campaign creation error:", error);
    }
  };

  // Add a new handler for video file selection
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a valid video file");
        return;
      }
      setCampaignFormData({ ...campaignFormData, videoFile: file });
      toast.info(`Video selected: ${file.name}`);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup function to revoke object URLs when component unmounts
      videoPreviews.forEach((preview) => {
        if (preview && preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [videoPreviews]);

  useEffect(() => {
    if (sellerId) {
      const fetchCampaigns = async () => {
        try {
          const response = await axios.get(
            `${backendUrl}/api/campaign/seller/${sellerId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          // Defensive processing of campaigns data
          const campaignsData = response.data.campaigns || [];

          // Ensure each campaign has all required fields including videos array
          const normalizedCampaigns = campaignsData
            .map((campaign) => {
              if (!campaign) return null;

              return {
                ...campaign,
                _id: campaign._id || `temp-${Date.now()}`,
                videos: Array.isArray(campaign.videos) ? campaign.videos : [],
                title: campaign.title || "Untitled Campaign",
                description: campaign.description || "",
                category: campaign.category || "Uncategorized",
              };
            })
            .filter(Boolean); // Remove any null entries

          setCampaigns(normalizedCampaigns);
        } catch (error) {
          console.error("Error fetching campaigns", error);
          // Always ensure campaigns is an array even on error
          setCampaigns([]);
        }
      };

      fetchCampaigns();
    }
  }, [sellerId, authToken]);
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/seller/dashboard`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        // Store complete user data
        setCurrentUser(response.data.user);
        setSellerId(response.data.user._id);
        setProducts(response.data.products || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch seller products
  useEffect(() => {
    if (sellerId) {
      const fetchProducts = async () => {
        try {
          const response = await axios.get(
            `${backendUrl}/api/product/seller/${sellerId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
          setProducts(response.data.products || []);
        } catch (error) {
          console.error("Error fetching products", error);
        }
      };
      fetchProducts();
    }
  }, [sellerId, authToken]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/order/seller-orders`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setOrders(response.data.orders || []);
      } catch (error) {
        console.error("Error fetching orders:", error.message);
        toast.error("Failed to load orders");
      }
    };

    if (sellerId) {
      fetchOrders();
    }
  }, [sellerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const updatedImages = [...formData.images];
      updatedImages[index] = file;
      setFormData({ ...formData, images: updatedImages });

      const updatedPreviews = [...imagePreviews];
      updatedPreviews[index] = URL.createObjectURL(file);
      setImagePreviews(updatedPreviews);
    }
  };

  const handleRemoveFromTrade = async () => {
    if (!selectedProductIds.length) {
      return toast.error("Please select products to remove from trade.");
    }
    try {
      // Show loading toast
      const loadingToast = toast.loading("Removing products from trade...");

      // Process each product
      await Promise.all(
        selectedProductIds.map((productId) =>
          axios.post(
            `${backendUrl}/api/trades/remove-from-trade`,
            { productId },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          )
        )
      );

      // Refresh products list
      const response = await axios.get(
        `${backendUrl}/api/product/seller/${sellerId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Update state
      setProducts(response.data.products || []);
      setSelectedProductIds([]);

      // Update toast
      toast.dismiss(loadingToast);
      toast.success("Products removed from trade successfully!");
      setTradeListReloadTrigger((prev) => prev + 1);
      // Refresh available trades list if component exists
      if (typeof getProductsData === "function") {
        getProductsData();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error removing products from trade"
      );
      console.error("Trade error:", error);
    }
  };

  const handleRemoveProduct = async () => {
    if (!selectedProductIds.length) {
      return toast.error("Please select products to remove.");
    }
    setIsRemoveModalOpen(true);
  };

  const confirmRemove = async () => {
    try {
      const loadingToast = toast.loading("Removing products...");

      await Promise.all(
        selectedProductIds.map((productId) =>
          axios.delete(
            `${backendUrl}/api/product/remove/${productId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          )
        )
      );

      setProducts(products.filter((p) => !selectedProductIds.includes(p._id)));
      setSelectedProductIds([]);
      getProductsData();

      toast.dismiss(loadingToast);
      toast.success("Products removed successfully!");
      setIsRemoveModalOpen(false);
    } catch (error) {
      toast.error("Error removing products");
      console.error("Error:", error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "images")
        value.forEach((img, i) => img && data.append(`image${i + 1}`, img));
      else data.append(key, value);
    });
    data.append("sellerId", sellerId);

    try {
      await axios.post(`${backendUrl}/api/product/add`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const updatedProducts = await axios.get(
        `${backendUrl}/api/product/seller/${sellerId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setProducts(updatedProducts.data.products || []);
      setFormData({
        name: "",
        description: "",
        price: "",
        images: Array(4).fill(null),
        category: "",
        stock: "",
        unitOfMeasurement: "",
      });
      setImagePreviews(Array(4).fill(null));
      getProductsData();
      toast.success("Product created successfully!");
    } catch (error) {
      toast.error("Error creating product");
      console.error(error);
    }
  };

  const handleCheckboxChange = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleTrade = async () => {
    if (!selectedProductIds.length) {
      return toast.error("Please select products to trade.");
    }
    try {
      // Show loading toast
      const loadingToast = toast.loading("Adding products for trade...");

      // Process each product
      await Promise.all(
        selectedProductIds.map((productId) =>
          axios.post(
            `${backendUrl}/api/trades/add-for-trade`,
            { productId },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          )
        )
      );

      // Refresh products list
      const response = await axios.get(
        `${backendUrl}/api/product/seller/${sellerId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setProducts(response.data.products || []);
      setSelectedProductIds([]);

      toast.dismiss(loadingToast);
      toast.success("Products added for trade successfully!");

      setTradeListReloadTrigger((prev) => prev + 1);

      if (typeof getProductsData === "function") {
        getProductsData();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error adding products for trade"
      );
      console.error("Trade error:", error);
    }
  };

  // (Not used) const handleConfirmOrder = async (orderId) => {
  //   try {
  //     await axios.post(
  //       `http://localhost:4000/api/orders/confirm/${orderId}`,
  //       {},
  //       {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         },
  //       }
  //     );
  //     setOrders(orders.filter((order) => order._id !== orderId));
  //     toast.success("Order confirmed successfully!");
  //   } catch (error) {
  //     toast.error("Error confirming order");
  //     console.error("Error:", error.message);
  //   }
  // };

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2, slidesToScroll: 1, infinite: true },
      },
      { breakpoint: 600, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  return (
    <div className="relative z-2 min-h-screen bg-gray-50 p-6 sm:p-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Seller Dashboard
      </h1>
      <div className="flex justify-end mb-4">
        <div className="relative inline-block text-left">
          <div>
            <button
              type="button"
              className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              id="options-menu"
              aria-haspopup="true"
              aria-expanded={isOptionsMenuOpen}
              onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
            >
              Settings
              <svg
                className="-mr-1 ml-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 9.293a1 1 0 011.414 0L10 12.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          {isOptionsMenuOpen && (
            <div
              className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="options-menu"
            >
              <div className="py-1" role="none">
                <button
                  onClick={() => setSelectedSection("dashboard")}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                  role="menuitem"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Dashboard
                </button>
                <button
                  onClick={() => setSelectedSection("trade-requests")}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                  role="menuitem"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  Trade Requests
                </button>
                <button
                  onClick={() => setSelectedSection("campaigns")}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                  role="menuitem"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Video Campaigns
                </button>
                <button
                  onClick={() => setSelectedSection("confirmation")}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center relative"
                  role="menuitem"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  Order Confirmation
                  <NotificationBadge type="NEW_ORDER" />
                </button>
                <button
                  onClick={() => setSelectedSection("orders")}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left flex items-center"
                  role="menuitem"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Manage Orders
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add the traded products section */}
      {selectedSection === "traded-products" && (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-7xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-700 mb-6 flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              ></path>
            </svg>
            Traded Products
          </h2>
          <TradedProductsList
            token={authToken}
            onMarketStatusChange={() =>
              setTradeListReloadTrigger((prev) => prev + 1)
            }
          />
        </div>
      )}

      {selectedSection === "confirmation" && (
       <OrderConfirmation
       token={authToken}
       fetchNotifications={fetchNotifications}
     />
      )}
      {selectedSection === "orders" && (
        <SellerOrders backendUrl={backendUrl} token={authToken} />
      )}
      {/* Other existing sections */}
      {selectedSection === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Create Product Section */}
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  ></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">
                Add New Product
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product name */}
              <div>
                <label
                  htmlFor="product-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Product Name
                </label>
                <input
                  id="product-name"
                  type="text"
                  name="name"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="product-description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="product-description"
                  name="description"
                  placeholder="Describe your product"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  rows="3"
                  required
                />
              </div>

              {/* Price and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="product-price"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Price (₱)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">₱</span>
                    </div>
                    <input
                      id="product-price"
                      type="number"
                      name="price"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="product-category"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="product-category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all bg-white"
                    required
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    <option value="Fruits">Fruit</option>
                    <option value="Vegetables">Vegetable</option>
                    <option value="Meat">Meat</option>
                    <option value="SeaFood">Sea Food</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left column for Unit and Freshness */}
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="unit-measurement"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Unit of Measurement
                    </label>
                    <select
                      id="unit-measurement"
                      name="unitOfMeasurement"
                      value={formData.unitOfMeasurement}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all bg-white"
                      required
                    >
                      <option value="" disabled>
                        Select Unit
                      </option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="pc">Piece (pc)</option>
                      <option value="bundle">Bundle</option>
                      <option value="pack">Pack</option>
                      <option value="lbs">Pounds (lbs)</option>
                      <option value="oz">Ounce (oz)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="freshness"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Freshness
                    </label>
                    <select
                      id="freshness"
                      name="freshness"
                      value={formData.freshness}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all bg-white"
                      required
                    >
                      <option value="Fresh">Fresh</option>
                      <option value="Day-old">Day-old</option>
                      <option value="Stored">Stored</option>
                      <option value="Processed">Processed</option>
                    </select>
                  </div>
                </div>

                {/* Right column for Stock */}
                <div>
                  <label
                    htmlFor="product-stock"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Stock Quantity
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                    <input
                      id="product-stock"
                      type="number"
                      name="stock"
                      placeholder="0"
                      value={formData.stock}
                      onChange={handleChange}
                      className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                      required
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Product Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <input
                        type="file"
                        ref={fileInputRefs.current[index]}
                        onChange={(e) => handleFileChange(e, index)}
                        className="hidden"
                        accept="image/*"
                      />
                      <div
                        onClick={() =>
                          fileInputRefs.current[index].current.click()
                        }
                        className={`aspect-square w-full rounded-lg cursor-pointer overflow-hidden border-2 transition-all duration-200
                          ${
                            preview
                              ? "border-green-300 hover:border-green-400 shadow-sm"
                              : "border-dashed border-gray-300 hover:border-green-400 bg-gray-50"
                          }`}
                      >
                        {preview ? (
                          <div className="relative h-full">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all">
                              <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                                <svg
                                  className="w-8 h-8 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full p-4">
                            <svg
                              className="w-8 h-8 text-gray-400 mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-xs text-gray-500 text-center">
                              {preview
                                ? "Change Image"
                                : `Add Image ${index + 1}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Upload up to 4 high-quality images of your product
                  (recommended size: 800x800px)
                </p>
              </div>

              {/* Submit button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full px-6 py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg 
                           hover:from-green-600 hover:to-green-700 focus:ring-4 focus:ring-green-300 shadow-sm 
                           transition-all duration-200 flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Create Product
                </button>
              </div>
            </form>
          </div>

          {/* Product List Section */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <svg
                className="w-6 h-6 mr-2 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                ></path>
              </svg>
              Your Products
            </h2>

            <div className="mb-3 flex flex-wrap gap-1">
              <button
                onClick={() => setProductFilter("all")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center ${
                  productFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5 mr-1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                All
              </button>
              <button
                onClick={() => setProductFilter("created")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center ${
                  productFilter === "created"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5 mr-1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Created
              </button>
              <button
                onClick={() => setProductFilter("acquired")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center ${
                  productFilter === "acquired"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5 mr-1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                Acquired
              </button>
            </div>

            {products.length ? (
              <>
                <div className="mb-4 overflow-hidden">
                  <Slider
                    {...{
                      ...sliderSettings,
                      slidesToShow: 4, // Show more products per view
                      slidesToScroll: 2,
                      responsive: [
                        {
                          breakpoint: 1280,
                          settings: { slidesToShow: 3, slidesToScroll: 2 },
                        },
                        {
                          breakpoint: 1024,
                          settings: { slidesToShow: 2, slidesToScroll: 1 },
                        },
                        {
                          breakpoint: 640,
                          settings: { slidesToShow: 1, slidesToScroll: 1 },
                        },
                      ],
                    }}
                  >
                    {products
                      .filter((product) => {
                        if (productFilter === "all") return true;
                        if (productFilter === "created") return !product.origin;
                        if (productFilter === "acquired")
                          return !!product.origin;
                        return true;
                      })
                      .map((product) => (
                        <div key={product._id} className="px-1 pb-2">
                          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 relative group h-full flex flex-col">
                            {/* Stock badge - smaller and more compact */}
                            <div className="absolute top-2 left-2 z-20">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  product.stock > 10
                                    ? "bg-green-100 text-green-800"
                                    : product.stock > 0
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {product.stock > 0 ? `${product.stock}` : "Out"}
                              </span>
                            </div>

                            {/* Trading badge - more compact */}
                            {product.availableForTrade && (
                              <div className="absolute top-2 right-8 z-20">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Trading
                                </span>
                              </div>
                            )}

                            {/* Selection checkbox - smaller */}
                            <div className="absolute top-2 right-2 z-20">
                              <input
                                type="checkbox"
                                id={`product-${product._id}`}
                                checked={selectedProductIds.includes(
                                  product._id
                                )}
                                onChange={() =>
                                  handleCheckboxChange(product._id)
                                }
                                className="hidden"
                              />
                              <label
                                htmlFor={`product-${product._id}`}
                                className={`w-6 h-6 flex items-center justify-center rounded-full cursor-pointer transition-all ${
                                  selectedProductIds.includes(product._id)
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-white/80 text-transparent hover:bg-gray-100 border border-gray-200"
                                }`}
                                title={
                                  selectedProductIds.includes(product._id)
                                    ? "Selected"
                                    : "Select product"
                                }
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                                    clipRule="evenodd"
                                  ></path>
                                </svg>
                              </label>
                            </div>

                            {/* Product image - with height constraint */}
                            <div className="aspect-square max-h-32 relative overflow-hidden bg-gray-100">
                              <img
                                src={
                                  Array.isArray(product.images)
                                    ? product.images[0]
                                    : product.images
                                }
                                alt={product.name}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://via.placeholder.com/300x300?text=No+Image";
                                }}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />

                              {/* Gradient overlay on hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                              {/* Category tag - smaller */}
                              <div className="absolute bottom-1 left-1">
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 shadow-sm border border-gray-100">
                                  <svg
                                    className="w-2.5 h-2.5 mr-0.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994.997 0 013 12V7a4 4 0 014-4z"
                                    ></path>
                                  </svg>
                                  {product.category}
                                </span>
                              </div>
                            </div>

                            {/* Product info - more compact */}
                            <div className="p-2 flex-grow flex flex-col">
                              <h3
                                className="text-sm font-medium text-gray-800 line-clamp-1 mb-0.5 hover:underline cursor-pointer"
                                title={product.name}
                              >
                                {product.name}
                              </h3>

                              <p className="text-base font-semibold text-green-600">
                                ₱{Number(product.price).toLocaleString()}
                              </p>

                              {/* Action button - more compact */}
                              <div className="mt-auto pt-1.5">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(product._id);

                                  }}
                                  className="w-full text-blue-600 hover:text-blue-800 text-xs flex items-center justify-center gap-1 py-1 border border-blue-100 rounded-md hover:bg-blue-50 transition-colors"
                                >
                                  <svg
                                    className="h-3 w-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                  </svg>
                                  Copy ID
                                </button>
                              </div>
                            </div>

                            {/* Footer with selection toggle - more compact */}
                            <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                              <div
                                className={`flex items-center text-xs ${
                                  product.stock > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                <svg
                                  className="w-3 h-3 mr-0.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                                {product.stock}
                              </div>
                              <button
                                onClick={() =>
                                  handleCheckboxChange(product._id)
                                }
                                className={`text-xs font-medium ${
                                  selectedProductIds.includes(product._id)
                                    ? "text-blue-600 hover:text-blue-800"
                                    : "text-gray-500 hover:text-gray-700"
                                } transition-colors`}
                                aria-label={
                                  selectedProductIds.includes(product._id)
                                    ? "Deselect product"
                                    : "Select product"
                                }
                              >
                                {selectedProductIds.includes(product._id)
                                  ? "Selected"
                                  : "Select"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </Slider>
                </div>

                {/* Action buttons - more compact with smaller gap */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleRemoveProduct}
                    disabled={!selectedProductIds.length}
                    className={`flex-1 py-1.5 px-2 rounded-md font-medium text-sm flex items-center justify-center ${
                      selectedProductIds.length
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    } transition-colors duration-200`}
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      ></path>
                    </svg>
                    Remove
                  </button>
                  <button
                    onClick={handleTrade}
                    disabled={!selectedProductIds.length}
                    className={`flex-1 py-1.5 px-2 rounded-md font-medium text-sm flex items-center justify-center ${
                      selectedProductIds.length
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    } transition-colors duration-200`}
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                      ></path>
                    </svg>
                    Trade
                  </button>
                  <button
                    onClick={handleRemoveFromTrade}
                    disabled={!selectedProductIds.length}
                    className={`flex-1 py-1.5 px-2 rounded-md font-medium text-sm flex items-center justify-center ${
                      selectedProductIds.length
                        ? "bg-yellow-600 text-white hover:bg-yellow-700"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    } transition-colors duration-200`}
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                      ></path>
                    </svg>
                    Remove from Trade
                  </button>
                </div>
              </>
            ) : (
              // Empty state (unchanged)
              <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  ></path>
                </svg>
                <p className="mt-4 text-gray-500 text-lg font-medium">
                  No products available yet
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Add your first product using the form on the left
                </p>
              </div>
            )}
          </div>

          <div className="col-span-full bg-white p-6 rounded-lg shadow-md">
            <AvailableForTrade
              onOpenTradeModal={handleOpenTradeModal}
              reloadTrigger={tradeListReloadTrigger}
            />
          </div>
          {isTradeModalOpen && selectedProduct && currentUser && (
            <Modal
              isOpen={isTradeModalOpen}
              onClose={() => handleTradeCompletion(false)}
            >
              <TradeProduct
                id={selectedProduct._id}
                image={
                  Array.isArray(selectedProduct.images)
                    ? selectedProduct.images[0]
                    : selectedProduct.images
                }
                name={selectedProduct.name}
                price={selectedProduct.price}
                stock={selectedProduct.stock}
                seller={selectedProduct.seller}
                onTradeInitiated={handleTradeCompletion}
                authToken={authToken}
                currentUser={currentUser}
              />
            </Modal>
          )}
        </div>
      )}

      {selectedSection === "confirmation" && (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-7xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-700 mb-6 flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              ></path>
            </svg>
            Orders Pending Confirmation
          </h2>

          {orders.length > 0 ? (
            <div className="space-y-6">
              {orders
                .filter(
                  (order) =>
                    order.orderDetails?.status === "Pending Confirmation" ||
                    order.orderDetails?.status === "Order Placed"
                )
                .map((order) => (
                  <div
                    key={order._id}
                    className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                  >
                    <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-700">
                          Order ID:{" "}
                        </span>
                        <span className="text-gray-700">{order._id}</span>
                        <p className="text-sm text-gray-500 mt-1">
                          Placed on{" "}
                          {new Date(
                            order.orderDetails.date
                          ).toLocaleDateString()}{" "}
                          •
                          <span
                            className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium 
                        ${
                          order.orderDetails.status === "Pending Confirmation"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.orderDetails.status === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                          >
                            {order.orderDetails.status}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4">
                      <h4 className="font-medium text-gray-800 mb-2">
                        Customer Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p>
                            <span className="text-gray-500">Name:</span>{" "}
                            {order.customer.name}
                          </p>
                          <p>
                            <span className="text-gray-500">Email:</span>{" "}
                            {order.customer.email}
                          </p>
                          <p>
                            <span className="text-gray-500">Phone:</span>{" "}
                            {order.customer.phone}
                          </p>
                        </div>
                        <div>
                          <p>
                            <span className="text-gray-500">
                              Shipping Address:
                            </span>
                          </p>
                          <p className="text-gray-700">
                            {order.customer.shippingAddress}
                          </p>
                          <p>
                            <span className="text-gray-500">
                              Payment Method:
                            </span>{" "}
                            {order.orderDetails.paymentMethod}
                          </p>
                        </div>
                      </div>

                      <h4 className="font-medium text-gray-800 mb-2 border-t border-gray-200 pt-3">
                        Ordered Products
                      </h4>
                      <div className="space-y-3">
                        {order.orderDetails.items?.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center border border-gray-100 p-2 rounded"
                          >
                            <img
                              src={
                                item.image ||
                                "https://via.placeholder.com/300x300?text=No+Image"
                              }
                              alt={item.name || "Product"}
                              className="w-12 h-12 object-cover rounded"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://via.placeholder.com/300x300?text=No+Image";
                              }}
                            />
                            <div className="ml-3 flex-grow">
                              <p className="font-medium">
                                {item.name || "Unknown Product"}
                              </p>
                              <div className="flex justify-between text-sm text-gray-500">
                                <p>
                                  Price: ₱{item.price?.toFixed(2)} ×{" "}
                                  {item.quantity}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">
                                Qty: {item.quantity || 0}
                              </p>
                              <p className="font-medium text-green-600">
                                ₱{item.total?.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}

                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
                          <p className="text-gray-500">Total:</p>
                          <p className="text-lg font-semibold">
                            ₱{order.orderDetails.total?.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Order Action Buttons */}
                      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => {
                            const reason = window.prompt(
                              "Please provide a reason for rejecting this order:"
                            );
                            if (reason) {
                              handleOrderAction(order._id, "reject", reason);
                            }
                          }}
                          className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors"
                        >
                          Reject Order
                        </button>

                        <button
                          onClick={() =>
                            handleOrderAction(order._id, "confirm")
                          }
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Accept Order
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                ></path>
              </svg>
              <p className="mt-4 text-gray-500 text-lg font-medium">
                No pending orders found
              </p>
              <p className="mt-2 text-sm text-gray-400">
                When customers place orders for your products, they will appear
                here for confirmation.
              </p>
            </div>
          )}
        </div>
      )}
      {selectedSection === "completed-trades" && (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-7xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-700 mb-6 flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Completed Trades
          </h2>
          <CompletedTrades token={authToken} />
        </div>
      )}
      {selectedSection === "settings" && (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-7xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Settings</h2>
          <p className="text-gray-500 text-center">
            Settings section content goes here.
          </p>
        </div>
      )}
      {selectedSection === "trade-requests" && currentUser && (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-7xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-700 mb-6">
            Trade Requests
          </h2>
          <TradeRequests token={authToken} currentUser={currentUser} />
        </div>
      )}

      {selectedSection === "campaigns" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Create Campaign Form */}
          <div
            className="bg-white p-8 rounded-xl shadow-md border border-gray-100"
            id="create-campaign-form"
          >
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Create Video Campaign
                </h2>
                <p className="text-sm text-gray-500">
                  Showcase your farming activities to customers
                </p>
              </div>
            </div>

            <form onSubmit={handleCampaignSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Title
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter campaign title"
                  value={campaignFormData.title}
                  onChange={handleCampaignChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Describe your video campaign"
                  value={campaignFormData.description}
                  onChange={handleCampaignChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={campaignFormData.category}
                    onChange={handleCampaignChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all bg-white"
                    required
                  >
                    <option value="" disabled>
                      Select Category
                    </option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Livestock">Livestock</option>
                    <option value="Aquaculture">Aquaculture</option>
                    <option value="Agri-tech">Agri-tech</option>
                    <option value="Sustainable">Sustainable Farming</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={campaignFormData.endDate}
                    onChange={handleCampaignChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {/* Media Upload Section */}
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Media Assets
                </h3>

                {/* Video Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Video
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      id="video-upload"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div
                      className={`flex items-center p-3 border ${
                        campaignFormData.videoFile
                          ? "border-purple-300 bg-purple-50"
                          : "border-dashed border-gray-300 hover:border-purple-300"
                      } rounded-lg transition-colors duration-200`}
                    >
                      <div className="mr-3 flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-purple-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-grow">
                        {campaignFormData.videoFile ? (
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {campaignFormData.videoFile.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(
                                  campaignFormData.videoFile.size /
                                  (1024 * 1024)
                                ).toFixed(2)}{" "}
                                MB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setCampaignFormData({
                                  ...campaignFormData,
                                  videoFile: null,
                                })
                              }
                              className="p-1 rounded-full bg-red-100 text-red-500 hover:bg-red-200"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Click to upload video
                            </p>
                            <p className="text-xs text-gray-500">
                              MP4, WebM or MOV (max. 100MB)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500 ml-1">
                    You can also add more videos after creating the campaign
                  </p>
                </div>

                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video Thumbnail
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative group">
                      <input
                        type="file"
                        id="thumbnail-upload"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div
                        className={`flex items-center p-3 border ${
                          selectedThumbnail
                            ? "border-purple-300 bg-purple-50"
                            : "border-dashed border-gray-300 hover:border-purple-300"
                        } rounded-lg transition-colors duration-200 h-full`}
                      >
                        <div className="mr-3 flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-purple-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-grow">
                          {selectedThumbnail ? (
                            <div>
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {selectedThumbnail.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(
                                  selectedThumbnail.size /
                                  (1024 * 1024)
                                ).toFixed(2)}{" "}
                                MB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Click to upload thumbnail
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG, WEBP (16:9 ratio)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {thumbnailPreview && (
                      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedThumbnail(null);
                            setThumbnailPreview(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full 
                          hover:bg-red-600 transition-colors shadow-sm"
                          title="Remove thumbnail"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg 
                          hover:from-purple-600 hover:to-purple-700 focus:ring-4 focus:ring-purple-300 shadow-sm 
                          transition-all duration-200 flex items-center justify-center mt-6"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Video Campaign
              </button>
            </form>
          </div>

          {/* Campaign listing section */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <svg
                className="w-6 h-6 mr-2 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                ></path>
              </svg>
              Your Video Campaigns
            </h2>

            {campaigns.length > 0 ? (
              <div className="space-y-6">
                {campaigns.map((campaign) => {
                  // Ensure campaign is valid and has an id
                  if (!campaign || !campaign._id) return null;

                  return (
                    <div
                      key={campaign._id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-lg">
                              {campaign?.title || "Untitled Campaign"}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              {campaign?.description ||
                                "No description available"}
                            </p>

                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                                {campaign?.category || "Uncategorized"}
                              </span>
                              <span className="text-gray-400">
                                Ends:{" "}
                                {campaign?.endDate
                                  ? new Date(
                                      campaign.endDate
                                    ).toLocaleDateString()
                                  : "No date set"}
                              </span>
                            </div>
                          </div>

                          {campaign?.thumbnail && (
                            <div className="ml-4 flex-shrink-0">
                              <img
                                src={campaign.thumbnail}
                                alt={campaign?.title || "Campaign thumbnail"}
                                className="h-20 w-32 object-cover rounded-md border border-gray-200"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src =
                                    "https://via.placeholder.com/320x180?text=Thumbnail+Not+Available";
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Use the CampaignVideoManager component with defensive coding */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <CampaignVideoManager
                            campaignId={campaign._id}
                            videos={
                              Array.isArray(campaign?.videos)
                                ? campaign.videos
                                : []
                            }
                            onUpdateVideos={(updatedVideos) => {
                              // Update videos in your local state with defensive check
                              setCampaigns((prevCampaigns) =>
                                prevCampaigns.map((c) =>
                                  c._id === campaign._id
                                    ? { ...c, videos: updatedVideos || [] }
                                    : c
                                )
                              );
                            }}
                            authToken={authToken}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <p className="mt-4 text-gray-500 text-lg font-medium">
                  No campaigns available yet
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Create your first video campaign using the form on the left
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      <RemoveProductModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={confirmRemove}
      />
    </div>
  );
};

RemoveProductModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default SellerDashboard;
