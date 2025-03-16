import PropTypes from 'prop-types';

const TradeDetailsModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-gray-500 text-white px-2 py-1 rounded-lg hover:bg-gray-600 transition-colors duration-200"
        >
          Close
        </button>
        {children}
      </div>
    </div>
  );
};

TradeDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default TradeDetailsModal;