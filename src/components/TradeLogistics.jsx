import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import { format } from "date-fns";

const TradeLogistics = ({ token }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [trades, setTrades] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [shippingForm, setShippingForm] = useState({});
  const { backendUrl } = useContext(ShopContext);
  const [confirmationStatus, setConfirmationStatus] = useState({});
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (token) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setUserId(user._id);
    }
  }, [token]);

  // Add a polling mechanism for shipped trades to ensure confirmation status is up-to-date
  useEffect(() => {
    // Only set up polling if there are trades in shipped status
    const shippedTrades = trades.filter(
      (trade) => trade.shipping?.status === "shipped"
    );

    if (shippedTrades.length > 0) {
      const intervalId = setInterval(() => {
        shippedTrades.forEach((trade) => {
          // Check if both confirmations aren't already marked as true
          const currentConfirmations = confirmationStatus[trade._id] || {};
          const needsUpdate =
            !currentConfirmations[userId] ||
            !currentConfirmations[trade.withUser?._id];

          if (needsUpdate) {
            axios
              .get(`${backendUrl}/api/trades/${trade._id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((response) => {
                if (response.data.success) {
                  const tradeData = response.data.trade;

                  // Update confirmation status based on retrieved data
                  if (
                    tradeData.fromDeliveryConfirmed ||
                    tradeData.toDeliveryConfirmed
                  ) {
                    setConfirmationStatus((prev) => ({
                      ...prev,
                      [trade._id]: {
                        ...(prev[trade._id] || {}),
                        [tradeData.sellerFrom]:
                          tradeData.fromDeliveryConfirmed || false,
                        [tradeData.sellerTo]:
                          tradeData.toDeliveryConfirmed || false,
                      },
                    }));
                  }
                }
              })
              .catch((error) => {
                console.error(
                  "Error fetching trade confirmation status:",
                  error
                );
              });
          }
        });
      }, 15000); // Poll every 15 seconds

      return () => clearInterval(intervalId);
    }
  }, [trades, backendUrl, token, userId, confirmationStatus]);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/trades/logistics`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setTrades(response.data.trades);

          // Initialize confirmation status
          const initialConfirmation = {};
          response.data.trades.forEach((trade) => {
            initialConfirmation[trade._id] = {
              [trade.withUser._id]: trade.shipping?.sellerConfirmation || false,
            };
          });
          setConfirmationStatus(initialConfirmation);
        }
      } catch (error) {
        console.error("Error fetching trades for logistics:", error);
        toast.error("Failed to load trade logistics information");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchTrades();
    }
  }, [token, backendUrl]);

  const handleInputChange = (tradeId, field, value) => {
    setShippingForm((prev) => ({
      ...prev,
      [tradeId]: {
        ...(prev[tradeId] || {}),
        [field]: value,
      },
    }));
  };

  const updateShippingStatus = async (tradeId, status) => {
    try {
      const formData = shippingForm[tradeId] || {};

      // Validation for shipped status
      if (
        status === "shipped" &&
        (!formData.trackingNumber || !formData.courier)
      ) {
        return toast.error("Tracking number and courier are required");
      }

      const response = await axios.post(
        `${backendUrl}/api/trades/shipping/update`,
        {
          tradeId,
          status,
          ...(formData.trackingNumber && {
            trackingNumber: formData.trackingNumber,
          }),
          ...(formData.courier && { courier: formData.courier }),
          ...(formData.notes && { notes: formData.notes }),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Update local state
        setTrades(
          trades.map((trade) => {
            if (trade._id === tradeId) {
              return {
                ...trade,
                shipping: {
                  ...trade.shipping,
                  status,
                  ...formData,
                  updatedAt: new Date(),
                },
              };
            }
            return trade;
          })
        );

        toast.success(`Trade ${status} successfully`);
      }
    } catch (error) {
      console.error("Error updating shipping status:", error);
      toast.error("Failed to update shipping status");
    }
  };

  const confirmDelivery = async (tradeId) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/trades/confirm-delivery`,
        { tradeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setConfirmationStatus((prev) => ({
          ...prev,
          [tradeId]: {
            ...(prev[tradeId] || {}),
            [userId]: true,
          },
        }));

        toast.success("Delivery confirmed successfully");
      }
    } catch (error) {
      console.error("Error confirming delivery:", error);
      toast.error("Failed to confirm delivery");
    }
  };

  const filteredTrades = trades.filter((trade) => {
    if (activeTab === "pending")
      return !trade.shipping || !trade.shipping.status;
    if (activeTab === "preparing")
      return trade.shipping?.status === "preparing";
    if (activeTab === "shipped") return trade.shipping?.status === "shipped";
    if (activeTab === "delivered")
      return trade.shipping?.status === "delivered";
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 -mb-px font-medium text-sm whitespace-nowrap ${
              activeTab === "pending"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending Shipment
          </button>
          <button
            onClick={() => setActiveTab("preparing")}
            className={`px-4 py-2 -mb-px font-medium text-sm whitespace-nowrap ${
              activeTab === "preparing"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Preparing
          </button>
          <button
            onClick={() => setActiveTab("shipped")}
            className={`px-4 py-2 -mb-px font-medium text-sm whitespace-nowrap ${
              activeTab === "shipped"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Shipped
          </button>
          <button
            onClick={() => setActiveTab("delivered")}
            className={`px-4 py-2 -mb-px font-medium text-sm whitespace-nowrap ${
              activeTab === "delivered"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Delivered
          </button>
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No trades found in this category
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTrades.map((trade) => (
            <div
              key={trade._id}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Trade #{trade._id.slice(-6)}
                  </span>
                  <h3 className="font-medium text-gray-800 mt-1 flex items-center">
                    Trade with: {trade.withUser?.name || "Unknown User"}
                    <span className="text-xs text-gray-500 ml-1">
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500">
                    Completed on: {format(new Date(trade.completedAt), "PPP")}
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    !trade.shipping?.status
                      ? "bg-gray-100 text-gray-600"
                      : trade.shipping?.status === "preparing"
                      ? "bg-yellow-100 text-yellow-800"
                      : trade.shipping?.status === "shipped"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {!trade.shipping?.status
                    ? "Not Shipped"
                    : trade.shipping.status.charAt(0).toUpperCase() +
                      trade.shipping.status.slice(1)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Product Sent:
                  </h4>
                  <div className="flex items-start">
                    <img
                      src={
                        trade.given?.product?.images?.[0] ||
                        "https://via.placeholder.com/50"
                      }
                      alt={trade.given?.product?.name}
                      className="w-12 h-12 object-cover rounded mr-3"
                    />
                    <div>
                      <p className="font-medium">
                        {trade.given?.product?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Quantity: {trade.given?.quantity}{" "}
                        {trade.given?.product?.unitOfMeasurement || "units"}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Product Received:
                  </h4>
                  <div className="flex items-start">
                    <img
                      src={
                        trade.received?.product?.images?.[0] ||
                        "https://via.placeholder.com/50"
                      }
                      alt={trade.received?.product?.name}
                      className="w-12 h-12 object-cover rounded mr-3"
                    />
                    <div>
                      <p className="font-medium">
                        {trade.received?.product?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Quantity: {trade.received?.quantity}{" "}
                        {trade.received?.product?.unitOfMeasurement || "units"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Confirmation */}
              {trade.shipping?.status === "shipped" && (
                <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-800">
                    Delivery Confirmation
                  </h4>
                  <div className="mt-2 flex items-center">
                    <div className="flex items-center mr-6">
                      <span className="mr-2">You:</span>
                      {confirmationStatus[trade._id]?.[userId] ? (
                        <span className="text-green-600 flex items-center">
                          <svg
                            className="w-5 h-5 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                          Confirmed
                        </span>
                      ) : (
                        <button
                          onClick={() => confirmDelivery(trade._id)}
                          className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
                        >
                          Confirm Receipt
                        </button>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">
                        {trade.withUser?.name || "Other seller"}:
                      </span>
                      {confirmationStatus[trade._id]?.[trade.withUser._id] ? (
                        <span className="text-green-600 flex items-center">
                          <svg
                            className="w-5 h-5 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            ></path>
                          </svg>
                          Confirmed
                        </span>
                      ) : (
                        <span className="text-yellow-600">Waiting</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Both parties must confirm receipt before the trade is
                    finalized.
                  </p>
                </div>
              )}

              {/* Shipping Information Form */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <h4 className="font-medium mb-3">Shipping Information</h4>

                {trade.shipping?.status === "shipped" ||
                trade.shipping?.status === "delivered" ? (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-500 text-sm">
                          Tracking Number:
                        </span>
                        <p className="font-medium">
                          {trade.shipping.trackingNumber}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Courier:</span>
                        <p className="font-medium">{trade.shipping.courier}</p>
                      </div>
                      {trade.shipping.notes && (
                        <div className="col-span-2">
                          <span className="text-gray-500 text-sm">Notes:</span>
                          <p>{trade.shipping.notes}</p>
                        </div>
                      )}
                    </div>

                    {trade.shipping?.status === "shipped" && (
                      <div className="mt-3">
                        <button
                          onClick={() =>
                            updateShippingStatus(trade._id, "delivered")
                          }
                          className="bg-green-600 text-white py-1.5 px-4 rounded text-sm hover:bg-green-700"
                        >
                          Mark as Delivered
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Tracking Number"
                        className="p-2 border border-gray-300 rounded-md w-full"
                        onChange={(e) =>
                          handleInputChange(
                            trade._id,
                            "trackingNumber",
                            e.target.value
                          )
                        }
                        value={shippingForm[trade._id]?.trackingNumber || ""}
                      />
                      <input
                        type="text"
                        placeholder="Courier (JRS, JNT, etc.)"
                        className="p-2 border border-gray-300 rounded-md w-full"
                        onChange={(e) =>
                          handleInputChange(
                            trade._id,
                            "courier",
                            e.target.value
                          )
                        }
                        value={shippingForm[trade._id]?.courier || ""}
                      />
                    </div>
                    <textarea
                      placeholder="Shipping Notes (optional)"
                      className="p-2 border border-gray-300 rounded-md w-full"
                      rows="2"
                      onChange={(e) =>
                        handleInputChange(trade._id, "notes", e.target.value)
                      }
                      value={shippingForm[trade._id]?.notes || ""}
                    ></textarea>

                    <div className="flex gap-2">
                      {!trade.shipping?.status && (
                        <button
                          onClick={() =>
                            updateShippingStatus(trade._id, "preparing")
                          }
                          className="bg-yellow-500 text-white py-1.5 px-4 rounded text-sm hover:bg-yellow-600"
                        >
                          Mark as Preparing
                        </button>
                      )}
                      <button
                        onClick={() =>
                          updateShippingStatus(trade._id, "shipped")
                        }
                        className="bg-blue-600 text-white py-1.5 px-4 rounded text-sm hover:bg-blue-700"
                        disabled={
                          !shippingForm[trade._id]?.trackingNumber ||
                          !shippingForm[trade._id]?.courier
                        }
                      >
                        Ship Item
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

TradeLogistics.propTypes = {
  token: PropTypes.string.isRequired,
};

export default TradeLogistics;
