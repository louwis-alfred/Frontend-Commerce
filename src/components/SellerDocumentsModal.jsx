import { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import {
  AiOutlineClose,
  AiOutlineFilePdf,
  AiOutlineFileImage,
  AiOutlineFileText,
  AiOutlineDownload,
} from "react-icons/ai";
import axios from "axios";
import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";

const SellerDocumentsModal = ({ isOpen, onClose, campaign }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { backendUrl } = useContext(ShopContext);

  useEffect(() => {
    if (isOpen && campaign) {
      fetchDocuments();
    }
  }, [isOpen, campaign]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // First check if we already have documents from the campaign object
      const docs = [];

      // Check primary locations for documents
      if (campaign.supportingDocument) {
        docs.push({
          id: "main-doc",
          url: campaign.supportingDocument,
          name: `${campaign.title} - Main Document`,
          type: getDocumentType(campaign.supportingDocument),
        });
      }

      // Check seller application
      if (
        campaign.sellerApplication &&
        campaign.sellerApplication.supportingDocument
      ) {
        docs.push({
          id: "app-doc",
          url: campaign.sellerApplication.supportingDocument,
          name: `${campaign.title} - Application Document`,
          type: getDocumentType(campaign.sellerApplication.supportingDocument),
        });
      }

      // Additional documents array if present
      if (
        campaign.additionalDocuments &&
        Array.isArray(campaign.additionalDocuments)
      ) {
        campaign.additionalDocuments.forEach((doc, index) => {
          if (doc.url || typeof doc === "string") {
            docs.push({
              id: `add-doc-${index}`,
              url: doc.url || doc,
              name: doc.name || `Additional Document ${index + 1}`,
              type: getDocumentType(doc.url || doc),
            });
          }
        });
      }

      // If no documents found in campaign object, try fetching from API
      if (docs.length === 0) {
        const response = await axios.get(
          `${backendUrl}/api/campaign/${campaign._id}/documents`
        );
        if (response.data.documents) {
          response.data.documents.forEach((doc, index) => {
            docs.push({
              id: `api-doc-${index}`,
              url: doc.url,
              name: doc.name || `Document ${index + 1}`,
              type: getDocumentType(doc.url),
            });
          });
        }
      }

      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching seller documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentType = (url) => {
    if (!url) return "unknown";
    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.endsWith(".pdf")) return "pdf";
    if (lowercaseUrl.match(/\.(jpe?g|png|gif|bmp|webp)$/)) return "image";
    if (lowercaseUrl.match(/\.(docx?|xlsx?|pptx?|txt|csv)$/)) return "document";
    return "unknown";
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case "pdf":
        return <AiOutlineFilePdf className="w-8 h-8 text-red-500" />;
      case "image":
        return <AiOutlineFileImage className="w-8 h-8 text-blue-500" />;
      default:
        return <AiOutlineFileText className="w-8 h-8 text-gray-500" />;
    }
  };

  const openDocument = (url) => {
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="font-bold text-lg">
            {campaign?.title || "Campaign"} - Supporting Documents
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <AiOutlineClose className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-130px)]">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-green-500"></div>
            </div>
          ) : documents.length > 0 ? (
            <ul className="space-y-4">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                  onClick={() => openDocument(doc.url)}
                >
                  <div className="flex items-center">
                    {getDocumentIcon(doc.type)}
                    <div className="ml-3">
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        {doc.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDocument(doc.url);
                      }}
                      className="p-2 text-blue-600 hover:text-blue-800"
                      title="View"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <a
                      href={doc.url}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-green-600 hover:text-green-800"
                      title="Download"
                    >
                      <AiOutlineDownload className="w-5 h-5" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-2 text-gray-500">
                No supporting documents available for this campaign
              </p>
            </div>
          )}
        </div>

        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Add PropTypes validation
SellerDocumentsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  campaign: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    supportingDocument: PropTypes.string,
    sellerApplication: PropTypes.shape({
      supportingDocument: PropTypes.string
    }),
    additionalDocuments: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          url: PropTypes.string,
          name: PropTypes.string
        })
      ])
    )
  })
};


export default SellerDocumentsModal;
