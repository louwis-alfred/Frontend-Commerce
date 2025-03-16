import { useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext.js";
import Title from "../components/Title";
import { useNavigate } from "react-router-dom";

import { NotificationContext } from "../context/NotificationContext.jsx";

const parseCourierStatus = (statusData) => {
  // Extract courier name from status string if available
  let courierName = "Not Assigned";
  const status = statusData.status || "";
  
  // Match "Courier <Name>" pattern in status
  const courierNameMatch = status.match(/Courier (.+)$/);
  if (courierNameMatch) {
    courierName = courierNameMatch[1]; // Extract name from status
  } else if (statusData.courierId) {
    courierName = `Courier #${statusData.courierId}`; // Fallback to ID
  }

  return {
    status: status || "Processing",
    courierName: courierName,
    source: statusData.source || "default",
    paymentMethod: statusData.paymentMethod,
    payment: statusData.payment === true,
    isCourierData: true,
  };
};

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const navigate = useNavigate();
  const { fetchNotifications } = useContext(NotificationContext);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const loadOrderData = useCallback(
    async (showLoadingState = true) => {
      try {

        if (showLoadingState) setLoading(true);
        setIsRefreshing(true);

        // Properly format the authorization header
        const authToken = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;

        try {
          // Debug log to check if token is properly formatted (remove in production)
          console.log(
            "Loading orders with auth token:",
            authToken.substring(0, 20) + "..."
          );

          const response = await axios.get(
            `${backendUrl}/api/order/userorders`,
            {
              headers: {
                Authorization: authToken,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data.success && Array.isArray(response.data.orders)) {
            // Process the orders and fetch courier status for each
            const orders = await Promise.all(
              response.data.orders.map(async (order) => {
                try {
                  // Get courier status for this order using same auth token format
                  console.log(`Fetching courier status for order ${order._id}`);

                  const courierRes = await axios.get(
                    `${backendUrl}/api/courier-status/${order._id}`,
                    {
                      headers: {
                        Authorization: authToken,
                        "Content-Type": "application/json",
                      },
                    }
                  );

                  // Create shipping address from backend format
                  const shippingAddress = order.shipping?.address || {
                    name: "Not provided",
                    phone: "Not provided",
                    address: "Not provided",
                    city: "Not provided",
                    state: "Not provided",
                    postalCode: "Not provided",
                    country: "Not provided",
                  };

                  // Create formatted user-friendly address
                  if (order.shipping?.address) {
                    shippingAddress.name = `${order.address?.firstName || ""} ${
                      order.address?.lastName || ""
                    }`.trim();
                    shippingAddress.phone = order.address?.phone;
                    shippingAddress.address = order.shipping.address.street;
                    shippingAddress.city = order.shipping.address.city;
                    shippingAddress.state = order.shipping.address.state;
                    shippingAddress.postalCode = order.shipping.address.zipcode;
                    shippingAddress.country = order.shipping.address.country;
                  }

                  // Format the order data with courier info - CHANGED THIS PART
                  return {
                    ...order,
                    status: order.status || "Pending Confirmation",
                    courierInfo: courierRes.data.success
                      ? parseCourierStatus(courierRes.data)
                      : {
                          courierName: "Not Assigned",
                          status: "Processing",
                          source: "default",
                        },
                    shippingAddress,
                    items: order.orderDetails?.items || [],
                  };
                } catch (courierErr) {
                  // Enhance courier error handling
                  if (courierErr.response?.status === 401) {
                    console.error(
                      `Authentication error fetching courier status for order ${order._id}:`,
                      courierErr.response?.data
                    );
                    // Don't show notification for each order with auth error, handle at parent level
                  } else {
                    console.warn(
                      `Error fetching courier status for order ${order._id}:`,
                      courierErr
                    );
                  }

                  // Return order with default courier info - CHANGED THIS PART
                  return {
                    ...order,
                    // Keep original order status
                    status: order.status || "Pending Confirmation",
                    courierInfo: {
                      courierName: "Not Assigned",
                      status: "Processing", // Don't overwrite with order status
                      source: "default",
                    },
                    shippingAddress: order.shipping?.address || {
                      name: "Not provided",
                      phone: "Not provided",
                      address: "Not provided",
                      city: "Not provided",
                      state: "Not provided",
                      postalCode: "Not provided",
                      country: "Not provided",
                    },
                    items: order.orderDetails?.items || [],
                  };
                }
              })
            );

            setOrderData(orders);
            setLastRefreshed(new Date());
          } else {
            // Handle case where API returned success: false or no orders
            console.warn("API returned unexpected response:", response.data);

            setOrderData([]);
          }
        } catch (apiError) {
          // Enhanced error handling for auth issues
          if (apiError.response?.status === 401) {
            console.error(
              "Authentication error when fetching orders:",
              apiError.response?.data
            );


            // Redirect to login when authentication fails
            navigate("/login");
            return;
          } else if (apiError.response?.status === 403) {
            console.error("Permission denied when accessing orders");
            return;
          }
          throw apiError; // Re-throw if it's not a handled auth error
        }
      } catch (error) {
        console.error(
          "Error fetching orders:",
          error.message,
          error.response?.data
        );
        const errorMessage =
          console.log(errorMessage)
        setOrderData([]); // Set empty array on error
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [backendUrl, token, navigate]
  );

  const updateOrderStatus = useCallback(
    async (orderId) => {
      try {
        // First check if we have a valid token
        if (!token) {
          console.error("Authentication token is missing");
          return false;
        }

        setUpdatingOrderId(orderId);

        try {
          // Properly format the authorization header
          const authToken = token.startsWith("Bearer ")
            ? token
            : `Bearer ${token}`;

          // Debug log - can be removed in production
          console.log("Fetching courier status with auth token");

          const statusRes = await axios.get(
            `${backendUrl}/api/courier-status/${orderId}`,
            {
              headers: {
                Authorization: authToken,
                "Content-Type": "application/json",
              },
            }
          );

          // Check response success
          if (statusRes.data.success) {
            const courierInfo = parseCourierStatus(statusRes.data);

            // FIXED: Don't overwrite order confirmation status with courier status
            setOrderData((prevOrders) =>
              prevOrders.map((order) => {
                if (order._id === orderId) {
                  return {
                    ...order,
                    // Keep the original order confirmation status
                    courierInfo, // Only update courier info
                  };
                }
                return order;
              })
            );
            await fetchNotifications();
            return true;
          } else {
            // Handle case where API returned success: false
            console.warn("API returned non-success response:", statusRes.data);
            return false;
          }
        } catch (authError) {
          // Enhanced error handling for auth issues
          if (authError.response?.status === 401) {
            console.error(
              "Authentication error when fetching courier status:",
              authError.response?.data
            );


            // You might want to redirect to login
            // navigate('/login');
            return false;
          } else if (authError.response?.status === 403) {
            console.error("Permission denied when accessing courier status");
            return false;
          }
          throw authError; // Re-throw if it's not a handled auth error
        }
      } catch (error) {
        // General error handling with more details
        console.error(
          "Error updating order status:",
          error.message,
          error.response?.data
        );

        const errorMessage =
          error.response?.data?.message || "Failed to update order status";
        console.log("error", errorMessage);
        return false;
      } finally {
        setUpdatingOrderId(null);
      }
    },
    [backendUrl, token, fetchNotifications, navigate]
  );

  // Function to get status color
  // Improve the getStatusColor function to handle confirmation/rejection statuses
  const getStatusColor = (status) => {
    if (!status) return "bg-yellow-500";

    const statusLower = status.toLowerCase();

    if (
      statusLower.includes("delivered") ||
      statusLower.includes("completed")
    ) {
      return "bg-green-500";
    } else if (statusLower.includes("confirmed")) {
      return "bg-green-400"; // Light green for confirmed orders
    } else if (
      statusLower.includes("shipped") ||
      statusLower.includes("out for delivery") ||
      statusLower.includes("assigned") ||
      statusLower.includes("pick up") ||
      statusLower.includes("courier")
    ) {
      return "bg-blue-500";
    } else if (
      statusLower.includes("cancelled") ||
      statusLower.includes("rejected")
    ) {
      return "bg-red-500";
    } else if (statusLower.includes("pending confirmation")) {
      return "bg-orange-400"; // Orange for pending confirmation
    }

    return "bg-yellow-500"; // Default for other statuses like "Processing"
  };

  // Manual refresh handler
  const handleManualRefresh = async () => {
    if (!isRefreshing) {
      await loadOrderData(false);
    }
  };

  useEffect(() => {
    loadOrderData();

    // Set up periodic status checks (every 45 seconds)
    const intervalId = setInterval(() => {
      if (!updatingOrderId && !isRefreshing) {
        loadOrderData(false); // Don't show loading state on auto-refresh
      }
    }, 45000);

    return () => clearInterval(intervalId);
  }, [token, loadOrderData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div className="text-2xl">
          <Title text1={"MY"} text2={"ORDERS"} />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md 
              ${
                isRefreshing
                  ? "bg-gray-100 text-gray-400"
                  : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
              }`}
          >
            {isRefreshing ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Refreshing...
              </span>
            ) : (
              <span className="flex items-center">
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </span>
            )}
          </button>
          {lastRefreshed && (
            <span className="text-sm text-gray-500">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {loading && orderData.length === 0 ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : orderData.length > 0 ? (
        <div className="space-y-6">
          {orderData.map((order, index) => (
            <div
              key={order._id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100"
            >
              {/* Order header - always visible */}
              <div
                className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white cursor-pointer"
                onClick={() => toggleOrderDetails(order._id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-indigo-100 text-indigo-800 p-3 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Order #{order.orderNumber || index + 1}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center mt-3 md:mt-0">
                  <div className="mr-6">
                    <div className="flex flex-col">
                      {/* Order Confirmation Status */}
                      <div className="flex items-center mb-1">
                        <span
                          className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusColor(
                            order.status || "Pending Confirmation"
                          )}`}
                        ></span>
                        <span className="font-medium">
                          {order.status || "Pending Confirmation"}
                        </span>
                      </div>

                      {/* Courier/Delivery Status - only show if different from order status */}
                      {order.courierInfo?.status &&
                        order.courierInfo.status !== order.status && (
                          <div className="flex items-center text-xs text-gray-500">
                            <span
                              className={`inline-block w-2 h-2 rounded-full mr-1 ${getStatusColor(
                                order.courierInfo.status
                              )}`}
                            ></span>
                            <span>Delivery: {order.courierInfo.status}</span>
                          </div>
                        )}

                      {/* Always show courier name if available */}
                      <p className="text-xs text-gray-500 mt-1">
                        {order.courierInfo?.courierName || "Courier pending"}
                      </p>
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transform transition-transform duration-200 ${
                      expandedOrder === order._id ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Order details - expandable section */}
              {expandedOrder === order._id && (
                <div className="border-t border-gray-100">
                  {/* Shipping Status Card */}
                  <div className="p-5 border-b border-gray-100">
                    <h4 className="text-md font-semibold mb-4 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-indigo-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2.038A2.968 2.968 0 0115 12.337V16a1 1 0 001 1h.05a2.5 2.5 0 014.9 0H20a1 1 0 001-1v-5a4 4 0 00-1-2.646V6a1 1 0 00-1-1h-2.038A2.968 2.968 0 0115 3.663V4a1 1 0 00-1 1H9a1 1 0 00-1 1v3H4a1 1 0 00-1 1v3z" />
                      </svg>
                      Delivery Information
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs uppercase text-gray-500 font-medium">
                          Payment Method
                        </p>
                        <p className="mt-1 font-medium">
                          {order.orderDetails?.paymentMethod ||
                            order.paymentMethod ||
                            "N/A"}
                        </p>
                        {order.courierInfo?.payment !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            Status:{" "}
                            {order.courierInfo.payment ? "Paid" : "Pending"}
                          </p>
                        )}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs uppercase text-gray-500 font-medium">
                          Status
                        </p>
                        <div className="flex items-center mt-1">
                          <span
                            className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusColor(
                              order.courierInfo?.status || order.status
                            )}`}
                          ></span>
                          <span className="font-medium">
                            {order.courierInfo?.status ||
                              order.status ||
                              "Processing"}
                          </span>
                        </div>
                      </div>

                      {/* Simplified Status Display */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs uppercase text-gray-500 font-medium">
                          Courier Status
                        </p>
                        <div className="flex flex-col">
                          <div className="flex items-center mt-1">
                            <span
                              className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusColor(
                                order.courierInfo?.status || order.status
                              )}`}
                            ></span>
                            <span className="font-medium text-lg">
                              {order.courierInfo?.status ||
                                order.status ||
                                "Processing"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Courier:{" "}
                            {order.courierInfo?.courierName || "Not Assigned"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Details Section */}
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">
                        Delivery Details
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div></div>
                        <div></div>
                        <div className="md:col-span-2">
                          <p className="text-xs uppercase text-gray-500 font-medium">
                            Address
                          </p>
                          <p className="mt-1 font-medium">
                            {order.shippingAddress
                              ? `${order.shippingAddress.address || ""}, ${
                                  order.shippingAddress.city || ""
                                }, ${order.shippingAddress.state || ""} ${
                                  order.shippingAddress.postalCode || ""
                                }, ${order.shippingAddress.country || ""}`
                              : "Address not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Add refresh status button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order._id);
                        }}
                        disabled={updatingOrderId === order._id}
                        className={`text-sm px-3 py-1.5 rounded ${
                          updatingOrderId === order._id
                            ? "bg-gray-200 text-gray-500"
                            : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                        } flex items-center`}
                      >
                        {updatingOrderId === order._id ? (
                          <>
                            <svg
                              className="animate-spin h-3 w-3 mr-1"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Updating...
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-3 w-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              ></path>
                            </svg>
                            Update Status
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Debug Status Panel - Add after Delivery Details Section */}
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h5 className="font-medium text-sm mb-2 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1 text-indigo-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Order Status Information
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Order Confirmation Status Card */}
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-xs uppercase text-gray-500 font-medium">
                          Order Confirmation Status
                        </p>
                        <div className="flex items-center mt-1">
                          <span
                            className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusColor(
                              order.status || "Pending Confirmation"
                            )}`}
                          ></span>
                          <span className="font-medium">
                            {order.status || "Pending Confirmation"}
                          </span>
                        </div>
                        {order.status === "Confirmed" && (
                          <p className="text-xs text-green-600 mt-1">
                            Your order has been confirmed by the seller
                          </p>
                        )}
                        {order.status === "Rejected" && (
                          <p className="text-xs text-red-600 mt-1">
                            This order has been rejected by the seller
                          </p>
                        )}
                      </div>

                      {/* Courier Status Card */}
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <p className="text-xs uppercase text-gray-500 font-medium">
                          Courier/Delivery Status
                        </p>
                        <div className="flex items-center mt-1">
                          <span
                            className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusColor(
                              order.courierInfo?.status || "Not Assigned"
                            )}`}
                          ></span>
                          <span className="font-medium">
                            {order.courierInfo?.status || "Not Assigned"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Courier:{" "}
                          {order.courierInfo?.courierName || "Not yet assigned"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Source: {order.courierInfo?.source || "default"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-5">
                    <h4 className="text-md font-semibold mb-4 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-indigo-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                      Order Items
                    </h4>

                    {order.items && order.items.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {order.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-center py-4 first:pt-0 last:pb-0"
                          >
                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                              <img
                                className="h-full w-full object-cover"
                                src={
                                  item.image && item.image.startsWith("http")
                                    ? item.image
                                    : item.product &&
                                      item.product.images &&
                                      item.product.images[0] &&
                                      item.product.images[0].startsWith("http")
                                    ? item.product.images[0]
                                    : backendUrl +
                                      (item.image ||
                                        (item.product &&
                                          item.product.images &&
                                          item.product.images[0]) ||
                                        "")
                                }
                                alt={
                                  item.name ||
                                  (item.product ? item.product.name : "Product")
                                }
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/150?text=No+Image";
                                }}
                              />
                            </div>
                            <div className="ml-4 flex-1">
                              <h3 className="font-medium text-gray-800">
                                {item.name ||
                                  (item.product
                                    ? item.product.name
                                    : "Unknown Product")}
                              </h3>
                              <div className="mt-1 flex text-sm">
                                <p className="text-gray-500">
                                  {item.variant
                                    ? `Variant: ${item.variant}`
                                    : ""}
                                </p>
                              </div>
                              <div className="flex items-end justify-between flex-1">
                                <p className="text-sm text-gray-500">
                                  Qty {item.quantity}
                                </p>
                                <p className="font-medium">
                                  {currency}
                                  {(
                                    (item.price ||
                                      (item.product ? item.product.price : 0)) *
                                    item.quantity
                                  ).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No items in this order.</p>
                    )}

                    {/* Order Summary/Total */}
                    <div className="border-t border-gray-100 mt-6 pt-6">
                      <div className="flex justify-between">
                        <p className="font-medium">Total</p>
                        <p className="font-semibold text-lg">
                          {currency}
                          {(
                            order.orderDetails?.total ||
                            order.amount ||
                            (order.items
                              ? order.items.reduce(
                                  (sum, item) =>
                                    sum +
                                    (item.price ||
                                      (item.product ? item.product.price : 0)) *
                                      item.quantity,
                                  0
                                )
                              : 0)
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-gray-300 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
          <p className="mt-2 text-sm text-gray-500">
            When you place orders, they will appear here.
          </p>
          <button
            onClick={() => navigate("/shop")}
            className="mt-6 inline-flex items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
          >
            Start Shopping
          </button>
        </div>
      )}
    </div>
  );
};

export default Orders;
