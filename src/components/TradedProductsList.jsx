import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const TradedProductsList = ({ token, onMarketStatusChange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [tradedProducts, setTradedProducts] = useState([]);
  const { backendUrl } = useContext(ShopContext);
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    const fetchTradedProducts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${backendUrl}/api/trades/received-products`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setTradedProducts(response.data.products);
        }
      } catch (error) {
        console.error("Error fetching traded products:", error);
        toast.error("Failed to load your received products");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchTradedProducts();
    }
  }, [token, backendUrl]);

  const handleCheckboxChange = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddToMarket = async () => {
    if (!selectedProducts.length) {
      toast.warning("Please select products to add to market");
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading("Adding products to market...");

      // Process each product
      await Promise.all(
        selectedProducts.map((productId) =>
          axios.post(
            `${backendUrl}/api/trades/add-for-trade`,
            { productId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      // Refresh traded products list
      const response = await axios.get(
        `${backendUrl}/api/trades/received-products`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTradedProducts(response.data.products || []);
      setSelectedProducts([]);

      toast.dismiss(loadingToast);
      toast.success("Products added to market successfully!");

      // Notify parent component about the change
      if (typeof onMarketStatusChange === "function") {
        onMarketStatusChange();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error adding products to market"
      );
      console.error("Market error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading traded products...</span>
      </div>
    );
  }

  if (tradedProducts.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
        <svg
          className="w-12 h-12 text-gray-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          No Traded Products Found
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          You haven't received any products through trading yet. Complete trades
          to receive products that you can then add to your market.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Products Received from Trades ({tradedProducts.length})
        </h3>
        <button
          onClick={handleAddToMarket}
          disabled={selectedProducts.length === 0}
          className={`px-4 py-2 rounded-lg flex items-center ${
            selectedProducts.length === 0
              ? "bg-gray-300 cursor-not-allowed text-gray-500"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Selected to Market
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tradedProducts.map((product) => (
          <div
            key={product._id}
            className={`border rounded-lg overflow-hidden ${
              selectedProducts.includes(product._id)
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200"
            } transition-all`}
          >
            <div className="relative">
              <img
                src={
                  Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0]
                    : "https://via.placeholder.com/300?text=No+Image"
                }
                alt={product.name}
                className="h-36 w-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://via.placeholder.com/300?text=No+Image";
                }}
              />
              <div className="absolute top-2 right-2">
                <input
                  type="checkbox"
                  id={`product-${product._id}`}
                  checked={selectedProducts.includes(product._id)}
                  onChange={() => handleCheckboxChange(product._id)}
                  className="hidden"
                />
                <label
                  htmlFor={`product-${product._id}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-all ${
                    selectedProducts.includes(product._id)
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white/80 text-transparent hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </label>
              </div>
              <div className="absolute top-2 left-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  Traded
                </span>
              </div>
              {product.availableForTrade && (
                <div className="absolute bottom-2 left-2">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                    In Market
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h4 className="font-medium text-gray-900 truncate">
                {product.name}
              </h4>
              <p className="text-sm text-gray-500 line-clamp-2 h-10">
                {product.description}
              </p>
              <div className="mt-2 flex justify-between items-center">
                <span className="font-bold text-green-600">
                  ₱{product.price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  Stock: {product.stock}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                <p>
                  Received on{" "}
                  {new Date(product.origin?.acquiredDate).toLocaleDateString()}
                </p>
                <p className="truncate">
                  From Trade #{product.origin?.tradeId.toString().slice(-6)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedProducts.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium">
            {selectedProducts.length} product
            {selectedProducts.length !== 1 ? "s" : ""} selected
          </p>
          <button
            onClick={handleAddToMarket}
            className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Add to Market
          </button>
        </div>
      )}
    </div>
  );
};

TradedProductsList.propTypes = {
  token: PropTypes.string.isRequired,
  onMarketStatusChange: PropTypes.func,
};

export default TradedProductsList;
