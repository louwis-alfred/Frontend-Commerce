import { useState, useEffect, useContext } from "react";
import PropTypes from 'prop-types';
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import { format } from "date-fns";

const CompletedTrades = ({ token }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [completedTrades, setCompletedTrades] = useState([]);
  const { backendUrl } = useContext(ShopContext);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSeller, setFilterSeller] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const fetchCompletedTrades = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/trades/completed`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setCompletedTrades(response.data.completedTrades);
        }
      } catch (error) {
        console.error("Error fetching completed trades:", error);
        toast.error("Failed to load your completed trades");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchCompletedTrades();
    }
  }, [token, backendUrl]);

  // Extract unique categories from trade products
  const uniqueCategories = [...new Set([
    ...completedTrades.map(trade => trade.given?.product?.category),
    ...completedTrades.map(trade => trade.received?.product?.category)
  ].filter(Boolean))];

  // Extract unique seller names
  const uniqueSellers = [...new Set(
    completedTrades.map(trade => trade.withUser?.name)
  ).filter(Boolean)];

  // Filter and sort trades
  const filteredAndSortedTrades = completedTrades
    .filter(trade => {
      const matchesCategory = !filterCategory || 
        trade.given?.product?.category === filterCategory || 
        trade.received?.product?.category === filterCategory;
      
      const matchesSeller = !filterSeller || 
        trade.withUser?.name === filterSeller;

      return matchesCategory && matchesSeller;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc" 
          ? new Date(b.completedAt) - new Date(a.completedAt)
          : new Date(a.completedAt) - new Date(b.completedAt);
      } else if (sortBy === "value") {
        const valueA = a.given?.product?.price * a.given?.quantity;
        const valueB = b.given?.product?.price * b.given?.quantity;
        return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
      }
      return 0;
    });

  const openTradeDetails = (trade) => {
    setSelectedTrade(trade);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedTrade(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (completedTrades.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="text-4xl mb-4">🔄</div>
          <h2 className="text-xl font-medium text-gray-700 mb-2">No completed trades yet</h2>
          <p className="text-gray-500">
            Once you complete some trades, they will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Your Completed Trades</h2>
      
      {/* Filter and Sort Controls */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label htmlFor="seller-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Trading Partner
            </label>
            <select
              id="seller-filter"
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={filterSeller}
              onChange={(e) => setFilterSeller(e.target.value)}
            >
              <option value="">All Sellers</option>
              {uniqueSellers.map(seller => (
                <option key={seller} value={seller}>{seller}</option>
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
              <option value="date">Date</option>
              <option value="value">Trade Value</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <select
              id="sort-order"
              className="w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>
        </div>
      </div>
      
      {filteredAndSortedTrades.length === 0 ? (
        <div className="text-center py-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No trades match your current filters</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAndSortedTrades.map((trade) => (
            <div key={trade._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Completed
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                      {trade.completedAt ? format(new Date(trade.completedAt), 'PPP') : 'Date not available'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Traded with: </span>
                    <span>{trade.withUser.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 p-4">
                {/* What you gave */}
                <div className="border-r border-gray-200 pr-4">
                  <div className="flex justify-between mb-2">
                    <h3 className="text-gray-500 text-sm">You gave:</h3>
                    {trade.given?.product?.category && (
                      <span className="bg-blue-50 text-blue-700 text-xs rounded px-2 py-1">
                        {trade.given.product.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start">
                    {trade.given.product.images && trade.given.product.images[0] ? (
                      <img 
                        src={trade.given.product.images[0]} 
                        alt={trade.given.product.name} 
                        className="w-16 h-16 object-cover rounded mr-3"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center mr-3">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium">{trade.given.product.name}</h4>
                      <p className="text-sm">Quantity: {trade.given.quantity} {trade.given.product.unitOfMeasurement || 'units'}</p>
                      <p className="text-sm text-gray-500">Value: ₱{(trade.given.product.price * trade.given.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                
                {/* What you received */}
                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="text-gray-500 text-sm">You received:</h3>
                    {trade.received?.product?.category && (
                      <span className="bg-blue-50 text-blue-700 text-xs rounded px-2 py-1">
                        {trade.received.product.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start">
                    {trade.received.product.images && trade.received.product.images[0] ? (
                      <img 
                        src={trade.received.product.images[0]} 
                        alt={trade.received.product.name} 
                        className="w-16 h-16 object-cover rounded mr-3"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center mr-3">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium">{trade.received.product.name}</h4>
                      <p className="text-sm">Quantity: {trade.received.quantity} {trade.received.product.unitOfMeasurement || 'units'}</p>
                      <p className="text-sm text-gray-500">Value: ₱{(trade.received.product.price * trade.received.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Trade Value Metrics */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
                <div className="flex justify-between text-sm">
                  <span>
                    Trade ratio: 
                    <span className={`ml-1 font-medium ${
                      trade.tradeDetails?.valueRatio > 0.9 && trade.tradeDetails?.valueRatio < 1.1
                        ? 'text-green-600' 
                        : trade.tradeDetails?.valueRatio >= 0.8 && trade.tradeDetails?.valueRatio <= 1.2
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {trade.tradeDetails?.valueRatio || '1'}:1
                    </span>
                  </span>
                  
                  <span className="ml-4">
                    Value difference: <span className="font-medium">₱{trade.tradeDetails?.valueDifference?.toFixed(2) || '0.00'}</span>
                  </span>
                </div>
                
                <button
                  onClick={() => openTradeDetails(trade)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  View Details
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Trade Details Modal */}
      {isDetailsModalOpen && selectedTrade && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b">
              <div className="flex justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Trade Details (ID: {selectedTrade._id.slice(-6)})
                </h3>
                <button onClick={closeDetailsModal} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-2">Trade Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Completed on:</span> {format(new Date(selectedTrade.completedAt), 'PPP')}</p>
                    <p><span className="font-medium">Trade type:</span> Product Exchange</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Trade partner:</span> {selectedTrade.withUser.name}</p>
                    <p><span className="font-medium">Value ratio:</span> {selectedTrade.tradeDetails?.valueRatio || '1:1'}</p>
                  </div>
                </div>
              </div>
              
              {/* Seller Contact Information */}
              <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-blue-800 mb-2">Trading Partner Contact</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Name:</span> {selectedTrade.withUser.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedTrade.withUser.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Phone:</span> {selectedTrade.withUser.phone || 'Not provided'}</p>
                    <p><span className="font-medium">Location:</span> {selectedTrade.withUser.location || 'Not provided'}</p>
                  </div>
                </div>
                
                {/* Add document verification button if available */}
                {selectedTrade.withUser.supportingDocument && (
                  <button
                    onClick={() => window.open(selectedTrade.withUser.supportingDocument, '_blank')}
                    className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Verification Document
                  </button>
                )}
              </div>
              
              {/* Products Exchanged */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-2">Products Exchanged</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Given Product */}
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2 text-gray-700 flex justify-between">
                      <span>You Gave</span>
                      {selectedTrade.given?.product?.category && (
                        <span className="bg-blue-50 text-blue-700 text-xs rounded px-2 py-1">
                          {selectedTrade.given.product.category}
                        </span>
                      )}
                    </h5>
                    
                    <div className="flex gap-4 mb-3">
                      {selectedTrade.given.product.images && selectedTrade.given.product.images[0] ? (
                        <img 
                          src={selectedTrade.given.product.images[0]} 
                          alt={selectedTrade.given.product.name} 
                          className="w-20 h-20 object-cover rounded"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                      <div>
                        <h6 className="font-medium">{selectedTrade.given.product.name}</h6>
                        <p className="text-sm text-gray-600">{selectedTrade.given.product.description}</p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Quantity:</span> {selectedTrade.given.quantity} {selectedTrade.given.product.unitOfMeasurement || 'units'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Value:</span> ₱{(selectedTrade.given.product.price * selectedTrade.given.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Received Product */}
                  <div className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2 text-gray-700 flex justify-between">
                      <span>You Received</span>
                      {selectedTrade.received?.product?.category && (
                        <span className="bg-blue-50 text-blue-700 text-xs rounded px-2 py-1">
                          {selectedTrade.received.product.category}
                        </span>
                      )}
                    </h5>
                    
                    <div className="flex gap-4 mb-3">
                      {selectedTrade.received.product.images && selectedTrade.received.product.images[0] ? (
                        <img 
                          src={selectedTrade.received.product.images[0]} 
                          alt={selectedTrade.received.product.name} 
                          className="w-20 h-20 object-cover rounded"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                      <div>
                        <h6 className="font-medium">{selectedTrade.received.product.name}</h6>
                        <p className="text-sm text-gray-600">{selectedTrade.received.product.description}</p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">Quantity:</span> {selectedTrade.received.quantity} {selectedTrade.received.product.unitOfMeasurement || 'units'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Value:</span> ₱{(selectedTrade.received.product.price * selectedTrade.received.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Trade Transaction Details */}
              {selectedTrade.notes && (
                <div className="mb-4">
                  <h4 className="text-lg font-medium mb-2">Transaction Log</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                    <pre>{selectedTrade.notes}</pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
              <button
                onClick={closeDetailsModal}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CompletedTrades.propTypes = {
  token: PropTypes.string.isRequired,
};

export default CompletedTrades;