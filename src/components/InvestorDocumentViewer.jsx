import { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import DocumentViewerModal from './DocumentViewerModal';

const InvestorDocumentViewer = ({ investorId, showButton = true }) => {
  const { backendUrl } = useContext(ShopContext);
  const [documents, setDocuments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDocument, setShowDocument] = useState(false);
  const [currentDocument, setCurrentDocument] = useState({
    url: '',
    title: ''
  });

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(
        `${backendUrl}/api/investor/documents/${investorId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      if (response.data.success) {
        setDocuments(response.data.documents);
      } else {
        setError(response.data.message || 'Failed to load documents');
      }
    } catch (err) {
      setError('Error loading investor documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (investorId && !showButton) {
      fetchDocuments();
    }
  }, [investorId, showButton]);

  const viewDocument = (url, title) => {
    setCurrentDocument({
      url,
      title
    });
    setShowDocument(true);
  };

  const handleViewDocument = () => {
    fetchDocuments();
    if (documents) {
      viewDocument(
        documents.supportingDocument,
        `${documents.investorName}'s Verification Document`
      );
    }
  };

  if (loading && !showButton) {
    return <div className="text-center py-3">Loading documents...</div>;
  }

  if (error && !showButton) {
    return (
      <div className="text-center py-3 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <>
      {showButton ? (
        <button
          onClick={handleViewDocument}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          View Verification Document
        </button>
      ) : (
        documents && (
          <div className="mt-2">
            <button
              onClick={() => viewDocument(
                documents.supportingDocument,
                `${documents.investorName}'s Verification Document`
              )}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View Supporting Document
            </button>
          </div>
        )
      )}

      {/* Document Modal */}
      <DocumentViewerModal
        isOpen={showDocument}
        onClose={() => setShowDocument(false)}
        documentUrl={currentDocument.url}
        title={currentDocument.title}
      />
    </>
  );
};

InvestorDocumentViewer.propTypes = {
  investorId: PropTypes.string.isRequired,
  showButton: PropTypes.bool
};

export default InvestorDocumentViewer;