import { useState, useEffect, useCallback, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { ShopContext } from "../context/ShopContext";


const OrderConfirmation = ({ token, fetchNotifications }) => {
  const { backendUrl } = useContext(ShopContext);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showPartialModal, setShowPartialModal] = useState(false);
  const [partialItems, setPartialItems] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPendingOrders = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching with token:", token); // Add this debug line
      console.log("Backend URL:", backendUrl); // Add this debug line
      
      const response = await axios.get(
        `${backendUrl}/api/order/pending-confirmation`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      console.log("Response:", response.data); // Add this debug line
  
      if (response.data.success) {
        setPendingOrders(response.data.pendingOrders || []);
      }
    } catch (error) {
      console.error("Error fetching pending orders:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token]);

  useEffect(() => {
    if (backendUrl && token) {
      fetchPendingOrders();
    } else {
      console.error("Missing required props: backendUrl or token");
      setLoading(false);
    }
  }, [backendUrl, token, fetchPendingOrders, refreshKey]);

  const openConfirmationDialog = (orderId, action) => {
    setSelectedOrderId(orderId);
    setSelectedAction(action);

    if (action === "reject") {
      setShowReasonModal(true);
    } else {
      handleOrderAction(orderId, action);
    }
  };

  const openPartialConfirmation = (order) => {
    const initialPartialItems = order.orderDetails.items.map(item => ({
      ...item,
      confirmQuantity: item.currentStock >= item.quantity ? item.quantity : item.currentStock,
      confirmed: item.currentStock >= item.quantity
    }));
    
    setPartialItems(initialPartialItems);
    setSelectedOrderId(order._id);
    setShowPartialModal(true);
  };

  const handleOrderAction = async (orderId, action, reason = null) => {
    try {
      // Create request payload
      const payload = {
        orderId,
        action,
      };
      
      // Add reason if provided (for rejections)
      if (reason) {
        payload.reason = reason;
      }
  
      // Display loading message
      const loadingToast = toast.loading(
        action === "confirm" ? "Accepting order..." : "Rejecting order..."
      );
  
      // Call the API endpoint
      const response = await axios.post(
        `${backendUrl}/api/order/confirm-reject`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      // Dismiss the loading toast
      toast.dismiss(loadingToast);
  
      // Display success message
      if (response.data.success) {
        toast.success(
          action === "confirm"
            ? "Order accepted successfully!"
            : "Order rejected successfully"
        );
  
        // Update the orders list
        const updatedPendingOrders = pendingOrders.filter((order) => order._id !== orderId);
        setPendingOrders(updatedPendingOrders);
        
        // Trigger notification refresh if the function exists
        if (typeof fetchNotifications === "function") {
          fetchNotifications();
        }
        
        // Close modals
        setShowReasonModal(false);
        setRejectionReason("");
        setSelectedOrderId(null);
      } else {
        toast.error(response.data.message || "Failed to process order");
      }
    } catch (error) {
      console.error(`Error processing order:`, error);
      toast.error(
        error.response?.data?.message || "An error occurred while processing the order"
      );
    }
  };

  const handlePartialConfirmation = async () => {
    try {
      setProcessingOrder(selectedOrderId);
      
      const itemsToProcess = partialItems.map(item => ({
        productId: item.productId,
        quantity: item.confirmQuantity,
        confirmed: item.confirmed,
      }));

      const response = await axios.post(
        `${backendUrl}/api/order/process-partial`,
        {
          orderId: selectedOrderId,
          items: itemsToProcess
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success("Order partially processed successfully");
        setShowPartialModal(false);
        setRefreshKey(prevKey => prevKey + 1);
      }
    } catch (error) {
      console.error("Error processing partial order:", error);
      toast.error(error.response?.data?.message || "Failed to process partial order");
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleReasonSubmit = () => {
    handleOrderAction(selectedOrderId, "reject", rejectionReason);
  };

  const handlePartialItemChange = (index, field, value) => {
    const updatedItems = [...partialItems];
    
    if (field === 'confirmQuantity') {
      // Ensure quantity is within bounds
      const item = updatedItems[index];
      const numValue = parseInt(value) || 0;
      
      updatedItems[index][field] = Math.max(0, Math.min(numValue, item.quantity));
      
      // If quantity is 0, mark as not confirmed
      if (numValue === 0) {
        updatedItems[index].confirmed = false;
      }
    } else {
      updatedItems[index][field] = value;
      
      // If unchecking confirmed, set quantity to 0
      if (field === 'confirmed' && value === false) {
        updatedItems[index].confirmQuantity = 0;
      } else if (field === 'confirmed' && value === true) {
        // If checking confirmed and quantity is 0, set to max available
        const item = updatedItems[index];
        if (item.confirmQuantity === 0) {
          updatedItems[index].confirmQuantity = Math.min(item.currentStock, item.quantity);
        }
      }
    }
    
    setPartialItems(updatedItems);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        Orders Pending Confirmation
      </h2>

      {pendingOrders.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No pending orders to confirm</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingOrders.map((order) => (
            <div
              key={order._id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Order #{order.orderNumber}</h3>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  {order.orderDetails.status}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Customer:</span>{" "}
                  {order.customer.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Placed:</span>{" "}
                  {new Date(order.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Total Amount:</span> ₱
                  {order.orderDetails.total.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Payment Method:</span>{" "}
                  {order.orderDetails.paymentMethod}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2">
                  <span className="font-medium">Shipping Address:</span>{" "}
                  {order.customer.shippingAddress}
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  Items to Confirm:
                </h4>
                <div className="max-h-60 overflow-y-auto">
                  {order.orderDetails.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center py-2 border-b last:border-b-0"
                    >
                      <div className="w-12 h-12 rounded overflow-hidden">
                        <img
                          src={item.image || "https://via.placeholder.com/48"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="font-medium">{item.name}</p>
                        <div className="flex justify-between text-sm text-gray-600">
                          <p>
                            ₱{item.price} x {item.quantity}
                          </p>
                          <p>₱{item.total.toFixed(2)}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Current Stock: {item.currentStock}{" "}
                          {item.currentStock < item.quantity && (
                            <span className="text-red-600 font-bold">
                              • Insufficient Stock!
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => openConfirmationDialog(order._id, "reject")}
                  disabled={processingOrder === order._id}
                  className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {processingOrder === order._id
                    ? "Processing..."
                    : "Reject Order"}
                </button>

                {/* Partial Confirmation Button */}
                {order.orderDetails.items.some(item => item.currentStock < item.quantity) && (
                  <button
                    onClick={() => openPartialConfirmation(order)}
                    disabled={processingOrder === order._id}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  >
                    Process Partially
                  </button>
                )}

                <button
                  onClick={() => openConfirmationDialog(order._id, "confirm")}
                  disabled={
                    processingOrder === order._id ||
                    order.orderDetails.items.some(
                      (item) => item.currentStock < item.quantity
                    )
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {processingOrder === order._id
                    ? "Processing..."
                    : "Accept Order"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Reason for Rejection</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this order..."
              className="w-full p-2 border border-gray-300 rounded mb-4"
              rows={4}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2 border text-gray-700 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReasonSubmit}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partial Confirmation Modal */}
      {showPartialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-3xl w-full">
            <h3 className="text-lg font-medium mb-4">Process Order Partially</h3>
            <p className="text-gray-600 mb-4">
              Some items in this order have insufficient stock. You can process the order partially by selecting 
              which items you can fulfill and which quantities.
            </p>
            
            <div className="overflow-y-auto max-h-80 mb-4">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">Item</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">Ordered</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">Stock</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">Fulfill</th>
                    <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">Confirm</th>
                  </tr>
                </thead>
                <tbody>
                  {partialItems.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="py-2 px-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded overflow-hidden mr-2">
                            <img
                              src={item.image || "https://via.placeholder.com/40"}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">{item.quantity}</td>
                      <td className="py-2 px-4">
                        {item.currentStock}
                        {item.currentStock < item.quantity && (
                          <span className="text-red-600 ml-1">•</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={item.confirmQuantity}
                          disabled={!item.confirmed}
                          onChange={(e) => 
                            handlePartialItemChange(
                              index, 
                              'confirmQuantity', 
                              parseInt(e.target.value)
                            )
                          }
                          className="w-16 p-1 border rounded text-center"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="checkbox"
                          checked={item.confirmed}
                          onChange={(e) => 
                            handlePartialItemChange(index, 'confirmed', e.target.checked)
                          }
                          className="w-5 h-5 text-green-600"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPartialModal(false)}
                className="px-4 py-2 border text-gray-700 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handlePartialConfirmation}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                disabled={
                  processingOrder === selectedOrderId || 
                  !partialItems.some(item => item.confirmed && item.confirmQuantity > 0)
                }
              >
                {processingOrder === selectedOrderId ? "Processing..." : "Confirm Partial Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

OrderConfirmation.propTypes = {
  token: PropTypes.string.isRequired,
  fetchNotifications: PropTypes.func,
};

export default OrderConfirmation;