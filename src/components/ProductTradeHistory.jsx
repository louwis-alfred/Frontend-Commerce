import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import axios from "axios";
import { toast } from "react-toastify";

const ProductTradeHistory = ({ productId, token, backendUrl }) => {
  const [tradeHistory, setTradeHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTradeHistory = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/products/${productId}/trade-history`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setTradeHistory(response.data.tradeHistory);
        }
      } catch (error) {
        console.error("Error fetching trade history:", error);
        toast.error("Failed to load trade history");
      } finally {
        setIsLoading(false);
      }
    };

    if (token && productId) {
      fetchTradeHistory();
    }
  }, [token, productId, backendUrl]);

  if (isLoading) {
    return <div className="animate-pulse">Loading trade history...</div>;
  }

  if (tradeHistory.length === 0) {
    return <div className="text-gray-500 text-sm">No trade history available for this product.</div>;
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium mb-2">Trade History</h3>
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade ID</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tradeHistory.map((entry, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {entry.tradedFrom?.name || "Unknown"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {entry.tradedTo?.name || "Unknown"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {entry.quantity}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-blue-600 hover:underline">
                  <a href={`/trades/${entry.tradeId}`} target="_blank" rel="noreferrer">
                    {entry.tradeId.toString().slice(-6)}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

ProductTradeHistory.propTypes = {
  productId: PropTypes.string.isRequired,
  token: PropTypes.string.isRequired,
  backendUrl: PropTypes.string.isRequired
};

export default ProductTradeHistory;