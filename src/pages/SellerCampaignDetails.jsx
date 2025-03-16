import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import SellerInvestmentManager from "../components/SellerInvestmentManager";

const SellerCampaignDetails = () => {
  const { campaignId } = useParams();
  const { backendUrl } = useContext(ShopContext);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${backendUrl}/api/campaign/${campaignId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          setCampaign(response.data.campaign);
        } else {
          toast.error("Failed to load campaign");
        }
      } catch (error) {
        console.error("Error fetching campaign:", error);
        toast.error("Error loading campaign details");
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchCampaignDetails();
    }
  }, [campaignId, backendUrl]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700">
          Campaign not found
        </h2>
        <p className="mt-2 text-gray-500">
          The campaign you're looking for might have been removed or is not
          accessible.
        </p>
        <Link
          to="/seller/dashboard"
          className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const calculateProgress = () => {
    const target = campaign.targetAmount || campaign.fundingGoal || 10000;
    const current = campaign.currentAmount || 0;
    const percent = Math.min(Math.round((current / target) * 100), 100);
    return percent;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/seller/dashboard"
          className="text-green-600 hover:underline flex items-center"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Campaign Overview */}
        <div className="md:w-1/3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-48">
              {campaign.thumbnail ? (
                <img
                  src={campaign.thumbnail}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
              ) : campaign.videoUrl ? (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <video
                    src={campaign.videoUrl}
                    className="max-h-full max-w-full"
                    poster={campaign.thumbnail}
                    controls
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
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
              )}
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold">{campaign.title}</h2>
              <p className="text-gray-600 mt-1">{campaign.category}</p>

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{calculateProgress()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Target Amount</p>
                    <p className="font-bold">
                      ₱
                      {(
                        campaign.targetAmount ||
                        campaign.fundingGoal ||
                        0
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Raised</p>
                    <p className="font-bold">
                      ₱{(campaign.currentAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          campaign.status === "active"
                            ? "bg-green-100 text-green-800"
                            : campaign.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {campaign.status.charAt(0).toUpperCase() +
                          campaign.status.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Actions */}
          <div className="bg-white rounded-lg shadow-md mt-4 p-4">
            <h3 className="font-medium mb-3">Campaign Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Edit Campaign
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                Add Media
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                View Public Page
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Details and Management */}
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="border-b mb-4">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-3 py-2 font-medium text-sm ${
                    activeTab === "details"
                      ? "border-b-2 border-green-600 text-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab("investments")}
                  className={`px-3 py-2 font-medium text-sm ${
                    activeTab === "investments"
                      ? "border-b-2 border-green-600 text-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Investments
                </button>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`px-3 py-2 font-medium text-sm ${
                    activeTab === "analytics"
                      ? "border-b-2 border-green-600 text-green-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Analytics
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-2">
              {activeTab === "details" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">
                      Campaign Description
                    </h3>
                    <p className="text-gray-600 mt-2">{campaign.description}</p>
                  </div>

                  {campaign.location && (
                    <div>
                      <h3 className="font-medium text-lg">Location</h3>
                      <p className="text-gray-600 mt-2">{campaign.location}</p>
                    </div>
                  )}

                  {campaign.expectedReturn && (
                    <div>
                      <h3 className="font-medium text-lg">Expected Returns</h3>
                      <p className="text-gray-600 mt-2">
                        {campaign.expectedReturn}%
                      </p>
                    </div>
                  )}

                  {campaign.duration && (
                    <div>
                      <h3 className="font-medium text-lg">Duration</h3>
                      <p className="text-gray-600 mt-2">
                        {campaign.duration} months
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "investments" && (
                <div>
                  <SellerInvestmentManager campaignId={campaignId} />
                </div>
              )}

              {activeTab === "analytics" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">Performance Summary</h3>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500">Views</p>
                        <p className="text-xl font-bold">
                          {campaign.viewCount || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500">Total Investors</p>
                        <p className="text-xl font-bold">
                          {campaign.investorsCount || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500">
                          Completed Investments
                        </p>
                        <p className="text-xl font-bold">
                          {campaign.completedInvestmentsCount || 0}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500">
                          Completed Amount
                        </p>
                        <p className="text-xl font-bold">
                          ₱
                          {(
                            campaign.completedInvestmentsAmount || 0
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerCampaignDetails;
