import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const TradeHistory = () => {
  const { backendUrl, token, user } = useContext(ShopContext);
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/trades`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTrades(response.data.trades || []);
      } catch (error) {
        console.error("Error fetching trade history", error);
        toast.error("Error fetching trade history");
      }
    };

    fetchTrades();
  }, [backendUrl, token]);

  // Determine the other seller based on the logged-in user id stored in user._id
  const getOtherSeller = (trade) => {
    if (trade.sellerFrom._id === user._id) {
      return trade.sellerTo;
    }
    return trade.sellerFrom;
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Trade History</h2>
      {trades.length === 0 ? (
        <p>No trades found.</p>
      ) : (
        <div className="space-y-4">
          {trades.map((trade) => {
            const otherSeller = getOtherSeller(trade);
            return (
              <div key={trade._id} className="border p-4 rounded-md shadow">
                <h3 className="text-xl font-semibold mb-2">
                  Trade ID: {trade._id}
                </h3>
                <p>
                  <strong>Product:</strong> {trade.product.name} (<em>{trade.quantity}</em>)
                </p>
                <p>
                  <strong>Status:</strong> {trade.status}
                </p>
                <div className="mt-2 border-t pt-2">
                  <h4 className="font-semibold">Other Seller Information</h4>
                  <p>
                    <strong>Name:</strong> {otherSeller.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {otherSeller.email}
                  </p>
                  <p>
                    <strong>Location:</strong> {otherSeller.location}
                  </p>
                  {otherSeller.supportingDocument && (
                    <p>
                      <strong>Supporting Document:</strong>{" "}
                      <a href={otherSeller.supportingDocument} target="_blank" rel="noopener noreferrer">
                        View Document
                      </a>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TradeHistory;