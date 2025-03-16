import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import Modal from "./Modal";
import PropTypes from "prop-types";

const TradeRequests = ({ token, currentUser }) => {
  const getProductImage = (product) => {
    if (!product?.images?.[0]) {
      return "https://via.placeholder.com/150?text=No+Image";
    }
    return product.images[0];
  };
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("received");
  const [showRejected, setShowRejected] = useState(false);
  const [showAccepted, setShowAccepted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    tradeId: null,
    action: null,
    trade: null,
  });
  const { backendUrl } = useContext(ShopContext);
  useEffect(() => {
    if (!token || !currentUser?._id) {
      console.error("No token or user provided to TradeRequests component");
      toast.error("Authentication required");
      return;
    }
    fetchTrades();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, currentUser]);

  const handleTradeAction = async (tradeId, action) => {
    setActionLoading(true);
    try {
      let endpoint;
      switch (action) {
        case "accept":
          endpoint = `${backendUrl}/api/trades/accept`;
          break;
        case "reject":
          endpoint = `${backendUrl}/api/trades/reject`;
          break;
        case "cancel":
          endpoint = `${backendUrl}/api/trades/cancel`;
          break;
        case "complete":
          endpoint = `${backendUrl}/api/trades/complete`;
          break;
        case "askAgain":
          toast.info("Trade request feature will be implemented soon");
          setActionLoading(false);
          closeConfirmationModal();
          return;
        default:
          return;
      }

      const response = await axios.post(
        endpoint,
        { tradeId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success(`Trade ${action}ed successfully`);
        fetchTrades();
      } else {
        toast.error(`Failed to ${action} trade`);
      }
    } catch (error) {
      console.error(`Error ${action}ing trade:`, error);
      toast.error(error.response?.data?.message || `Failed to ${action} trade`);
    } finally {
      setActionLoading(false);
      closeConfirmationModal();
    }
  };

  const openConfirmationModal = (tradeId, action, trade = null) => {
    setConfirmationModal({
      isOpen: true,
      tradeId,
      action,
      trade,
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({
      isOpen: false,
      tradeId: null,
      action: null,
      trade: null,
    });
  };

  const openDetailModal = (trade) => {
    setSelectedTrade(trade);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setTimeout(() => setSelectedTrade(null), 100);
  };

  const fetchTrades = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/trades`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        console.log("Fetched trades:", response.data.trades);
        setTrades(response.data.trades);
      } else {
        console.error("Failed to fetch trades:", response.data.message);
        toast.error("Failed to fetch trades");
      }
    } catch (error) {
      console.error("Error fetching trades:", error);
      toast.error("Failed to fetch trades");
    } finally {
      setLoading(false);
    }
  };

  // Reset all view filters when changing tabs
  const changeTab = (tab) => {
    setActiveTab(tab);
    setShowRejected(false);
    setShowAccepted(false);
    setShowHistory(false);
  };

  // More specific filter for trades based on all view states
  const filteredTrades = trades.filter((trade) => {
    if (!currentUser?._id) {
      console.error("No user found");
      return false;
    }

    // History view shows all completed and cancelled trades
    if (showHistory) {
      return trade.status === "completed" || trade.status === "cancelled";
    }

    // Rejected trades view
    if (showRejected) {
      return trade.status === "rejected";
    }

    // Accepted trades view
    if (showAccepted) {
      return trade.status === "accepted";
    }

    // Default tab view (pending trades only)
    if (activeTab === "received") {
      return (
        trade.sellerTo._id === currentUser._id && trade.status === "pending"
      );
    } else if (activeTab === "sent") {
      return (
        trade.sellerFrom._id === currentUser._id && trade.status === "pending"
      );
    }
    return false;
  });

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "text-yellow-600";
      case "accepted":
        return "text-green-600";
      case "rejected":
      case "cancelled":
        return "text-red-600";
      case "completed":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Count trades by different categories for badges
  const pendingReceivedTrades = trades.filter(
    (trade) =>
      trade.sellerTo._id === currentUser._id && trade.status === "pending"
  );

  const pendingSentTrades = trades.filter(
    (trade) =>
      trade.sellerFrom._id === currentUser._id && trade.status === "pending"
  );

  const acceptedTrades = trades.filter((trade) => trade.status === "accepted");
  const rejectedTrades = trades.filter((trade) => trade.status === "rejected");
  const historyTrades = trades.filter(
    (trade) => trade.status === "completed" || trade.status === "cancelled"
  );

  return (
    <div className="space-y-4 p-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Trade Requests</h2>

        {/* Primary Tabs */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => changeTab("received")}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-200 ${
              activeTab === "received" &&
              !showRejected &&
              !showAccepted &&
              !showHistory
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Pending Received ({pendingReceivedTrades.length})
          </button>
          <button
            onClick={() => changeTab("sent")}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-200 ${
              activeTab === "sent" &&
              !showRejected &&
              !showAccepted &&
              !showHistory
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Pending Sent ({pendingSentTrades.length})
          </button>
          <button
            onClick={() => {
              setShowAccepted(true);
              setShowRejected(false);
              setShowHistory(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-200 ${
              showAccepted
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Accepted ({acceptedTrades.length})
          </button>
          <button
            onClick={() => {
              setShowRejected(true);
              setShowAccepted(false);
              setShowHistory(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-200 ${
              showRejected
                ? "bg-red-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Rejected ({rejectedTrades.length})
          </button>
          <button
            onClick={() => {
              setShowHistory(true);
              setShowRejected(false);
              setShowAccepted(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors duration-200 ${
              showHistory
                ? "bg-gray-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            History ({historyTrades.length})
          </button>
        </div>
      </div>

      {/* Trade List */}
      {filteredTrades.length > 0 ? (
        <div className="grid gap-4">
          {filteredTrades.map((trade) => (
            <div
              key={trade._id}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* From Product */}
                <div className="border-r pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600">From:</span>
                    <span className="font-medium text-sm">
                      {trade.sellerTo ? trade.sellerTo.name : "Unknown Seller"}
                      {trade.sellerTo?._id === currentUser._id && " (You)"}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <div
                      className="w-24 h-24 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openDetailModal(trade)}
                    >
                      <img
                        src={getProductImage(trade.productFrom)}
                        alt={trade.productFrom?.name || "Product"}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-1">
                        {trade.productFrom?.name || "Unknown Product"}
                      </p>
                      <p className="text-blue-600 font-semibold text-sm">
                        ₱
                        {trade.productFrom
                          ? trade.productFrom.price.toFixed(2)
                          : "0.00"}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Category:{" "}
                        {trade.productFrom
                          ? trade.productFrom.category
                          : "Unknown Category"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* To Product */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600">To:</span>
                    <span className="font-medium text-sm">
                      {trade.sellerTo.name}
                      {trade.sellerTo._id === currentUser._id && " (You)"}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <div
                      className="w-24 h-24 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openDetailModal(trade)}
                    >
                      <img
                        src={getProductImage(trade.productTo)}
                        alt={trade.productTo?.name || "Product"}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm mb-1">
                        {trade.productTo?.name || "Unknown Product"}
                      </p>
                      <p className="text-blue-600 font-semibold text-sm">
                        ₱
                        {trade.productTo
                          ? trade.productTo.price.toFixed(2)
                          : "0.00"}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Category:{" "}
                        {trade.productTo
                          ? trade.productTo.category
                          : "Unknown Category"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade Details and Actions */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-600">
                      Quantity: {trade.quantity}
                    </span>
                    <span
                      className={`font-medium ${getStatusColor(trade.status)}`}
                    >
                      Status: {trade.status}
                    </span>
                    <span className="text-gray-600">
                      Created: {new Date(trade.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => openDetailModal(trade)}
                      className="text-blue-500 hover:text-blue-700 hover:underline"
                    >
                      View Details
                    </button>
                  </div>

                  {/* Action buttons for PENDING trades */}
                  {trade.status === "pending" &&
                    !showRejected &&
                    !showAccepted &&
                    !showHistory && (
                      <div className="flex gap-2">
                        {activeTab === "received" ? (
                          <>
                            <button
                              onClick={() =>
                                openConfirmationModal(trade._id, "accept")
                              }
                              disabled={actionLoading}
                              className="bg-green-600 text-white px-4 py-1.5 text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                openConfirmationModal(trade._id, "reject")
                              }
                              disabled={actionLoading}
                              className="bg-red-600 text-white px-4 py-1.5 text-sm rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              openConfirmationModal(trade._id, "cancel")
                            }
                            disabled={actionLoading}
                            className="bg-gray-600 text-white px-4 py-1.5 text-sm rounded-lg hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}

                  {/* Action buttons for ACCEPTED trades */}
                  {trade.status === "accepted" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          openConfirmationModal(trade._id, "complete", trade)
                        }
                        disabled={actionLoading}
                        className="bg-blue-600 text-white px-4 py-1.5 text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                      >
                        Complete Trade
                      </button>
                    </div>
                  )}

                  {/* Action buttons for REJECTED trades */}
                  {trade.status === "rejected" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          openConfirmationModal(trade._id, "askAgain", trade)
                        }
                        disabled={actionLoading}
                        className="bg-yellow-600 text-white px-4 py-1.5 text-sm rounded-lg hover:bg-yellow-700 transition-colors duration-200 disabled:opacity-50"
                      >
                        Ask Again
                      </button>
                    </div>
                  )}

                  {/* Status message for completed or cancelled trades */}
                  {showHistory &&
                    (trade.status === "completed" ||
                      trade.status === "cancelled") && (
                      <span className="text-sm italic text-gray-500">
                        {trade.status === "completed"
                          ? `Completed on ${new Date(
                              trade.completedAt
                            ).toLocaleDateString()}`
                          : "Trade was cancelled"}
                      </span>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500 text-sm">
            {showHistory
              ? "No trade history available."
              : showAccepted
              ? "No accepted trades available."
              : showRejected
              ? "No rejected trade requests available."
              : `No ${activeTab} trade requests available.`}
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={confirmationModal.isOpen} onClose={closeConfirmationModal}>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-3">
            {confirmationModal.action === "askAgain"
              ? "Send New Trade Request"
              : `Confirm ${
                  confirmationModal.action?.charAt(0).toUpperCase() +
                  confirmationModal.action?.slice(1)
                }`}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {confirmationModal.action === "askAgain"
              ? "Would you like to send a new trade request for this product?"
              : `Are you sure you want to ${confirmationModal.action} this trade?`}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={closeConfirmationModal}
              className="px-3 py-1.5 bg-gray-200 text-sm text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              onClick={() =>
                handleTradeAction(
                  confirmationModal.tradeId,
                  confirmationModal.action
                )
              }
              disabled={actionLoading}
              className={`px-3 py-1.5 text-sm text-white rounded-lg transition-colors duration-200 ${
                confirmationModal.action === "accept"
                  ? "bg-green-600 hover:bg-green-700"
                  : confirmationModal.action === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : confirmationModal.action === "askAgain"
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-gray-600 hover:bg-gray-700"
              } disabled:opacity-50`}
            >
              {actionLoading ? "Processing..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Product Detail Modal */}
      {/* Product Detail Modal */}
      {showDetailModal && (
        <Modal isOpen={selectedTrade !== null} onClose={closeDetailModal}>
          <div className="p-4 max-h-[80vh] overflow-y-auto">
            {selectedTrade ? (
              <>
                <h3 className="text-xl font-semibold mb-4 text-center">
                  Trade Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* From Product Details */}
                  <div className="border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-6">
                    <h4 className="font-semibold mb-2 border-b pb-1">
                      From:{" "}
                      {selectedTrade.sellerFrom
                        ? selectedTrade.sellerFrom.name
                        : "Unknown Seller"}
                      {selectedTrade.sellerFrom?._id === currentUser._id &&
                        " (You)"}
                    </h4>
                    <div className="flex flex-col items-center mb-3">
                      <div className="w-40 h-40 mb-3">
                        <img
                          src={getProductImage(selectedTrade.productFrom)}
                          alt={selectedTrade.productFrom?.name || "Product"}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <h5 className="font-medium text-lg">
                        {selectedTrade.productFrom.name}
                      </h5>
                      <p className="text-blue-600 font-semibold">
                        ₱{selectedTrade.productFrom.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm">
                        <span className="font-medium">Category:</span>{" "}
                        {selectedTrade.productFrom.category}
                      </p>
                      <p className="text-sm mt-1">
                        <span className="font-medium">Description:</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1 border-l-2 border-gray-300 pl-2">
                        {selectedTrade.productFrom.description ||
                          "No description provided"}
                      </p>
                    </div>

                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 border-b pb-1 mb-2">
                        Seller Contact Details:
                      </h4>
                      <p className="text-sm">
                        <span className="font-medium">Email:</span>{" "}
                        {selectedTrade.sellerFrom.email || "No email provided"}
                      </p>
                      {selectedTrade.sellerFrom.phone && (
                        <p className="text-sm mt-1">
                          <span className="font-medium">Phone:</span>{" "}
                          {selectedTrade.sellerFrom.phone}
                        </p>
                      )}
                      {selectedTrade.sellerFrom.location && (
                        <p className="text-sm mt-1">
                          <span className="font-medium">Location:</span>{" "}
                          {selectedTrade.sellerFrom.location}
                        </p>
                      )}

                      {/* Show verification documents if available */}
                      {selectedTrade.sellerFrom.supportingDocument && (
                        <div className="mt-2">
                          <p
                            className="font-medium text-xs text-blue-700 flex items-center cursor-pointer"
                            onClick={() =>
                              window.open(
                                selectedTrade.sellerFrom.supportingDocument,
                                "_blank"
                              )
                            }
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
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            View Verification Document
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* To Product Details */}
                  <div className="pt-4 md:pt-0 md:pl-6">
                    <h4 className="font-semibold mb-2 border-b pb-1">
                      To:{" "}
                      {selectedTrade.sellerTo
                        ? selectedTrade.sellerTo.name
                        : "Unknown Seller"}
                      {selectedTrade.sellerTo?._id === currentUser._id &&
                        " (You)"}
                    </h4>
                    <div className="flex flex-col items-center mb-3">
                      <div className="w-40 h-40 mb-3">
                        <img
                          src={getProductImage(selectedTrade.productTo)}
                          alt={selectedTrade.productTo?.name || "Product"}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <h5 className="font-medium text-lg">
                        {selectedTrade.productTo.name}
                      </h5>
                      <p className="text-blue-600 font-semibold">
                        ₱{selectedTrade.productTo.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm">
                        <span className="font-medium">Category:</span>{" "}
                        {selectedTrade.productTo.category}
                      </p>
                      <p className="text-sm mt-1">
                        <span className="font-medium">Description:</span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1 border-l-2 border-gray-300 pl-2">
                        {selectedTrade.productTo.description ||
                          "No description provided"}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm">
                        <span className="font-medium">Contact:</span>{" "}
                        {selectedTrade.sellerTo.email || "No email provided"}
                      </p>
                      {selectedTrade.sellerTo.location && (
                        <p className="text-sm mt-1">
                          <span className="font-medium">Location:</span>{" "}
                          {selectedTrade.sellerTo.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trade Details Section */}
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-semibold mb-2">Trade Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <span className="font-medium">Trade ID:</span>{" "}
                        {selectedTrade._id}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span>
                        <span className={getStatusColor(selectedTrade.status)}>
                          {" "}
                          {selectedTrade.status}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">Quantity:</span>{" "}
                        {selectedTrade.quantity}
                      </p>
                    </div>
                    <div>
                      <p>
                        <span className="font-medium">Created:</span>{" "}
                        {new Date(selectedTrade.createdAt).toLocaleString()}
                      </p>
                      {selectedTrade.acceptedAt && (
                        <p>
                          <span className="font-medium">Accepted:</span>{" "}
                          {new Date(selectedTrade.acceptedAt).toLocaleString()}
                        </p>
                      )}
                      {selectedTrade.completedAt && (
                        <p>
                          <span className="font-medium">Completed:</span>{" "}
                          {new Date(selectedTrade.completedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons for the Modal */}
                <div className="mt-6 flex justify-end gap-2">
                  {/* Show action buttons based on trade status in modal view as well */}
                  {selectedTrade.status === "pending" &&
                    selectedTrade.sellerTo._id === currentUser._id && (
                      <>
                        <button
                          onClick={() => {
                            closeDetailModal();
                            openConfirmationModal(selectedTrade._id, "accept");
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            closeDetailModal();
                            openConfirmationModal(selectedTrade._id, "reject");
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}

                  {selectedTrade.status === "pending" &&
                    selectedTrade.sellerFrom._id === currentUser._id && (
                      <button
                        onClick={() => {
                          closeDetailModal();
                          openConfirmationModal(selectedTrade._id, "cancel");
                        }}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    )}

                  {selectedTrade.status === "accepted" && (
                    <button
                      onClick={() => {
                        closeDetailModal();
                        openConfirmationModal(
                          selectedTrade._id,
                          "complete",
                          selectedTrade
                        );
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Complete
                    </button>
                  )}

                  <button
                    onClick={closeDetailModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center">Loading trade details...</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

TradeRequests.propTypes = {
  token: PropTypes.string.isRequired,
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};

export default TradeRequests;
