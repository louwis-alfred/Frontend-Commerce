import { useState, useEffect, useContext, useRef, useCallback } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const InvestorListModal = ({
  campaignId,
  isOpen = false,
  onClose,
  campaign = {},
}) => {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAmount: 0, count: 0 });
  const [filterStatus, setFilterStatus] = useState("all");
  const { backendUrl } = useContext(ShopContext);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  const fetchInvestors = useCallback(async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${backendUrl}/api/investments/campaign/${campaignId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setInvestors(response.data.investments);
        setStats({
          totalAmount: response.data.totalAmount,
          count: response.data.count,
          approvedAmount: response.data.investments
            .filter(
              (inv) =>
                inv.status === "approved" ||
                inv.status === "accepted" ||
                inv.status === "completed"
            )
            .reduce((sum, inv) => sum + inv.amount, 0),
          pendingAmount: response.data.investments
            .filter((inv) => inv.status === "pending")
            .reduce((sum, inv) => sum + inv.amount, 0),
        });
      } else {
        toast.error("Failed to load investors");
      }
    } catch (error) {
      console.error("Error fetching investors:", error);
      toast.error("Could not load investor data");
    } finally {
      setLoading(false);
    }
  }, [campaignId, backendUrl]);

  useEffect(() => {
    if (isOpen && campaignId) {
      fetchInvestors();
    }
  }, [isOpen, fetchInvestors, campaignId]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      // Focus the close button when modal opens
      closeButtonRef.current?.focus();
      // Prevent body scrolling
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Filter investments by status
  const filteredInvestors = investors.filter(
    (investment) => filterStatus === "all" || investment.status === filterStatus
  );

  // Payment method display formatter
  const formatPaymentMethod = (method) => {
    switch (method) {
      case "mobile_payment":
        return "Mobile Payment";
      case "bank_transfer":
        return "Bank Transfer";
      default:
        return method
          .replace("_", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 id="modal-title" className="text-xl font-bold">
            Campaign Investors
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
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

        <div className="p-4 bg-gray-50 border-b">
          <div className="flex justify-between mb-3">
            <div>
              <span className="text-gray-500">Total Investors:</span>
              <span className="ml-2 font-medium">{stats.count}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Invested:</span>
              <span className="ml-2 font-medium text-green-600">
                ₱{stats.totalAmount?.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 mb-3">
            <div className="bg-green-50 p-2 rounded border border-green-100">
              <div className="text-xs text-gray-600">Approved Investments</div>
              <div className="font-medium text-green-700">
                ₱{stats.approvedAmount?.toLocaleString() || 0}
              </div>
            </div>
            <div className="bg-yellow-50 p-2 rounded border border-yellow-100">
              <div className="text-xs text-gray-600">Pending Investments</div>
              <div className="font-medium text-yellow-700">
                ₱{stats.pendingAmount?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          {/* Add filter controls */}
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-600 mr-2">Filter:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-2 py-1 text-xs rounded-full ${
                  filterStatus === "all"
                    ? "bg-gray-800 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("approved")}
                className={`px-2 py-1 text-xs rounded-full ${
                  filterStatus === "approved"
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-800 hover:bg-green-200"
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`px-2 py-1 text-xs rounded-full ${
                  filterStatus === "pending"
                    ? "bg-yellow-500 text-white"
                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-4 flex-grow">
          {loading ? (
            <div
              className="flex justify-center items-center h-32"
              role="status"
              aria-live="polite"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500"></div>
              <span className="sr-only">Loading investors...</span>
            </div>
          ) : filteredInvestors.length > 0 ? (
            <div className="space-y-4">
              {filteredInvestors.map((investment) => (
                <div
                  key={investment._id}
                  className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {investment.userId?.profilePic ? (
                        <img
                          src={investment.userId.profilePic}
                          alt={investment.userId?.name || "Investor"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-800 font-bold">
                          {(investment.userId?.name || "A")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-grow">
                      <div className="font-medium">
                        {investment.userId?.name || "Anonymous Investor"}
                        {investment.userId?.investorApplication
                          ?.investmentType && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {
                              investment.userId.investorApplication
                                .investmentType
                            }
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {investment.userId?.email || "No email provided"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        ₱{investment.amount?.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(investment.date)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          investment.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : investment.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : investment.status === "completed"
                            ? "bg-blue-100 text-blue-800"
                            : investment.status === "accepted"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {investment.status.charAt(0).toUpperCase() +
                          investment.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        via {formatPaymentMethod(investment.paymentMethod)}
                      </span>
                    </div>

                    {/* Return details */}
                    {investment.status !== "cancelled" && (
                      <div className="text-xs text-green-600">
                        Expected Return: ₱
                        {(
                          investment.expectedReturn ||
                          (investment.amount *
                            (campaign?.expectedReturn || 15)) /
                            100
                        ).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {investment.paymentConfirmedAt && (
                    <div className="mt-2 text-xs text-gray-500">
                      Payment confirmed:{" "}
                      {formatDate(investment.paymentConfirmedAt)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" aria-live="polite">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-2 text-gray-500">
                {filterStatus === "all"
                  ? "No investors yet for this campaign"
                  : `No ${filterStatus} investments found`}
              </p>
              {filterStatus !== "all" && (
                <button
                  onClick={() => setFilterStatus("all")}
                  className="mt-2 text-sm text-blue-600 hover:underline"
                >
                  View all investments
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-4 border-t">
          <h4 className="font-medium text-gray-700 mb-2">
            Investment Statistics
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500">Average Investment</p>
              <p className="text-lg font-bold text-green-700">
                ₱
                {stats.totalAmount && stats.count
                  ? Math.round(stats.totalAmount / stats.count).toLocaleString()
                  : 0}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Funding</p>
              <p className="text-lg font-bold text-blue-700">
                ₱{stats.totalAmount?.toLocaleString() || 0}
              </p>
            </div>
          </div>

          <div className="mt-3 p-3 bg-purple-50 rounded-lg">
            <div className="flex justify-between">
              <p className="text-sm text-gray-500">Campaign Progress</p>
              <p className="text-sm font-medium">
                {campaign?.fundingGoal
                  ? Math.min(
                      100,
                      Math.round(
                        (stats.totalAmount / campaign.fundingGoal) * 100
                      )
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="mt-1 h-2 w-full bg-gray-200 rounded-full">
              <div
                className="h-2 bg-purple-600 rounded-full"
                style={{
                  width: `${
                    campaign?.fundingGoal
                      ? Math.min(
                          100,
                          (stats.totalAmount / campaign.fundingGoal) * 100
                        )
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Time remaining */}
          {campaign?.deadline && (
            <div className="mt-3 p-3 bg-orange-50 rounded-lg">
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Time Remaining</p>
                <p className="text-sm font-medium text-orange-700">
                  {getRemainingTime(campaign.deadline)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate time remaining
function getRemainingTime(deadline) {
  const now = new Date();
  const endDate = new Date(deadline);
  const diffTime = endDate - now;

  if (diffTime <= 0) return "Campaign ended";

  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 30) {
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} left`;
  }

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} left`;
  }

  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  return `${diffHours} hour${diffHours > 1 ? "s" : ""} left`;
}

// PropTypes validation
InvestorListModal.propTypes = {
  campaignId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  campaign: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    fundingGoal: PropTypes.number,
    expectedReturn: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    deadline: PropTypes.string,
  }),
};

export default InvestorListModal;
