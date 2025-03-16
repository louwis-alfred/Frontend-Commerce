import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const TradeProduct = ({
  id,
  image,
  name,
  price,
  stock,
  seller,
  onTradeInitiated,
  currentUser,
  authToken,
  existingTrade, // Add this prop to support both creating and updating trades
}) => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [tradeStatus, setTradeStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { backendUrl } = useContext(ShopContext);
  const [selectedRecipientProductId, setSelectedRecipientProductId] =
    useState("");
  const [quantityFrom, setQuantityFrom] = useState(1); // Your quantity to offer
  const [quantityTo, setQuantityTo] = useState(1); // Their quantity you want
  const [selectedRecipientProduct, setSelectedRecipientProduct] =
    useState(null);
  const [error, setError] = useState(null);
  const [userTradeableProducts, setUserTradeableProducts] = useState([]);
  const [fairnessMetrics, setFairnessMetrics] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    trackingNumber: "",
    courier: "",
    notes: "",
  });
  const courierOptions = [
    "JRS Express",
    "J&T Express",
    "LBC",
    "Ninja Van",
    "Grab Express",
    "Lalamove",
    "2GO",
  ];
  // Initialize component state based on whether we're updating an existing trade
  useEffect(() => {
    if (existingTrade) {
      setIsUpdateMode(true);
      setQuantityFrom(
        existingTrade.quantityFrom || existingTrade.quantity || 1
      );
      setQuantityTo(existingTrade.quantityTo || existingTrade.quantity || 1);
      setSelectedRecipientProductId(existingTrade.productFrom);
      setTradeStatus(existingTrade.status);
    }
  }, [existingTrade]);

  useEffect(() => {
    const fetchUserTradeableProducts = async () => {
      setIsInitialLoading(true);
      try {
        const response = await axios.get(
          `${backendUrl}/api/trades/current-user-products`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        if (response.data.success) {
          // filter out products from the same seller that owns the product being viewed
          const filteredProducts = response.data.products.filter(
            (product) => product.sellerId !== seller._id
          );
          setUserTradeableProducts(filteredProducts);

          // If in update mode, find the selected product
          if (isUpdateMode && existingTrade) {
            const product = filteredProducts.find(
              (p) => p._id === existingTrade.productFrom
            );
            if (product) {
              setSelectedRecipientProduct(product);
            }
          }

          // If no products available after filtering, set an appropriate error
          if (
            filteredProducts.length === 0 &&
            response.data.products.length > 0
          ) {
            setError("You cannot trade with your own products");
          }
        }
      } catch (error) {
        console.error("Error fetching user tradeable products:", error);
        setError("Failed to load your tradeable products");
      } finally {
        setIsInitialLoading(false);
      }
    };

    if (currentUser?._id && authToken) {
      fetchUserTradeableProducts();
    }
  }, [
    currentUser,
    authToken,
    backendUrl,
    seller._id,
    isUpdateMode,
    existingTrade,
  ]);

  // Calculate fairness metrics whenever quantities or selected products change
  useEffect(() => {
    if (selectedRecipientProduct && quantityFrom > 0 && quantityTo > 0) {
      const offeredValue = selectedRecipientProduct.price * quantityFrom;
      const requestedValue = price * quantityTo;
      const valueDifference = Math.abs(offeredValue - requestedValue);
      const valueRatio = (offeredValue / requestedValue).toFixed(2);

      setFairnessMetrics({
        offeredValue,
        requestedValue,
        valueDifference,
        valueRatio,
      });
    } else {
      setFairnessMetrics(null);
    }
  }, [selectedRecipientProduct, quantityFrom, quantityTo, price]);

  // Handle updating an existing trade
  const handleUpdateTrade = async () => {
    if (!existingTrade || !existingTrade._id) {
      toast.error("No trade to update");
      return;
    }

    // Validate quantities
    if (
      quantityFrom <= 0 ||
      !selectedRecipientProduct ||
      quantityFrom > selectedRecipientProduct.stock
    ) {
      toast.error(
        `Please enter a valid quantity for your offer (max ${
          selectedRecipientProduct?.stock || 0
        })`
      );
      return;
    }

    if (quantityTo <= 0 || quantityTo > stock) {
      toast.error(
        `Please enter a valid quantity for your request (max ${stock})`
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${backendUrl}/api/trades/update`,
        {
          tradeId: existingTrade._id,
          quantityFrom: parseInt(quantityFrom),
          quantityTo: parseInt(quantityTo),
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("Trade quantities updated successfully");
        if (typeof onTradeInitiated === "function") {
          onTradeInitiated(true, response.data.trade);
        }
      } else {
        throw new Error(response.data.message || "Failed to update trade");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error updating trade";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle initiating a new trade
  const handleTrade = async () => {
    if (!currentUser?._id) {
      toast.error("User authentication required");
      return;
    }
    if (seller._id === currentUser._id) {
      toast.error("You cannot trade with yourself");
      return;
    }
    if (!id || !seller._id || !selectedRecipientProductId) {
      toast.error("Missing required trade information");
      return;
    }

    if (tradeStatus === "pending") {
      toast.warning("You already have a pending trade for this product");
      return;
    }

    // Validate quantities
    if (
      quantityFrom <= 0 ||
      !selectedRecipientProduct ||
      quantityFrom > selectedRecipientProduct.stock
    ) {
      toast.error(
        `Please enter a valid quantity for your offer (max ${
          selectedRecipientProduct?.stock || 0
        })`
      );
      return;
    }

    if (quantityTo <= 0 || quantityTo > stock) {
      toast.error(
        `Please enter a valid quantity for your request (max ${stock})`
      );
      return;
    }

    setIsLoading(true);
    try {
      const tradeData = {
        sellerFrom: String(currentUser._id),
        sellerTo: String(seller._id),
        productIdFrom: String(selectedRecipientProductId),
        productIdTo: String(id),
        quantityFrom: parseInt(quantityFrom), // Your quantity to offer
        quantityTo: parseInt(quantityTo), // Their quantity you want
      };

      const response = await axios.post(
        `${backendUrl}/api/trades/initiate`,
        tradeData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success && response.status === 201) {
        toast.success(response.data.message || "Trade initiated successfully!");
        setTradeStatus("pending");
        if (typeof onTradeInitiated === "function") {
          onTradeInitiated(true, response.data.trade);
        }
      } else {
        throw new Error(response.data.message || "Failed to initiate trade");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Error initiating trade";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Combined handler that either creates or updates based on mode
  const handleSubmit = () => {
    if (isUpdateMode) {
      handleUpdateTrade();
    } else {
      handleTrade();
    }
  };

  const handleQuantityFromChange = (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value <= 0) {
      toast.warning("Quantity must be greater than 0");
      return;
    }
    if (!selectedRecipientProduct) {
      toast.warning("Please select a product first");
      return;
    }
    if (value > selectedRecipientProduct.stock) {
      toast.warning(
        `Maximum available quantity is ${selectedRecipientProduct.stock}`
      );
      return;
    }
    setQuantityFrom(value);
  };

  const handleQuantityToChange = (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value <= 0) {
      toast.warning("Quantity must be greater than 0");
      return;
    }
    if (value > stock) {
      toast.warning(`Maximum available quantity is ${stock}`);
      return;
    }
    setQuantityTo(value);
  };

  const handleRecipientProductChange = (e) => {
    const selectedId = e.target.value;
    setSelectedRecipientProductId(selectedId);
    const selectedProduct = userTradeableProducts.find(
      (product) => product._id === selectedId
    );
    if (selectedProduct) {
      if (selectedProduct.stock <= 0) {
        toast.warning("Selected product is out of stock");
      }
      setSelectedRecipientProduct(selectedProduct);

      // Reset quantities when product changes to prevent invalid states
      setQuantityFrom(1);
    }
  };

  // Cancel handler - explicitly pass false to indicate no trade was initiated
  const handleCancel = () => {
    if (typeof onTradeInitiated === "function") {
      onTradeInitiated(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-100 p-3 rounded-lg mb-4">{error}</div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-3">
        {isUpdateMode ? "Update Trade" : "Initiate Trade"}
      </h2>

      {/* Product Being Traded (Their product you want) */}
      <div className="mb-3">
        <h3 className="text-md font-semibold text-gray-800 mb-1">
          Product You Want
        </h3>
        <div className="flex gap-2 bg-gray-50 p-2 rounded-lg">
          <div className="w-20 h-20">
            <img
              src={Array.isArray(image) ? image[0] : image}
              alt={name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <p className="font-bold text-md">{name}</p>
            <p className="text-gray-600">Price: ₱{price.toFixed(2)}</p>
            <p className="text-gray-600">Stock: {stock}</p>
            <p className="text-gray-600">Seller: {seller.name}</p>
          </div>
        </div>
      </div>

      {/* Select Product to Trade With */}
      <div className="mb-3">
        <h3 className="text-md font-semibold text-gray-800 mb-1">
          Your Product to Offer
        </h3>

        {userTradeableProducts.length === 0 ? (
          <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="text-center">
              <svg
                className="w-8 h-8 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
              <p className="mt-2 font-medium text-gray-700">
                No products available for trade
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {error ||
                  "You need to mark products as Available for Trade in your dashboard"}
              </p>
            </div>
          </div>
        ) : (
          <select
            value={selectedRecipientProductId}
            onChange={handleRecipientProductChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            required
            disabled={isLoading || isUpdateMode} // Disable in update mode
          >
            <option value="">Select your product to trade with</option>
            {userTradeableProducts.map((product) => (
              <option
                key={product._id}
                value={product._id}
                disabled={product.stock <= 0}
              >
                {product.name} - Stock: {product.stock} - ₱
                {product.price.toFixed(2)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Display selected product details if one is selected */}
      {selectedRecipientProduct && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-center gap-2">
            {selectedRecipientProduct.images?.[0] && (
              <img
                src={selectedRecipientProduct.images[0]}
                alt={selectedRecipientProduct.name}
                className="w-12 h-12 object-cover rounded"
              />
            )}
            <div>
              <p className="font-medium">{selectedRecipientProduct.name}</p>
              <p className="text-sm">
                Your stock: {selectedRecipientProduct.stock}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quantity Input - Split into two sections */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Your quantity to offer */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Your quantity to offer
          </label>
          <input
            type="number"
            value={quantityFrom}
            onChange={handleQuantityFromChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            min="1"
            max={selectedRecipientProduct?.stock || 1}
            disabled={isLoading || !selectedRecipientProduct}
          />
          <p className="text-xs text-gray-500 mt-1">
            Max: {selectedRecipientProduct?.stock || 0}
          </p>
        </div>

        {/* Their quantity you want */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Their quantity you want
          </label>
          <input
            type="number"
            value={quantityTo}
            onChange={handleQuantityToChange}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            min="1"
            max={stock}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">Max: {stock}</p>
        </div>
      </div>

      {/* Trade Value Calculator */}
      {fairnessMetrics && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium mb-2">Trade Value Analysis</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>You offer:</span>
              <span className="font-medium">
                ₱{fairnessMetrics.offeredValue.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>You receive:</span>
              <span className="font-medium">
                ₱{fairnessMetrics.requestedValue.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm">Value ratio:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    fairnessMetrics.valueRatio > 0.9 &&
                    fairnessMetrics.valueRatio < 1.1
                      ? "text-green-600"
                      : fairnessMetrics.valueRatio >= 0.8 &&
                        fairnessMetrics.valueRatio <= 1.2
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {fairnessMetrics.valueRatio}:1
                </span>
                {fairnessMetrics.valueRatio > 0.9 &&
                fairnessMetrics.valueRatio < 1.1 ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Fair
                  </span>
                ) : fairnessMetrics.valueRatio >= 0.8 &&
                  fairnessMetrics.valueRatio <= 1.2 ? (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                    Reasonable
                  </span>
                ) : (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                    Unbalanced
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Information Section - Only show for completed trades */}
      {existingTrade && existingTrade.status === "completed" && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
          <h3 className="text-md font-medium mb-3">Shipping Information</h3>

          {existingTrade.shipping?.status === "shipped" ||
          existingTrade.shipping?.status === "delivered" ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-medium ${
                    existingTrade.shipping?.status === "shipped"
                      ? "text-blue-600"
                      : "text-green-600"
                  }`}
                >
                  {existingTrade.shipping?.status === "shipped"
                    ? "Shipped"
                    : "Delivered"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tracking Number:</span>
                <span className="font-medium">
                  {existingTrade.shipping?.trackingNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Courier:</span>
                <span className="font-medium">
                  {existingTrade.shipping?.courier}
                </span>
              </div>
              {existingTrade.shipping?.notes && (
                <div>
                  <span className="text-gray-600 block">Notes:</span>
                  <p className="bg-gray-50 p-2 rounded mt-1 text-sm">
                    {existingTrade.shipping?.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={shippingInfo.trackingNumber}
                  onChange={(e) =>
                    setShippingInfo({
                      ...shippingInfo,
                      trackingNumber: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter tracking number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Courier
                </label>
                <select
                  value={shippingInfo.courier}
                  onChange={(e) =>
                    setShippingInfo({
                      ...shippingInfo,
                      courier: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select a courier</option>
                  {courierOptions.map((courier) => (
                    <option key={courier} value={courier}>
                      {courier}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Notes (Optional)
                </label>
                <textarea
                  value={shippingInfo.notes}
                  onChange={(e) =>
                    setShippingInfo({ ...shippingInfo, notes: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400"
                  rows="2"
                  placeholder="Add any special instructions"
                ></textarea>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isLoading ||
            (!isUpdateMode && !selectedRecipientProductId) ||
            quantityFrom <= 0 ||
            quantityTo <= 0 ||
            (selectedRecipientProduct &&
              quantityFrom > selectedRecipientProduct.stock) ||
            quantityTo > stock
          }
          className={`px-4 py-2 rounded-lg transition-colors ${
            isLoading ||
            (!isUpdateMode && !selectedRecipientProductId) ||
            quantityFrom <= 0 ||
            quantityTo <= 0 ||
            (selectedRecipientProduct &&
              quantityFrom > selectedRecipientProduct.stock) ||
            quantityTo > stock
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </div>
          ) : isUpdateMode ? (
            "Update Trade"
          ) : (
            "Confirm Trade"
          )}
        </button>
      </div>
    </div>
  );
};

TradeProduct.propTypes = {
  authToken: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  image: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]).isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  stock: PropTypes.number.isRequired,
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }),
  onTradeInitiated: PropTypes.func,
  seller: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    _id: PropTypes.string.isRequired,
    location: PropTypes.string,
  }).isRequired,
  // Add the existingTrade prop type
  existingTrade: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    productFrom: PropTypes.string,
    quantityFrom: PropTypes.number,
    quantityTo: PropTypes.number,
    quantity: PropTypes.number,
    status: PropTypes.string,
    shipping: PropTypes.shape({
      status: PropTypes.string,
      trackingNumber: PropTypes.string,
      courier: PropTypes.string,
      notes: PropTypes.string,
      updatedAt: PropTypes.string,
    }),
  }),
};

export default TradeProduct;
