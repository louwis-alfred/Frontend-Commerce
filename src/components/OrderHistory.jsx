import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
const OrderHistory = ({ orderId, onClose, token }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { backendUrl } = useContext(ShopContext);
  
  useEffect(() => {
    const fetchOrderHistory = async () => {
      if (!orderId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`${backendUrl}/api/order/history/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        
        if (response.data.success) {
          setHistory(response.data.history);
        } else {
          setError("Failed to load order history");
        }
      } catch (error) {
        console.error("Error fetching order history:", error);
        if (error.response?.status === 403) {
          toast.error("You don't have permission to view this order history");
          onClose();
        } else {
          setError(error.response?.data?.message || "Error loading order history");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderHistory();
  }, [orderId, backendUrl, token, onClose]);

  // Helper to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Helper for status colors
  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('delivered') || statusLower.includes('completed')) {
      return 'bg-green-100 text-green-800';
    } else if (statusLower.includes('cancelled') || statusLower.includes('rejected') || statusLower.includes('refund')) {
      return 'bg-red-100 text-red-800';
    } else if (statusLower.includes('pending')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (statusLower.includes('confirmed')) {
      return 'bg-blue-100 text-blue-800';
    } else if (statusLower.includes('shipped')) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Order History</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No history available for this order</div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 z-0"></div>
          
          {/* Timeline events */}
          <div className="space-y-6 relative z-10">
            {history.map((event, index) => (
              <div key={index} className="flex items-start ml-2">
                {/* Timeline dot */}
                <div className="relative flex items-center justify-center flex-shrink-0">
                  <div className="h-8 w-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center shadow-md z-10">
                    {event.type === 'status' && 
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    }
                    {event.type === 'seller_action' && 
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    }
                    {event.type === 'refund_request' && 
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    }
                    {event.type === 'refund_processed' && 
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    }
                  </div>
                </div>
                
                {/* Event content */}
                <div className="ml-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex-1">
                  <div className="flex justify-between">
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        by {event.updatedBy}
                      </span>
                    </div>
                    <time className="text-xs text-gray-500">{formatDate(event.timestamp)}</time>
                  </div>
                  
                  <p className="mt-2 text-gray-700">{event.note}</p>
                  
                  {/* Additional info for specific event types */}
                  {event.type === 'seller_action' && event.items && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p>Items affected: {event.items.length}</p>
                    </div>
                  )}
                  
                  {event.type === 'refund_processed' && event.amount && (
                    <div className="mt-2 text-sm font-medium text-green-600">
                      Refund amount: ₱{event.amount.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
// Add PropTypes validation
OrderHistory.propTypes = {
    orderId: PropTypes.string, // String since it's likely a MongoDB ID
    onClose: PropTypes.func.isRequired,
    token: PropTypes.string.isRequired
  };
  
export default OrderHistory;