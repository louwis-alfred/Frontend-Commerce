import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';

const OrderTracking = ({ orderId, onClose }) => {
  const { backendUrl, token } = useContext(ShopContext);
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        setLoading(true);
        
        // Get status information
        const statusResponse = await axios.get(
          `${backendUrl}/api/logistics/status/${orderId}`, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Get courier details
        const courierResponse = await axios.get(
          `${backendUrl}/api/logistics/check-courier/${orderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setTrackingData({
          status: statusResponse.data,
          courierDetails: courierResponse.data
        });
      } catch (err) {
        console.error('Error fetching tracking data:', err);
        setError('Failed to load tracking information');
      } finally {
        setLoading(false);
      }
    };
    
    if (orderId) {
      fetchTrackingData();
    }
  }, [orderId, backendUrl, token]);

  // Format delivery address if available
  const formatAddress = (address) => {
    if (!address) return 'Address not available';
    
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipcode || ''}, ${address.country || ''}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h3 className="text-lg font-bold mb-4">Loading Tracking Information</h3>
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h3 className="text-lg font-bold mb-4 text-red-600">Error</h3>
          <p>{error}</p>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={onClose}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Order Tracking</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {trackingData && (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span 
                className={`inline-block w-3 h-3 rounded-full ${
                  trackingData.status?.status === 'Delivered' ? 'bg-green-500' :
                  trackingData.status?.status === 'Shipped' ? 'bg-blue-500' :
                  'bg-yellow-500'
                }`}
              ></span>
              <span className="font-medium text-lg">
                {trackingData.status?.status || 'Processing'}
              </span>
            </div>
            
            {/* Courier Information */}
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium mb-2">Shipping Information</h4>
              
              {(trackingData.courierDetails?.logistics || trackingData.courierDetails?.courierPanel) ? (
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">Courier:</span>{' '}
                    {trackingData.courierDetails.logistics?.courierId?.name || 
                     trackingData.courierDetails.courierPanel?.courierId?.name || 
                     'Not Assigned'}
                  </p>
                  
                  {trackingData.courierDetails.logistics?.address && (
                    <p>
                      <span className="font-semibold">Delivery To:</span>{' '}
                      {formatAddress(trackingData.courierDetails.logistics.address)}
                    </p>
                  )}
                  
                  <p>
                    <span className="font-semibold">Last Updated:</span>{' '}
                    {trackingData.courierDetails.logistics?.date ? 
                      new Date(trackingData.courierDetails.logistics.date).toLocaleString() : 
                      'Not available'}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">
                  Your order is being processed. Shipping information will appear here once your order has been shipped.
                </p>
              )}
            </div>
            
            {/* Order ID */}
            <div className="text-sm text-gray-500">
              Order ID: {orderId}
            </div>
            
            {/* Manual refresh button */}
            <div className="flex justify-end mt-2">
              <button 
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => {
                    fetchTrackingData();
                  }, 500);
                }}
                className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Tracking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;