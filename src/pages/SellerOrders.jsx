import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import OrderRefund from "../components/OrderRefund";
import PropTypes from "prop-types";

const SellerOrders = ({ token, backendUrl }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { backendUrl: contextBackendUrl } = useContext(ShopContext);

  // Use provided backendUrl or fall back to context
  const apiUrl = backendUrl || contextBackendUrl;

  // State for enhanced filtering and pagination
  const [filters, setFilters] = useState({
    status: "All",
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [sortOptions, setSortOptions] = useState({
    sortBy: "date",
    sortDir: "desc",
  });

  useEffect(() => {
    if (token && apiUrl) {
      fetchSellerOrders();
    } else {
      console.error("Missing required props: token or backendUrl");
      setLoading(false);
    }
  }, [token, apiUrl, pagination.page, pagination.limit, sortOptions]);

  // Optimized to use the new management endpoint
  const fetchSellerOrders = async (resetPage = false) => {
    try {
      setLoading(true);
      setIsRefreshing(true);

      // If resetting page (like when applying new filters), set page to 1
      if (resetPage) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.status !== "All")
        queryParams.append("status", filters.status);
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.dateFrom) queryParams.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) queryParams.append("dateTo", filters.dateTo);
      queryParams.append("page", resetPage ? 1 : pagination.page);
      queryParams.append("limit", pagination.limit);
      queryParams.append("sortBy", sortOptions.sortBy);
      queryParams.append("sortDir", sortOptions.sortDir);

      const endpoint = `${apiUrl}/api/orders/seller/management?${queryParams.toString()}`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setOrders(response.data.orders || []);
        setPagination({
          page: response.data.pagination?.page || 1,
          limit: response.data.pagination?.limit || pagination.limit,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 1,
        });
      } else {
        // Only show error toast for actual errors, not for empty results
        if (
          response.data.message &&
          !response.data.message.includes("No orders found")
        ) {
          toast.error(response.data.message || "Failed to load orders");
        } else {
          // Clear orders but don't show an error
          setOrders([]);
          setPagination((prev) => ({ ...prev, total: 0, pages: 1 }));
        }
      }
    } catch (error) {
      console.error("Error fetching seller orders:", error);

      // Handle specific error cases
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 404) {
          // 404 typically means no orders were found (not an actual error)
          setOrders([]);
          setPagination((prev) => ({ ...prev, total: 0, pages: 1 }));
        } else {
          // For other error statuses, show the error message
          toast.error(
            error.response.data?.message || "Failed to load your orders"
          );
        }
      } else if (error.request) {
        // The request was made but no response was received
        toast.error("Network error. Please check your connection.");
      } else {
        // Something happened in setting up the request
        toast.error("Error preparing your request.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await axios.post(
        `${apiUrl}/api/orders/update-status`,
        {
          orderId,
          status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success(`Order status updated to ${status}`);
        fetchSellerOrders();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update order status"
      );
    }
  };

  // Handle filter changes and apply them
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    fetchSellerOrders(true); // Reset to page 1 when applying filters
  };

  const clearFilters = () => {
    setFilters({
      status: "All",
      search: "",
      dateFrom: "",
      dateTo: "",
    });
    setTimeout(() => {
      fetchSellerOrders(true);
    }, 0);
  };

  // Handle sort change
  const handleSortChange = (field) => {
    setSortOptions((prev) => ({
      sortBy: field,
      sortDir:
        prev.sortBy === field && prev.sortDir === "desc" ? "asc" : "desc",
    }));
  };

  // Handle pagination
  const goToPage = (page) => {
    if (page < 1 || page > pagination.pages) return;
    setPagination((prev) => ({ ...prev, page }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending Confirmation":
        return "bg-yellow-100 text-yellow-800";
      case "Confirmed":
        return "bg-blue-100 text-blue-800";
      case "Processing":
        return "bg-purple-100 text-purple-800";
      case "Shipped":
        return "bg-indigo-100 text-indigo-800";
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Refunded":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && !orders.length) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Management</h2>

        {/* Enhanced Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-green-500"
              disabled={isRefreshing}
            >
              <option value="All">All Orders</option>
              <option value="Pending Confirmation">Pending Confirmation</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Rejected">Rejected</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Order ID or customer name"
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="space-x-2">
            <button
              onClick={applyFilters}
              disabled={isRefreshing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              disabled={isRefreshing}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {pagination.total} orders found
            </span>
            {isRefreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-green-500"></div>
            )}
          </div>
        </div>
      </div>

      {/* Sorting Options */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => handleSortChange("date")}
          className={`px-3 py-1 rounded-full text-xs ${
            sortOptions.sortBy === "date"
              ? "bg-green-100 text-green-800 font-medium"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Date{" "}
          {sortOptions.sortBy === "date" &&
            (sortOptions.sortDir === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => handleSortChange("orderNumber")}
          className={`px-3 py-1 rounded-full text-xs ${
            sortOptions.sortBy === "orderNumber"
              ? "bg-green-100 text-green-800 font-medium"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Order #{" "}
          {sortOptions.sortBy === "orderNumber" &&
            (sortOptions.sortDir === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => handleSortChange("total")}
          className={`px-3 py-1 rounded-full text-xs ${
            sortOptions.sortBy === "total"
              ? "bg-green-100 text-green-800 font-medium"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          Amount{" "}
          {sortOptions.sortBy === "total" &&
            (sortOptions.sortDir === "asc" ? "↑" : "↓")}
        </button>
      </div>

      {/* Orders List */}
      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 rounded-lg">
          {loading ? (
            <div className="py-8">
              <div className="animate-spin mx-auto rounded-full h-8 w-8 border-2 border-b-transparent border-green-500"></div>
              <p className="mt-4 text-gray-500">Loading orders...</p>
            </div>
          ) : (
            <div className="space-y-4 py-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>

              <h3 className="text-lg font-medium text-gray-700">
                {filters.status !== "All" ||
                filters.search ||
                filters.dateFrom ||
                filters.dateTo
                  ? `No orders match your filters`
                  : `No orders found yet`}
              </h3>

              <p className="text-gray-500 max-w-md mx-auto">
                {filters.status !== "All" ||
                filters.search ||
                filters.dateFrom ||
                filters.dateTo
                  ? `Try adjusting your search criteria or clearing filters to see more results.`
                  : `When customers place orders for your products, they will appear here for management.`}
              </p>

              {(filters.status !== "All" ||
                filters.search ||
                filters.dateFrom ||
                filters.dateTo) && (
                <div className="mt-6">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {!filters.status &&
                !filters.search &&
                !filters.dateFrom &&
                !filters.dateTo && (
                  <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100 max-w-md mx-auto">
                    <h4 className="font-medium text-gray-700 mb-2">
                      Getting Started
                    </h4>
                    <ul className="text-sm text-left text-gray-600 space-y-2">
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-500 mr-2">
                          1
                        </span>
                        <span>
                          Customers place orders containing your products
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-500 mr-2">
                          2
                        </span>
                        <span>You receive notifications about new orders</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-500 mr-2">
                          3
                        </span>
                        <span>
                          Confirm orders and prepare them for shipping
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-100 text-green-500 mr-2">
                          4
                        </span>
                        <span>
                          Update status as orders progress through fulfillment
                        </span>
                      </li>
                    </ul>
                  </div>
                )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                order.needsAction ? "border-yellow-300 bg-yellow-50" : ""
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-medium">Order #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.date).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Customer:</span>{" "}
                    {order.customer.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span>{" "}
                    {order.customer.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span>{" "}
                    {order.customer.phone}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    <span className="font-medium">Address:</span>{" "}
                    {order.address}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Payment Method:</span>{" "}
                    {order.paymentMethod}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Payment Status:</span>{" "}
                    {order.paymentStatus}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Total Amount:</span> ₱
                    {order.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Shipping:</span>{" "}
                    {order.shipping.courier} ({order.shipping.status})
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Items:</h4>
                <div className="max-h-60 overflow-y-auto">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center py-2 border-b last:border-b-0"
                    >
                      <div className="w-12 h-12 rounded overflow-hidden">
                        <img
                          src={item.image || "https://via.placeholder.com/48"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/48?text=No+Image";
                          }}
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
                        {item.itemStatus !== order.status && (
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getStatusColor(
                              item.itemStatus
                            )}`}
                          >
                            {item.itemStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                {order.needsAction && (
                  <div className="flex items-center gap-2 mr-auto">
                    <span className="animate-pulse bg-yellow-500 rounded-full w-2 h-2"></span>
                    <span className="text-sm text-yellow-700">
                      Action needed
                    </span>
                  </div>
                )}

                {/* Confirm/reject buttons for pending orders */}
                {["Pending Confirmation", "Order Placed"].includes(
                  order.status
                ) && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order._id, "Confirmed")}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    >
                      Confirm Order
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order._id, "Rejected")}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      Reject
                    </button>
                  </>
                )}

                {/* Status update buttons */}
                {order.status === "Confirmed" && (
                  <button
                    onClick={() => updateOrderStatus(order._id, "Processing")}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    Mark as Processing
                  </button>
                )}

                {order.status === "Processing" && (
                  <button
                    onClick={() => updateOrderStatus(order._id, "Shipped")}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm"
                  >
                    Mark as Shipped
                  </button>
                )}

                {order.status === "Shipped" && (
                  <button
                    onClick={() => updateOrderStatus(order._id, "Delivered")}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                  >
                    Mark as Delivered
                  </button>
                )}

                {/* Refund button for eligible statuses */}
                {["Confirmed", "Processing", "Shipped"].includes(
                  order.status
                ) && (
                  <OrderRefund
                    order={{
                      ...order,
                      orderDetails: {
                        ...order,
                        items: order.items,
                        total: order.total,
                      },
                    }}
                    backendUrl={apiUrl}
                    token={token}
                    onComplete={() => fetchSellerOrders()}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          <button
            onClick={() => goToPage(1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            &laquo;
          </button>
          <button
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            &lsaquo;
          </button>

          {/* Display page numbers with ellipsis for long paginations */}
          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
            // For pagination with many pages, show current page and neighbors
            let pageToShow;
            const totalPages = pagination.pages;
            const currentPage = pagination.page;

            if (totalPages <= 5) {
              pageToShow = i + 1;
            } else {
              // Complex pagination with ellipsis
              if (currentPage <= 3) {
                pageToShow = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageToShow = totalPages - 4 + i;
              } else {
                pageToShow = currentPage - 2 + i;
              }
            }

            return (
              <button
                key={pageToShow}
                onClick={() => goToPage(pageToShow)}
                className={`px-3 py-1 rounded border ${
                  pageToShow === pagination.page
                    ? "bg-green-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {pageToShow}
              </button>
            );
          })}

          <button
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            &rsaquo;
          </button>
          <button
            onClick={() => goToPage(pagination.pages)}
            disabled={pagination.page === pagination.pages}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            &raquo;
          </button>
        </div>
      )}

      {/* Page Size Control */}
      <div className="mt-4 text-center">
        <label className="text-sm text-gray-600 mr-2">Items per page:</label>
        <select
          value={pagination.limit}
          onChange={(e) =>
            setPagination((prev) => ({
              ...prev,
              page: 1,
              limit: parseInt(e.target.value),
            }))
          }
          className="border rounded p-1"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>
  );
};

SellerOrders.propTypes = {
  token: PropTypes.string.isRequired,
  backendUrl: PropTypes.string,
};

export default SellerOrders;
