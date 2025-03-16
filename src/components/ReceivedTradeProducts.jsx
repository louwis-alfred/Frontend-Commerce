import { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const ReceivedTradeProducts = ({ token }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [tradedProducts, setTradedProducts] = useState([]);
  const { backendUrl } = useContext(ShopContext);
  const [sortBy, setSortBy] = useState("date");
  const [filterCategory, setFilterCategory] = useState("");

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

  // Extract unique categories
  const uniqueCategories = [...new Set(
    tradedProducts.map(product => product.category)
  ).filter(Boolean)];

  // Sort and filter products
  const sortAndFilterProducts = () => {
    return tradedProducts
      .filter(product => !filterCategory || product.category === filterCategory)
      .sort((a, b) => {
        if (sortBy === "date") {
          return new Date(b.origin.acquiredDate) - new Date(a.origin.acquiredDate);
        } else if (sortBy === "price") {
          return b.price - a.price;
        }
        return 0;
      });
  };

  const filteredProducts = sortAndFilterProducts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-12 h-12 rounded-full border-4 border-green-100 border-t-green-500 animate-spin"></div>
        <p className="ml-3 text-gray-600 font-medium">Loading traded products...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Products Received Through Trades</h2>
      
      {/* Filter and Sort Controls */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Category
            </label>
            <select
              id="category-filter"
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sort-by"
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date Received (Newest First)</option>
              <option value="price">Price (Highest First)</option>
            </select>
          </div>
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Traded Products Found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            You haven't received any products through trading yet. 
            Visit the trade marketplace to start trading with other sellers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-transform hover:shadow-lg hover:-translate-y-1">
              <div className="relative h-48">
                <div className="absolute top-2 right-2 z-10">
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                    Traded
                  </span>
                </div>
                <img
                  src={product.images && product.images.length > 0 ? product.images[0] : "https://via.placeholder.com/300?text=No+Image"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/300?text=No+Image";
                  }}
                />
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1 truncate">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description || "No description available"}</p>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xl font-bold text-green-600">
                    ₱{parseFloat(product.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {product.category || "Uncategorized"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(product.origin.acquiredDate).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Stock: </span>{product.stock} {product.unitOfMeasurement || "units"}
                  </div>
                </div>
                
                {/* Original seller info */}
                <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <p>Originally from Trade #{product.origin.tradeId.toString().slice(-6)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ReceivedTradeProducts.propTypes = {
  token: PropTypes.string.isRequired,
};

export default ReceivedTradeProducts;