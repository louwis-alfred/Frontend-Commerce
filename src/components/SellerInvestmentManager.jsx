import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";

const InvestmentStatus = ({ status }) => {
  let statusColor = "bg-yellow-100 text-yellow-800";

  if (status === "approved") statusColor = "bg-blue-100 text-blue-800";
  if (status === "accepted") statusColor = "bg-purple-100 text-purple-800";
  if (status === "completed") statusColor = "bg-green-100 text-green-800";
  if (status === "cancelled") statusColor = "bg-red-100 text-red-800";

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${statusColor}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

InvestmentStatus.propTypes = {
  status: PropTypes.string.isRequired,
};

const SellerInvestmentManager = ({ campaignId }) => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const { backendUrl } = useContext(ShopContext);

  const fetchInvestments = async () => {
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
        setInvestments(response.data.investments);
      }
    } catch (error) {
      console.error("Error fetching investments:", error);
      toast.error("Failed to load investments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (campaignId) {
      fetchInvestments();
    }
  }, [campaignId, backendUrl]);

  const handleAcceptInvestment = async (investmentId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${backendUrl}/api/investments/accept`,
        { investmentId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Investment accepted successfully");
        fetchInvestments();
      }
    } catch (error) {
      console.error("Error accepting investment:", error);
      toast.error(
        error.response?.data?.message || "Failed to accept investment"
      );
    }
  };

  const openCompletionModal = (investment) => {
    setSelectedInvestment(investment);
    setShowCompletionModal(true);
  };

  const handleCompleteInvestment = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${backendUrl}/api/investments/complete`,
        {
          investmentId: selectedInvestment._id,
          notes: completionNotes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Investment completed successfully");
        setShowCompletionModal(false);
        setCompletionNotes("");
        fetchInvestments();
      }
    } catch (error) {
      console.error("Error completing investment:", error);
      toast.error(
        error.response?.data?.message || "Failed to complete investment"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No investments found for this campaign</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Investment Requests</h3>

      {investments.map((investment) => (
        <div
          key={investment._id}
          className="border rounded-lg p-4 bg-white shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">
                {investment.userId?.name || "Anonymous Investor"}
              </p>
              <p className="text-sm text-gray-600">
                ₱{investment.amount?.toLocaleString()} •{" "}
                {investment.paymentMethod}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(new Date(investment.date), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <InvestmentStatus status={investment.status} />
          </div>

          {/* Action buttons based on status */}
          <div className="mt-4 flex space-x-2 justify-end">
            {investment.status === "approved" && (
              <button
                onClick={() => handleAcceptInvestment(investment._id)}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
              >
                Accept Investment
              </button>
            )}

            {investment.status === "accepted" && (
              <button
                onClick={() => openCompletionModal(investment)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Complete Negotiation
              </button>
            )}

            {investment.status === "completed" && (
              <span className="px-3 py-1 text-sm text-green-600">
                Completed{" "}
                {formatDistanceToNow(
                  new Date(investment.completedAt || investment.updatedAt),
                  { addSuffix: true }
                )}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Completion Modal */}
      {showCompletionModal && selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
            <h3 className="text-lg font-medium mb-4">
              Complete Investment Negotiation
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Investment Amount:</p>
              <p className="font-medium">
                ₱{selectedInvestment.amount?.toLocaleString()}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Investor:</p>
              <p className="font-medium">
                {selectedInvestment.userId?.name || "Anonymous Investor"}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                Completion Notes:
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full border rounded p-2 text-sm"
                placeholder="Add any notes about this completion"
                rows={3}
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteInvestment}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Complete Investment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

SellerInvestmentManager.propTypes = {
  campaignId: PropTypes.string.isRequired,
};

export default SellerInvestmentManager;
