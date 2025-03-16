import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { formatDistanceToNow } from "date-fns";

const RecentInvestorsDisplay = ({ campaignId }) => {
  const [recentInvestors, setRecentInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { backendUrl } = useContext(ShopContext);

  useEffect(() => {
    const fetchRecentInvestors = async () => {
      if (!campaignId) return;

      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${backendUrl}/api/investments/campaign/${campaignId}/recent`,
          token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        );

        if (response.data.success) {
          setRecentInvestors(response.data.investments.slice(0, 3));
        }
      } catch (error) {
        console.error("Error fetching recent investors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentInvestors();
  }, [campaignId, backendUrl]);

  if (loading) {
    return (
      <div className="animate-pulse flex space-x-2 items-center">
        <div className="h-6 w-6 rounded-full bg-gray-300"></div>
        <div className="flex-1 h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (!recentInvestors.length) {
    return (
      <div className="text-white text-xs opacity-80">
        Be the first to invest in this project!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentInvestors.map((investment) => (
        <div key={investment._id} className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
            {investment.userId?.name?.charAt(0) || "?"}
          </div>
          <div className="text-white text-xs">
            <span className="font-semibold">{investment.userId?.name || "Anonymous"}</span>
            {" invested "}
            <span className="font-semibold">₱{investment.amount.toLocaleString()}</span>
            {" "}
            <span className="opacity-80">
              {formatDistanceToNow(new Date(investment.date), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

RecentInvestorsDisplay.propTypes = {
  campaignId: PropTypes.string.isRequired,
};

export default RecentInvestorsDisplay;