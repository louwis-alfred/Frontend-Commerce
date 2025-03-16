import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { formatDistanceToNow } from "date-fns";

const CompletedInvestmentsList = ({ campaignId, maxItems = 3 }) => {
  const [completedInvestments, setCompletedInvestments] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { backendUrl } = useContext(ShopContext);

  useEffect(() => {
    const fetchCompletedInvestments = async () => {
      if (!campaignId) return;

      try {
        setLoading(true);

        // Get token from localStorage
        const token = localStorage.getItem("token");

        // Use the correct endpoint path and include authorization header
        const response = await axios.get(
          `${backendUrl}/api/investment/completed/${campaignId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setCompletedInvestments(response.data.completedInvestments);
          setTotalAmount(response.data.totalAmount);
        }
      } catch (error) {
        console.error("Error fetching completed investments:", error);
        // Set empty data on error
        setCompletedInvestments([]);
        setTotalAmount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedInvestments();
  }, [campaignId, backendUrl]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (completedInvestments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No completed investments yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="font-medium">Completed Investments:</span>
        <span className="text-green-600 font-medium">
          ₱{totalAmount?.toLocaleString()}
        </span>
      </div>

      {completedInvestments.slice(0, maxItems).map((investment) => (
        <div
          key={investment._id}
          className="bg-green-50 p-2 rounded-lg border border-green-100"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-sm">
                {investment.userId?.name || "Anonymous"}
              </p>
              <p className="text-xs text-gray-600">
                {formatDistanceToNow(new Date(investment.completedAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className="text-green-700 font-medium">
              ₱{investment.amount?.toLocaleString()}
            </div>
          </div>
        </div>
      ))}

      {completedInvestments.length > maxItems && (
        <div className="text-center text-xs text-blue-600">
          +{completedInvestments.length - maxItems} more completed investments
        </div>
      )}
    </div>
  );
};

CompletedInvestmentsList.propTypes = {
  campaignId: PropTypes.string.isRequired,
  maxItems: PropTypes.number,
};

export default CompletedInvestmentsList;
