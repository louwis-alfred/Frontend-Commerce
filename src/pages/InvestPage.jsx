import { useState, useEffect, useContext } from "react";
import { useInvestor } from "../context/InvestorContext";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";

const InvestPage = () => {
  const { selectInvestment } = useInvestor();
  const { backendUrl } = useContext(ShopContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredCampaign, setFeaturedCampaign] = useState(null);
  const [sortMethod, setSortMethod] = useState("fundingGoal");
  // Add this to your state declarations at the top
  const [isInitializing, setIsInitializing] = useState(true);
  // Helper functions for default values and formatting
  const getDefaultImage = () =>
    "https://placehold.co/640x360?text=Agricultural+Investment";

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setIsInitializing(true);

        // Get auth token for authenticated requests
        const token = localStorage.getItem("token");
        const config = token
          ? {
              headers: { Authorization: `Bearer ${token}` },
            }
          : {};

        // Fetch all campaigns with auth token if available
        const response = await axios.get(
          `${backendUrl}/api/campaign/all`,
          config
        );

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to fetch campaigns");
        }

        // Process and normalize campaign data
        const processedCampaigns = await Promise.all(
          (response.data.campaigns || []).map(async (campaign) => {
            // Basic campaign data processing
            const processedCampaign = {
              ...campaign,
              videoUrl: campaign.videoUrl || campaign.videos?.[0]?.url || null,
              thumbnail:
                campaign.thumbnail ||
                `https://source.unsplash.com/random/1080x1920/?agriculture,${campaign.category}`,
              currentFunding: Number(campaign.currentFunding || 0),
              fundingGoal: Number(campaign.fundingGoal || 0),
              expectedReturn: Number(campaign.expectedReturn || 0),
              duration: Number(campaign.duration || 12),
              raisedAmount: Number(campaign.raisedAmount || 0),
              targetAmount: Number(campaign.targetAmount || 0),
              // Default farmer and location values
              farmerName:
                campaign.farmerName || campaign.sellerName || "Unknown Farmer",
            };

            // If campaign has a sellerId, fetch seller details
            if (campaign.sellerId && token) {
              try {
                const sellerResponse = await axios.get(
                  `${backendUrl}/api/campaign/seller/${campaign.sellerId}`,
                  config
                );

                if (sellerResponse.data.success && sellerResponse.data.seller) {
                  // Enhance campaign with seller details
                  const seller = sellerResponse.data.seller;
                  return {
                    ...processedCampaign,
                    sellerDetails: seller,
                    farmerName: seller.name || processedCampaign.farmerName,
                    location: seller.location || processedCampaign.location,
                    city: seller.city || campaign.city,
                    province: seller.province || campaign.province,
                    businessName:
                      seller.businessName || campaign.sellerBusinessName,
                  };
                }
              } catch (error) {
                console.error(
                  `Error fetching seller for campaign ${campaign._id}:`,
                  error
                );
              }
            }

            return processedCampaign;
          })
        );

        setCampaigns(processedCampaigns);

        // Find featured campaign
        if (processedCampaigns.length > 0) {
          const featured =
            processedCampaigns.find((c) => c.featured) ||
            processedCampaigns.sort(
              (a, b) => (b.fundingGoal || 0) - (a.fundingGoal || 0)
            )[0];
          setFeaturedCampaign(featured);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching campaign data:", error);
        toast.error(
          error.response?.data?.message ||
            "Failed to load investment opportunities"
        );
        setLoading(false);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchCampaigns();
  }, [backendUrl]);

  const handleSelect = (campaign) => {
    selectInvestment(campaign);
    navigate("/selected-invest");
  };

  // Enhanced filtering logic
  const filteredCampaigns = campaigns
    .filter((campaign) => {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = (campaign.title || "")
        .toLowerCase()
        .includes(searchLower);
      const descMatch = (campaign.description || "")
        .toLowerCase()
        .includes(searchLower);
      const farmerMatch = (campaign.farmerName || "")
        .toLowerCase()
        .includes(searchLower);
      const locationMatch = (campaign.location || "")
        .toLowerCase()
        .includes(searchLower);

      const categoryMatch =
        !selectedCategory || campaign.category === selectedCategory;

      return (
        (titleMatch || descMatch || farmerMatch || locationMatch) &&
        categoryMatch
      );
    })
    .sort((a, b) => {
      switch (sortMethod) {
        case "fundingGoal":
          return (b.fundingGoal || 0) - (a.fundingGoal || 0);
        case "progress": {
          const progressA =
            ((a.currentFunding || 0) / (a.fundingGoal || 1)) * 100;
          const progressB =
            ((b.currentFunding || 0) / (b.fundingGoal || 1)) * 100;
          return progressB - progressA;
        }
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "daysLeft":
          return (a.daysLeft || 0) - (b.daysLeft || 0);
        default:
          return 0;
      }
    });

  // Filter out null/undefined categories and remove duplicates
  const uniqueCategories = [
    ...new Set(campaigns.map((campaign) => campaign.category).filter(Boolean)),
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-2 text-center text-green-800">
        Agricultural Investment Opportunities
      </h1>
      <p className="text-center text-gray-600 mb-8">
        Support local farmers and earn returns on sustainable agriculture
        projects
      </p>

      {/* Search, Filter and Sort Controls */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                placeholder="Search by title, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 p-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {featuredCampaign && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-green-800 inline-flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Featured Opportunity
          </h2>
          <div
            className="bg-white rounded-lg shadow-xl overflow-hidden cursor-pointer relative transform transition hover:shadow-2xl hover:-translate-y-1"
            onClick={() => handleSelect(featuredCampaign)}
          >
            <div className="absolute top-4 right-4 bg-yellow-500 text-white text-sm px-3 py-1 rounded-full font-medium z-10 shadow-md">
              Featured
            </div>
            <div className="md:flex">
              <div className="md:w-2/3 h-72 relative">
                {featuredCampaign.videoUrl ? (
                  <video
                    src={featuredCampaign.videoUrl}
                    poster={featuredCampaign.thumbnail || getDefaultImage()}
                    className="w-full h-full object-cover"
                    controls
                    onError={(e) => {
                      console.error("Video loading error:", e);
                      e.target.onerror = null;
                      e.target.src = getDefaultImage();
                      e.target.style.display = "none";
                      const img = document.createElement("img");
                      img.src = featuredCampaign.thumbnail || getDefaultImage();
                      img.className = "w-full h-full object-cover";
                      img.alt = featuredCampaign.title;
                      e.target.parentNode.appendChild(img);
                    }}
                  />
                ) : (
                  <img
                    src={featuredCampaign.thumbnail || getDefaultImage()}
                    alt={featuredCampaign.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getDefaultImage();
                    }}
                  />
                )}
              </div>

              <div className="p-6 md:w-1/3 bg-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      {featuredCampaign.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {featuredCampaign.daysLeft} days left
                    </span>
                  </div>

                  <h3 className="font-bold text-xl mb-4 text-green-900">
                    {featuredCampaign.title}
                  </h3>

                  {/* Enhanced Farmer and Location Details */}
                  <div className="border border-gray-200 rounded-lg p-3 mb-4 bg-gray-50">
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Farmer
                      </h4>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {featuredCampaign.farmerName ||
                              featuredCampaign.sellerName ||
                              "Unknown Farmer"}
                          </p>
                          {featuredCampaign.sellerBusinessName && (
                            <p className="text-xs text-gray-600">
                              {featuredCampaign.sellerBusinessName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(featuredCampaign);
                  }}
                >
                  View Investment Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Grid */}
      <h2 className="text-2xl font-bold mb-6 text-green-800">
        All Investment Opportunities
      </h2>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-600">
            Loading investment opportunities...
          </p>
        </div>
      ) : filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign._id}
              className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              onClick={() => handleSelect(campaign)}
            >
              <div className="relative h-48">
                {campaign.videoUrl ? (
                  <div className="relative h-full">
                    <img
                      src={campaign.thumbnail || getDefaultImage()}
                      alt={campaign.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Only replace the source if it's not already the default image
                        if (e.target.src !== getDefaultImage()) {
                          console.log(
                            `Image failed to load for campaign ${campaign.title}, using default image`
                          );
                          e.target.src = getDefaultImage();
                        }
                        // Remove the error handler to prevent infinite loops
                        e.target.onError = null;
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white bg-opacity-80 rounded-full p-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          className="w-8 h-8 text-green-600"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={campaign.thumbnail || getDefaultImage()}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Only replace the source if it's not already the default image
                      if (e.target.src !== getDefaultImage()) {
                        console.log(
                          `Image failed to load for campaign ${campaign.title}, using default image`
                        );
                        e.target.src = getDefaultImage();
                      }
                      // Remove the error handler to prevent infinite loops
                      e.target.onError = null;
                    }}
                  />
                )}
                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                  {campaign.daysLeft} days left
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-50 hover:opacity-30 transition-opacity"></div>
              </div>
              {/* Inside your filteredCampaigns.map() function, update the campaign card */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {campaign.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {campaign.daysLeft} days left
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                  {campaign.title}
                </h3>

                {/* Enhanced Farmer/Location display */}
                <div className="flex flex-col space-y-1 mb-2">
                  <div className="flex items-center">
                    <svg
                      className="w-3.5 h-3.5 text-gray-500 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <p className="text-gray-600 text-sm line-clamp-1">
                      {campaign.farmerName || "Unknown Farmer"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
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
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 15h.01M12 12h.01M9 7h6m0 0v9a3 3 0 01-6 0V7m6 0H9"
            ></path>
          </svg>
          <p className="mt-4 text-lg font-medium text-gray-600">
            No investment opportunities found
          </p>
          <p className="mt-2 text-gray-500">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("");
              setSortMethod("fundingGoal");
            }}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default InvestPage;
