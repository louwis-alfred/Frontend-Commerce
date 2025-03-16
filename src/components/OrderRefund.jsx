import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';

const OrderRefund = ({ order, backendUrl, onComplete }) => {
  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(order?.orderDetails?.total || 0);
  const [processing, setProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const token = localStorage.getItem('token');

  const handleRefund = async () => {
    try {
      setProcessing(true);
      
      const response = await axios.post(
        `${backendUrl}/api/orders/refund`,
        {
          orderId: order._id,
          reason,
          refundAmount
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        toast.success('Refund processed successfully');
        setShowModal(false);
        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error(error.response?.data?.message || 'Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
      >
        Issue Refund
      </button>
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Process Refund</h3>
            <p className="text-gray-600 mb-4">
              You are about to refund order #{order.orderNumber}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refund Amount
              </label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded"
                min="0"
                max={order.orderDetails.total}
                step="0.01"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Refund
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Please provide a reason for this refund..."
                required
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border text-gray-700 rounded hover:bg-gray-100"
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                onClick={handleRefund}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                disabled={processing || !reason.trim() || refundAmount <= 0}
              >
                {processing ? 'Processing...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

OrderRefund.propTypes = {
  order: PropTypes.object.isRequired,
  backendUrl: PropTypes.string.isRequired,
  onComplete: PropTypes.func
};

export default OrderRefund;